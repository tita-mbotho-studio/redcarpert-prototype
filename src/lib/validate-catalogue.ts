import { catalogueCategories, collectionsForDress, modernTraditionColourByDress, type CatalogueProduct } from '../data/catalogue.ts';
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
  modern_tradition:0, // Colour-based collection: cross-list client dresses only.
};

/** Reject mismatched identities/URLs instead of silently putting a wrong gown in a collection. */
export function validateCatalogue(products: readonly CatalogueProduct[]): void {
  const expectedTotal = Object.values(expectedCounts).reduce((n,count)=>n+count,0);
  if (products.length !== expectedTotal) throw new Error('Catalogue must contain '+expectedTotal+' dresses matching the approved client manifests');
  const ids = new Set<string>(), routes = new Set<string>(), photos = new Set<string>();
  for (const [id, colour] of modernTraditionColourByDress) {
    if (!clientSource.has(id) || !colour.trim() ||
        !['mermaid','ball_gown','ruffled','two_in_one'].includes(clientSource.get(id)!.category)) {
      throw new Error('Modern Tradition features require a real client dress and verified fabric colour: '+id);
    }
  }
  const counts = Object.fromEntries(catalogueCategories.map(c=>[c.id,0])) as Record<string,number>;
  for (const product of products) {
    if (!/^[a-z0-9-]+$/.test(product.id) || ids.has(product.id))
      throw new Error('Duplicate or invalid product ID: '+product.id);
    ids.add(product.id);
    if (!catalogueCategories.some(c=>c.id===product.category))
      throw new Error('Unapproved category for '+product.id);
    counts[product.category]+=1;
    const expectedCollections=collectionsForDress(product.id,product.category);
    if (!Array.isArray(product.collections) ||
        JSON.stringify(product.collections)!==JSON.stringify(expectedCollections) ||
        new Set(product.collections).size !== product.collections.length) {
      throw new Error('Invalid multi-collection membership for '+product.id);
    }
    if (!Number.isSafeInteger(product.priceZar) || product.priceZar<=0)
      throw new Error('Invalid catalogue price for '+product.id);
    if (product.detailReference !== null)
      throw new Error('Unverified catalogue status for '+product.id);
    if (!/^\/product\/preview\/[a-z0-9-]+$/.test(product.previewRoute) || routes.has(product.previewRoute))
      throw new Error('Duplicate or invalid preview route: '+product.previewRoute);
    routes.add(product.previewRoute);
    if (photos.has(product.image)) throw new Error('Duplicate primary photograph for '+product.id);
    photos.add(product.image);

    {
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
    }

  }
  for(const category of catalogueCategories) {
    if (counts[category.id]!==expectedCounts[category.id])
      throw new Error('Unexpected dress count in '+category.id);
  }
}
