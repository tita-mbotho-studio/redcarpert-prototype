import { catalogueCategories, type CatalogueProduct, type DressCategory } from "../data/catalogue.ts";
import { modernTraditionPages } from "./modern-tradition.ts";

/** A book spread is a view of a canonical dress; it is never a second product. */
export interface LookbookPlacement {
  readonly id: string;
  readonly category: DressCategory;
  readonly product: CatalogueProduct;
  readonly displayName: string;
  readonly detailRoute: string;
  readonly isModernTradition: boolean;
}

/**
 * Both formats display the same five collections in catalogue order.
 * Four approved cross-listed looks receive their own Modern Tradition spreads
 * using the original image and price, but a contextual title and detail link.
 */
export function lookbookPlacements(products: readonly CatalogueProduct[]): readonly LookbookPlacement[] {
  const byId = new Map(products.map(product => [product.id, product] as const));
  if (byId.size !== products.length) throw new Error("Book input contains duplicate canonical dresses");
  const placements = catalogueCategories.flatMap(category => {
    if (category.id === "modern_tradition") {
      return modernTraditionPages.map(page => {
        const product = byId.get(page.product.id);
        if (!product || !product.collections.includes("modern_tradition") ||
            product.category !== page.product.category) {
          throw new Error("Modern Tradition book placement has no matching client dress: " + page.product.id);
        }
        return {
          id: "modern-tradition-" + page.number,
          category: "modern_tradition" as const,
          product,
          displayName: page.name,
          detailRoute: page.route,
          isModernTradition: true,
        };
      });
    }
    return products.filter(product => product.category === category.id).map(product => ({
      id: product.id,
      category: category.id,
      product,
      displayName: product.name,
      detailRoute: product.previewRoute,
      isModernTradition: false,
    }));
  });
  if (placements.length !== products.length + modernTraditionPages.length ||
      new Set(placements.map(placement => placement.id)).size !== placements.length) {
    throw new Error("Book must display each client dress once plus four Modern Tradition collection spreads");
  }
  return placements;
}
