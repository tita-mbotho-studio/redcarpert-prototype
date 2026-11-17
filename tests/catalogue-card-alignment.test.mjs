import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalogueProducts } from '../src/data/catalogue.ts';
import { adaptCatalogue } from '../src/lib/catalogue-adapter.ts';
import { sitePages } from '../src/data/site.ts';

const descend = nodes => nodes.flatMap(node => typeof node === 'string' ? [] : [node, ...descend(node.children)]);

test('catalogue cards keep centred dress names and simple inspiration labels', () => {
 const css=readFileSync('src/components/CatalogueListing.css','utf8');
 for(const selector of ['.woocommerce-loop-product__title','.catalogue-sample-note']) {
   assert(css.includes('#main-container ul.products[data-catalogue-preview] li.product ' + selector));
 }
 assert.match(css,/text-align:\s*center\s*!important/);
 assert(!css.includes('redcarpert-catalogue-condition-note'));
 assert(!css.includes('redcarpert-catalogue-price'));
});

test('all eleven real Ball Gown cards contain only an image and dress name', () => {
 const doc=adaptCatalogue(sitePages['/product'],catalogueProducts);
 const cards=descend(doc.nodes).filter(node=>node.attrs['data-catalogue-id']);
 assert.equal(cards.length,27);
 const client=cards.filter(node=>node.attrs['data-catalogue-category']==='ball_gown');
 assert.equal(client.length,11);
 for(const card of client){
   const nodes=descend([card]);
   const title=nodes.find(node=>node.tag==='h2'&&node.attrs.class==='woocommerce-loop-product__title');
   assert(title?.children[0]?.startsWith('Ball Gown '));
   assert.equal(nodes.some(node=>node.attrs.class==='catalogue-sample-note'),false);
   assert.equal(nodes.some(node=>Object.hasOwn(node.attrs,'data-dress-price')),false);
   assert.equal(nodes.some(node=>node.attrs.class==='redcarpert-catalogue-condition-note'),false);
 }
});
