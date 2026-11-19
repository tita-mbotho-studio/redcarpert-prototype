import { catalogueProducts, type CatalogueProduct } from "../data/catalogue.ts";

/** A collection-specific view of an existing client dress; never a second product record. */
export interface ModernTraditionPage {
  readonly product: CatalogueProduct;
  readonly number: string;
  readonly name: string;
  readonly route: `/product/preview/modern-tradition-${string}`;
}

/** Stable, contiguous numbers for the approved Modern Tradition selection. */
export const modernTraditionPages: readonly ModernTraditionPage[] = catalogueProducts
  .filter(product => product.collections.includes("modern_tradition"))
  .map((product, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      product,
      number,
      name: `Modern Tradition ${number}`,
      route: `/product/preview/modern-tradition-${number}` as const,
    };
  });

if (modernTraditionPages.length !== 4 ||
    new Set(modernTraditionPages.map(page => page.product.id)).size !== 4 ||
    new Set(modernTraditionPages.map(page => page.route)).size !== 4) {
  throw new Error("Modern Tradition must have exactly four unique approved dresses");
}

export function modernTraditionPageForDress(id: string): ModernTraditionPage | undefined {
  return modernTraditionPages.find(page => page.product.id === id);
}

export function modernTraditionPageForRoute(route: string): ModernTraditionPage | undefined {
  return modernTraditionPages.find(page => page.route === route);
}
