import products from "../data/products.json" with { type: "json" };

/** ZAR fallback prices plus explicitly illustrative ranges, pending client confirmation. */
export type PriceZar = number | null;
export interface PriceRangeZar { readonly minZar: number; readonly maxZar: number; }
export const PRICE_CONDITION_DISCLAIMER = "Prices vary depending on whether the dress is new or pre-owned.";
/** Detail-page policy: no presented amount is a verified sale or rental quote. */
export const SALE_RENTAL_DISCLAIMER = "Displayed sale prices are examples only, not confirmed quotes. Rental prices, final sale prices and availability must be confirmed with Redcarpert. Prices may vary depending on whether a dress is new or pre-owned.";
export const PRICE_PENDING_LABEL = "To be confirmed";
const priceEntries = products.dresses;
if (products.currency !== "ZAR" || products.priceStatus !== "mixed" || products.priceRangeStatus !== "illustrative" || priceEntries.length !== 27) {
  throw new Error("products.json: expected twenty-seven dress price slots in ZAR");
}
const priceRangesZar: Record<string, PriceRangeZar> = products.priceRangesZar;
const ids = new Set<string>();
for (const entry of priceEntries) {
  if (!/^[a-z0-9-]+$/.test(entry.id) || ids.has(entry.id)) {
    throw new Error("products.json: duplicate or invalid dress ID");
  }
  ids.add(entry.id);
  if (entry.priceZar !== null && (!Number.isSafeInteger(entry.priceZar) || entry.priceZar <= 0)) {
    throw new Error("products.json: prices must be positive integer rand amounts or null");
  }
  if (!Object.prototype.hasOwnProperty.call(entry, "rentalPriceRangeZar")) {
    throw new Error("products.json: missing rental price range slot for " + entry.id);
  }
  const rental = entry.rentalPriceRangeZar as PriceRangeZar | null;
  if (rental !== null && (
    typeof rental !== "object" ||
    !Number.isSafeInteger(rental.minZar) || !Number.isSafeInteger(rental.maxZar) ||
    rental.minZar <= 0 || rental.maxZar <= rental.minZar
  )) {
    throw new Error("products.json: rental price must be null or a valid increasing ZAR range");
  }
}

if (Object.keys(priceRangesZar).length !== ids.size) {
  throw new Error("products.json: every dress requires an indicative price range");
}
for (const [id, range] of Object.entries(priceRangesZar)) {
  if (!ids.has(id) || !range || !Number.isSafeInteger(range.minZar) || !Number.isSafeInteger(range.maxZar)
    || range.minZar <= 0 || range.maxZar <= range.minZar) {
    throw new Error("products.json: ranges require known dress IDs and increasing positive rand bounds");
  }
}

export function priceForDress(id: string): PriceZar {
  const record = priceEntries.find(entry => entry.id === id);
  if (!record) throw new Error("products.json: missing price for " + id);
  return record.priceZar;
}

export function displayDressPrice(priceZar: PriceZar | PriceRangeZar): string {
  if (priceZar === null) return "Price to be confirmed";
  if (typeof priceZar === "object") {
    if (!Number.isSafeInteger(priceZar.minZar) || !Number.isSafeInteger(priceZar.maxZar)
      || priceZar.minZar <= 0 || priceZar.maxZar <= priceZar.minZar) {
      throw new Error("Invalid wedding dress price range");
    }
    const format = (n: number) => "R " + new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(n);
    return format(priceZar.minZar) + " – " + format(priceZar.maxZar);
  }
  if (!Number.isSafeInteger(priceZar) || priceZar <= 0) {
    throw new Error("Invalid wedding dress price");
  }
  return "R " + new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(priceZar);
}

/** Every catalogue display uses indicative ranges until the client supplies final values. */
export function displayPriceForDress(id: string, fallbackPrice?: PriceZar): string {
  const storedPrice = priceForDress(id);
  return displayDressPrice(priceRangesZar[id] ?? (fallbackPrice === undefined ? storedPrice : fallbackPrice));
}

/**
 * Fixed values in the existing priceZar field are EXAMPLES, not sale quotes.
 * The older priceRangesZar field remains reserved for the existing lookbook:
 * it is NOT a rental price range.
 */
export function salePriceForDress(id: string): PriceZar {
  return priceForDress(id);
}

export function rentalPriceRangeForDress(id: string): PriceRangeZar | null {
  const record = priceEntries.find(entry => entry.id === id);
  if (!record) throw new Error("products.json: missing rental price for " + id);
  return record.rentalPriceRangeZar as PriceRangeZar | null;
}

export function displaySalePriceForDress(id: string): string {
  const price = salePriceForDress(id);
  return price === null ? PRICE_PENDING_LABEL : displayDressPrice(price);
}

export function displayRentalPriceForDress(id: string): string {
  const rental = rentalPriceRangeForDress(id);
  return rental === null ? PRICE_PENDING_LABEL : displayDressPrice(rental);
}

