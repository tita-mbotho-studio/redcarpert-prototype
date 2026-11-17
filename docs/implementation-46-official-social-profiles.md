# Implementation 46 — Official Redcarpert social profiles

## Requested social icons

| Platform | Client-supplied handle | Profile destination |
| --- | --- | --- |
| Instagram | @Redcarpert_wedding_dresses | https://www.instagram.com/Redcarpert_wedding_dresses/ |
| TikTok 1 | @Redcarpertweddingdresses | https://www.tiktok.com/@Redcarpertweddingdresses |
| TikTok 2 | @redcarpertweddinggowns | https://www.tiktok.com/@redcarpertweddinggowns |
| Facebook | @redcarpertcouture_bridal | https://www.facebook.com/redcarpertcouture_bridal/ |
| WhatsApp | Existing approved client number | Existing direct WhatsApp handoff |

**Only these five icons are displayed.** YouTube, Twitter/X and Pinterest are absent from the generated footer. Two TikTok icons are intentional because there are two distinct accounts. Each has its own accessible label and mouse-hover title.

## Implementation

- Source of truth: `src/config/social-links.ts`.
- `src/lib/modern-icons.ts` validates legacy captured footer markup but publishes only the approved new social anchors and existing WhatsApp action. Other legacy social placeholders never appear in the generated website.
- Font Awesome Free brand icons: `fa-instagram`, `fa-tiktok` (two links), `fa-facebook-f`, `fa-whatsapp`.
- The social links open in a new tab with `rel="noopener noreferrer"`. The WhatsApp button keeps its existing direct-enquiry routing and formatting.
- `src/components/ModernIcons.css` retains the previous responsive icon row dimensions, hover colours and keyboard focus styling.
- Legacy capture validation (`footer-social-adapter.ts`, `homepage-footer.ts`, `footer-branding-adapter.ts`) remains intentionally unchanged; these are structural safety checks, not the icons published in the final HTML.

## Verification

- Unit tests: `tests/social-links.test.mjs`, `tests/modern-icons.test.mjs`.
- Generated output checks: `tests/static-build.test.mjs` ensures every published page includes only the four allowed profile links with exact destinations and one existing WhatsApp action.
- Desktop/mobile browser checks: `scripts/browser-modern-icons.mjs` validates labels, URLs, icons and footer containment from 320 to 1440 pixels.

Run `npm run check`. For browser verification, run `npm run build && npm run preview`, then in a second shell run `npm run test:browser`.

**Profile ownership and actual public reachability were not independently verified** because the social platforms restrict automated access. The URLs follow the platform profile patterns and preserve the exact handles provided by the client. Confirm they open the intended accounts during manual review.

Do not merge or deploy without explicit instruction.
