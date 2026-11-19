# Implementation 65 — Ruffled dresses CSV refresh (19 November 2026)

## Client source
Uploaded `urls-ruffled-dresses.csv`: one `url` column containing **65 distinct ImageKit URLs**, all under `wedding-dresses/ruffled-dresses/`. Filenames identify **17 dresses** (`ruffled-dress-01` through `ruffled-dress-17`). Numbered photo suffixes were sorted by dress and angle (01, 02, ...), rather than preserving the CSV's shuffled row order.

Photos per dress (01–17): **6, 7, 3, 4, 3, 2, 2, 4, 11, 2, 6, 1, 2, 3, 3, 4, 2**.

All 65 original provided URLs were used without adding/removing ImageKit `updatedAt` parameters. These exact unversioned URLs may need cache-busting on future replacement uploads.

## Source-of-truth updates

- `src/data/client-ruffled-dresses.json`: replaced the previous 38-photo, 12-dress Ruffled manifest with the 65-photo, 17-dress client set.
- `src/data/products.json`: preserved all previously displayed prices. Added separate sale and rental price records for dresses 13–17. Because no prices were in the CSV, **the five new draft prices temporarily copy the existing schedule for dresses 08–12**, respectively, and need client confirmation when actual prices arrive. No customer-facing placeholder labels were introduced.
- `src/data/catalogue.ts`: new count of **56 unique dress catalogue identities**.

## All website surfaces

The existing data-driven components automatically use the updated records:

- Ruffled category and full catalogue: 17 Ruffled cards, each using its own `-01.webp` cover and stable dress ID.
- New direct detail routes for Ruffled 13–17 and full multi-angle galleries for all 17 dresses, including 11 photos for Ruffled 09.
- Related dresses, pricing, WhatsApp fitting messages, ImageKit delivery/preloading and the deployment media audit.
- Digital Lookbook: **58 pages** (56 unique dresses + two covers).
- PDF Lookbook: **68 pages** (56 dress spreads + 12 editorial/category pages).

Existing Modern Tradition assignments are **unchanged**, because the CSV supplies only URLs, not fabric colours. Four already approved client dresses remain in that collection. Do not incorrectly assume these new Ruffled dresses are colourful without explicit client confirmation.

Original client dress photos now total **210 unique URLs** across 52 source dress photo groups; the four Modern Tradition catalogue identities reuse their separately approved sources.

## Verification

Added `tests/ruffled-csv-refresh.test.mjs` to guard the 65 exact URL paths, photo order, 17 category records, prices, related dress navigation, lookbook page counts and unchanged Modern Tradition feature sources. Updated existing catalogue, gallery, pricing, book, PDF and browser expectations.

Full lint/typecheck/build/unit/production/Chromium verification **has not been run in the GitHub editing environment**. Check before merging:

```powershell
git fetch origin
git switch implementation/65-ruffled-client-urls-17-dresses
git pull --ff-only origin implementation/65-ruffled-client-urls-17-dresses
npm run media:audit
npm run check
npm run test:dist
npm run dev
```

Do not merge, manually trigger GitHub Actions, or deploy until specifically requested.
