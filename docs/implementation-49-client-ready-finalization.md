# Implementation 49 — Client-ready catalogue finalization

This implementation builds on the already merged Implementation 48, from the latest `main`.

## Scope and decisions

1. Keep all existing images and site layouts while new photographs are prepared.
2. Use clean, natural customer-facing language without temporary preview, inspiration, stock-image or provenance notices. Image-source records, authors and URLs remain in the internal catalogue for correct asset tracking.
3. Show a fixed **Sale Price** and a **Rental Price Range** everywhere that dress pricing is shown; no visible example/provisional/pending disclaimers.
4. Keep the main catalogue/category tiles as photograph-and-title cards without prices.
5. Use the same formatted WhatsApp templates for footer, floating, About Us, Contact Us, dress details and the PDF's booking action. All native links open WhatsApp directly with a prefilled message.
6. Preserve the interactive lookbook (29 leaves) and the A4 PDF edition (39 pages), including all photographs, navigation and links.

## Price records to replace with approved figures

**These amounts are editorial working values, not approved commercial rates.** This note is internal documentation only. The site does not present this internal status.

Edit `src/data/products.json`:
- `dresses[].priceZar` is the fixed sale price in whole South African rand.
- `dresses[].rentalPriceRangeZar.minZar` and `maxZar` are the inclusive rental-range bounds.
- Keep values as numbers without currency symbols or thousands separators.
- All other website displays, related dress cards, WhatsApp messages, Digital Lookbook and PDF read from these fields.

| Dress ID | Sale Price | Rental Price Range |
| --- | ---: | ---: |
| `sample-mermaid` | R 12 900 | R 3 000 – R 4 600 |
| `sample-mermaid-02` | R 14 500 | R 3 300 – R 5 200 |
| `sample-mermaid-03` | R 16 900 | R 3 900 – R 6 100 |
| `sample-mermaid-04` | R 18 900 | R 4 300 – R 6 800 |
| `ball-gown-01` | R 22 900 | R 5 300 – R 8 200 |
| `ball-gown-02` | R 24 900 | R 5 700 – R 9 000 |
| `ball-gown-03` | R 32 900 | R 7 600 – R 11 800 |
| `ball-gown-04` | R 21 900 | R 5 000 – R 7 900 |
| `ball-gown-05` | R 36 900 | R 8 500 – R 13 300 |
| `ball-gown-06` | R 29 900 | R 6 900 – R 10 800 |
| `ball-gown-07` | R 19 900 | R 4 600 – R 7 200 |
| `ball-gown-08` | R 23 900 | R 5 500 – R 8 600 |
| `ball-gown-09` | R 38 900 | R 8 900 – R 14 000 |
| `ball-gown-10` | R 25 900 | R 6 000 – R 9 300 |
| `ball-gown-11` | R 31 900 | R 7 300 – R 11 500 |
| `sample-ruffled-01` | R 14 900 | R 3 400 – R 5 400 |
| `sample-ruffled-02` | R 16 900 | R 3 900 – R 6 100 |
| `sample-ruffled-03` | R 18 900 | R 4 300 – R 6 800 |
| `sample-ruffled-04` | R 22 900 | R 5 300 – R 8 200 |
| `sample-modern-tradition-01` | R 17 900 | R 4 100 – R 6 400 |
| `sample-modern-tradition-02` | R 21 500 | R 4 900 – R 7 700 |
| `sample-modern-tradition-03` | R 24 900 | R 5 700 – R 9 000 |
| `sample-modern-tradition-04` | R 28 900 | R 6 600 – R 10 400 |
| `sample-two-in-one-01` | R 21 900 | R 5 000 – R 7 900 |
| `sample-two-in-one-02` | R 24 900 | R 5 700 – R 9 000 |
| `sample-two-in-one-03` | R 28 900 | R 6 600 – R 10 400 |
| `sample-two-in-one-04` | R 33 900 | R 7 800 – R 12 200 |

The metadata fields `priceStatus: "draft"`, `rentalPriceStatus: "draft"` and `priceApproval: "pending-client-review"` record internal approval state. Once the client supplies and signs off final values, update them as appropriate.

## Asset-delivery audit

The central `src/lib/media-delivery.ts` helper applies these ImageKit presets:
- Tile: 640 × 640, q72; product card: 740 × 740, q76
- Dress detail: 1280 × 1800, q82; enlarged preview: 1920 × 1920, q82
- Digital Lookbook: 1200 × 1600, q80
- About Us portraits: 900 × 1200, q76
- Homepage hero: 2000 × 2000, q83

ImageKit uses `c-at_max` and `f-auto` to preserve aspect ratios and choose an efficient format. Pexels is delivered with `auto=compress`, `cs=tinysrgb` and a width cap. Every transformed remote image keeps its original URL as an error fallback. Videos remain untransformed; posters use tile optimizations and `preload=none`.

The PDF pipeline in `scripts/lib/lookbook-assets.ts` rotates, resizes within a 2000 × 2500 bound without enlarging source images, and compresses to JPEG (quality 86, MozJPEG), with per-image print DPI reporting. PDF page generation checks for clipped price fields.

The `tests/client-media-optimization.test.mjs` file audits current homepage images, catalogue and extra dress galleries, six About Us models, and all Wedding Moments photos/posters, plus the shared PDF pipeline. It validates transformation behavior, not remote CDN uptime or actual downloaded bytes.

## WhatsApp audit

- `src/lib/whatsapp-messages.ts` contains `generalFittingMessage` and `dressFittingMessage`.
- `src/config/whatsapp.ts` builds the single authorized `wa.me/27680458811?text=...` URL.
- `scripts/generate.ts` uses the dress-specific template for dress pages and general template for other pages.
- `src/lib/direct-whatsapp.ts` converts approved fitting buttons to native direct links with safe new-tab attributes.
- `src/lib/luxury-lookbook.ts` now uses the same general message instead of a hardcoded PDF-only message.
- WhatsApp opens with line breaks, bold field headings, prices and the correct dress URL, leaving the Send action to the customer.

## Local verification

```powershell
git fetch origin
git switch implementation/49-client-ready-finalization
git pull --ff-only origin implementation/49-client-ready-finalization
npm run check
npm run dev
```

Run `npm run build`, `npm run preview` and `npm run test:browser` to test actual published layout in a browser.

For PDF page screenshots:

```powershell
$env:REDCARPERT_BOOK_PREVIEW = '1'
npm run build
Remove-Item Env:REDCARPERT_BOOK_PREVIEW
```

Inspect the actual PDF, especially the prices, page spacing, and the fitting hyperlink. No merge, deployment or manual GitHub Actions are part of this implementation until expressly requested.
