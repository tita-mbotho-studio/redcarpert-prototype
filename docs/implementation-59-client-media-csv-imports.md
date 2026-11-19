# Implementation 59 — Client media CSV batches

## Source files and validation
Four user-supplied CSV files are the sole source of imported media URLs:
- `urls-wedding-moments.csv`: 90 URLs — one MP4 plus 89 WebP photos.
- `urls-mermaid-dresses.csv`: six WebP photos grouped into two named Mermaid dresses.
- `urls-ball-gown-dresses.csv`: 34 WebP photos grouped into 12 numbered Ball Gowns, including newly supplied Ball Gown 12 and the corrected Ball Gown 04 `-01` front image.
- `urls-2-in-1-dresses.csv`: 105 WebP photos grouped into 21 named 2 in 1 dresses.

Every URL was checked against the uploaded CSV using a sorted-list FNV-1a checksum, with all four source-to-repository checks matching exactly; 235 distinct URLs in total. Within each dress group, filenames are ordered numerically (01 first), not by CSV row order. No photo is assigned to more than one dress.

## Website
- Wedding Moments now has 90 media items, with the user-supplied `wedding-moments-88.mp4?updatedAt=1795046428630` first, preserving direct-video playback, native controls and sound attempt. New WebPs use ImageKit optimized tiles and previews with original URL fallback. Pagination remains 16 per batch.
- The shared catalogue has 51 dresses: Mermaid 2, Ball Gown 12, Ruffled 12, Modern Tradition 4 (unchanged existing sample photos), and 2 in 1 Dresses 21.
- All 47 client dresses have native dress detail pages. Their named/numbered catalogue cards, image galleries, main image `-01`, multiple angles, arrows, thumbnails, photo modal and WhatsApp fitting links derive from the shared manifests. The largest dress gallery (Nthabiseng) contains all 16 photographs.
- Retired Mermaid and 2 in 1 sample products and the orphaned sample secondary photo mapping are not published as active dresses.
- Four remaining Modern Tradition look photographs have not been replaced because this batch did not include them.

## Digital lookbook and PDF
The interactive digital lookbook and PDF consume the **same `catalogueProducts`** as dress details. All 51 dresses appear with their new primary image and shared sale/rental prices:
- **53 interactive book leaves:** cover + 51 dresses + back.
- **63 A4 PDF pages:** cover/front matter + five collection sections + 51 dress pages + closing matter.
- Existing editorial design, navigation, fitting links and ImageKit optimized preview behaviour are unchanged.
- **One primary photo per dress** is embedded in the lookbook and PDF, following the previously approved layout. All other angles (183 client photos in total) are available through each Dress Details gallery. Expanding the PDF to hundreds of individual photo pages remains separate from this import.

## Price data
The CSVs did not include new sale or rental prices. Existing price records remain unchanged. New dresses have editable **draft** prices using the earlier category price tiers, with `priceApproval:pending-client-review`. This is not client-approved pricing.

## Checks
- Verified all 235 imported URLs are exactly equal to the uploaded CSV sets.
- Verified no duplicate URLs, no missing price slots, 51 unique catalogue IDs, 183 unique client gallery photographs, contiguous `-01` to `-NN` per dress, and 90 Wedding Moments items.
- Updated unit, static HTML, production browser and lookbook tests to exercise expanded collections and page counts.
- Modified JavaScript and test scripts passed syntax parsing in the connector environment. Local review on 19 November 2026: ESLint, TypeScript, production build and the distribution suite **passed** (12/12). The unit suite initially had 151/156 passes; five failing legacy assertions were subsequently corrected in the same branch. These covered a removed Mermaid sample route, older dress/PDF counts, the increased Wedding Moments count, pagination remainder, and a visible-copy brand check that incorrectly matched the digits "1980" inside an ImageKit timestamp. Updated tests passed JavaScript syntax checks. **Rerun `npm run check` locally to confirm the full updated unit suite; browser tests remain pending.** No GitHub Actions were triggered.

## Local review
```powershell
cd C:\Users\Admin\Projects\redcarpert-wedding-dresses\redcarpert-prototype
git fetch origin
git switch implementation/59-client-csv-media-import
git pull --ff-only origin implementation/59-client-csv-media-import
npm run check
npm run test:dist
npm run dev
```

Start `npm run preview -- --port 4173` in another terminal and then `npm run test:browser` in a third for production browser tests.

No dependency changes. Do not run `npm ci` unless packages or lockfile have changed. **Do not merge, deploy or dispatch GitHub Actions without the owner's explicit approval.**
