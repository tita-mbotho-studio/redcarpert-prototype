# Implementation 45 — WhatsApp message formatting

## Agreed behaviour

Use **one standard dress enquiry** for every catalogue item (no separate inspiration-only message). Preserve the existing catalogue disclosures: a listed image does not establish that a gown is currently in stock.

Every dress message is generated from the current catalogue and pricing data, and includes:
- The dress or look name and collection
- The **indicative ZAR price range** already displayed on the dress detail page
- The direct dress-page reference, using the repository's GitHub Pages base path
- A request to confirm **availability, final price, available sizes, new/pre-owned status, and fitting dates**
- WhatsApp-native single-asterisk bold labels and consistent blank lines

Generic website enquiry actions use a second **general fitting** message, with correct grammar and spacing.

## Source of truth

- `src/lib/whatsapp-messages.ts`: `dressFittingMessage(product)`, `generalFittingMessage()` and `dressPageUrl(product)`
- `src/lib/pricing.ts`: `displayPriceForDress` — the same indicative range used by the dress detail and the online lookbook
- `scripts/generate.ts`: selects the dress message for dress pages, or the general message elsewhere
- `src/lib/product-detail-preview.ts`: compatibility wrapper `sampleFittingMessage`; there is no longer a branch for inspiration images
- `src/config/whatsapp.ts`: encodes the message and supplies the approved phone number

The client still chooses to **Send** in WhatsApp. No intermediate in-site WhatsApp preview or automated sending.

## Future dresses and prices

When a new dress is entered into the approved catalogue and receives an indicative range in the price data, its WhatsApp message automatically inherits the same formatting. The range **does not become a quoted or guaranteed price**. When the client confirms actual prices, update the pricing system and display rules explicitly; do not relabel an indicative amount as final.

The public dress links currently use the project's GitHub Pages origin (`https://tita-mbotho-studio.github.io`). Update the single origin in `src/lib/whatsapp-messages.ts` if the site switches to a custom domain.

## Validation

Run `npm run check` to lint, type-check, generate, build, and test messages and published WhatsApp URLs. Run the normal `npm run test:browser` after starting a production preview in a separate shell. Confirm a general CTA and at least one Ball Gown fitting CTA open WhatsApp with readable line breaks and correct ZAR ranges.
