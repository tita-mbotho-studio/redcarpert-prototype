/**
 * Lookbook-only photo viewer. PageFlip owns the paper; the small, explicit
 * zoom buttons own their pointer events. Never bind zoom to photo taps.
 */
export function initializeLookbookZoom(viewer) {
  const dialog = viewer?.querySelector('[data-book-zoom-dialog]');
  const stage = dialog?.querySelector('[data-book-zoom-stage]');
  const image = dialog?.querySelector('[data-book-zoom-image]');
  const triggers = [...(viewer?.querySelectorAll('[data-book-zoom-trigger]') ?? [])];
  if (!dialog || !stage || !image || !triggers.length || viewer.dataset.bookZoomReady === 'true') return;
  viewer.dataset.bookZoomReady = 'true';

  const close = dialog.querySelector('[data-book-zoom-close]');
  const inButton = dialog.querySelector('[data-book-zoom-in]');
  const outButton = dialog.querySelector('[data-book-zoom-out]');
  const resetButton = dialog.querySelector('[data-book-zoom-reset]');
  const percent = dialog.querySelector('[data-book-zoom-percent]');
  const pointers = new Map();
  let previousFocus = null;
  let original = '';
  let usedOriginal = false;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let pinchStart = null;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const render = () => {
    // The image is naturally contained at 100%. Limit panning to its zoomed
    // bounds rather than leaving a photograph stranded offscreen.
    const maxX = Math.max(0, (image.clientWidth * (zoom - 1)) / 2);
    const maxY = Math.max(0, (image.clientHeight * (zoom - 1)) / 2);
    panX = clamp(panX, -maxX, maxX);
    panY = clamp(panY, -maxY, maxY);
    image.style.transform = 'translate3d(' + panX + 'px,' + panY + 'px,0) scale(' + zoom + ')';
    stage.classList.toggle('is-zoomed', zoom > 1);
    if (percent) percent.textContent = Math.round(zoom * 100) + '%';
    outButton.disabled = zoom <= 1;
    inButton.disabled = zoom >= 4;
    resetButton.disabled = zoom === 1 && panX === 0 && panY === 0;
  };
  const setZoom = value => {
    zoom = clamp(Math.round(value * 100) / 100, 1, 4);
    if (zoom === 1) { panX = 0; panY = 0; }
    render();
  };
  const closeViewer = () => {
    if (dialog.open) dialog.close();
  };
  const openViewer = trigger => {
    previousFocus = trigger;
    original = trigger.dataset.bookZoomOriginal || '';
    usedOriginal = false;
    pointers.clear();
    zoom = 1; panX = 0; panY = 0; pinchStart = null;
    const photo = trigger.closest('.redcarpert-book-photo')?.querySelector('img');
    image.alt = photo?.alt || 'Wedding dress photograph';
    image.src = trigger.dataset.bookZoomSrc || original;
    dialog.showModal();
    render();
    close.focus({preventScroll:true});
  };

  // Important: clicking the photograph or blank paper still flips the book.
  // Only the independent zoom button stops events before they reach PageFlip.
  for (const trigger of triggers) {
    for (const name of ['pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','click','dblclick']) {
      trigger.addEventListener(name, event => event.stopPropagation());
    }
    trigger.addEventListener('click', event => {
      event.preventDefault();
      openViewer(trigger);
    });
  }

  image.addEventListener('error', () => {
    if (!usedOriginal && original && image.src !== original) {
      usedOriginal = true;
      image.src = original;
    }
  });
  image.addEventListener('load', render);
  close.addEventListener('click', closeViewer);
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeViewer();
  });
  // Keyboard events in the modal must not reach the book's ArrowLeft/Right
  // controls. The browser still handles Escape on the native modal dialog.
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('close', () => {
    pointers.clear();
    zoom = 1; panX = 0; panY = 0; pinchStart = null;
    render();
    image.removeAttribute('src');
    previousFocus?.focus({preventScroll:true});
  });

  inButton.addEventListener('click', () => setZoom(zoom + .5));
  outButton.addEventListener('click', () => setZoom(zoom - .5));
  resetButton.addEventListener('click', () => {panX = 0; panY = 0; setZoom(1);});
  stage.addEventListener('dblclick', event => {
    event.preventDefault();
    setZoom(zoom === 1 ? 2 : 1);
  });
  stage.addEventListener('wheel', event => {
    event.preventDefault();
    setZoom(zoom + (event.deltaY < 0 ? .25 : -.25));
  }, {passive:false});

  const distance = (a,b) => Math.hypot(a.x - b.x, a.y - b.y);
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    try {stage.setPointerCapture(event.pointerId);} catch { /* touch capture can already end */ }
    if (pointers.size === 2) {
      const [a,b] = [...pointers.values()];
      pinchStart = {distance:distance(a,b),zoom};
    }
  });
  stage.addEventListener('pointermove', event => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if (pointers.size >= 2) {
      const [a,b] = [...pointers.values()];
      if (pinchStart?.distance) setZoom(pinchStart.zoom * distance(a,b) / pinchStart.distance);
    } else if (zoom > 1) {
      panX += event.clientX - previous.x;
      panY += event.clientY - previous.y;
      render();
    }
  });
  const release = event => {
    pointers.delete(event.pointerId);
    pinchStart = null;
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  window.addEventListener('resize', () => {if (dialog.open) render();});
}
