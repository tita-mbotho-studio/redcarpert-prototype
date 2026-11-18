/** Shared photo zoom for the Digital Lookbook and Wedding Moments.
 * Only the active modal image is transformed. Videos are never zoomed.
 * Native <dialog> provides focus containment and Escape handling.
 */
export function initializeImageZoom(dialog) {
  if (!(dialog instanceof HTMLDialogElement)) return null;
  const stage = dialog.querySelector('[data-image-zoom-stage]');
  const image = dialog.querySelector('[data-image-zoom-photo]');
  const controls = dialog.querySelector('[data-image-zoom-controls]');
  const zoomIn = dialog.querySelector('[data-image-zoom-in]');
  const zoomOut = dialog.querySelector('[data-image-zoom-out]');
  const resetButton = dialog.querySelector('[data-image-zoom-reset]');
  const percentage = dialog.querySelector('[data-image-zoom-percent]');
  if (!(stage instanceof HTMLElement) || !(image instanceof HTMLImageElement) ||
      !(controls instanceof HTMLElement) || !zoomIn || !zoomOut || !resetButton || !percentage) return null;

  const MIN = 1;
  const MAX = 4;
  let scale = MIN, offsetX = 0, offsetY = 0, enabled = false;
  const pointers = new Map();
  let pinch = null;
  let lastPoint = null;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  function paint() {
    // Keep the photograph within the original viewport; zoom never enlarges
    // the dialog or changes the surrounding page dimensions.
    const maxX = Math.max(0, (image.offsetWidth * scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (image.offsetHeight * scale - stage.clientHeight) / 2);
    offsetX = clamp(offsetX, -maxX, maxX);
    offsetY = clamp(offsetY, -maxY, maxY);
    image.style.transform = 'translate3d(' + offsetX + 'px,' + offsetY + 'px,0) scale(' + scale + ')';
    percentage.textContent = Math.round(scale * 100) + '%';
    zoomIn.disabled = !enabled || scale >= MAX;
    zoomOut.disabled = !enabled || scale <= MIN;
    resetButton.disabled = !enabled || scale <= MIN;
    stage.classList.toggle('is-zoomed', scale > MIN);
  }

  function setScale(next) {
    if (!enabled) return;
    const normalized = clamp(next, MIN, MAX);
    if (normalized === MIN) { offsetX = 0; offsetY = 0; }
    scale = normalized;
    paint();
  }
  function reset() {
    scale = MIN;
    offsetX = offsetY = 0;
    pointers.clear();
    pinch = null;
    lastPoint = null;
    paint();
  }
  function setActive(active) {
    enabled = Boolean(active);
    controls.hidden = !enabled;
    reset();
  }
  zoomIn.addEventListener('click', () => setScale(scale * 1.5));
  zoomOut.addEventListener('click', () => setScale(scale / 1.5));
  resetButton.addEventListener('click', reset);
  stage.addEventListener('wheel', event => {
    if (!enabled || !dialog.open) return;
    event.preventDefault();
    setScale(scale * (event.deltaY < 0 ? 1.2 : 1 / 1.2));
  }, { passive: false });
  stage.addEventListener('dblclick', event => {
    if (!enabled || !dialog.open) return;
    event.preventDefault();
    setScale(scale > MIN ? MIN : 2);
  });
  stage.addEventListener('pointerdown', event => {
    if (!enabled || !dialog.open) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (event.pointerType !== 'mouse' || scale > MIN) {
      stage.setPointerCapture(event.pointerId);
    }
    if (pointers.size === 1) {
      lastPoint = { x: event.clientX, y: event.clientY };
    } else if (pointers.size === 2) {
      const [a,b] = [...pointers.values()];
      pinch = { length: Math.max(1, distance(a,b)), scale, center: midpoint(a,b) };
      lastPoint = null;
    }
  });
  stage.addEventListener('pointermove', event => {
    if (!enabled || !dialog.open || !pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2 && pinch) {
      const [a,b] = [...pointers.values()];
      const center = midpoint(a,b);
      offsetX += center.x - pinch.center.x;
      offsetY += center.y - pinch.center.y;
      scale = clamp(pinch.scale * distance(a,b) / pinch.length, MIN, MAX);
      if (scale === MIN) { offsetX = 0; offsetY = 0; }
      pinch.center = center;
      paint();
    } else if (pointers.size === 1 && scale > MIN && lastPoint) {
      offsetX += event.clientX - lastPoint.x;
      offsetY += event.clientY - lastPoint.y;
      lastPoint = { x: event.clientX, y: event.clientY };
      paint();
    }
  });
  const finishPointer = event => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    lastPoint = pointers.size === 1 ? [...pointers.values()][0] : null;
  };
  stage.addEventListener('pointerup', finishPointer);
  stage.addEventListener('pointercancel', finishPointer);
  stage.addEventListener('lostpointercapture', finishPointer);
  dialog.addEventListener('keydown', event => {
    if (!enabled || !dialog.open || event.target.closest('input,textarea,[contenteditable="true"]')) return;
    if (event.key === '+' || event.key === '=') { event.preventDefault(); setScale(scale * 1.5); }
    if (event.key === '-') { event.preventDefault(); setScale(scale / 1.5); }
    if (event.key === '0') { event.preventDefault(); reset(); }
  });
  dialog.addEventListener('close', () => setActive(false));
  window.addEventListener('resize', () => { if (dialog.open && enabled) paint(); });
  // On a narrow viewport the modal may be shown before its remote image
  // finishes loading. Recalculate the zoom bounds when the pixels arrive.
  image.addEventListener('load', () => { if (dialog.open && enabled) paint(); });
  setActive(false);
  return { setActive, reset, setScale, refresh: paint };
}
