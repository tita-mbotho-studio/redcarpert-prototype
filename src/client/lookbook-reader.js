import { lookbookEntries } from './lookbook.js';
import { initializeLookbookZoom } from './lookbook-zoom.js';

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
  let index = 0, engine = null;
  // The photo controller consults the live engine but never replaces
  // StPageFlip's native click, drag, touch/swipe or page navigation handlers.
  initializeLookbookZoom(viewer, book, () => engine);
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
  viewer.addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    if (viewer.querySelector('[data-book-zoom-dialog]')?.open) return;
    if (event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    event.preventDefault();
    turn(event.key === 'ArrowRight' ? 1 : -1);
  });
  let touchX = null;
  book.addEventListener('touchstart', event => {
    if (!engine && event.touches.length === 1) touchX = event.touches[0].clientX;
  }, {passive: true});
  book.addEventListener('touchend', event => {
    if (engine || touchX == null || !event.changedTouches.length) return;
    const delta = event.changedTouches[0].clientX - touchX;
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
      // Keep the counter within the current book's numbered pages.
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
