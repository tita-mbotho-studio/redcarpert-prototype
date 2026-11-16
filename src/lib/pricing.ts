import products from "../data/products.json" with { type: "json" };

/** ZAR prices: client gowns remain null until confirmed; sample prices are indicative. */
export type PriceZar = number | null;
export interface PriceRangeZar { readonly minZar: number; readonly maxZar: number; }
export const PRICE_CONDITION_DISCLAIMER = "Prices vary depending on whether the dress is new or pre-owned.";
const priceEntries = products.dresses;
if (products.currency !== "ZAR" || products.priceStatus !== "mixed" || priceEntries.length !== 27) {
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

/** Prefer confirmed per-dress ranges; retain current illustrative prices until approved bounds arrive. */
export function displayPriceForDress(id: string): string {
  const price = priceForDress(id);
  return displayDressPrice(priceRangesZar[id] ?? price);
}
