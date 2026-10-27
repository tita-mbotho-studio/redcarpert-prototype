# 08B — Wedding Dress Detail Prototype

Current gallery status: the final correction below supersedes the earlier contain/letterbox presentation. Both previews now use clean source-photo portrait crops with shared cover sizing, and their legacy SHARE blocks are removed. Earlier measurements remain as history.

Started on `main` after `git status --porcelain=v1 --untracked-files=all` returned no changes. No staging, commit or push authorized.

## Original captured layout (recorded before implementation)

Measured `/product/arabella` and `/product/aventhera` in Chromium, CSS pixels, viewport height 1000, scale 1, scroll zero, fonts loaded and Slick initialized. Existing shared branding/runtime adaptations remain active in both baseline and preview comparisons. The original captured data and theme files are unchanged. Full precision logs: `/tmp/08b-original.jsonl`.

| Capture | Width | Content x / y / width | Gallery width × height | Main image frame height | Thumbnail row height | Summary x / y / width | Description tabs x / y / width |
| --- | ---: | --- | --- | ---: | ---: | --- | --- |
| /product/arabella | 1440 | 168 / 311 / 1104 | 529.90625 × 938 | 790 | 133 | 742.09375 / 311 / 529.90625 | 742.09375 / 451.71875 / 529.90625 |
| /product/arabella | 1024 | 69.21875 / 345.890625 / 885.546875 | 425.0625 × 756.96875 | 634.96875 | 107 | 529.703125 / 345.890625 / 425.0625 | 529.703125 / 486.609375 / 425.0625 |
| /product/arabella | 768 | 51.90625 / 143.875 / 664.171875 | 664.171875 × 1173.21875 | 991.21875 | 167 | 51.90625 / 1343.09375 / 664.171875 | 51.90625 / 1483.8125 / 664.171875 |
| /product/arabella | 390 | 26.34375 / 129.65625 / 337.28125 | 337.28125 × 631.796875 | 503.796875 | 113 | 26.34375 / 787.453125 / 337.28125 | 26.34375 / 928.171875 / 337.28125 |
| /product/arabella | 320 | 21.625 / 127.03125 / 276.734375 | 276.734375 × 521.015625 | 413.015625 | 93 | 21.625 / 674.046875 / 276.734375 | 21.625 / 836.859375 / 276.734375 |
| /product/aventhera | 1440 | 168 / 311 / 1104 | 529.90625 × 857.8125 | 709.8125 | 133 | 742.09375 / 311 / 529.90625 | 742.09375 / 451.71875 / 529.90625 |
| /product/aventhera | 1024 | 69.21875 / 345.890625 / 885.546875 | 425.0625 × 692.53125 | 570.53125 | 107 | 529.703125 / 345.890625 / 425.0625 | 529.703125 / 486.609375 / 425.0625 |
| /product/aventhera | 768 | 51.90625 / 143.875 / 664.171875 | 664.171875 × 1072.984375 | 890.984375 | 167 | 51.90625 / 1242.859375 / 664.171875 | 51.90625 / 1383.578125 / 664.171875 |
| /product/aventhera | 390 | 26.34375 / 129.65625 / 337.28125 | 337.28125 × 580.671875 | 452.671875 | 113 | 26.34375 / 736.328125 / 337.28125 | 26.34375 / 877.046875 / 337.28125 |
| /product/aventhera | 320 | 21.625 / 127.03125 / 276.734375 | 276.734375 × 478.96875 | 370.96875 | 93 | 21.625 / 632 / 276.734375 | 21.625 / 794.8125 / 276.734375 |

Desktop gallery and summary widths are 48%, separated by 4%; description tabs float right at 48%. At max-width 768px both columns and tabs become full width, stacked gallery → summary → description. Gallery and summary each have 26px bottom margin. The slider has 15px bottom margin. Main images use natural height, rounded Slick slide widths; Arabella source is 848×1264 (53:79), Aventhéra is 896×1200 (56:75). This is a content-dependent ratio, not a universal theme aspect ratio. Thumbnail sources are 150×150; Slick shows four at widths ≥767px and three below 767px. Gallery arrows are 40×35px and fade in on hover. The source CSS has a max-width 500px rule hiding `.slick-prev/.slick-next` (the plugin custom `.btn-prev/.btn-next` names differ).

The title is Montserrat 30px, weight 700, uppercase, line-height 51px, zero margin/padding. Body/description/category text is Open Sans 13px / 22.1px; paragraph margins are 7px top/bottom. The legacy shipping paragraph uses the price class, 16.25px / 27.625px and 7px vertical margins. Summary is 114.71875px tall, except 320px where category wrapping makes it 136.8125px. Description tab navigation is 29.6875px high, wrapping to 59.375px at 320px.

Both captures have no breadcrumb markup, no actual numeric price, quantity selector, size selector, add-to-cart form or checkout control in the product content. The price slot says “Worldwide Shipping”. Product wrappers carry `instock` and commerce classes. Each has description/reviews tabs, a review form and three related legacy products with shipping captions; these cannot carry into sample previews. The shared header contains the previously hidden legacy cart; protected shared header markup stays unchanged.

Gallery source: Arabella has five slides (including a duplicate first image); Aventhéra has four. WPGIS/Slick enables horizontal thumbnails, selection, swipe, autoplay, hover zoom and Fancybox expansion. `product-gallery-settings.js` disables the Woo core gallery in favor of WPGIS. No screenshots or visual-diff artifacts were generated.

## Implemented previews and adaptation

- Sample 01 — Mermaid: `/product/preview/sample-01-mermaid`.
- Sample 02 — Ball Gown: `/product/preview/sample-02-ball-gown`.

These are explicit, collision-free demonstration destinations in a separate preview namespace. Both records retain `detailReference: null`; the new `previewRoute` is separately documented and never treated as a verified client product. Existing category and catalogue cards use these routes. Unknown preview paths return 404. Legacy capture routes are resolved unchanged.

A guarded immutable adapter uses Arabella's captured layout for both demonstrations, checking the original product root, section structure, gallery count/frame, title, shipping slot, tabs and related products. Only the product subtree is replaced; header/footer/chat subtrees retain identity. All captured stylesheets, theme configuration and gallery scripts are reused. Original captured data and theme source files are not edited. Minimal catch-all route integration adds the two static routes and their sample metadata.

The sample photographs remain the local catalogue assets: Mermaid 2540×1250 and Ball Gown 2560×1370. There is one source image/slide per preview, with no duplicate slides, thumbnail strip, autoplay navigation or slide arrows. WPGIS may create a presentation-only zoom image and Fancybox's enlargement of that same photograph; these do not represent additional gallery photographs. The existing expand action and pointer zoom work. The frame keeps Arabella's nominal 848:1264 portrait ratio; `object-fit: contain` preserves the complete wide photograph without distortion or cropping, so white space inside the portrait frame is intentional. Fullscreen enlargement shows the natural photograph.

The original title class, category metadata, description-tab layout, fonts, margins and responsive rules remain. The shipping paragraph is replaced with “Sample imagery — not confirmed Redcarpert inventory”, using its original font scale/margins. Category links target the existing Mermaid/Ball Gown listing. The description/reviews content becomes one “Sample information” section stating only that the photograph is stock and dress information awaits client confirmation. Reviews, review form and related legacy products are removed. No sizes, materials, price, quantity, purchase, shipping or availability claims are added. The new root omits legacy stock and product-type classes. A scoped clearfix contains the inherited floated columns now that the related-product section no longer clears them.

“Enquire About a Fitting” uses the existing theme button style and `data-whatsapp-preview` trigger. The existing enquiry component is unchanged. An optional message prop is passed through SiteDocument/SiteRuntime only for the preview routes; regular pages keep their general message. Each preview message names the sample demonstration, explicitly acknowledges sample imagery and asks about a fitting. The dialog remains preview-only with Copy Message/Close, no recipient, no WhatsApp destination and no external sending.

## Original versus adapted geometry

All five widths were compared for both sample pages. The figures below apply to both previews; the Arabella capture is the common layout baseline. Column x/width and gallery origins match exactly. Title and paragraph font family, size, line-height, weight, margin and padding match computed baseline values. Longer sample titles wrap to two lines at 390/320px using the original 30px typography.

| Width | Gallery x / y / width | Original main frame height | Preview main frame height | Preview gallery height (no thumbnails) | Preview summary x / y / width | Preview summary height | Preview tabs y / width | Summary y delta | Tabs y delta |
| ---: | --- | ---: | ---: | ---: | --- | ---: | --- | ---: | ---: |
| 1440 | 168 / 311 / 529.90625 | 790 | 790 | 805 | 742.09375 / 311 / 529.90625 | 162.71875 | 499.71875 / 529.90625 | 0 | 48 |
| 1024 | 69.21875 / 345.890625 / 425.0625 | 634.96875 | 634.96875 | 649.96875 | 529.703125 / 345.890625 / 425.0625 | 162.71875 | 534.609375 / 425.0625 | 0 | 48 |
| 768 | 51.90625 / 143.875 / 664.171875 | 991.21875 | 991.21875 | 991.21875 | 51.90625 / 1161.09375 / 664.171875 | 155.71875 | 1342.8125 / 664.171875 | -182 | -141 |
| 390 | 26.34375 / 129.65625 / 337.28125 | 503.796875 | 503.796875 | 503.796875 | 26.34375 / 659.453125 / 337.28125 | 234.34375 | 919.796875 / 337.28125 | -128 | -8.375 |
| 320 | 21.625 / 127.03125 / 276.734375 | 413.015625 | 412.875 | 412.875 | 21.625 / 565.90625 / 276.734375 | 234.34375 | 826.25 / 276.734375 | -108.140625 | -10.609375 |

The 0.140625px frame-height difference at 320px is the difference between the nominal 848:1264 frame and the capture's rounded responsive image candidate; widths and origins remain exact. On mobile the removed thumbnail strip and its 15px slider margin bring the summary upward by 182px at 768px, 128px at 390px and 108.140625px at 320px. On desktop the main slider's 15px bottom margin remains inside the floated gallery; on stacked mobile it collapses with the gallery's existing 26px margin. These are unchanged source float/margin rules. No artificial thumbnail-space placeholder was inserted. Summary/tab heights change from the factual sample notice, longer title and fitting action; the desktop tabs move down 48px. Overall page height is shorter because fabricated descriptions, reviews and related legacy inventory are not carried into a demonstration.

Automated geometry assertions passed all ten preview cases: content/gallery/main/summary/tab x and widths, gallery y, nominal main-frame heights (≤0.140625px candidate rounding), title and paragraph typography, one slide, no thumbnails/related section, contained floats and no horizontal scrolling. Raw final measurements: `/tmp/08b-adapted.jsonl`.

Enabling card destinations was separately tested by measuring each current linked catalogue against its previous disabled-anchor state in the same live DOM. All card/grid/image/title/caption rectangles and typography matched exactly on all three catalogue routes at all five widths (15 cases); no catalogue CSS was changed. Log: `/tmp/08b-grid.log`.

## Legacy exposure retained for later safety cleanup

The source contains 119 legacy detail routes plus `/product/page/2`, all still generated and directly addressable. Fifteen unadapted listing routes (other categories, tags, brands and pagination) still expose legacy catalogue content. Legacy detail pages retain their own descriptions, reviews/forms, stock classes, shipping captions, gallery inventory and related-product links. The captures contain 1,007 anchors to legacy detail routes before existing adaptations; that is a source count, not a count of currently exposed rendered links. Preview content has no legacy product links. The protected shared header retains its pre-existing hidden legacy cart markup. Route retirement, broader legacy-listing sanitization, search/indexing policy and shared cart cleanup are explicitly deferred; none is silently changed by 08B.

## Outstanding client information

Client-confirmed product identities, names, category mapping, approved portrait photographs and genuine additional gallery photographs, approved descriptive copy and any fitting-specific details remain unavailable. The WhatsApp Business recipient is unconfirmed. Verified detail references stay null until client mapping is confirmed. The sample category labels describe the existing demonstration records and are not claims of actual inventory. No prices, sizes, materials, stock or shipping facts have been inferred.

## Validation and review status

- `node --experimental-strip-types --test tests/*.test.mjs`: passed, 11 test files, zero failures. Coverage includes immutable source/protected subtrees, one genuine image/slide, explicit routes/null verified references, no commerce or inherited claims, sample-specific enquiry content, and fail-closed guards for changed captures or unverified mappings.
- `npm run lint`: passed, exit 0.
- `npm run typecheck`: passed, exit 0, including a final run after restoring build-generated `next-env.d.ts` churn.
- `npm run build -- --webpack`: passed, exit 0; 148 static pages generated. Log: `/tmp/08b-build.log`.
- Responsive geometry/typography: all ten preview cases passed at 1440, 1024, 768, 390 and 320px. All fifteen catalogue geometry cases passed.
- Original gallery thumbnail selection, pointer zoom and Fancybox lightbox passed. Both previews passed at all five widths: single slide/no thumbnail or slide arrows, pointer zoom, natural-image enlargement and Escape close, fitting trigger by keyboard/click, correct per-sample message, Copy Message status, Close/Escape and trigger-focus restoration, category navigation and return through sample cards, correct main navigation ancestor/category destinations, absence of product commerce controls or legacy product links, and no horizontal overflow. Unknown preview returned 404; main `/product` sample destinations were verified. Browser log: `/tmp/08b-functional.log` (final result PASS, zero page errors and zero external requests).
- Additional enquiry/tab smoke checks passed: the catalogue's floating action retains the general enquiry message, the sample-information tab opens, and dialog Tab/Shift+Tab focus containment and Escape work. Log: `/tmp/08b-enquiry-smoke.log`.
- `git diff --check`: passed; new files also checked with `git diff --no-index --check` (no whitespace diagnostics). Reviewed changed paths: only preview implementation, catalogue link/data integration, optional enquiry-message wiring, tests and this report. The automatically generated root `AGENTS.md` and build-generated `next-env.d.ts` changes were removed/restored; no framework configuration was changed.

No screenshots or visual-diff artifacts were generated. No staging, commit or push was performed. Implementation is stopped for review.

## Final product gallery correction — 27 October 2026

Continued the existing uncommitted 08B implementation on `main`; no staging, commit or push. This correction changes only preview gallery sourcing/sizing, the preview-only SHARE removal, associated tests and this report. It does not change approved homepage imagery, catalogue data/cards, descriptions, title styling, categories/links, fitting actions/messages, shared header/navigation, footer/social icons or floating WhatsApp behavior.

### Root cause and actual DOM inspection

Inspected the actual settled WPGIS/Slick DOM: `.images > .wpgis-slider-for > .slick-list > .slick-track > .zoom[data-sample-frame]`, with one visible source image, the expand anchor and a presentation-only `.zoomImg` injected by jQuery Zoom. Slick rounds its slide width to integer pixels while keeping the gallery column's fractional width. The existing frame is 848:1264 (53:79); it is retained. The source photo was previously a wide homepage composite using `object-fit: contain`, which centred the raster vertically. At 1440px this left 264.5866141732283px above Mermaid's painted photograph and 253.18359375px above Ball Gown's. This is image letterboxing inside a correctly placed gallery, rather than a margin, Slick offset or initialization defect.

The approved homepage files really contain blurred side regions in their pixels. The 05 imagery report records the intentional blur sigma 22 and sharp central-panel composition. The clean Pexels originals and the final gallery derivatives were opened individually for source-image inspection; no website screenshots were taken. CSS cover alone would still expose baked side effects, and centring the landscape Mermaid source would cut away the subject on its right.

### Clean sources, crop decisions and quality

Reused the exact documented source photographs, with current Pexels pages checked for photographer identity:

- Mermaid: [Trần Long, Pexels photo 5984238](https://www.pexels.com/photo/elegant-asian-bride-on-path-in-countryside-5984238/). Downloaded `https://images.pexels.com/photos/5984238/pexels-photo-5984238.jpeg?auto=compress&cs=srgb&h=3000`; decoded 4467×3000.
- Ball Gown: [Thalia villa, Pexels photo 4277970](https://www.pexels.com/photo/woman-in-white-wedding-dress-4277970/). Downloaded `https://images.pexels.com/photos/4277970/pexels-photo-4277970.jpeg?auto=compress&cs=srgb&h=3000`; decoded 1995×3000.

| Gallery asset under public/redcarpert/gallery | Source crop left / top / width / height | Output pixels | Bytes | Removed source margins left / top / right / bottom |
| --- | --- | --- | ---: | --- |
| sample-01-mermaid-pexels.webp | 2250 / 472 / 1696 / 2528 | 1696×2528 | 604212 | 2250 / 472 / 521 / 0 |
| sample-02-ball-gown-pexels.webp | 250 / 450 / 1484 / 2212 | 1484×2212 | 679488 | 250 / 450 / 261 / 338 |

Used the already installed Sharp library: `sharp(source).extract(crop).webp({quality:92,effort:6})`. No resizing, stretching, compositing, blur, AI generation, background fill, retouching or new dependency. Both exact crops already have the common 53:79 ratio and no alpha channel. They exceed twice the largest tested display width (665px), so normal display does not upscale them. Zoom/enlargement uses the same crisp local derivative instead of the blurred composite.

Mermaid's crop deliberately follows the bride on the right of the landscape photograph. It keeps her head, body, bouquet, fitted silhouette, front hem and most of the train. It removes surrounding scenery, some sky and the far-right trailing end of the gown; the train visibly continues beyond the right crop boundary. This is an unavoidable compositional compromise for this landscape source in the protected portrait frame, explicitly retained for visual review. Ball Gown's portrait crop removes surrounding vegetation/foreground while preserving her head, back, veil and the visible full gown/hem. Both retain natural photographic background softness; neither adds artificial blurred side panels.

The bride/garment is the crop priority, not blind centring of the source. Focal positioning is prepared in these source crop rectangles. Both runtime images then use exactly the same `object-fit: cover; object-position: center` rule, with no category-specific selectors, offsets or breakpoint changes. Fractional CSS raster rounding can crop a tiny edge fraction beyond the prepared crop; it creates no letterbox. A client-approved portrait showing the Mermaid train end-to-end is recommended if full-train visibility is required. No missing gown detail was invented to make the landscape source fit.

### Narrow implementation and SHARE removal

Changed files for this correction:

- `src/components/ProductDetailPreview.css`: changes the existing scoped source-image rule from contain to cover, adds centred positioning; keeps all frame, column, margin and responsive rules.
- `src/lib/product-detail-preview.ts`: supplies explicit clean gallery asset metadata for each sample; source image, zoom and Fancybox all resolve to that same photograph. Removes the complete captured SHARE sibling using a guarded immutable traversal.
- `public/redcarpert/gallery/sample-01-mermaid-pexels.webp` and `sample-02-ball-gown-pexels.webp`: the two production gallery assets described above.
- `tests/product-detail-preview.test.mjs`: checks correct image/expansion source and intrinsic dimensions, portrait asset decoding, no transparency, complete SHARE removal and fail-closed behavior for unexpected SHARE markup/destinations.
- This report.

The legacy `.social-share` block sits after the product root inside the content box; it was outside 08B's replaced product subtree. It contained Facebook, Twitter, Google+ and Pinterest items whose data URLs still pointed to Bridal Vanesa Arabella. The adapter now verifies one matching sibling, its title, platforms and original destinations, then removes that entire node before rendering/theme initialization. It leaves no hidden share links or empty SHARE wrapper. Existing clear elements retain natural float clearing. The original source document is immutable, so `/product/arabella` and other captured legacy pages retain their SHARE sections. Footer social markup does not use this target and remains unchanged.

### Exact geometry comparisons

Chromium, CSS pixels, height 1000, scale 1, fonts loaded and gallery initialized. Both corrected previews have identical gallery/image geometry at every width. Original captured Arabella dimensions are included to distinguish the original clone from the pre-correction 08B preview. The current correction changes none of the pre-correction rectangles.

| Viewport | Gallery x / y / column width (both before and after) | Captured Arabella main height | Preview main height before → after | Rounded slide/image width | Mermaid top letterbox before → after | Ball Gown top letterbox before → after |
| ---: | --- | ---: | --- | ---: | --- | --- |
| 1440 | 168 / 311 / 529.90625 | 790 | 790 → 790 | 530 | 264.586614 → 0 | 253.183594 → 0 |
| 1024 | 69.21875 / 345.890625 / 425.0625 | 634.96875 | 634.96875 → 634.96875 | 426 | 212.661540 → 0 | 203.496094 → 0 |
| 768 | 51.90625 / 143.875 / 664.171875 | 991.21875 | 991.21875 → 991.21875 | 665 | 331.977485 → 0 | 317.669922 → 0 |
| 390 | 26.34375 / 129.65625 / 337.28125 | 503.796875 | 503.796875 → 503.796875 | 338 | 168.729146 → 0 | 161.457031 → 0 |
| 320 | 21.625 / 127.03125 / 276.734375 | 413.015625 | 412.875 → 412.875 | 277 | 138.278051 → 0 | 132.318359 → 0 |

The 0.140625px difference between captured Arabella and the preview at 320px was already present before this correction, from the original responsive candidate's aspect rounding. Both corrected categories remain exactly equal to the pre-correction preview frame. Desktop keeps the two 48% gallery/summary columns and 4% gap; max-width 768px keeps the original stacked layout. Computed title/category/information/button rectangles and font properties match the pre-correction values at all ten cases. Their immutable summary/information DOM also compares exactly to the saved pre-correction documents. SHARE removal shortens the page naturally below the product, without changing product information or leaving a placeholder.

### Responsive and functional verification

All ten cases (both products × 1440, 1024, 768, 390, 320px) passed:

- Initial source-image visibility and decode with the WPGIS initializer temporarily held: image begins at the frame's top edge, has the same dimensions as the frame, and uses shared cover/centre sizing. This proves visibility does not depend on Slick initializing or a later scroll/hover workaround. After release, the inherited integer slide rounding occurs as before; no added offsets.
- Source/slide/frame rectangles and both-category equality; zero calculated top/side letterboxing and zero horizontal overflow. Natural image ratios match the frame and no distortion/upscaling occurs at the tested widths.
- Scroll to page bottom and return to top, with exactly stable settled gallery x/y/width/height.
- Pointer-entry zoom becomes visible, uses the clean local photograph and covers the whole frame. The single-photo expand action opens Fancybox on the same derivative; Escape closes it. No duplicate gallery slides, thumbnails or slide-navigation controls are introduced.
- Fitting enquiry opens with the correct existing product-specific message and no-send notice; Escape closes and restores focus. Existing product information and action labels are unchanged.
- No SHARE title/items/destinations remain anywhere on the previews. All five approved footer social items remain. A direct legacy Arabella check retains its SHARE block and the same five footer items.
- No page JavaScript errors and no external browser requests during the regression run.

Rechecked all three existing catalogue routes at all five widths: 15 cases passed, approved card/image/title/caption/grid geometry and typography unchanged, and both explicit preview destinations intact. Catalogue/homepage image references are unchanged.

Raw nonvisual measurements/logs: `/tmp/08b-gallery-before.jsonl`, `/tmp/08b-gallery-after.jsonl`, `/tmp/08b-gallery-regression.jsonl`, `/tmp/08b-gallery-grid.log`. These are temporary numeric/DOM logs, not screenshots, pixel-diffs or evidence folders. Only the actual two gallery assets were created under public.

### Validation and remaining limitations

All relevant automated tests (11 test files), lint, typecheck and the webpack production build passed; the build generated 148 static pages. Asset tests fully decode the two WebPs, verify exact intrinsic sizes/common portrait ratio and absence of transparency. Guard tests cover missing/changed SHARE markup and altered legacy share destinations. The original capture, theme CSS/JavaScript, approved homepage composites, catalogue data and enquiry component are checked against their pre-correction hashes. Final diff/whitespace checks and hash results are recorded below.

The Mermaid train-end crop is explicitly subject to visual approval; request a suitable portrait source if the full train is mandatory. Natural source background depth-of-field remains. Actual client inventory/product details, additional genuine photographs and the WhatsApp Business recipient remain unconfirmed; both verified detail references stay null. No commerce or stock claims were introduced. Physical devices and other browser engines have not been tested.

No screenshots, pixel-diff images or evidence directories were created. No files were staged, committed or pushed. Stop for visual review.

Final correction checks: all 364 protected file hashes match the pre-correction baseline; `git diff --check` and new-file whitespace checks pass; the final restored-`next-env.d.ts` typecheck exits 0. The build's generated environment-file change was restored. The staging area is empty. The final browser run exits 0 with all ten initial-load/scroll/zoom/enlargement/enquiry cases passing, legacy SHARE retained, five footer social items retained, zero page errors and zero external requests. Catalogue regression exits 0 for all fifteen cases. Changes remain uncommitted for visual review.
