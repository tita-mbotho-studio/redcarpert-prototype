import { catalogueCategories, type CatalogueProduct } from "../data/catalogue.ts";
import { REPOSITORY_BASE } from "../config/site.ts";
import { displayPriceForDress } from "./pricing.ts";

/**
 * One WhatsApp message policy for all page actions.
 * Keep line breaks and WhatsApp bold labels intact; buildWhatsAppUrl handles
 * URL encoding. Never imply that a listed dress is confirmed available.
 */
export function generalFittingMessage(): string {
  return [
    "Hello Redcarpert Wedding Dresses,",
    "",
    "I would like to enquire about your wedding dress collections and book a fitting.",
    "",
    "Could you please share your available appointment dates and explain how the fitting process works?",
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

/** Same enquiry for every dress, whether the source images are current or temporary. */
export function dressFittingMessage(product: CatalogueProduct): string {
  const category = catalogueCategories.find(item => item.id === product.category);
  if (!category) throw new Error("Unknown dress category for WhatsApp enquiry: " + product.id);
  const dressName = product.status === "client"
    ? product.name
    : product.name.replace(/^Sample /, "Look ");

  return [
    "Hello Redcarpert Wedding Dresses,",
    "",
    "I would like to enquire about a wedding dress style featured on your website.",
    "",
    `*Dress:* ${dressName}`,
    `*Collection:* ${category.name}`,
    `*Indicative price range:* ${displayPriceForDress(product.id, product.priceZar)}`,
    `*Dress link:* ${dressPageUrl(product)}`,
    "",
    "Could you please confirm whether this dress or a similar style is available, the final price, available sizes, and fitting appointment dates? Please also let me know whether the dress is new or pre-owned.",
    "",
    "Thank you.",
  ].join("\n");
}
