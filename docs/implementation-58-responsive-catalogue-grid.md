# Implementation 58 — Responsive Wedding Dresses grid alignment

## Problem
Filtering the **Wedding Dresses** catalogue on mobile (notably **2 in 1 Dresses**) left an empty first column and rendered the first visible dress in column two. The captured WooCommerce CSS uses floats and a `nth-child(2n)` right-float rule based on **original DOM position**, not filtered visibility. Generated `first`/`last` classes were also calculated using four columns even at smaller viewports.

## Fix
- Style only `ul.products[data-catalogue-preview]` and its direct dress cards as a CSS Grid: 4 columns on desktop (>1000px), 3 columns on tablet (641–1000px), 2 columns on mobile (<=640px).
- Override inherited WooCommerce width, margin, float, `clear`, and direct card grid placement rules; avoid repurposing or deleting the existing photos/title markup.
- Remove WooCommerce `ul::before`/`ul::after` clearfix pseudo-elements, which otherwise consume grid cells.
- Explicitly hide both `li[hidden]` and `li.redcarpert-filtered-out` so invisible dresses never reserve a grid slot.
- Stop generating and recalculating legacy `first`/`last` float classes. Filtering remains URL-aware and maintains the original product order, card count, images, links, titles, square crops, category buttons and accessibility.

## Verification
- Updated `tests/catalogue-card-alignment.test.mjs` to reject float-based card ordering and require proper 4/3/2 responsive CSS Grid, hidden-card handling and no generated positional classes.
- Updated `scripts/browser-catalogue-cards.mjs` to click every one of the five category filters plus All Dresses across 1440, 1000, 768, 640, 390 and 320px. It checks the first visible card touches the left grid edge, cards fill rows left-to-right, hidden items never render, row alignment, correct card order, and no horizontal overflow.
- An isolated **headless Chromium** layout using the captured WooCommerce float rules plus this new responsive grid passed at 320, 390, 640, 641, 768, 1000, 1001 and 1440px. The first visible card started at column one in each case.
- Changed JS and test scripts passed syntax parsing. The updated static regression assertion passed in a source-level harness.
- **Full `npm run check`, `npm run test:dist`, and real-site `npm run test:browser` remain pending local verification.**

## Local review
```powershell
cd C:\Users\Admin\Projects\redcarpert-wedding-dresses\redcarpert-prototype
git fetch origin
git switch implementation/58-responsive-catalogue-grid
git pull --ff-only origin implementation/58-responsive-catalogue-grid
npm run check
npm run dev
```

Inspect `http://localhost:5173/redcarpert-prototype/product/` on mobile/tablet and select **2 in 1 Dresses**. The first card should start on the **left** with subsequent cards filling rows sequentially. After building, run `npm run preview -- --port 4173` in a separate terminal and `npm run test:browser` in another.

No new dependencies: `npm ci` is unnecessary. **Do not merge, deploy or start GitHub Actions until the owner approves.**
