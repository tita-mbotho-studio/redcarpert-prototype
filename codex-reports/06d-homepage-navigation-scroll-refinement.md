# Implementation 06D — Homepage navigation and scroll refinement

Verification: 23–24 October 2026 (UTC). No commit or push.

## 1. Confirmed causes

Read reports 06, 06A, 06B and 06C; inspected the helper, runtime script sequence, captured Home/logo anchors, PEXETO transition/input methods and fullpage hash handling. No original captured files were edited.

**Momentum into footer.** The helper's former `ready()` checked only the active class and a section top within 2px of the viewport origin. PEXETO sets the destination active early, and retains `inAnimation` through its original transition and 500ms post-load overscroll lock. The helper bypassed that lock. Real wheel bursts reproduced native scrollY 1840 with image 3 top −40 while PEXETO still reported `inAnimation=true`; the same burst subsequently exposed the entire footer. A position check alone also cannot distinguish continued momentum after the transition from a new gesture.

**Home/logo.** The verified controls are `#header #logo-container > a[href="/"]` and `#header #menu-item-15418 > a[href="/"]`, including the theme's responsive Home clone. They had no explicit reset of native-tail state, theme current index, active section, pager or fragment. The legacy hash handler treats an empty numeric section as `0 - 1`, selecting `.section.eq(-1)` when that hash path is taken. Separately, the startup API aligns the container before fixed-header relocation/loader completion. The baseline browser measured current index 0 but a stale container transform of −1281px: image 1 top −1281, image 3 top 519, even after bare-root/Home/logo navigation. Reapplying alignment too early left a smaller stale −193px offset. Waiting for the original loader, document load and transition lock, then using the existing alignment API, resolves the measured stale offset without changing section layout.

On mobile, the theme disables container transforms and relies on native scrolling. A `#3` refresh was also measured with current/active section 3 but scrollY zero. Aligning only the desktop transform could not repair that controller/native-position mismatch, so the same one-time settled initialization now aligns the native requested section too.

**Scrollbar width.** The footer handoff intentionally calls `setAutoScrolling(false)`, restoring native overflow. With Chromium's scrollbar-hiding launch flag removed, the baseline viewport remained 1440px while document/section content width fell from 1440 to 1425px. The visible 15px scrollbar caused a real horizontal layout-width change.

## 2. Exact corrections

`src/components/HomepageFooterScroll.tsx`:

- Captures the homepage's existing PEXETO instance through a one-use initialization hook. The hook restores the original prototype method immediately and has cleanup; original theme source and animation methods remain unchanged.
- Requires the original `inAnimation` state to be false, current section 3, active section 3 and settled geometry before footer entry. A continued downward wheel burst remains intercepted until a 180ms quiet interval (or direction change). There is no added post-animation timeout. The first event of a fresh gesture still starts the existing gradual, bounded footer scroll. Held downward key repeats cannot spill from the last transition into the footer.
- Retains 06C's bounded smooth tail, reversal logic, return-to-image-3 stop, upward wheel-burst/held-key protections and original next-gesture fullscreen transitions. No scroll-to-top control is reintroduced.
- Aligns the active section once after the original loader/document/transition state settles. Uses `setAutoScrolling(true)` and clears native offset on desktop; mobile aligns its native offset to the requested section (zero for image 1) and keeps its original native touch flow. This also corrects a measured mobile `#3` refresh mismatch where the controller selected 3 but restored scrollY was zero.
- Intercepts only ordinary activations of the two verified Home/logo controls. Modifier/new-tab actions remain native. Writes `#1` with `replaceState` (no empty-hash event), restores tail state, waits for any existing transition to settle, then uses the theme's `moveTo(0)` when necessary. An already-current image 1 is not moved again: the legacy theme would otherwise set `inAnimation=true` without a corresponding after-load callback. Mobile additionally scrolls natively to zero. An open responsive menu closes through its existing toggle control.
- Handles an empty hash reached through history as `#1` before the legacy hash handler, and restores fullscreen mode before section-hash navigation out of the native tail. Explicit `#2`/`#3` links retain their original section-navigation meaning.
- Renders a small style block scoped by `html/body:has(footer[data-homepage-footer])`. `scrollbar-width:none` and the WebKit scrollbar pseudo-element hide the native scrollbar without changing overflow, widths, heights or scroll access. Other pages have no matching marker. No original stylesheet is modified.

`src/components/SiteRuntime.tsx`: four narrowly scoped integration lines import/install/release the capture hook immediately before the homepage configuration runs, gated by the homepage footer marker. Other routes do not install it.

`codex-reports/06d-homepage-navigation-scroll-refinement.md`: this report, the only new repository file. Existing tests are unchanged; focused browser runners/results are temporary `/tmp` files.

No changes to photographs/order/canvas sizes, section heights/background rules, source theme scripts/styles, header/footer markup/design, typography, spacing, responsive breakpoints, original animation timing, WhatsApp implementation, catalogue, other routes, package files or `src/data/site.ts`. The initial generated `next-env.d.ts` development import is preserved after build verification.

## 3. Before and after behaviour

| Interaction | Before | Corrected behaviour |
| --- | --- | --- |
| Wheel momentum after 2 → 3 | Helper entered the footer during the theme lock and continued into the short footer. | Original transition finishes, image 3 stays fully visible throughout the burst; fresh downward input starts smooth footer motion. |
| Footer → images | Approved 06C bounded return. | Same return to 3 and stop; fresh upward input to 2, then 1. |
| Home/logo | Generic `/` navigation; fragments, native state and stale startup transform could disagree with current/pager state. | Verified controls explicitly select image 1, reset native state and use a valid section fragment/API. |
| Bare root / explicit fragments | Startup alignment could retain an offset measured before layout finished. | Initial active section is realigned after the original loader/lock; explicit fragments remain usable. |
| Native footer scrollbar | 15px desktop content-width loss. | Homepage root and content retain the full viewport width; native scrolling still works. |

## 4. Functional browser verification

Focused runner: `/tmp/06d.cjs`; final measurements: `/tmp/06d-results.jsonl`. Baseline probe: `/tmp/06d-baseline.cjs` and `/tmp/06d-baseline.jsonl`. Real Chromium wheel, click, keyboard and CDP touch input; no screenshots or visual/pixel comparisons. External requests are blocked. The runner attaches a test-only reference to the same original PEXETO instance to read current/animation state; no original method or timing is changed by that observation.

Chromium runs with its usual Playwright `--hide-scrollbars` argument removed, so visible/classic scrollbar behaviour is tested rather than masked by the browser launcher.

Browser coverage:

- Desktop and tablet-desktop 1 → 2 → 3; fast 600px wheel input followed by 22 events 80ms apart, including decreasing momentum. Native scrollY stays zero, image 3 never moves above the viewport, and the final image-3 top is zero before footer entry.
- A fresh 60px event starts gradual footer movement on its first input; intermediate motion and final −60px position are checked. Repeated 6000px events remain bounded by the retained 120px-per-event tail policy and reach the footer naturally.
- Repeated large upward input returns to image 3 and stops. A subsequent intentional input moves to 2, then 1. Held keyboard return, fresh ArrowUp, ArrowDown and End are checked.
- Home and logo from image 2, image 3 and the footer; logo during an unfinished transition; current index, active section, pager and native scrollY all return to image 1/zero.
- Bare root, `#2`, `#3`, refresh, cross-page Home/logo from About Us, history returning to `#2`, and same-document history returning to an empty fragment. Responsive menu Home and logo receive real activations. Original fullscreen pager remains usable.
- Tablet/mobile repeated touch swipes to the full footer and back to zero, plus Home/logo from the corresponding content positions. Original native mobile flow remains continuous. A mobile header control outside the viewport is brought into view by normal browser interaction before activation; no new sticky header is introduced.
- WhatsApp preview opens and closes with Escape. Homepage scroll-to-top is absent. All three informational footers retain their controls and colours, and their documents still scroll normally. Footer heights are compared at equal available content widths, accounting for their retained classic scrollbars.

## 5. Geometry and scrollbar measurements

| Viewport / input | Unchanged section width × height | Natural footer height | Homepage content width |
| --- | --- | --- | --- |
| Desktop 1440×900 | 1440×900 | 260.140625px | 1440px |
| Tablet with desktop input 1024×768 | 1024×768 | 245.390625px | 1024px |
| iPad portrait 768×1024 | 768×1094 | 413.5625px | 768px |
| iPhone portrait 390×844 | 390×914 | 515.609375px | 390px |

Checks sample section width/height/background URL/cover/centre, root client/scroll width, footer dimensions and adjacent edges, footer-widget x/width, WhatsApp x/width, and header-logo geometry across transitions. Numeric geometry allows 0.01px for transformed DOM bounding-box rounding. Homepage `scrollbar-width` computes to `none` and its scrollbar pseudo-element to `display:none`; document width equals viewport width, with no horizontal overflow. Footer colours remain `#252525` and `#1f1f1f`.

The original header's `fixed-header-scroll` transition remains: its original sticky-state padding/logo sizing can change the logo's x/size when native scrolling begins. This is existing theme behaviour, not a remaining scrollbar-width loss; no header design rule is suppressed or changed. Section/footer-widget widths and positions remain stable. Automated measurements are not visual approval.

Informational pages retain `scrollbar-width:auto` and native scrolling. At desktop tablet width, their retained scrollbar means a 1009px-wide footer can naturally be 1px shorter than the homepage’s 1024px-wide footer. The comparison also checks the canonical footer at the same 1024px available width, rather than overriding its original responsive height. With classic desktop scrollbars, their content remains 15px narrower than the viewport, confirming the homepage-only rule does not leak. Existing mobile section heights retain the theme's viewport-plus-70px minimum; no height override was introduced.

## 6. Regression checks and commands

- `node --experimental-strip-types tests/content-adapter.test.mjs`: 9 passed.
- `node --experimental-strip-types tests/homepage-backgrounds.test.mjs`: 4 passed.
- `node --experimental-strip-types tests/homepage-footer.test.mjs`: 4 passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed, 146 framework/static entries.
- `git diff --check`: passed.
- Full desktop and tablet-desktop production matrices: passed, 84 recorded geometry/state checkpoints each.
- Final-build native tablet/mobile suites: passed, 385 and 313 checkpoints respectively.
- Final-build desktop regression smoke: passed, including 1 → 2 → 3, smooth footer input, WhatsApp Space/Escape, logo return, actual header Contact activation and Home return.

The full desktop branch matrices passed before the final mobile-only initialization alignment was added; the final bundle was then checked with the native suites and desktop smoke. All passing browser runs reported zero page JavaScript errors. Final native `#3` refresh positions are scrollY 2273 on iPad and 1913 on iPhone, with image-3 top exactly zero; bare-root/Home return remains scrollY zero.

Browser commands used the existing runner with `--remaining`, `--native` and `--smoke` selections as documented in the temporary runner. No repository browser artifact/evidence folder was created.

Known Node module-type warnings and Next's standalone-start advisory remain. Sandboxed Chromium initially failed with the existing crashpad socket restriction; approved execution outside the sandbox was used. The final aggregate `npm run check` passed lint/typecheck but hit a Turbopack worker-port EPERM during build; the required build was retried with approved sandbox escalation. No dependencies were installed. An intermediate lint error in the capture hook and overly strict startup/rounding assertions and comparison waits/width assumptions were corrected before final verification.

## 7. Git status and diff summary

Final task changes: two source files, 104 insertions and 3 deletions, plus this untracked report. The generated `next-env.d.ts` modification predates this task and is restored to its initial contents.

```text
 M next-env.d.ts
 M src/components/HomepageFooterScroll.tsx
 M src/components/SiteRuntime.tsx
?? codex-reports/06d-homepage-navigation-scroll-refinement.md
```

Task-source diff summary (excluding the pre-existing generated-file difference and untracked report):

```text
src/components/HomepageFooterScroll.tsx | 103 lines changed (100 added, 3 removed)
src/components/SiteRuntime.tsx          |   4 lines added
```

No other tracked source/assets changed. No staging, commit or push.

## 8. Limitations

Chromium emulation only, not physical devices, Safari/Firefox, assistive-technology testing or human visual approval. Wheel events expose no portable gesture identifier; 180ms quiet/direction-change detection distinguishes a fresh gesture, in addition to the authoritative PEXETO animation lock. Native mobile scrolling is unchanged and does not use the desktop fullscreen handoff. The scoped scrollbar selectors require support for `:has` and either standard scrollbar styling or the WebKit pseudo-element. Original external icon/resource dependencies remain outside scope.

No screenshots, evidence folders, unrelated reports or design changes. Stop for review.
