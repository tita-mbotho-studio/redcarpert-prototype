# 07D — Redcarpert logo replacement

Implemented a guarded, immutable semantic-tree adaptation in `src/lib/logo-adapter.ts`, applied in the shared `SiteDocument` renderer to all 143 captured pages. It requires the unique captured header/logo container, original Home anchor, exact original image source/alt/attribute shape and empty image children. Unexpected input throws with its route. Only image attributes and ancestor objects are copied; other subtrees and document metadata remain shared.

The requested `public/redcarpert/brand/redcarpert-logo.png` did not exist initially. The existing, untracked client asset was `public/redcarpert/brand/redcarpert-logo-transparent.png` (2076×757). It is preserved. The new requested filename contains that entire image, pixel-for-pixel, centred on a transparent 2208×813 canvas (66px horizontal and 28px vertical padding on each side). This exactly matches the original image's 736:271 intrinsic ratio, which controls auto-width in the theme's compact header. No resampling, cropping or generated artwork was used. Only the existing `public/redcarpert/brand/` asset location was used; no other public directories were created.

The adapted image has `alt="Redcarpert"` and image-local `object-fit: contain`. This keeps the complete canvas uniformly scaled inside the original CSS image box. No width, height, max-size, wrapper, Home destination, theme CSS, header padding/height, navigation alignment, responsive breakpoint or scrolling code was changed. Captured `src/data/site.ts` and original assets remain untouched.

## Verification

- All 143 captured headers pass the guard.
- Frozen-source tests compare every node/attribute and shared unchanged subtrees; only the expected logo image attributes differ. Unexpected source and Home destination throw.
- All six test files pass (`node --experimental-strip-types --test tests/*.test.mjs`).
- Lint and typecheck pass.
- Production build with webpack passes, generating all 146 entries. Default Turbopack build failed on a worker socket restriction, including its escalated retry; `npm run build -- --webpack` completed successfully.
- Browser measurements compare the replacement against the actual original image loaded into the same live DOM, with the same approved navigation/runtime. Exact equality is required for x/y/width/height of image, logo container, Home anchor, header, navigation and menu. Home href remains `/`. Measurements follow image decode and layout settling.

The responsive matrix passed all **30 distinct route/state/viewport combinations**, across separate runs:

| Chromium viewport | Routes/states compared | Result |
| --- | --- | --- |
| Desktop 1440×900 | Home normal; About Us and catalogue normal/scrolled | Exact geometry match |
| Tablet size 768×1024 | Same five cases | Exact geometry match |
| Mobile size 390×844 | Same five cases | Exact geometry match |
| 1024×900 | Same five cases | Exact geometry match |
| 1001×900 | Same five cases | Exact geometry match |
| 1000×900 | Same five cases | Exact geometry match |

At 1001px, the normal image remains 350×150px and the naturally wrapped header remains 237.390625px tall. After informational/catalogue scrolling, the image remains 108.625×40px and header 59.390625px tall. At 1000px, the normal image remains 108.625×40px and header 95px tall; the existing scrolled header remains 69px tall. Header positioning also matches exactly, including the responsive theme's existing negative viewport y coordinates after scrolling.

Desktop, tablet-size and mobile-size homepage screenshots were inspected: complete lettering and ribbon are visible without cropping or distortion; original menu placement is retained. Temporary screenshots are `/tmp/07d-desktop.png`, `/tmp/07d-tablet.png`, `/tmp/07d-mobile.png`; the runner is `/tmp/07d-geometry.cjs`. Final breakpoint records are `/tmp/07d-geometry.json`. Earlier completed cases are recorded in execution output; one combined run closed before completion, and the last two widths were verified separately with incremental record saving. Temporary evidence is not committed to the repository.

## Limits and final state

Native iPad user-agent/touch emulation stalled during page initialization and did not complete. Tablet/mobile results above are actual responsive renders in desktop Chromium at those viewport sizes, not physical-device, Safari or native-emulation certification. External requests were blocked for the final browser matrix; local captured assets/theme scripts were allowed. Initial development-server load waiting timed out; the successful production build was used for the final matrix. Chromium and its system libraries were installed with approved escalation.

Homepage scrolling implementation is unchanged. This task verified homepage initial header geometry; it did not repeat the complete wheel/touch/footer interaction regression suite. Existing homepage unit tests pass. No claim of human visual approval is made.

The generated `next-env.d.ts` build change was restored to its initial contents. `git diff --check` passes. Task files are the shared renderer integration, new logo adapter, new adapter tests, new padded logo asset and this report. The supplied untracked transparent asset is preserved. No staging, commit or push was performed.
