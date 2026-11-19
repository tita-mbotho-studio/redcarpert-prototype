# Implementation 64 — Seamless dress galleries and ImageKit deployment preflight

## Goal

Remove the first-photo flash when moving between gown images, improve repeat views, and have every **owner-initiated deployment** validate/warm only the client media currently referenced by the website.

The existing GitHub Pages deployment policy stays unchanged: **manual `workflow_dispatch` on `main` only**. There are no push, pull-request, scheduled or automatic deployment triggers.

## Gallery transition

- `src/client/MediaDelivery.js` now exposes `preloadMediaImage` with bounded in-memory promise deduplication.
- Optimized ImageKit derivatives use the existing `mediaDeliveryUrl(...,'detail')` `c-at_max` transform; original approved URLs remain the fallback.
- The requested photo loads and decodes **before** it replaces the visible one; its counter/alt/dot are updated only when the swap commits.
- Previous and next images are prefetched (unless `navigator.connection.saveData` is enabled).
- Rapid click, key and swipe navigation is request-sequenced; an earlier delayed request cannot change the later selected image.
- A failed optimized image retries its own original URL. If both fail, leave the last successfully displayed photo in place and do not present the wrong dress angle.
- The gallery and photo modal retain their existing styling, photo aspect ratios, zoom behavior, responsive layout, arrows and price cards.

**A first-time uncached image may still take time to download.** The interface keeps the previous valid image while loading rather than flashing another photograph.

## Image audit and CDN preparation

`npm run media:audit` (offline) computes the media plan from the current manifests. `npm run media:prepare` validates and GET-warms the referenced ImageKit derivatives:

- All dress gallery images (including reused Modern Tradition source photos) — `detail`
- Catalogue cards — `card`; digital lookbook images — `lookbook`
- Homepage panels — `hero`; About Us portraits — `team`
- Wedding Moments photo tiles — `tile`; photo previews — `preview`
- Client video posters — `tile`; **not** the full MP4 video streams

The plan deduplicates identical URLs and preserves `c-at_max` to avoid cropping, upscaling or stretching. Network requests use bounded concurrency and response size checks. A failed CDN derivative retries the corresponding original; a missing original blocks deployment. The image audit fingerprint and results are saved at `.cache/redcarpert-image-preflight/report.json`.

The existing PDF generator continues to read the same client photo sources. It is not changed.

### CDN correctness and versioning

ImageKit/browser caching is based on the final URL. If an image is replaced at the same URL, cache invalidation **cannot be guaranteed** unless ImageKit's CDN is purged or the JSON image URL is updated with the new `?updatedAt=` value. Older gallery/portrait URLs in the repository still lack that parameter. The audit reports these URLs but does not break existing dresses simply because they are unversioned.

This workflow **does not** download/transcode another local copy of every image, create a custom image storage layer, or promise that warming one runner region makes every worldwide CDN edge hot. It preserves the existing ImageKit delivery service.

## GitHub Actions pipeline (NOT PUSHED)

The replacement `.github/workflows/pages.yml` has been prepared as a separate preview artifact and **has not been committed or pushed to GitHub**. When the owner explicitly approves installing it, the only new build behavior is:

```yaml
- name: Verify and warm client images on ImageKit
  run: npm run media:prepare
- name: Save media preflight report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: redcarpert-image-preflight
    path: .cache/redcarpert-image-preflight/report.json
    if-no-files-found: ignore
    retention-days: 7
```

The manual deployment continues to run lint, typecheck, unit tests, Chromium, production build, distribution tests and production browser tests **before** publishing.

**Do not push the workflow, merge or deploy until separately authorized.**

## Verification and local commands

```powershell
git fetch origin
git switch implementation/64-seamless-gallery-image-cache-deploy-preflight
git pull --ff-only origin implementation/64-seamless-gallery-image-cache-deploy-preflight
npm run media:audit
npm run check
npm run test:dist
npm run dev
```

The local unit tests cover predecode, cache reuse, CDN fallback, versioned URLs and deployment-media validation/failure behavior. The browser dress-gallery suite now includes delayed and out-of-order requests to reject first-image flashes and stale completions.

No full `npm run check`, full Chromium run, or live ImageKit preflight was executed within the connected source-editing environment. Full local verification is required.
