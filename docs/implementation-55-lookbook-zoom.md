# Implementation 55 — Photo-tap zoom with the Wedding Moments modal

## Scope
- **Digital Lookbook:** tap/click the rendered pixels of a dress photograph to enlarge it, without any visible zoom button, icon or photo overlay. The cover and paper margins are not photo targets.
- **Modal:** reuse Wedding Moments' existing native `<dialog>`, transparent borderless media container, blurred backdrop, natural image containment, and Font Awesome X located just outside the top-right edge. No separate zoom toolbar, pinch/drag pan controls, zoom percentage or dark full-screen custom viewer.
- **Dress Details:** retain the earlier approved replacement of the legacy expand icon with modern Font Awesome 7 `fa-solid fa-up-right-and-down-left-from-center`. The existing Fancybox handler remains unchanged.
- **Wedding Moments:** no changes to its HTML, media controller or CSS.
- Preserve the original 3D PageFlip reader, all 35 dress photos and prices, 37 interactive leaves, 47-page PDF, routes and WhatsApp handoffs.

## Interaction separation
`getRenderedPhotoBounds(image)` calculates the *painted* area inside the existing `object-fit:contain` photo element using intrinsic image dimensions and the current displayed bounding rectangle. Touches in letterboxed gutters are ignored.

The dedicated `src/client/lookbook-zoom.js` controller listens to pointer movement **without preventing native StPageFlip down/move/up events**. If the user moves more than 4.5px, StPageFlip handles the gesture and preserves its 3D fold/swipe. A stationary tap is intercepted in the capture phase of `pointerup`, before PageFlip's window mouseup/touchend turn handler. `userStop({x:0,y:0}, true)` cancels only that pending tap; then the independently mounted `<dialog>` opens. Closing the dialog keeps the current page and restores focus to the photo. No StPageFlip configuration is changed.

The controller is delegated from the book so it covers portrait-mode cloned leaves as well as desktop pages. The enlarged preview uses the existing on-demand media delivery preset with original URL fallback.

## Verification
- Static/unit tests check clickable image markup, no visual button or zoom toolbar, photo hit testing, Wedding Moments styling parity and unmodified PageFlip settings.
- Browser regressions verify the original 3D book at 1440, 768 and 390px, image-tap modal open/close without turning, and a mobile swipe starting on the photograph. Fallback browser regression tests the same modal with the CDN blocked.
- Full `npm run check` and Playwright browser suites must be run locally before merge. No GitHub Action dispatch is authorized.

```powershell
git fetch origin
git switch implementation/55-lookbook-isolated-image-zoom
git pull --ff-only origin implementation/55-lookbook-isolated-image-zoom
npm ci
npm run check
npm run test:dist
npm run dev
```

To run the browser suite, in a **second** PowerShell terminal (after `npm run check` builds `dist`):

```powershell
npm run preview -- --port 4173
```

In a **third** terminal:

```powershell
npm run test:browser
```

**Rules: Do not merge, deploy or trigger GitHub Actions without explicit owner approval.**
