# Implementation 06B — Homepage images and footer handoff

Date: 23 October 2026.

## Cause and scope

Inspected `HomepageFooterScroll.tsx`, the PEXETO wrapper and bundled fullpage implementation in `public/site-assets/theme-fullpage.js`, and computed DOM geometry in Chromium. The initial working tree was clean.

The reported shortening is an abrupt reduction in the visible portion of section 3, not an actual reduction in its element height. On desktop 1440×900, all three sections remained 1440×900 before, during and after the original handoff, with `background-size: cover` and `background-position: 50% 50%`. The footer remained 260.140625px tall and its top was always contiguous with section 3's bottom.

The original wheel branch called `setAutoScrolling(false)` and then immediately `window.scrollBy(0, event.deltaY)`. The plugin changes html/body to natural scrolling, removes its `.easing` class when resetting the transform, and scrolls to the active section's layout position. The helper clears the zero transform for the 06A fixed control. At that point the original code additionally applied the entire boundary wheel delta. Measured with a 100px wheel delta, section 3's top jumped from 0 to −100 and the footer's top from 900 to 800; section height remained 900. A delta at least as large as the footer height can reveal the entire short footer immediately. The keyboard branch similarly allowed the boundary key's native default scroll after changing modes.

No section compression, background rescaling, or footer overlap was observed in this baseline. Normal scrolling necessarily moves the image out of the viewport while revealing the footer; that ordinary viewport cropping remains. Keeping the whole image simultaneously visible with the footer would require changing the approved presentation and was not attempted.

## Exact changes

- `src/lib/homepage-backgrounds.ts`: swapped only the existing first and third replacement URLs. Order is now brand / collection / hero. Original files, section order, text, inline centre positioning and theme CSS are untouched.
- `src/components/HomepageFooterScroll.tsx`: consumes the first downward boundary wheel gesture instead of calling `scrollBy`; also prevents the first boundary key's default scroll. The mode switch preserves the complete third section at the viewport origin. Subsequent wheel/keyboard input scrolls naturally into the footer. Existing restore logic and 06A transform clearing/control positioning remain intact.
- `tests/homepage-backgrounds.test.mjs`: updated expected mappings and asserted the unchanged assets' actual canvas dimensions independently of the original section images. The swapped assets have different intrinsic canvas sizes; none were edited.
- This report.

No theme CSS/scripts, captured `src/data/site.ts`, footer content/design, WhatsApp code, other routes, dependencies or image files were modified. No fullscreen library was added and no homepage rewrite was required.

## Functional browser verification

Used installed Playwright with downloaded Chromium, DOM measurements and real browser wheel, keyboard, mouse/touch activation, and CDP touch swipes. No screenshots or screenshot comparisons. Browser runner: `/tmp/06b.cjs`; measurements: `/tmp/06b-results.jsonl`. External requests were blocked. Development verification passed, followed by production-build verification.

| Viewport / emulation | Each section width × height throughout | Natural footer height |
| --- | --- | --- |
| Desktop 1440×900 | 1440×900 | 260.140625px |
| iPad landscape 1024×768 | 1024×838 | 245.390625px |
| iPad portrait 768×1024 | 768×1094 | 413.5625px |
| iPhone portrait 390×844 | 390×914 | 515.609375px |

The touch cases retain the original mobile theme's native sizing (viewport plus 70px), including its automatic height/min-height behaviour. No height override was introduced. For every case the runner asserts constant section widths/heights, `cover`, `50% 50%`, exact image URLs, constant footer height and contiguous third-section/footer edges before, during and after scrolling. Footer heights and background colour match `/about-us` at each viewport. Both original footer colours compute to `rgb(37,37,37)` / `rgb(31,31,31)`.

Desktop entry was sampled immediately and after 30, 150 and 700ms: section 3 top remains 0, height 900, scrollY 1800. The next 100px wheel moves its top to −100, height still 900. Further scrolling reaches the footer bottom. Keyboard PageDown likewise consumes the boundary key and scrolls on the next key. Reverse wheel input stops at section 3; another upward gesture restores original fullscreen navigation to section 2. After scroll-to-top, original wheel navigation advances sections again.

Touch swipes reach the complete natural footer on landscape/portrait tablet and portrait mobile. Displayed scroll-to-top controls are hit-tested at their centres and activated with real mouse/touch input; they return scrollY to zero without opening the WhatsApp dialog. The original responsive rule still hides that control on portrait tablet/mobile. WhatsApp remains available and opens its local preview; Escape closes it. No browser JavaScript errors occurred.

## Validation

- `node --experimental-strip-types tests/content-adapter.test.mjs`: 9 passed.
- `node --experimental-strip-types tests/homepage-backgrounds.test.mjs`: 4 passed.
- `node --experimental-strip-types tests/homepage-footer.test.mjs`: 4 passed.
- `node --experimental-strip-types --test tests/*.test.mjs`: all 3 test files passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; generated 146 entries, including all captured routes.
- `git diff --check`: passed.
- `node /tmp/06b.cjs > /tmp/06b-results.jsonl`: browser assertions passed across four viewports.

Existing Node module-type warnings and Next standalone-start advisory were observed; neither prevented checks or serving the production build. Browser execution required sandbox escalation because Chromium's crashpad socket was denied in the sandbox. Initial browser download to the default cache failed because that directory was unavailable; binaries were downloaded under `/tmp` instead. No repository dependency changes.

## Limitations

Chromium emulation only; physical devices, Safari, Firefox and assistive technology were not tested. The first boundary input now establishes native mode without advancing into the footer; subsequent input reveals it. Trackpad momentum can send further wheel events, which then scroll normally. Touch/native scrolling is unchanged. This corrects the measured abrupt boundary advance; it does not claim the baseline element was physically compressed.

No commit or push performed. Work stopped after implementation and reporting.
