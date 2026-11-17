import products from "../data/products.json" with { type: "json" };

/** Currency-safe formatting for the editable dress pricing schedule. */
export type PriceZar = number;
export interface PriceRangeZar { readonly minZar: number; readonly maxZar: number; }
/** A condition-based rental qualification, not a provisional-price disclaimer. */
export const RENTAL_CONDITION_NOTE = "Rental prices may vary depending on whether the dress is new or pre-owned.";
/** Legacy price provenance remains internal; never expose a pricing notice in the UI. */
const priceEntries = products.dresses;
if (products.currency !== "ZAR" || products.priceStatus !== "draft" || products.priceRangeStatus !== "illustrative" || priceEntries.length !== 27) {
  throw new Error("products.json: expected twenty-seven dress price slots in ZAR");
}
const priceRangesZar: Record<string, PriceRangeZar> = products.priceRangesZar;
const ids = new Set<string>();
for (const entry of priceEntries) {
  if (!/^[a-z0-9-]+$/.test(entry.id) || ids.has(entry.id)) {
    throw new Error("products.json: duplicate or invalid dress ID");
  }
  ids.add(entry.id);
  if (!Number.isSafeInteger(entry.priceZar) || entry.priceZar <= 0) {
    throw new Error("products.json: every dress must have a positive sale price");
  }
  if (!Object.prototype.hasOwnProperty.call(entry, "rentalPriceRangeZar")) {
    throw new Error("products.json: missing rental price range slot for " + entry.id);
  }
  const rental = entry.rentalPriceRangeZar as PriceRangeZar | null;
  if (rental === null || (
    typeof rental !== "object" ||
    !Number.isSafeInteger(rental.minZar) || !Number.isSafeInteger(rental.maxZar) ||
    rental.minZar <= 0 || rental.maxZar <= rental.minZar
  )) {
    throw new Error("products.json: every dress must have a valid increasing rental range");
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

/** Retained only for historic illustrative-range fixtures; not a customer-facing price. */
export function displayPriceForDress(id: string, fallbackPrice?: PriceZar): string {
  const storedPrice = priceForDress(id);
  return displayDressPrice(priceRangesZar[id] ?? (fallbackPrice === undefined ? storedPrice : fallbackPrice));
}

/**
 * Sale and rental values are maintained centrally in products.json. The
 * legacy illustrative priceRangesZar map is not customer-facing.
 */
export function salePriceForDress(id: string): PriceZar {
  return priceForDress(id);
}

export function rentalPriceRangeForDress(id: string): PriceRangeZar {
  const record = priceEntries.find(entry => entry.id === id);
  if (!record) throw new Error("products.json: missing rental price for " + id);
  return record.rentalPriceRangeZar as PriceRangeZar;
}

export function displaySalePriceForDress(id: string): string {
  const price = salePriceForDress(id);
  return displayDressPrice(price);
}

/** Labels are shared by the dress page, interactive book and PDF. */
export function salePriceLabelForDress(id: string): string {
  salePriceForDress(id);
  return "Sale Price";
}

export function displayRentalPriceForDress(id: string): string {
  const rental = rentalPriceRangeForDress(id);
  return displayDressPrice(rental);
}

