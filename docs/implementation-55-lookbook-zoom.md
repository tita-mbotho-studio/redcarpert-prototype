# Implementation 55 — Explicit image zoom for the Digital Lookbook

## Approved scope
- Add one small, top-right expand button to each photograph in the interactive Digital Lookbook, matching the existing dress-detail photo-gallery placement.
- Use the same modern Font Awesome 7 `fa-solid fa-up-right-and-down-left-from-center` icon in **both** the Digital Lookbook and dress-detail galleries.
- Preserve dress-detail Fancybox behaviour: only update its outdated icon markup.
- **Do not add photo zoom to Wedding Moments.**
- Preserve the original Implementation 54 StPageFlip page turns, swipes, navigation, images, sale/rental prices and downloadable PDF.

## Architecture
The photo is not the zoom trigger. Only a small button inside the image corner responds to click/tap, and that button stops its own pointer, mouse and touch events before they bubble to the book's flip handlers. The zoom dialog is a native top-layer `<dialog>` **outside** the animated book pages. Left/right keys inside it do not turn the book.

The separate dark image viewer supports click-to-open, Escape/X-to-close, zoom +/- and reset, mouse-wheel zoom, double-click zoom, touch pinch and drag-to-pan. The full-size photo is fetched only when opened, using existing ImageKit/Pexels delivery presets with original URL fallback. Closing returns focus to the trigger and retains the current book page.

## Review
```powershell
git fetch origin
git switch implementation/55-lookbook-isolated-image-zoom
git pull --ff-only origin implementation/55-lookbook-isolated-image-zoom
npm ci
npm run check
npm run dev
```
Manually test on desktop/tablet/mobile: next/previous, native paper clicks and swipe, expand button, zoom, close, and return to the same leaf. Review the existing dress-detail Fancybox icon and confirm Wedding Moments was not modified.

**No workflow, merge or deployment without explicit owner approval.**
