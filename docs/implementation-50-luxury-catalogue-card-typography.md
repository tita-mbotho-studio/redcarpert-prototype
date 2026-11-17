# Implementation 50 — Luxury catalogue card typography

## Approved scope

The main Wedding Dresses catalogue and all five category pages share the same editorial card:

- Preserve the existing square photograph, image delivery presets, grid layout and click-through detail route.
- Render the collection as an elegant, centred **Cormorant Garamond** serif heading.
- Add a thin champagne-gold divider beneath the collection name.
- Display only the existing two-digit dress number beneath the divider in letter-spaced **Montserrat**.
- Use dark charcoal for the collection and muted gold for the number; give the card subtle framing and hover/focus elevation.
- Display the collection names **Mermaid**, **Ball Gown**, **Ruffled**, **Modern Tradition**, and **2 in 1**. The underlying categories keep their existing identifiers.
- Keep product data, individual dress titles, WhatsApp messages, prices, lookbooks and related dress components unchanged.

For example, a catalogue card that previously read "Ball Gown 02" now reads:

Ball Gown
──────────
02

The accessible link name remains explicit: "Ball Gown 02: view dress photographs".

## Implementation

- `src/lib/catalogue-adapter.ts`: derive the catalogue collection name and two-digit number from the same source product; build three semantic title parts without altering the ID, image, route or source records.
- `src/components/CatalogueListing.css`: scoped editorial typography, responsive spacing, restored square crop, accessible focus and reduced-motion behaviour.
- `tests/catalogue-adapter.test.mjs` and `tests/catalogue-card-alignment.test.mjs`: source-level checks for the complete card hierarchy and all five collections.
- `tests/static-build.test.mjs`: build output checks for all catalogue cards and each category.
- `scripts/browser-catalogue-cards.mjs`: layout checks at 1440, 768, 390 and 320px.

## Local review

```powershell
git fetch origin
git switch implementation/50-luxury-catalogue-card-typography
git pull --ff-only origin implementation/50-luxury-catalogue-card-typography
npm ci
npm run check
npm run dev
```

For production browser verification, run `npm run build`, then `npm run preview` in one terminal and `npm run test:browser` in another.

Do not merge, deploy, or manually trigger GitHub Actions without the owner's explicit approval.
