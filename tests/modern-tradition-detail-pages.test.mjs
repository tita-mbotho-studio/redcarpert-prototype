import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueProducts } from '../src/data/catalogue.ts';
import { modernTraditionPages, modernTraditionPageForDress, modernTraditionPageForRoute } from '../src/lib/modern-tradition.ts';
import { createProductDetailPreview } from '../src/lib/product-detail-preview.ts';
import { dressFittingMessage, dressPageUrl } from '../src/lib/whatsapp-messages.ts';
import { publicStaticRoutes } from '../src/lib/public-routes.ts';
import { sitePages } from '../src/data/site.ts';
import { preparePage } from '../scripts/lib/prepare-page.ts';

const all=nodes=>nodes.flatMap(node=>typeof node==='string'?[]:[node,...all(node.children)]);

test('the four selected Modern Tradition dresses have contiguous, unique detail routes',()=>{
  assert.deepEqual(modernTraditionPages.map(page=>page.product.id),[
    'ball-gown-03','ball-gown-04','ball-gown-05','2-in-1-moreteadi-dress']);
  assert.deepEqual(modernTraditionPages.map(page=>page.name),[
    'Modern Tradition 01','Modern Tradition 02','Modern Tradition 03','Modern Tradition 04']);
  const excluded=['ball-gown-11','ruffled-dress-04','ruffled-dress-07','2-in-1-mmematlala-dress'];
  for(const id of excluded){
    const source=catalogueProducts.find(product=>product.id===id);
    assert(source,'the original category must retain excluded dress '+id);
    assert(!source.collections.includes('modern_tradition'));
    assert.equal(modernTraditionPageForDress(id),undefined);
  }
  const routes=publicStaticRoutes(sitePages,[
    ...catalogueProducts.map(product=>product.previewRoute),
    ...modernTraditionPages.map(page=>page.route)
  ]);
  assert.equal(routes.length,catalogueProducts.length+modernTraditionPages.length+11);
  assert.equal(new Set(routes).size,routes.length);
  for(const page of modernTraditionPages){
    assert.equal(modernTraditionPageForDress(page.product.id),page);
    assert.equal(modernTraditionPageForRoute(page.route),page);
    assert(routes.includes(page.route));
    assert(routes.includes(page.product.previewRoute),'original silhouette page stays available');
  }
});

test('every Modern Tradition detail page uses its own identity and shared price/photo data',()=>{
  const donor=sitePages['/product/arabella'];
  for(const page of modernTraditionPages){
    const {document,product,modernPage}=preparePage(page.route);
    assert.equal(product,page.product);
    assert.equal(modernPage,page);
    assert.equal(document.route,page.route);
    assert(document.title.startsWith(page.name+' |'));
    assert(document.description.includes(page.name));
    const nodes=all(document.nodes);
    const root=nodes.find(node=>node.attrs['data-detail-preview']===page.product.id);
    assert(root,'the canonical gown must back its Modern Tradition page');
    assert.equal(root.attrs['data-modern-tradition-number'],page.number);
    const content=all([root]);
    const title=content.find(node=>node.tag==='h1'&&node.attrs.class?.includes('redcarpert-detail-name'));
    assert.deepEqual(title.children,[page.name]);
    const gallery=content.find(node=>node.attrs['data-detail-gallery']===page.product.id);
    assert(gallery);
    assert.equal(gallery.attrs['data-gallery-origin'],'client');
    assert.equal(content.find(node=>node.attrs['data-gallery-active-image']!==undefined)?.attrs.src,page.product.image);
    assert(content.find(node=>node.attrs['data-sale-price']!==undefined));
    assert(content.find(node=>node.attrs['data-rental-price']!==undefined));
    const related=content.filter(node=>node.attrs['data-related-dress']!==undefined);
    assert.equal(related.length,3);
    assert.deepEqual(related.map(node=>node.attrs['data-related-dress']),
      modernTraditionPages.filter(other=>other!==page).map(other=>other.product.id));
    for(const relatedPage of modernTraditionPages.filter(other=>other!==page)){
      const card=related.find(node=>node.attrs['data-related-dress']===relatedPage.product.id);
      const link=all([card]).find(node=>node.tag==='a');
      assert.equal(link.attrs.href,relatedPage.route+'/');
      assert.equal(all([card]).find(node=>node.attrs.class==='redcarpert-related-name')?.children[0],relatedPage.name);
    }
    const message=dressFittingMessage(product,modernPage);
    assert(message.includes('*Dress:* '+page.name));
    assert(message.includes('*Collection:* Modern Tradition Dresses'));
    assert(message.includes('*Dress Link:* '+dressPageUrl(product,page)));
    assert(dressPageUrl(product,page).endsWith(page.route+'/'));
    assert(message.includes('*Sale Price:* '));
    assert(message.includes('*Rental Price Range:* '));
    // The native silhouette entry still has its original route and identity.
    const original=createProductDetailPreview(donor,product);
    assert.equal(original.route,page.product.previewRoute);
    assert.equal(all(original.nodes).find(node=>node.attrs.class?.includes('redcarpert-detail-name'))?.children[0],page.product.name);
    assert.equal(dressFittingMessage(product).includes('*Collection:* Modern Tradition Dresses'),false);
  }
});

test('reject a category presentation paired with another gown',()=>{
  const first=modernTraditionPages[0];
  const second=modernTraditionPages[1];
  assert.throws(()=>createProductDetailPreview(sitePages['/product/arabella'],
    first.product,undefined,second),/incompatible Modern Tradition presentation/);
  assert.throws(()=>dressFittingMessage(first.product,second),/Invalid Modern Tradition enquiry/);
  assert.throws(()=>dressPageUrl(first.product,second),/Invalid Modern Tradition dress link/);
});
