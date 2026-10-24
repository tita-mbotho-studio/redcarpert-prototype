# Implementation 07A — Navigation audit and route map

Assessment: 24 October 2026. Workspace: `/workspaces/redcarpert-prototype`.

## 1. Outcome and assessment boundaries

The existing menu can supply the approved header structure through a narrow, immutable navigation adaptation. **Wedding Dresses already has a suitable dropdown to reuse:** PRODUCTS currently contains Mermaid, Ball Gown and Bridal Bags. Remove the third child later; do not build a new submenu system.

Home, the catalogue, both approved category archives, Our Brides, About Us and Contact Us have captured destinations. **Digital Lookbook has no route or PDF and requires real new functionality later.** Neither Atelier nor Store is a suitable substitute. Clean `/wedding-dresses` paths are proposals, not existing destinations.

This task changes only this report. No navigation, route, content, CSS, script, image, dependency or configuration was implemented or edited. Read the architecture assessment and prior implementation reports, especially 06D. Used selected decoded document trees, source inspection and read-only interaction with the existing production build. Reading the serialized route registry requires decoding its JSON, but inspection was limited to header-linked documents, their category/pagination destinations and one representative dress detail; no 143-page content crawl or rewrite was performed.

The approved order for later implementation is exactly:

1. Home
2. Wedding Dresses → Mermaid, Ball Gown only
3. Digital Lookbook
4. Our Brides
5. About Us
6. Contact Us

No shopping, checkout, payment, price or extra-category navigation belongs in that structure.

## 2. Existing architecture and exact source references

| Source | Relevant responsibility |
| --- | --- |
| `src/data/site.ts:5` | Captured document registry, including separate header copies and static active-item classes. Do not edit this escaped JSON file. |
| `src/app/page.tsx` | `/` renders the captured homepage through `SiteDocument`. |
| `src/app/[...slug]/page.tsx:11` | `dynamicParams = false`; static parameters come from registry keys; unknown documents call `notFound()`. A new href does not create a page. |
| `src/components/SiteDocument.tsx:75` | Existing content/background/footer adapters, style cascade, `SemanticTree`, homepage-only scroll helper, then runtime. Appropriate future integration point for a guarded server-side navigation adapter. |
| `src/lib/content-adapter.ts` | Supports guarded text/existing-attribute edits, not menu insertion, removal, reordering or active-class reconstruction. Do not weaken its protected-attribute policy to implement navigation. |
| `src/data/content-adaptations.ts` | Currently only the homepage brand heading and CTA label. Header links have not been adapted. |
| `src/components/SiteRuntime.tsx:98` | Loads scripts → theme configuration → post-scripts sequentially; installs 06D's homepage instance capture before the homepage config. |
| `src/components/HomepageFooterScroll.tsx:175` | Protected Home/logo activation, native-tail reset, section API navigation and hash handling. Also owns the approved footer handoff and homepage scrollbar scope. |
| `public/site-assets/7632d73540298bafbc.js:1048` | `PEXETO.init.initSite()` calls `new PEXETO.menuNav($('#menu')).init()`. |
| Same bundle, `:1643`, `:1693`, `:1897`, `:1930`, `:1953`, `:1988` | `menuNav`, desktop initialization/hover, responsive cloning, mobile handlers, main toggle and submenu toggle. |
| `public/site-assets/a397f1784786614528.css:871`, `:1464`, `:7215`, `:7333` | Navigation layout, fonts/hover/current states, 1000px responsive media block and mobile menu rules. |
| `public/site-assets/theme-fullpage.js`, `1f4dc40cc6a36530d0.js`, `config-home.js` | Existing fullscreen controller, animation state and initialization. Do not replace or edit these assets. |
| `src/components/EnquiryPreview.tsx`, `SiteDocument.tsx:47`, `SiteRuntime.tsx:88` | Existing safe local WhatsApp dialog, suppression of captured chat settings and activation of the floating control. Preserve. |

The selected homepage, catalogue and informational headers share this source path: `nodes/1/1/2/1`, meaning successive child indexes from `document.nodes`. Prefer route + path/selectors over a misleading reference to the single huge source line.

### Captured DOM and runtime additions

```text
.page-wrapper
  .header-wrapper
    header#header
      .section-boxed.section-header
        #logo-container > a[href="/"] > img
        .mobile-nav > span.mob-nav-btn  ("Menu")
        nav.navigation-container
          #menu.nav-menu
            ul#menu-blog-layouts.menu-ul
              li#menu-item-... > a
              li#menu-item-15821.menu-item-has-children
                a[href="/product/"]
                ul.sub-menu > li > a
          .header-buttons
            [legacy cart button/panel containers]
            .social-profiles > ul.social-icons
```

At runtime the theme inserts `div.mob-nav-menu` immediately after `.section-header`, inside the header. It copies `$('#menu').html()`, including menu IDs, active classes and hrefs. Desktop initialization appends `span.drop-arrow`; mobile initialization adds a separate `div.mob-nav-arrow > span` to each parent with a submenu.

The live DOM consequently has **two** `#menu-item-15418` and two `#menu-blog-layouts` IDs, one in each menu copy. This is existing theme behaviour, not two source menus. Scope future DOM checks to `#menu` or `.mob-nav-menu`; a global `getElementById` can select the hidden desktop copy on mobile. Do not create a second custom responsive menu or initialize the legacy menu twice.

## 3. Current menu labels and destinations

These are captured labels; the theme displays them uppercase through CSS.

| Position | Source label | Menu item ID | Current href | Current destination |
| --- | --- | --- | --- | --- |
| 1 | HOME | `menu-item-15418` | `/` | Working fullscreen homepage |
| 2 | PRODUCTS | `menu-item-15821` | `/product/` | Working legacy catalogue; dropdown parent |
| 2.1 | MERMAID | `menu-item-15421` | `/product-category/mermaid/` | Working category archive |
| 2.2 | Ball Gown | `menu-item-15422` | `/product-category/ball_gown/` | Working category archive; underscore is real |
| 2.3 | BRIDAL BAGS | `menu-item-16276` | `/product-category/bridal-bags/` | Working but excluded category |
| 3 | About Us | `menu-item-15416` | `/about-us/` | Working original business page |
| 4 | Contact Us | `menu-item-15417` | `/contact-us/` | Working original business page |
| 5 | OUR BRIDES | `menu-item-16080` | `/our-brides/` | Working original image gallery |
| 6 | ATELIER | `menu-item-16165` | `/atelier-2/` | Working original gallery, outside approved nav |
| 7 | STORE | `menu-item-16171` | `/store/` | Working original gallery, outside approved nav |
| Logo | Image, alt `Bridal Vanesa` | `logo-container` | `/` | Same homepage destination; preserve existing image and geometry |

### Behaviour and active states

- Desktop: `.navigation-container` floats right; menu items float left. The theme binds `mouseenter`/`mouseleave` on items containing a nested `ul`, adds/removes `.hovered`, checks submenu position against the viewport and calls `fadeIn(200)` / `fadeOut(300)`. The current normal dropdown is 210px wide. No mega-menu class is needed for two categories.
- Responsive mode: the **CSS** `max-width:1000px` block hides the ancestor `.navigation-container` and shows `.mobile-nav`. The child `#menu` can still compute to `display:block` while having no rendered box because its ancestor is hidden. Do not detect visibility from the child's display property alone.
- `.mobile-nav` toggles the cloned menu using jQuery height show/hide animation and an `inAnimation` guard. The mobile submenu arrow toggles its adjacent `ul` and `.mob-sub-opened` with the same animation guard. The parent anchor has a real `/product/` href and navigates to the catalogue; the separate arrow expands categories. Only parent links with `href="#"` are bound as toggles themselves. Keep Wedding Dresses a real catalogue link; do not change it to `#`.
- CSS-responsive navigation and PEXETO's user-agent `.mobile` detection are separate mechanisms. A narrow desktop window gets the responsive header while retaining desktop fullscreen scrolling; iPhone/iPad detection also selects native homepage scrolling.
- Active styling is captured per document: `.current-menu-item`, `.current-menu-parent`, `.current-menu-ancestor`, `.current_page_item` and related WordPress classes; the active anchor has `aria-current="page"`. Category pages set PRODUCTS as current parent/ancestor and the relevant child current. There is no general React pathname-based updater.
- The inspected `/product/alpina` header has `current_page_parent` on PRODUCTS but lacks the category archives' hyphenated `current-menu-parent/current-menu-ancestor` combination. Future retained detail pages need an explicit parent-active rule and testing; do not assume category highlighting carries over automatically.
- Header active classes are distinct from fullscreen `.fullpage-nav li.current` and `.section.active`. Home remains the active *page* while navigating its images/footer.
- Existing mobile toggles are plain `div` elements without role/tabindex; desktop submenu opening is hover-based. No keyboard toggle/focus expansion handler was found in the inspected menu code. These are legacy accessibility considerations to scope explicitly later, not evidence that the current menu is fully keyboard accessible. This audit did not alter them.

## 4. Protect the 06D Home/logo contract

06D's capture listener recognizes exactly:

```css
#header #logo-container > a[href="/"]
#header #menu-item-15418 > a[href="/"]
```

**Keep both Home's ID and the literal `/` href.** Changing it to `/#1`, renaming the ID, moving it outside `#header` or replacing the logo link shape would bypass the existing correction. The event-target `closest()` approach intentionally handles both responsive copies despite their duplicated IDs.

For ordinary activations the helper replaces the fragment with `#1` without emitting an empty-hash event, restores native-tail state, waits for the existing controller/loader state, and uses PEXETO's `moveTo(0)` when necessary. Mobile also resets native scroll position. It closes an open responsive menu using the existing `.mobile-nav` toggle. Modifier/new-tab behaviour stays native. Initialization, explicit section fragments, history handling, the 180ms gesture distinction, original animation lock, footer return and homepage scrollbar styles must remain untouched by a navigation-only task.

A fresh read-only browser check selected image 3 with the original pager, then activated Home. Result: `hash="#1"`, active index 0, first-section top 0 and scrollY 0. 06D's broader Home/logo, fragment, history and footer results remain documented in its report; this audit did not repeat that full regression suite.

## 5. Proposed Redcarpert route mapping

**Recommended minimal 07B policy:** retain existing working URLs for reused pages. Display labels do not require a URL migration. The clean-path column is a clearly separate future proposal; none of those missing routes should be linked as working pages now.

| Approved item | Existing suitable route | Status / later adaptation | Minimal later nav destination | Clean path proposal |
| --- | --- | --- | --- | --- |
| Home | `/` | Exists; preserve approved 06D experience | `/` | `/` (already exists) |
| Wedding Dresses | `/product` | Exists; catalogue layout reusable, content still legacy/mixed | `/product/` | `/wedding-dresses` — **missing**, would require route work |
| ↳ Mermaid | `/product-category/mermaid` | Exists; matching archive structure, 78 captured cards | `/product-category/mermaid/` | `/wedding-dresses/mermaid` — **missing** |
| ↳ Ball Gown | `/product-category/ball_gown` | Exists; matching archive structure, 36 captured cards | `/product-category/ball_gown/` | `/wedding-dresses/ball-gown` — **missing** |
| Digital Lookbook | None | **New route required**; no reader or PDF found | `/digital-lookbook` only after real page exists; otherwise a clearly disabled menu item without href | `/digital-lookbook` — **missing** |
| Our Brides | `/our-brides` | Exists; gallery reusable, original photographs/content not Redcarpert customers | `/our-brides/` | `/our-brides` (already exists) |
| About Us | `/about-us` | Exists; original business copy needs separate adaptation | `/about-us/` | `/about-us` (already exists) |
| Contact Us | `/contact-us` | Exists; original business/location/social content needs separate adaptation | `/contact-us/` | `/contact-us` (already exists) |

Digital Lookbook must **not** point to Atelier, Store, a category, an invented PDF, `#` or a missing active URL. A disabled item preserves the approved label during a staged implementation but is not a completed Lookbook feature. Alternatively, activate that item only in the release that supplies the real page. Do not create a placeholder page merely to obtain HTTP 200.

A future clean-URL migration needs an explicit App Router route or an approved document/alias registry integrated with static parameter generation and metadata. Do not edit `site.ts`, add a catch-all fallback to unrelated pages or assume `href` changes enroll a route. Resolve canonical URL policy once; do not accidentally expose competing catalogue sources.

### Existing routes: working does not mean client-ready

- `/product` contains 100 first-page cards; `/product/page/2` contains 19 more. The latter exists in both registry and current prerender manifest. The 120 `/product/*` registry keys include that pagination route, so they must not all be described as dress-detail pages.
- Bridal Bags has six captured cards: five also occur on catalogue page 1, one on page 2. Removing its submenu entry does **not** remove those products or make the catalogue two-category-only. Filtering/replacing catalogue data belongs to a separately authorized catalogue step; do not claim the legacy fixtures are Redcarpert inventory.
- Inspected catalogue/category/detail `.price` elements contain “Worldwide Shipping,” not a verified numeric price list. Price-based sort options and other WooCommerce scaffolding still exist. Do not introduce pricing or commerce flows in navigation work.
- `/atelier-2` and `/store` are image-gallery pages, not blank placeholders and not Digital Lookbook scaffolds. Remove their menu exposure later without deleting or redirecting their original routes in this task's scope.
- Our Brides is a captured gallery, not an empty page just because it has little ordinary text. About and Contact contain real original-brand copy. These are reusable layouts, not already-adapted Redcarpert pages.
- Navigation-relevant legacy keys include `/product-category/all_dresses`, `/product-category/uncategorized` and their captured pagination, `/product-category/mermaid/after-party`, `/product-category/mermaid/with-an-overskirt`, `/product-tag/*` and `/marka/*`. They are **not** approved navigation categories. The sample Alpina detail links to All Dresses and Uncategorized alongside Mermaid. Do not promote these links; later retained-detail work must prevent such category escapes.

## 6. Link safety and recommended disposition

The inspected top-level/category menu hrefs are local, not absolute links back to Bridal Vanesa's original website. Local destinations can nevertheless contain unrelated original business content.

| Location / link | Current finding | Eventual disposition |
| --- | --- | --- |
| Home and logo `/` | Safe local destination with 06D reset | Preserve exact selectors/href and current behaviour |
| PRODUCTS and the two approved category links | Working local routes, legacy contents | Reuse with new label, then adapt catalogue data under its own scope |
| Bridal Bags, Atelier, Store menu entries | Working but excluded destinations | Remove from the adapted menu; no unrelated replacement/redirect |
| Header Instagram `https://www.instagram.com/bridal_vanesa/` | Active old-business link, `_blank` | Disable pending verified client destination, retaining icon markup/style |
| Header YouTube `https://www.youtube.com/@BridalVanesa` | Active old-business link | Same |
| Header Twitter `https://twitter.com/vanesabridal` | Active old-business link | Same |
| Header Pinterest `https://tr.pinterest.com/vanesabridal/` | Active old-business link | Same |
| Header TikTok `https://www.tiktok.com/@bridalvanesa` | Active old-business link | Same |
| Original informational footers | Same original social destinations remain | Identify for a separately scoped footer-link adaptation; do not modify original pages wholesale |
| Contact body Instagram link with `?utm_source=chatgpt.com` | Additional old-business destination | Disable/replace in the later Contact adaptation; header-only edits will not catch it |
| Copied homepage footer social links | Already non-navigating `aria-disabled` placeholders | Preserve; do not re-enable original destinations |
| `#ht-ctc-chat`, WhatsApp-like links, `[data-whatsapp-preview]` | Existing local enquiry dialog; original chat settings suppressed by renderer | Preserve interception, focus/keyboard behaviour and non-sending preview; do not restore a captured recipient |
| `.pex-woo-cart-btn`, `.pex-woo-cart` | Legacy empty cart chrome under `.header-buttons`; computed `display:none`, no cart/checkout href in these captured nodes | Do not activate or expose. If included explicitly in 07B, remove only these inert subtrees from adapted chrome while preserving surrounding layout; do not rewrite WooCommerce scripts |
| `/cart`, `/checkout` | No captured route; local HTTP 404 | Never add menu links; no checkout/payment implementation |

The header's social markup remains in the DOM on narrow screens, although its `.navigation-container` ancestor is hidden. The mobile menu clone copies only `#menu` content, not the whole social/cart wrapper. Original informational footer social links become visible under their existing responsive rules. Hiding a link is not disabling its destination.

The bundle still initializes dormant WooCommerce cart handlers (`woocart`, `added_to_cart`), and original cart CSS exists. This is not evidence of a working checkout. No cart/checkout/payment navigation destination was found in the inspected header/selected pages, and no commerce/social outbound action was exercised. This is a focused navigation audit, not a security audit of every captured body.

## 7. Design and Wedding Dresses submenu constraints

Reuse `li#menu-item-15821.menu-item-has-children > ul.sub-menu`, retain `menu-item-15421` and `menu-item-15422`, and remove only `menu-item-16276` from that list. No nested After Party/Overskirt or third category. Keep the original desktop drop arrow and separate responsive arrow generation; adding arrows manually would duplicate theme output.

Original rules to preserve include 210px desktop panel width, original submenu padding/shadow/colours/radii, 12px Open Sans/Helvetica/Arial anchor styling, 1px letter spacing, `2px 14px` main-link padding, uppercase transform, hover/current opacity, transition durations, mobile full-width panel, 50×50px arrow area and the existing responsive breakpoints. These are inspected rules/computed values, not permission to copy them into a replacement header.

Current read-only DOM observations:

| Context | Existing rendered state |
| --- | --- |
| Desktop 1440×900 | One-line menu, width 654.3125px; logo 350×150px; dropdown 210px |
| Desktop UA 1024×900 | Desktop menu remains active and wraps below the logo; header height 237.390625px in this sampled state |
| Desktop UA 1000×900 | Navigation ancestor hidden, Menu control visible; logo about 108.625×40px |
| Desktop UA 768×900 | Responsive menu and submenu open with real clicks |
| iPhone emulation 390×844 | `.mobile` native mode; Menu and submenu open with real touch taps; parent href remains `/product/` |

A read-only canvas glyph estimate for the longer labels, while removing STORE and reusing ATELIER's slot for Lookbook, suggests roughly **61px more** menu width (about 716px versus 654px) in this browser/font environment. This is an estimate, not a future layout measurement or visual approval; no proposed text was applied to the page. The existing 1024px wrapping makes fit testing important.

A later implementation must not reduce fonts/padding, shrink the logo, change alignment, invent a breakpoint or replace the menu to force a fit. If the approved text does not fit within the approved styling, report the conflict for review. Preserve the original sticky-header states too; 06D deliberately retained their geometry changes.

## 8. Recommended minimal implementation scope for 07B

1. **Choose the route policy above.** Recommend existing catalogue/category URLs for the first header pass. Keep the real Lookbook dependency explicit; an active missing route or an unrelated gallery substitution is not acceptable.
2. **Add a dedicated, guarded, immutable navigation adapter/config**, integrated before `SemanticTree`/theme initialization. Guard the original header, menu IDs, seven source top-level nodes and three original children. Copy only the affected ancestors. Preserve document style/script data, header wrappers, logo, fullscreen section paths and unrelated content. Do not expand the generic text adapter into an unrestricted structural editor.
3. **Produce the six approved top-level items in order and exactly two Wedding Dresses children.** Reuse the existing PRODUCTS parent. ATELIER's ordinary menu-node slot can be repurposed for Digital Lookbook while retaining its theme classes; remove STORE's menu node. A new stable Lookbook ID is also possible, but Home's ID/href and the original menu root IDs are non-negotiable. Do not run `menuNav.init()` a second time or patch only the desktop copy after initialization.
4. **Recompute active/current flags and `aria-current` from explicit route mapping.** Preserve category parent/child semantics. For retained detail pages, highlight Wedding Dresses; do not invent a Mermaid/Ball Gown classification without approved data. Do not confuse these classes with fullscreen pager state.
5. **Scope route coverage explicitly.** Minimum reusable pages are `/`, `/product`, the two approved category archives, `/our-brides`, `/about-us`, `/contact-us`, plus `/product/page/2` while its pagination remains exposed. Include only explicitly retained dress-detail routes when their catalogue scope is approved. Return unrelated documents unchanged. Otherwise navigation can revert to old links when a user reaches an unadapted detail page; do not silently solve this by rewriting all 143 pages.
6. **Handle approved shared-chrome link safety separately from content conversion.** Neutralize old header social destinations without replacing icon graphics or inventing client URLs. Keep the WhatsApp preview. Include inert cart removal only as an explicit narrow chrome change, preserving wrappers. Original footer/Contact-body links, catalogue bags/sort controls, product content and Lookbook authoring need their own defined scope; menu edits alone do not complete them.
7. **Validate the future change:** pure-adapter expected-value/immutability tests; six ordered items and two children in both runtime copies; no invented/dead active destinations; route-aware highlighting; desktop hover and mobile parent-versus-arrow behaviour; layout metrics around 1001/1000px and at 1440/1024/768/390; desktop UA versus touch/mobile mode; original fonts/logo/padding/colours; and the full 06D Home/logo/fragment/history/footer/scrollbar regression matrix. Check WhatsApp activation/focus and homepage scroll-to-top absence. Run the existing suites, lint, typecheck and build **during implementation**, not as a substitute for design review.

This plan does not authorize building a Lookbook, changing catalogue data, converting all page content, replacing the logo or redesigning accessibility controls now. Existing non-focusable menu toggle semantics should be raised for a focused enhancement that preserves appearance, rather than quietly introducing a new navigation system.

## 9. Checks performed and limitations

- Read-only code inspection and selected JSON traversal; route-key existence and current prerender entry checked for pagination.
- Existing production server started with `npm run start -- --port 3002`; no build, dev server, dependency installation, lint/typecheck/test rerun or source generation.
- Chromium DOM/real hover/click/touch checks as above. Browser external requests blocked. No original-business links, forms, carts or payments activated.
- HTTP 200 verified for `/`, `/product/`, both approved category URLs, Bridal Bags, Our Brides, About, Contact, Atelier, Store and representative `/product/alpina`. Trailing slash requests follow to the corresponding slashless local routes. Explicit 308 canonicalization was checked for both category paths and `/product/page/2/`.
- `/digital-lookbook`, `/wedding-dresses`, `/cart` and `/checkout` returned 404. The proposed clean category paths and `/lookbook`/`/my-account` are absent from the registry; no claim of a live destination is made for them.
- Chromium initially failed under the process sandbox; approved execution outside it succeeded. Existing Next standalone-start advisory appeared; the existing build served the inspected captured destinations. Four `Internal: NoFallbackError` messages were also logged during the missing-route probes alongside their HTTP 404 results; no fallback, route or redirect was added, and that framework logging was not changed during this assessment.
- No screenshots, pixel comparisons, browser evidence folders or unrelated artifacts. Browser code ran inline; only this report was created in the repository. No visual approval, physical-device coverage, external-link availability or exhaustive all-route safety is claimed.

## 10. Git status and preservation

Initial working tree: `M next-env.d.ts` only, an existing generated-file difference. It was read and left untouched. Verified final status:

```text
 M next-env.d.ts
?? codex-reports/07a-navigation-audit-route-map.md
```

Final verification matched all nine pre-audit hashes: the existing generated file, captured data, renderer, runtime, 06D helper, enquiry preview, footer helper and principal menu JS/CSS. Git showed no additional tracked modifications. The captured data SHA-256 is `20b2cc31c3f50dc25290f14f1403bc4b98b9aeafd5a490ffd784976664500616`.

Only this report is a task change. No website files changed; no staging, commit or push. Stop after delivery for review.
