import assert from 'node:assert/strict';
import test from 'node:test';
import {sitePages} from '../src/data/site.ts';
import {catalogueProducts,catalogueCategories} from '../src/data/catalogue.ts';
import {createProductDetailPreview,sampleDetailTitle,sampleFittingMessage,sampleGalleryImages} from '../src/lib/product-detail-preview.ts';
import { displayDressPrice } from '../src/lib/pricing.ts';
import { photosForDress, validateDressGalleryMappings } from '../src/lib/dress-gallery.ts';
const all=nodes=>nodes.flatMap(n=>typeof n==='string'?[]:[n,...all(n.children)]);
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
test('previews are isolated, immutable, collision-free and contain one genuine sample slide with no commerce or inherited dress claims',()=>{
 freeze(sitePages);freeze(catalogueProducts);const before=JSON.stringify(sitePages);
 const routes=new Set();
 for(const product of catalogueProducts){
  const source=sitePages['/product/arabella'];const output=createProductDetailPreview(source,product);const nodes=all(output.nodes);
  assert.equal(output.route,product.previewRoute);assert.equal(sitePages[output.route],undefined);assert(!routes.has(output.route));routes.add(output.route);
  assert.equal(product.detailReference,null);assert(output.title.includes('Sample Preview'));
  for(const n of all(source.nodes).filter(n=>['header','footer','ht-ctc-chat'].includes(n.attrs.id)))assert(nodes.includes(n));
  assert.equal(output.styles,source.styles);assert.equal(output.scripts,source.scripts);assert.equal(output.themeConfig,source.themeConfig);
  const root=nodes.find(n=>n.attrs['data-detail-preview']);const content=all([root]);
  const gallery=sampleGalleryImages[product.id];
  assert.equal(content.filter(n=>n.tag==='img').length,1);assert.equal(content.find(n=>n.tag==='img').attrs.src,gallery.src);
  assert.equal(content.find(n=>n.attrs['data-fancybox']).attrs.href,gallery.src);
  const imageGallery=content.find(n=>n.attrs['data-detail-gallery']===product.id);
  assert(imageGallery,'dress gallery metadata must be available');
  assert.equal(JSON.parse(imageGallery.attrs['data-gallery-photos']).length,1);
  assert.equal(content.filter(n=>Object.hasOwn(n.attrs,'data-gallery-next')).length,0,'one image must not display misleading arrows');
  assert.equal(content.filter(n=>Object.hasOwn(n.attrs,'data-gallery-index')).length,0,'one image must not display misleading dots');
  assert.equal(content.find(n=>n.tag==='img').attrs.width,String(gallery.width));assert.equal(content.find(n=>n.tag==='img').attrs.height,String(gallery.height));
  assert(!nodes.some(n=>n.attrs.class==='social-share'||n.attrs.class?.includes('share-item')));
  assert.equal(all(source.nodes).filter(n=>n.attrs.class==='social-share').length,1);
  assert.equal(content.find(n=>n.tag==='h1').children[0],product.name);
  const card=content.find(n=>n.attrs.class==='redcarpert-detail-card');
  assert(card,'detail information must be inside a floating card');
  assert.equal(content.filter(n=>n.attrs.class==='redcarpert-detail-collection').length,1);
  assert.equal(content.find(n=>n.attrs.class==='redcarpert-detail-collection').children[0],
    (()=>{const name=catalogueCategories.find(c=>c.id===product.category)?.name;return name.endsWith('Dresses')?name:name+' Collection';})());
  assert.equal(content.find(n=>Object.hasOwn(n.attrs,'data-dress-price')).children[0],
    displayDressPrice(product.priceZar));
  assert(!all([card]).some(n=>n.attrs.class==='sample-detail-notice'),
    'stock image disclosure must sit outside the floating card');
  assert(content.some(n=>n.attrs.class==='sample-detail-notice'));
  assert(content.some(n=>n.attrs.class==='redcarpert-detail-actions'),
    'fitting action is inside card');
  assert(content.some(n=>n.tag==='button'&&n.children[0]==='Book a Fitting'&&Object.hasOwn(n.attrs,'data-whatsapp-preview')));
  assert(!content.some(n=>n.attrs.class==='product_meta'),'collection should never repeat');
  assert(!content.some(n=>['form','input','select','textarea'].includes(n.tag)));
  assert(!content.some(n=>/\b(stock|instock|cart|quantity|related|reviews_tab)\b/.test(n.attrs.class||'')));
  assert(!content.some(n=>n.attrs.class==='tabs wc-tabs'),'remove inherited sample description tabs');
  assert(!content.some(n=>n.attrs.id==='wpgis-gallery'));
  const text=JSON.stringify(root);assert(!/Arabella|Worldwide Shipping|French|satin|checkout|payment|woocommerce_loop_add_to_cart/i.test(text));
  assert(text.includes('not confirmed Redcarpert inventory'));
  assert(!content.some(n=>n.attrs.href?.startsWith('/product/')&&!n.attrs.href.startsWith('/product/preview/')));
  const message=sampleFittingMessage(product);assert(message.includes(sampleDetailTitle(product)));assert(message.includes('not confirmed Redcarpert inventory'));assert(!/wa\.me|whatsapp\.com|\+\d/.test(message));
 }
 assert.equal(JSON.stringify(sitePages),before);
});
test('unexpected source structures, commerce content and unverified mappings fail closed',()=>{
 const product=catalogueProducts[0];
 for(const mutate of [
  d=>{d.route='/product/aventhera';},
  d=>{all(d.nodes).find(n=>n.attrs.id==='product-15828').children=[];},
  d=>{all(d.nodes).find(n=>n.attrs.class==='price').children=['£999'];},
  d=>{all(d.nodes).find(n=>n.attrs.class==='slider wpgis-slider-for').children=[];},
  d=>{all(d.nodes).find(n=>n.attrs.id==='tab-description').attrs.id='unexpected';},
  d=>{all(d.nodes).find(n=>n.attrs.class==='social-share').attrs.class='unexpected';},
  d=>{all(d.nodes).find(n=>n.attrs.class==='share-item share-fb').attrs['data-url']='https://example.com/';},
 ]){const source=structuredClone(sitePages['/product/arabella']);mutate(source);assert.throws(()=>createProductDetailPreview(source,product),/incompatible/);}
 for(const changes of [{previewRoute:'/product/arabella'},{detailReference:'/product/client'},{id:'invented'},{status:'confirmed'},{category:'ball_gown'},{image:'https://example.com/photo.jpg'}])assert.throws(()=>createProductDetailPreview(sitePages['/product/arabella'],{...product,...changes}),/incompatible sample mapping/);
});
test('each detail reuses the corresponding remote Pexels image without local downloads',()=>{
 assert.equal(catalogueProducts.length,20);
 for(const product of catalogueProducts){
  const gallery=sampleGalleryImages[product.id];
  assert.equal(gallery.src,product.image);
  assert.equal(gallery.width,1200);
  assert.equal(gallery.height,1800);
  assert.match(gallery.src,/^https:\/\/images\.pexels\.com\/photos\//);
 }
});

test('multiple verified photos for one dress render discreet arrows, dots, position and the correct full-size link',()=>{
 const product=catalogueProducts[0];
 const extras={
  [product.id]: [
   {url:'https://ik.imagekit.io/kw8awoqvwi/client/dress-front-detail.webp',alt:'Detail view of the same Mermaid wedding gown'},
   {url:'https://ik.imagekit.io/kw8awoqvwi/client/dress-back.webp',alt:'Back view of the same Mermaid wedding gown'},
  ],
 };
 const photos=photosForDress(product,extras);
 assert.equal(photos.length,3);
 assert.equal(photos[0].url,product.image);
 const output=createProductDetailPreview(sitePages['/product/arabella'],product,extras);
 const content=all(output.nodes);
 const root=content.find(n=>n.attrs['data-detail-preview']===product.id);
 const gallery=all([root]).find(n=>n.attrs['data-detail-gallery']===product.id);
 assert(gallery,'the dress must have a gallery container');
 assert.equal(gallery.attrs.tabindex,'0','keyboard access to image gallery');
 assert.deepEqual(JSON.parse(gallery.attrs['data-gallery-photos']),photos);
 const elements=all([gallery]);
 assert.equal(elements.filter(n=>n.tag==='img').length,1,'only the active image is loaded');
 assert.equal(elements.filter(n=>Object.hasOwn(n.attrs,'data-gallery-previous')).length,1);
 assert.equal(elements.filter(n=>Object.hasOwn(n.attrs,'data-gallery-next')).length,1);
 const dots=elements.filter(n=>Object.hasOwn(n.attrs,'data-gallery-index'));
 assert.equal(dots.length,3);
 assert.deepEqual(dots.map(n=>n.attrs['aria-pressed']),['true','false','false']);
 assert.deepEqual(dots.map(n=>n.attrs['data-gallery-index']),['0','1','2']);
 assert.equal(elements.find(n=>Object.hasOwn(n.attrs,'data-gallery-counter')).children[0],'01 / 03');
 assert.equal(elements.find(n=>Object.hasOwn(n.attrs,'data-gallery-active-image')).attrs.src,product.image);
 assert.equal(elements.find(n=>Object.hasOwn(n.attrs,'data-gallery-enlarge')).attrs.href,product.image);
 assert.equal(all([root]).filter(n=>Object.hasOwn(n.attrs,'data-dress-price')).length,1,'price remains intact');
});
test('additional dress photographs reject unknown IDs, duplicates and unsafe or undescribed URLs',()=>{
 const product=catalogueProducts[0];
 const make=photo=>({[product.id]:[photo]});
 validateDressGalleryMappings({});
 assert.equal(photosForDress(product).length,1);
 assert.throws(()=>validateDressGalleryMappings({unknown:[{url:product.image,alt:'Another angle'}]}),/Unrecognized dress gallery ID/);
 assert.throws(()=>validateDressGalleryMappings(make({url:'javascript:alert(1)',alt:'Another angle'})),/Invalid gallery photo/);
 assert.throws(()=>validateDressGalleryMappings(make({url:'https://evil.example/track.jpg',alt:'Another angle'})),/Invalid gallery photo/);
 assert.throws(()=>validateDressGalleryMappings(make({url:'https://ik.imagekit.io/example/back.webp',alt:''})),/Invalid gallery photo/);
 assert.throws(()=>validateDressGalleryMappings(make({url:'https://ik.imagekit.io/example/back.webp',alt:'x'})),/Invalid gallery photo/);
 assert.throws(()=>photosForDress(product,make({url:product.image,alt:'Same photograph again'})),/duplicates the primary photograph/);
 const same={url:'https://ik.imagekit.io/example/front.webp',alt:'Front detail of gown'};
 assert.throws(()=>validateDressGalleryMappings({[product.id]:[same,same]}),/Repeated gallery photograph/);
});
