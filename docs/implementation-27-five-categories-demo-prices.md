# Implementation 27 — Five dress categories and illustrative pricing

## Scope

- Preserves original four Mermaid and four Ball Gown stock-photograph samples.
- Adds **four** Pexels styling photographs per new category: **Ruffled Dresses**, **Modern Tradition Dresses**, **2 in 1 Dresses**.
- Keeps the approved square catalogue cards, responsive header/footer menu and floating dress-detail card.
- Makes **twenty** products available across the category filter, dedicated category pages, fitting enquiry detail views and online Digital Lookbook.
- Grows the online lookbook from 10 to **22 pages** (cover, 20 product leaves, back cover).
- The downloadable PDF remains intentionally limited to its **two approved local sample photographs**. It now reflects their illustrative JSON prices.

## Pricing

The single source of truth is [products.json](../src/data/products.json). Values are integer rand amounts, formatted using ZAR as `R 12 900`. The top-level `priceStatus: "illustrative"` explicitly distinguishes proposed sample numbers from verified inventory pricing.

| Category | Samples | Illustrative ZAR amounts |
|---|---|---|
| Mermaid | 01, 03, 04, 05 | R 12 900, R 14 500, R 16 900, R 18 900 |
| Ball Gown | 02, 06, 07, 08 | R 15 900, R 18 500, R 21 500, R 24 900 |
| Ruffled Dresses | 09–12 | R 14 900, R 16 900, R 18 900, R 22 900 |
| Modern Tradition Dresses | 13–16 | R 17 900, R 21 500, R 24 900, R 28 900 |
| 2 in 1 Dresses | 17–20 | R 21 900, R 24 900, R 28 900, R 33 900 |

**These prices were invented for the prototype at the owner's request. Do not represent them as final Redcarpert selling prices.**

## Photographs and truthfulness

All twelve new links are sourced from Pexels, referenced through [image-links.json](../src/data/image-links.json) and credited in [asset-credits.md](asset-credits.md). No new photographs are downloaded into the repo or fetched by the build.

The *2 in 1* images depict bridal boutiques and gown styling **but do not prove that a pictured gown has two wearable configurations**. They are inspiration-only placeholders until the client supplies actual convertible dress photography. All images are labelled demonstration photographs, not Redcarpert inventory.

## Routes and review

New category routes:

- `/product-category/ruffled/`
- `/product-category/modern_tradition/`
- `/product-category/two_in_one/`

The main catalogue route and existing categories remain unchanged. Each dress has its own preview URL. The site now has 31 generated public HTML routes including the homepage.

In a capable online or local development environment, inspect the branch and run:

```bash
git switch implementation/27-five-categories-demo-prices
npm ci
npm run check
npm run dev
```

Then inspect `/product/`, each of the five category routes, at least one new detail preview and `/digital-lookbook/` across desktop, tablet and phone widths. Browser regression testing requires a preview server plus Chromium.

**No merge, Pages deployment, or GitHub Actions run is part of this implementation until explicitly authorized.**
