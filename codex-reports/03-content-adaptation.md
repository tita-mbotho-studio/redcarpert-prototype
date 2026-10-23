# Implementation 03 — Safe Content Adaptation

Date: 23 October 2026. Workspace: `/workspaces/redcarpert-prototype`.

## 1. Task summary and implementation outcome

Added a small typed, immutable adapter for future content replacements in the captured page trees. It is integrated once in the existing server-side `SiteDocument` component. **No content substitutions are enabled:** the configuration is an empty array, and the adapter returns the exact original document object for every captured route.

Read both previous reports and inspected the current document types, renderer, page entry points, runtime, enquiry-preview component and build configuration before editing. The current renderer includes Implementation 02's suppression of the original chat configuration; that behavior remains unchanged.

Completed validation: eight adapter tests, all 143 captured routes present in the production prerender manifest, HTTP 200 for all 143 routes, nine production-browser WhatsApp page/device cases, lint, TypeScript and production build. No screenshots, visual comparisons, pixel tests, evidence folders, content replacement, package installation, commit or push occurred in this task. Exactly one new report was created. Reports 01 and 02 were preserved.

## 2. Files created or modified

| File | Change | Purpose |
| --- | --- | --- |
| `src/lib/content-adapter.ts` | Created; 88 lines | Typed replacement rules, target validation, guarded content edits and immutable tree copying. |
| `src/data/content-adaptations.ts` | Created; 5 lines | The central, explicitly empty list of approved future content rules. |
| `src/components/SiteDocument.tsx` | Modified | Two imports and one adapter call before the existing rendering code. The document prop is locally aliased to distinguish original and adapted data. |
| `tests/content-adapter.test.mjs` | Created; 112 lines | Native Node tests for all-route no-op behavior, immutability and adapter safeguards. Synthetic fixture edits are test-only and never enter website configuration. |
| `codex-reports/03-content-adaptation.md` | Created | This report. |

No files were deleted. Existing source/report/package hashes were recorded in `/tmp/redcarpert-03-before.json` before editing. The subsequent hash comparison found only `src/components/SiteDocument.tsx` changed among those existing files. Test execution generated normal ignored Next/TypeScript artifacts; these are not website source changes. Temporary test runners were under `/tmp`, not new project evidence or reports.

## 3. How the adapter works

The existing rendering pipeline remains:

```text
Home / catch-all page
  → original sitePages[route]
  → SiteDocument
      → adaptSiteDocument(original, contentAdaptations)
      → existing ordered styles, SemanticTree and SiteRuntime
```

`src/app/page.tsx` and `src/app/[...slug]/page.tsx` still select the same original documents. Route generation and metadata generation are untouched. No alternate renderer, browser content-rewriting layer, plugin or dependency was introduced.

A `ContentAdaptation` has:

- `id`: a diagnostic name, unique among rules for a given route.
- `route`: an explicit captured route, with no wildcard application.
- `target.tag` and `target.attrs`: exact tag and attribute-value matching against the original tree. Attribute matching requires the named values, while leaving other attributes intact; it is not a CSS-selector engine or substring matcher.
- Optional `target.path`: exact child indexes starting from `document.nodes`, to disambiguate repeated markup. Tag, attribute and old-value checks still apply.
- `changes`: either a direct text-child replacement by `childIndex`, or a permitted attribute replacement. Every change supplies `expected` and `value` strings.

`adaptSiteDocument` filters rules by `document.route`. With no applicable rules, it returns immediately with the same object: no tree traversal, serialization, cloning, new DOM wrapper or content transformation.

With future enabled rules, it searches the original tree and requires exactly one target for each rule. Each text change must address an existing direct string child, not an element; each attribute change must address an existing own attribute with the expected value. It validates against the original data, so later rules cannot silently select nodes based on earlier replacements. Missing/ambiguous targets, stale values, invalid text slots, duplicate per-route rule IDs and overlapping field edits throw an error that names the route/rule without printing content values.

After validation, only edited nodes and their ancestors are copied. Unchanged siblings and all unrelated document fields retain their existing references. The original tree, attributes and children are never modified, including when a later validation error occurs. Tag names, child order/count, nested elements, document title/description, classes, stylesheet ordering, body/html classes, script lists, theme configuration and post-scripts are not editable through this API.

Attribute edits are restricted at both the TypeScript and runtime boundaries to:

```text
alt, title, aria-label, href, src, srcset, sizes
```

The adapter rejects editing script, style, noscript and link elements. Classes, IDs, inline styles, dimensions, event handlers and plugin settings are outside its edit allowlist. Match criteria may inspect those attributes without modifying them. Source attributes not explicitly replaced remain intact.

## 4. Safely targeting future replacements

Branding text, navigation labels, product names/references/descriptions and contact copy can use guarded direct-text slots. Navigation/contact destinations use guarded `href` edits; logo/product photographs and accessible descriptions can use guarded image attributes. `srcset` and `sizes` are available for explicit future image-content updates; approval and review remain necessary because their values can affect image selection.

For example, a future task could add a rule in `src/data/content-adaptations.ts` shaped as below. **This is illustrative only, not an enabled rule or current content replacement:**

```ts
{
  id: "approved-example",
  route: "/specific-existing-route",
  target: { tag: "a", attrs: { id: "verified-existing-id" } },
  changes: [
    { kind: "text", childIndex: 0, expected: "Verified original text", value: "Approved new text" },
    { kind: "attribute", name: "href", expected: "/verified-old", value: "/approved-new" },
  ],
}
```

Before enabling a rule, inspect the actual decoded route and exact target; whitespace text children count toward indexes. Require the known old value rather than searching/replacing text across the whole document. If matching is ambiguous, narrow the attributes or add an inspected exact path; do not silently choose the first result or relax the match count. Repeated header/footer replacements must enumerate the intended routes/targets explicitly.

Run the tests and build after adding approved rules. The current test deliberately asserts that the registry stays empty and the captured route count stays 143: a future approved content/route task must update those acceptance expectations explicitly, while retaining immutability and guard coverage. The test also validates that any configured route exists in `sitePages`; the individual per-document adapter cannot detect a typo in a rule for a route that is never rendered.

Boundaries: this mechanism does not alter page metadata, replace DOM subtrees, create pages/products, change styles/background-image declarations or manage global brand configuration. A future approved task needing those operations must review a narrow extension instead of bypassing the safeguards. URL values are trusted developer-authored content, not sanitized user input; the adapter is not an HTML sanitizer, link checker or authorization system. It does not authorize contact recipients or weaken Implementation 02's guards.

## 5. Original design and functionality preserved

Unchanged existing files and responsibilities:

- `src/data/site.ts`: captured documents, text, original image composition, attributes and inline styles.
- All `src/app/` files: page structures, routes, metadata entry points, root layout and global CSS.
- All `public/` assets: photographs, fonts, CSS, legacy scripts and gallery fixtures.
- `src/components/SiteRuntime.tsx`: fullscreen behavior, gallery/script loading, catalogue sorting and the safe enquiry integration.
- `src/components/EnquiryPreview.tsx` and `src/components/EnquiryPreview.module.css`: message, clipboard, focus, event interception and dialog appearance.
- `src/types/site.ts`, existing metadata/runtime data, package/lock and configuration files.
- `codex-reports/01-architecture-assessment.md` and `codex-reports/02-whatsapp-enquiry-preview.md`.

Only the pre-render adapter invocation was added to `SiteDocument`. Its `renderNode`, `parseStyle`, `SemanticTree`, captured-chat-settings suppression and existing JSX output are unchanged. With the empty registry, it receives the same document and node references as before. No CSS, layout structure, dimensions, grid, breakpoints, responsive rules, animations or image assets were changed or added.

Source SHA-256 for `src/data/site.ts` remains:

```text
20b2cc31c3f50dc25290f14f1403bc4b98b9aeafd5a490ffd784976664500616
```

No visual test was performed or implied. Preservation is supported by exact input identity/content tests, unchanged source hashes and the narrow rendering diff, not a screenshot or visual-certification claim.

## 6. Commands and actual test results

### Inspection and change verification

Commands included `cat`/`sed` on the two reports and named source/config files; `rg --files src`; `find /workspaces -name AGENTS.md -not -path '*/node_modules/*' -print` (no AGENTS files returned); `node --version` (v24.21.0); `ls` of existing temporary browser/test locations; `wc -l`; `git status --short`/`--untracked-files=all`; `git diff`, `git diff --stat` and `git diff --check`. Python standard-library scripts selectively decoded `site.ts`, counted routes, confirmed route keys match each document's `route`, and compared source/report/package SHA-256 hashes. No entire serialized-data dump or sensitive contact values were emitted.

Initial inspection showed no working-tree changes. An additional status command launched alongside baseline hashing finished after edits began and therefore showed the in-progress adapter changes; it is not presented as an initial clean-tree result.

### Adapter tests

Final command:

```text
node --experimental-strip-types tests/content-adapter.test.mjs
```

Result: **8 tests passed; 0 failed; exit 0.** The tests cover:

1. Empty registry, all 143 captured routes, exact original-object return and unchanged serialized-content SHA-256. All imported page data is recursively frozen inside the test process before calls.
2. Targeted text and href edits in a synthetic fixture preserve nested elements, siblings, child counts, classes, styles and all non-node document fields.
3. Synthetic image-content edits retain dimensions, style and siblings.
4. Missing and ambiguous targets reject; an explicit path disambiguates while preserving tag/attribute checks.
5. Stale expected values, nonexistent attributes, invalid indexes and element-child replacement reject without mutating the source, including failure after an earlier valid edit.
6. Untyped/plain-JS attempts to edit protected attributes or executable/style nodes reject.
7. Duplicate rule IDs and overlapping edits reject, including overlapping changes following a no-op value.
8. Nonoverlapping fields compose against the original; a rule for a different route returns the original object.

Also executed `node --experimental-strip-types --test tests/content-adapter.test.mjs` and its `--test-reporter=spec` variant; both exited 0 and reported one passing file-level test. To expose the individual registered cases, a small native test-runner probe and the direct command above were run; the direct run reported all eight named cases. A test refinement ensured stale-value assertions exercise their own guards rather than first encountering an overlap guard; the final eight-case run passed after that refinement.

Native TypeScript loading emitted Node's `MODULE_TYPELESS_PACKAGE_JSON` warning for ES-module syntax in a package without `type: module`. This is a test-loader performance warning, not a failing assertion. Package configuration was deliberately left unchanged. These tests require a Node version supporting native type stripping; verified here with Node 24.21.0. No test runner package was installed.

### Required checks

| Command | Result |
| --- | --- |
| `npm run lint` | Passed, exit 0; no lint warnings/errors printed. |
| `npm run typecheck` | Passed, exit 0. |
| `npm run build` | Passed with existing approval outside the sandbox, exit 0. Compiled in 12.0s, TypeScript in 5.5s; generated 146/146 static outputs in 3.4s. Existing home/catch-all route families retained. |
| Final `npm run lint && npm run typecheck` | Both passed. |
| `git diff --check` | Passed, no whitespace errors. |

Build approval was used because the prior implementation established that Turbopack's CSS processor requires a local port that the sandbox blocks. There was no new failed sandbox build or package installation in this task.

### Production route checks

Started a temporary local production server:

```text
npm run start -- --hostname 127.0.0.1 --port 3002
```

Next 16.2.1 became ready. It warned that `next start` is not the recommended launcher for `output: standalone` and recommended `.next/standalone/server.js`. The existing configuration was not changed; the local server did serve the verification requests. This check does not certify standalone deployment packaging.

Ran `node /tmp/redcarpert-03-routes.cjs` with local-server access approval. It independently read captured route keys, checked `.next/prerender-manifest.json`, fetched every route with four workers and verified the floating control/preview markup and omission of the original chat settings. Actual result:

```json
{"capturedRoutes":143,"manifestMissing":[],"http200":143,"previewPresent":143,"originalChatSettingsOmitted":143}
```

Exit 0. Therefore all 143 captured routes remained in the prerender manifest and returned HTTP 200 in this production-server session. The build's 146-output progress count includes additional framework outputs; it is not substituted for the captured route count.

### WhatsApp regression checks

Reused the previous temporary nonvisual interaction runner, changing its local test-server port to 3002 in a temporary copy:

```text
PLAYWRIGHT_BROWSERS_PATH=/tmp/redcarpert-playwright node /tmp/redcarpert-03-enquiry-test.cjs
```

Chromium and required OS libraries were already available from Implementation 02. No browsers/packages were downloaded during Implementation 03. The runner creates no screenshot or evidence files.

Passed: Home, Contact and Dress Details at desktop 1440×900, tablet 768×1024 with iPad emulation and mobile 390×844 with iPhone emulation. All nine cases verified click/tap, exact message/notice, clipboard write/read, focus containment/return, Close/Escape, Enter/Space, viewport fit, unchanged URL/scroll state and omitted captured settings. Each device profile also passed synthetic legacy-handler ordering, removal/interception of five dynamic WhatsApp destination forms and clipboard-denied manual-copy fallback.

Actual summary:

```text
pageDeviceCases: 9
waRequests: 0
popups: 0
pageErrors: []
exit: 0
```

`window.open` was instrumented and remained unused. Nonlocal browser requests were blocked, with WhatsApp request attempts counted before aborting; none were observed. No recipient was contacted. These checks confirm the prior preview behavior remains functional with this adapter integration; its source files were not modified.

The temporary production server was stopped with Ctrl+C after verification (process exit 130, intentional shutdown). No screenshots or pixel comparisons were used.

## 7. Git changes

Only one existing tracked file is modified by this task: `src/components/SiteDocument.tsx`. It adds two imports, locally aliases the original document prop and calls the adapter before the unchanged renderer. New files are the adapter, empty registry, focused test suite and this report; `git diff --stat` does not include them until tracked.

Final observed `git status --short` after report creation:

```text
 M src/components/SiteDocument.tsx
?? codex-reports/03-content-adaptation.md
?? src/data/content-adaptations.ts
?? src/lib/content-adapter.ts
?? tests/
```

Final observed `git diff --stat`:

```text
 src/components/SiteDocument.tsx | 5 ++++-
 1 file changed, 4 insertions(+), 1 deletion(-)
```

Untracked files, separately reported by `git ls-files --others --exclude-standard`:

```text
codex-reports/03-content-adaptation.md
src/data/content-adaptations.ts
src/lib/content-adapter.ts
tests/content-adapter.test.mjs
```

The new implementation/test files total 205 lines (adapter 88, registry 5, tests 112); this report is additional documentation. Final source-hash verification again confirmed that only `SiteDocument.tsx` changed among pre-existing source/report/package files, and `codex-reports/` contains only reports 01, 02 and 03. The report was then updated solely to record these results. No changes were staged, committed or pushed.

## 8. Errors, limitations and unresolved risks

- No remaining test/lint/type/build failure was encountered in this task. Node's module-type warning and Next's standalone-launch warning are described above; neither was hidden by changing unrelated configuration.
- No browser test of all 143 pages' complete interaction sets was performed. All routes passed HTTP/markup checks; interaction tests cover representative templates. No Safari, Firefox, physical device or assistive-technology testing was performed.
- No visual fidelity certification is claimed. Original design files and payload identity were checked instead of screenshots, as instructed.
- Rule configuration is trusted local code. The adapter is not a URL sanitizer, remote-content importer, CMS or security boundary. Future destination/image replacements require explicit content/provenance and safety review.
- Exact paths can become stale after a future source regeneration. Matching/old-value guards should fail visibly; authors must inspect the new source rather than weaken guards. Two genuinely indistinguishable nodes require an intentionally verified path.
- Per-rule searches are linear in the selected page's tree; large future rule lists may need measurement. With the current empty list, there is no tree traversal or clone overhead.
- Shared untouched references are intentional; callers must continue treating captured/adapted data as immutable. The adapter itself does not mutate them, and frozen-source tests enforce this behavior.
- Global metadata, CSS-background URLs, new DOM structures and a normalized product dataset are outside this minimal API. They remain separate future work requiring approval.
- All existing legacy-runtime limitations documented in the prior reports remain outside scope; no new runtime cleanup/refactor was attempted.

## 9. Recommended next implementation task

After independent review, approve one narrowly scoped content replacement through the adapter—for example, the homepage hero button label only, with its existing destination retained. Inspect the actual original text/attributes, add one route-specific rule, replace the empty-registry acceptance expectation with an exact approved-change assertion, and verify that only that text slot changes while all structural/style/runtime fields remain equal. Run lint, TypeScript, build and a nonvisual navigation/preview smoke test. Do not bundle logo, image, route, product or other branding changes into that first adaptation task.

No such replacement has been implemented. Stop here for independent review and further approval.
