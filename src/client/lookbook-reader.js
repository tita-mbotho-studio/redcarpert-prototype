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
        turn(paperDirection(event.clientX));
        return;
      }
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
    }, true);
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
  previous.addEventListener('click', () => turn(-1));
  next.addEventListener('click', () => turn(1));
  // PageFlip deliberately disables its default click-to-turn so that clicking
  // a photograph opens zoom. Restore magazine-style navigation on blank paper
  // without stealing clicks from the photograph or dress detail links.
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
    turn(paperDirection(event.clientX));
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
    if (pointerStart?.id === event.pointerId) {
      if (Math.hypot(event.clientX - pointerStart.x,
        event.clientY - pointerStart.y) > 12) {
        suppressZoomUntil = Date.now() + 450;
      }
      pointerStart = null;
    }
  }, true);
  book.addEventListener('pointercancel', () => { pointerStart = null; }, true);
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
  for (const img of book.querySelectorAll('img')) {
    img.addEventListener('error', () => {
      img.classList.add('redcarpert-image-unavailable');
      img.closest('.redcarpert-book-photo,.redcarpert-book-cover-photo')?.classList.add('redcarpert-photo-failed');
    });
  }
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
      // Clicking the photograph opens its lightbox; swipe/drag and arrows turn pages.
      disableFlipByClick: true,
      autoSize: true,
    });
    // StPageFlip requires complete physical spreads when showCover is true.
    // An editorial book with an odd leaf count needs a decorative
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
      // StPageFlip may report the unnumbered final endpaper as page 30.
      // Keep the public reader, controls and announcements within numbered leaves.
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
