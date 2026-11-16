import { catalogueCategories, type CatalogueProduct } from '../data/catalogue.ts';

/** Validate mixed client photography and still-illustrative sample dresses before site generation. */
export function validateCatalogue(products: readonly CatalogueProduct[]): void {
  if (products.length !== 27) throw new Error('Catalogue must contain eleven client Ball Gowns and sixteen sample dresses');
  const ids = new Set<string>(), routes = new Set<string>(), photos = new Set<string>();
  const counts = Object.fromEntries(catalogueCategories.map(c => [c.id, 0])) as Record<string, number>;
  for (const product of products) {
    if (!/^[a-z0-9-]+$/.test(product.id) || ids.has(product.id)) throw new Error('Duplicate or invalid product ID: ' + product.id);
    ids.add(product.id);
    if (!catalogueCategories.some(c => c.id === product.category)) throw new Error('Unapproved category for ' + product.id);
    counts[product.category] += 1;
    if (product.priceZar !== null && (!Number.isSafeInteger(product.priceZar) || product.priceZar <= 0))
      throw new Error('Invalid catalogue price for ' + product.id);
    if (product.detailReference !== null || !['sample','client'].includes(product.status))
      throw new Error('Unverified catalogue status for ' + product.id);
    if (!/^\/product\/preview\/[a-z0-9-]+$/.test(product.previewRoute) || routes.has(product.previewRoute))
      throw new Error('Duplicate or invalid preview route: ' + product.previewRoute);
    routes.add(product.previewRoute);
    if (photos.has(product.image)) throw new Error('Duplicate primary photograph for ' + product.id);
    photos.add(product.image);
    if (product.status === 'client') {
      if (product.category !== 'ball_gown' || !/^ball-gown-(0[1-9]|1[01])$/.test(product.id) ||
        product.name !== 'Ball Gown ' + product.id.slice(-2) || product.priceZar !== null ||
        product.previewRoute !== '/product/preview/' + product.id)
        throw new Error('Incorrect client Ball Gown mapping: ' + product.id);
      const expected = 'https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-dresses/' +
        product.id + '/' + product.id + '-main.webp?updatedAt=';
      if (!product.image.startsWith(expected) || !/^\d{13}$/.test(product.image.slice(expected.length)) ||
        !product.imageAlt.includes(product.name) ||
        product.imageCredit.sourceUrl !== product.image ||
        product.imageCredit.photographer !== 'Client supplied' ||
        product.imageCredit.provenance !== 'client-supplied')
        throw new Error('Invalid client photo metadata for ' + product.id);
    } else {
      const image = /^https:\/\/images\.pexels\.com\/photos\/([1-9]\d+)\/pexels-photo-\1\.jpeg\?auto=compress&cs=tinysrgb&w=1200$/.exec(product.image);
      if (!image || product.category === 'ball_gown') throw new Error('Unapproved Pexels image: ' + product.id);
      if (!product.imageCredit || !new RegExp('^https://www\\.pexels\\.com/photo/[a-z0-9-]+-' + image[1] + '/$').test(product.imageCredit.sourceUrl) ||
        !product.imageCredit.photographer.trim() || product.imageCredit.provenance !== 'docs/asset-credits.md')
        throw new Error('Missing image provenance: ' + product.id);
      if (!/^Sample (0[1-9]|1\d|20)$/.test(product.name) || !product.imageAlt.includes('not confirmed Redcarpert stock'))
        throw new Error('Missing sample disclosure: ' + product.id);
    }
  }
  for(const c of catalogueCategories) {
    const count = c.id === 'ball_gown' ? 11 : 4;
    if(counts[c.id] !== count) throw new Error('Unexpected dress count in ' + c.id);
  }
}
