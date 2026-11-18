# Implementation 56 — Dress Details clickable photograph modal

## Approved user request
The Dress Details pages should **not use the old hover zoom or a separate expand button**. A tap/click directly on the displayed photograph opens the same borderless modal presentation already approved for the Digital Lookbook and Wedding Moments.

## Implemented
- Every dress detail page has one active image carrying `role="button"`, `tabindex="0"`, accessible label, and `aria-haspopup="dialog"`. This is the only zoom trigger.
- Removed the `wpgis-popup` / `data-fancybox` anchor and the WooCommerce `.zoom` class from generated Dress Details. The single-photo gallery also no longer uses the legacy `wpgis-slider-for` plugin initializer. Existing custom multi-photo sliders are preserved.
- A separate native `<dialog>` is mounted outside the product gallery, reusing Wedding Moments' CSS classes for a naturally fitted, borderless image, blurred background, and Font Awesome X just outside the top-right corner. No manual zoom toolbar or hover magnification.
- On image click, the current gallery photo opens with the shared `preview`-size image preset, original URL fallback and preserved alt text. Escape, the close button and clicking the dialog backdrop close it. Closing retains the current gallery index and restores focus.
- Existing previous/next chevrons, photo indicator dots, counters, keyboard arrows, horizontal mobile swipe handling, prices, WhatsApp actions, related dresses, and all ImageKit sources remain intact. A swipe is prevented from generating an unwanted photo-opening click.
- The Wedding Moments page itself and Digital Lookbook interaction code are **not changed**.

## Validation
- Existing product-detail unit tests now require a separate native modal and reject legacy Fancybox/hover-zoom controls for all 35 dresses.
- The static HTML tests require the modal instead of the old expand button.
- The browser gallery script now verifies opening the current selected photo, closing without changing selection, normal gallery navigation and single-photo dresses.
- Source-level syntax/structural checks completed. Full production build and Playwright browser runs are pending local review.

## Local review
```powershell
cd C:\Users\Admin\Projects\redcarpert-wedding-dresses\redcarpert-prototype
git fetch origin
git switch implementation/56-dress-detail-photo-modal
git pull --ff-only origin implementation/56-dress-detail-photo-modal
npm ci
npm run check
npm run test:dist
npm run dev
```

To run browser checks, use a second terminal after building:
```powershell
npm run preview -- --port 4173
```
In a third terminal:
```powershell
npm run test:browser
```

**Do not merge, deploy or trigger GitHub Actions until the owner explicitly approves.**
