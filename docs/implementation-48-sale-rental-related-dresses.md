# Implementation 48 — Sale / Rental Pricing and Related Dresses

## Client decision

Use existing fixed ZAR amounts as **example sale prices only**. Never invent a confirmed price:
- 16 catalogue inspiration dresses have numeric `priceZar` amounts: present those **fixed** figures as **EXAMPLE SALE PRICE**.
- 11 client Ball Gowns have `priceZar: null`: show **SALE PRICE — To be confirmed**.
- All 27 dresses have `rentalPriceRangeZar: null`: show **RENTAL PRICE RANGE — To be confirmed**, until the business supplies a valid `{ "minZar": ..., "maxZar": ... }` range.
- No rental values have been created or inferred from the existing price ranges.

## Pricing source of truth

The `src/data/products.json` `dresses` list now contains `rentalPriceRangeZar` for each approved dress, alongside the established `priceZar` numeric/null field. Rental range values must be whole rand amounts, positive, and `maxZar > minZar`.

`src/lib/pricing.ts` validates those 27 records and provides:
- `salePriceForDress`, `displaySalePriceForDress`
- `rentalPriceRangeForDress`, `displayRentalPriceForDress`
- `SALE_RENTAL_DISCLAIMER` and `PRICE_PENDING_LABEL`

The **previous** `priceRangesZar` collection and `displayPriceForDress` remain only as legacy illustrative data and helper code; they are **not used as customer-facing prices** on the website, in the interactive book, or in the PDF. They are neither sale prices nor rental prices. Every published price comes from the same `priceZar` / `rentalPriceRangeZar` dress records.

### Customer-facing disclaimer

> Displayed sale prices are examples only, not confirmed quotes. Rental prices, final sale prices and availability must be confirmed with Redcarpert. Prices may vary depending on whether a dress is new or pre-owned.

This appears below the two price blocks and before the fitting CTA. A shorter reminder also appears below related dresses and in dress-specific WhatsApp messages.

## Detail page layout

Keep the existing portrait gallery on the left and elevated information card on the right. In the card, replace the old indicative price-range block with two fields:
- **Example sale price** (fixed ZAR value, where assigned) or **Sale price — To be confirmed**
- **Rental price range — To be confirmed**

Display both side-by-side where space permits and stack them on narrow mobile viewports. The **Book a Fitting** wording sits above an **icon-only, compact WhatsApp link**, matching the approved About Us / Contact Us CTA design (48 × 48 px on desktop, 44 × 44 px on small screens). The icon is centred, has an accessible `aria-label`, and continues to open the dress-specific WhatsApp enquiry directly. **Do not restore the old wide filled text button.** Photography zoom/gallery and the direct enquiry behaviour remain unchanged.

The dress-specific WhatsApp text now carries the same example sale price or pending sale state, and a pending rental range, and requests final confirmation of both. General enquiry templates remain unchanged.

## Digital and downloadable PDF Lookbooks

The same two price fields now appear on **every one of the 27 dress pages** in both editions:

- Interactive Digital Lookbook: **29 leaves** (cover, 27 dresses, back cover).
- Downloadable A4 Bridal Edit PDF: **39 pages** (collection openers and editorial matter retained).
- `salePriceLabelForDress`, `displaySalePriceForDress` and `displayRentalPriceForDress` control values everywhere, including dress details, related dress cards and WhatsApp messages.
- Each book displays **Example sale price** plus the existing fixed amount where present, or **Sale price — To be confirmed** when absent. Every **Rental price range** remains **To be confirmed** until the business supplies an approved range.
- A shared `LOOKBOOK_PRICING_DISCLAIMER` identifies examples and unconfirmed rental/final-sale amounts in both editions. The longer `SALE_RENTAL_DISCLAIMER` remains on the dress-detail page.
- Replaced the old single **Indicative range / Example range** line in both book editions; those legacy illustrative ranges are not displayed or reinterpreted as rental prices.
- Kept the book covers, ordering, photography, dress links and page counts. Tightened price typography and spacing to keep two amounts readable inside existing page dimensions.
- Updated the browser and static tests for dual prices and aligned digital / PDF content.

### Review price parity and PDF page fit

After `npm run check`, run `npm run preview` and `npm run test:browser` in a separate terminal. To review actual PDF page screenshots during the build, run:

```powershell
$env:REDCARPERT_BOOK_PREVIEW = '1'
npm run build
Remove-Item Env:REDCARPERT_BOOK_PREVIEW
```

Review `.generated/lookbook-previews/look-ball-gown-01.png` and `look-sample-mermaid.png`, plus the entire generated PDF, especially the price blocks, disclaimers and dress links. The build should not be merged or deployed before these checks pass.

## Related dresses

Each detail page now adds a separate **More from the [Category] Collection** section below the main gallery and pricing. Build from the existing `catalogueProducts`, with no new image URLs or product duplication.

- Exclude the current dress.
- Show up to four **other** items from the **same category**, in stable catalogue order, wrapping from the end.
- Ball Gown (11): four suggestions; all remaining categories (four each): three suggestions.
- Cards contain square catalogue images, the dress name and a labelled example sale price (or pending sale status).
- Cards link to the corresponding dress detail page; image delivery uses the existing optimized `card` preset.
- Desktop uses four cards where available; the three-card collections use a centred three-column row. Tablet/mobile uses two columns with the unmatched final card centred.

## Review and release

Run locally:
```powershell
git fetch origin
git switch implementation/48-sale-rental-related-dresses
git pull --ff-only origin implementation/48-sale-rental-related-dresses
npm run check
npm run dev
```

For actual browser tests, run `npm run build`, `npm run preview`, then `npm run test:browser` in another terminal. Confirm both sample and Ball Gown pages, and inspect 320px, 390px, 768px and desktop widths for pricing readability, linked recommendations and no horizontal overflow.

**No merge, workflow dispatch, or deployment until explicitly requested.**