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

  // CSS background images have no native error event. Verify the delivered
  // version only when its homepage panel is near the viewport; retry the
  // original URL on failure without touching the approved crop/blur styling.
  const panels = document.querySelectorAll('[data-media-background-src][data-media-background-original]');
  const verifyBackground = panel => {
    const optimized = panel.dataset.mediaBackgroundSrc;
    const original = panel.dataset.mediaBackgroundOriginal;
    if (!optimized || !original || optimized === original) return;
    const probe = new Image();
    probe.onerror = () => {
      panel.style.backgroundImage = 'url("' + original + '")';
      panel.style.setProperty('--redcarpert-home-photo','url("' + original + '")');
    };
    probe.src = optimized;
  };
  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        verifyBackground(entry.target);
      }
    }, { rootMargin: '250px 0px' });
    panels.forEach(panel => observer.observe(panel));
  } else {
    panels.forEach(verifyBackground);
  }
}

/** For all interactive image galleries: original is kept for fallback/zoom. */
export function setMediaImage(image, original, preset) {
  const delivery = mediaDeliveryUrl(original, preset);
  if (delivery !== original) image.dataset.mediaOriginal = original;
  else image.removeAttribute('data-media-original');
  image.src = delivery;
}
