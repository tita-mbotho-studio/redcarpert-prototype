# Implementation 52 — Homepage, Ball Gown and Ruffled ImageKit refresh

## Changes

- Homepage: replace three hero images using the supplied updatedAt values
  1794955340352 / 1794955340262 / 1794955340871, retaining current responsive hero styling.
- Ball Gown: retain 11 products, routes and prices. Replace gallery imagery with
  27 new unique files. Repeated 03-04 link removed. Ball Gown 04 uses its only
  supplied file, 04-02, as the primary image; 04-01 was not invented.
- Ruffled: replace four prior Pexels sample products with 12 numbered client
  dresses (01–12) and 38 photos. Add detail routes using IDs ruffled-dress-01
  through ruffled-dress-12, with original image URLs and galleries.
- Pricing: preserve four existing Ruffled sale/rental pairs under the new IDs;
  add eight editable sale and rental pairs centrally in products.json.

## Derived output

- Mermaid 4, Ball Gown 11, Ruffled 12, Modern Tradition 4, 2 in 1 4.
- 35 dresses total: 23 client-photo entries and 12 remaining Pexels entries.
- Interactive book: 37 leaves. PDF: 47 A4 pages. Static routes: 46.
- Product detail views, clickable photos, optimized delivery, WhatsApp and
  sale/rental presentation remain driven by the central catalogue records.

## Verification

Added regression coverage for grouping, duplicate URLs, original timestamps,
gallery mappings and pricing. Full build/browser verification remains pending;
the links were not independently HTTP-verified from this environment.

Review branch: implementation/52-home-ball-gown-ruffled-client-images
Use git fetch origin; git switch implementation/52-home-ball-gown-ruffled-client-images;
git pull --ff-only origin implementation/52-home-ball-gown-ruffled-client-images;
npm ci; npm run check; npm run dev.

Do not merge, deploy, or manually dispatch GitHub Actions before approval.
