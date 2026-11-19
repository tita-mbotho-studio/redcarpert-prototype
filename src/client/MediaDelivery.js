import { mediaDeliveryUrl } from '../lib/media-delivery.ts';

/**
 * One fallback for optimized images across catalogue, lookbook, details,
 * Wedding Moments, and future page images. Delegated error capture also
 * handles media added after Load More or a gallery page turn.
 */
export function initializeMediaDelivery() {
  const restoreImage = img => {
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
  };
  document.addEventListener('error', event => restoreImage(event.target), true);
  // Handle cached failures that happened before this JS module initialized;
  // never wake below-the-fold lazy images just to check their state.
  document.querySelectorAll('img[data-media-original],img[data-wedding-original-thumbnail]')
    .forEach(img => {
      if (img.loading !== 'lazy' && img.complete && img.naturalWidth === 0)
        restoreImage(img);
    });

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
  const videoPosters = document.querySelectorAll('video[data-media-poster-original]');
  const verifyPoster = video => {
    const original = video.dataset.mediaPosterOriginal;
    const delivered = video.getAttribute('poster');
    if (!original || !delivered || original === delivered) return;
    const probe = new Image();
    probe.onerror = () => { video.poster = original; };
    probe.src = delivered;
  };
  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (entry.target.matches('video')) verifyPoster(entry.target);
        else verifyBackground(entry.target);
      }
    }, { rootMargin: '250px 0px' });
    panels.forEach(panel => observer.observe(panel));
    videoPosters.forEach(video => observer.observe(video));
  } else {
    panels.forEach(verifyBackground);
    videoPosters.forEach(verifyPoster);
  }
}

/** Browser-decoded gallery photos are shared between neighbouring preloads and navigation.
 * The ImageKit URL (including updatedAt when present) is the cache key, so a
 * newer client upload uses a new entry automatically. No service worker or
 * second copy of the photograph is needed. */
const galleryPreloads = new Map();
const MAX_PRELOADED_GALLERY_IMAGES = 12;

export function preloadMediaImage(original, preset = 'detail') {
  const transformed = mediaDeliveryUrl(original, preset);
  const key = preset + '|' + original;
  const existing = galleryPreloads.get(key);
  if (existing) return existing;

  const attempt = src => new Promise((resolve, reject) => {
    const probe = new Image();
    probe.decoding = 'async';
    // Never change the visible photograph until this candidate is loaded.
    probe.onload = async () => {
      try {
        if (typeof probe.decode === 'function') await probe.decode();
        if (!probe.naturalWidth) throw new Error('Empty decoded photograph');
        resolve(src);
      } catch (error) {
        reject(error);
      }
    };
    probe.onerror = () => reject(new Error('Gallery photograph failed to load'));
    probe.src = src;
  });

  // A failed ImageKit derivative gets one attempt at the approved original;
  // never cache a rejected promise or show a mismatched placeholder photo.
  const prepared = attempt(transformed).catch(error =>
    transformed !== original ? attempt(original) : Promise.reject(error));
  galleryPreloads.set(key, prepared);
  prepared.catch(() => {
    if (galleryPreloads.get(key) === prepared) galleryPreloads.delete(key);
  });
  if (galleryPreloads.size > MAX_PRELOADED_GALLERY_IMAGES) {
    // Browsers own decoded image memory; this bounds our promise bookkeeping.
    const oldestKey = galleryPreloads.keys().next().value;
    if (oldestKey !== undefined && oldestKey !== key) galleryPreloads.delete(oldestKey);
  }
  return prepared;
}

/** For all interactive image galleries: original is kept for fallback/zoom. */
export function setMediaImage(image, original, preset, readyUrl) {
  const optimized = mediaDeliveryUrl(original, preset);
  // Accept only the approved original or its context-specific derivative.
  const delivery = readyUrl === original || readyUrl === optimized ? readyUrl : optimized;
  if (delivery !== original) image.dataset.mediaOriginal = original;
  else image.removeAttribute('data-media-original');
  image.removeAttribute('srcset');
  image.removeAttribute('sizes');
  image.src = delivery;
}
