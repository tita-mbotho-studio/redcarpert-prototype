import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalogueProducts } from '../src/data/catalogue.ts';
import { adaptCatalogue } from '../src/lib/catalogue-adapter.ts';
import { sitePages } from '../src/data/site.ts';

const descend = nodes => nodes.flatMap(node => typeof node === 'string' ? [] : [node, ...descend(node.children)]);

test('Wedding Dresses and category cards explicitly center titles and price captions at all widths', () => {
 const css = readFileSync('src/components/CatalogueListing.css', 'utf8');
 for (const selector of ['.woocommerce-loop-product__title','.catalogue-sample-note','.redcarpert-catalogue-price']) {
   assert(css.includes('#main-container ul.products[data-catalogue-preview] li.product ' + selector),
     'missing scoped centering for ' + selector);
 }
 assert.match(css, /text-align:\s*center\s*!important/);
 assert.match(css, /\[data-catalogue-category="ball_gown"\] \.catalogue-sample-note\s*\{[^}]*border-top:\s*0\s*;/);
});

test('actual Ball Gown cards contain only name and price, with no client-photo label', () => {
 const doc = adaptCatalogue(sitePages['/product'],catalogueProducts);
 const cards = descend(doc.nodes).filter(node => node.attrs['data-catalogue-id']);
 assert.equal(cards.length,27);
 const client = cards.filter(node => node.attrs['data-catalogue-category']==='ball_gown');
 assert.equal(client.length,11);
 for(const card of client){
   const nodes=descend([card]);
   const title=nodes.find(node=>node.tag==='h2'&&node.attrs.class==='woocommerce-loop-product__title');
   const caption=nodes.find(node=>node.attrs.class==='catalogue-sample-note');
   assert(title?.children[0]?.startsWith('Ball Gown '));
   assert.equal(caption.children.length,2);
   assert.equal(caption.children[0].attrs.class,'redcarpert-catalogue-price');
   assert.match(caption.children[0].children[0],/^Indicative range: R [\d\s]+ – R [\d\s]+$/);
   assert.equal(caption.children[1].attrs.class,'redcarpert-catalogue-condition-note');
   assert.match(caption.children[1].children[0],/new or pre-owned/);
   assert(!JSON.stringify(card).includes('Client photographs'));
 }
});
