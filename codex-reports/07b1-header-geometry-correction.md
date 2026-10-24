# Implementation 07B.1 — Restore homepage header proportions

## Confirmed cause

The normal header already matches the approved original clone. The reported shrinking and raised navigation occur when the homepage enters the **compact sticky state**, not because the navigation adapter added a vertical offset.

The original PEXETO sticky handler in `public/site-assets/7632d73540298bafbc.js:2417–2503` uses `$(document).scrollTop() > 5` to decide whether to add `body.fixed-header-scroll`. It listens to mousewheel, `pexetoscroll` and native scroll events. The original theme CSS then changes header padding to 7px, caps the logo image at 40px high, and changes menu margins. On the fullscreen images, document scrollY remains zero; when the approved footer helper switches to native flow, scrollY becomes approximately 1800px at the third-image boundary in a 900px viewport. The sticky handler interprets that technical handoff as an ordinary scrolled page and compacts the header.

At 1440px this reproduces a header height change **193 → 59.390625px**, logo **350×150 → 108.625×40px**, and menu-link top **30 → 18px**. Returning to fullscreen resets native scrollY and expands the header again, producing another visible geometry change. The effect was already present before navigation implementation.

No speculative margin, padding, font or header-position adjustment was made.

## Historical comparison method

Compared current code with the actual Git snapshots `a2f188d5` (original prototype) and `43550ea` (pre-navigation). Extracted historical source into isolated `/tmp` directories, built and served both production snapshots using existing dependencies, and measured their real runtime DOM. Original assets were shared read-only from the workspace; original theme files are unchanged. No dependencies were installed, repository worktree was switched, or screenshots/evidence folders were created. Historical builds used webpack; the final application used its normal production build.

The captured `site.ts` blob is identical at both references and current HEAD (`871a11e2bd25d1e7acd5ac34ea5a294a098b584a`). Its file SHA-256 is `20b2cc31c3f50dc25290f14f1403bc4b98b9aeafd5a490ffd784976664500616`. Original theme scripts/styles are unchanged; differences in `public` since the original baseline are the three previously approved homepage WebP assets.

Used real Chromium pager clicks, wheel input and CDP touch at all six requested widths, plus native iPad/iPhone emulation. Removed Playwright's default scrollbar-hiding flag. External requests were blocked. Geometry compares normal, image 2, image 3, initial footer motion, settled footer entry, footer end, upward exit and subsequent image 2. Native-device comparisons use document-relative positions because native touch scrolling correctly carries a non-fixed responsive header out of view.

The original baseline has no appended homepage footer; its “footer state” is therefore not fabricated. It remains full-size through its original image transitions and final downward input. The pre-navigation snapshot supplies the historical footer-handoff comparison.

## Baseline, regression and corrected geometry

Widths below use desktop input, 900px-high viewports, including narrow desktop windows. Values in pixels. Desktop menu-link y is the first menu anchor's top; hidden desktop links at responsive widths have no rendered box.

| Width | Original normal/image header height | Pre-navigation footer height | Before fix: footer height | After fix: all homepage states | Original / corrected visible link y |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1440 | 193 | 59.390625 | 59.390625 | 193 | 30 |
| 1024 | 237.390625 | 102.390625 | 59.390625 | 237.390625 | 183 |
| 1001 | 237.390625 | 102.390625 | 59.390625 | 237.390625 | 183 |
| 1000 | 95 | 69 | 69 | 95 | Desktop menu hidden |
| 768 | 95 | 69 | 69 | 95 | Desktop menu hidden |
| 390 | 95 | 69 | 69 | 95 | Desktop menu hidden |

The 1024px/1001px normal menu is below the logo in the original clone too; that established layout is retained. In compact mode, the original seven items plus social icons wrapped differently from the approved six-item menu without icons. That explains the pre-navigation compact height of 102.390625px versus the current compact height of 59.390625px. Both were unwanted homepage compact states; the correction preserves the original normal proportions instead of choosing either compact layout.

Desktop logo size remains 350×150px at y=23 throughout footer entry/exit. Its x remains 120 (1440px viewport), 51.1875 (1024px) and 50.046875 (1001px). Responsive desktop logo remains 108.625×40px at y=24 in document coordinates. At native iPad 768×1024 and iPhone 390×844, the original header is 85px high and the logo 108.625×40px; these remain unchanged. The original responsive header still scrolls out of the viewport naturally; this task does not make it sticky or introduce new screen-position rules.

At 1440px the retained six-item menu remains at x=588.890625, y=20, width=715.109375, beside the full-size logo. Individual links retain y=30. Header padding remains `20px 72px 0px`, rather than changing to the compact `7px 72px`. The existing section-header spacing remains intact. At every measured homepage state, `fixed-header-scroll` remains absent and header/logo/menu geometry stays at its normal value; no transient shrink appears at the 50ms footer-entry checkpoint.

## Smallest scoped correction

- **New `src/lib/homepage-header.ts`:** `preserveHomepageHeader()` installs a one-use initialization hook after theme scripts load, immediately before the homepage configuration initializes its original sticky header. Only the instance whose element is the actual homepage `#header`, with the copied homepage footer marker present, receives an `isScrolled()` predicate returning false. The original initializer and original positioning/event handlers still run. The shared initializer prototype is restored immediately; the shared scroll predicate is never replaced. Cleanup restores a pending hook and any original instance predicate descriptor.
- **`src/components/SiteRuntime.tsx`:** imports, installs and releases that hook alongside the existing homepage-only fullscreen capture. Informational documents never install it.
- **New `tests/homepage-header.test.mjs`:** four focused tests cover original initialization exactly once, homepage-only state, unaffected informational/other instances, pending/instance cleanup and missing API handling.
- **New `codex-reports/07b1-header-geometry-correction.md`:** this report.

No extra scroll listener, timer, observer, CSS override, copied theme rule, layout component, dependency or rewritten navigation was introduced. `HomepageFooterScroll.tsx` is unchanged, including its order, momentum/return protections, Home/logo handling, natural footer handoff and scrollbar scope. Navigation adapter, menu IDs/hrefs, dropdown tree, image assets, text, logo source and footer helper remain unchanged.

## Audit of protected design properties

| Property | Actual finding / disposition |
| --- | --- |
| Normal header, logo and navigation vertical alignment | Original baseline, pre-navigation and current measurements match. Preserved exactly; no downward offset added. |
| Font family and sizes | Original Open Sans/Helvetica/Arial stack; header inherited 13px, menu 12px, link line-height 20.4px. Unchanged. |
| Menu spacing | Original 1px letter spacing and `2px 14px` padding. Unchanged. |
| Header/menu colours | Original normal-state computed colours/background match both references. Correction retains normal state in the footer; no colour rule edited. |
| Dropdown | Original 210px width, computed padding/shadow/background match; original theme arrows and two approved categories retained. |
| Responsive behaviour | Original 1000px breakpoint, menu control, full-width responsive rows and logo sizing retained. |
| Animations | Theme files/configuration and computed header/link transition declarations unchanged (header 0.3s, link colour 0.3s). Fullscreen/dropdown interactions verified; no timing/easing adjustment. |
| Horizontal menu geometry | Approved six labels and social-icon removal make menu width 715.109375px versus original 654.3125px and change its natural right-aligned x. Preserved approved customization, not reverted. |
| Informational compact geometry | Same before/after this fix at all six widths. Existing compact behaviour remains enabled; no global sticky suppression. |
| Homepage/footer enhancements | Approved photos/text, fullscreen alignment/Home reset, natural footer, scrollbar hiding, absent homepage scroll-to-top and WhatsApp preview retained. These are approved differences from `a2f188d5`. |

The unintended difference identified in this audit is homepage compaction during native footer flow; it is corrected. No additional unexpected changes to the measured protected properties were found. Removing the homepage's compact transition is intentional; normal/fullscreen transitions and other-page sticky animations remain original.

## Functional verification

Final geometry assertions passed in eight contexts: six desktop-UA widths plus native tablet/mobile. All normal/image geometry matches the historical references; every corrected footer state retains normal header proportions. All sections preserve height/background URLs/cover/centre, footers preserve width/natural height, and root content width equals viewport width with no horizontal overflow. Navigation and logo do not overlap or clip in their normal layout.

About Us was measured normally and after real native scrolling at all six widths before and after the correction. The complete recorded geometry/style objects match exactly. Sticky class remains active after scrolling: compact height 59.390625px at desktop widths and 69px at responsive desktop widths. Informational-page normal dimensions and native scrollbar behaviour remain intact.

The navigation browser matrix passed at 1440×900, 1024×900, 1001×900, responsive 1000×900, native iPad 768×1024 and native iPhone 390×844, with zero page JavaScript errors. It verifies all six labels/order, two real category destinations, original desktop hover/open/close and mobile arrow expansion, actual parent/category/informational link activation, route active states, disabled Lookbook pointer/Enter behaviour, absent header icons, retained footer icons, hidden cart and Home return.

The final full homepage regression run **passed in all four contexts**, with zero page JavaScript errors. It checks momentum stopping at image 3, fresh footer input, bounded downward/upward movement, restore-to-3 before 2/1, keyboard input, native touch, Home/logo from images 2/3/footer and other pages, pager, fragments/refresh/history, hidden scrollbar, natural footer geometry and WhatsApp preview. No screenshot or visual-approval claim is made.

| Final homepage suite | Section size | Natural footer height | Geometry/state checkpoints | Result |
| --- | --- | --- | ---: | --- |
| Desktop 1440×900 | 1440×900 | 260.140625 | 84 | Passed |
| Desktop-input tablet 1024×768 | 1024×768 | 245.390625 | 84 | Passed |
| Native iPad 768×1024 | 768×1094 | 413.5625 | 385 | Passed |
| Native iPhone 390×844 | 390×914 | 515.609375 | 329 | Passed |

The passing isolated run retained image 3 through the complete momentum sequence, entered the footer only on fresh input, restored image 3 before the subsequent upward transition, and completed Home/logo, fragment, history, WhatsApp and informational-page regressions. The scoped scrollbar rules remain functional, footer colours remain `#252525`/`#1f1f1f`, and no homepage scroll-to-top control returns. Temporary runners/results were kept in `/tmp` (`07b1-geometry.cjs`, `07b1-info.cjs`, `07b1-regression.cjs` and the existing navigation runner); no browser evidence directory was created.

## Standard checks and final state

- Existing content-adapter tests: 9 passed.
- Existing homepage-background tests: 4 passed.
- Existing homepage-footer tests: 4 passed.
- Existing navigation-adapter tests: 4 passed, including all 143 source documents.
- New homepage-header tests: 4 passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; 146 generated entries.
- `git diff --check`: passed; new files also checked for trailing whitespace and final newlines.

An initial lint error concerning a local `this` alias was corrected before final checks. The first geometry harness tried to click the theme-hidden native mobile pager; it was corrected to use real touch instead, and all historical/current geometry matrices completed successfully. Native document coordinates were used to avoid treating different touch inertia distances as header offsets.

The first concurrent full scrolling run failed its momentum assertion with scrollY 1800. The same input sequence was rerun separately with wheel timing diagnostics, and all four final suites passed. The initial failure is not counted as a pass or conclusively attributed to a cause; it was not reproduced in the separate run. No handoff code, animation duration or gesture threshold was changed in response. The existing 180ms quiet-interval gesture distinction remains timing-sensitive, as already documented in 06D.

Historical builds, Chromium and the current server/build used required sandbox permissions where socket/worker restrictions applied. Existing module-type warnings and Next standalone-start advisory remain. No package changes or dependency installs.

Git status after implementation:

```text
 M next-env.d.ts
 M src/components/SiteRuntime.tsx
?? codex-reports/07b1-header-geometry-correction.md
?? src/lib/homepage-header.ts
?? tests/homepage-header.test.mjs
```

Task code changes: 7 additions/1 deletion in `SiteRuntime.tsx`, plus the new 36-line helper and 65-line test file. This report is the only new report. The tracked generated `next-env.d.ts` difference predates this task and its initial contents are preserved exactly. Protected source/assets, the navigation adapter/renderer, footer helper and fullscreen scrolling helper have no diff. No staging, commit or push.

## Limitations

Chromium emulation is not physical-device, Safari/Firefox, assistive-technology testing or human visual approval. Original responsive menu keyboard-expansion limitations remain. The scoped initialization hook depends on the verified PEXETO sticky-header API; original theme files are not modified. Original-business footer/body links remain outside scope.
