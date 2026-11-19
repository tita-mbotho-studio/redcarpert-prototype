import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueProducts, catalogueCategories, dressAppearsInCollection,
  modernTraditionColourByDress, collectionsForDress } from '../src/data/catalogue.ts';
import { adaptCatalogue } from '../src/lib/catalogue-adapter.ts';
import { validateCatalogue } from '../src/lib/validate-catalogue.ts';
import { sitePages } from '../src/data/site.ts';
import { createNodeRenderer } from '../scripts/lib/markup.ts';
import { createLuxuryLookbookHtml } from '../src/lib/luxury-lookbook.ts';
import { lookbookEntries } from '../src/client/lookbook.js';
import { displaySalePriceForDress, displayRentalPriceForDress } from '../src/lib/pricing.ts';

const all=nodes=>nodes.flatMap(node=>typeof node==='string'?[]:[node,...all(node.children)]);
const clientColours={
  'ball-gown-03':'navy blue',
  'ball-gown-04':'rose gold',
  'ball-gown-05':'dusty rose',
  'ball-gown-11':'lavender',
  'ruffled-dress-04':'dusty rose',
  'ruffled-dress-07':'rose gold',
  '2-in-1-mmematlala-dress':'bronze',
  '2-in-1-moreteadi-dress':'rose gold',
};

test('Modern Tradition features only explicitly reviewed colourful client gowns from other collections',()=>{
  assert.deepEqual(Object.fromEntries(modernTraditionColourByDress),clientColours);
  assert.equal(catalogueProducts.length,47,'never duplicate the underlying dress record');
  assert.equal(new Set(catalogueProducts.map(p=>p.id)).size,47);
  for(const product of catalogueProducts){
    assert.deepEqual(product.collections,collectionsForDress(product.id,product.category));
    assert.equal(new Set(product.collections).size,product.collections.length);
    assert(product.collections.includes(product.category));
    const colour=clientColours[product.id];
    if(colour){
      assert(!Object.hasOwn(product,'status'));
      assert.notEqual(product.category,'modern_tradition');
      assert.deepEqual(product.collections,[product.category,'modern_tradition']);
    }else{
      assert.deepEqual(product.collections,[product.category],
        'do not guess colour from collection names, backgrounds or champagne fabric');
    }
  }
  assert.doesNotThrow(()=>validateCatalogue(catalogueProducts));
  const tampered=catalogueProducts.map(p=>p.id==='ball-gown-01'
    ? {...p,collections:['ball_gown','modern_tradition']} : p);
  assert.throws(()=>validateCatalogue(tampered),/Invalid multi-collection membership/);
  assert.equal(dressAppearsInCollection(catalogueProducts.find(p=>p.id==='ball-gown-01'),'modern_tradition'),false);
});

test('Modern Tradition listing and filter use secondary category membership without creating duplicates',()=>{
  const modern=catalogueCategories.find(c=>c.id==='modern_tradition');
  const expected=catalogueProducts.filter(p=>p.collections.includes(modern.id));
  assert.equal(expected.length,8,'only the eight verified colourful client dresses remain');
  const source={...sitePages['/product-category/mermaid'],route:'/product-category/modern_tradition'};
  const output=adaptCatalogue(source,catalogueProducts);
  const cards=all(output.nodes).filter(n=>n.attrs['data-catalogue-id']!==undefined);
  assert.deepEqual(cards.map(c=>c.attrs['data-catalogue-id']),expected.map(p=>p.id));
  assert.equal(new Set(cards.map(c=>c.attrs['data-catalogue-id'])).size,cards.length);
  for(const card of cards){
    const product=expected.find(p=>p.id===card.attrs['data-catalogue-id']);
    assert(product);
    assert.equal(card.attrs['data-catalogue-category'],product.category);
    assert.equal(card.attrs['data-catalogue-collections'],product.collections.join(' '));
    const link=all([card]).find(n=>n.tag==='a');
    assert.equal(link.attrs.href,product.previewRoute);
  }
  const main=adaptCatalogue(sitePages['/product'],catalogueProducts);
  const mainCards=all(main.nodes).filter(n=>n.attrs['data-catalogue-id']!==undefined);
  assert.equal(mainCards.length,47);
  assert.equal(new Set(mainCards.map(c=>c.attrs['data-catalogue-id'])).size,47);
});

test('interactive and PDF lookbooks label secondary Modern Tradition without duplicating dress pages or prices',()=>{
  const html=createNodeRenderer([])({tag:'div',attrs:{'data-lookbook-viewer':'true'},children:[]});
  const images=catalogueProducts.map(p=>({id:p.id,jpeg:Buffer.from([0xff,0xd8,0xff,0xd9]),width:1200,height:1800}));
  const pdf=createLuxuryLookbookHtml(catalogueProducts,images,{year:2026,logo:Buffer.from([0x89,0x50,0x4e,0x47])});
  assert.equal(lookbookEntries.length,47);
  assert.equal((html.match(/data-book-page=/g)||[]).length,49);
  assert.equal((html.match(/ALSO IN MODERN TRADITION/g)||[]).length,8);
  assert.equal((pdf.match(/<section class="page /g)||[]).length,59);
  assert.equal((pdf.match(/<span class="kind">Also in Modern Tradition<\/span>/g)||[]).length,8);
  assert(pdf.includes('Discover 8 Modern Tradition looks, including 8 colourful gowns'));
  assert.equal((html.match(/data-book-sale-price=/g)||[]).length,47);
  assert.equal((pdf.match(/data-pdf-sale-price=/g)||[]).length,47);
  for(const product of catalogueProducts){
    const entry=lookbookEntries.find(e=>e.id===product.id);
    assert(entry);
    assert.deepEqual(entry.collections,product.collections.map(c=>catalogueCategories.find(x=>x.id===c).name));
    assert(html.includes('data-book-dress-id="'+product.id+'" data-book-collections="'+product.collections.join(' ')+'"'));
    assert(pdf.includes('data-pdf-sale-price="'+product.id+'">'+displaySalePriceForDress(product.id)+'</p>'));
    assert(pdf.includes('data-pdf-rental-price="'+product.id+'">'+displayRentalPriceForDress(product.id)+'</p>'));
  }
});
