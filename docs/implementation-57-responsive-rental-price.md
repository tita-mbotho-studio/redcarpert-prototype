# Implementation 57 — Single-line rental price ranges in Dress Details

## Scope
Keep the existing Sale Price and Rental Price Range values, labels, fonts and elevated Dress Details card. Fix wrapping of the longer ZAR rental range on desktop, and verify the same one-line behaviour across desktop, tablet and mobile.

## Change
- Wide desktop: give the rental column 3/5 of the available pricing width, versus 2/5 for the shorter sale amount.
- Keep the full rental format (including `R`, both amounts, spaces and the en dash) on one line with no forced line breaks or truncation.
- Size the longer range proportionally with the existing Georgia family using `clamp(15px, 1.18vw, 18px)`; preserve its centred position and the current colors.
- The `RENTAL PRICE RANGE` heading also remains on one line.
- At intermediate widths 641–1050px (where the whole Dress Details card is in a narrow half-width layout), stack the two price fields neatly to avoid squeezing them; below 640px the pre-existing single-column mobile pricing layout remains.
- No changes to `products.json`, pricing calculations, Dress Details photo modal, galleries, WhatsApp, or PDF/lookbook price formats.

## Verification
- Edited browser regression now inspects actual rendered text height and horizontal overflow at 11 viewport widths (320–1920px).
- A second regression checks a long client rental range on Ball Gown 03 across eight widths.
- A representative layout was measured in headless Chromium across 15 viewports (320–1920px), with neither rental label nor value overflowing. This is not a substitute for the complete site build and browser suite.
- Run `npm run check` then `npm run test:dist` locally, and use a separate `npm run preview -- --port 4173` terminal for `npm run test:browser`.

## Review locally
```powershell
git fetch origin
git switch implementation/57-responsive-dress-rental-price
git pull --ff-only origin implementation/57-responsive-dress-rental-price
npm run check
npm run dev
```

**No npm ci required for this styling-only change. Do not merge, deploy or dispatch GitHub Actions without explicit approval.**
