# Implementation 10 — Vite and GitHub Pages migration

30 October 2026. Repository: redcarpert-prototype. Branch: `implementation/10-vite-github-pages`. Approved baseline: `608804b` (Implementation 09). No commits, pushes, merges, main changes or deployments.

## Assessment and scope

Assessed package/lock/configuration, the route allowlist, both Next page renderers and layout, semantic-tree renderer, all document adapters, catalogue/sample data, runtime hooks, enquiry dialog, Digital Lookbook, PDF route/writer, existing tests and relevant architecture/content/navigation/footer/catalogue reports. Implementation 09 has no separate report in this checkout; its editorial renderer, reader and PDF implementation/tests were inspected directly. The original captured document trees and assets remain source material.

The old application was a React/Next shell around captured WordPress/The Story markup. Its visual dependencies include the ordered local theme CSS, fonts, PEXETO/fullpage animations and product gallery/zoom/lightbox plugins. React's actual responsibilities were HTML serialization, mounting the reader/dialog and attaching lifecycle hooks. Sharp was previously an indirect Next dependency used by the PDF route and tests; it is now an explicit, patched build/test dependency.

## Architecture and changed files

- `scripts/generate.ts`: deterministic build-time HTML serializer. Applies the same guarded adapters in the approved order; escapes text/attributes; preserves semantic markup, inline styles, ordered stylesheet links, body/html classes, metadata, images and authored CSS. Omits captured executable nodes, inline event attributes and chat recipient settings. Real WhatsApp destinations become local preview controls before publication.
- Generates ten complete, separate `index.html` documents: `/`, `/product/`, `/product-category/mermaid/`, `/product-category/ball_gown/`, `/digital-lookbook/`, `/our-brides/`, `/about-us/`, `/contact-us/` and the two `/product/preview/sample-*` pages. Generates a standalone `404.html`. The existing fail-closed route allowlist remains authoritative; no retired captured route is emitted.
- Asset collection follows only approved HTML/runtime references and transitive stylesheet URLs. Copies 137 existing dependencies into the staging public directory, rewriting known local URL namespaces for `/redcarpert-prototype/`. Original source assets are never rewritten. Missing dormant payment-icon URLs in copied theme CSS become `none`; required rendered assets are checked in browser/build tests. Captured WordPress AJAX configuration is excluded from copied configuration scripts.
- The existing PDF writer in `src/lib/lookbook-pdf.ts` runs during generation. Sharp converts the two local approved WebPs to baseline RGB JPEGs with the original quality setting. The illustrated, two-page PDF is published as `digital-lookbook/Redcarpert-Sample-Lookbook.pdf`; the HTML uses a direct static download link. The Next PDF endpoint is removed.
- `vite.config.ts`: multi-page development/production build, repository base, explicit HTML inputs, isolated generated public directory and output to `dist`. Includes a development HTML base-normalization hook and a static 404/route-directory redirect handler for Vite's local servers. GitHub Pages serves the emitted files without that server code.
- `src/client/main.js`, `lookbook.js`, `enquiry.css`: native lookbook Next/Previous updates, static initial reader markup, accessible native enquiry dialog, copy/fallback, Escape, focus containment/return and non-sending click/keyboard interception. General and dress-specific messages are preserved. No recipient, business contact details, sending action or new inventory claims are introduced.
- `src/client/navigation.js`: native desktop hover/focus dropdown and responsive mobile menu/submenu events, retaining captured classes, DOM shell, animations and CSS. Keyboard semantics are provided for menu toggles. Theme menu initialization delegates to this native implementation.
- `src/client/{SiteRuntime,HomepageFooterScroll,HeaderNavigationAlignment,FooterScrollToTop}.js`: lifecycle hooks ported to ordinary browser functions. Preserves ordered effect-library loading, fullscreen instance capture, bounded native footer handoff, momentum guards, Home/logo reset, header alignment and scroll-to-top behavior. All newly authored interaction code uses native browser APIs.
- `src/lib/homepage-header.ts`: fixes an inherited MutationObserver loop revealed by actual mobile-UA/touch testing. Only removes `fixed-header-scroll` when present; removing an absent token itself mutates the class attribute and previously fed the observer indefinitely when mobile classes were added. The visual rule is unchanged. Added regression coverage in `tests/homepage-header.test.mjs`.
- Existing captured jQuery/Migrate, PEXETO/fullpage and Slick/Fancybox/zoom scripts remain local visual-effect dependencies. They are deliberately retained to preserve the approved transitions/gallery behavior. This migration removes React/Next, not every captured theme library. There are no npm production dependencies and no production application server.
- `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore`: Vite/TypeScript build commands, explicit image tooling, native runtime linting, adapter/build typechecking, test commands, ignored generated/dist output. Next, React, React DOM, React typings, Next ESLint integration, Shadcn/Base UI/Lucide React and unused Tailwind/UI dependencies are removed. Sharp is patched to 0.35.5; clean install reported zero known vulnerabilities.
- Removed obsolete `src/app` page/layout/API TypeScript, React `.tsx` components, unused React UI/icon/utility code, Next configuration/environment declarations, PostCSS and Shadcn configuration. Preserved all component CSS used by the approved pages, `src/app/globals.css`, captured data/assets and previous reports. Enquiry CSS moved from its React module to the native client directory.
- `tests/static-build.test.mjs`: output page/path/allowlist checks, no React/Next packages or server payload, no exposed chat configuration/destinations, static PDF checks, parsing every copied classic script and decoding the footer SVG. This caught unsafe broad URL rewriting during development; known-namespace rewriting replaced it.
- `scripts/browser-{check,interactions,touch}.mjs`: repeatable route/refresh/resource, responsive interaction, clipboard and mobile-UA/touch checks. `scripts/README.md` documents commands and deployment approval. Updated only stale homepage-renderer comments in the route module/test.
- `.github/workflows/pages.yml`: main-only `npm ci`, tests, lint, typecheck, production build, dist checks and Chromium regression checks, then Pages artifact upload. Pushes to main validate/build only. Deployment requires a manual workflow dispatch on main with the explicit approval checkbox selected. The deploy job uses the `github-pages` environment and Pages OIDC permissions. Environment required reviewers should also be configured in GitHub; repository code cannot create that policy. No workflow/deployment was executed remotely.

## Validation

- Clean `npm ci`: passed (133 packages installed; zero vulnerabilities reported). Initial sandbox restrictions on network, esbuild/tsx IPC, listening ports and Chromium required authorized escalated reruns; these were environment restrictions, not skipped checks.
- `npm test`: all 14 test files passed, including original adapter/asset/editorial/PDF/route guards, the new observer regression and static deployment tests.
- `npm run lint`: passed across all active source, build scripts and Vite configuration. `npm run typecheck`: passed.
- `npm run build`: passed, producing ten approved pages, one 404, the PDF and local assets. Three Vite warnings concern already-base-prefixed homepage inline background URLs; all three deployed images resolve successfully and are verified in-browser.
- Repeated production build: all 150 output files (HTML, PDF, scripts and assets) have identical SHA-256 hashes.
- `npm run test:dist`: passed. Eleven full HTML files total; no retired HTML, captured document database, Next server output, Next/React runtime packages or backend is shipped. Every local HTML href/src resolves under the base. All copied classic JavaScript parses and the footer SVG decodes.
- Production Chromium matrix: all ten routes at 1440, 768 and 390 pixels, direct navigation and refresh; no page errors, failed resource requests, broken visible images or horizontal overflow. Custom unknown URL returns HTTP 404 and the static not-found page.
- Responsive interactions: desktop ArrowDown progression through the three sections and bounded footer handoff/Home reset; native mobile menu and Mermaid submenu navigation at 768/390; catalogue sample links; sample-specific enquiry message, clipboard copy and Escape dismissal; product image enlargement/close; scroll-to-top handler; downloaded PDF header and filename. The theme hides the footer top control at mobile breakpoints, so its handler is also exercised programmatically there rather than claiming a visible mobile control.
- Additional 390×844 iPhone-UA/touch Chromium case: actual touch swipe advances native homepage scroll; Home resets to zero; enquiry tap/close and mobile menu work. No JavaScript errors. This case exposed and then verified the observer-loop fix.
- Vite development server checked under the same repository subpath: homepage scripts/assets and images resolve without doubled prefixes. Fixed a development-only base duplication found in this check.
- Fixed static sample-link failures by emitting canonical trailing slashes. Tests wait for reader image decode before changing page, avoiding intentional request-cancellation noise. Gallery-close tests wait for the close animation before accessing the footer.
- `git diff --check`: passed. Original `public/`, captured `src/data/` and previous reports have no changes. No files staged.

## Rendering and measured performance

Baseline measurements/screenshots were captured from untouched `608804b` using Next development on port 3008, Chromium, a 900px-high viewport and a fresh browser context per page. Matching Vite production-preview captures used port 4173. These are local single-run observations, **not a controlled production-to-production benchmark**, Lighthouse score or claim about real-world speed. The initial Next route includes development compilation. Resource transfer totals exclude the HTML document itself and include resources loaded during the measurement window; navigation load timing does not measure final animation completion.

| Width | Page | Baseline resource bytes | Vite resource bytes | Baseline load ms | Vite load ms |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1440 | / | 2,812,920 | 2,013,742 | 8799.0 | 523.1 |
| 1440 | /product/ | 2,521,815 | 1,725,337 | 2484.6 | 476.0 |
| 1440 | /digital-lookbook/ | 2,609,901 | 1,813,423 | 1068.3 | 238.7 |
| 768 | / | 2,816,111 | 2,016,933 | 742.3 | 280.7 |
| 768 | /product/ | 2,522,514 | 1,726,036 | 1129.3 | 234.5 |
| 768 | /digital-lookbook/ | 2,610,600 | 1,814,122 | 1053.2 | 239.9 |
| 390 | / | 2,816,111 | 2,016,933 | 682.7 | 321.5 |
| 390 | /product/ | 2,522,514 | 1,726,036 | 1140.2 | 257.6 |
| 390 | /digital-lookbook/ | 2,610,600 | 1,814,122 | 1013.0 | 283.4 |

| Width | Homepage differing pixels | Catalogue differing pixels | Lookbook differing pixels |
| ---: | ---: | ---: | ---: |
| 1440 | 0 | 0 | 361 |
| 768 | 418722 | 0 | 4 |
| 390 | 0 | 0 | 115 |


Screenshots and raw measurements are temporary files under `/tmp/10-*`, `/tmp/baseline-*` and `/tmp/after-*`; they are not shipped or added as repository evidence assets. At pixelmatch threshold 0.1, desktop homepage/catalogue and mobile homepage/catalogue matched exactly. Lookbook differences affect at most 0.033% of pixels in these captures; no broad layout shift was observed. The 768px homepage baseline screenshot ends its first image at y=805 instead of y=900, consistent with a 95px initial vertical offset, while repeated Vite initial-load/refresh measurements settle at scrollY 0, transform 0, and three 900px sections. Header heights match (193px desktop; 95px tablet/mobile). No theme dimensions, background assets, typography, breakpoint or spacing CSS were changed to imitate that baseline offset. This baseline discrepancy remains explicitly for human visual review; a pixel-identical tablet homepage comparison is not claimed.

## Production size and limitations

Final dist: **7,819,605 bytes across 150 files** (about 7.46 MiB), compared with the 1.3 GB source public archive. The authored Vite browser bundle is 16.47 kB raw / 5.62 kB gzip; there are also 22 retained captured effect/configuration scripts.

| Output | Files | Raw bytes | Computed gzip bytes |
| --- | ---: | ---: | ---: |
| .html | 11 | 530,888 | 134,906 |
| .js | 23 | 615,888 | 177,930 |
| .pdf | 1 | 1,457,410 | 1,453,175 |
| .png | 53 | 1,218,016 | 1,201,171 |
| .webp | 5 | 2,020,644 | 2,021,364 |
| .svg | 6 | 505,421 | 152,181 |
| .eot | 12 | 496,828 | 288,082 |
| .css | 13 | 463,528 | 98,740 |
| .gif | 14 | 64,562 | 47,778 |
| .ttf | 6 | 247,340 | 143,675 |
| .woff | 5 | 121,920 | 111,450 |
| .woff2 | 1 | 77,160 | 77,173 |

Gzip numbers are independently computed per file, not a promise about GitHub Pages response compression. The two-page PDF is 1,457,410 bytes. Large photo/font assets are preserved; no performance win is assumed for those unchanged files.


No PDF API, WordPress endpoint, database, commerce service or message-sending backend is needed. The entire source capture remains in the repository for Implementation 11; only reachable visual assets/configuration are copied to dist. Asset pruning intentionally follows all URLs in required theme CSS, including dormant theme UI dependencies, instead of rewriting the approved cascade.

Development regeneration is explicit: restart `npm run dev` after document/adapter edits. Native client changes use Vite hot updates. Browser tests assume preview port 4173 and an installed Chromium. Testing used Chromium desktop emulation and an iPhone UA/touch context, not real iOS/Safari, Firefox or physical devices. GitHub-hosted CI/Pages cannot be verified without a later approved main workflow run; no deployment has been attempted. The tablet baseline offset and retained captured effect libraries are disclosed above.

## Final git status

Branch remains `implementation/10-vite-github-pages`; HEAD remains `608804b`. All implementation changes are unstaged, the staging area is empty, and generated `.generated/`/`dist/` files are ignored. No original captured asset/data or earlier report was changed.

```text
 M .gitignore
 D components.json
 M eslint.config.mjs
 D next-env.d.ts
 D next.config.ts
 M package-lock.json
 M package.json
 D postcss.config.mjs
 D src/app/[...slug]/page.tsx
 D src/app/digital-lookbook/pdf/route.ts
 D src/app/layout.tsx
 D src/app/page.tsx
 D src/components/DigitalLookbook.tsx
 D src/components/EnquiryPreview.module.css
 D src/components/EnquiryPreview.tsx
 D src/components/FooterScrollToTop.tsx
 D src/components/HeaderNavigationAlignment.tsx
 D src/components/HomepageFooterScroll.tsx
 D src/components/SiteDocument.tsx
 D src/components/SiteRuntime.tsx
 D src/components/icons.tsx
 D src/components/ui/button.tsx
 M src/lib/homepage-header.ts
 M src/lib/public-routes.ts
 D src/lib/utils.ts
 M tests/homepage-header.test.mjs
 M tests/public-routes.test.mjs
 M tsconfig.json
?? .github/workflows/pages.yml
?? codex-reports/10-vite-migration.md
?? scripts/README.md
?? scripts/browser-check.mjs
?? scripts/browser-interactions.mjs
?? scripts/browser-touch.mjs
?? scripts/generate.ts
?? src/client/FooterScrollToTop.js
?? src/client/HeaderNavigationAlignment.js
?? src/client/HomepageFooterScroll.js
?? src/client/SiteRuntime.js
?? src/client/enquiry.css
?? src/client/lookbook.js
?? src/client/main.js
?? src/client/navigation.js
?? tests/static-build.test.mjs
?? vite.config.ts
```
