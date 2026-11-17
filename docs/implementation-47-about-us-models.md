# Implementation 47 — Named About Us Model Gallery

## Source of truth

The client supplied six original images uploaded to ImageKit, shown in the order of the supplied links. Use the exact URLs and names in `src/data/image-links.json` → `about_us.team`.

| Model | ImageKit asset |
| --- | --- |
| Shantel | `redcarpert-about-us-shantel.jpg` |
| Refiloe | `redcarpert-about-us-refiloe.jpg` |
| Olga | `redcarpert-about-us-olga.jpg` |
| Mapaseka | `redcarpert-about-us-mapaseka.jpg` |
| Defny | `redcarpert-about-us-defny.jpg` |
| Paula | `redcarpert-about-us-paula.jpg` |

The About Us section now reads **Meet Our Models**, not “Meet the Team”: the provided names identify models, not necessarily employees. Each photograph displays the matching **model's first name** in its caption. Old Pexels placeholders, “inspiration / not staff” copy and Pexels credit text are removed from this section only.

## Design and delivery

- Three responsive columns on desktop, two on tablets and one on mobile.
- Six figures form two even desktop rows and three even tablet rows.
- Uniform 3:4 image frames, `object-fit: contain`, so the full portraits aren't cropped.
- Small centred name captions; original team-card visual language retained.
- The ordinary image renderer automatically applies the existing ImageKit `team` preset for delivery, preserving the original URL in `data-media-original` and emitting an optimized `src` with `tr`.
- Lazy loading and async decoding remain in place.
- No changes to the dress catalogue, homepage, WhatsApp, footer or lookbook.

## Review

```powershell
git fetch origin
git switch implementation/47-about-us-model-gallery
git pull --ff-only origin implementation/47-about-us-model-gallery
npm run check
npm run dev
```

For browser checks, serve the build via `npm run preview` and run `npm run test:browser` in another terminal. Inspect the About Us page at phone, tablet and desktop widths; verify that each portrait maps to its own model, and that the ImageKit links load. GitHub Actions and deployment are never triggered without explicit instruction.
