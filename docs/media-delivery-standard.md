# Media delivery standard — Redcarpert Wedding Dresses

This is the **default media pipeline** for existing media and future additions. It applies to **both ImageKit and Pexels images**; original client URLs remain unchanged in the source JSON and data attributes.

## Central implementation

- `src/lib/media-delivery.ts`: the **single source of truth** for named image sizes, CDN transformations, automatic generated-HTML image treatment and native video poster/preload rules
- `src/lib/wedding-moment-image-delivery.ts`: backwards-compatible facade; delegates to the same shared policy (do not maintain separate ImageKit configurations)
- `scripts/lib/markup.ts`: automatically optimizes supported remote `<img>` elements, both existing and added to future pages. Optimizes online lookbook photographs explicitly using the `lookbook` preset. Local images remain untouched
- `src/lib/homepage-backgrounds.ts`: uses the `hero` preset for each approved homepage panel; the matching page-loader and HTML preload request the **same** delivery URL
- `src/client/MediaDelivery.js`: centralized delegated fallback for images (including gallery changes and Load More) and original-image fallback for CSS hero backgrounds and video posters
- `src/client/dress-gallery.js`: every slide uses the shared detail image preset; the enlarge link keeps its original full-resolution URL
- `src/lib/wedding-moments.ts` and `src/client/wedding-moments.js`: image tiles and video poster remain small; only user-selected media loads in the modal. Videos play with native controls and sound

## Default responsive image presets

| Context | ImageKit max dimensions | Quality | Delivery |
| --- | --- | --- | --- |
| Wedding Moments tile / video poster | 640×640 | 72 | `tile` |
| Product catalogue card | 740×740 | 76 | `card` |
| Dress detail carousel | 1280×1800 | 82 | `detail` |
| Lightbox photograph | 1920×1920 | 82 | `preview` |
| Digital lookbook photograph | 1200×1600 | 80 | `lookbook` |
| About Us and general editorial images | 900×1200 | 76 | `team` |
| Full-screen homepage section | 2000×2000 | 83 | `hero` |

ImageKit uses `c-at_max` (preserve the source aspect ratio; never crop the media at the CDN) plus `f-auto` (serve browser-appropriate format). Any visual crop is applied only by the **existing CSS**. Pexels uses `auto=compress`, `cs=tinysrgb` and a capped width; a smaller pre-optimized existing URL is preserved.

Do not use these delivery presets to shrink photos embedded in the **downloadable PDF**. The PDF generator has its own `sharp` image preparation and print-DPI audit, and must preserve sufficient print resolution. Local approved logos/favicon assets are already optimized at build time, and are not modified by CDN transformations.

## Standard loading rules

1. Approved hero: one matching high-priority preload; preconnect to its CDN; the image stays sharp with the current mobile/desktop framing. Other homepage photos retain their native scroll loading
2. Gallery: initial visible images may be eager; off-screen media remain `loading="lazy"`, `decoding="async"`. Wedding Moments keeps **16 initial cards** and **71 inert cards**, 16 more per click
3. Video: do not preload a full MP4 or WebM until interaction. The `<video>` default is `preload="none"`, and video posters are optimized thumbnails. Preserve sound, controls, and `playsinline` when provided
4. Lightboxes: load a screen-appropriate photo, but preserve a full-resolution original for fallback, download or zoom. Closing a video unloads its source
5. **Always retain original URLs**. When an optimized image fails, a delegated error listener retries the original once. Homepage CSS background and video poster URLs also keep originals for fallback
6. URLs with existing ImageKit `tr` parameters are never double-transformed. Unknown hosts, local paths, SVG and videos are not transformed
7. All new media added to the manifests, dress galleries, and page content inherit this system at generation time. An exceptional image can specify `data-media-preset="preview"` (or another named preset) or `data-media-skip="true"` on the markup. Avoid manually concatenating ImageKit transformations elsewhere

## Future media uploads

- Upload approved client images to ImageKit and store only their **original HTTPS URLs** in `src/data/image-links.json`, `src/data/client-ball-gowns.json`, or `src/data/dress-gallery-images.json`
- Preserve the correct page/category grouping and all alternative text or captions. New Wedding Moments event batches automatically inherit the same card and preview policy
- Videos should be prepared/encoded for the web before upload, ideally with an MP4/WebM source and a good poster image. The website does **not** re-encode hosted MP4s or magically reduce the source video's transfer size; native progressive loading prevents premature downloads. Verify streaming and byte-range support with the hosting provider
- For future photo layouts, use the shared `mediaDeliveryUrl(original, preset)` helper for non-`<img>` usages (CSS backgrounds, canvas, galleries), and rely on the shared HTML renderer for regular images

## Quality and performance checks

Run `npm run check` (lint, typecheck, full build, unit and generated HTML tests), then `npm run preview` and in another shell `npm run test:browser`. Confirm desktop/mobile layouts, gallery navigation, PDF readability, image fallback, no duplicate source downloads, automatic lookbook initialization, video sound and control availability.

In DevTools **Network**, test repeat visits and a throttled mobile connection. Compare actual transfer size, LCP and perceptual load time before claiming a measured improvement. ImageKit's first uncached transformation may take longer than a subsequent CDN-cached request.

The shared policy lives in one source module; **do not add page-specific duplicate transformation strings**. Only adapt the preset table or extend the renderer when a genuinely new display context requires it.
