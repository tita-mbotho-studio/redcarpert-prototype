# 08A — Expanded Catalogue Responsive Comparison

Current status: the narrow heading displacement has been corrected. See the dated correction section below for exact measurements and validation; the original audit is retained as history.

## Finding

Completed all 30 requested route/width combinations. **One unintended layout difference was found:** on `/product` at 320px and 375px, the renamed “Wedding Dresses” heading wraps, increasing the page-title banner from 90px to 97px and moving the grid **7px downward**.

Otherwise, matched card/thumbnail/title/caption rectangles, typography, margins, padding and hover styling remain unchanged. The intentional thumbnail `aspect-ratio` and `object-fit` changes are documented below. No horizontal overflow or page JavaScript errors occurred.

This is a read-only audit of the existing 08A implementation, not a new implementation phase. No fixes were applied. This Markdown report was saved afterward when the user asked for the report file. No code, screenshots, commits or pushes were produced.

## Method

Real Chromium, viewport height 900px, device scale factor 1, mouse-capable viewport emulation. Widths: 320, 375, 414, 640, 767, 768, 769, 1024, 1280 and 1440px. Routes: `/product`, `/product-category/mermaid` and `/product-category/ball_gown`.

Fonts and images were loaded before measurements. As in the 08A foundation report, the original captured listing content parent was temporarily substituted into the same live DOM and then restored. Matched comparisons retain the first two captured cards on `/product` and first captured card on each category page, matching the sample counts. This isolates the card presentation without inventing an inventory mapping. Complete original grids were measured separately to document their different heights.

Actual pointer hover was measured on the original captured cards and the adapted cards. All enumerated computed properties were compared for cards, anchors, thumbnails, titles and captions. A supplementary comparison measured all computed grid-container styles and restored the original “PRODUCTS” page heading, which is outside the listing-parent baseline. That supplementary check exposed the 7px shift.

Dimensions below are CSS pixels rounded to three decimals; unrounded values remain in the temporary measurement logs. Existing approved header/footer/runtime were retained for isolation, so this is a captured-listing comparison inside the same current site, not a reconstruction of the entire original branded site.

## Card and thumbnail rectangles

The following dimensions apply to all three routes, before and after adaptation. The first card starts at the grid origin. Its thumbnail starts at `(P, P)` within the card. On `/product`, card 2 has the same dimensions/y position and the grid-relative x coordinate below. Each category has one sample card.

| Width | Grid width | Card W × H | Thumbnail W × H | Padding P (top/left/right) | Card 2 x |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 320 | 300.812 | 143.469 × 284.453 | 137.469 × 164.953 | 3.000 | 157.344 |
| 375 | 352.500 | 168.109 × 313.297 | 161.078 × 193.281 | 3.516 | 184.391 |
| 414 | 389.188 | 185.625 × 333.797 | 177.844 × 213.406 | 3.891 | 203.562 |
| 640 | 601.625 | 286.969 × 452.438 | 274.938 × 329.922 | 6.016 | 314.656 |
| 767 | 721.000 | 343.891 × 519.078 | 329.484 × 395.375 | 7.203 | 377.109 |
| 768 | 721.938 | 344.359 × 519.625 | 329.922 × 395.906 | 7.219 | 377.578 |
| 769 | 722.875 | 159.734 × 298.062 | 145.297 × 174.344 | 7.219 | 187.203 |
| 1024 | 962.562 | 212.719 × 358.281 | 193.469 × 232.156 | 9.625 | 249.281 |
| 1280 | 1200.000 | 265.188 × 417.922 | 241.188 × 289.422 | 12.000 | 310.781 |
| 1440 | 1200.000 | 265.188 × 417.922 | 241.188 × 289.422 | 12.000 | 310.781 |

Card bottom padding is zero. Matched card, anchor, thumbnail, title and caption rectangle comparisons had no differences, including their document coordinates when the current page heading was retained.

## Grid origins, including the original heading

Document coordinates at scroll position zero. Both category routes have identical origins. These numbers include the supplementary original-heading restoration, so they expose the narrow-screen difference that the listing-parent-only comparison excludes.

| Width | Grid x | Original `/product` y | 08A `/product` y | Both category y values, unchanged |
| ---: | ---: | ---: | ---: | ---: |
| 320 | 9.594 | 300.188 | 307.188 | 361.188 |
| 375 | 11.250 | 300.188 | 307.188 | 361.188 |
| 414 | 12.406 | 300.188 | 300.188 | 361.188 |
| 640 | 19.188 | 265.094 | 265.094 | 326.094 |
| 767 | 23.000 | 265.094 | 265.094 | 326.094 |
| 768 | 23.031 | 265.094 | 265.094 | 326.094 |
| 769 | 23.062 | 315.094 | 315.094 | 376.094 |
| 1024 | 30.719 | 457.484 | 457.484 | 518.484 |
| 1280 | 40.000 | 413.094 | 413.094 | 474.094 |
| 1440 | 120.000 | 413.094 | 413.094 | 474.094 |

At 320/375px, the original “PRODUCTS” heading is 59px tall inside a 90px page-title banner. “Wedding Dresses” wraps to a 97px heading/banner, producing a 7px banner increase and downstream grid shift. At 414px and every larger tested width, the renamed heading does not shift the grid. Category headings show no corresponding shift.

Relative to the listing content box, grid y is 95.1875px on `/product` and 146.1875px on category pages at 320/375/414px. At the other requested widths, it is 60.09375px and 111.09375px respectively. These listing-relative origins match the captured parent baseline.

## Typography, margins, padding and hover

No differences were measured across matched cards:

- Card/anchor text: Open Sans, 13px, weight 400, normal style, line-height 22.1px.
- Titles: Montserrat, 25px, weight 100, normal style, line-height 42.5px; 10px top/bottom padding, zero margins, 62.5px title-box height. Title colour remains `rgb(221, 181, 119)`.
- Captions: Open Sans, 15px, weight 400, normal style, line-height 25.5px; 16px top padding, 2px solid `rgba(0,0,0,0.1)` top border, 7.5px bottom margin, 43.5px caption-box height.
- Card background remains white, card text `rgb(99,99,99)`, and anchor/caption colour `rgb(188,188,188)`.
- Card bottom margin remains 38.896px; top/left margins are zero. First-card right margin is zero through 768px and follows the original 3.8% desktop rule above it.
- Thumbnail bottom margin remains 3px; its transition remains `all 0.2s ease-in-out`.
- Grid padding remains zero, grid bottom margin remains 13px, other grid margins remain zero, and `clear: both` remains.
- Colours, backgrounds, shadows, transforms, opacity and all other enumerated computed hover properties match.

Exactly two computed thumbnail properties differ at every width, both normally and while hovered:

| Property | Captured | 08A |
| --- | --- | --- |
| `aspect-ratio` | `auto 370 / 444` | `370 / 444` |
| `object-fit` | `fill` | `cover` |

These are intentional adaptations for the existing wide local stock samples. They do not alter the thumbnail rectangles. Across the 40 matched cards, these account for all 80 normal computed-property differences and all 80 hovered-property differences. No other enumerated card or grid-container computed-style differences were found.

## Other differences

The result-count notice text changes to the sample-image notice. Its width changes without altering toolbar/grid wrapping at the requested widths:

- `/product`: 212.953125 → 248.59375px (+35.640625px).
- Both categories: 166.203125 → 248.59375px (+82.390625px).
- The ordering layout holder retains its measured 237px width; the former commerce control is hidden/disabled.

Card names, captions, source images, sample identifiers and disabled detail destinations differ intentionally. The shipping text becomes a sample caption, and `/product` pagination is removed. No numeric-price presentation is introduced. The original 100/78/36 cards are not treated as client inventory; 08A contains 2/1/1 samples, so complete-grid heights differ as follows.

| Width | Original `/product` grid height | Original Mermaid grid height | Original Ball Gown grid height | 08A grid height, all three routes |
| ---: | ---: | ---: | ---: | ---: |
| 320 | 16677.188 | 12737.906 | 5820.188 | 323.344 |
| 375 | 17906.875 | 13777.812 | 6339.375 | 352.188 |
| 414 | 18931.875 | 14577.312 | 6708.375 | 372.688 |
| 640 | 24693.906 | 19161.797 | 8843.906 | 491.328 |
| 767 | 28025.938 | 21760.781 | 10043.438 | 557.969 |
| 768 | 28053.281 | 21782.109 | 10053.281 | 558.516 |
| 769 | 8763.828 | 6866.562 | 3032.578 | 336.953 |
| 1024 | 10099.297 | 7985.938 | 3574.547 | 397.172 |
| 1280 | 11505.312 | 9136.250 | 4111.312 | 456.812 |
| 1440 | 11505.312 | 9136.250 | 4111.312 | 456.812 |

These whole-grid height differences are expected from the changed counts and content, not evidence of altered matched card proportions. Unmatched legacy cards have no invented one-to-one Redcarpert counterpart.

## Original CSS breakpoints confirmed

- **At or below 768px:** two catalogue columns. Original theme rules use 45.7% content width and 1% padding. The original `90c52a95f613e6f803.css` stylesheet is linked with `media="only screen and (max-width: 768px)"` and supplies the alternating floats/clearing.
- **At or above 769px:** four catalogue columns. Original theme rules use 20.1% content width and 1% padding.
- Original grid rules are in `public/site-assets/6814810d368ff64b55.css`, desktop rules around line 2704 and the max-width 768px override around line 2906.
- There is no catalogue-column change at 640px or 767px. In particular, 767 and 768 remain two-column; 769 switches to four-column.
- Generic theme `.col` breakpoints at 1000/520px do not apply to `li.product`. The footer's 640px stacking rule is also not a catalogue breakpoint.
- The observed 1200px grid width at 1280/1440px is a maximum-width cap, not a new column breakpoint.
- The 320/375px heading difference is content-driven wrapping, not a new CSS breakpoint.

## Overflow, errors and integrity

All 30 cases had no horizontal document overflow in the adapted, matched captured or complete captured listing. All original and adapted images decoded successfully. Page JavaScript error lists were empty at all ten widths.

The comparison made no repository code changes and did not run a build or modify the foundation report. Existing uncommitted 08A work remained intact. This report is the only repository file created in response to the follow-up request for a saved report. No screenshots, visual-diff images, commits or pushes were produced.

Temporary raw measurements: `/tmp/08a-expanded-results.jsonl`, `/tmp/08a-expanded-supplement.jsonl`, and `/tmp/08a-heading-results.jsonl`. These contain the unrounded rectangles, computed-style comparisons, overflow results and heading measurements.


## Narrow mobile heading correction — 27 October 2026

This correction supersedes the unresolved heading finding above; the preceding audit remains the historical pre-correction record.

Inspected the live captured `<h1>Wedding Dresses</h1>` inside `.page-title`, its boxed ancestor, and the actual loaded CSS cascade. The heading uses Montserrat, weight 700, uppercase transformation, -1px letter spacing, and mobile font-size 38px / line-height 1em. Its 10px bottom padding and underline (1px height, 10px top margin) make a single-line heading 59px tall. The captured inline banner rule sets height/min-height to 90px; table layout expands it when the wrapped heading reaches 97px. The theme's existing `#main-container .page-title h1` mobile rule supplies 38px. At 320/360/375px the boxed available widths are 300.8125/338.40625/352.5px, below the heading's natural 360.828125px single-line width. At 390px the available width is 366.59375px and the original 38px title fits.

The sole DOM adjustment adds `data-catalogue-heading="true"` to the adapted `/product` h1. The sole CSS adjustment targets that marker under the existing max-width 768px boundary and sets `font-size: min(38px, 9.9vw)`. Its inherited 1em line height scales proportionately. The cap reaches 38px at approximately 383.8384px, so larger widths retain existing typography. No nowrap, overflow hiding, fixed heading height, banner override, grid offset, or new layout breakpoint is introduced. Category headings receive no marker. Product cards, grid CSS, thumbnails, navigation, header, footer, source captures and other pages were not edited.

Measurements below use Chromium at height 900px and scale 1, after theme runtime settles and fonts load. Original means the captured “PRODUCTS” heading restored in the same live adapted page, with the new marker removed; pre-correction uses the unchanged “Wedding Dresses” heading before this fix. Coordinates are exact CSS pixels, at scroll zero. This preserves the prior report's controlled heading comparison.

| Width | Original grid y | Pre-correction grid y | Corrected grid y | Delta vs original | Corrected banner height | Font size / line height | Heading width × height |
| ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 320 | 300.1875 | 307.1875 | 300.1875 | 0 | 90 | 31.68px / 31.68px | 298.25 × 52.6875 |
| 360 | 300.1875 | 307.1875 | 300.1875 | 0 | 90 | 35.64px / 35.64px | 337.34375 × 56.640625 |
| 375 | 300.1875 | 307.1875 | 300.1875 | 0 | 90 | 37.125px / 37.125px | 352.03125 × 58.125 |
| 390 | 300.1875 | 300.1875 | 300.1875 | 0 | 90 | 38px / 38px | 360.828125 × 59 |
| 414 | 300.1875 | 300.1875 | 300.1875 | 0 | 90 | 38px / 38px | 360.828125 × 59 |
| 768 | 265.09375 | 265.09375 | 265.09375 | 0 | 90 | 38px / 38px | 360.828125 × 59 |
| 769 | 315.09375 | 315.09375 | 315.09375 | 0 | 90 | 38px / 38px | 360.828125 × 59 |

All seven corrected titles occupy one text line, with the text range width matching the heading width. All fit within the captured boxed width, and none causes document horizontal overflow. Banner height is exactly 90px at 320px and 375px (and at all seven tested widths). Both category pages were checked at all seven widths: their banner h1 remains “PRODUCTS”, at 38px, with no new marker; category listing titles remain unchanged by the adapter. Category grid y remains 361.1875px through 414px, 326.09375px at 768px and 376.09375px at 769px, without horizontal overflow.

Validation: `node --experimental-strip-types --test tests/catalogue-adapter.test.mjs` passed (exit 0); `npm run lint` passed (exit 0); `npm run typecheck` passed (exit 0). Geometry assertions passed for all seven original/corrected heading comparisons and fourteen category cases. `npm run build -- --webpack` passed (exit 0), including TypeScript and generation of all 146 static pages. Final build log: `/tmp/08a-correction-build-final.log`. Raw geometry logs: `/tmp/08a-correction-before.jsonl`, `/tmp/08a-correction-after.jsonl`, `/tmp/08a-correction-categories.jsonl`. No screenshots were generated. No commit or push was made; the existing uncommitted 08A implementation remains available for review.
