# Implementation 06C — Footer scrolling correction

Date: 23 October 2026. No commit or push.

## Confirmed cause

Read reports 06, 06A and 06B. Inspected the copied-footer helper, homepage scroll helper, tests, PEXETO input handlers and bundled fullpage API.

The upward branch called `restore()` without preventing default or stopping propagation. `restore()` called `setAutoScrolling(true)` and cleared native scrollY. The same event then reached the theme's document mousewheel/ArrowUp handler, which called its previous-section trigger. Thus one input both restored image 3 and started the original fullscreen transition to image 2. The theme's current index and plugin active section had remained at 3 while the native tail was visible; propagation, rather than an intended previous-section request, caused the extra move.

The old native default scroll could also overshoot the third-section boundary. A scroll listener corrected the overshoot afterward, exposing earlier content before correction. In the downward direction, 06B prevented the boundary event's default action but applied no scroll at all, leaving the first gesture dead. Later native large deltas could reveal the whole short footer immediately. These were input-handoff issues; section heights were not being compressed.

## Changes

- `src/lib/homepage-footer.ts`: uniquely locates and removes the copied homepage `.scroll-to-top` element and its child from the footer's direct children. Removed the 06A `right:75px` override. Canonical informational footers remain immutable.
- `src/components/HomepageFooterScroll.tsx`: removed control visibility updates, control click handling and the unused `moveTo` API type. Kept navigation-dot restoration and native-phase transform clearing for viewport-fixed theme elements.
- The first downward wheel/key now both enters native mode and starts smooth movement. Every handled tail input is prevented and stopped before reaching theme handlers. Wheel movement is converted from pixel/line/page units and capped at 120 CSS pixels per event; ordinary smaller deltas retain their distance.
- Destinations are bounded between image 3's document top and the natural document end before scrolling. Direction reversal starts from the current position, rather than continuing toward an old pending destination. Browser smooth scrolling supplies gradual motion; original section animation timing is untouched.
- Returning to image 3 cancels pending native motion, restores the plugin and clears native offset synchronously. Image 3 remains active. Returning wheel bursts stay intercepted until a 180ms quiet interval; held keyboard repeats stay intercepted until release. Subsequent intentional input uses the original fullscreen transitions to images 2 and 1.
- `tests/homepage-footer.test.mjs`: asserts complete homepage control absence and canonical control presence. Remaining hierarchy/classes/styles are compared against the canonical footer with precisely that subtree removed; existing content, placement and immutability assertions remain.
- `codex-reports/06c-footer-scrolling-correction.md`: this report, the only new repository file.

No images/order, captured data, theme CSS/scripts, responsive breakpoints, header/navigation, text, catalogue, WhatsApp implementation, other routes, dependencies or layout system were changed. The initial working tree already contained a generated `next-env.d.ts` development-route import; that initial content is preserved after verification.

## Browser verification

Real Chromium input via Playwright: wheel, keyboard, click and CDP touch-start/move/end. DOM geometry only; no screenshots, pixel comparisons or visual evidence folders. Temporary runner/results are `/tmp/06c.cjs` and `/tmp/06c-results.jsonl`. Nonlocal requests are blocked; preview activation stays local.

| Case | Unchanged size of each image section | Natural footer height |
| --- | --- | --- |
| Desktop 1440×900 | 1440×900 | 260.140625px |
| Tablet size with desktop input 1024×768 | 1024×768 | 245.390625px |
| iPad portrait 768×1024 | 768×1094 | 413.5625px |
| iPhone portrait 390×844 | 390×914 | 515.609375px |

Mobile heights retain the original theme's viewport-plus-70px sizing and native touch flow. The homepage helper does not introduce fullscreen restoration or wheel interception on theme-detected mobile devices.

Desktop/tablet-desktop assertions cover:

- Wheel order 1 → 2 → 3 → footer and footer → 3 → 2 → 1, with original section transitions.
- First 60px boundary event already moves gradually: desktop sample at 50ms has image-3 top −26px, then settles at −60px. No extra input is needed to initiate scrolling.
- A 6,000px event settles at −120px, with active section still 3. Repeated input reaches the natural footer bottom.
- Reverse input during pending smooth motion; repeated large upward events 60ms apart; no positive image-3 top or transition to image 2 during the return burst. A later intentional upward event moves to image 2, then the next to image 1.
- ArrowDown navigates original sections; the first ArrowDown at image 3 scrolls 40px. End reaches the footer. Held ArrowUp returns to image 3 and remains there across repeats; releasing and pressing again moves to image 2, then 1.
- WhatsApp Space activation from the footer opens the preview; Escape closes it. Click activation also passes. Preview state does not change section geometry.

Touch assertions cover repeated downward swipes through all image content to the complete footer, followed by upward swipes back through the images to scrollY zero. Geometry is sampled throughout the gestures. Native touch behaviour remains unchanged.

At every sampled homepage position: three sections, constant dimensions, unchanged image URLs, `cover`, `50% 50%`, constant natural footer height and contiguous image-3/footer edges. Footer colours remain `rgb(37,37,37)` and `rgb(31,31,31)`. Homepage scroll-to-top is absent from the DOM. WhatsApp geometry is checked throughout the final run; preview click/Escape works in all cases.

For each viewport, browser visits to `/about-us`, `/contact-us` and `/our-brides` confirm that their scroll-to-top remains present with right 15px, and footer height/colours match the homepage's retained design. Unit tests additionally prove canonical subtree identity and unchanged handling of all 142 non-home routes. No browser JavaScript errors occurred in passing runs.

## Standard checks

- Content adapter suite: 9 passed.
- Homepage backgrounds suite: 4 passed.
- Homepage footer suite: 4 passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed, 146 framework/static entries.
- `git diff --check`: passed.

The functional browser matrix passed in development and was repeated against the production server. Existing Node module-type warnings and Next's standalone-start advisory remain. Initial sandbox server binding/Chromium launch failed with EPERM; approved executions outside the sandbox succeeded. No dependencies were installed.

## Limitations

Chromium emulation only; physical devices, Safari, Firefox and assistive technologies were not tested. Wheel events do not expose a reliable cross-device gesture identifier: the return-burst guard uses a 180ms quiet interval. Continuous momentum stays at image 3; a fresh upward input after that interval advances normally. Native mobile scrolling intentionally remains continuous, with no desktop fullscreen handoff to restore. Browser-native smooth-scroll duration is browser-controlled; no original animation timing or CSS was changed.

No screenshots, unrelated repository artifacts, staging, commit or push. Stop for review.
