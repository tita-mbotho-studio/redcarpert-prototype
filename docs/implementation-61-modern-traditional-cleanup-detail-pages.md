# Implementation 61 — Modern Tradition cleanup and dedicated dress detail pages

## Approved changes
Modern Tradition is a curated colour-based cross-list, not an additional silhouette or a duplicate set of products.

- Removed former Modern Tradition **04** (white), **05**, **06**, and **07** (duplicate looks in this collection). These dresses **remain** under their original dress categories with original images, sale/rental prices, and fitting links.
- Kept former Modern Tradition **01**, **02**, **03**, and **08**, renumbered to **01–04**. Former 08 (the Moreteadi source dress) now appears as **Modern Tradition 04**.
- Source mapping: 01 = `ball-gown-03`, 02 = `ball-gown-04`, 03 = `ball-gown-05`, 04 = `2-in-1-moreteadi-dress`.
- Exactly **47 canonical client dress records** remain; the cross-list now has **four** distinct dresses.

## Dedicated category-context detail pages
The Modern Tradition collection cards and Modern Tradition filter link to:

- `/product/preview/modern-tradition-01/`
- `/product/preview/modern-tradition-02/`
- `/product/preview/modern-tradition-03/`
- `/product/preview/modern-tradition-04/`

Each page displays the Modern Tradition name in the heading and browser title, as well as related Modern Tradition dresses. The underlying client dress ID, photographs, gallery, sale price, rental range, original silhouette page and original dress record are reused—not duplicated.

The main Wedding Dresses filter changes both card labels and **href** when Modern Tradition is selected. Switching filters restores the original silhouette, original label, accessible text and original detail URL.

WhatsApp messages generated from Modern Tradition pages identify the Modern Tradition name and collection and link to the correct context route. Original category pages preserve their original dress name, category and link.

## Lookbook integrity
Digital and PDF lookbooks continue using **one spread per original client dress**. They now annotate **four**, not eight, dresses as also appearing in Modern Tradition. Their page totals stay **49 interactive / 59 PDF**; the four Modern Tradition detail routes are additional static web pages, not duplicate book spreads.

## Verification and release
Added a dedicated test for four category-context detail pages, original routes, correct WhatsApp messages, related cards and four selected client dress IDs. Updated existing static build, filter, category, lookbook and browser assertions.

**Run locally**: `npm run check`, `npm run test:dist`, `npm run dev`.
Do not dispatch GitHub Actions, run Chromium before owner-authorized deployment, merge or deploy without explicit approval.
