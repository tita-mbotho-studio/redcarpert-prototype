import { mediaDeliveryUrl } from '../lib/media-delivery.ts';

/**
 * One fallback for optimized images across catalogue, lookbook, details,
 * Wedding Moments, and future page images. Delegated error capture also
 * handles media added after Load More or a gallery page turn.
 */
export function initializeMediaDelivery() {
  document.addEventListener('error', event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    const original = img.dataset.mediaOriginal ||
      img.dataset.weddingOriginalThumbnail;
    if (!original) return;
    // Remove the marker before retrying so a missing original cannot loop.
    img.removeAttribute('data-media-original');
    img.removeAttribute('data-wedding-original-thumbnail');
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    if (img.getAttribute('src') !== original) img.src = original;
  }, true);
}

/** For all interactive image galleries: original is kept for fallback/zoom. */
export function setMediaImage(image, original, preset) {
  const delivery = mediaDeliveryUrl(original, preset);
  if (delivery !== original) image.dataset.mediaOriginal = original;
  else image.removeAttribute('data-media-original');
  image.src = delivery;
}
