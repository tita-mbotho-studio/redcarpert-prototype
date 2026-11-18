/**
 * Lookbook-only image interaction. The image is the hit target: a stationary
 * tap opens the same native viewer as Wedding Moments. Dragging, swiping and
 * blank-paper clicks stay owned by StPageFlip.
 */

/** Object-fit: contain can leave empty gutters inside an <img> element.
 * Determine the *painted* pixels, not the larger CSS element rectangle. */
export function getRenderedPhotoBounds(image) {
  if (!image?.naturalWidth || !image?.naturalHeight) return null;
  const rect = image.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const scale = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const left = rect.left + (rect.width - width) / 2;
  const top = rect.top + (rect.height - height) / 2;
  return {left, top, right: left + width, bottom: top + height, width, height};
}

export function pointIsOnPhoto(image, x, y) {
  const rect = getRenderedPhotoBounds(image);
  return rect !== null && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export function initializeLookbookZoom(viewer, book, getPageFlip) {
  const dialog = viewer?.querySelector('[data-book-zoom-dialog]');
  const fullPhoto = dialog?.querySelector('[data-book-zoom-image]');
  const close = dialog?.querySelector('[data-book-zoom-close]');
  if (!dialog || !fullPhoto || !close || !book?.querySelector('[data-book-zoom-photo]') ||
      viewer.dataset.bookZoomReady === 'true') return;
  viewer.dataset.bookZoomReady = 'true';

  // The browser can clone a page when StPageFlip enters portrait mode.
  // Delegation, rather than per-image listeners, works for real and cloned pages.
  const imageFrom = target => target instanceof Element
    ? target.closest('img[data-book-zoom-photo]') : null;
  const usableImage = image => image && book.contains(image) &&
    !image.closest('.redcarpert-photo-failed');
  const gestures = new Map();
  let opener = null;
  let original = '';
  let triedOriginal = false;

  const readyToOpen = () => {
    const state = getPageFlip()?.getState();
    return !dialog.open && state !== 'flipping' && state !== 'user_fold';
  };

  const openPhoto = image => {
    if (!usableImage(image) || !readyToOpen()) return;
    opener = image;
    original = image.dataset.bookZoomOriginal || image.getAttribute('data-media-original') || image.currentSrc;
    triedOriginal = false;
    fullPhoto.alt = image.alt || 'Wedding dress photograph';
    fullPhoto.src = image.dataset.bookZoomSrc || original;
    dialog.showModal();
    close.focus({preventScroll:true});
  };

  fullPhoto.addEventListener('error', () => {
    if (!triedOriginal && original && fullPhoto.src !== original) {
      triedOriginal = true;
      fullPhoto.src = original;
    }
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    fullPhoto.removeAttribute('src');
    fullPhoto.alt = '';
    if (opener?.isConnected) opener.focus({preventScroll:true});
    opener = null;
    original = '';
    triedOriginal = false;
  });
  dialog.addEventListener('keydown', event => event.stopPropagation());

  // Let StPageFlip receive its *native* mousedown/touchstart/moves/end for
  // drag and swipe. We only suppress its final click-to-turn on a near-motionless
  // tap, before the library's window mouseup/touchend listener can turn a page.
  const maxTapMovement = 4.5; // StPageFlip starts folding above 5 px.
  const maxTapDuration = 900;

  window.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.isPrimary === false) return;
    const image = imageFrom(event.target);
    if (!usableImage(image) || !readyToOpen() ||
        !pointIsOnPhoto(image, event.clientX, event.clientY)) return;
    gestures.set(event.pointerId, {
      image, x: event.clientX, y: event.clientY,
      maxTravel: 0, time: performance.now(),
    });
  }, true);

  window.addEventListener('pointermove', event => {
    const gesture = gestures.get(event.pointerId);
    if (!gesture) return;
    gesture.maxTravel = Math.max(gesture.maxTravel,
      Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y));
  }, true);

  window.addEventListener('pointerup', event => {
    const gesture = gestures.get(event.pointerId);
    if (!gesture) return;
    gestures.delete(event.pointerId);
    const {image} = gesture;
    const distance = Math.max(gesture.maxTravel,
      Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y));
    if (distance > maxTapMovement || performance.now() - gesture.time > maxTapDuration ||
        !readyToOpen() || !usableImage(image) ||
        !pointIsOnPhoto(image, event.clientX, event.clientY)) return;

    // StPageFlip's mouseup/touchend handlers run on window in the bubble phase.
    // userStop(..., true) resets the pending *tap* without flipping. Moving
    // gestures are never touched, so native swipe and folding remain intact.
    getPageFlip()?.userStop({x:0, y:0}, true);
    openPhoto(image);
  }, true);
  window.addEventListener('pointercancel', event => gestures.delete(event.pointerId), true);

  // Accessible keyboard operation, independent from PageFlip's arrow navigation.
  book.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const image = imageFrom(event.target);
    if (!usableImage(image) || !readyToOpen()) return;
    event.preventDefault();
    openPhoto(image);
  });
  // Assistive technology may activate a role=button image through a click with
  // detail=0 rather than a physical pointer. Pointer clicks are handled above.
  book.addEventListener('click', event => {
    if (event.detail !== 0) return;
    const image = imageFrom(event.target);
    if (usableImage(image)) openPhoto(image);
  });
}
