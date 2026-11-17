import { initializeImageZoom } from './image-zoom.js';

/**
 * Wedding Moments gallery: one mixed photo/film stream.
 * The first 16 cards are server-rendered. Later cards remain inert in a
 * <template> and are inserted only when someone selects Load More.
 */
export function initializeWeddingMomentsGallery() {
  const grid = document.querySelector('[data-wedding-moments-grid]');
  if (!grid) return;

  // A delegated site-wide image error listener handles all thumbnail fallbacks,
  // including cards appended by Load More.
  const template = document.querySelector('template[data-wedding-moments-remaining]');
  const loadMore = document.querySelector('[data-wedding-load-more]');
  const batchSize = 16;
  const count = document.querySelector('[data-wedding-count]');
  const total = Number(count?.getAttribute('data-wedding-total'));
  const updateCount = () => {
    if (count && Number.isSafeInteger(total) && total >= 0) {
      count.textContent = 'Showing ' + grid.children.length + ' of ' + total + ' wedding moments';
    }
  };

  if (template instanceof HTMLTemplateElement && loadMore instanceof HTMLButtonElement) {
    loadMore.addEventListener('click', () => {
      const next = [...template.content.children].slice(0, batchSize);
      if (!next.length) return;
      const fragment = document.createDocumentFragment();
      fragment.append(...next);
      grid.append(fragment);
      updateCount();
      if (!template.content.firstElementChild) {
        const controls = loadMore.closest('.redcarpert-moments-more');
        if (controls) controls.hidden = true;
      }
    });
  }

  const dialog = document.querySelector('#redcarpert-wedding-preview');
  if (!(dialog instanceof HTMLDialogElement)) return;
  const photo = dialog.querySelector('[data-wedding-preview-photo]');
  const video = dialog.querySelector('[data-wedding-preview-video]');
  const close = dialog.querySelector('[data-wedding-preview-close]');
  const stage = dialog.querySelector('[data-image-zoom-stage]');
  const zoom = initializeImageZoom(dialog);
  if (!(photo instanceof HTMLImageElement) || !(video instanceof HTMLVideoElement) ||
      !close || !stage || !zoom) return;

  let opener = null;
  grid.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button[data-wedding-media][data-wedding-src]');
    if (!button || !grid.contains(button)) return;
    const url = button.dataset.weddingSrc;
    const type = button.dataset.weddingMedia;
    if (!url || (type !== 'photo' && type !== 'video')) return;

    opener = button;
    photo.hidden = type !== 'photo';
    stage.hidden = type !== 'photo';
    video.hidden = type !== 'video';
    // Video retains its original native controls, sound and autoplay.
    zoom.setActive(type === 'photo');
    if (type === 'photo') {
      // Display a screen-sized full photograph without downloading the massive
      // original. Fall back once if ImageKit cannot deliver the derivative.
      const preview = button.dataset.weddingPreviewSrc || url;
      if (preview !== url) photo.dataset.mediaOriginal = url;
      else photo.removeAttribute('data-media-original');
      photo.src = preview;
      photo.alt = button.querySelector('img')?.alt ||
        button.getAttribute('aria-label') || 'Wedding photograph';
    } else {
      video.muted = false;
      video.src = url;
    }
    dialog.showModal();
    if (type === 'video') {
      // Start from the thumbnail click while user activation is still available.
      // Some browsers may still block playback with sound; native controls remain.
      const playback = video.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(() => {});
      }
    }
  });

  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    photo.removeAttribute('data-media-original');
    photo.removeAttribute('src');
    photo.alt = '';
    photo.hidden = true;
    stage.hidden = true;
    video.hidden = true;
    zoom.setActive(false);
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
}
