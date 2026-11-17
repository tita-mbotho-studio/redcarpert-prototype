import { catalogueCategories, type CatalogueProduct } from "../data/catalogue.ts";
import { REPOSITORY_BASE } from "../config/site.ts";
import { displayRentalPriceForDress, displaySalePriceForDress, RENTAL_CONDITION_NOTE } from "./pricing.ts";

/**
 * One WhatsApp message policy for all page actions.
 * Keep line breaks and WhatsApp bold labels intact; buildWhatsAppUrl handles
 * URL encoding. Booking and pricing details are confirmed in the chat.
 */
export function generalFittingMessage(): string {
  return [
    "Hello Redcarpert Wedding Dresses,",
    "",
    "I would like to book a wedding dress fitting.",
    "",
    "Please share available fitting dates and times, and any information I need before my appointment.",
    "",
    "Thank you.",
  ].join("\n");
}

const PUBLIC_SITE_ORIGIN = "https://tita-mbotho-studio.github.io";

/** Public link for a dress; use the central repository base so paths stay correct. */
export function dressPageUrl(product: CatalogueProduct): string {
  const path = product.previewRoute.replace(/^\/+/, "").replace(/\/?$/, "/");
  return new URL(REPOSITORY_BASE + path, PUBLIC_SITE_ORIGIN).toString();
}

/** All dress-detail fitting actions share this clear, fully formatted template. */
export function dressFittingMessage(product: CatalogueProduct): string {
  const category = catalogueCategories.find(item => item.id === product.category);
  if (!category) throw new Error("Unknown dress category for WhatsApp enquiry: " + product.id);
  const dressName = product.status === "client"
    ? product.name
    : product.name.replace(/^Sample /, "Look ");

  return [
    "Hello Redcarpert Wedding Dresses,",
    "",
    "I would like to enquire about the following wedding dress:",
    "",
    `*Dress:* ${dressName}`,
    `*Collection:* ${category.name}`,
    `*Sale Price:* ${displaySalePriceForDress(product.id)}`,
    `*Rental Price Range:* ${displayRentalPriceForDress(product.id)}`,
    `*Dress Link:* ${dressPageUrl(product)}`,
    "",
    RENTAL_CONDITION_NOTE,
    "",
    "Please share available sizes, fitting appointment dates and any details I should know before booking.",
    "",
    "Thank you.",
  ].join("\n");
}
