# Implementation 07C — Footer Social Link Safety

## Result and files

On `main`, disabled all five original social destinations in the compatible captured footers without changing their design. No verified Redcarpert accounts were supplied or invented.

- Created `src/lib/footer-social-adapter.ts` (68 lines): guarded, immutable adaptation of the five canonical footer anchors.
- Changed `src/components/SiteDocument.tsx`: import and call the adapter on the captured document before the existing transformations and homepage footer insertion (2 additions, 1 deletion).
- Created `tests/footer-social-adapter.test.mjs` (69 lines): five focused tests covering all captures, mappings, immutability, homepage ownership, unrelated links and invalid structures.
- Created this report, `codex-reports/07c-footer-social-link-safety.md`.

The existing homepage footer helper, navigation adapter and 07D report were read before implementation. No original brand assets, captures, theme CSS/JavaScript, dependencies, footer components, navigation alignment, logo implementation or scrolling code were modified.

## Captured structures and coverage

All **142 non-homepage captures have an identical canonical footer**:

```text
#main-container
  footer#footer.center
    .scroll-to-top
    .cols-wrapper.footer-widgets.section-boxed.cols-4
    .footer-bottom
      .section-boxed
        .social-profiles
          ul.social-icons
            li > a > div > img  (five, in original order)
```

Coverage includes About Us, Contact Us, Our Brides, Atelier, Store, catalogue/pagination, product categories/tags, brand archives and product-detail routes. The guard checks the unique footer, exact wrapper path, unique social list, five ordered items, anchor destinations/targets/title shape, image sources/alt attributes and child structure. Unexpected structures, reordered/missing icons, unknown URLs/attributes, duplicate footers/lists and original social anchors outside the verified list throw with route context. Reapplying the adapter also rejects the already-adapted structure.

The captured homepage has no footer. Its document passes through unchanged. The new adapter runs **before** `addHomepageFooter`, which continues to create and neutralise its own copied footer exactly as before. A homepage passed after footer insertion is rejected, preventing double-processing. Tests compare the existing helper's full output for equality.

## Links and accessibility

| Platform | Original destination removed from canonical footer anchors |
| --- | --- |
| Instagram | `https://www.instagram.com/bridal_vanesa/` |
| YouTube | `https://www.youtube.com/@BridalVanesa` |
| Twitter | `https://twitter.com/vanesabridal` |
| Pinterest | `https://tr.pinterest.com/vanesabridal/` |
| TikTok | `https://www.tiktok.com/@bridalvanesa` |

Only the five verified anchors change: remove `href`, `target` and the original TikTok `title="z"`; add `role="link"`, `aria-disabled="true"` and a platform-specific label such as `Instagram: destination not yet available`. No click handler, replacement URL or keyboard destination is introduced. The homepage retains its existing `destination to be confirmed` labels and implementation.

Removing `href` changes Chromium's default cursor from `pointer` to `auto`. An anchor-local `style="cursor: pointer"` preserves the original computed cursor, including inherited descendant cursors. This is the only style attribute added; no stylesheet changes were made.

Every icon subtree, image source, wrapper, class, text node, footer control and unrelated anchor is retained. Only changed anchors and their ancestors are copied. Tests deeply freeze every source document, verify shared identity for all unchanged subtrees and metadata, and compare the complete source collection before/after.

## Browser verification

Used the final webpack production build and Chromium at **1440×900, 768×1024 and 390×844**. These are responsive desktop-Chromium viewports, not native-device/Safari certification. No screenshots, visual comparison files, pixel diffs or evidence folders were generated. The temporary numeric/assertion runner is `/tmp/07c-browser.cjs`; results were printed to execution output.

At each size, checked `/`, `/about-us`, `/contact-us`, `/our-brides`, `/product`, `/product-category/mermaid` and `/product/alpina`:

- All five footer anchors remain in the original Instagram/YouTube/Twitter/Pinterest/TikTok order, with disabled labels and no `href`, `target` or old title. No original social destination remains active in these rendered footers.
- Compared every footer element's rectangle relative to the footer and **every enumerated computed CSS property** against the same live DOM with its original anchor attributes restored. All 18 non-homepage route/viewport comparisons match exactly, including the cursor compensation. Homepage output is independently proven unchanged by identity/helper tests.
- Backgrounds remain `rgb(37, 37, 37)` (`#252525`) and `rgb(31, 31, 31)` (`#1f1f1f`). Footer dimensions, typography, spacing and responsive layout remain unchanged.
- Real pointer clicks on all five disabled anchors cause no URL change or popup. For the desktop theme-hidden row, the test temporarily exposed the row only in the browser and restored it afterward; production visibility was not changed.
- WhatsApp opens the existing enquiry dialog and closes normally on all seven routes at each size.
- The header still uses `/redcarpert/brand/redcarpert-logo.png`. Automated whole-tree comparisons prove header nodes are untouched. Existing navigation/logo tests pass.

Homepage interaction checks passed at all three sizes: select Image 3, use fresh wheel input to reach the footer, confirm the footer's top meets Image 3's bottom within 2px, confirm there is no copied scroll-to-top control, and return to Image 1 at scrollY approximately zero using both the logo and Home links. Desktop hover/category activation and tablet/mobile menu-arrow expansion/category activation also passed. Completed homepage/header runs reported zero page JavaScript errors.

Initial combined desktop/tablet homepage reset assertions were disrupted by the test's temporary social-row exposure and fixed-delay checks. Fresh homepage runs, without that temporary row mutation during the reset sequence, passed both links with state-based waits. No production scrolling or navigation behavior was changed to accommodate the runner.

## Existing issues and unmet verification criteria

**Universal icon visibility cannot be claimed while preserving the exact clone.** The original theme hides `.footer-bottom .social-profiles` on desktop and displays it at the responsive breakpoint. That behavior remains identical. All five icon elements and their ordered slots are preserved. The four local images load; the existing external Instagram image at `https://nirvanatakipcim.com/gelinlik/wp-content/themes/thestory/images/icons_white/instagram.png` fails to load in this browser environment. Its source was preserved as required. No replacement image or CSS visibility override was introduced.

**Scroll-to-top functionality did not pass.** All six non-homepage controls remain the same nodes with the original theme click handlers attached. In this environment, activation did not move scrollY. Restoring the original social attributes in the same live page produced the identical result at every tested size and route; for example, About Us stayed at 178px on desktop, 207px at tablet size and 770px at mobile size, in both states. Initial real-click/zero-scroll assertions therefore failed. Subsequent checks establish unchanged behavior, not working scroll-to-top functionality. Fixing the original theme control is outside this anchor-only change and was not attempted.

These are review findings, not claimed passes for requirements 2 and 5. The task introduces no change to either behavior.

## Automated checks

- `node --experimental-strip-types --test tests/*.test.mjs`: all seven test files pass, including the new five focused footer-social cases and existing content, homepage backgrounds/footer/header, navigation and logo coverage.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build -- --webpack`: final build passed; all 146 entries generated. A preceding rebuild failed with `Could not parse output from TypeScript's --showConfig`; its escalated rerun completed successfully. Webpack follows the environment limitation already documented in 07D.
- `git diff --check`: passed.
- Build-generated `next-env.d.ts` changes were restored to their initial contents.

## Unsafe links outside scope

The Contact Us **page body** retains the active original account link `https://www.instagram.com/bridal_vanesa/?utm_source=chatgpt.com`. It is outside the footer and was deliberately left unchanged. An audit after the existing content/navigation adapters found this as the remaining external HTTP(S)/mailto/tel anchor destination. The raw captures also retain original header/social destinations by design; the approved navigation adapter removes header socials before rendering. The external Instagram image request is an asset dependency, not an account-navigation link.

## Git state and review

Initial worktree was clean on `main`. Final task status:

```text
 M src/components/SiteDocument.tsx
?? codex-reports/07c-footer-social-link-safety.md
?? src/lib/footer-social-adapter.ts
?? tests/footer-social-adapter.test.mjs
```

Tracked diff: one file, 2 additions/1 deletion. New files are the 68-line adapter, 69-line test and this report. Protected source, theme files, assets, homepage helper/scrolling, header alignment, navigation adapter, logo adapter and enquiry component have no diff. No dependency changes, staging, commit or push. Stopped for review with the existing visibility/image-loading and scroll-to-top limitations above.
