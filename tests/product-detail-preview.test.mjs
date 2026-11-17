import assert from 'node:assert/strict';
import test from 'node:test';
import {sitePages} from '../src/data/site.ts';
import {catalogueProducts,catalogueCategories} from '../src/data/catalogue.ts';
import {createProductDetailPreview,sampleFittingMessage,sampleGalleryImages,relatedDressesFor} from '../src/lib/product-detail-preview.ts';
import { displaySalePriceForDress, displayRentalPriceForDress, salePriceForDress, SALE_RENTAL_DISCLAIMER, PRICE_PENDING_LABEL } from '../src/lib/pricing.ts';
import { photosForDress, validateDressGalleryMappings } from '../src/lib/dress-gallery.ts';
import clientBallGowns from '../src/data/client-ball-gowns.json' with {type:'json'};
const all=nodes=>nodes.flatMap(n=>typeof n==='string'?[]:[n,...all(n.children)]);
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
test('previews are isolated, immutable, collision-free and contain one genuine sample slide with no commerce or inherited dress claims',()=>{
 freeze(sitePages);freeze(catalogueProducts);const before=JSON.stringify(sitePages);
 const routes=new Set();
 for(const product of catalogueProducts){
  const source=sitePages['/product/arabella'];const output=createProductDetailPreview(source,product);const nodes=all(output.nodes);
  assert.equal(output.route,product.previewRoute);assert.equal(sitePages[output.route],undefined);assert(!routes.has(output.route));routes.add(output.route);
  assert.equal(product.detailReference,null);assert(output.title.includes(product.status==='client'?'Redcarpert Wedding Dresses':'Wedding Dress Inspiration'));
  for(const n of all(source.nodes).filter(n=>['header','footer','ht-ctc-chat'].includes(n.attrs.id)))assert(nodes.includes(n));
  assert.equal(output.styles,source.styles);assert.equal(output.scripts,source.scripts);assert.equal(output.themeConfig,source.themeConfig);
  const root=nodes.find(n=>n.attrs['data-detail-preview']);const content=all([root]);
  const gallery=sampleGalleryImages[product.id];
  const related=relatedDressesFor(product);
  assert.equal(content.filter(n=>n.tag==='img').length,1+related.length);
  assert.equal(content.find(n=>n.tag==='img').attrs.src,gallery.src);
  assert.equal(content.find(n=>n.attrs['data-fancybox']).attrs.href,gallery.src);
  const imageGallery=content.find(n=>n.attrs['data-detail-gallery']===product.id);
  assert(imageGallery,'dress gallery metadata must be available');
  const photos=photosForDress(product);
  assert.deepEqual(JSON.parse(imageGallery.attrs['data-gallery-photos']),photos);
  assert.equal(content.filter(n=>Object.hasOwn(n.attrs,'data-gallery-next')).length,photos.length>1?1:0,
    'navigation appears only when a dress has additional photos');
  assert.equal(content.filter(n=>Object.hasOwn(n.attrs,'data-gallery-index')).length,photos.length>1?photos.length:0,
    'pagination count must match available dress photos');
  assert.equal(content.find(n=>n.tag==='img').attrs.width,String(gallery.width));assert.equal(content.find(n=>n.tag==='img').attrs.height,String(gallery.height));
  assert(!nodes.some(n=>n.attrs.class==='social-share'||n.attrs.class?.includes('share-item')));
  assert.equal(all(source.nodes).filter(n=>n.attrs.class==='social-share').length,1);
  assert.equal(content.find(n=>n.tag==='h1').children[0],product.status==='client'?product.name:product.name.replace(/^Sample /,'Look '));
  const card=content.find(n=>n.attrs.class==='redcarpert-detail-card');
  assert(card,'detail information must be inside a floating card');
  if(product.status==='client'){
    assert(!content.some(n=>n.attrs.class==='redcarpert-detail-collection'),'no duplicate collection label for a real gown');
    assert.equal(content.find(n=>n.attrs.class==='redcarpert-detail-price-label').children[0],'SALE PRICE');
    assert(!content.some(n=>n.attrs.class==='redcarpert-detail-enquiry-note'),'CTA already identifies fitting enquiry');
  }else{
    assert.equal(content.filter(n=>n.attrs.class==='redcarpert-detail-collection').length,1);
    const name=catalogueCategories.find(c=>c.id===product.category)?.name;
    assert.equal(content.find(n=>n.attrs.class==='redcarpert-detail-collection').children[0],
      name.endsWith('Dresses')?name:name+' Collection');
  }
  assert.equal(content.find(n=>Object.hasOwn(n.attrs,'data-sale-price')).children[0],
    displaySalePriceForDress(product.id));
  assert.equal(content.find(n=>Object.hasOwn(n.attrs,'data-rental-price')).children[0],
    displayRentalPriceForDress(product.id));
  assert.equal(content.find(n=>n.attrs.class==='redcarpert-detail-price-disclaimer').children[0],SALE_RENTAL_DISCLAIMER);
  assert.equal(content.filter(n=>n.attrs.class==='redcarpert-detail-price-option').length,2,
    'sale and rental prices have separate slots');
  assert.equal(content.find(n=>n.attrs.class==='redcarpert-detail-price-label').children[0],
    salePriceForDress(product.id)===null?'SALE PRICE':'EXAMPLE SALE PRICE');
  assert.equal(displayRentalPriceForDress(product.id), PRICE_PENDING_LABEL,
    'rental prices remain pending until supplied by the client');
  const relatedSection=content.find(n=>n.attrs.class==='redcarpert-related-dresses');
  assert(relatedSection,'each detail page must display related dresses in a separate section');
  const relatedCards=all([relatedSection]).filter(n=>n.attrs.class==='redcarpert-related-card');
  assert.equal(relatedCards.length,Math.min(4,catalogueProducts.filter(p=>p.category===product.category).length-1));
  assert.deepEqual(relatedCards.map(n=>n.attrs['data-related-dress']),related.map(d=>d.id));
  for(const [index,card] of relatedCards.entries()){
    const expected=related[index];
    const components=all([card]);
    const link=components.find(n=>n.tag==='a');
    const image=components.find(n=>n.tag==='img');
    assert.equal(link.attrs.href,expected.previewRoute+'/');
    assert.equal(image.attrs.src,expected.image);
    assert.equal(image.attrs.alt,expected.imageAlt);
    assert.equal(image.attrs['data-media-preset'],'card');
    assert.equal(components.find(n=>n.attrs.class==='redcarpert-related-price-value').children[0],
      displaySalePriceForDress(expected.id));
    assert.notEqual(expected.id,product.id,'current dress must never recommend itself');
    assert.equal(expected.category,product.category,'related dresses must match category');
  }
  assert(!all([card]).some(n=>n.attrs.class==='sample-detail-notice'),
    'stock image disclosure must sit outside the floating card');
  assert.equal(content.some(n=>n.attrs.class==='sample-detail-notice'),product.status==='sample','only illustrative styles need notices');
  assert(content.some(n=>n.attrs.class==='redcarpert-detail-actions'),
    'fitting action is inside card');
  assert(content.some(n=>n.tag==='button'&&n.children[0]==='Book a Fitting'&&Object.hasOwn(n.attrs,'data-whatsapp-preview')));
  assert(!content.some(n=>n.attrs.class==='product_meta'),'collection should never repeat');
  assert(!content.some(n=>['form','input','select','textarea'].includes(n.tag)));
  assert(!content.some(n=>/\b(stock|instock|cart|quantity|reviews_tab)\b/.test(n.attrs.class||'')));
  assert(!content.some(n=>n.attrs.class==='related products'),'inherited unrelated dresses must not leak');
  assert(!content.some(n=>n.attrs.class==='tabs wc-tabs'),'remove inherited sample description tabs');
  assert(!content.some(n=>n.attrs.id==='wpgis-gallery'));
  const text=JSON.stringify(root);assert(!/Arabella|Worldwide Shipping|French|satin|checkout|payment|woocommerce_loop_add_to_cart/i.test(text));
  if(product.status==='client') assert(!text.includes('Client-supplied dress photographs'));
  else { assert(text.includes('This photo is for inspiration.')); assert(text.includes('not confirmed as available')); assert(text.includes('EXAMPLE PRICE')); }
  assert(!content.some(n=>n.attrs.href?.startsWith('/product/')&&!n.attrs.href.startsWith('/product/preview/')));
  const message=sampleFittingMessage(product);
  assert(message.includes("*Dress:* "+(product.status==="client"?product.name:product.name.replace(/^Sample /,"Look "))));
  assert(message.includes('*'+(salePriceForDress(product.id)===null?'Sale price':'Example sale price')+':* '+displaySalePriceForDress(product.id)));
  assert(message.includes('*Rental price range:* '+displayRentalPriceForDress(product.id)));
  assert(message.includes("*Collection:* "));
  assert(message.includes("confirm whether this dress or a similar style is available"));
  assert(message.includes("the final sale price"));
  assert(message.includes("not a final quotation"));
  assert(!message.includes("in your inspiration collection"),"no separate inspiration-only message");
  assert(!/wa\.me|whatsapp\.com|\+\d/.test(message),"message must not contain the WhatsApp destination");
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
test('each detail uses the correct remote primary image without local downloads',()=>{
 assert.equal(catalogueProducts.length,27);
 for(const product of catalogueProducts){
  const gallery=sampleGalleryImages[product.id];
  assert.equal(gallery.src,product.image);
  assert.equal(gallery.width,1200);
  assert.equal(gallery.height,1800);
  assert.match(gallery.src,product.status==='client'?/^https:\/\/ik\.imagekit\.io\//:/^https:\/\/images\.pexels\.com\/photos\//);
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
 assert.equal(gallery.attrs.role,'region','screen-reader labelled gallery');
 assert(elements.find(n=>n.attrs.class==='slider redcarpert-multi-photo-slider'),'custom gallery must not be cloned by the inherited slider plugin');
 assert(!elements.some(n=>n.attrs.class==='slider wpgis-slider-for'),'do not initialise the legacy single-slide carousel for multiple angles');
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
 assert.equal(all([root]).filter(n=>Object.hasOwn(n.attrs,'data-sale-price')).length,1,'sale price remains intact');
 assert.equal(all([root]).filter(n=>Object.hasOwn(n.attrs,'data-rental-price')).length,1,'rental price remains intact');
});
test('additional dress photographs reject unknown IDs, duplicates and unsafe or undescribed URLs',()=>{
 const product=catalogueProducts[0];
 const make=photo=>({[product.id]:[photo]});
 validateDressGalleryMappings({});
 assert.equal(photosForDress(product).length,product.id==='sample-two-in-one-01'?2:1);
 assert.throws(()=>validateDressGalleryMappings({unknown:[{url:product.image,alt:'Another angle'}]}),/Unrecognized dress gallery ID/);
 assert.throws(()=>validateDressGalleryMappings(make({url:'javascript:alert(1)',alt:'Another angle'})),/Invalid gallery photo/);
 assert.throws(()=>validateDressGalleryMappings(make({url:'https://evil.example/track.jpg',alt:'Another angle'})),/Invalid gallery photo/);
 assert.throws(()=>validateDressGalleryMappings(make({url:'https://ik.imagekit.io/example/back.webp',alt:''})),/Invalid gallery photo/);
 assert.throws(()=>validateDressGalleryMappings(make({url:'https://ik.imagekit.io/example/back.webp',alt:'x'})),/Invalid gallery photo/);
 assert.throws(()=>photosForDress(product,make({url:product.image,alt:'Same photograph again'})),/duplicates the primary photograph/);
 const same={url:'https://ik.imagekit.io/example/front.webp',alt:'Front detail of gown'};
 assert.throws(()=>validateDressGalleryMappings({[product.id]:[same,same]}),/Repeated gallery photograph/);
});

test('Pexels browser-demo gallery has two photographs from the same Esma Atak shoot',()=>{
 const demo=catalogueProducts.find(product=>product.id==='sample-two-in-one-01');
 assert(demo);
 const photos=photosForDress(demo);
 assert.equal(photos.length,2,'test dress should show real arrows and 01 / 02 counter');
 assert.match(photos[0].url,/\/20370059\/pexels-photo-20370059\.jpeg/);
 assert.match(photos[1].url,/\/20370060\/pexels-photo-20370060\.jpeg/);
 assert.match(photos[1].alt,/Side angle/);
 const other=catalogueProducts.find(product=>product.id==='sample-mermaid');
 assert(other);
 assert.equal(photosForDress(other).length,1,'unmodified dresses still hide navigation');
});

test('eleven client Ball Gowns map exactly twenty-eight real ImageKit photographs into eleven galleries',()=>{
 assert.equal(clientBallGowns.length,11);
 assert.equal(clientBallGowns.reduce((sum,gown)=>sum+gown.photos.length,0),28);
 const expected=[3,3,4,2,4,2,1,1,4,1,3];
 for(const [index,gown] of clientBallGowns.entries()){
  const product=catalogueProducts.find(entry=>entry.id===gown.id);
  assert(product);
  assert.equal(product.status,'client');
  assert.equal(product.priceZar,null);
  assert.equal(product.image,gown.photos[0].url);
  assert.equal(product.name,'Ball Gown '+String(index+1).padStart(2,'0'));
  const photos=photosForDress(product);
  assert.equal(photos.length,expected[index]);
  assert.deepEqual(photos,gown.photos);
  const output=createProductDetailPreview(sitePages['/product/arabella'],product);
  const content=all(output.nodes);
  const gallery=content.find(n=>n.attrs['data-detail-gallery']===product.id);
  assert.equal(JSON.parse(gallery.attrs['data-gallery-photos']).length,expected[index]);
  assert.equal(content.filter(n=>Object.hasOwn(n.attrs,'data-gallery-next')).length,expected[index]>1?1:0);
  assert(output.title.includes(product.name));
  assert(!output.title.includes('Sample Preview'));
  assert.equal(content.find(n=>n.attrs.class==='redcarpert-detail-price-label').children[0],'INDICATIVE PRICE RANGE');
  assert(content.some(n=>Object.hasOwn(n.attrs,'data-dress-price')&&n.children[0]===displayPriceForDress(product.id)));
  assert(!content.some(n=>n.attrs.class==='sample-detail-notice'));
  assert(!JSON.stringify(content).includes('Client-supplied dress photographs'));
  assert(!sampleFittingMessage(product).includes('demonstration'));
 }
});
