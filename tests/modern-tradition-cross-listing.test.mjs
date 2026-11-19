import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueProducts, catalogueCategories, dressAppearsInCollection,
  modernTraditionColourByDress, modernTraditionSourceByDress, collectionsForDress } from '../src/data/catalogue.ts';
import { adaptCatalogue } from '../src/lib/catalogue-adapter.ts';
import { validateCatalogue } from '../src/lib/validate-catalogue.ts';
import { sitePages } from '../src/data/site.ts';
import { createNodeRenderer } from '../scripts/lib/markup.ts';
import { createLuxuryLookbookHtml } from '../src/lib/luxury-lookbook.ts';
import { lookbookEntries } from '../src/client/lookbook.js';
import { modernTraditionPages } from '../src/lib/modern-tradition.ts';
import { lookbookPlacements } from '../src/lib/lookbook-placements.ts';
import { displaySalePriceForDress, displayRentalPriceForDress } from '../src/lib/pricing.ts';

const all=nodes=>nodes.flatMap(node=>typeof node==='string'?[]:[node,...all(node.children)]);
const clientColours={
  'ball-gown-03':'navy blue',
  'ball-gown-04':'rose gold',
  'ball-gown-05':'dusty rose',
  '2-in-1-moreteadi-dress':'rose gold',
};
const modernIds=['modern-tradition-01','modern-tradition-02','modern-tradition-03','modern-tradition-04'];
const sources=Object.keys(clientColours);

test('all 51 catalogue dresses have independent IDs, category and price records',()=>{
  assert.deepEqual(Object.fromEntries(modernTraditionColourByDress),clientColours);
  assert.equal(catalogueProducts.length,51);
  assert.equal(new Set(catalogueProducts.map(p=>p.id)).size,51);
  assert.deepEqual([...modernTraditionSourceByDress.entries()],modernIds.map((id,i)=>[id,sources[i]]));
  assert.deepEqual(catalogueProducts.filter(p=>p.category==='modern_tradition').map(p=>p.id),modernIds);
  for(const product of catalogueProducts){
    assert.deepEqual(product.collections,collectionsForDress(product.id,product.category));
    assert.deepEqual(product.collections,[product.category]);
    const source=modernTraditionSourceByDress.get(product.id);
    if(source){
      const original=catalogueProducts.find(p=>p.id===source);
      assert(original);
      assert.equal(product.category,'modern_tradition');
      assert.equal(product.sourceDressId,source);
      assert.notEqual(product.id,original.id);
      assert.notEqual(product.previewRoute,original.previewRoute);
      assert.equal(product.image,original.image,'client photographs may be reused, not duplicated as records');
      assert.notStrictEqual(product,original);
    }else assert.equal(product.sourceDressId,undefined);
  }
  assert.doesNotThrow(()=>validateCatalogue(catalogueProducts));
  const tampered=catalogueProducts.map(p=>p.id==='ball-gown-01'
    ? {...p,collections:['ball_gown','modern_tradition']} : p);
  assert.throws(()=>validateCatalogue(tampered),/Invalid multi-collection membership/);
  assert.equal(dressAppearsInCollection(catalogueProducts.find(p=>p.id==='ball-gown-03'),'modern_tradition'),false);
});

test('Modern Tradition listing and main filter present four independently identified dresses',()=>{
  const modern=catalogueCategories.find(c=>c.id==='modern_tradition');
  const expected=catalogueProducts.filter(p=>p.category===modern.id);
  assert.deepEqual(expected.map(p=>p.id),modernIds);
  assert.deepEqual(modernTraditionPages.map(p=>p.product.id),modernIds);
  assert.deepEqual(modernTraditionPages.map(p=>p.number),['01','02','03','04']);
  const source={...sitePages['/product-category/mermaid'],route:'/product-category/modern_tradition'};
  const output=adaptCatalogue(source,catalogueProducts);
  const cards=all(output.nodes).filter(n=>n.attrs['data-catalogue-id']!==undefined);
  assert.deepEqual(cards.map(c=>c.attrs['data-catalogue-id']),modernIds);
  for(const [index,card] of cards.entries()){
    const product=expected[index];
    assert.equal(card.attrs['data-catalogue-category'],'modern_tradition');
    assert.equal(card.attrs['data-catalogue-collections'],'modern_tradition');
    const link=all([card]).find(n=>n.tag==='a');
    assert.equal(link.attrs.href,product.previewRoute);
    assert.equal(card.attrs['data-catalogue-modern-href'],
      '/redcarpert-prototype'+product.previewRoute+'/');
    const serial=String(index+1).padStart(2,'0');
    const heading=all([card]).find(n=>n.tag==='h2');
    assert.equal(heading.children[0].children[0],'Modern Tradition');
    assert.equal(heading.children[2].children[0],serial);
    assert.equal(card.attrs['data-catalogue-modern-number'],serial);
    assert.equal(link.attrs['aria-label'],'Modern Tradition '+serial+': view dress photographs');
    assert.equal(all([card]).find(n=>n.tag==='img').attrs.alt,'Modern Tradition dress '+serial);
  }
  const main=adaptCatalogue(sitePages['/product'],catalogueProducts);
  const mainCards=all(main.nodes).filter(n=>n.attrs['data-catalogue-id']!==undefined);
  assert.equal(mainCards.length,51);
  assert.equal(new Set(mainCards.map(c=>c.attrs['data-catalogue-id'])).size,51);
});

test('the 53-page Digital Lookbook and 63-page PDF include 51 unique priced dresses',()=>{
  const html=createNodeRenderer([])({tag:'div',attrs:{'data-lookbook-viewer':'true'},children:[]});
  const images=catalogueProducts.map(p=>({id:p.id,jpeg:Buffer.from([0xff,0xd8,0xff,0xd9]),width:1200,height:1800}));
  const pdf=createLuxuryLookbookHtml(catalogueProducts,images,{year:2026,logo:Buffer.from([0x89,0x50,0x4e,0x47])});
  const placements=lookbookPlacements(catalogueProducts);
  assert.equal(lookbookEntries.length,51);
  assert.equal(placements.length,51);
  assert.equal(new Set(placements.map(p=>p.id)).size,51);
  assert.equal((html.match(/data-book-page=/g)||[]).length,53);
  assert.equal((pdf.match(/<section class="page /g)||[]).length,63);
  assert.equal((html.match(/data-book-sale-price=/g)||[]).length,51);
  assert.equal((pdf.match(/data-pdf-sale-price=/g)||[]).length,51);
  assert.equal((html.match(/data-book-category="modern_tradition"/g)||[]).length,4);
  assert(pdf.includes('Discover 4 colourful Modern Tradition wedding dresses.'));
  assert(!pdf.includes('Also in Modern Tradition'));
  assert(!html.includes('ALSO IN MODERN TRADITION'));
  for(const product of catalogueProducts){
    const entry=lookbookEntries.find(e=>e.id===product.id);
    assert(entry);
    assert.deepEqual(entry.collections,product.collections.map(c=>catalogueCategories.find(x=>x.id===c).name));
    assert(html.includes('data-book-dress-id="'+product.id+'" data-book-entry-id="'+product.id+'"'),
      'each digital book record needs a separate ID: '+product.id);
    assert(html.includes('data-book-sale-price="'+product.id+'">'+displaySalePriceForDress(product.id)+'</p>'));
    assert(pdf.includes('data-pdf-sale-price="'+product.id+'">'+displaySalePriceForDress(product.id)+'</p>'));
    assert(pdf.includes('data-pdf-rental-price="'+product.id+'">'+displayRentalPriceForDress(product.id)+'</p>'));
  }
  for(const page of modernTraditionPages){
    assert(html.includes('data-book-entry-id="'+page.product.id+'" data-book-category="modern_tradition"'));
    assert(html.includes('<h3>'+page.name+'</h3>'));
    assert(html.includes('href="'+page.route+'/">View dress details</a>'));
    assert(pdf.includes('id="look-'+page.product.id+'"'));
    assert(pdf.includes('<h3>'+page.name+'</h3>'));
    assert(pdf.includes('href="https://tita-mbotho-studio.github.io/redcarpert-prototype'+page.route+'/">View dress details</a>'));
  }
});
