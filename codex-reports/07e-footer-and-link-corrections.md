# Implementation 07E — Final Footer and Link Corrections

## Scope and implementation

Read `07c-footer-social-link-safety.md` and inspected the captured semantic trees, theme scroll plugin and control implementation, footer builders, navigation/content adapters, theme CSS and existing tests before editing. Work is on `main`.

Files changed:

- `src/components/SiteDocument.tsx`: runs the final immutable correction adapter after the existing transformation pipeline; mounts a non-homepage-only scroll enhancement.
- `src/lib/footer-link-corrections.ts`: guarded corrections for the unique footer Instagram image, canonical scroll control semantics and exact Contact Us Instagram body anchor.
- `src/components/FooterScrollToTop.tsx`: root-mismatch fallback and keyboard activation on the existing control, with effect cleanup.
- `public/redcarpert/instagram.svg`: local white monochrome camera outline on a transparent 32×32 canvas.
- `tests/footer-link-corrections.test.mjs`: full capture coverage, frozen-input/structural preservation checks and incompatible-target rejection.
- This report.

No changes to `src/data/site.ts`, captured assets, theme CSS/JavaScript, dependencies, approved social-disabling helpers, homepage scrolling, navigation, logo, catalogue or enquiry implementations. Nothing staged, committed or pushed. No screenshots, pixel diffs or visual comparison artifacts created.

## Root causes and solutions

### Scroll-to-top

`public/site-assets/7632d73540298bafbc.js` includes an old jQuery scrollTo implementation. Its `_scrollable()` picks `document.body` whenever the user agent contains `webkit`, regardless of standards mode. The theme's `setScrollToTop()` then animates that root toward `#main-container`. In tested Chromium documents the actual `document.scrollingElement` is `HTML`, while `jQuery(window)._scrollable()[0]` is `BODY`; animating the latter leaves the viewport stationary.

The existing `div.scroll-to-top` and its child, CSS, placement and dimensions remain. The adapter adds only `role="button"`, `tabindex="0"` and `aria-label="Scroll to top"`. Enter and Space invoke its click activation; key repeat is ignored and Space's default page scrolling is prevented.

A control-local capture listener intercepts click only for the demonstrated WebKit/root mismatch, prevents the broken theme handler from running for that activation and animates the real viewport to exactly zero. It retains the original 1000ms easeOutSine curve and respects reduced-motion preference. A pending animation is cancelled on repeat activation or cleanup. Completion invokes the theme's existing mousewheel visibility evaluation; the theme continues to own control visibility, hover and transition styling. The original click handler remains effective where its selected root is correct. No touch-specific handler is added: browser-generated clicks cover touch without duplicate activation. The component never mounts on the homepage.

### Footer Instagram image

The external Instagram PNG is unavailable in the tested environment. Inspected named icon/image assets and captured Instagram image references: every captured Instagram image references the same remote PNG; no suitable identified local Instagram image was available. The other four footer images are local 32×32 PNGs. Added a minimal 32×32 transparent white SVG under `public/redcarpert/`, matching that canvas and monochrome treatment. The unavailable original's artwork cannot be certified pixel-identical.

The final adapter replaces only the exact original `src` in the footer, preserving the `img` element, empty alt, wrappers, icon order and original CSS. Running after homepage footer insertion covers both all 142 canonical footers and the independently copied homepage footer. Existing social destination disabling and the other four image sources are unchanged. Desktop theme hiding of the social row remains intact.

### Contact Us Instagram link

Validated the captured body anchor on `/contact-us`: `a.decorated-link`, `data-start="905"`, `data-end="986"`, `target="_new"`, `rel="noopener"`, text `@bridal_vanesa`, and the exact legacy destination ending `?utm_source=chatgpt.com`.

Only this anchor loses `href` and `target`; it retains text, classes, metadata and `rel`, and receives `role="link"`, `aria-disabled="true"`, `aria-label="Instagram: destination not yet available"`. A local `cursor: pointer` preserves the original computed cursor, as in 07C. No replacement social URL or event handler is added. The adapter rejects unexpected target shapes/counts with route context and copies only changed nodes and ancestors.

## Validation

Automated checks:

- `node --experimental-strip-types --test tests/*.test.mjs`: all eight test files passed, including both new focused cases over the complete capture collection. Inputs are deeply frozen; tests assert only the intended nodes/ancestors change, other four icon sources and unrelated links/markup remain unchanged, and missing/duplicate/malformed targets fail closed.
- `npm run lint`: passed.
- `npm run typecheck`: passed after the production build finished, and again after restoring the generated environment declaration file.
- `npm run build -- --webpack`: passed; 146 static entries generated. The sandboxed attempt hit the previously documented TypeScript `--showConfig` parse error; the escalated rerun completed. An overlapping typecheck initially encountered build-regenerated files; the subsequent sequential run passed.
- `git diff --check`: passed. Build-generated `next-env.d.ts` changes restored to their original contents.

Real Chromium browser checks used the final production build at **1440×900, 768×1024 and 390×844**, with touch enabled for the latter two contexts. Numeric/assertion runners and text logs live only under `/tmp/07e-*`; no screenshots, traces or comparison artifacts were created.

At each size, checked `/about-us`, `/contact-us`, `/our-brides`, `/product`, `/product-category/mermaid` and `/product/alpina`:

- Local Instagram image decoded successfully with natural width 32. The original other four image sources remain identical by whole-tree tests.
- Scanned all rendered anchor destinations: none of the five legacy social accounts remained active, including the Contact Us body account.
- Real mouse/touch activation, focused Enter and focused Space each returned `window.scrollY` to **exactly zero** on all six routes (54 activation checks total).
- The existing WhatsApp control opened its local enquiry dialog, which closed normally, on all 18 combinations.
- Completed responsive page runs reported no page JavaScript errors.

### Geometry and visibility

For each non-homepage route/viewport, compared every footer element's rectangle and every enumerated computed CSS property against the same DOM with the original control semantics and original Contact Us destination attributes restored. The Contact Us comparison also includes its parent paragraph and sibling elements. All 18 comparisons passed exactly. The icon replacement remains loaded during this attributes-only comparison; its original remote artwork is unavailable. Immutable tree tests independently establish unchanged image wrappers, element attributes except the Instagram source, icon order, and all original CSS.

Footer sizes were identical across all six tested non-homepage routes at each viewport:

| Viewport | Footer width × height (CSS px) | Social row display | Scroll control display |
| --- | --- | --- | --- |
| 1440×900 | 1440 × 260.140625 | none | block |
| 768×1024 | 768 × 406.65625 | block | none |
| 390×844 | 390 × 508.703125 | block | none |

The theme explicitly hides the scroll control at responsive widths. To retain that approved behavior, production visibility was not changed. **Tablet/mobile activation checks temporarily exposed only the existing control in the test DOM**, exercised touch and keyboard, then restored its original style. These checks prove the fallback's touch/keyboard operation at those sizes; they do not claim a visible mobile control. The theme also retains its original scroll-distance threshold and visibility animations on desktop.

### Homepage and navigation regressions

At all three viewports, the local homepage footer Instagram image decoded and no copied scroll-to-top control was present. Selected Image 3 using the original navigation, used fresh wheel input to enter the native footer tail, and measured **0px** between Image 3's bottom and the footer's top. Both the original logo link and the visible Home link returned to Image 1 at scrollY approximately zero. Desktop hover/category navigation and tablet/mobile menu-arrow expansion followed by Mermaid category navigation passed. Completed homepage runs reported no page JavaScript errors.

The test runner was corrected to use the visible theme-generated menu instance, wait for menu animations and test dropdown expansion from a fresh homepage; no production menu or homepage code was changed for the tests.

## Remaining limitations and review state

Responsive touch checks use Chromium touch emulation, not native iOS/Safari certification. The fallback retains the original handler on browsers where its selected scroll root is correct; that unaffected branch was inspected but not separately exercised in Firefox. Original theme visibility remains: no new visible mobile scroll control, and no desktop social-row visibility override. The new icon preserves a 32×32 canvas and monochrome style, but the failed remote asset prevents exact artwork comparison.

All three requested corrections are implemented within the protected scope. Work is left unstaged on `main` for review; no commit or push.
