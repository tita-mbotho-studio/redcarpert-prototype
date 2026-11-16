# Implementation 41 — Indicative wedding dress price ranges

## Current status
The 27 price ranges in `src/data/products.json` are **illustrative placeholders**, not prices approved by Redcarpert Wedding Dresses. They were created for client review and will be replaced once the client supplies actual prices.

The earlier `priceZar` fields are retained for backwards compatibility; the website and both lookbooks now use `priceRangesZar` for the displayed price. Do **not** update the old fixed amount to change a displayed range.

## Updating pricing when the client provides it
Edit only the appropriate entry under `priceRangesZar` in `src/data/products.json`:

```json
"ball-gown-01": {
  "minZar": 13500,
  "maxZar": 22900
}
```

The above numbers are placeholders. Replace both amounts with client-provided ZAR figures. `minZar` is the lower end and `maxZar` is the higher end; both must be positive whole rand amounts and `maxZar` must exceed `minZar`. The range may reflect new versus pre-owned condition, but the client must confirm the meaning and price levels.

The same price source feeds:
- Wedding Dresses and category catalogue cards
- Individual dress detail pages
- Digital lookbook
- Downloadable PDF lookbook, regenerated during the build

All displays include the condition disclaimer:
> Prices vary depending on whether the dress is new or pre-owned.

Until the client confirms actual price bounds, the public presentation labels amounts "Indicative range" or "Example range". Do not describe these values as verified prices or use them as binding quotations.

## Before a production release
Run the full Node.js tests, lint, TypeScript checks, production build, static output checks and Playwright browser checks. Inspect the downloadable PDF for text wrapping and page balance on A4. Merge and deploy only after review and explicit approval.
