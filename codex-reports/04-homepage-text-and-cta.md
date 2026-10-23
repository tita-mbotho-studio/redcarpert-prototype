# Implementation 04 — Homepage Text and CTA

Date: 23 October 2026. Workspace: `/workspaces/redcarpert-prototype`.

## 1. Task summary

Applied exactly two homepage text replacements through the existing Phase 03 content adapter: the ordinary-text brand heading and the primary hero CTA label. Retained the existing catalogue destination. No other page content, navigation, imagery, logo, footer, theme asset, CSS or runtime behavior was edited.

Read the architecture assessment and reports 02 and 03; inspected the actual homepage document, catalogue route, adapter, renderer and tests before editing. The adapter could safely express both changes without any extension or weakening of its safeguards.

Completed: nine adapter tests, lint, TypeScript, production build, HTTP checks for all 143 captured routes and nonvisual production-browser checks at desktop/tablet/mobile sizes. No screenshots, visual comparisons, pixel tests, evidence folders, package installs, commits or pushes were performed. This is the only new repository file besides modifications to the existing rule configuration and tests; reports 01–03 are preserved.

## 2. Original homepage text and exact replacements

Programmatically decoded `sitePages["/"]` without printing the large serialized file. Enumerated homepage text nodes and relevant element attributes. Found one ordinary-text business-name heading; the original logo is an image and is outside this task.

| Existing element | Original text | Replacement text |
| --- | --- | --- |
| Brand-section `h2.section-title` | `VANESA BRIDAL` | `Redcarpert Wedding Dresses` |
| Hero `a.button[href="/product/"]` | `EXPLORE COLLECTION` | `Explore Wedding Dresses` |

Both replacements edit only direct child index 0 of their original element. The surrounding DOM, all attributes, sibling nodes and other children are unchanged.

The existing uppercase text-transform rules are retained. The stored replacement strings have the exact approved capitalization; the original theme still controls their rendered capitalization. The collection heading `2026 - 2027 Collectıon`, tagline `TIMELESS ELEGANCE FOR YOUR DREAM WEDDING`, Contact Us button, Menu/navigation text and all unrelated copy remain unchanged. Original logo source and `alt="Bridal Vanesa"`, page metadata and social destinations are unchanged; those are not ordinary-text substitutions authorized by this task.

## 3. Files modified

| Path | Purpose |
| --- | --- |
| `src/data/content-adaptations.ts` | Replaced the empty rule list with the two approved homepage-only text rules. |
| `tests/content-adapter.test.mjs` | Updated the former empty-registry expectation; verifies the exact two replacements, frozen-source immutability, unchanged non-home documents, unchanged header subtree and retained catalogue URL. Existing validation tests remain intact. |
| `codex-reports/04-homepage-text-and-cta.md` | New mandatory report. |

No files were deleted. No other project source or configuration files were added or modified. Temporary execution helpers and the pre-edit source hashes were stored under `/tmp`, not as project evidence or additional reports.

## 4. Content-adaptation rules

Both rules use `route: "/"`, an inspected exact path, tag/attribute guards and an expected original text value. Paths start at `document.nodes`; subsequent indexes address each element's `children` array, including whitespace strings.

### `home-brand-heading`

- Target tag: `h2`.
- Target path: `[1, 1, 4, 1, 1, 2, 0, 0]`.
- Guarded class: `section-title`.
- Guarded original inline style: `color:#ffffff;font-weight:bold;text-transform:uppercase;font-size:40px;`.
- Change: text child 0, expected `VANESA BRIDAL`, value `Redcarpert Wedding Dresses`.

### `home-hero-cta`

- Target tag: `a`.
- Target path: `[1, 1, 4, 1, 1, 0, 0, 2]`.
- Guarded attributes: `class="button"`, `href="/product/"`, `style="background-color:##fffdd0;"`.
- Change: text child 0, expected `EXPLORE COLLECTION`, value `Explore Wedding Dresses`.

The doubled `#` in the captured CTA style is pre-existing. It was neither corrected nor changed; the exact string remains a target guard. Styles are inspected to identify the right element, not edited.

There are no attribute-replacement rules. The adapter still rejects zero/multiple matches, unexpected old values, protected attributes, overlapping changes and duplicate rule IDs. No global string replacement, direct serialized-source edit, DOM replacement or renderer/runtime bypass was used.

## 5. Hero CTA destination

The existing destination `/product/` is retained exactly. The captured map contains `/product`, which is the current WooCommerce-style product catalogue and already appears in the navigation. It is a suitable existing destination; no new route, catalogue restructuring or link invention was required.

Browser checks clicked/tapped the actual hero CTA at desktop, tablet and mobile sizes. Each reached the existing `/product` catalogue route and found product cards. The route also returned HTTP 200 in the all-route HTTP check.

The catalogue remains the original clone, including its existing branding, product records and category scope. Future Redcarpert catalogue/content work is still required, but there is no broken-destination dependency blocking this CTA now. Its original hyperlink behavior is preserved.

## 6. Original design files unchanged

No changes to:

- `src/data/site.ts`: original captured text, DOM structure, class/style attributes, backgrounds and image composition remain untouched.
- `src/lib/content-adapter.ts`, `src/types/site.ts` and `src/components/SiteDocument.tsx`: the existing safe adapter and rendering pipeline are unchanged.
- `src/components/SiteRuntime.tsx`, `src/components/EnquiryPreview.tsx`, `src/components/EnquiryPreview.module.css`: existing interactions and safe WhatsApp preview are untouched.
- All `src/app/` files and all `public/` files: routing, layout, CSS, responsive breakpoints, typography, photographs, logo, scripts, animation and gallery assets are untouched.
- Existing metadata/runtime data, package/lock and configuration files.
- Reports `01-architecture-assessment.md`, `02-whatsapp-enquiry-preview.md` and `03-content-adaptation.md`.

A pre-edit hash baseline of existing `src/`, `tests/`, reports and package files was recorded outside the repository. Comparison after implementation found changes only in the two expected rule/test files. The captured source SHA-256 remains:

```text
20b2cc31c3f50dc25290f14f1403bc4b98b9aeafd5a490ffd784976664500616
```

The exact-change adapter test compares the complete adapted homepage against an independently cloned original with only the two approved string slots changed. This verifies every other value—including attribute/style strings, script references, image URLs, text, child order and node structure—remains identical. The header/logo/navigation subtree additionally retains object identity. All non-home documents retain object identity.

No width, height, alignment, font or spacing declaration was edited. The original theme uses content-sized inline-block buttons with its existing padding and typography; the longer approved strings may naturally occupy different space or wrap. No width clamp, font scaling, truncation or style compensation was added. Identical measured pixel geometry is not claimed: no visual/geometry comparison was performed, as requested.

## 7. Commands executed and actual test results

### Inspection and source verification

Used `cat`/`sed` to read reports and current rule/adapter/renderer/test files, `find /workspaces -name AGENTS.md -not -path '*/node_modules/*' -print` (no AGENTS files found), selected `rg`/`sed` reads of the existing theme's button rules, and read-only Python scripts to decode homepage nodes/links and compare source hashes. Also inspected the previous temporary regression runner to reuse known interaction selectors. No entire `site.ts` dump or sensitive contact values were printed.

Git inspection commands: `git status --short`, `git diff -- src/data/content-adaptations.ts tests/content-adapter.test.mjs`, `git diff --check`, `git diff --stat` and final untracked-file listing. Initial working tree was clean. No source/report baseline files were changed by inspection.

### Required checks

| Command | Actual result |
| --- | --- |
| `node --experimental-strip-types tests/content-adapter.test.mjs` | Passed: 9 tests, 9 passed, 0 failed; exit 0. |
| `npm run lint` | Passed, exit 0; no lint warnings/errors printed. |
| `npm run typecheck` | Passed, exit 0. |
| `npm run build` | Passed, exit 0, using existing approval outside the sandbox for Turbopack's CSS processing. Compiled in 14.5s; TypeScript in 5.4s; generated 146/146 static outputs in 4.0s. |
| `git diff --check` | Passed, no output. |

The Node test loader again emitted `MODULE_TYPELESS_PACKAGE_JSON` because native TypeScript loading detects ES-module syntax without package `type: module`. This known loader warning did not fail tests. Package configuration was not changed to suppress it.

The nine tests include:

- Exactly two enabled rules, both for `/`; all 143 captured route keys retained.
- Frozen original documents and unchanged source-content digest after adaptation.
- Empty-rule no-op identity for every route, plus configured-rule no-op identity for the other 142 routes.
- Complete homepage equality against exactly the two independently specified approved text edits; unchanged header subtree and retained existing catalogue href/route.
- All seven prior synthetic validation/immutability tests: targeted content edits, image-attribute isolation, missing/ambiguous targets and paths, expected-value/text-slot failures, protected attributes, duplicate/overlapping changes and nonoverlapping composition.

### Functional production checks

Started the existing production launcher temporarily:

```text
npm run start -- --hostname 127.0.0.1 --port 3002
```

Server became ready. Next emitted its existing warning that `next start` is not the recommended launcher for `output: standalone` and recommended `.next/standalone/server.js`. The local server served the verification traffic; no configuration or deployment packaging changes were made.

Ran the existing temporary all-route checker:

```text
node /tmp/redcarpert-03-routes.cjs
```

The filename reflects its creation in the previous task; it was reused unchanged. It checks all captured routes against the production prerender manifest and fetches each route, checking preview/control markup and omission of the original captured chat-settings attribute. Actual output:

```json
{"capturedRoutes":143,"manifestMissing":[],"http200":143,"previewPresent":143,"originalChatSettingsOmitted":143}
```

Exit 0. The build's 146-output count includes framework outputs; all-route availability is independently established by the 143 captured-route manifest/HTTP checks.

Ran the new temporary nonvisual homepage functional runner:

```text
PLAYWRIGHT_BROWSERS_PATH=/tmp/redcarpert-playwright node /tmp/redcarpert-04-homepage-test.cjs
```

The first run failed a test expectation for the unchanged tagline: its existing container `textContent` includes a trailing newline, omitted by the temporary test's initial expected string. Corrected that test expectation to include the original newline; no website source change was made. The rerun passed, exit 0.

Passed on Chromium desktop 1440×900, tablet 768×1024 with iPad emulation, and mobile 390×844 with iPhone emulation:

- Homepage returns HTTP 200.
- Exact new brand/CTA text appears in the existing elements.
- Original collection title, tagline and logo source/alt remain unchanged.
- Actual hero click/tap opens the current product catalogue with product cards.
- Safe preview opens with click/mobile tap, copies to the clipboard, closes with Escape and Close, supports Enter activation and returns focus.

Additional desktop checks passed: fullscreen wheel navigation advances and returns after preview closure; existing header Contact link and logo/Home link navigate normally.

Final browser summary:

```json
{"deviceCases":3,"waRequests":0,"popups":0,"pageErrors":[]}
```

`window.open` was instrumented and remained unused. Nonlocal browser requests were blocked; WhatsApp request attempts would have been counted before aborting, and none were observed. No recipient was contacted. Existing Chromium/OS dependencies from earlier tasks were reused without installation. The runners created no screenshot or evidence files.

The temporary production server was stopped with Ctrl+C after verification, intentional exit 130.

## 8. Git status and diff summary

Significant changes are limited to the two declarative homepage text rules and their exact-change acceptance tests. The new report is untracked and therefore excluded from `git diff --stat`.

Final observed `git status --short` after report creation:

```text
 M src/data/content-adaptations.ts
 M tests/content-adapter.test.mjs
?? codex-reports/04-homepage-text-and-cta.md
```

Final observed `git diff --stat`:

```text
 src/data/content-adaptations.ts | 26 +++++++++++++++++++++++---
 tests/content-adapter.test.mjs  | 29 ++++++++++++++++++++++++++---
 2 files changed, 49 insertions(+), 6 deletions(-)
```

`git ls-files --others --exclude-standard` reported only:

```text
codex-reports/04-homepage-text-and-cta.md
```

Final source-hash comparison again confirmed only the expected rule/test files changed among pre-existing source/test/report/package files. The report directory contains only reports 01, 02, 03 and 04. This report was then updated solely to record the outputs. Nothing was staged, committed or pushed.

## 9. Outstanding issues

- Original logo/image branding, browser title/metadata, social links, other homepage copy and the catalogue's legacy content deliberately remain. This is not a complete rebrand.
- Longer text naturally interacts with existing content-based sizing. No CSS or sizing behavior was changed, and no pixel-identical geometry or wrapping claim is made. The retained uppercase styling may display the approved strings in uppercase.
- No screenshot/visual test, physical-device test, Safari/Firefox test or assistive-technology session was performed. Responsive behavior is supported by unchanged source/rules and representative emulated interaction checks, not a visual certification.
- Existing loader/standalone-launch warnings and the corrected temporary-test newline expectation are documented above. No known remaining lint/type/build, CTA-destination or tested interaction failures remain.
- The pre-existing invalid doubled-`#` CTA background-colour string was preserved, not repaired as unrelated work.
- Future catalogue restrictions and Redcarpert product/contact/metadata adaptation still require separately approved tasks. No unconfirmed business claims were invented.

## 10. Recommended next task

Review these text changes first, including acceptance of natural text wrapping under the unchanged typography. Then scope a separate, narrow branding task using a client-approved Redcarpert logo asset while preserving the original logo canvas, sizing and alignment. Do not invent or replace the logo without that asset/approval, and do not bundle photographs, catalogue data, navigation, footer or layout changes into that task.

No next-stage implementation has been performed. Stop for independent review and further approval.
