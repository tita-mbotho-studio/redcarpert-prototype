# 08A — Wedding Dresses Catalogue Foundation

## Entry condition and scope

Before starting, confirmed `main` was clean and 07F was committed as `956b9eb` — **Complete Redcarpert footer branding and responsive layout**. No catalogue edits were made before that confirmation.

This phase adapts only `/product`, `/product-category/mermaid` and `/product-category/ball_gown`. Existing homepage, header/footer/navigation, logo, scrolling, enquiry and product-detail implementations are unchanged. Original captures and theme sources are untouched. Other legacy routes are outside 08A; no detail pages or WhatsApp recipient configuration are implemented.

## Captured presentation inspected

The original three listings contain 100, 78 and 36 cards respectively. `/product` represents the first 100 of 119 legacy entries and links to page 2; the two categories have no pagination. Each card is:

`ul.products.columns-4 > li.product > a.woocommerce-LoopProduct-link.woocommerce-loop-product__link > img + h2.woocommerce-loop-product__title + span.price`

An additional hidden screen-reader span references a WooCommerce add-to-cart description. Thumbnail attributes are consistently **370×444**. The `price` slot actually says **Worldwide Shipping**, not a numeric price. Original product names and images are Bridal Vanesa content and are not mapped to Redcarpert inventory.

The content parent is `.content-box.pexeto-woo-columns-4`. Theme `6814810d368ff64b55.css` defines four desktop cards with width 20.1%, 1% padding and original margins/first-last clearing. At max-width 768px, cards become 45.7% wide with 1% padding, giving two columns. Existing WooCommerce/layout styles control float/clear, margins, typography, borders, card/image transitions and hover behavior. No grid widths, gaps, breakpoint rules or hover rules are replaced.

There are no body category-filter widgets in these captures. Category navigation is provided by the existing approved header dropdown and footer category links. The ordering form offers default, popularity, rating, newest and two price sort modes. No body price-slider, size filter or visible add-to-cart button is present in the inspected cards.

## Data and safe placeholders

`src/data/catalogue.ts` defines readonly category/product types and exactly two approved category descriptors. Product fields include ID, name, category, image, image alt text and nullable future detail reference, plus explicit sample status and image provenance.

There are exactly **two sample records**, not an invented inventory: `sample-mermaid` / **Sample 01**, and `sample-ball-gown` / **Sample 02**. The all-dresses page displays both, while each category displays its one sample. The result-count area reads **Sample photographs — not client inventory**, each card repeats **Sample imagery**, and image alt text explicitly says these are not Redcarpert inventory. No commercial product names, prices, sizes, quantities, descriptions or availability claims are invented.

Reused existing local stock composites, without editing homepage assets or generating new imagery:

| Sample | Local file | Original photograph and credit |
| --- | --- | --- |
| Mermaid | `/redcarpert/home/hero-pexels-sample.webp` | Trần Long, [Pexels 5984238](https://www.pexels.com/photo/elegant-asian-bride-on-path-in-countryside-5984238/) |
| Ball Gown | `/redcarpert/home/collection-pexels-sample.webp` | Thalia villa, [Pexels 4277970](https://www.pexels.com/photo/woman-in-white-wedding-dress-4277970/) |

Source/photographer/download/license verification and composite recipes are already documented in `codex-reports/05-homepage-imagery.md`; that report is referenced from each record. Inspected the actual local composites before use. These are stock-image category illustrations, not client dresses or endorsements. CSS image-only `aspect-ratio: 370 / 444; object-fit: cover` presents the existing wide composites in the original thumbnail footprint without changing image files, card geometry or homepage rendering.

**Missing client inputs:** actual dress photographs, approved product IDs/names, verified category mappings and detail references. Both `detailReference` fields remain `null`. No legacy product name/ID is treated as a client mapping, and no detail URL is guessed.

## Implementation

- `src/data/catalogue.ts`: typed categories, clearly marked sample records and provenance.
- `src/lib/catalogue-adapter.ts`: route-limited guarded immutable transformation; receives typed records explicitly.
- `src/components/CatalogueListing.css`: only a scoped non-commerce caption rule reproducing the original shipping/price slot's display, border, margin, padding and font size. No grid or breakpoint changes.
- `src/components/SiteDocument.tsx`: calls the adapter within the existing pipeline and imports caption styling. Protected adapters/components are unchanged.
- `tests/catalogue-adapter.test.mjs`: source/readiness, exact approved scope, category filtering, disabled detail destinations, commerce removal, frozen input/protected-subtree identity and guard-failure coverage.
- This report.

Guards require the exact listing grid/card counts, original card wrappers/images/titles/shipping slots, heading structure, ordering options and pagination count. Unexpected structures fail with route context. Only listing targets and ancestors are copied; metadata and protected header/footer/chat subtrees remain shared. The other 140 captures return unchanged by identity.

The first captured cards serve only as presentation templates. Legacy `post-*`, inventory/category/stock/shipping-tax classes and hidden cart-description spans are removed. New card identifiers refer to samples. Image/title anchors retain their classes, hover styling and pointer appearance, but have no `href`; accessible disabled labels explain that details await client information. No link can enter an unimplemented 08B destination or a legacy Bridal Vanesa detail page.

Sales/price sorting is disabled without collapsing the toolbar height: its form is replaced by a noninteractive, visually hidden layout holder at the measured original 237px width with a disabled select containing only a neutral option. It has no `orderby` name/class or submission mechanism, so existing runtime sorting cannot apply commerce modes. Legacy pagination is removed instead of linking back to uncatalogued legacy inventory. The old shipping slot is replaced with a neutral sample caption, retaining its measured footprint through scoped styling. No prices, sizes, cart, checkout or payment controls are introduced in the approved listings.

## Validation

- `node --experimental-strip-types --test tests/*.test.mjs`: all **ten test files passed**, including the new catalogue cases and existing protected-feature tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed sequentially after the production build.
- `npm run build -- --webpack`: final build passed with **146 entries generated**. The initial sandboxed attempt hit the previously documented TypeScript `--showConfig` parse error; its approved escalated retry passed. The mobile-toolbar footprint correction was subsequently rebuilt successfully.
- `git diff --check`: passed. Generated `next-env.d.ts` changes restored to the committed entry state.

Used real Chromium at **1440×900, 768×1024 and 390×844**, with touch enabled for the latter two contexts, against all three approved listings (nine combinations). No screenshots, traces, visual-diff files or evidence folders were produced. Temporary source fixtures, assertion runners and numeric/text output are under `/tmp/08a-*`.

For a like-for-like geometry comparison, temporarily substituted the captured listing content parent in the same live DOM, retaining only its first one/two cards to match the sample count. Original images were decoded before measuring. Restored the live adapted subtree afterward. This compares the original first-row card presentation, not the old full inventory/page height.

All nine combinations matched exactly within 0.1px tolerance: card/image/title/caption rectangles, grid origin, typography, colour, padding, margins, borders, transition and background styling. Actual differences were zero in the recorded properties. Representative first-card dimensions (CSS px), identical before/after:

| Viewport | Grid width | Card width × height | Thumbnail width × height | Maximum theme columns |
| --- | --- | --- | --- | --- |
| 1440×900 | 1200 | 265.1875 × 417.921875 | 241.1875 × 289.421875 | 4 |
| 768×1024 | 721.9375 | 344.359375 × 519.625 | 329.921875 × 395.90625 | 2 |
| 390×844 | 366.625 | 174.859375 × 321.203125 | 167.546875 × 201.046875 | 2 |

Grid y offsets relative to `.content-box` are 60.09375px on `/product` and 111.09375px on category pages at desktop/tablet; on mobile they are 95.1875px and 146.1875px respectively. These match the captures. The first attempt exposed a 35.09375px upward mobile grid shift when removing the original long sorting options. Fixed it by retaining the measured 237px hidden control-holder width and a clear, single-line stock-image notice: the original mobile float wrapping/vertical space is now preserved without exposing a commerce option. No card/grid CSS was altered to mask the discrepancy.

Additional browser checks passed at every width:

- Local stock images decode successfully; no remote product images are requested by the adapted cards.
- Approved listing body contains no `.price`, amount, add-to-cart, quantity, cart/checkout destination or active `select.orderby` control. Only a disabled neutral select remains in the noninteractive hidden layout holder; sample captions occupy the previous shipping-line footprint.
- All sample-card anchors have disabled labels and no destination. Direct pointer clicks cause no URL change or popup.
- All enumerated computed styles of hovered cards, anchors, images, titles and captions match the same live DOM with its original link/price-slot semantics restored temporarily. No hover rules were changed. The product-page heading replacement also causes zero grid-position shift.
- Both existing footer category links reach their matching category listing with one correctly filtered sample. Header/dropdown/category destinations are unchanged and validated by existing navigation tests.
- Existing WhatsApp control opens and closes its enquiry dialog normally on all nine combinations.
- No horizontal document overflow and no page JavaScript errors.

Input tests deeply freeze all captures, assert no source mutation, preserve header/footer/chat nodes by identity, and verify the other 140 routes are returned unchanged. Protected feature implementations and all original assets remain byte-for-byte unchanged in the diff.

## Review state and limits

This is a two-sample catalogue foundation, not a populated client collection. Total page/grid height will naturally be shorter than the original 100/78/36-card captures; extra fake entries are not created to fill the old page length. Existing out-of-scope legacy archives/details remain directly addressable, but approved listing cards and pagination no longer link to them. Migrating those routes is not part of 08A.

No packages, screenshots, visual-diff artifacts or evidence folders were added. Nothing staged, committed or pushed. Stop for review.
