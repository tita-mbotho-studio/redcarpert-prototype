# Implementation 07F — Redcarpert Footer Branding

## Current approved revision

This is the existing uncommitted 07F implementation, revised in place. It is not a new phase. Inspected the current adapter, DOM structure, scoped stylesheet, tests and original theme rules before editing.

The desktop grid remains **45% / 25% / 30%**, capped at 1300px and centred. Tablet retains three balanced columns. At 640px and below, stacking remains brand, collections, fitting, then copyright. Main padding, column gaps, heading/item typography and the two content columns' working actions are unchanged from the preceding three-column 07F revision.

- **Brand:** the approved Redcarpert PNG and **Elegant bridal collections** are centred together in one bounded wrapper inside the first column. The tagline's text is centred directly beneath the image in that same wrapper. The first column's old right gutter is cleared only for centring; the wrapper's maximum width preserves the prior logo dimensions.
- **Social row:** the five existing icon elements now appear beneath the tagline as one centred horizontal group, in Instagram/YouTube/Twitter/Pinterest/TikTok order. No icons are copied or recreated. Each original 32×32 image is contained in a 32px slot, with 2px inter-icon gaps and the original footer image opacity of 0.7. The row follows the tagline by 16px.
- **Collections:** left-aligned **COLLECTIONS**, **Mermaid**, **Ball Gown**; existing local category anchors and spacing remain.
- **Fitting:** left-aligned **FITTING ENQUIRIES**, **Book a fitting**, **Via WhatsApp**; the native fitting button retains the existing `data-whatsapp-preview` hook and dialog behavior. No WhatsApp recipient or destination is invented.
- **Copyright:** **© COPYRIGHT REDCARPERT WEDDING DRESSES** is centred across the entire lower bar at every breakpoint. The inner container has symmetric gutters, and the copyright text centre is measured against the full viewport centre, not the brand column.

Original `#252525`/`#1f1f1f` footer backgrounds remain. No vertical dividers, fixed footer heights or new clipping rules are introduced. The redundant fourth column remains removed, and no `cols-4` class survives in the adapted footer.

## Files and guarded immutable adaptation

The complete uncommitted 07F change set remains:

- `src/lib/footer-branding-adapter.ts`: final guarded footer transformation and safe relocation of the existing social subtree.
- `src/components/FooterBranding.css`: narrowly scoped opt-in footer styling.
- `src/components/SiteDocument.tsx`: existing 07F final pipeline integration and stylesheet import; no further change for this alignment revision.
- `tests/footer-branding-adapter.test.mjs`: updated full-route structure, immutability, subtree relocation and guard coverage.
- This report.

The adapter still validates the original four-column captured footer or independently generated homepage footer before adapting it. Guards cover the unique footer, homepage marker, widget IDs/order, exact legacy text/styles, original image wrapper/source/attributes and designer-credit structure. The approved branding removes legacy content and the fourth column without touching captured data.

For this revision, the adapter requires one social-profile subtree, one social list and five already-disabled, destination-free anchors in the original footer-bottom insertion point. It removes that exact subtree from the lower bar and appends the **same object** to the brand widget, after the tagline. Its anchors, icon wrappers, images and disabled attributes are shared unchanged. Tests prove it appears once, only inside the first column, and is absent from the lower bar. No href, target, legacy URL or replacement account is introduced. The 07E local Instagram source is preserved.

Only changed nodes and ancestors are copied; non-footer subtrees and document metadata retain identity. Prior homepage/canonical social accessibility labels intentionally differ and are preserved verbatim. All 143 routes otherwise produce the same branded widget content/layout. The adapter remains after homepage footer generation and the existing 07C/07D/07E pipeline stages; those builders and guards are unchanged.

The approved `/redcarpert/brand/redcarpert-logo.png` is used directly. Its SHA-256 and 2208×813 intrinsic dimensions remain unchanged. Original loading/decoding/class attributes are retained; the legacy source set is removed as in the initial branding adaptation. Natural aspect ratio and image-local containment prevent cropping or stretching. Logo wrapper width remains at most 360px on wider screens and 300px on mobile. No derivative logo, header change, package or dependency was added.

## Validation

- All **nine test files passed** with `node --experimental-strip-types --test tests/*.test.mjs`. Updated tests cover all 143 routes, exact three-column content, category destinations, enquiry hook, frozen-input immutability, protected subtree identity, exactly-one social relocation with original order/sources, guard failures (including missing/duplicate/unsafe social structures), homepage consistency and unchanged logo integrity.
- `npm run lint`: passed.
- `npm run typecheck`: passed, including the sequential production-build check.
- Webpack production build: passed, all **146 entries generated**. The sandboxed attempt hit the previously documented TypeScript `--showConfig` parse error; the approved escalated retry passed.
- `git diff --check`: passed. The build-generated `next-env.d.ts` change is restored before review.

Real Chromium verification uses **1440×900, 1024×900, 768×1024 and 390×844**, with touch enabled for the latter two contexts. Routes: `/`, `/about-us`, `/contact-us`, `/our-brides`, `/product`, `/product-category/mermaid` and `/product/alpina` (28 combinations). Temporary numeric/assertion scripts and text logs are under `/tmp/07f-centre-*`; no screenshots, visual-diff files or evidence folders were generated.

### Alignment and footer heights

The final browser matrix passed all 28 route/viewport combinations. Actual tagline and copyright text ranges were measured, rather than relying only on container alignment. The image centre, tagline text centre and the five-icon group's visual extent centre match the first-column centre within 0.01px of subpixel rounding. Copyright text matches the full viewport/bar centre within the same tolerance.

| Viewport | Brand column centre x | Copyright target centre x | Logo dimensions (unchanged) | Footer height before → after |
| --- | --- | --- | --- | --- |
| 1440×900 | 362.5 | 720 | 360 × 132.546875 | 310.546875 → 358.546875 |
| 1024×900 | 248 | 512 | 360 × 132.546875 | 310.546875 → 358.546875 |
| 768×1024 | 190.3984375 | 384 | 292.796875 × 107.796875 | 285.796875 → 333.796875 |
| 390×844 | 195 | 195 | 300 × 110.453125 | 466.453125 → 514.453125 |

All tested routes share these measurements. The intended height increase is exactly **48px** at every viewport: 16px between tagline and icons, plus the 32px icon row. The copyright bar remains 57px high. There are no additional unintended height changes or horizontal overflows.

The collections/fitting columns retain their prior x coordinates, widths, heights, typography, item spacing and left alignment. At desktop/tablet their y positions are also unchanged. At mobile, both simply follow the now-taller brand group by moving down 48px; the existing stacking gaps are unchanged. The 45/25/30 grid proportions and mobile ordering remain intact. Logo images decode at the original full 2208×813 dimensions, with the same rendered size/aspect ratio as before. All five social images decode successfully and appear once in one horizontal row, with equal y coordinates and 2px gaps. Background colours are unchanged.

### Actions and protected functionality

The full browser matrix passed collection navigation, fitting pointer/keyboard activation, the floating WhatsApp control, scroll-to-top where the theme displays it, social destination safety and page JavaScript error checks. Both local category links reach matching catalogues containing product cards at all four viewports. On all 28 route/viewport combinations, the fitting button opens/closes the existing dialog with pointer and Enter, and the floating WhatsApp control opens/closes normally. On the six non-homepage routes at 1440/1024, scroll-to-top reaches exactly zero through pointer, Enter and Space. The five disabled social icons receive direct pointer clicks on non-homepage routes without changing URL or opening a popup; all routes independently verify absent destinations and preserved disabled attributes. Completed runs report zero page JavaScript errors. Disabled social anchors are tested with direct pointer coordinates because Playwright's enabled-element click helper correctly rejects `aria-disabled` elements; the disabled attributes are never removed for testing.

Homepage runs passed at all four widths: selecting Image 3 and applying fresh wheel input enters the native footer with **0px gap**; both Home and the approved header-logo link return to Image 1 at scrollY approximately zero. Desktop hover and responsive menu-arrow/category navigation also passed, with no page JavaScript errors.

## Scope, limitations and review state

Header/navigation, homepage Images 1–3 and transition/reset code, scroll-to-top, enquiry implementation, catalogue/product layouts, original captured data and original theme sources are unchanged. Responsive CSS still hides the scroll-to-top control at 768/390; no new control is introduced. Fitting continues to use the existing local enquiry preview while the business destination is unconfirmed.

Responsive/touch results are Chromium emulation, not physical-device or native Safari certification. Logo bytes and full-canvas proportions are verified; visual approval is left to the user without screenshots.

Work remains unstaged on `main`. No commit or push. Stop for visual approval.
