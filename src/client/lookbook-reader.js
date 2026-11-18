import { lookbookEntries } from './lookbook.js';
import { initializeImageZoom } from './image-zoom.js';
import { isInsideContainedPhoto, paperTurnDirection } from './lookbook-click-regions.js';

const PAGE_FLIP_CDN = 'https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.min.js';

/** Load optional animation, retaining an accessible working book when CDN is unavailable. */
function loadPageFlip() {
  if (window.St?.PageFlip) return Promise.resolve(window.St.PageFlip);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PAGE_FLIP_CDN;
    script.async = true;
    let settled = false;
    const complete = (error, PageFlip) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(deadline);
      if (error) {
        script.remove();
        reject(error);
      } else resolve(PageFlip);
    };
    // A stalled CDN request must not prevent the built-in reader from working.
    const deadline = window.setTimeout(() => complete(new Error('PageFlip CDN timed out')), 8500);
    script.addEventListener('load', () => window.St?.PageFlip
      ? complete(null, window.St.PageFlip) : complete(new Error('PageFlip unavailable')));
    script.addEventListener('error', () => complete(new Error('PageFlip network unavailable')));
    document.head.append(script);
  });
}

export function initializeLookbookReader() {
  const book = document.querySelector('#redcarpert-flipbook');
  if (!book) return;
  const viewer = book.closest('.redcarpert-lookbook');
  const pages = [...book.querySelectorAll('[data-book-page]')];
  if (pages.length !== lookbookEntries.length + 2) throw new Error('Lookbook does not match catalogue');

  // The interactive reader must use the same central sale/rental records as
  // the generated HTML and PDF. Never restore legacy illustrative price ranges.
  for (const [attribute, field] of [
    ['data-book-sale-price', 'salePriceDisplay'],
    ['data-book-rental-price', 'rentalPriceDisplay'],
  ]) {
    const prices = new Map([...book.querySelectorAll('[' + attribute + ']')]
      .map(element => [element.getAttribute(attribute), element]));
    for (const entry of lookbookEntries) {
      const element = prices.get(entry.id);
      if (!element) {
        console.warn('Lookbook ' + attribute + ' missing for ' + entry.id);
        continue;
      }
      if (element.textContent !== entry[field]) element.textContent = entry[field];
    }
  }
  const saleLabels = new Map([...book.querySelectorAll('[data-book-sale-label]')]
    .map(element => [element.dataset.bookSaleLabel, element]));
  for (const entry of lookbookEntries) {
    const label = saleLabels.get(entry.id);
    if (label && label.textContent !== entry.salePriceLabel) {
      label.textContent = entry.salePriceLabel;
    }
  }
  const previous = viewer.querySelector('[data-book-previous]');
  const next = viewer.querySelector('[data-book-next]');
  const status = viewer.querySelector('[data-book-status]');
  const dialog = viewer.querySelector('#redcarpert-book-photo-dialog');
  const zoom = initializeImageZoom(dialog);
  const enlarged = dialog?.querySelector('[data-image-zoom-photo]');
  const closePhoto = dialog?.querySelector('[data-book-image-close]');
  let photoOpener = null;
  let suppressZoomUntil = 0;
  let pointerDismissed = false;
  let openBookPhoto = null;
  const paperDirection = x => paperTurnDirection(book.getBoundingClientRect(), x);
  if (zoom && enlarged && closePhoto) {
    // A photo opens over the book; the underlying page index is untouched.
    // Capture the click before the optional page-flip engine handles it.
    book.addEventListener('click', event => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest('[data-book-image-zoom]');
      if (!trigger || !book.contains(trigger)) return;
      event.preventDefault();
      event.stopPropagation();
      // StPageFlip and the fallback both support swiping on photographs.
      // A synthetic click after a swipe must never unexpectedly open zoom.
      if (Date.now() < suppressZoomUntil) return;
      // The full-width <img> element has object-fit: contain. Its side gutters
      // are blank book paper, not photograph: they turn the page instead.
      const image = trigger.querySelector('img');
      if (event.detail !== 0 && image instanceof HTMLImageElement &&
          !isInsideContainedPhoto(image.getBoundingClientRect(),
            image.naturalWidth, image.naturalHeight, event.clientX, event.clientY)) {
        // Letterbox gutters are paper even when the image button fills them.
        // PageFlip's native click action is disabled to prevent double turns.
        turnPaper(paperDirection(event.clientX));
        return;
      }
      openBookPhoto(trigger);
    }, true);
    // A single photo opener is used by native mouse/keyboard clicks and the
    // stationary touch handler. Never dispatch synthetic click events.
    openBookPhoto = trigger => {
      if (dialog.open) return;
      const original = trigger.dataset.bookZoomOriginal;
      const preview = trigger.dataset.bookZoomPreview || original;
      if (!original || !preview) return;
      trigger.classList.remove('redcarpert-book-pointer-return');
      photoOpener = trigger;
      enlarged.alt = trigger.querySelector('img')?.alt || 'Wedding dress photograph';
      if (preview !== original) enlarged.dataset.mediaOriginal = original;
      else enlarged.removeAttribute('data-media-original');
      enlarged.src = preview;
      zoom.setActive(true);
      dialog.showModal();
      // Responsive stage dimensions are available only after showModal().
      zoom.refresh();
    };
    closePhoto.addEventListener('click', event => {
      pointerDismissed = event.detail > 0;
      // Maintain logical focus return without showing a photo-sized brown
      // focus outline after a pointer click on X.
      if (pointerDismissed) photoOpener?.classList.add('redcarpert-book-pointer-return');
      dialog.close();
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      pointerDismissed = true;
      photoOpener?.classList.add('redcarpert-book-pointer-return');
      dialog.close();
    });
    dialog.addEventListener('close', () => {
      zoom.setActive(false);
      enlarged.removeAttribute('src');
      enlarged.removeAttribute('data-media-original');
      enlarged.alt = '';
      if (photoOpener?.isConnected) {
        if (!pointerDismissed) photoOpener.classList.remove('redcarpert-book-pointer-return');
        photoOpener.focus({ preventScroll: true });
      }
      photoOpener = null;
      pointerDismissed = false;
    });
    // Restore the normal visible focus indication as soon as keyboard
    // navigation begins; only pointer-driven dialog dismissal hides it.
    book.addEventListener('keydown', event => {
      event.target?.closest?.('[data-book-image-zoom].redcarpert-book-pointer-return')
        ?.classList.remove('redcarpert-book-pointer-return');
    }, true);
    book.addEventListener('focusout', event => {
      event.target?.closest?.('[data-book-image-zoom].redcarpert-book-pointer-return')
        ?.classList.remove('redcarpert-book-pointer-return');
    }, true);
    // The interactive image element has blank object-fit gutters; show a
    // page-turn cursor there and a zoom cursor only on painted photo pixels.
    book.addEventListener('pointermove', event => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest('[data-book-image-zoom]');
      if (!trigger) return;
      const image = trigger.querySelector('img');
      if (!(image instanceof HTMLImageElement)) return;
      const overPhoto = isInsideContainedPhoto(image.getBoundingClientRect(),
        image.naturalWidth, image.naturalHeight, event.clientX, event.clientY);
      trigger.style.cursor = overPhoto ? 'zoom-in' : 'pointer';
    }, { passive: true });
  }
  let index = 0, engine = null;
  const announce = () => {
    status.textContent = 'Page ' + (index + 1) + ' of ' + pages.length;
    previous.disabled = index <= 0;
    next.disabled = index >= pages.length - 1;
    book.dataset.currentPage = String(index + 1);
  };
  // StPageFlip advances by spread on desktop, not by individual leaf.
  // engine.flip(index +/- 1) can target the already-visible spread and stall.
  const turn = (direction) => {
    if (engine) {
      if (direction > 0) engine.flipNext();
      else engine.flipPrev();
      return;
    }
    index = Math.max(0, Math.min(pages.length - 1, index + direction));
    pages.forEach((node, i) => node.classList.toggle('is-current', i === index));
    announce();
  };
  // PageFlip can forward a single physical click through a cloned leaf AND
  // its wrapper. Prevent two paper-click callbacks from flipping two spreads.
  // This guard applies only to paper clicks/taps, never to arrow controls.
  let lastPaperTurnAt = 0;
  const turnPaper = direction => {
    const now = Date.now();
    if (engine && now - lastPaperTurnAt < 650) return;
    lastPaperTurnAt = now;
    turn(direction);
  };
  previous.addEventListener('click', () => turn(-1));
  next.addEventListener('click', () => turn(1));
  // Chromium may swallow the first compatibility click after a horizontal
  // touch swipe. Handle the completed tap directly on these two controls.
  // preventDefault suppresses the subsequent synthetic click, so one tap
  // changes exactly one page. Mouse and keyboard keep their native clicks.
  for (const [button, direction] of [[previous, -1], [next, 1]]) {
    button.addEventListener('touchend', event => {
      if (!event.cancelable) return;
      event.preventDefault();
      turn(direction);
    }, { passive: false });
  }
  // PageFlip owns 3D animation/swipes, while this single delegated click
  // handler owns a stationary paper click on both enhanced and fallback
  // readers. Disabling the vendor's click-to-turn avoids double turns.
  book.addEventListener('click', event => {
    if (!(event.target instanceof Element) || dialog?.open ||
        Date.now() < suppressZoomUntil || event.detail === 0) return;
    if (event.target.closest('[data-book-image-zoom],a,button,input,textarea,select,label,[contenteditable="true"]')) return;
    // A page's words are for reading/selecting, not page-turning. Its empty
    // margins and image surround are the page-turn zones.
    if (event.target.closest('h1,h2,h3,h4,h5,h6,p,small,span,output')) return;
    // This listener belongs to the book itself, so any non-interactive
    // background inside it is paper, including PageFlip's wrapper layers.
    if (window.getSelection()?.toString()) return;
    event.preventDefault();
    event.stopPropagation();
    turnPaper(paperDirection(event.clientX));
  }, true);
  viewer.addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    if (event.target.closest('dialog[open],input,textarea,select,[contenteditable="true"]')) return;
    event.preventDefault();
    turn(event.key === 'ArrowRight' ? 1 : -1);
  });
  // A drag/swipe must not generate a follow-up click that accidentally
  // turns the next page or opens the enlarged photograph.
  let pointerStart = null;
  book.addEventListener('pointerdown', event => {
    if (event.isPrimary) pointerStart = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
    };
  }, true);
  book.addEventListener('pointerup', event => {
    if (pointerStart?.id !== event.pointerId) return;
    const start = pointerStart;
    pointerStart = null;
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (moved > 12) {
      suppressZoomUntil = Date.now() + 450;
      return;
    }
    // Touch taps are handled at touchend, before PageFlip's vendor listener.
    // Mouse photo clicks keep the original guard against accidental turns.
    // PageFlip's click-to-turn is disabled. Mouse clicks are handled by
    // the book's single delegated click listener; touch taps are handled
    // by the single touchend listener. No vendor internals need patching.
  }, true);
  book.addEventListener('pointercancel', () => { pointerStart = null; }, true);

  // StPageFlip's own tap handling is inconsistent on coarse-pointer viewports:
  // a finger tap on blank paper sometimes does nothing, although swiping
  // works. Capture only stationary SINGLE-finger taps before its touchend.
  // Swipes, drags, multitouch and vertical scrolling remain with the browser
  // and PageFlip. This does not replace the 3D engine or its animations.
  let enhancedTouch = null;
  book.addEventListener('touchstart', event => {
    if (!engine || event.touches.length !== 1) {
      enhancedTouch = null;
      return;
    }
    enhancedTouch = {x:event.touches[0].clientX,
      y:event.touches[0].clientY,moved:false};
  }, {capture:true,passive:true});
  book.addEventListener('touchmove', event => {
    if (!enhancedTouch || event.touches.length !== 1) {
      enhancedTouch = null;
      return;
    }
    if (Math.hypot(event.touches[0].clientX - enhancedTouch.x,
      event.touches[0].clientY - enhancedTouch.y) > 12) enhancedTouch.moved = true;
  }, {capture:true,passive:true});
  book.addEventListener('touchend', event => {
    const start=enhancedTouch;
    enhancedTouch=null;
    if (!engine || !start || start.moved || event.changedTouches.length !== 1 ||
        dialog?.open) return;
    const touch=event.changedTouches[0];
    if (Math.hypot(touch.clientX-start.x,touch.clientY-start.y)>12) return;
    if (!(event.target instanceof Element) || window.getSelection()?.toString()) return;
    const target=event.target;
    const trigger=target.closest('[data-book-image-zoom]');
    const img=trigger?.querySelector('img');
    const photo=trigger && img instanceof HTMLImageElement &&
      isInsideContainedPhoto(img.getBoundingClientRect(),
        img.naturalWidth,img.naturalHeight,touch.clientX,touch.clientY);
    // Links and ordinary controls retain their native activation.
    if (!trigger && target.closest('a,button,input,textarea,select,label,[contenteditable="true"]')) return;
    if (!photo && !trigger &&
        target.closest('h1,h2,h3,h4,h5,h6,p,small,span,output')) return;
    // Reject the vendor's second interpretation of this same stationary tap.
    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
    suppressZoomUntil=Date.now()+80;
    if (photo && openBookPhoto) openBookPhoto(trigger);
    else turnPaper(paperDirection(touch.clientX));
  }, {capture:true,passive:false});
  book.addEventListener('touchcancel',()=>{enhancedTouch=null;},{capture:true,passive:true});
  let touchX = null, zoomTouchX = null;
  book.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    zoomTouchX = event.touches[0].clientX;
    if (!engine) touchX = zoomTouchX;
  }, {passive: true});
  book.addEventListener('touchend', event => {
    if (!event.changedTouches.length) return;
    const endX = event.changedTouches[0].clientX;
    if (zoomTouchX != null && Math.abs(endX - zoomTouchX) > 35) {
      suppressZoomUntil = Date.now() + 450;
    }
    zoomTouchX = null;
    if (engine || touchX == null) return;
    const delta = endX - touchX;
    if (Math.abs(delta) > 45) turn(delta < 0 ? 1 : -1);
    touchX = null;
  }, {passive: true});
  // Capturing errors on the book root also handles recreated fallback leaves.
  book.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    image.classList.add('redcarpert-image-unavailable');
    image.closest('.redcarpert-book-photo,.redcarpert-book-cover-photo')
      ?.classList.add('redcarpert-photo-failed');
  }, true);

  book.dataset.engine = 'fallback';
  announce();
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  loadPageFlip().then(PageFlip => {
    book.classList.add('is-enhanced');
    const pageFlip = new PageFlip(book, {
      width: 420, height: 588, size: 'stretch', minWidth: 240, maxWidth: 520,
      minHeight: 336, maxHeight: 728, showCover: true, usePortrait: true,
      drawShadow: true, maxShadowOpacity: .27, flippingTime: 780,
      mobileScrollSupport: false, clickEventForward: true, swipeDistance: 35,
      disableFlipByClick: true, autoSize: true, startPage: index,
    });
    // StPageFlip requires complete physical spreads when showCover is true.
    // An odd number of numbered leaves requires a decorative
    // empty endpaper so the final numbered back cover is reachable.
    // This is not a catalogue page, is not counted in book navigation, and
    // does not appear in the static/no-JS fallback.
    const flipPages = [...pages];
    if (flipPages.length % 2 !== 0) {
      const endpaper = document.createElement('article');
      endpaper.className = 'redcarpert-book-page redcarpert-book-endpaper';
      endpaper.setAttribute('aria-hidden','true');
      endpaper.setAttribute('role','presentation');
      book.append(endpaper);
      flipPages.push(endpaper);
    }
    pageFlip.loadFromHTML(flipPages);
    engine = pageFlip;
    pageFlip.on('flip', event => {
      // Never expose the unnumbered endpaper in navigation or the counter.
      index = Math.min(event.data, pages.length - 1);
      announce();
    });
    book.dataset.engine = 'page-flip';
    announce();
  }).catch(() => {
    book.classList.remove('is-enhanced');
    book.dataset.engine = 'fallback';
    pages.forEach((page, i) => page.classList.toggle('is-current', i === index));
    announce();
  });
}
