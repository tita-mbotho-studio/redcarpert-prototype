import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {sitePages} from '../src/data/site.ts';
import {catalogueProducts,catalogueCategories} from '../src/data/catalogue.ts';
import {adaptCatalogue} from '../src/lib/catalogue-adapter.ts';

const all=n=>n.flatMap(x=>typeof x==='string'?[]:[x,...all(x.children)]);
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const listingRoutes=['/product',...catalogueCategories.map(c=>c.route.replace(/\/$/,''))];
const categorySource=route=>sitePages[route]??{...sitePages['/product-category/mermaid'],route};
test('eleven client Ball Gowns and sixteen inspirational samples keep verified image sources',()=>{
 assert.deepEqual(catalogueCategories.map(c=>c.name),['Mermaid','Ball Gown','Ruffled Dresses','Modern Tradition Dresses','2 in 1 Dresses']);
 assert.equal(catalogueProducts.length,27);
 assert.equal(catalogueProducts.filter(p=>p.category==='ball_gown').length,11);
 assert.equal(catalogueProducts.filter(p=>p.status==='sample').length,16);
 for(const p of catalogueProducts){
  assert.equal(p.detailReference,null);
  assert(!('price' in p) && !('sizes' in p));
  if(p.status==='client'){
   assert.match(p.name,/^Ball Gown \d{2}$/);
   assert.match(p.image,/^https:\/\/ik\.imagekit\.io\/kw8awoqvwi\//);
   assert.equal(p.priceZar,null);
   assert.equal(p.imageCredit.provenance,'client-supplied');
  }else{
   assert.match(p.name,/^Sample /);
   assert.match(p.imageAlt,/not confirmed Redcarpert stock/);
   assert.match(p.image,/^https:\/\/images\.pexels\.com\/photos\//);
   const report=readFileSync(p.imageCredit.provenance,'utf8');
   assert(report.includes(p.imageCredit.sourceUrl));
   assert(report.includes(p.imageCredit.photographer));
  }
 }
});
test('only approved listing documents change; other routes and all protected subtrees retain identity',()=>{
 freeze(sitePages);const before=JSON.stringify(sitePages);
 for(const input of [...Object.values(sitePages),...listingRoutes.slice(3).map(categorySource)]){
  const output=adaptCatalogue(input,catalogueProducts);
  if(!listingRoutes.includes(input.route)){assert.equal(output,input);continue;}
  for(const key of Object.keys(input).filter(k=>k!=='nodes'))assert.equal(input[key],output[key]);
  for(const n of all(input.nodes).filter(n=>n.attrs.id==='header'||n.tag==='footer'||n.attrs.id==='ht-ctc-chat'))assert(all(output.nodes).includes(n));
  const nodes=all(output.nodes),grid=nodes.find(n=>n.attrs['data-catalogue-preview']);assert.equal(grid.attrs.class,'products columns-4');
  const items=grid.children.filter(n=>typeof n!=='string');assert.equal(items.length,input.route==='/product'?27:input.route==='/product-category/ball_gown'?11:4);
  for(const card of items){const p=catalogueProducts.find(p=>p.id===card.attrs['data-catalogue-id']);assert(p);if(input.route!=='/product')assert(input.route.endsWith('/'+p.category));const n=all([card]);const img=n.find(n=>n.tag==='img');assert.equal(img.attrs.src,p.image);assert.equal(img.attrs.width,'370');assert.equal(img.attrs.height,'370');assert.equal(card.attrs['data-catalogue-category'],p.category);assert.equal(img.attrs.srcset,undefined);assert.match(img.attrs.style,/aspect-ratio: 1 \/ 1/);assert.equal(n.find(n=>n.tag==='a').attrs.href,p.previewRoute);assert.equal(n.find(n=>n.tag==='a').attrs['aria-disabled'],undefined);assert.equal(sitePages[p.previewRoute],undefined);assert.equal(n.find(n=>n.tag==='h2').children[0],p.status==='client'?p.name:p.name.replace(/^Sample /,'Look '));const note=n.find(n=>n.attrs.class==='catalogue-sample-note');
    if(p.status==='client') assert.equal(note,undefined,'client gowns show only the dress photo and title');
    else {
      assert(note,'inspiration gowns retain the photo disclosure');
      assert.deepEqual(note.children,['Inspiration photo']);
    }
    assert(!n.some(n=>Object.hasOwn(n.attrs,'data-dress-price') || n.attrs.class==='redcarpert-catalogue-condition-note' || n.attrs.class==='redcarpert-catalogue-price'));
    assert(!n.some(n=>n.attrs.class==='price'||n.attrs.class?.includes('add_to_cart')));}
  assert(!nodes.some(n=>n.attrs.class==='woocommerce-pagination'));const order=nodes.find(n=>(n.attrs.class||'').split(' ').includes('woocommerce-ordering'));assert.equal(order.tag,'div');assert(!all([order]).some(n=>n.tag==='form'||n.attrs.name==='orderby'||n.attrs.value==='price'));if(input.route==='/product'){const buttons=all([order]).filter(n=>n.tag==='button'&&n.attrs['data-filter-category']);assert.deepEqual(buttons.map(n=>n.attrs['data-filter-category']),['all',...catalogueCategories.map(c=>c.id)]);assert.equal(buttons.filter(n=>n.attrs['aria-pressed']==='true').length,1);}else{assert.equal(order.attrs['aria-hidden'],'true');}
 }
 assert.equal(JSON.stringify(sitePages),before);
});
test('unexpected structures/counts, commerce slots and unready data fail closed',()=>{
 for(const route of listingRoutes){for(const mutate of [
  d=>{all(d.nodes).find(n=>n.attrs.class==='products columns-4').children=[];},
  d=>{all(d.nodes).find(n=>n.attrs.class==='price').children=['€1,000'];},
  d=>{all(d.nodes).find(n=>n.attrs.class==='orderby').children=[];},
  d=>{all(d.nodes).find(n=>n.attrs.class==='woocommerce-LoopProduct-link woocommerce-loop-product__link').attrs.href='/unknown';},
 ]){const d=structuredClone(categorySource(route));mutate(d);assert.throws(()=>adaptCatalogue(d,catalogueProducts),/Catalogue .*incompatible capture/);}
 assert.throws(()=>adaptCatalogue(adaptCatalogue(categorySource(route),catalogueProducts),catalogueProducts),/Catalogue/);
 assert.throws(()=>adaptCatalogue(categorySource(route),catalogueProducts.map(p=>({...p,detailReference:'/unready'}))),/catalogue readiness/);
 }
});

test('catalogue and category cards omit prices and condition notes even when price ranges exist',()=>{
 const products=catalogueProducts.map((p,i)=>i===0?{...p,priceZar:14999}:p);
 for(const route of listingRoutes){
   const doc=adaptCatalogue(categorySource(route),products);
   const cards=all(doc.nodes).filter(n=>n.attrs['data-catalogue-id']);
   assert.equal(cards.length,route==='/product'?27:route.endsWith('/ball_gown')?11:4);
   for(const card of cards){
     const nodes=all([card]);
     assert.equal(nodes.filter(n=>Object.hasOwn(n.attrs,'data-dress-price')).length,0);
     assert.equal(nodes.filter(n=>n.attrs.class==='redcarpert-catalogue-condition-note').length,0);
     assert.equal(nodes.filter(n=>n.attrs.class==='redcarpert-catalogue-price').length,0);
     const product=products.find(p=>p.id===card.attrs['data-catalogue-id']);
     const note=nodes.find(n=>n.attrs.class==='catalogue-sample-note');
     if(product.status==='client') assert.equal(note,undefined);
     else assert.deepEqual(note?.children,['Inspiration photo']);
   }
 }
});
