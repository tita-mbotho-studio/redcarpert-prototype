# Implementation 28 — The Bridal Edit

## Intent

Replace the downloaded two-page sample PDF with a **32-page luxury editorial bridal book**, while leaving the existing website's interactive lookbook, product catalogue and enquiry flow intact. The book is designed for **A4 portrait (210 × 297 mm)** digital reading, with warm ivory paper, restrained champagne accents, generous outer and binding margins, full-gown photograph containment, and editorial serif typography.

## Approved pages

| Pages | Contents |
|---|---|
| 1–4 | Cover, title, welcome, clickable table of contents |
| 5–9 | Mermaid opening + four looks |
| 10–14 | Ball Gown opening + four looks |
| 15–19 | Ruffled Dresses opening + four looks |
| 20–24 | Modern Tradition Dresses opening + four looks |
| 25–29 | 2 in 1 Dresses opening + four looks |
| 30–32 | WhatsApp fitting enquiries, photography credits, back cover |

Every product page has one centred, proportionally contained portrait image, a look identifier, collection and JSON-backed illustrative ZAR price. Text is selectable and photographer source links remain clickable. Headings are intended to generate navigable PDF outlines.

## Typography and production

- Headings: **Cormorant Garamond**, with Georgia fallback.
- Supporting type: **Montserrat**, with Arial fallback.
- Primary text: #4C4035; page #FDFBF8; champagne #947B5C; divider #E9DED2.
- A4 portrait with approx. 22 mm inside, 18 mm outside/top/bottom safe margins.
- Fonts are loaded in Chromium before rendering; the PDF uses browser-provided font embedding.
- Browser's PDF print engine creates vector text and images with active hyperlinks.
- All first-run photographs are fetched through Codespaces/runner HTTPS, optimized and stored under the ignored `.cache/redcarpert-lookbook/` directory. Later local builds reuse this cache.
- Build-time audit `.generated/lookbook-image-audit.json` records source dimensions and effective print DPI for each of the twenty photographs. Results under 300 effective DPI must be resolved before print production.
- The downloadable PDF is a **digital reading edition**. A printer-specific 3 mm bleed / CMYK / PDF-X deliverable is intentionally **not** claimed ready before the printer supplies output requirements.

## PDF files

The canonical file is `Redcarpert-The-Bridal-Edit-YYYY.pdf`, where the year comes from the build date. The original `Redcarpert-Sample-Lookbook.pdf` path remains an alias so that existing shared links do not break.

## Local / Codespaces checks

```sh
git switch implementation/28-luxury-pdf-lookbook
npm ci
npm run setup
npm run check
npm run dev
```

First build requires fetching twenty images (and potentially typefaces), which may take more data than later cached builds. Do not commit the cache or Pexels images to GitHub. **Review the generated 32-page PDF at 100% and 200% zoom, including the full dress edges, cover, collection headings, all prices, WhatsApp link and credits.** Review any low-DPI entries before providing a print variant.

No merge or GitHub Pages deployment is authorized by this work.
