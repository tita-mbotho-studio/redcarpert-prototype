# Implementation 02 — Safe WhatsApp Enquiry Preview

Date: 23 October 2026. Workspace: `/workspaces/redcarpert-prototype`.

## 1. Task summary

Implemented the existing floating WhatsApp control as a local, non-sending enquiry preview. The preview displays the requested Redcarpert message, demonstration label and exact latest notice, with Copy Message and Close buttons, Escape dismissal, keyboard focus containment and focus return. Its message is an optional component prop for future product-specific enquiries; no product functionality was added.

Read `codex-reports/01-architecture-assessment.md` and inspected the actual renderer, runtime, captured data and legacy scripts. No branding outside the preview, images, navigation, routes, catalogue, homepage footer, lookbook, dependencies or assets were changed. No commit or push was performed.

The latest instructions superseded the earlier request for screenshot evidence. No screenshots, screenshot comparisons or pixel-diff tests were performed after that update. Before the interruption, the earlier authorized phase had captured baseline screenshots and prepared audit artifacts. On resuming, `git status --short --untracked-files=all` and `ls codex-reports` showed only the existing assessment report and no evidence directory. None of those artifacts were recreated. The final repository contains exactly one new report for this task, with no evidence folder.

**Completed checks:** lint, TypeScript and production build; nine page/device browser cases, clipboard success and failure handling, keyboard/touch/click activation, simulated legacy interception and unrelated-interaction regression tests. Existing design preservation is supported by the limited source diff, not by a visual comparison. Safari, Firefox and physical devices were not tested.

## 2. Files changed

| Path | Change and purpose |
| --- | --- |
| `src/components/SiteRuntime.tsx` | Removed captured settings parsing, WhatsApp URL construction and `window.open` activation. Mounts `EnquiryPreview`. Retains original floating-control visibility, cursor, z-index and body relocation. Changes only accessibility semantics from link to button and adds `aria-haspopup="dialog"`. |
| `src/components/SiteDocument.tsx` | Omits `data-settings` only on captured `.ht_ctc_chat_data` nodes while rendering. The stored data, DOM nesting and visual styles stay intact. This prevents the original recipient and plugin tracking/contact configuration from appearing in the rendered chat-settings attribute. |
| `src/components/EnquiryPreview.tsx` | New isolated client component: native dialog, general message/default prop, copy handling, focus lifecycle, narrowly scoped WhatsApp interception and link neutralisation. |
| `src/components/EnquiryPreview.module.css` | New CSS module scoped exclusively to the new dialog, its backdrop and descendants. No existing-site selectors or breakpoint changes. |
| `codex-reports/02-whatsapp-enquiry-preview.md` | This implementation report. |

No files were deleted. `codex-reports/01-architecture-assessment.md` was already present and untracked when this task resumed; it was not edited. Browser test runners were temporary files under `/tmp/`, not new project scripts or evidence files.

## 3. Implementation

### Preview interface

`EnquiryPreview({ message?: string })` defaults to:

```text
Hello Redcarpert Wedding Dresses!

I would like to enquire about your wedding dresses and arrange a fitting.

Could you please provide more information?

Thank you.
```

The heading is **WhatsApp Enquiry Preview**. A **Demonstration** label and the notice **“Preview only — WhatsApp Business number not yet confirmed. No message will be sent.”** distinguish it from a sending interface. There is no recipient field, send button, messaging API call, tracking event or outbound URL construction.

The native `<dialog>` uses `showModal()`, an accessible title through `aria-labelledby`, and the notice through `aria-describedby`. The browser makes the background inert. Initial focus goes to its first button. Explicit Tab/Shift+Tab boundary cycling keeps focus on the two dialog buttons. Close and Escape call `dialog.close()`; the close listener returns focus to the connected initiating control with `preventScroll`. A queued close event after rapid reopening is ignored while the dialog is open.

Copy Message calls `navigator.clipboard.writeText(message)` and announces “Message copied.” only after success. If the Clipboard API is unavailable or rejects permission, it selects the message text and announces instructions for manual copying instead of falsely claiming success. No obsolete clipboard dependency was added. Automatic copying requires a browser/hosting context that permits the Clipboard API; localhost passed the real write/read test.

No body/html overflow or padding is changed to implement the modal. Wheel/touchmove propagation is isolated from the fullscreen theme only while the preview is open; native scrolling inside the dialog remains available. Dialog width and height are viewport-constrained and content can wrap/scroll.

### Event handling and legacy ordering

The preview component installs window **capture-phase** click, auxiliary-click and keydown listeners. The preview child mounts its layout effect before the parent `SiteRuntime` layout effect loads the legacy scripts. Window capture precedes document capture, target and bubble listeners. For matched WhatsApp controls only, activation prevents the default navigation and stops immediate propagation before opening the preview. Enter/Space are handled for the floating div/neutralised links; repeated keydown does not repeatedly open it. Touch tap uses the resulting click event.

Matching is restricted to `#ht-ctc-chat`, `[data-whatsapp-preview]`, or an anchor with a WhatsApp destination. Unrelated anchors are ignored. While the modal is open, keydown is kept away from fullscreen theme handlers, with normal button default activation retained.

A targeted URL matcher recognizes `wa.me`, `whatsapp.com`, `whatsapp.net` and their subdomains, the `whatsapp:` protocol and WhatsApp Android intent URLs. Initial anchor scanning and a MutationObserver remove matching `href` and `target`, mark the anchor as a local preview control and provide keyboard/button semantics. This also removes the context-menu navigation destination after neutralisation. The observer only watches inserted nodes and `href` changes; it does not rewrite unrelated links. No original destination is stored as a replacement attribute.

The observer and all added listeners are removed in cleanup. An open dialog is closed and its trigger focus restored on cleanup. The original fullpage/script-loading lifecycle is otherwise unchanged; this task did not refactor existing legacy plugin cleanup.

## 4. Design preservation

The floating control retains the captured `#ht-ctc-chat` DOM, SVG and all original classes. Captured inline placement is `position: fixed; bottom: 15px; right: 15px`; its SVG specifies 50px width/height. `SiteRuntime` still sets display to block, cursor to pointer and z-index to `99999999`, and still relocates the control after script initialization to preserve positioning outside the fullscreen wrapper. It no longer requires the removed contact-settings attribute to make the control visible.

The only floating-control attribute changes are accessibility semantics; no dimensions, positioning CSS, icon assets or animations were replaced. The hidden contact-settings span remains in its original position, with only its unsafe configuration attribute omitted.

Left unchanged:

- `src/data/site.ts`, including captured layout, text, inline CSS, backgrounds and responsive settings.
- All `src/app/` files, including `globals.css`, root layout and route files.
- All `public/` files: theme CSS/JS, photographs, fonts, gallery fixtures and icons.
- Product-card/gallery markup, header/logo/footer structure, all existing breakpoints and transitions.
- `src/data/metadata.ts`, `src/data/runtime.ts`, package files and Next/TypeScript/ESLint configuration.

The new CSS uses only generated CSS-module classes on the dialog and its descendants/backdrop. It adds no global breakpoint. Closed dialog markup stays outside normal layout flow. Browser tests checked that the dialog fits the viewport without internal horizontal overflow and that opening/closing preserves URL, scroll position and body/html inline overflow values.

No visual fidelity or pixel-identical claim is made: no screenshot comparison was run under the updated instructions. Preservation is established at the code-change boundary, with nonvisual functional regression checks below.

## 5. Safety

### Actual audit findings

Decoded `site.ts` selectively with Python's JSON decoder, traversing attributes without printing contact values. Inspected the runtime, renderer, per-page script references and all 338 `.js` files under `public/site-assets/` for `wa.me`, WhatsApp host/scheme strings, `ht.ctc` and `pre_filled`.

Results:

```text
Routes: 143
Floating controls: 143
Captured chat-settings attributes: 143
WhatsApp outbound href/src/action/formaction/data-url/data-href attributes: 0
WhatsApp inline event-handler attributes: 0
Legacy JavaScript assets scanned: 338
Legacy JavaScript assets with WhatsApp/plugin keyword matches: 0
```

The existing runtime was the only discovered active WhatsApp destination-construction path. Captured configuration contains a recipient, original prefilled text and plugin analytics flags; none are read by the replacement. The original renderer already discards captured script/noscript nodes and inline event handlers. The extra renderer guard strips chat settings from rendered HTML before hydration. Source `site.ts` remains unchanged; its SHA-256 remains:

```text
20b2cc31c3f50dc25290f14f1403bc4b98b9aeafd5a490ffd784976664500616
```

### Verification and limits

All nine tested page/device combinations had zero rendered `.ht_ctc_chat_data[data-settings]` nodes. Synthetic later document-capture and target-click listeners did not execute when the preview control was activated. Synthetic links for five destination forms (`wa.me`, API, web, custom scheme and Android intent), with **no recipient**, lost their destinations and opened only the local preview on click, Enter and middle click. Unrelated navigation still worked.

Browser tests instrumented `window.open`, monitored popup events and counted WhatsApp-host network requests. **Zero `window.open` calls, zero popups and zero WhatsApp requests were observed.** All nonlocal network requests were blocked by test routing as an additional safety measure; an attempted WhatsApp request would have been counted before being aborted. No real recipient was contacted by these tests. Clipboard operations transfer only the requested sample text to the local clipboard.

This supports neutralisation of the current audited WhatsApp activation paths. It is not a browser-wide network firewall: the implementation does not monkeypatch all outbound APIs or block unrelated navigation. A future script that programmatically contacts a recipient without using the audited controls/anchors would require a fresh audit. Observer delivery is asynchronous; same-task synthetic WhatsApp anchor clicks are intercepted by capture, but arbitrary future script-driven location changes are outside this guard. No such handler was found in the current legacy assets.

Original business content outside the preview, including existing contact-page/footer text, remains unchanged as explicitly required. This task does not rebrand those pages or certify their contact information; the preview never displays or uses a recipient number.

## 6. Testing

### Commands and environment

Inspection commands included `git status --short --untracked-files=all`, `ls codex-reports`, `cat` of the assessment/runtime/renderer/content/package files, `sed` of assessment ranges, `find /workspaces -name AGENTS.md -not -path '*/node_modules/*' -print` (no instructions found), Python read-only JSON/script traversal, `rg` for WhatsApp/runtime terms, `cat public/site-assets/8df11fa8f184a8e1b5.js`, `wc -l`, `sha256sum`, `git diff`, `git diff --numstat`, `git diff --stat`, `git diff --check` and path-scoped `git diff --exit-code`. No recipient values were copied into this report.

Before the revised scope, browser setup commands were attempted: default Playwright launch failed because Chromium was absent; `PLAYWRIGHT_BROWSERS_PATH=/tmp/redcarpert-playwright npx playwright install chromium` initially failed with sandbox DNS `ENOTFOUND`, then succeeded with approval. Chromium next failed due to missing `libatk-1.0.so.0`; approved `npx playwright install-deps chromium` succeeded. Browser binaries were placed under `/tmp`; OS libraries were installed with approval. These actions did not change project dependencies or lockfiles. The earlier install output included a noninteractive dpkg stdin warning; installation completed successfully.

The earlier local dev-server attempt failed with sandbox `listen EPERM`; approved startup succeeded. On resuming, sandboxed `curl -I --max-time 5 http://127.0.0.1:3000` could not connect. An approved `npm run dev -- --hostname 127.0.0.1` retry found the existing dev server on port 3000, briefly selected 3001 and exited because another Next dev server was already running. Browser verification reused that existing local server on 3000. No additional server configuration was changed.

| Command/check | Actual result |
| --- | --- |
| `npm run lint` | Passed, exit 0, no warnings printed. |
| `npm run typecheck` | Passed, exit 0, no errors printed. |
| `npm run build` in sandbox | Failed: Turbopack CSS processing attempted to bind a local port and received `Operation not permitted (os error 1)`. Panic log was generated under `/tmp`, not the repository. |
| `npm run build` with approval outside sandbox | Passed, exit 0. Compiled in 10.9s, TypeScript in 6.1s, generated 146/146 static outputs. Existing home, not-found and catch-all SSG route families retained. |
| Final `npm run lint && npm run typecheck` after focus correction | Passed, exit 0. |
| `git diff --check` | Passed, no output. |
| `git diff --exit-code -- src/data/site.ts src/app public package.json package-lock.json codex-reports/01-architecture-assessment.md` | Passed, no tracked diff. Assessment report is untracked, so its preservation also follows from no writes to it during this task. |

### Browser commands and outcomes

Ran temporary Node/Playwright test runners with the installed Chromium browser:

```text
PLAYWRIGHT_BROWSERS_PATH=/tmp/redcarpert-playwright node /tmp/redcarpert-enquiry-test.cjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/redcarpert-playwright node /tmp/redcarpert-regression-test.cjs
```

The runners were executed with approval to access the local server. They create no screenshots or repository evidence files. They are temporary execution aids rather than a committed test suite.

**Interaction matrix:** Home `/`, Contact `/contact-us`, and Dress Details `/product/alpina`, each at desktop 1440×900, tablet 768×1024 with iPad emulation, and mobile 390×844 with iPhone emulation. All ran in Chromium, not native iOS Safari.

Final interaction runner result:

```text
pageDeviceCases: 9
waRequests: 0
popups: 0
pageErrors: []
exit: 0
```

Passed in all nine cases: click or mobile tap opens the named dialog; exact sample message/notice; focus begins inside; repeated Tab and Shift+Tab stay contained; actual Clipboard API write and read match the full message; Close and Escape dismiss; Enter and Space open; focus returns; dialog fits viewport with no horizontal content overflow; URL, scroll coordinates and body/html inline overflow values are unchanged after closing.

Passed for each device profile: capture interception precedes simulated legacy listeners; five dynamically inserted destination types are neutralised for click/Enter/middle click; clipboard rejection shows manual-copy instructions and selects the full message. No window.open calls were recorded.

**Test-driven corrections:** the first interaction run failed a Tab-containment assertion: the native modal allowed focus to leave the two controls at a boundary. Added explicit boundary cycling; rerun passed all cases. This was an implementation issue corrected before the successful final build.

The first unrelated-interaction runner timed out looking for `.wpgis-slider-for .slick-next`. Inspection of the existing WPGIS initialization showed its custom arrow is `.btn-next`. Corrected only the temporary test selector. The subsequent runner passed:

- Existing catalogue date sorting updates the query string.
- Existing product-card click opens the matching details route.
- Slick gallery initializes and advances through its existing next control.
- Existing fancyBox lightbox opens and closes.
- Homepage fullpage wheel navigation works before and after closing the preview.
- Existing Contact header link navigates normally.
- Three reload/mount and preview open/close cycles produce one open dialog and restore focus.

A final repetition also passed keyboard Enter activation of Copy Message and Close; the regression runner exited 0.

### Untested boundaries

No screenshots or visual comparisons under the latest scope; no physical touch device, Safari, Firefox, assistive-technology session or production-host clipboard permissions test. The successful production build was not launched as a separate production browser server. Direct hydration and browser interaction were tested against Next dev, including its repeated development lifecycle; full arbitrary client-side React unmount/remount instrumentation was not performed. All-route source audit is complete, but browser interaction testing covered representative templates rather than all 143 URLs.

## 7. Git changes

Initial resumed working tree:

```text
?? codex-reports/01-architecture-assessment.md
```

Tracked-file diff summary observed after implementation:

```text
 src/components/SiteDocument.tsx |  2 ++
 src/components/SiteRuntime.tsx  | 20 +++++---------------
 2 files changed, 7 insertions(+), 15 deletions(-)
```

`git diff --stat` excludes untracked files. New untracked implementation files are `src/components/EnquiryPreview.tsx` (163 lines) and `src/components/EnquiryPreview.module.css` (40 lines), plus this report. The assessment report was pre-existing/untracked and is not a new output of Implementation 02.

Significant tracked changes: the renderer excludes one unsafe chat attribute; the runtime removes destination generation/outbound activation while retaining existing control styling/placement and mounts the isolated preview. The new component contains the dialog and capture/cleanup logic; the new stylesheet affects only that dialog.

Final observed `git status --short` after report creation:

```text
 M src/components/SiteDocument.tsx
 M src/components/SiteRuntime.tsx
?? codex-reports/
?? src/components/EnquiryPreview.module.css
?? src/components/EnquiryPreview.tsx
```

Final `git diff --stat` matches the tracked-file summary above: two files, seven insertions and fifteen deletions. `git ls-files --others --exclude-standard` reported:

```text
codex-reports/01-architecture-assessment.md
codex-reports/02-whatsapp-enquiry-preview.md
src/components/EnquiryPreview.module.css
src/components/EnquiryPreview.tsx
```

This report was then updated only to record those outputs. No files were staged, committed or pushed.

## 8. Outstanding issues

- No known unneutralised current WhatsApp handler was found by the audit. Safety conclusions apply to the current inspected code and tested entry points, with the limits stated in section 5.
- Automatic copy remains subject to browser clipboard permissions and secure-context hosting; a truthful manual-copy fallback is present and tested.
- Modern native-dialog support is required. Chromium passed; other browsers and assistive technologies still need review if they are part of the deployment target.
- Existing legacy script remount cleanup issues identified in the assessment remain outside scope. New preview listeners and observer have explicit cleanup; the original script-loader/fullpage implementation is unchanged.
- No final website visual comparison was performed, as requested. No unrelated design or source-data changes were made.
- The initial focus test and wrong gallery test selector were corrected; the sandbox build failure was resolved by the approved rerun. There are no known remaining lint/type/build failures.

## 9. Recommended next task

Establish the smallest reviewed content-adaptation boundary before broader branding: introduce a narrowly scoped, immutable adapter for captured page content with no intended visual or behavioural change, and verify exact selector matches and preservation of styles/classes. Agree its scope in a separate task before any branding, product data, route or asset replacement. Do not implement that work until this preview is reviewed and further approval is given.
