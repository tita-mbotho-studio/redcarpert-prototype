import { catalogueCategories, type CatalogueProduct } from '../data/catalogue.ts';
import clientMermaidDresses from '../data/client-mermaid-dresses.json' with { type: 'json' };
import clientBallGowns from '../data/client-ball-gowns.json' with { type: 'json' };
import clientRuffledDresses from '../data/client-ruffled-dresses.json' with { type: 'json' };
import clientTwoInOneDresses from '../data/client-two-in-one-dresses.json' with { type: 'json' };

/** Client asset manifests are the source of truth for dress identities and photos. */
const clientGroups = [
  {category:'mermaid',folder:'mermaid-dresses',dresses:clientMermaidDresses},
  {category:'ball_gown',folder:'ball-gown-dresses',dresses:clientBallGowns},
  {category:'ruffled',folder:'ruffled-dresses',dresses:clientRuffledDresses},
  {category:'two_in_one',folder:'2-in-1-dresses',dresses:clientTwoInOneDresses},
] as const;
const clientSource = new Map(clientGroups.flatMap(group =>
  group.dresses.map(dress => [dress.id,{...group,dress}] as const)));
const expectedCounts: Record<string,number> = {
  ...Object.fromEntries(clientGroups.map(group=>[group.category,group.dresses.length])),
  modern_tradition:4, // The remaining four historic image entries.
};

/** Reject mismatched identities/URLs instead of silently putting a wrong gown in a collection. */
export function validateCatalogue(products: readonly CatalogueProduct[]): void {
  const expectedTotal = Object.values(expectedCounts).reduce((n,count)=>n+count,0);
  if (products.length !== expectedTotal) throw new Error('Catalogue must contain '+expectedTotal+' dresses matching the approved client manifests');
  const ids = new Set<string>(), routes = new Set<string>(), photos = new Set<string>();
  const counts = Object.fromEntries(catalogueCategories.map(c=>[c.id,0])) as Record<string,number>;
  for (const product of products) {
    if (!/^[a-z0-9-]+$/.test(product.id) || ids.has(product.id))
      throw new Error('Duplicate or invalid product ID: '+product.id);
    ids.add(product.id);
    if (!catalogueCategories.some(c=>c.id===product.category))
      throw new Error('Unapproved category for '+product.id);
    counts[product.category]+=1;
    if (!Number.isSafeInteger(product.priceZar) || product.priceZar<=0)
      throw new Error('Invalid catalogue price for '+product.id);
    if (product.detailReference !== null || !['sample','client'].includes(product.status))
      throw new Error('Unverified catalogue status for '+product.id);
    if (!/^\/product\/preview\/[a-z0-9-]+$/.test(product.previewRoute) || routes.has(product.previewRoute))
      throw new Error('Duplicate or invalid preview route: '+product.previewRoute);
    routes.add(product.previewRoute);
    if (photos.has(product.image)) throw new Error('Duplicate primary photograph for '+product.id);
    photos.add(product.image);

    if (product.status==='client') {
      const expected=clientSource.get(product.id);
      if (!expected || product.category!==expected.category ||
          product.name!==expected.dress.name ||
          product.previewRoute!=='/product/preview/'+product.id)
        throw new Error('Incorrect client dress mapping: '+product.id);
      const first=expected.dress.photos[0];
      const prefix='https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-dresses/'+
        expected.folder+'/';
      const source=product.image.toLowerCase();
      if (product.image!==first.url || product.imageAlt!==first.alt ||
          !source.startsWith(prefix.toLowerCase()) ||
          !/[-]01[.]webp(?:[?]updatedat=\d{13})?$/.test(source) ||
          product.imageCredit.sourceUrl!==product.image ||
          product.imageCredit.photographer!=='Client supplied' ||
          product.imageCredit.provenance!=='client-supplied') {
        throw new Error('Invalid client photo metadata for '+product.id);
      }
    } else {
      // All remaining demo material belongs to Modern Tradition until those client photos arrive.
      if (product.category!=='modern_tradition')
        throw new Error('Unexpected sample image in client-replaced collection: '+product.id);
      const image=/^https:\/\/images[.]pexels[.]com\/photos\/([1-9]\d+)\/pexels-photo-\1[.]jpeg[?]auto=compress&cs=tinysrgb&w=1200$/.exec(product.image);
      if (!image) throw new Error('Unapproved Pexels image: '+product.id);
      if (!product.imageCredit ||
          !new RegExp('^https://www\\.pexels\\.com/photo/[a-z0-9-]+-'+image[1]+'/$').test(product.imageCredit.sourceUrl) ||
          !product.imageCredit.photographer.trim() ||
          product.imageCredit.provenance!=='docs/asset-credits.md')
        throw new Error('Missing image provenance: '+product.id);
      if (!/^Sample (1[3-6])$/.test(product.name) ||
          !product.imageAlt.includes('wedding dress photograph'))
        throw new Error('Missing descriptive bridal photograph alt text: '+product.id);
    }
  }
  for(const category of catalogueCategories) {
    if (counts[category.id]!==expectedCounts[category.id])
      throw new Error('Unexpected dress count in '+category.id);
  }
}
