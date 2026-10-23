# Implementation 06A — Footer Scroll-to-Top Usability Fix

Date: 23 October 2026. Workspace: `/workspaces/redcarpert-prototype`.

## 1. Request and outcome

Verified and corrected the overlap between the copied homepage footer's scroll-to-top control and the floating WhatsApp control. Real browser mouse/touch input originally activated the WhatsApp preview when aimed at the scroll-to-top centre. After the correction, real mouse/touch input activates scroll-to-top and returns to the top without opening the preview.

Only the copied homepage control's horizontal positioning changed, plus its existing test expectation. All existing dimensions, colors, icons, footer content, responsive breakpoints and scrolling logic remain intact. No screenshots, visual comparisons, dependency installations, commits or pushes were performed. This is the only new repository report/file.

Read `codex-reports/06-homepage-footer.md`; inspected the committed `HomepageFooterScroll.tsx`, canonical-copy helper, existing tests and original theme CSS. Initial working tree was clean; latest commit was `68db4d7 Add homepage footer`.

## 2. Original problem: measurements, hit-testing and real activation

Actual source: `public/site-assets/a397f1784786614528.css:1902–1928` defines `.scroll-to-top` as fixed, right/bottom 15px, 35×35px, z-index 100. The same original stylesheet at line 7711, within `max-width:768px`, hides it with `display:none`.

Measured WhatsApp control: 50×50px, right/bottom 15px, z-index 99999999. It therefore completely covers the smaller scroll-to-top rectangle whenever that control is displayed.

Baseline production-browser results (CSS pixels; boxes are x, y, width, height):

| Viewport | Scroll-to-top box | WhatsApp box | Original centre hit / input result |
| --- | --- | --- | --- |
| Desktop 1440×900 | 1390, 850, 35, 35 | 1375, 835, 50, 50 | `elementFromPoint` resolves inside WhatsApp; real mouse click opens preview; scrollY stays 2060. |
| Tablet landscape 1024×768 | 974, 718, 35, 35 | 959, 703, 50, 50 | Hit resolves inside WhatsApp; real touch tap opens preview; scrollY stays 2076. |
| Tablet portrait 768×1024 | No rendered box; display none | 703, 959, 50, 50 | Original theme hides scroll-to-top; no activation attempted. |
| Mobile portrait 390×844 | No rendered box; display none | 325, 779, 50, 50 | Original theme hides scroll-to-top; no activation attempted. |

Input was delivered with Playwright `page.mouse.click(x,y)` or `page.touchscreen.tap(x,y)` at the measured centre. These send browser input; no DOM `.click()`, event dispatch, force-click or programmatic handler invocation was used as proof. The incorrect baseline activation opened only the existing safe local preview. No outbound WhatsApp attempt occurred.

## 3. Exact correction

`src/lib/homepage-footer.ts:29–33` uses its existing unique-element guard to locate `.scroll-to-top` in the **cloned homepage footer only**. It requires the canonical control to have no existing inline style, then adds exactly:

```text
right:75px;
```

Calculation: unchanged WhatsApp right inset 15px + measured width 50px + clear gap 10px = 75px. This moves scroll-to-top 60px left. Bottom remains 15px; no width, height, background, icon, opacity, margin, position or z-index is overridden. The original hover states and responsive display rule still apply.

The helper already gates all operations to `/` and copies the footer immutably. Informational-page source nodes retain their original 15px right offset. No theme CSS or new stylesheet is involved. `HomepageFooterScroll.tsx` and all its fullscreen/native-scroll handoffs, input handlers and visibility states are unchanged.

The existing hierarchy/style preservation test now permits and asserts precisely this one control's `right:75px;` inline style, while still requiring original styles for every other copied element. Its title was updated to describe the approved exception. No original validation or immutability test was removed.

## 4. Files changed

| Exact path | Action / purpose |
| --- | --- |
| `src/lib/homepage-footer.ts` | Modified: five lines adding the uniquely targeted, guarded positioning override and explanatory calculation. |
| `tests/homepage-footer.test.mjs` | Modified: existing test name and expected inline style for this one control. |
| `codex-reports/06a-footer-control-fix.md` | Created: this report. |

No files deleted. Original theme styles/scripts, `src/data/site.ts`, footer content/branding/images/social icons, all previous reports, homepage sections, header, catalogue data, routes, WhatsApp components and positioning, and the footer scroll helper itself were not modified.

A SHA-256 snapshot of pre-existing source/tests/reports found only the two expected files changed. The existing 361-file theme/original-background baseline found no changed or missing files. Browser checks of `/about-us`, `/contact-us` and `/our-brides` independently confirm their control still computes to right 15px and they do not acquire the homepage footer marker.

## 5. Real pointer and return-navigation verification

Tested the production build with existing Chromium/Playwright binaries. Footer access used real wheel input on desktop and CDP touch-start/move/end swipes on touch emulations. No screenshots were taken. All nonlocal browser requests were blocked; WhatsApp attempts were counted before blocking.

| Viewport | Corrected scroll-to-top box | Gap beside WhatsApp | Hit-test / real activation result |
| --- | --- | ---: | --- |
| Desktop 1440×900 | 1330, 850, 35, 35 | 10px | Centre hits scroll-to-top; real mouse click returns scrollY 2060 → 0 and active section 3 → 1; preview stays closed. |
| Tablet landscape 1024×768 | 914, 718, 35, 35 | 10px | Centre hits scroll-to-top; real touch tap returns scrollY 2076 → 0; preview stays closed. |
| Mobile landscape 844×390 | 734, 340, 35, 35 | 10px | Centre hits scroll-to-top; real touch tap returns scrollY 1504 → 0; preview stays closed. |
| Tablet portrait 768×1024 | Still hidden by original CSS | N/A | `display:none` preserved; no false claim of pointer activation. Footer touch access and WhatsApp tap/Escape pass. |
| Mobile portrait 390×844 | Still hidden by original CSS | N/A | `display:none` preserved; no false claim of pointer activation. Footer touch access and WhatsApp tap/Escape pass. |

For every displayed control: 35×35px, bottom 15px, z-index 100 and original default `rgba(0,0,0,0.8)` background were measured. The control was visible (opacity 1) before activation. Centre hit-testing excluded WhatsApp, and horizontal rectangles no longer intersected. All five cases retained exactly three sections and one footer; WhatsApp click/tap still opened its local preview and Escape closed it, with zero outbound WhatsApp attempts and no page JavaScript errors.

Measured WhatsApp x/y/width/height, right/bottom offsets, z-index, opacity, display and background were identical in the four directly corresponding before/after cases. The landscape-mobile case also measured the same original 50×50px, right/bottom 15px and z-index 99999999. WhatsApp source/styles were untouched.

After the desktop pointer return, real wheel input advances section 1 → 2 and returns 2 → 1. Tablet/mobile displayed-control taps restore the top and show the first section through the unchanged native scrolling path. Other informational footers retain right 15px as noted above.

## 6. Commands and regression results

Inspection used `cat`, targeted `sed`, `rg`, `git log -1 --oneline`, `git status --short`, `git diff`, and Python SHA-256 comparisons. Temporary browser runners/measurement JSON live only under `/tmp`; no repository evidence folder or screenshot was created.

| Command | Actual result |
| --- | --- |
| `node --experimental-strip-types tests/content-adapter.test.mjs` | PASS, 9 tests, 0 failures. |
| `node --experimental-strip-types tests/homepage-backgrounds.test.mjs` | PASS, 4 tests, 0 failures. |
| `node --experimental-strip-types tests/homepage-footer.test.mjs` | PASS, 4 tests, 0 failures; repeated after the expectation update. |
| `npm run lint` | PASS, exit 0. |
| `npm run typecheck` | PASS, exit 0. |
| `npm run build` | PASS, exit 0. Generated 146 framework/static entries, preserving all 143 captured routes. |
| `git diff --check` | PASS, exit 0. |

Production server: `npm run start -- --port 3002`. Existing standalone-output launch warning appeared; server worked and was stopped after testing. Build and Chromium ran with permission outside sandbox restrictions using already installed dependencies.

Browser commands:

```text
PLAYWRIGHT_BROWSERS_PATH=/tmp/redcarpert-playwright node /tmp/redcarpert-06a-controls.cjs before
PLAYWRIGHT_BROWSERS_PATH=/tmp/redcarpert-playwright node /tmp/redcarpert-06a-controls.cjs after
PLAYWRIGHT_BROWSERS_PATH=/tmp/redcarpert-playwright node /tmp/redcarpert-06a-controls.cjs after --landscape
PLAYWRIGHT_BROWSERS_PATH=/tmp/redcarpert-playwright node /tmp/redcarpert-05-homepage-test.cjs
node /tmp/redcarpert-03-routes.cjs
```

The baseline control runner completed normally while documenting the incorrect activation described above. Corrected control runners passed all assertions, including actual input, hit-testing, return navigation and informational-page positioning. The final landscape-only run adds mobile landscape without recreating the original baseline.

Existing homepage regression runner passed desktop, tablet portrait and mobile portrait: all three images load at original canvas dimensions with original cover/center rules; homepage text, original header logo and catalogue CTA remain intact; actual catalogue navigation works; WhatsApp preview click/tap/Enter/copy/Escape/Close/focus return works; desktop wheel section navigation and header navigation work. Final summary:

```json
{"deviceCases":3,"waRequests":0,"popups":0,"pageErrors":[]}
```

Route checker first encountered sandbox `EPERM` connecting to localhost. Its permitted retry passed:

```json
{"capturedRoutes":143,"manifestMissing":[],"http200":143,"previewPresent":143,"originalChatSettingsOmitted":143}
```

Known Node `MODULE_TYPELESS_PACKAGE_JSON` warnings occurred in stripped-TypeScript tests; package configuration was not changed. No code-test, lint, typecheck, production-build or corrected-browser assertion failure remains.

## 7. Git changes

Final `git status --short` after report creation:

```text
 M src/lib/homepage-footer.ts
 M tests/homepage-footer.test.mjs
?? codex-reports/06a-footer-control-fix.md
```

`git diff --stat`:

```text
 src/lib/homepage-footer.ts     | 5 +++++
 tests/homepage-footer.test.mjs | 4 ++--
 2 files changed, 7 insertions(+), 2 deletions(-)
```

The untracked report is additional and not included in the diff stat. No staging, commit or push was performed. Required checks generated normal ignored build/typecheck artifacts only.

## 8. Limitations and next step

- Chromium emulation was tested; physical devices, Safari, Firefox and assistive technologies were not tested. No visual comparison or screenshot-based approval is claimed.
- The 75px offset accommodates the measured existing 50px WhatsApp control with a 10px gap. A future approved change to that control's dimensions or inset must retest this clearance.
- Portrait tablet/mobile intentionally retain the original hidden scroll-to-top state. No hidden control was made visible to satisfy a test.
- Existing unrelated external icon-resource and legacy runtime limitations documented in report 06 remain outside this correction.

The confirmed homepage control overlap is resolved in the tested displayed-control cases. Stop for independent review. Any further logo, icon, content or catalogue task requires separate approval and was not implemented here.
