# Implementation 31 — Client Ball Gown catalogue

## Scope
Convert the Ball Gown category from four Pexels samples into **11 distinct client-photographed gowns**. All 28 supplied ImageKit URLs are used exactly as provided. Preserve the approved grouping and sequential IDs from the client's review (01–11).

The remaining 16 dresses (Mermaid, Ruffled, Modern Tradition, 2 in 1) retain clearly labelled **illustrative Pexels** photographs and sample prices. Do not imply that those samples are confirmed stock. Client-supplied photography does not independently confirm in-stock availability, sale price, or ownership/licensing.

## Source of truth

`src/data/client-ball-gowns.json` holds each dress's ID, name, full image URLs and descriptive alternative text. **The first photo is the main catalogue/online book/PDF image.** Subsequent photos drive the already approved multi-photo gallery. All photo paths use the original ImageKit `updatedAt` query strings.

| Dress | Images | Gallery views |
|:--|--:|:--|
| Ball Gown 01 | 3 | main, ceremony, bodice detail |
| Ball Gown 02 | 3 | main, bodice close-up, preparation |
| Ball Gown 03 | 4 | main, back, portrait, side |
| Ball Gown 04 | 2 | main, side |
| Ball Gown 05 | 4 | main, reception, side, alternate reception |
| Ball Gown 06 | 2 | main, wide ceremony |
| Ball Gown 07 | 1 | main only |
| Ball Gown 08 | 1 | main only |
| Ball Gown 09 | 4 | main, outdoor back, alternate reception, back |
| Ball Gown 10 | 1 | main only |
| Ball Gown 11 | 3 | main, ceremony detail, ceremony side |
| **Total** | **28** | **11 distinct dresses** |

This preserves the earlier grouping corrections: former 05 and 08 combined; the back-view photo reassigned from old 06 to old 10; and old 11 merged into old 10, followed by consecutive renumbering. The ImageKit folder names are authoritative.

## Prices and wording

The eleven client Ball Gowns have explicit `priceZar: null` slots in `src/data/products.json`, displaying **Price to be confirmed** on the catalogue, detail view, interactive book and PDF. Do not copy old example prices, invent prices or claim availability.

Client items are named **Ball Gown 01**, ..., **Ball Gown 11**, with `status: "client"`. Cards say **Client photographs** and the detail notice states that photographs were client supplied and pricing/availability must be confirmed. The WhatsApp fitting message requests confirmation of price and availability.

Sample items retain their existing labels and representative ZAR amounts, with a stock-photo disclosure. The whole Wedding Dresses page has a neutral **Showing N of 27 wedding dresses** filter counter and distinguishes the client Ball Gowns from illustrative designs.

## Editorial publications

- **Interactive Digital Lookbook:** 29 pages (cover + 27 dresses + back). All primary pictures and disclosures use the catalogue source of truth.
- **The Bridal Edit downloadable PDF:** 39 pages (four front pages + five category openers + 27 individual dress pages + three closing pages). The table of contents and folio numbers are generated from actual category sizes. Images use contain mode and the same ivory margins and centred dress copy; source credits distinguish client imagery from Pexels.
- The PDF generator accepts full-resolution Pexels JPGs and ImageKit WebPs, caches processed JPEGs for repeat local builds, and retains the existing named download URL and legacy alias. The actual 39-page PDF is generated during the local build; it is not committed to this branch.

## Ball Gown 06 PDF build fix (November 15, 2026)

A user's Windows build failed during `prepareLookbookImages` because the source ImageKit photograph for `ball-gown-06` has at least one side below the old 600px minimum. The earlier check was designed for Pexels stock originals and should not reject smaller genuine client-supplied pictures.

`scripts/lib/lookbook-assets.ts` now accepts images with valid positive dimensions for client sources while preserving the existing 600px minimum for Pexels samples. The generator never upscales smaller images; it estimates effective PDF DPI from the actual cached JPEG dimensions at the book's 170mm × 164mm photo area. Low-resolution client images are included, but the build prints a warning and records `printReady: false` below 300 DPI in `.generated/lookbook-image-audit.json`. Previously cached photos are re-audited without network downloads.

`tests/lookbook-photo-quality.test.mjs` covers the smaller client photograph, the retained sample-photo minimum, invalid dimensions, and print-DPI estimates. Do not claim the PDF is print-ready solely because the site builds: a higher-resolution source is preferable for physical printing.

## Local review after pulling the branch
```powershell
git fetch origin
git switch implementation/31-client-ball-gown-catalogue
npm ci
npm run setup
$env:REDCARPERT_BOOK_PREVIEW="1"
npm run check
Remove-Item Env:REDCARPERT_BOOK_PREVIEW
npm run dev
```

Verify `/product-category/ball_gown/`, `/product/`, `/product/preview/ball-gown-03/`, `/product/preview/ball-gown-07/`, the Digital Lookbook and the new 39-page downloaded PDF. On 03 check that arrows, dots and **01 / 04** counter work; on 07 no gallery arrows should appear. On all eleven verify photo grouping, complete silhouette, lack of sample labels and price confirmation. Check other Pexels categories still disclose that their images are illustrative.

**Review status:** Changes are in a separate branch for testing; do not merge or deploy without owner approval.
