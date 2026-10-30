import type { CatalogueProduct } from '../data/catalogue';

/** Fail before writing build outputs if prototype products are inconsistent. */
export function validateCatalogue(products: readonly CatalogueProduct[]): void {
  if (!products.length) throw new Error('Catalogue cannot be empty');
  const ids = new Set<string>();
  const routes = new Set<string>();
  for (const product of products) {
    if (!/^[a-z0-9-]+$/.test(product.id) || ids.has(product.id)) {
      throw new Error(`Duplicate or invalid product ID: ${product.id}`);
    }
    ids.add(product.id);
    if (product.category !== 'mermaid' && product.category !== 'ball_gown') {
      throw new Error(`Unapproved category for product ${product.id}`);
    }
    if (product.status !== 'sample' || product.detailReference !== null) {
      throw new Error(`Unverified inventory cannot be published: ${product.id}`);
    }
    if (!/^\/redcarpert\/[a-z0-9/_-]+\.webp$/.test(product.image)) {
      throw new Error(`Product image must be a local WebP: ${product.id}`);
    }
    if (!/^\/product\/preview\/[a-z0-9-]+$/.test(product.previewRoute) || routes.has(product.previewRoute)) {
      throw new Error(`Duplicate or invalid preview route: ${product.previewRoute}`);
    }
    routes.add(product.previewRoute);
    if (!product.name.trim() || !product.imageAlt.trim()) {
      throw new Error(`Missing product content: ${product.id}`);
    }
  }
}
