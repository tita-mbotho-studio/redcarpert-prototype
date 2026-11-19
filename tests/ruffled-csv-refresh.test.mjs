import test from 'node:test';
import assert from 'node:assert/strict';
import ruffled from '../src/data/client-ruffled-dresses.json' with {type:'json'};
import {catalogueProducts, catalogueCategories} from '../src/data/catalogue.ts';
import {photosForDress} from '../src/lib/dress-gallery.ts';
import {adaptCatalogue} from '../src/lib/catalogue-adapter.ts';
import {sitePages} from '../src/data/site.ts';
import {relatedDressesFor} from '../src/lib/product-detail-preview.ts';
import {modernTraditionPages} from '../src/lib/modern-tradition.ts';
import {lookbookPlacements} from '../src/lib/lookbook-placements.ts';
import {salePriceForDress,rentalPriceRangeForDress} from '../src/lib/pricing.ts';

const photoCounts=[6,7,3,4,3,2,2,4,11,2,6,1,2,3,3,4,2];
const root='https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-dresses/ruffled-dresses/';
const all=nodes=>nodes.flatMap(node=>typeof node==='string'?[]:[node,...all(node.children)]);

test('all 65 uploaded CSV URLs appear exactly once in seventeen numerically ordered Ruffled groups',()=>{
  assert.equal(ruffled.length,17);
  assert.deepEqual(ruffled.map(group=>group.photos.length),photoCounts);
  const unique=new Set();
  for(const [index,group] of ruffled.entries()){
    const number=String(index+1).padStart(2,'0');
    assert.equal(group.id,'ruffled-dress-'+number);
    assert.equal(group.name,'Ruffled Dress '+number);
    for(const [photoIndex,photo] of group.photos.entries()){
      const angle=String(photoIndex+1).padStart(2,'0');
      const expected=root+group.id+'-'+angle+'.webp';
      assert.equal(photo.url,expected);
      assert.equal(photo.alt,'Photo '+angle+' of '+group.name);
      assert(!unique.has(photo.url),'CSV image URL must be assigned to only one dress');
      unique.add(photo.url);
    }
    const product=catalogueProducts.find(p=>p.id===group.id);
    assert(product && product.category==='ruffled');
    assert.equal(product.image,group.photos[0].url);
    assert.deepEqual(photosForDress(product),group.photos);
  }
  assert.equal(unique.size,65);
});

test('new Ruffled dresses appear in the catalogue, book sections and related-dress recommendations',()=>{
  const ruffledProducts=catalogueProducts.filter(p=>p.category==='ruffled');
  assert.equal(ruffledProducts.length,17);
  assert.equal(catalogueProducts.length,56);
  const listing=adaptCatalogue(sitePages['/product-category/ruffled'],catalogueProducts);
  const cards=all(listing.nodes).filter(node=>node.attrs['data-catalogue-id']!==undefined);
  assert.deepEqual(cards.map(node=>node.attrs['data-catalogue-id']),ruffledProducts.map(p=>p.id));
  for(let i=13;i<=17;i++){
    const id='ruffled-dress-'+String(i).padStart(2,'0');
    const product=ruffledProducts.find(p=>p.id===id);
    assert(product);
    assert.equal(product.previewRoute,'/product/preview/'+id);
    assert.equal(product.collections.join(' '),'ruffled');
    assert(Number.isSafeInteger(salePriceForDress(id))&&salePriceForDress(id)>0);
    const rental=rentalPriceRangeForDress(id);
    assert(rental.maxZar>rental.minZar);
    assert(cards.some(card=>card.attrs['data-catalogue-id']===id));
    assert(relatedDressesFor(product).every(p=>p.category==='ruffled'&&p.id!==id));
  }
  const placements=lookbookPlacements(catalogueProducts);
  assert.deepEqual(placements.filter(p=>p.category==='ruffled').map(p=>p.id),
    ruffledProducts.map(p=>p.id));
  assert.equal(placements.length+2,58);
  assert.equal(placements.length+catalogueCategories.length+7,68);
  // The Modern Tradition dress selection is explicitly curated; do not
  // categorize newly supplied Ruffled media as colourful without approval.
  assert.deepEqual(modernTraditionPages.map(page=>page.product.sourceDressId),
    ['ball-gown-03','ball-gown-04','ball-gown-05','2-in-1-moreteadi-dress']);
});
