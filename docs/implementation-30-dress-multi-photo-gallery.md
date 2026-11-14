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

For browser QA, **Sample 17** (`sample-two-in-one-01`, in the 2 in 1 Dresses collection) now includes one extra Pexels photograph from the **same Esma Atak bridal shoot**. Its existing primary image is Pexels [20370059](https://www.pexels.com/photo/woman-in-a-wedding-dress-posing-in-a-bridal-shop-20370059/), and its additional angle is [20370060](https://www.pexels.com/photo/woman-in-a-wedding-dress-posing-in-a-bridal-shop-20370060/). Both show the same model and gown in the same shop setting, with different poses. These are demonstration images, **not real client inventory** and not evidence of convertible dress construction.

All other dresses still have one photograph. The demo mapping must be replaced with real client image URLs when approved; do not mix actual client gown photos with unrelated stock photos. Once client photos arrive, use the existing dress ID as the key:

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

For direct browser review after `npm run dev`, open:

`http://localhost:5173/redcarpert-prototype/product/preview/sample-17-two-in-one/`

For Playwright's full site test, start a preview server on port 4173 from a successful build, then run `node scripts/browser-dress-gallery.mjs`. This exercises both the synthetic three-photo controller and Sample 17's real two-photo Pexels gallery. The `npm run check` command remains the verification gate before merging.

The existing sample dress **17** has two stock photographs, so its arrows, dots and counter can now be tested on the real website at `/product/preview/sample-17-two-in-one/`. All other current demo dresses still have one photograph, so their galleries remain unchanged. A separate three-photo synthetic fixture tests navigation edge cases. The image URLs, photographer and original primary photo have been kept intact; no client inventory has been published.

The branch and PR are **not merged or deployed** without owner approval.
