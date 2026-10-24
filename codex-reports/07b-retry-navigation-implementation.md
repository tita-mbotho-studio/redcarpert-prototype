# Implementation 07B retry — Header navigation

## Outcome and feasibility gate

Implemented the six approved navigation items using the existing captured header and PEXETO dropdown/mobile architecture. Removed only the header `ul.social-icons` subtree; its existing wrappers and hidden cart remain. No icons were relocated or duplicated, and footer markup/styling remains unchanged.

Read the 07A audit, previous stopped 07B report and 06D report first. Before writing the adapter, tested temporary DOM changes against the original production build: removed the header icon list, applied the approved menu labels/order and removed the excluded menu entries. No CSS or theme initialization was changed. Chromium measurements passed the required feasibility gate at all six widths. Only then was the adapter implemented.

The previous conflict is resolved: at 1440px the original 193px header height is retained, and the menu stays beside the unchanged logo. The previous trial with icons retained had increased the height to 237.390625px and moved the menu to y=173; that behaviour is absent in this implementation.

### Measured layout before and after

Same Chromium settings and 900px-high desktop-UA viewports; values in pixels. The completed production build was measured again and matched the temporary feasibility result.

| Width | Header height before → after | Menu x before → after | Menu y before → after | Logo x, y, width, height (unchanged) |
| --- | --- | --- | --- | --- |
| 1440 | 193 → 193 | 514.6875 → 588.890625 | 20 → 20 | 120, 23, 350, 150 |
| 1024 | 237.390625 → 237.390625 | 167.46875 → 241.671875 | 173 → 173 | 51.1875, 23, 350, 150 |
| 1001 | 237.390625 → 237.390625 | 145.625 → 219.828125 | 173 → 173 | 50.046875, 23, 350, 150 |
| 1000 | 95 → 95 | Desktop menu hidden | — | 50, 24, 108.625, 40 |
| 768 | 95 → 95 | Desktop menu hidden | — | 38.390625, 24, 108.625, 40 |
| 390 | 95 → 95 | Desktop menu hidden | — | 19.5, 24, 108.625, 40 |

Desktop menu width increases from 654.3125 to 715.109375 for the longer approved labels; its height remains 44.390625. At 1440px the menu occupies x=588.890625…1304, leaving 118.890625px between its left edge and the logo's right edge. Its horizontal position naturally follows the removal of the original icons; no positioning override was added. At 1024px and 1001px the original clone already places navigation below the logo; this existing layout and header height remain unchanged.

Every desktop item remains one text line, 24.390625px high, with original computed 12px font size, 1px letter spacing and `2px 14px` padding. All tested document client widths and scroll widths equal the viewport width. No overlap, clipping, horizontal overflow or new wrapping was measured. The original 1000px responsive breakpoint, stylesheet rules and menu animations are unchanged. These measurements do not claim human visual approval.

## Exact code changes

- `src/lib/navigation-adapter.ts` — new guarded, immutable `adaptNavigation(document)`. Validates one canonical header, required section/menu/mobile wrappers, original Home/logo root links, exact original IDs/text/hrefs/order, the original two-level submenu and five original social destinations. Unexpected structures throw a route-specific error before rendering rather than leaving legacy navigation silently active. Reuses menu nodes, filters/reorders lists, recomputes current classes/`aria-current`, and removes only the verified header icon list. Clones changed nodes and ancestors; untouched body, footer, logo, cart, stylesheet/script metadata and other branches retain identity.
- `src/components/SiteDocument.tsx` — imports and applies the adapter after the existing content/background/footer helpers and before `SemanticTree`/`SiteRuntime`. PEXETO receives the adapted source menu before its original initialization and mobile cloning.
- `tests/navigation-adapter.test.mjs` — four focused automated tests covering all-route mapping/link safety, frozen-source immutability/structural sharing, active states and rejection of thirteen invalid structure mutations without partial edits.
- `codex-reports/07b-retry-navigation-implementation.md` — this report only.

No edits to `src/data/site.ts`, original assets/CSS/JS, `HomepageFooterScroll.tsx`, `SiteRuntime.tsx`, footer helpers, catalogue/body content, routes, dependencies or responsive layout rules. The previous stopped-attempt report is preserved unchanged (SHA-256 `02735b6ed463622fab67b9d71fc3ce57d955b9d0d6ce6b78b53f24ab59328167`).

## Navigation mapping and route coverage

| Order | Existing node | New label | Destination / state |
| --- | --- | --- | --- |
| 1 | `menu-item-15418` | Home | `/`; original ID and href preserved |
| 2 | `menu-item-15821` | Wedding Dresses | `/product/`; original dropdown parent |
| 2.1 | `menu-item-15421` | Mermaid | `/product-category/mermaid/` |
| 2.2 | `menu-item-15422` | Ball Gown | `/product-category/ball_gown/` |
| 3 | `menu-item-16165` (Atelier donor) | Digital Lookbook | No href; `role="link"`, `aria-disabled="true"`, keyboard-focusable `tabindex="0"` |
| 4 | `menu-item-16080` | Our Brides | `/our-brides/` |
| 5 | `menu-item-15416` | About Us | `/about-us/` |
| 6 | `menu-item-15417` | Contact Us | `/contact-us/` |

Removed Bridal Bags (`menu-item-16276`) and Store (`menu-item-16171`) from the menu. Atelier is no longer a navigation destination. Their captured pages remain available at existing routes; no new routes or redirects were created.

All **143** captured documents have the verified canonical header and receive the adaptation, including dress details. No unmatched variants were found. Exactly six top-level items and exactly two submenu children are enforced by the tests.

Home/info routes select their actual page; catalogue and `/product/page/2` select Wedding Dresses; the two approved category archives select the matching child and Wedding Dresses parent. Dress details and other captured catalogue/category/tag/brand descendants indicate Wedding Dresses as an ancestor without assigning a guessed category. Removed Atelier/Store routes have no selected approved item. Captured stale current flags and `aria-current` are cleared before computing actual state. Active classes retain the original theme styling.

Digital Lookbook has no `#`, missing route, substitute page or invented PDF. No additional event handler is necessary: the retained anchor has no navigation destination. Its accessible disabled state is preserved in the theme-generated responsive copy.

## Real browser verification

Used the local production build in Chromium with real mouse hover/click/wheel, keyboard and CDP touch input. External requests were blocked. Removed Playwright's default `--hide-scrollbars` flag so the existing homepage scrollbar rules were tested directly. No screenshots, pixel differences or browser evidence folders were produced; runners and measurement data remained in `/tmp`.

Navigation matrix: **passed at all six sizes** — 1440×900, 1024×900, 1001×900, responsive desktop 1000×900, iPad 768×1024 and iPhone 390×844. Every case reported zero page JavaScript errors.

All six cases activated Mermaid, Ball Gown, Wedding Dresses, Our Brides, About Us and Contact Us through their real menu links, verified the resulting route/current states, visited the Alpina detail to verify parent-only highlighting, and returned through Home. Pointer clicks and focused Enter on Digital Lookbook left the URL unchanged. At 1000px and on both native-device emulations, the original menu and arrow expanded the responsive submenu. Menu rows remained full width and 51.390625px high without clipping. Native iPad/iPhone header height was 85px under the original mobile styles; the feasibility table above deliberately uses desktop-UA viewports, where it is 95px.

Checks include exact labels/hrefs/order, two category children, absent header socials, five retained footer social images, hidden cart, desktop hover/open/close and 210px submenu width, one original desktop arrow and one original mobile expansion control, real mobile menu/submenu expansion, working parent/category/informational links, disabled Lookbook pointer click and focused Enter without navigation, route current states and dress-detail parent state. No manual arrows or duplicate initialization were added.

## Homepage regression verification

The original Home/logo selectors remain exactly `#header #logo-container > a[href="/"]` and `#header #menu-item-15418 > a[href="/"]`. The 06D helper is byte-for-byte unchanged (SHA-256 `1870be1e7378c71c0b2d1867ba8af5f3d6d2536fc012660089f2fb9ab3b2dc84`).

Reran the existing full 06D browser runner against the completed build: **all four suites passed**, with zero page JavaScript errors. It checks momentum stopping at image 3, fresh-gesture footer entry, gradual bounded native scrolling, reverse return to 3 before a fresh upward transition to 2/1, held/fresh keyboard inputs, native tablet/mobile swipes, Home/logo from images 2/3/footer, original pager, direct fragments/refresh/history, cross-page Home/logo, hidden homepage scrollbar, no scroll-to-top control and WhatsApp preview open/Escape-close.

| Homepage regression viewport | Section dimensions | Natural footer height | Recorded geometry/state checkpoints | Result |
| --- | --- | --- | --- | --- |
| Desktop 1440×900 | 1440×900 | 260.140625 | 84 | Passed |
| Tablet, desktop input 1024×768 | 1024×768 | 245.390625 | 84 | Passed |
| Native iPad 768×1024 | 768×1094 | 413.5625 | 321 | Passed |
| Native iPhone 390×844 | 390×914 | 515.609375 | 321 | Passed |

Desktop and tablet-desktop tests retained image 3 at top zero throughout 22 momentum-like wheel events, then entered the footer gradually with fresh input. Large reverse wheel input stopped at image 3 before new gestures selected 2 and 1. Native touch tests reached the footer and returned through the original scrolling flow. Home/logo resets, refresh/direct fragments, history and WhatsApp passed on all four. Informational footers retained their scroll-to-top controls, colours, natural sizing and native scrollbars; the homepage retained no scroll-to-top and no visible native scrollbar or width loss.

At all six desktop-UA geometry widths, the original and completed build match exactly for header/ logo rectangles, section height/background URL/cover/centre, footer dimensions and document widths. All three sections remain 900px tall in that matrix. Footer heights remain 260.140625 (1440), 245.390625 (1024), 243.859375 (1001), 451.421875 (1000), 413.5625 (768), and 515.609375 (390). Native-device viewport measurements are covered separately by the 06D runner; its original mobile viewport-plus-70px behaviour is retained.

## Outstanding original-business footer links

Existing informational-page footers, including About Us, Contact Us and Our Brides, still contain these original destinations and need separately approved adaptation:

- Instagram: `https://www.instagram.com/bridal_vanesa/`
- YouTube: `https://www.youtube.com/@BridalVanesa`
- Twitter: `https://twitter.com/vanesabridal`
- Pinterest: `https://tr.pinterest.com/vanesabridal/`
- TikTok: `https://www.tiktok.com/@bridalvanesa`

Their icons, hrefs, markup and styles were neither changed nor duplicated. The copied homepage footer retains its already-disabled social destinations. No original-business header social destination remains, and no Redcarpert social URL was invented. Original contact/body links, catalogue fixtures, bag products and legacy archives remain outside this navigation-only scope. Digital Lookbook remains intentionally unavailable.

## Standard checks

- Content-adapter: 9 tests passed.
- Homepage-backgrounds: 4 tests passed.
- Homepage-footer: 4 tests passed.
- Navigation-adapter: 4 tests passed, including all 143 documents and thirteen rejection cases.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; 146 generated entries.
- `git diff --check`: passed; new files also checked for trailing whitespace and final newlines.

Chromium's initial sandboxed launch hit the existing crashpad socket restriction; the approved unrestricted launch was used. Build used the previously established permission for the CSS worker's local port. Existing Node module-type warnings and the Next standalone-start advisory remain; no dependencies/configuration were changed.

## Git state, final results and limitations

The initial `M next-env.d.ts` generated-file difference was restored to its exact initial contents after the build (`cmp` passed). The earlier untracked stopped-attempt report is preserved unchanged. Final Git status:

```text
 M next-env.d.ts
 M src/components/SiteDocument.tsx
?? codex-reports/07b-navigation-implementation.md
?? codex-reports/07b-retry-navigation-implementation.md
?? src/lib/navigation-adapter.ts
?? tests/navigation-adapter.test.mjs
```

Task code diff: `SiteDocument.tsx` has two additions and one deletion; the new adapter has 118 lines and its tests have 93 lines. The new retry report is the only report created in this task. Tracked `git diff --stat` additionally shows the pre-existing two-line generated-file difference. No changes to protected source/assets were found by `git diff --exit-code -- src/data/site.ts public src/components/HomepageFooterScroll.tsx src/components/SiteRuntime.tsx src/lib/homepage-footer.ts`. No staging, commit or push.

Browser testing is Chromium emulation, not physical-device, Safari/Firefox, assistive-technology or human visual approval. Original menu keyboard-expansion limitations remain unchanged; this task preserves PEXETO rather than replacing its navigation system. No known layout conflict remains at the required widths.
