# Implementation 60 — Colour-based Modern Tradition cross-listing

## Client requirement
Modern Tradition is a **colour-based bridal collection**, not an exclusive silhouette. A clearly colourful Mermaid, Ball Gown, Ruffled or 2 in 1 gown should appear in both its usual silhouette collection and Modern Tradition. Neutral bridal whites, off-whites, ivory, cream and champagne do not qualify merely because they are not pure white.

## Implementation
- Explicit, human-reviewed colour annotations live in `src/data/modern-tradition-features.json`. Do not infer colour from filenames, guests, flowers, venue lighting or the surrounding background. Additional client dresses must be visually reviewed before being added.
- The eight verified colourful client items are:
  - `ball-gown-03` — navy blue
  - `ball-gown-04` — rose gold
  - `ball-gown-05` — dusty rose
  - `ball-gown-11` — lavender
  - `ruffled-dress-04` — dusty rose
  - `ruffled-dress-07` — rose gold
  - `2-in-1-mmematlala-dress` — bronze
  - `2-in-1-moreteadi-dress` — rose gold
- Each dress retains its **single source record and primary category**, plus derived `collections` membership. A colourful Ball Gown can be visible under both Ball Gown and Modern Tradition without duplicating its ID, images, detail page, price, WhatsApp enquiry or gallery.
- Both the main Wedding Dresses filter and the standalone Modern Tradition route match against `product.collections`, rather than only `product.category`.
- Original category card headings retain their silhouette (e.g., Ball Gown), while the Modern Tradition page description explains the colour-based mix.
- One dress page and one photograph per dress remain in the **53-page interactive book** and the **63-page A4 PDF**, with a discreet "Also in Modern Tradition" caption and a Modern Tradition section summary covering its cross-listed looks. This avoids duplicating pages.

## Older Modern Tradition samples
The four existing non-client Modern Tradition sample records remain intact. Image review found that two of those original source photos (`sample-modern-tradition-01` and `sample-modern-tradition-03`) appear white/neutral rather than colourful. **They are preserved for now rather than deleted or silently moved to a guessed silhouette**, pending replacement photos or explicit approval to retire them. The category therefore temporarily contains 12 looks (four legacy entries plus eight new cross-listings); the eight imported additions have been visually checked.

## Verification
- Unit regression test `tests/modern-tradition-cross-listing.test.mjs` verifies the eight inspected gown IDs, correct two-category membership, preserved 51 unique catalogue products and sales/rental records, one lookbook page per gown and correct PDF cross-reference labels.
- Existing catalogue adapter, editorial card and distribution tests now calculate standalone category page counts from membership.
- Responsive Chromium checks include Modern Tradition filtering across six viewports; stale imported Mermaid dress price and related-gallery assertions were corrected.
- **Do not run Chromium until deployment, per owner instruction.** Run `npm run check` and `npm run test:dist` locally on this feature branch. GitHub Actions remain manual-only.

## Branch dependency
Implementation 60 is branched from `implementation/59-client-csv-media-import`, which is still a separate unmerged media-import PR. Review and merge Implementation 59 first; merge Implementation 60 afterward. Do not deploy, dispatch Actions or merge without owner instruction.
