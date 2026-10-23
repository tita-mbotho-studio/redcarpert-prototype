# Redcarpert Wedding Dresses — Architecture Assessment

Assessment date: 23 October 2026. Workspace: `/workspaces/redcarpert-prototype`.

## 1. Task Summary

**Objective:** plan a content-led conversion of the approved Bridal Vanesa clone into a Redcarpert Wedding Dresses client prototype, preserving its visual implementation.

**Approved scope:** Home, Wedding Dresses (Mermaid and Ball Gown only), Dress Details, Digital Lookbook, Our Brides, About Us and Contact Us. WhatsApp-only enquiry previews, Pexels sample imagery and a downloadable lookbook PDF. No separate Atelier, Fitting Services or Store pages; no cart, checkout, payment, database, admin or unnecessary backend.

**Completed:** inspected actual routes, serialized document trees, renderer, client runtime, theme styles, scripts, gallery settings, selected images, configuration and working-tree state. Developed staged recommendations and acceptance criteria. Created this report only.

**Not completed:** no website changes, dependency installs, branch changes, commits or pushes. No application startup, browser interaction testing, screenshots, lint, TypeScript check, production build, network audit or dependency vulnerability audit. The user's previous successful checks and visual approval are background information, not tests independently repeated here. Build/typecheck were deliberately avoided because Next and incremental TypeScript can write files outside the report exception. Recommendations below are proposed work, not working features.

## 2. Repository Architecture

### Rendering and routing

This is Next.js App Router around extracted WordPress/The Story/WooCommerce markup, not a conventional React design system. `src/data/site.ts` is 11,038,446 characters and only five physical lines. Line 5 exports `sitePages = JSON.parse(<escaped JSON string>) as Record<string, SiteDocumentData>`. It contains 143 captured documents, including repeated headers, footers, styles and contact settings. There is no normalized product dataset.

Route inventory from decoded keys:

| Family | Count | Meaning |
| --- | ---: | --- |
| `/` | 1 | Fullscreen homepage |
| `/product` and `/product/*` | 121 | Catalogue plus 120 detail pages, including bags |
| `/product-category/*` | 9 | Categories, nested categories and pagination |
| `/product-tag/*` | 5 | Tag archives |
| `/marka/*` | 2 | Brand archives |
| Other named pages | 5 | About, Contact, Our Brides, Atelier, Store |

`src/app/page.tsx` renders `sitePages["/"]`. `src/app/[...slug]/page.tsx:11–33` sets `dynamicParams = false`, generates all non-home routes from the data keys, derives title/description and invokes `notFound()` for missing documents. Merely adding a navigation link will not create a route; additions must enter this map or have an explicit App Router route. Existing links frequently have trailing slashes; normalize and test route handling before migration.

`src/app/layout.tsx` imports `globals.css`, uses English language markup and hydration-warning suppression, and defines original brand favicons. `src/data/metadata.ts` holds global Bridal Vanesa title/description. `src/data/runtime.ts` holds WhatsApp accessibility text and a generic form-success string. No API routes, database implementation or checkout route was found in `src/app/`.

### Components and runtime

`src/types/site.ts` describes a `DocumentNode` as text or `{ tag, attrs, children }`. Documents also carry styles, body/html classes, script paths, theme configuration, optional post-scripts and captured `rendered` classes.

`src/components/SiteDocument.tsx`:

- `parseStyle` (line 18) parses inline CSS into React properties; strips `!important`. This is not a general CSS parser.
- `selectedValues` (line 30) preserves selected options.
- `renderNode` (line 38) maps HTML/SVG attribute names, skips script/noscript nodes and inline event attributes, handles input defaults, textarea and void tags, then recursively calls React `createElement`.
- `SemanticTree` (line 63) renders the node array.
- `SiteDocument` (line 67) emits linked and inline styles in recorded order, renders the tree, then mounts `SiteRuntime`. Inline style blocks use `dangerouslySetInnerHTML`.

`src/components/SiteRuntime.tsx:7–125` runs a layout effect that sets body/html classes, captures catalogue DOM nodes, implements sorting, captures submissions, activates chat and loads scripts sequentially. Catalogue selectors are `.woocommerce-ordering ~ ul.products`, `:scope > li.product`, `.woocommerce-ordering select.orderby`, `.price` and `.star-rating`. Sorting changes `first`/`last` classes and the `orderby` query string with `history.replaceState`.

The capture-phase submit handler (line 55) blocks **all** forms and appends a success message claiming receipt in the preview. Another handler catches `.pexeto-contact-form .send-button`. These are simulated submissions, not delivery. The current Contact document has zero form nodes, but `/product/alpina` contains the WooCommerce review form `#commentform`, author/email/rating and consent inputs.

Chat code (lines 85–101) reads the first `[data-settings]`, builds a `wa.me` URL from its captured `number`, makes `#ht-ctc-chat` clickable and opens it in a new tab. It supports keyboard activation but has no destination verification. This is unsafe for a client prototype until replaced with a non-sending preview.

Scripts are appended to `document.body` with `async = false`, awaited in this order: `scripts`, `themeConfig`, `postScripts`. Failures log to console. Cleanup removes this component's listeners, but does not remove loaded scripts, destroy jQuery plugins, restore document classes, cancel an in-flight script or undo a chat node moved to the body. Route transitions, remounts and development strict effects require explicit testing.

### Styles, scripts and assets

`src/app/globals.css` has ten lines of colour variables; it is not the principal layout stylesheet. Measured per-page CSS order lives inside `sitePages[route].styles`. Home has 18 style entries; About, Contact and Our Brides have 19; the inspected Alpina product has 25. Preserve both linked styles and inline overrides.

`public/site-assets/` occupies approximately 1.3 GB. Inventory: 1,514 PNG, 1,463 JPEG, 442 JPG, 338 JS, 20 CSS, 18 TTF, 14 GIF, 12 EOT, five SVG, five WOFF and one WOFF2. There are 322 `config*` files, exceeding the 143 current routes; do not assume all files are used. `public/images/` occupies 51 MB; `public/gallery-data/` 248 KB; `public/seo/` 192 KB. `public/fonts/` contains Pexeto icon/arrow fonts. `public/videos/` has a placeholder.

Important executable assets:

| File under `public/site-assets/` | Inspected responsibility |
| --- | --- |
| `e46f2ac031ed629947.js` | jQuery 3.7.1 |
| `6b7c30dcb74667208b.js` | jQuery Migrate 3.4.1 |
| `1fdcf4962119875a03.js` | Underscore bundle |
| `7632d73540298bafbc.js` | Theme/plugin bundle, touch gestures, mobile detection, site initialization, legacy lightbox code |
| `theme-fullpage.js` | PEXETO.Fullpage and bundled fullpage behavior |
| `1f4dc40cc6a36530d0.js` | Another fullpage implementation, also loaded by Home |
| `01abc0025b0ebadcca.js` | Legacy HTML5 compatibility shim |
| `abbd5ecab051807f15.js` | Masonry 3.0.1 bundle, used by Our Brides/other galleries |
| `910f3c7a1e58907551.js` | Slick gallery |
| `492b5cd01f7b084aee.js` | WooCommerce single-product tabs/reviews/gallery behavior |
| `c8630516746b45a859.js` | fancyBox 3.3.5 |
| `59d3102cc96d61c0b8.js` | Zoom 1.7.20 |
| `8df11fa8f184a8e1b5.js` | WPGIS gallery initialization |
| `product-gallery-settings.js` | `wc_single_product_params`, `object_name`, Slick/lightbox/zoom options |
| `config-home.js`, `config-our-brides.js`, `config-product--alpina.js` | PEXETO settings, sticky header, WooCommerce init and legacy contact initialization; Home additionally initializes Fullpage |
| `gallery-fixture-loader.js` | jQuery AJAX prefilter mapping selected `/wp-admin/admin-ajax.php` portfolio actions to local JSON |

The fixture loader exists but was not referenced by any decoded document's data. Do not infer that it currently protects every gallery request. Our Brides is primarily captured markup: 448 `.qg-img.qg-no-title` nodes, two `.quick-gallery.page-masonry` containers and 460 image nodes including shared chrome. Preserve this actual quick-gallery structure; do not replace it with a generic portfolio UI.

Dependencies are declared in `package.json`: Next 16.2.1, React/React DOM 19.2.4, TypeScript ^5, Tailwind ^4, Playwright ^1.61.1, pixelmatch/pngjs, Base UI and UI utility packages. Node engine is >=22. No flipbook or PDF dependency is declared. `next.config.ts` uses `output: "standalone"` and `devIndicators: false`. `tsconfig.json` enables strict, noEmit, incremental and `@/*` mapping. ESLint excludes `public/site-assets/**`, leaving legacy executable JS outside normal lint coverage. No installed-versus-lockfile consistency check was performed.

## 3. Inspection Evidence

### Exact files examined

- `src/data/site.ts` (prefix/suffix and programmatically decoded selected properties, not a whole-file dump).
- `src/data/metadata.ts`, `src/data/runtime.ts`, `src/types/site.ts`.
- `src/components/SiteDocument.tsx`, `src/components/SiteRuntime.tsx`.
- `src/app/page.tsx`, `src/app/[...slug]/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`.
- `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore`.
- All script files individually named in the architecture table above (selected headers/bodies), and `public/site-assets/config-home.js`, `public/site-assets/config-our-brides.js`, `public/site-assets/config-product--alpina.js`.
- `public/site-assets/0934bc001cd37d30df.css`, `public/site-assets/4b1b2df725bb36c52a.css`, `public/site-assets/ac99705fde729a55c0.css`, `public/site-assets/6814810d368ff64b55.css`, `public/site-assets/a397f1784786614528.css` (selected rules/media queries).
- Visually opened local background images `public/site-assets/ec8b6b2c4222396c44.png`, `public/site-assets/9def3725208290c4ef.png`, `public/site-assets/46f8a1c412d65fd42b.png`.
- Inventoried `public/`, `src/` and gallery-data filenames; did not exhaustively open every image/fixture or inspect credential directories.

### Commands and meaningful results

Read-only shell commands used: `pwd`; `rg --files` with source/config/public/report/AGENTS filters; `head -100`; `git status --short`; `find .. -name AGENTS.md -print`; `ls -la`; `cat` on the named small source/config files; `wc -l src/data/* src/components/SiteRuntime.tsx src/app/globals.css`; `sed -n` on runtime/theme ranges; `head -c`/`tail -c` on serialized data and selected scripts; `find public -maxdepth 2 -type d`; `ls public/site-assets`; `du -sh public/*`; `rg -n` for responsive/fullpage/logo/footer/mobile terms; `git diff --stat`; `test -e scripts/compile-site-data.mjs`; `test -d docs/research/bridalvanesa.com/documents`.

Python standard-library scripts read files only: decoded the escaped JSON, counted routes/assets, traversed selected document nodes by tag/class, listed route/style/script references, examined selected CSS media/rules and checked script/stylesheet path existence. The successful decoding method was:

```python
s = Path("src/data/site.ts").read_text()
raw, _ = json.JSONDecoder().raw_decode(s.split("JSON.parse(", 1)[1])
pages = json.loads(raw)
```

Two initial parser attempts failed with `JSONDecodeError` because they treated the TypeScript wrapper as plain JSON. They were corrected with the two-stage decoding above; no source mutation resulted. Some early asset/style listings exceeded terminal output limits; subsequent targeted reads supplied the relevant evidence. The search for AGENTS instructions returned no paths. No subagents were used.

Results: 143 routes; 171 unique script/theme/post-script/linked-style references, **zero missing local files within that set**. This does not prove all nested CSS URLs, image URLs, srcsets, JSON fixtures or network requests resolve. `/product` contains 100 product-title/card image nodes. `/product/alpina` has three WPGIS popup links and a review form. Home has no form and no node with a footer ID; Contact, About and Our Brides each contain `footer#footer.center`.

The source-data comment references `docs/research/bridalvanesa.com/documents/*.json` and `scripts/compile-site-data.mjs`; both locations are absent in this checkout (existence tests failed). The `next.config.ts` comment also references `scripts/diff.mjs`, while no scripts directory appears in the root inventory. Do not plan on a working generation or screenshot-diff pipeline without restoring or replacing it under approval.

Source references for the huge data file should use decoded route + node path instead of pretending line 5 is useful precision. Home's logo is at `nodes/1/1/2/1/1/1/1/0`; hero section at `nodes/1/1/4/1/1/0`; brand-text section at `nodes/1/1/4/1/1/2`. Paths are zero-based indexes through successive children arrays (the first index addresses `nodes`).

## 4. Visual Preservation Assessment

### Actual homepage composition

Home has three sequential `.section.section-text.layout-cc` nodes with backgrounds, in order:

1. `/site-assets/ec8b6b2c4222396c44.png`, hero title “2026 - 2027 Collectıon”, description and `.button` “EXPLORE COLLECTION” linking to `/product/`.
2. `/site-assets/9def3725208290c4ef.png`, background section.
3. `/site-assets/46f8a1c412d65fd42b.png`, “VANESA BRIDAL” title and Contact button.

All specify `background-position:center center`. The opened bitmaps already contain a dominant central portrait and side image/blur treatment. The homepage does **not** implement that appearance as three separate responsive image elements or a three-column React grid. Theme `.section-text, .section-textimg` uses `background-size: cover`; narrower containers crop the wide bitmap around its centre. Replacing these assets with ordinary portrait photographs without matching the composite canvas would change the desktop design. Preserve the composite asset approach, canvas proportions, subject placement, background positioning and section/runtime sizing. Create Pexels-based replacement composites in a later authorized asset task.

**Uncertainty requiring visual review:** the requested “three-image composition” terminology is not literally represented by three independently positioned image nodes. Inspection establishes the raster composition and cropping mechanism; it does not independently prove the exact approved mobile appearance. Confirm against the existing site at the reference viewports before replacing assets. Do not invent a side-image hide/show breakpoint.

`public/site-assets/a397f1784786614528.css` contains the main theme rules, including section layout around lines 5670 onward, mobile behavior at 6186–6254, logo constraints around 7518–7525 and media queries at 1000, 768 and 520 px. WooCommerce's `/site-assets/90c52a95f613e6f803.css` is linked with media `only screen and (max-width: 768px)`. `6814810d368ff64b55.css` also has a 768 px query.

`PEXETO.utils.checkIfMobile` in `7632d73540298bafbc.js:2285–2323` caches user-agent detection and adds device + `mobile` body classes for iPhone/iPad/iPod/Android/BlackBerry/IEMobile. `theme-fullpage.js:50–140` uses it to control autoplay, scrolling and minimum section height. `.mobile` CSS restores document scrolling, makes the header static, changes section positioning and hides `.fullpage-data`. Desktop-width resizing and mobile-device emulation are therefore separate test cases. Modern tablet user agents may not match this old detector.

Home's recorded theme inline style (index 14) sets `#logo-container img` width 350px and height 150px, body text 13px, page heading 51px and page-title wrapper height/min-height 90px. Responsive theme rules constrain logo image height to 40px within a media block. These declarations interact: do not infer actual rendered dimensions from a single rule. Hero title has inline 40px and Montserrat. Preserve font assets, fallback order and computed sizing.

Home has no conventional `footer#footer` in its captured tree; other inspected pages do. Preserve existing homepage fullpage/chrome behavior and verify the user's intended footer reference instead of automatically appending another page's footer.

### Preservation method and proposed checks

Retain DOM nesting, IDs/classes, inline measurements, stylesheet cascade order, body classes and plugin hooks. Use narrow content adapters against a copy of the captured document. Keep the captured baseline intact until each replacement is reviewed. Avoid broad brand string replacement across serialized CSS/scripts or all files. Do not migrate to new Tailwind/UI components as part of content conversion.

Before implementation, capture baseline viewport and full-page screenshots at representative desktop 1440×900, tablet 768×1024 and mobile 390×844, plus 1000/768/520 px boundary pairs. Include actual mobile UA/touch emulation and desktop UA at narrow width. Wait for fonts/images/plugin initialization; control animation state. Record bounding boxes for header/logo/navigation, cards/grid gaps, headings, sections and footer, plus computed fonts, image dimensions and crop positions. Repeat at the same scroll/fullpage positions and compare overlays/pixel diffs, masking only intentionally changed content regions. Manually review text wrapping, loaded fonts and photographic crops. Test menu, sticky header, scroll, gallery, lightbox, hover, orientation and keyboard interactions. These checks are proposed, not performed.

## 5. Content and Functionality Strategy

### Branding and shared chrome

Introduce a small typed brand configuration for display name, logo, placeholder contact text, social destinations and enquiry mode. Apply it through deliberate tree transformations that assert expected selector counts, rather than editing an 11 MB escaped string by hand. Initially keep renderer and theme CSS unchanged. Repeated headers/footers require consistent transformations on every retained route. Replace alt text, titles, metadata, favicon/SEO assets, background images and visible copyright/contact copy as well as logos. Keep logo canvas/padding and alignment compatible with existing rules; the longer brand name needs visual approval.

Navigation should expose only the seven approved page types, with Mermaid and Ball Gown beneath Wedding Dresses. A conservative option retains `/product` and `/product/[slug]` URLs with new labels, adds `/digital-lookbook`, and keeps existing named informational routes. Human approval of final public URL naming should precede link/PDF generation; `/wedding-dresses` is an alternative, not an implemented route. Avoid introducing competing route sources.

Our Brides must visibly say these are **Pexels sample photographs, not Redcarpert customers**. Replace corresponding full-size lightbox images, thumbnails, captions and accessible text consistently. About retains its layout with provisional Redcarpert copy and a city-level Pretoria, South Africa map near the bottom. No street address or store marker is justified. Use a labelled city-centre map/appropriate attribution and review external map privacy/network behavior; map provider is undecided. Contact retains typography and layout with clearly labelled unconfirmed business/phone information, WhatsApp only, no email/mailto enquiry or form. Keep social icon visuals but make unconfirmed destinations non-navigating, accessibly labelled placeholders; do not use `href="#"` that causes accidental jumps.

### Single local product dataset

Propose `src/data/products.ts` with readonly typed records and helpers, separate from extracted page data:

```ts
type DressCategory = "mermaid" | "ball-gown";
type DressImage = {
  src: string; width: number; height: number; alt: string;
  sourcePage: string; photographer: string; sample: true;
};
type Dress = {
  id: string; slug: string; reference: string; name: string;
  category: DressCategory; description: string;
  images: readonly DressImage[]; catalogueOrder: number;
};
```

Use deterministic unique IDs, slugs and references such as `RC-M001`/`RC-B001`, clearly dummy names, descriptions without unsupported tailoring claims and ordered galleries with cover first. Do not include price, size, inventory or checkout fields. Keep category labels in a single mapping. Maintain a reviewed local Pexels asset/source manifest; no downloads or image selection occurred during assessment. Preserve card crop ratios and supply thumbnail/full-resolution variants with intrinsic dimensions. Multiple photographs must be labelled representative imagery if they cannot honestly depict one dress.

Catalogue, details, lookbook manifest and enquiry text all derive from this dataset. Derive URLs through one helper; validate duplicate IDs/slugs/references, missing images and unsupported categories. Keep the full dataset out of the global client runtime; send only necessary enquiry/lookbook data to client components.

### Catalogue and details

Use the existing catalogue node structure as a template for `ul.products > li.product` and WooCommerce link/title/image classes, retaining column/first/last behavior. Render only two category choices. Replace misleading price/rating sorting choices with meaningful name/collection order while preserving the select's appearance and width. Remove sizes and prices from markup, accessible content and metadata; account for their former space with measured container dimensions so cards do not collapse. Update counts and pagination to actual dummy records. Every image/title/card target must open the matching detail route.

Reuse the WPGIS gallery structure (`.wpgis-slider-for`, `#wpgis-gallery`, `.wpgis-slider-nav`, `.wpgis-popup`, `data-fancybox="product-gallery"`), synchronized image order, zoom and lightbox settings. Replace name/category/reference/description in the existing summary. Remove review inputs and commerce UI. Add the enquiry button within the existing design vocabulary, checking wrapping and vertical spacing. Avoid deleting WooCommerce gallery/tab scripts until their exact responsibilities have been disentangled and regression-tested.

### Safe WhatsApp previews

The first safety change should make **all** global and dress enquiries open a local accessible preview dialog, with visible “Preview only — WhatsApp number not confirmed” text, dress name, reference, category and product URL. Provide copy-message/copy-link controls; no `wa.me`, WhatsApp intent or guessed numeric placeholder destination. General contact enquiries use the same preview system. Use a nullable confirmed destination configuration; default is preview only. A future confirmed destination may enable a separate explicit outbound action, but is outside this prototype's current requirements.

Build messages from the selected dataset record and canonical route helper, e.g. “Hello Redcarpert, I would like to enquire about [name] ([reference]), [category]. [absolute product URL]”. Resolve the origin from the actual preview location or a validated configured public origin; never hardcode Bridal Vanesa or invent a deployment domain. Encode the final message once if outbound integration is later authorized. Treat content as text and validate URL protocols. The preview must remain functional without sending network requests to a phone recipient. Test floating chat, Contact, detail buttons and each magazine dress action. No full phone numbers or captured nonce values need to be copied into reports.

### Interactive lookbook and PDF

Create one new scoped client island inside the existing page shell, rather than altering global fullpage behavior. Derive a deterministic magazine page manifest from products: cover, Mermaid Collection divider and dress pages, Ball Gown Collection divider and dress pages, with any intentional blank pages recorded to maintain spread parity. Store product IDs on dress pages so enquiry actions resolve the same product record. Page numbers and chapter navigation must use this one manifest.

A small browser flipbook library may be justified for realistic two-page desktop page curling/flipping. No existing dependency supplies this. Evaluate a maintained, appropriately licensed candidate in an isolated later task for React 19/Next 16 compatibility, SSR boundaries, touch support, keyboard access and cleanup before choosing/installing it. This assessment makes no claim about current library maintenance or security. Load it only on the lookbook route and dynamically on the client. Avoid legacy theme selectors such as `.section` for magazine pages.

Desktop acceptance requires actual two-page spreads with page-flip animation and a correct cover, not a crossfade or carousel. Tablet should fit available width/orientation without cropped controls; mobile uses one page and touch swiping. Determine lookbook-specific mode from available reader width and page aspect ratio without changing existing site breakpoints. Include previous/next, page selection, chapter jumps, page status, zoom/pan/reset and fullscreen with feature detection/fallback. Buttons must not trigger a page turn; zoom gestures must not unexpectedly swipe pages. Keyboard navigation, focus return, reduced-motion behavior, image alternatives and a readable fallback are required.

Generate a static downloadable PDF during a later authorized build/preparation step from the **same** page manifest and product data, using local images and matching fonts. Prefer a prebuilt file in `public/lookbook/` over an application backend or heavy browser PDF generation. Tooling choice remains open; browser print-to-PDF or a PDF library must be reviewed for deterministic output and licensing. Include cover, chapter pages, same ordered dresses/references, sample-image disclosure and product links. Safe PDF enquiry links should lead to a product's local preview flow, never to an unconfirmed number. Rebuild PDF whenever manifest/content changes, record a content fingerprint and verify page count/order, searchable text, links, crops, fonts and download headers. Test memory/download size on a phone. No PDF or flipbook was created here.

### Legacy removals

Retire `/atelier-2`, `/store`, brand/tag archives, Bridal Bags, nested Mermaid subcategories, all-dresses/uncategorized archives and obsolete pagination; remove old product records after the new route inventory is approved. Decide deliberately whether old URLs return 404 or redirect to a relevant retained route; do not expose excluded pages in navigation. No cart/checkout route was found, but `.pex-woo-cart-*` markup is repeated in shared headers. Remove cart events/semantics and overlays while retaining measured header spacing; use an inert spacer only if needed to preserve geometry, not a disabled shopping button.

Remove review forms, misleading receipt messages, unused form interception, original phone/email/address/service claims, original social/vendor links, bag filters, price/size UI and related links. Candidate scripts for removal include the HTML5 shim, unused portfolio fixtures/configs and duplicated fullpage bundle, but **only after reference and browser dependency tracing**. `config-home.js` initializes `PEXETO.woocommerce` even outside commerce pages, and shared WooCommerce CSS controls product layout. Removing everything with “woocommerce” in its name would break preserved UI. Unused public assets should be pruned last from a proven dependency graph, not by filename or age.

## 6. Proposed Implementation Stages

Each future task must produce its own numbered report in `codex-reports/`, recording request, actual actions, files created/modified/deleted, commands/results, tests, visual review and limitations, errors, deviations, assumptions and outstanding work. Implementation reports must include `git diff --stat` and significant changes. Do not commit or push without explicit instruction.

| Stage | Objective / likely files | Intended changes | Risks | Validation / acceptance |
| --- | --- | --- | --- | --- |
| 1 | Safe enquiries: `SiteRuntime.tsx`, `runtime.ts`, narrowly scoped enquiry component/style if necessary | Replace captured-number activation with non-sending preview; preserve floating icon position | Other legacy anchors may bypass the handler; event duplication; dialog focus | Audit all WhatsApp targets; intercept network/window.open in tests; click and keyboard open only local preview; no recipient requests; chrome geometry unchanged |
| 2 | Baseline and content adaptation: new test/adapter files, `site.ts` import boundary, brand config | Establish screenshots and structural assertions; provide an immutable adapter with no initial visual delta | Missing original compiler, 11 MB data, selectors matching wrong nodes | Type/lint/build under authorization; all retained templates render; zero baseline geometry difference before substitutions |
| 3 | Brand/chrome/Home/About/Contact/Our Brides: adapter, metadata/layout, reviewed `public/` assets | Consistent logo/text/navigation; hero “Explore Wedding Dresses”; Pexels composites/galleries; Pretoria map; placeholder contacts; cart removal | Wrapping, logo padding, responsive crops, wrong social targets, gallery height | Desktop/tablet/mobile + boundary screenshots; header/footer/card measurements; source disclosures; map says Pretoria only; no original enquiry/social endpoints |
| 4 | Shared dresses and catalogue/details: `products.ts`, types/helpers, adapters or narrowly scoped templates, route generation | Two categories; dummy names/references; safe dress previews; preserved gallery/cards; prices/sizes/reviews removed | React/jQuery mutation conflicts, lost gallery hooks, dead pagination, duplicate routes | Unique-record checks; every card/detail pair; direct load/back/forward; query sorting; gallery swipe/zoom/lightbox; message reference and absolute URL match; visual review |
| 5 | Digital Lookbook: route/data manifest, reader component, scoped styles, package/lock only after library approval | One magazine, desktop spreads, tablet fit, mobile swipe, zoom/fullscreen/navigation/enquiries | Dependency license/compatibility, gesture collisions, memory, global CSS leakage | Isolated library spike; browser/device interaction matrix; keyboard/focus/reduced motion; all dress links resolve; reader does not alter existing pages |
| 6 | PDF: approved preparation script, manifest integration, `public/lookbook/*.pdf` | Deterministic static export of the same magazine | Divergent data, font licensing, large binary, stale links | Compare IDs/order/page count with manifest; open on desktop/mobile; verify search/text/links/download and preview-only enquiries |
| 7 | Route/asset/runtime cleanup and final QA: route map, runtime/config scripts, proven unused assets | Retire excluded routes/features; remove unused code/assets selectively | Shared plugin dependencies, unnoticed dynamic asset URLs, redirects | Reference graph plus browser request audit; no unexpected 404s/legacy hosts; lint/type/build; full approved-route/device regression; final report and diff stat |

Stage 1 is intentionally narrower than the overall content conversion. Stages are proposals and may be split into smaller approved tasks. Baseline captures should precede every visible change, including Stage 1's dialog, in an authorized follow-up.

## 7. Errors, Risks and Uncertainties

1. **Immediate enquiry risk:** captured WhatsApp settings are live inputs to an outbound handler. “Placeholder” labelling alone would not neutralize them. Do not click during review until guarded/intercepted.
2. **Visual ambiguity:** composite backgrounds and absent homepage footer differ from a literal reading of the request. Existing rendering remains authoritative. Confirm approved screenshots/device behavior; do not rebuild an imagined grid/footer.
3. **Missing generation/QA tools:** documented JSON source trees, compilation script and referenced diff tooling are absent. Current serialized data must be treated as the available source until a reviewable replacement workflow is approved.
4. **External resources:** decoded site data includes hosts `bridalvanesa.com`, `nirvanatakipcim.com`, Instagram, YouTube, Twitter, Pinterest and TikTok. A header Instagram icon still uses an absolute `nirvanatakipcim.com` asset URL. Host occurrences include navigation, image references and possible markup namespaces; counts are not counts of live requests. Audit all href/src/srcset, CSS URLs and plugin-generated links, including full-size gallery targets and footer vendor links. No remote availability was checked.
5. **Runtime lifecycle:** imperative jQuery reorders React-rendered nodes, chat is moved outside its initial subtree, scripts can initialize repeatedly and two fullpage implementations are listed on Home. Possible transition leaks/conflicts require reproduction; not established as current failures.
6. **Legacy dependencies/security:** fancyBox's inspected header says GPLv3 or commercial license; client-facing reuse requires license review. Old Masonry/zoom/prettyPhoto-style code deserves provenance and security review. Presence/version alone does not establish a vulnerability. No advisory database, npm audit or fresh compatibility research was consulted. All 171 linked scripts/styles exist locally, but runtime success remains unverified.
7. **Performance:** 1.3 GB assets, repeated trees/styles/configs, 100 catalogue cards and 448 bride gallery tiles can increase builds, payloads, decoding and memory. Assets in public are not necessarily all downloaded. Measure actual requests/route payloads before claiming transfer sizes. Product photographs and magazine/PDF need bounded resolutions and lazy loading without layout changes.
8. **Trust boundary:** renderer drops event attrs/scripts but is not an HTML/URL sanitizer; it still accepts arbitrary tags, URLs and inline CSS. Only reviewed local content should enter it. Never feed remote/user HTML into the document map. Evaluate CSP against inline styles and plugin needs after dependency tracing. No current exploit was demonstrated.
9. **Forms/accessibility:** global submission interception currently claims receipt without storage. Remove review/contact simulation rather than retaining false success. Legacy focus management, gallery descriptions, mobile controls and heading structure require browser/accessibility review. Suppressing hydration warnings is not proof hydration is correct.
10. **Content rights and truthfulness:** no Redcarpert logo, business phone, social URLs, hours, street address or actual customer photos are confirmed. Clearly label placeholders and sample images; do not repurpose original business claims. Pexels image provenance/usage terms and suitable dress photographs require human review at selection time.
11. **Unverified environment:** no dependency installation integrity, runtime Node version, production hosting configuration, installed browser availability or current type/build/lint status was checked. Existing `.next`, `node_modules` and ignored `tsconfig.tsbuildinfo` are present but do not prove current checks pass.
12. **Inspection errors:** the two JSON parser failures and truncated listings described above were resolved with selective inspection. No broken linked script/style files were found. This is an architecture assessment, not exhaustive code/security or visual certification.

## 8. File Change Verification

Initial `git status --short` output was empty. Initial and pre-report `git diff --stat` output was empty. No pre-existing changes were observed.

Only authorized write: created `codex-reports/01-architecture-assessment.md` and its parent directory. No existing website/source/configuration files were modified, renamed, deleted, reformatted or regenerated. No dependencies were installed, branches changed, commits created or pushes performed.

Final verification commands: `git status --short --untracked-files=all`, `git status --short`, `git diff --stat`, `git diff --exit-code`, and a read-only report existence/size check. Results are recorded below after creation. Git tracks file content rather than proving every ignored filesystem byte; no build, server or formatter was run during this task.

Final observed output:

```text
$ git status --short --untracked-files=all
?? codex-reports/01-architecture-assessment.md
$ git status --short
?? codex-reports/
$ git diff --stat
(no output)
$ git diff --exit-code
(no output; exit 0)
```

The report existence check passed. The verification command completed with exit 0. The report is the sole untracked file; tracked source files have no diff. This verification text was subsequently added only to this same report.

## 9. Recommended Next Task

**Smallest safe implementation: disable outbound legacy WhatsApp activation and replace it with a local, non-sending enquiry preview, keeping the existing floating icon's geometry and styling.** This removes the most direct client-demo risk before content substitution introduces more enquiry buttons. Do not bundle branding, product changes, library installation or route cleanup into that task.

First capture the icon/header at desktop/tablet/mobile sizes. Inspect every WhatsApp destination in document data and loaded scripts; update the current handler and any bypass paths. Use an explicit preview-only default with no number, not an invented destination. Verify click/Enter/Space, focus and close behavior, copy-message behavior and all retained routes, intercepting outbound navigation/network so no real recipient can be contacted. Confirm body scroll and layout are restored on close. Run authorized lint/type/build and browser checks, record actual outcomes and limitations in `codex-reports/02-...md`, and include `git diff --stat`. Implementation must await explicit approval.
