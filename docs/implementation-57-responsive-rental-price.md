# Implementation 57 — Natural, single-line Dress Details pricing

## Approved result
Both **Sale Price** and **Rental Price Range** use the **same Georgia font family and exactly the same font size** at every viewport. The full rental range, including the currency labels, is displayed on one line. No smaller, lighter or special rental-price type.

## Layout
- The two pricing blocks are now stacked, centred and given the full inner width of the existing elevated information card **on all screens**, desktop through mobile.
- A restrained separator remains between sale and rental; no card or price value is changed.
- Removed the previous 2/5–3/5 split and the special `clamp(15px, 1.18vw, 18px)` rental type size.
- Retained the shared `clamp(18px, 1.9vw, 27px)` amount sizing, serif typography, heading treatment and current spacing accents.
- Keeps the natural wrapping of other card content, but prevents these specific price values and labels from breaking mid-line.

## Tests
- Browser regression now checks exactly one pricing column, equality of computed sale/rental font family and size, single-line text and zero horizontal overflow across eleven widths from 320px to 1920px.
- A second regression checks a long actual client rental range (Ball Gown 03) across eight viewports.
- An isolated headless Chromium pricing-layout fixture was checked across sixteen viewport widths from 320px to 1920px and showed equal sale/rental fonts with no overflow. This does **not** replace the full Vite build or page-level Playwright suite.
- Existing PDF-DPI warnings are opt-in (`REDCARPERT_PDF_PRINT_WARNINGS=1`); PDF audit data and true processing errors remain intact.

## Local review (no dependency reinstall needed)
```powershell
git fetch origin
git switch implementation/57-responsive-dress-rental-price
git pull --ff-only origin implementation/57-responsive-dress-rental-price
npm run check
npm run dev
```

**No merge, deploy, or GitHub Actions dispatch without owner approval.**
