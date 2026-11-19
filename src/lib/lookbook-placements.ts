import { catalogueCategories, type CatalogueProduct, type DressCategory } from "../data/catalogue.ts";

/** Each book spread is now one independent, uniquely identified catalogue dress. */
export interface LookbookPlacement {
  readonly id: string;
  readonly category: DressCategory;
  readonly product: CatalogueProduct;
  readonly displayName: string;
  readonly detailRoute: string;
  readonly isModernTradition: boolean;
}

/** Both editions display one page per unique client dress record, grouped into the same five collections. */
export function lookbookPlacements(products: readonly CatalogueProduct[]): readonly LookbookPlacement[] {
  const ids = new Set(products.map(product => product.id));
  if (ids.size !== products.length) throw new Error("Book contains duplicate dress IDs");
  const placements: readonly LookbookPlacement[] = catalogueCategories.flatMap(category =>
    products.filter(product => product.category === category.id).map(product => ({
      id: product.id,
      category: product.category,
      product,
      displayName: product.name,
      detailRoute: product.previewRoute,
      isModernTradition: product.category === "modern_tradition",
    })));
  if (placements.length !== products.length ||
      new Set(placements.map(placement => placement.id)).size !== placements.length) {
    throw new Error("Every unique catalogue dress must have exactly one book spread");
  }
  return placements;
}
