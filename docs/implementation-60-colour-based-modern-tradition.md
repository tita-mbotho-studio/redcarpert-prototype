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
- One dress page and one photograph per dress remain in the **49-page interactive book** and the **59-page A4 PDF**, with a discreet "Also in Modern Tradition" caption and a Modern Tradition section summary covering its cross-listed looks. This avoids duplicating pages.

## Client-only catalogue and Modern Tradition card labels
- All four retired Modern Tradition placeholder records, Pexels photo groups and matching sample pricing entries are removed. The active catalogue is now **47 unique client dresses** with **183 client gown photographs**.
- **Modern Tradition contains exactly eight visually reviewed colourful client gowns**; no additional sample category records remain.
- On the standalone Modern Tradition page, all eight cross-listed client dresses display **Modern Tradition** with a dedicated **01–08 display sequence** instead of their original Ball Gown/Ruffled/2 in 1 titles and numbers. Original client dress IDs and detail routes remain intact.
- The main catalogue filter switches the heading, 01–08 display number, image alt text and accessible link label to Modern Tradition; switching to another filter restores the original silhouette names, image descriptions and typography.
- The interactive book contains **49 pages** and the A4 PDF contains **59 pages**, one unique dress entry each, with the cross-list labels preserved. No sample PDF alias or Pexels image is generated.
- The gallery, link, WhatsApp and pricing values always refer to the original client dress record.
- Five abandoned Pexels/sample WebP files under `public/redcarpert/gallery/` and `public/redcarpert/home/` have been deleted from this branch. The Pexels-only listing fixture and sample gallery helper are also removed. The production generator no longer produces the retired `Redcarpert-Sample-Lookbook.pdf` alias.
- Old historical implementation notes remain as project history only; they are not published client dress records, executable sample data or media assets.

## Verification
- Unit regression test `tests/modern-tradition-cross-listing.test.mjs` verifies the eight inspected gown IDs, correct two-category membership, preserved 47 unique catalogue products and sales/rental records, one lookbook page per gown and correct PDF cross-reference labels.
- Existing catalogue adapter, editorial card and distribution tests now calculate standalone category page counts from membership.
- Responsive Chromium checks include Modern Tradition filtering across six viewports; stale imported Mermaid dress price and related-gallery assertions were corrected.
- **Do not run Chromium until deployment, per owner instruction.** Run `npm run check` and `npm run test:dist` locally on this feature branch. GitHub Actions remain manual-only.

## Branch dependency
Implementation 60 is branched from `implementation/59-client-csv-media-import`, which is still a separate unmerged media-import PR. Review and merge Implementation 59 first; merge Implementation 60 afterward. Do not deploy, dispatch Actions or merge without owner instruction.
