# Implementation 29 — A natural editorial Digital Lookbook

## Approved goal

Refine the **interactive online** bridal book and bring its separate **32-page downloadable PDF** into the same editorial visual language. Preserve the 22-page PageFlip reader, all twenty sample dresses, five categories, pricing from `src/data/products.json`, detail links, keyboard / swipe controls, the mobile fallback and existing website layout.

## Front cover

The cover has **only the official Redcarpert logo, a quiet dividing rule, a bridal slogan and a short description**:

> Your bridal story begins here.

> A considered edit of bridal inspiration for the moment that feels like yours.

There is no stock photo, "Digital Lookbook" title, or oversized promotional text on the front cover. The page retains a calm, warm-ivory finish.

## Interior pages

1. **Symmetric photo gutters:** Each book leaf owns its own horizontal margin: `clamp(18px, 6.4%, 30px)` on desktop, `clamp(17px, 6.2%, 24px)` at narrower widths. Both sides scale equally with the actual leaf, not with the window.
2. **Preserve the complete source photograph:** The photo frame has `object-fit: contain`, with a subtle warm-ivory background. No `object-fit: cover` cropping of the gown, face or train.
3. **Vertically balanced and centred caption:** Within the remaining height the information uses `justify-content:center`, `align-items:center`, `text-align:center`.
4. **One category label only:** A small uppercase collection label precedes the elegant serif `Look 01` heading. There is no duplicated category or decorative body description.
5. **One consistent price and CTA:** The displayed ZAR price continues to come directly from the shared products JSON, followed by a centred `View dress details` link and discreet illustrative-content notice.
6. **Folio:** Page numbers stay readable at the bottom of each dress page and remain synchronized with the 22-page book.
7. **Mobile:** Preserve a one-page portrait book, smaller readable typography and proportionally equivalent image margins.

## PDF design parity — approved after online review

The separate digital-download publication remains **32 pages**: four front-matter pages, five collection openers, twenty individual looks, a fitting-contact page, photographer credits and a back cover. The website's interactive reader remains **22 pages**.

The PDF's cover now matches the online cover: **official logo, minimal gold rule, the exact same slogan and short description**, with no cover photograph or duplicate title. The original logo colours remain intact.

Every PDF dress page now follows the same layout logic as the online dress leaf: **ivory paper, symmetrical 20 mm horizontal gutters, portrait image contained with no tinted box or border, a small category label, a centred Georgia-serif Look number, a centred JSON-backed ZAR price, a centred View dress details link and a discreet sample disclaimer**. Details are vertically centred in the available space below the photograph. Dress detail URLs link to the corresponding GitHub Pages preview. The PDF back cover also uses the online book's "Find your silhouette" wording, with browse/fitting links.

Print footers remain numbered out of 32, and the original PDF contents, collection introductions, credits, and contact page remain intact. Existing high-resolution image caching and photo-DPI audit are unchanged. The 32-page output is still a digital PDF rather than a certified CMYK/PDF-X print file.

QA: `tests/editorial-pages.test.mjs` verifies PDF structure, cover text, no cover JPEG, symmetric margins, centred captions, twenty catalogued prices, clickable detail links and footer content. `tests/lookbook-paper.test.mjs` guards against the return of darker photograph panels.

### Unchanged

The PageFlip animation, fallback mode, PDF download URL, navigation buttons, current page status, pricing validation and dress preview routes are unchanged. The online back cover stays as approved; the PDF back cover now matches it.

## Checks

`npm test` confirms the static markup: minimal cover with one logo image, twenty portraits, twenty `Look NN` names and all prices. Browser fallback tests also verify symmetric photo margins, `object-fit:contain`, centred and vertically balanced captions at desktop, tablet and phone widths.

The older editorial browser test's 10-page expectation is corrected to use the current catalogue size.

### Codespaces review

```bash
git fetch origin
git switch implementation/29-digital-lookbook-editorial-pages
npm test
npm run check
npm run dev
```

Open `/redcarpert-prototype/digital-lookbook/` and review the cover, an early Mermaid page, the Ruffled and 2 in 1 pages, and the last page on desktop/tablet/mobile. Verify the gown is never unintentionally cropped and no horizontal scrolling appears.

**Status:** implementation changes are committed to a review branch only. Do not merge or deploy without owner approval.
