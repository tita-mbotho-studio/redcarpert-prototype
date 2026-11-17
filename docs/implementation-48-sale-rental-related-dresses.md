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

The **previous** `priceRangesZar` collection and `displayPriceForDress` remain in place for existing PDF/Digital Lookbook compatibility. These are legacy *illustrative* ranges, **not rental prices**. Do not treat them as confirmed sale prices either. The lookbooks can be aligned to a final approved sale/rental pricing scheme once the client supplies and approves actual prices.

### Customer-facing disclaimer

> Displayed sale prices are examples only, not confirmed quotes. Rental prices, final sale prices and availability must be confirmed with Redcarpert. Prices may vary depending on whether a dress is new or pre-owned.

This appears below the two price blocks and before the fitting CTA. A shorter reminder also appears below related dresses and in dress-specific WhatsApp messages.

## Detail page layout

Keep the existing portrait gallery on the left and elevated information card on the right. In the card, replace the old indicative price-range block with two fields:
- **Example sale price** (fixed ZAR value, where assigned) or **Sale price — To be confirmed**
- **Rental price range — To be confirmed**

Display both side-by-side where space permits and stack them on narrow mobile viewports. Preserve the centred Book a Fitting action, photography zoom/gallery, WhatsApp deep links and direct enquiry behaviour.

The dress-specific WhatsApp text now carries the same example sale price or pending sale state, and a pending rental range, and requests final confirmation of both. General enquiry templates remain unchanged.

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