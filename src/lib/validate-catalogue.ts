import { catalogueCategories, type CatalogueProduct } from '../data/catalogue.ts';

/** Fail closed before output generation: twenty credited Pexels styling samples. */
export function validateCatalogue(products: readonly CatalogueProduct[]): void {
  if (products.length !== 20) throw new Error('Catalogue must contain twenty approved samples');
  const ids = new Set<string>(), routes = new Set<string>(), images = new Set<string>();
  const counts = Object.fromEntries(catalogueCategories.map(c => [c.id, 0])) as Record<string, number>;
  for (const product of products) {
    if (!/^[a-z0-9-]+$/.test(product.id) || ids.has(product.id)) throw new Error(`Duplicate or invalid product ID: ${product.id}`);
    ids.add(product.id);
    if (!catalogueCategories.some(c => c.id === product.category)) throw new Error(`Unapproved category for ${product.id}`);
    counts[product.category] += 1;
    if (product.priceZar !== null &&
      (!Number.isSafeInteger(product.priceZar) || product.priceZar <= 0)) {
      throw new Error('Invalid catalogue price for ' + product.id);
    }
    if (product.status !== 'sample' || product.detailReference !== null) throw new Error(`Unverified inventory: ${product.id}`);
    const image = /^https:\/\/images\.pexels\.com\/photos\/([1-9]\d+)\/pexels-photo-\1\.jpeg\?auto=compress&cs=tinysrgb&w=1200$/.exec(product.image);
    if (!image || images.has(image[1])) throw new Error(`Unapproved or duplicate Pexels image: ${product.id}`);
    images.add(image[1]);
    if (!product.imageCredit || !new RegExp('^https://www\\.pexels\\.com/photo/[a-z0-9-]+-' + image[1] + '/$').test(product.imageCredit.sourceUrl)
      || !product.imageCredit.photographer.trim() || product.imageCredit.provenance !== 'docs/asset-credits.md') throw new Error(`Missing image provenance: ${product.id}`);
    if (!/^\/product\/preview\/[a-z0-9-]+$/.test(product.previewRoute) || routes.has(product.previewRoute)) throw new Error(`Duplicate or invalid preview route: ${product.previewRoute}`);
    routes.add(product.previewRoute);
    if (!/^Sample (0[1-9]|1\d|20)$/.test(product.name) || !product.imageAlt.includes('not Redcarpert inventory')) throw new Error(`Missing sample disclosure: ${product.id}`);
  }
  if (catalogueCategories.some(category => counts[category.id] !== 4)) throw new Error('Catalogue must have four samples per category');
}
