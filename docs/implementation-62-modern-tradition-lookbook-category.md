# Implementation 62 — Modern Tradition as a full collection in both bridal lookbooks

## Requested change
The four approved Modern Tradition dresses must appear as a full collection in the interactive Digital Lookbook and the downloadable A4 PDF, not merely as cross-references on their original silhouette pages.

### Four collection displays
1. Modern Tradition 01 (canonical Ball Gown 03)
2. Modern Tradition 02 (canonical Ball Gown 04)
3. Modern Tradition 03 (canonical Ball Gown 05)
4. Modern Tradition 04 (canonical 2 in 1 Moreteadi)

These use the approved Implementation 61 category-specific detail routes `/product/preview/modern-tradition-01/` to `/product/preview/modern-tradition-04/`. They retain the matching photo, sale price, rental price range and original silhouette catalogue identity.

## Shared, deterministic collection sequence
`src/lib/lookbook-placements.ts` supplies five ordered collections to both editions: Mermaid, Ball Gown, Ruffled, Modern Tradition, 2 in 1.

- The canonical catalogue still contains **47 unique dresses** and **183 client dress photographs**.
- Both editions now present **51 dress spreads**: one per canonical dress plus four contextual Modern Tradition displays.
- The **Digital Lookbook has 53 numbered leaves** (front cover + 51 spreads + back cover).
- The **A4 PDF has 63 pages** (four front matter, five section dividers, 51 dress pages, three closing pages).
- The PDF's existing Modern Tradition contents entry and category divider now lead into four actual full dress pages, with accurate contents page references and pagination.
- Each Modern Tradition book spread displays the correct category name and number and links to its dedicated Modern Tradition detail page. No user ever lands on the silhouette-only detail page when following that collection's book link.
- Existing photo zoom, 3D flipping, prev/next controls, sale and rental prices, mobile layout and download CTA remain as before.
- The PDF image asset preparation still processes 47 canonical client photos; the four category views reuse those photos. No media URLs, products, prices or galleries were copied.

## Verification
Updated online/PDF page-count, contents page, book-price, image-zoom and customer wording tests. Updated fallback and enhanced 3D Chromium browser scripts to expect 53 pages, correct Modern Tradition links and 51 visible dress spreads.

**Run locally:** `npm run check`, `npm run test:dist`, `npm run dev`.

**Branch dependency:** This feature branch starts from `implementation/61-modern-traditional-cleanup-detail-pages`. Merge 61 only after approval, then retarget and merge 62 when separately approved.

**Release safeguard:** No merges, deployments or manual GitHub Actions are authorized by this implementation request. Full local builds and browser suites remain pending owner-run verification. As agreed, full Chromium UI verification may be performed at owner-authorized deployment.
