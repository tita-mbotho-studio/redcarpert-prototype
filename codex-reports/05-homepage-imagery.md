# Implementation 05 — Homepage Imagery

Date: 23 October 2026. Workspace: `/workspaces/redcarpert-prototype`.

## 1. Objective and completion status

Replaced the three homepage photographic backgrounds with local, web-optimised composites made from verified Pexels photographs. Kept the original raster-composite approach and exact canvas dimensions. A separate, closed homepage helper changes only the three approved inline background URL substrings, without relaxing the existing content adapter's protected-attribute restrictions.

Completed: three WebP assets; minimal renderer integration; focused tests; all existing content-adapter tests; lint; TypeScript; production build; local image endpoint/decode checks; desktop/tablet/mobile nonvisual browser checks; and availability checks for all 143 captured routes.

Preserved the Phase 04 heading and hero CTA/destination, original logo, DOM structure, layouts, typography, responsive CSS, fullscreen interaction and safe WhatsApp preview. No photographs or content on other pages were adapted. No footer, routes, product data, dependencies or unrelated functionality were added. No original hashed assets were overwritten or removed. No commit or push occurred.

Read/reviewed reports 01–04 and the relevant current source before implementing. This is the only new report. No screenshots, evidence directories, browser-image comparisons or pixel-diff tests were created. Standalone source and replacement raster files were opened for the image inspection required by this task; these were not website screenshots.

## 2. Original homepage background assets inspected

Decoded `sitePages["/"]` programmatically and inspected its three background-bearing nodes. Each is a `div` with class `section section-text layout-cc` and the following inline style:

```text
background-image:url("<original URL>");background-position:center center;
```

| Section | Exact child-index path from `document.nodes` | Original URL | Pixel canvas | Aspect ratio |
| --- | --- | --- | --- | --- |
| Hero, index 0 | `[1,1,4,1,1,0]` | `/site-assets/ec8b6b2c4222396c44.png` | 2540 × 1250 | 2.032:1 |
| Image collection section, index 1 | `[1,1,4,1,1,1]` | `/site-assets/9def3725208290c4ef.png` | 2560 × 1370 | approximately 1.8686:1 |
| Brand section, index 2 | `[1,1,4,1,1,2]` | `/site-assets/46f8a1c412d65fd42b.png` | 2560 × 1370 | approximately 1.8686:1 |

Inspected these original PNGs directly and read their metadata with the already installed Sharp library. They contain a prominent sharp portrait panel with blurred photographic side regions within one wide raster. The hero is a closer portrait; the second shows more gown; the third is a larger central portrait. Their major subjects sit in the central region used by narrow-screen cropping.

There is no independently positioned three-image HTML arrangement to preserve. No new image elements, wrappers, grids or absolute-positioned photo containers were introduced. Panel bounds for the replacement recipes were chosen from inspection of the original photographic grouping; those bounds are practical approximations, not a pixel-diff reconstruction claim.

## 3. Selected Pexels photographs and credits

These are prototype sample photographs only. They are **not confirmed Redcarpert stock, actual Redcarpert customers or model endorsements**. No stock availability, ownership, customer relationship or endorsement wording was added. Existing homepage copy was left unchanged as instructed. The asset filenames explicitly include `pexels-sample`; source credit and demonstration context are recorded here for anyone presenting this prototype.

| Use | Verified Pexels source page | Photographer | Downloaded source dimensions |
| --- | --- | --- | --- |
| Hero: fitted/mermaid-style gown in a natural outdoor setting | [Elegant Asian bride on path in countryside — photo 5984238](https://www.pexels.com/photo/elegant-asian-bride-on-path-in-countryside-5984238/) | **Trần Long** | 4467 × 3000 |
| Collection: rear view of a full ball gown | [Woman in White Wedding Dress — photo 4277970](https://www.pexels.com/photo/woman-in-white-wedding-dress-4277970/) | **Thalia villa** | 1995 × 3000 |
| Brand: refined bridal portrait with bouquet and foliage | [Elegant Outdoor Bridal Portrait in Garden Setting — photo 29768159](https://www.pexels.com/photo/elegant-outdoor-bridal-portrait-in-garden-setting-29768159/) | **Jessica Iroh** | 2000 × 3000 |

Source verification: opened the Pexels pages through the web tool and checked the photographer attribution, photograph description and free-use/download link. Inspected the corresponding downloaded image files. The fitted-gown silhouette is an image-selection description, not a verified Redcarpert product category or inventory claim. The Pexels page for 4277970 includes a Ball Gown tag.

Actual selected CDN downloads, all saved under `/tmp`:

- `https://images.pexels.com/photos/5984238/pexels-photo-5984238.jpeg?auto=compress&cs=srgb&h=3000`
- `https://images.pexels.com/photos/4277970/pexels-photo-4277970.jpeg?auto=compress&cs=srgb&h=3000`
- `https://images.pexels.com/photos/29768159/pexels-photo-29768159.jpeg?auto=compress&cs=srgb&h=3000`

The [Pexels license page](https://www.pexels.com/license/) was also reviewed. It permits photo modification and website use and prohibits implying endorsement by pictured people or brands. Attribution is provided here even though the page does not require it. This is provenance documentation for the prototype, not a certification of future advertising or stock claims.

Several other candidates were investigated or downloaded temporarily but not used: photo 30921766 had a soft-focus monochrome treatment inconsistent with the selected group; 4661223 was not selected for the final arrangement; 11794629 was rejected because the candidate source page could not be fully accessed/verified. Other inaccessible candidate pages were likewise not used. None of those candidate downloads entered `public/`.

## 4. Replacement creation, dimensions and format

Used existing **Sharp 0.34.5** with deterministic cropping, resizing, blur and compositing. No AI-generated dress/model pixels, garment redesign, generative background fill or unrelated imagery was used. Python Pillow was unavailable; no package was installed to obtain it. Sharp was already present with the existing Next installation.

For each output:

1. Resize the selected real photograph to fill the original canvas with `fit: 'cover'`, centre positioning.
2. Blur that full-canvas photograph with Sharp blur sigma 22, supplying the side treatment.
3. Extract an explicitly chosen subject crop from the same photograph, resize it to the sharp central-panel dimensions, and composite it at the stated x coordinate, y = 0.
4. Encode one RGB WebP with quality 86, effort 6, retaining the exact original canvas width/height.

The crop/panel ratios match within integer-pixel rounding. No intentional subject stretching or garment retouching was performed. Each final file contains all photographic layers in one raster; layering is not performed by the website.

| Output under `public/redcarpert/home/` | Source ID | Canvas | Sharp panel x / y / width / height | Source crop left / top / width / height | File bytes |
| --- | --- | --- | --- | --- | ---: |
| `hero-pexels-sample.webp` | 5984238 | 2540 × 1250 | 580 / 0 / 1400 / 1250 | 1730 / 800 / 1960 / 1750 | 186,640 |
| `collection-pexels-sample.webp` | 4277970 | 2560 × 1370 | 566 / 0 / 1428 / 1370 | 295 / 600 / 1700 / 1631 | 329,186 |
| `brand-pexels-sample.webp` | 29768159 | 2560 × 1370 | 490 / 0 / 1580 / 1370 | 0 / 350 / 2000 / 1734 | 221,118 |

Total: **736,944 bytes**, approximately **720 KiB**. No unprocessed downloads or intermediate layers are in the repository.

Processing was run with `node /tmp/redcarpert-05-compose.cjs`. The temporary script used this pattern with the table's values:

```js
const background = await sharp(source)
  .resize(width, height, { fit: 'cover', position: 'centre' })
  .blur(22).toBuffer();
const panel = await sharp(source).extract(crop)
  .resize(panelWidth, height, { fit: 'fill' }).toBuffer();
await sharp(background).composite([{ input: panel, left, top: 0 }])
  .webp({ quality: 86, effort: 6 }).toFile(output);
```

Original and final image files were opened individually to inspect subjects and photographic grouping. No website screenshot or before/after pixel comparison was used. The final hero keeps a central fitted-gown subject; the middle shows the ball-gown/veil; the brand section keeps a dominant portrait surrounded by blurred side regions.

## 5. Exact implementation files changed

| Path | Change / purpose |
| --- | --- |
| `public/redcarpert/home/hero-pexels-sample.webp` | New optimised hero composite. |
| `public/redcarpert/home/collection-pexels-sample.webp` | New optimised collection composite. |
| `public/redcarpert/home/brand-pexels-sample.webp` | New optimised brand composite. |
| `src/lib/homepage-backgrounds.ts` | New 33-line homepage-only helper with a closed list of three approved URL mappings and strict original-section/style guards. |
| `src/components/SiteDocument.tsx` | Added one import and wrapped the existing text-adaptation result with the background helper. |
| `tests/homepage-backgrounds.test.mjs` | New 87-line focused suite verifying URL-only edits, source immutability, route isolation, fail-closed behavior and actual raster decoding/dimensions. |
| `codex-reports/05-homepage-imagery.md` | This report. |

No other existing source/test/report/package file was modified. In particular, `src/lib/content-adapter.ts`, `src/data/content-adaptations.ts` and `tests/content-adapter.test.mjs` are unchanged. Reports 01–04 remain unchanged. No original assets were deleted or overwritten, and no new dependencies or package/lock changes were made.

## 6. Composition and responsive preservation

Exact raster canvas sizes and aspect ratios match the original three assets. The replacement files preserve a broad central sharp panel over blurred sides, with a central photographic subject suitable for the existing centred crop. The brand section remains a single baked composite rather than new positioned HTML images. New subjects, poses, photographic colours and details naturally differ; the original photo content was intentionally replaced.

The homepage section tags, class lists, child counts/order, inline non-image declarations and renderer structure are unchanged. Existing `background-position:center center` remains byte-for-byte in the data handed to the renderer. Background-size still comes from the original theme CSS and computes to `cover`. No CSS file, media query, font, dimension, spacing, text placement or animation rule was edited.

Implementation 04 still supplies the two approved text strings through its original adapter rules. The new helper runs **after** text adaptation and preserves the resulting children, including `Redcarpert Wedding Dresses`, `Explore Wedding Dresses` and the existing `/product/` destination. Header/logo/navigation, the safe preview component and runtime scripts are unchanged.

The original mobile/device/fullscreen logic still determines section sizes. Browser checks confirmed all three new background URLs, full image decoding, `cover` and centred positioning at desktop/tablet/mobile sizes; these are nonvisual checks. No claim is made that every part of a gown is visible at every viewport: cover cropping is intentionally retained. No new breakpoint or mobile image switch was introduced.

## 7. Safe background URL replacement

The helper is a separate narrow mechanism, not a general-purpose CSS rewriting API. It has only three static mappings:

```text
/site-assets/ec8b6b2c4222396c44.png → /redcarpert/home/hero-pexels-sample.webp
/site-assets/9def3725208290c4ef.png → /redcarpert/home/collection-pexels-sample.webp
/site-assets/46f8a1c412d65fd42b.png → /redcarpert/home/brand-pexels-sample.webp
```

Behavior:

- Immediately returns the original document object for any route other than `/`.
- Follows each inspected exact child-index path, rather than searching all pages or rewriting every occurrence of a URL.
- Requires the target to be `div.section.section-text.layout-cc` and requires its **entire original inline style string** to match the known value, including URL, quotes and `background-position` declaration.
- Changes only the single known URL substring. Every other style character is preserved; no parser, CSS normalization or stylesheet rewrite is introduced.
- Copies only the relevant node/ancestor arrays and attributes. Original nodes/data remain untouched even if a later target fails.
- Throws a clear error if a section is missing/reordered, its tag/class differs, its original URL differs, or an unexpected extra declaration appears. Reapplying the helper to an already adapted document also fails rather than silently accepting the wrong input.

The existing content adapter's style/class/dimension/plugin protections are not relaxed. `src/data/site.ts` remains untouched. The source's original settings suppression and WhatsApp capture logic remain unchanged.

## 8. Tests, commands and actual results

### Inspection and preparation

Read previous report context and current adapter/rules/renderer/tests/package files with `cat` and selective Python report reads. Used read-only Python JSON traversal for the three actual background nodes, and `sharp(...).metadata()` for original/downloaded image dimensions. Used `git status --short`, `git diff --check`, `git diff --stat`, `wc -l`, and source/asset SHA-256 baseline/comparison scripts. Checked available image tooling and selected the already installed Sharp library.

An initial inspection command attempted `from PIL import Image` and failed with `ModuleNotFoundError: No module named 'PIL'`. No file writes from that Python script occurred before the import failure. Reran the inspection/baseline capture without Pillow and used Sharp instead. No package was installed.

Pexels sources and licensing were checked using web search/open tools. Some unselected candidate pages returned web-tool cache misses; a direct curl request for candidate 11794629's source page returned HTTP 403. That candidate was not used. The three selected source pages were successfully read with attribution information before use.

CDN downloads used `curl --fail --location --max-time 60 ... --output /tmp/redcarpert-05-<id>.jpg`. The first sandboxed CDN attempt failed with `Could not resolve host: images.pexels.com`; the approved network rerun succeeded. Subsequent approved candidate/selected downloads succeeded. Only selected final WebP composites were written into the project. Raw photographs, the composition script, test runners and hash baselines remained under `/tmp`.

### Required verification

| Command | Actual result |
| --- | --- |
| `node --experimental-strip-types tests/content-adapter.test.mjs` | Passed: 9 tests, 0 failures, exit 0. Existing Phase 04 exact text and original protection tests remain intact. |
| `node --experimental-strip-types tests/homepage-backgrounds.test.mjs` | Passed: 4 tests, 0 failures, exit 0. |
| `npm run lint` | Passed, exit 0; no lint warnings/errors printed. |
| `npm run typecheck` | Passed, exit 0. |
| `npm run build` | Passed with existing approval outside the sandbox, exit 0. Compilation 13.6s, TypeScript 5.8s, 146/146 static outputs generated in 5.0s. |
| `git diff --check` | Passed, no output. |

Native Node TypeScript imports emitted the previously documented `MODULE_TYPELESS_PACKAGE_JSON` loader warning. It is not a failing test, and package configuration was not changed to suppress it.

The four new tests verify:

1. The complete adapted homepage equals the text-adapted homepage with only the three specified URL substrings changed. Every other field/attribute/text/structure remains equal; non-node runtime/style fields retain references and the header subtree remains shared.
2. All 143 captured original documents remain immutable, source-content hashes are unchanged and the other 142 routes retain exact object/image-reference identity.
3. Unexpected URLs, extra style declarations, changed tags/classes, missing paths and reordered sections fail closed. Failure at a later section cannot mutate the input despite an earlier successful replacement.
4. Each new file fully decodes as WebP, matches the exact original canvas dimensions and is under 1 MB.

### Production routes, assets and interactions

Started a temporary server with:

```text
npm run start -- --hostname 127.0.0.1 --port 3002
```

Next became ready. Its existing `output: standalone` launcher warning appeared: it recommends `.next/standalone/server.js` instead of `next start`. The local server served these tests; no deployment packaging change or standalone deployment certification is claimed.

Reused the existing all-route checker:

```text
node /tmp/redcarpert-03-routes.cjs
```

Actual output, exit 0:

```json
{"capturedRoutes":143,"manifestMissing":[],"http200":143,"previewPresent":143,"originalChatSettingsOmitted":143}
```

Explicit HTTP image checks returned:

```text
hero-pexels-sample.webp        200 image/webp 186640
collection-pexels-sample.webp  200 image/webp 329186
brand-pexels-sample.webp       200 image/webp 221118
```

Ran the temporary nonvisual homepage runner, extending the prior functional checks with background URL/computed-rule/decode assertions:

```text
PLAYWRIGHT_BROWSERS_PATH=/tmp/redcarpert-playwright node /tmp/redcarpert-05-homepage-test.cjs
```

Passed, exit 0, on Chromium desktop 1440×900, tablet 768×1024 with iPad emulation and mobile 390×844 with iPhone emulation:

- All three new local URLs are used by the three existing sections.
- Every image loads with the expected natural canvas dimensions.
- All three backgrounds compute to `cover` and `50% 50%` positioning.
- Phase 04 brand/CTA text and original collection title/tagline/logo remain correct.
- Actual hero click/tap opens the existing catalogue containing product cards.
- Safe WhatsApp preview opens, copies, closes with Escape/Close, supports Enter and returns focus.

Additional desktop checks passed: fullscreen wheel navigation advances and returns after closing the preview; existing Contact and logo/Home header links work.

Final summary:

```json
{"deviceCases":3,"waRequests":0,"popups":0,"pageErrors":[]}
```

`window.open` was instrumented and remained unused. Nonlocal browser requests were blocked; WhatsApp attempts would have been counted before aborting, and none occurred. No recipient was contacted. Existing browser binaries/libraries were reused without installation. No screenshots were produced by these checks. The temporary server was stopped intentionally with Ctrl+C (exit 130).

### Preservation verification

SHA-256 comparison of pre-existing source/test/report/package files found only `src/components/SiteDocument.tsx` changed. The helper, its tests and final WebP files are new. A separate baseline of **361** existing theme `.js`/`.css` files plus the three original PNGs found **zero changed or missing files**. Original source-data hash remains:

```text
20b2cc31c3f50dc25290f14f1403bc4b98b9aeafd5a490ffd784976664500616
```

All original assets were left intact; only the new `public/redcarpert/home/` directory is added under public. Final Git outputs are included below.

## 9. Git status and diff summary

The initial working tree was clean. The tracked renderer diff is one import and one expression wrapping the existing adaptation result: 2 insertions, 1 deletion. New untracked assets/helper/tests/report do not appear in `git diff --stat`.

Final observed `git status --short` after report creation:

```text
 M src/components/SiteDocument.tsx
?? codex-reports/05-homepage-imagery.md
?? public/redcarpert/
?? src/lib/homepage-backgrounds.ts
?? tests/homepage-backgrounds.test.mjs
```

Final observed `git diff --stat`:

```text
 src/components/SiteDocument.tsx | 3 ++-
 1 file changed, 2 insertions(+), 1 deletion(-)
```

Untracked files separately reported by `git ls-files --others --exclude-standard`:

```text
codex-reports/05-homepage-imagery.md
public/redcarpert/home/brand-pexels-sample.webp
public/redcarpert/home/collection-pexels-sample.webp
public/redcarpert/home/hero-pexels-sample.webp
src/lib/homepage-backgrounds.ts
tests/homepage-backgrounds.test.mjs
```

The new helper/tests total 120 source lines and the three final assets total 736,944 bytes; this report is additional documentation. Final hash comparison again found only the expected renderer edit among pre-existing source/test/report/package files, and no changed/missing files in the 361-file theme/original-background baseline. The report directory contains only reports 01–05. The report was then updated only to record the final results. No files were staged, committed or pushed.

## 10. Outstanding issues and limitations

- Composition preserves canvas dimensions, central-panel/blurred-side treatment and responsive mechanism, not the identity, pose or exact anatomy/position of the original model. Photographic differences are intentional; no pixel-identical claim is made.
- Original asset and replacement raster inspection was performed, but no website screenshot, visual comparison or pixel-diff test was performed. Subject cropping, overlay text contrast and photographic preference still need human review in the prototype. No CSS changes were made to compensate for new photographs.
- Chromium emulation passed at the three stated sizes; physical devices, Safari, Firefox and assistive technologies were not tested. Cover cropping can hide gown details on narrow screens, as in the original mechanism; no alternative mobile composition was invented.
- The selected photographs are demonstration material only, not verified Redcarpert inventory or endorsement. Keep that context when presenting the prototype. No product/customer/stock assertions were added, and unrelated copy was not rewritten to add disclosures in this task.
- The original logo remains because no approved Redcarpert asset was provided. Navigation/social links, catalogue data and other pages retain their existing content as required.
- Python Pillow was unavailable and some unselected Pexels source pages were inaccessible. These were resolved by existing Sharp tooling and alternative verified sources, without installs or unverified replacement imagery.
- Existing Node module-type and Next standalone-launch warnings are recorded above. No remaining required-test/build/HTTP/interaction failure is known.
- Temporary processing files are not permanent regeneration tooling. The source links, exact crop/encoding recipe and dimensions above enable independent reproduction without retaining unprocessed downloads in the repository.

## 11. Recommended next implementation task

Review the three photographic composites and their crop/contrast in the prototype before further content work. Then, when a client-approved Redcarpert logo asset is available, scope its replacement separately with the original canvas, sizing and alignment preserved. Do not invent a logo or bundle catalogue, navigation, footer or layout changes into that task.

No next-stage implementation has been performed. Stop here for independent review and further approval.
