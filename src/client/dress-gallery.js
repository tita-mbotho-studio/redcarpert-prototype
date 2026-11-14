/**
 * Responsive dress photography controller. Never creates images or claims
 * additional dress angles unless the product's gallery data supplies them.
 */
export function initializeDressGalleries() {
  for (const gallery of document.querySelectorAll('[data-detail-gallery]')) {
    if (gallery.dataset.galleryReady === 'true') continue;
    gallery.dataset.galleryReady = 'true';
    let photos;
    try {
      photos = JSON.parse(gallery.getAttribute('data-gallery-photos') || '[]');
    } catch {
      console.error('Invalid dress photo gallery metadata');
      continue;
    }
    if (!Array.isArray(photos) || photos.length <= 1) continue;

    const image = gallery.querySelector('[data-gallery-active-image]');
    const enlarge = gallery.querySelector('[data-gallery-enlarge]');
    const previous = gallery.querySelector('[data-gallery-previous]');
    const next = gallery.querySelector('[data-gallery-next]');
    const counter = gallery.querySelector('[data-gallery-counter]');
    const dots = [...gallery.querySelectorAll('[data-gallery-index]')];
    const picture = gallery.querySelector('[data-sample-frame]');
    if (!image || !enlarge || !previous || !next || !counter || !picture || dots.length !== photos.length) {
      console.error('Incomplete dress photo gallery controls');
      continue;
    }

    let currentIndex = 0;
    const render = (requestedIndex) => {
      currentIndex = (requestedIndex + photos.length) % photos.length;
      const photo = photos[currentIndex];
      image.src = photo.url;
      image.alt = photo.alt;
      enlarge.href = photo.url;
      enlarge.setAttribute('aria-label', 'Enlarge dress photograph ' + (currentIndex + 1) + ' of ' + photos.length);
      counter.textContent = String(currentIndex + 1).padStart(2, '0') + ' / ' + String(photos.length).padStart(2, '0');
      gallery.dataset.activePhoto = String(currentIndex);
      dots.forEach((dot, index) => {
        const active = index === currentIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-pressed', String(active));
      });
    };
    previous.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      render(currentIndex - 1);
    });
    next.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      render(currentIndex + 1);
    });
    dots.forEach((dot, index) => dot.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      render(index);
    }));
    gallery.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      event.preventDefault();
      event.stopPropagation();
      render(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
    });
    // Horizontal finger swipes should not interfere with ordinary vertical page scrolling.
    let startPoint = null;
    picture.addEventListener('touchstart', (event) => {
      if (event.touches.length === 1) startPoint = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }, { passive: true });
    picture.addEventListener('touchend', (event) => {
      if (!startPoint || !event.changedTouches.length) return;
      const deltaX = event.changedTouches[0].clientX - startPoint.x;
      const deltaY = event.changedTouches[0].clientY - startPoint.y;
      startPoint = null;
      if (Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
        render(currentIndex + (deltaX < 0 ? 1 : -1));
      }
    }, { passive: true });
    picture.addEventListener('touchcancel', () => { startPoint = null; }, { passive: true });
    render(0);
  }
}
