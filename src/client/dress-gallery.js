import { setMediaImage } from './MediaDelivery.js';

/**
 * Dress Details: one active photograph, optional multi-photo navigation, and
 * the approved Wedding Moments-style image modal. No hover zoom or Fancybox.
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
    if (!Array.isArray(photos) || photos.length < 1 ||
        photos.some(photo => !photo || typeof photo.url !== 'string' || typeof photo.alt !== 'string')) {
      console.error('Incomplete dress photo gallery metadata');
      continue;
    }

    const image = gallery.querySelector('[data-gallery-active-image]');
    const frame = gallery.querySelector('[data-dress-frame]');
    const dialog = document.querySelector('[data-dress-photo-dialog]');
    const preview = dialog?.querySelector('[data-dress-preview-photo]');
    const close = dialog?.querySelector('[data-dress-preview-close]');
    if (!image || !frame || !dialog || !preview || !close) {
      console.error('Incomplete dress photo modal controls');
      continue;
    }

    let currentIndex = 0;
    let opener = null;
    let pointerOpened = false;
    let suppressClickUntil = 0;
    let pointerStart = null;

    const currentPhoto = () => photos[currentIndex];
    const setActive = requestedIndex => {
      currentIndex = (requestedIndex + photos.length) % photos.length;
      const photo = currentPhoto();
      setMediaImage(image, photo.url, 'detail');
      image.alt = photo.alt;
      image.setAttribute('aria-label', 'Enlarge photograph ' + (currentIndex + 1) + ' of ' + photos.length);
      gallery.dataset.activePhoto = String(currentIndex);
    };

    const openModal = (viaPointer = false) => {
      if (dialog.open) return;
      const photo = currentPhoto();
      opener = image;
      pointerOpened = viaPointer;
      dialog.classList.toggle('redcarpert-dress-pointer-opened', viaPointer);
      preview.alt = photo.alt;
      // Reuse the shared on-demand high-resolution delivery, with central
      // original-URL fallback if a CDN derivative cannot be loaded.
      setMediaImage(preview, photo.url, 'preview');
      dialog.showModal();
      close.focus({preventScroll:true});
    };

    // The photo, not the ivory margins or gallery frame, activates the viewer.
    image.addEventListener('click', event => {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        return;
      }
      openModal(event.detail !== 0);
    });
    image.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      openModal();
    });

    // A drag or swipe must not produce a synthetic click that opens the modal.
    image.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerStart = {id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
    });
    image.addEventListener('pointermove', event => {
      if (!pointerStart || event.pointerId !== pointerStart.id) return;
      if (Math.hypot(event.clientX - pointerStart.x,event.clientY - pointerStart.y) > 8)
        pointerStart.moved = true;
    });
    image.addEventListener('pointerup', event => {
      if (!pointerStart || event.pointerId !== pointerStart.id) return;
      if (pointerStart.moved ||
          Math.hypot(event.clientX - pointerStart.x,event.clientY - pointerStart.y) > 8)
        suppressClickUntil = performance.now() + 500;
      pointerStart = null;
    });
    image.addEventListener('pointercancel', () => {pointerStart=null;});

    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      preview.removeAttribute('src');
      preview.removeAttribute('data-media-original');
      preview.alt = '';
      dialog.classList.remove('redcarpert-dress-pointer-opened');
      if (opener?.isConnected) {
        const restored = opener;
        if (pointerOpened) {
          restored.classList.add('redcarpert-dress-pointer-restored');
          restored.addEventListener('blur', () => {
            restored.classList.remove('redcarpert-dress-pointer-restored');
          }, {once:true});
        }
        restored.focus({preventScroll:true});
      }
      opener = null;
      pointerOpened = false;
    });

    const hasMultiple = photos.length > 1;
    if (!hasMultiple) {
      gallery.dataset.activePhoto = '0';
      image.setAttribute('aria-label', 'Enlarge photograph 1 of 1');
      continue;
    }

    const previous = gallery.querySelector('[data-gallery-previous]');
    const next = gallery.querySelector('[data-gallery-next]');
    const counter = gallery.querySelector('[data-gallery-counter]');
    const dots = [...gallery.querySelectorAll('[data-gallery-index]')];
    if (!previous || !next || !counter || dots.length !== photos.length) {
      console.error('Incomplete dress photo gallery navigation');
      continue;
    }
    const render = requestedIndex => {
      setActive(requestedIndex);
      counter.textContent = String(currentIndex + 1).padStart(2,'0') +
        ' / ' + String(photos.length).padStart(2,'0');
      dots.forEach((dot,index) => {
        const active = index === currentIndex;
        dot.classList.toggle('is-active',active);
        dot.setAttribute('aria-pressed',String(active));
      });
    };
    previous.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      render(currentIndex - 1);
    });
    next.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      render(currentIndex + 1);
    });
    dots.forEach((dot,index) => dot.addEventListener('click',event => {
      event.preventDefault();
      event.stopPropagation();
      render(index);
    }));
    gallery.addEventListener('keydown', event => {
      if (dialog.open || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      if (event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      event.preventDefault();
      event.stopPropagation();
      render(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
    });

    // Horizontal touch gestures continue to turn only genuine gallery photos.
    // A vertical swipe remains normal page scrolling, never a modal tap.
    let startPoint = null;
    frame.addEventListener('touchstart', event => {
      if (event.touches.length === 1) startPoint = {
        x:event.touches[0].clientX,y:event.touches[0].clientY,
      };
    }, {passive:true});
    frame.addEventListener('touchend', event => {
      if (!startPoint || !event.changedTouches.length) return;
      const deltaX = event.changedTouches[0].clientX - startPoint.x;
      const deltaY = event.changedTouches[0].clientY - startPoint.y;
      startPoint = null;
      if (Math.hypot(deltaX,deltaY) > 10) suppressClickUntil = performance.now() + 500;
      if (Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25)
        render(currentIndex + (deltaX < 0 ? 1 : -1));
    }, {passive:true});
    frame.addEventListener('touchcancel', () => {startPoint=null;}, {passive:true});
    render(0);
  }
}
