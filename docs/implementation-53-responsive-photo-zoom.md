# Implementation 53 — Original 3D Lookbook on every screen, with photo zoom

## Reference and root cause

The live website at https://tita-mbotho-studio.github.io/redcarpert-prototype/digital-lookbook/
still uses an older 29-page editorial book. It is the visual and interaction
reference only; it must not replace the newer 37-page catalogue, its media,
sale/rental prices, lookbook links or wording.

Before Implementation 51, StPageFlip was initialized with usePortrait=true,
clickEventForward=true, mobileScrollSupport=false and without
disableFlipByClick=true. Its native interaction supported animated clicks,
mobile touch and swipe/drag page turns. Implementation 51 disabled this native
click-to-turn path to add zoom and replaced paper clicks with custom handlers.
Implementation 53 temporarily used a flat reader on phones; this was rejected.

## Final interaction design

- All viewports use the same real 3D PageFlip reader. Portrait/single-leaf
  layout remains on phones; paired spreads appear on larger desktop screens.
- Native blank-paper clicks, taps, page drags and swipes remain enabled.
  disableFlipByClick is explicitly false; no custom click handler runs when
  PageFlip is active.
- A short tap on the painted photograph pixels opens the zoom dialog instead
  of turning the page. A minimal pointerup guard stops PageFlip's pending
  userStop/flip for only that photo tap, allowing the forwarded native button
  click to open zoom; swipe and paper taps are left to PageFlip.
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

The full npm run check and Playwright browser suites still require execution
against a locally built checkout before merging. No Actions/deploy triggered.
