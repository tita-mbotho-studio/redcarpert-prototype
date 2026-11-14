# Implementation 30 — Multiple photographs for one wedding dress

## Goal

Prepare the wedding dress detail view to display **several verified photographs of the same gown**, including front, side, back and detail angles, without changing the existing product information card, WhatsApp fitting enquiry, prices, categories, site navigation, homepage, or online/PDF lookbooks.

## Design

For a dress with **two or more images**, the main photo gains:
- Subtle circular **Previous / Next** arrow buttons on the left and right.
- A centred series of modern pagination dots, including an active indicator.
- A compact **01 / 03** photo-position counter.
- Mouse clicks, keyboard left/right arrows when the gallery has focus, and horizontal touch swipes on mobile.
- A full-size enlarge link that always follows the currently selected image.

Multi-photo dresses use `object-fit: contain` on the established ivory background so different angles, portrait proportions and the full silhouette are not cropped. The existing single-photo styling stays unchanged.

For a **single-photo dress**, arrows, dots and the counter stay **hidden**. We must not pretend unrelated stock images represent additional views of one client gown.

## Data: adding actual photos later

Additional photos for each dress are configured in:

`src/data/dress-gallery-images.json`

Initially the file is `{}`. Once the client supplies genuine views of the same gown, use the existing dress ID as the key:

```json
{
  "sample-mermaid": [
    {
      "url": "https://ik.imagekit.io/your-account/bridal/look-01-side.webp",
      "alt": "Side view of the same Mermaid wedding gown"
    },
    {
      "url": "https://ik.imagekit.io/your-account/bridal/look-01-back.webp",
      "alt": "Back view of the same Mermaid wedding gown"
    }
  ]
}
```

The gallery starts with that dress's existing **primary catalogue image** (`product.image`), then uses its additional photos in the configured order. The first image remains the photograph shown in the catalogue and Digital Lookbook; it should be updated in the existing product image manifest when replacing sample content with client inventory. Never use another dress's photo as an alternate angle.

This implementation allows **up to 15 additional images per gown**, currently hosted through ImageKit or the existing approved Pexels domain. The build rejects unrecognised dress IDs, unsafe URLs, empty alternative text, or duplicate gallery images. No new stock dress photographs or client media have been added.

## Technical notes

- Existing `src/lib/product-detail-preview.ts` still validates the captured page structure and preserves the single active `img` element and its current Fancybox zoom link.
- Multi-image dresses use a dedicated slider class to avoid legacy Slick/widget initialization replacing or cloning the new gallery buttons. Single-photo details retain their existing gallery/zoom behaviour.
- Gallery options are embedded in escaped metadata at build time; only the active image is loaded. Clicking the navigation swaps the `src`, `alt` and current full-size link.
- `src/client/dress-gallery.js` is initialized by the existing website entrypoint, with no new dependencies or third-party slideshow libraries.
- Extra controls are rendered **only when the image list has more than one photo**.
- `tests/product-detail-preview.test.mjs` validates both single-photo and three-photo fixtures and rejects unsafe gallery metadata.
- `scripts/browser-dress-gallery.mjs` verifies arrows, dots, captions, image links, wrap-around, keyboard and mobile gestures in an isolated three-photo test fixture.

## Review in Codespaces

```sh
git fetch origin
git switch implementation/30-multi-photo-dress-detail-gallery
npm test
npm run check
npm run dev
```

The existing twenty demo dresses still have one photo each. The gallery navigation will only appear on a real dress with at least two correctly mapped photos; test coverage uses artificial URLs solely inside test fixtures.

The branch and PR are **not merged or deployed** without owner approval.
