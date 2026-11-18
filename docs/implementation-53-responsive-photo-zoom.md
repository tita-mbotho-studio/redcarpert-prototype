# Implementation 53 — Original 3D Lookbook on every screen, with photo zoom

## Reference and root cause

The live website at https://tita-mbotho-studio.github.io/redcarpert-prototype/digital-lookbook/
still uses an older 29-page editorial book. It is the visual and interaction
reference only; it must not replace the newer 37-page catalogue, its media,
sale/rental prices, lookbook links or wording.

Before Implementation 51, StPageFlip supplied the 3D animation and native
swipes. Browser touch taps and native paper clicks proved unreliable across
responsive viewports. We now keep the original 3D engine for all sizes, while
routing simple stationary paper taps through a single turn() controller.
Implementation 53 temporarily used a flat reader on phones; this was rejected.

## Final interaction design

- All viewports use the same real 3D PageFlip reader. Portrait/single-leaf
  layout remains on phones; paired spreads appear on larger desktop screens.
- Swipes, drags and desktop mouse clicks stay with PageFlip's original 3D
  animation and native click-to-turn. The no-CDN fallback retains delegated
  paper clicks. A dedicated stationary touchend handler turns paper only on
  phones/tablets where PageFlip's click recognition is unreliable.
- Tapping painted photograph pixels opens the zoom modal without turning;
  touching the letterbox margins counts as paper. Real links stay clickable.
- The desktop and mobile handlers are mutually exclusive, so a single gesture
  cannot queue a vendor turn and a custom turn simultaneously.
- object-fit side/vertical letterboxing is paper, not part of the photograph.
- Dress links remain functional through clickEventForward=true.
- Existing Previous/Next controls, keyboard arrow keys and post-swipe
  touchend handling remain in one navigation controller.
- Preserve zoom modal, plus/minus/reset, pinch, wheel, focus handling and
  dark round X without a brown outline.
- Accessible single-page fallback remains only for PageFlip CDN failure or
  reduced-motion preferences.
- No changes to the 35 dresses, 37 book leaves, 47-page PDF, pricing,
  WhatsApp formatting or ImageKit links.

## Validation

npm run test:responsive-zoom now builds and serves the website independently,
then tests both the fallback and the real CDN-backed PageFlip at 1440px,
1024px, 768px, 390px and 320px. PageFlip checks include a native paper tap,
photo zoom without a turn, modal close, and Previous/Next.

npm run test:browser additionally covers a full desktop book walk-through
and resizing 1440 -> 390 -> 1440 without switching away from PageFlip.

A temporary branch-only GitHub Actions workflow now runs npm run check,
real 3D and fallback Playwright regressions at all five widths, and the full
browser suite. It contains no deployment code. Remove this temporary workflow
after verification passes; do not merge or deploy without approval.
