import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { sitePages } from '../src/data/site.ts';
import { catalogueProducts, catalogueCategories } from '../src/data/catalogue.ts';
import { createProductDetailPreview, dressImageDimensions, dressDetailTitle, relatedDressesFor } from '../src/lib/product-detail-preview.ts';
import { dressFittingMessage } from '../src/lib/whatsapp-messages.ts';
import { displaySalePriceForDress, displayRentalPriceForDress, salePriceLabelForDress, RENTAL_CONDITION_NOTE } from '../src/lib/pricing.ts';
import { photosForDress, validateDressGalleryMappings } from '../src/lib/dress-gallery.ts';
import clientMermaidDresses from '../src/data/client-mermaid-dresses.json' with { type: 'json' };
import clientBallGowns from '../src/data/client-ball-gowns.json' with { type: 'json' };
import clientRuffledDresses from '../src/data/client-ruffled-dresses.json' with { type: 'json' };
import clientTwoInOneDresses from '../src/data/client-two-in-one-dresses.json' with { type: 'json' };

const all=nodes=>nodes.flatMap(n=>typeof n==='string'?[]:[n,...all(n.children)]);
const find=(nodes,predicate)=>all(nodes).find(predicate);

test('all 51 client dress pages preserve the approved gallery, price and fitting layout',()=>{
  const source=sitePages['/product/arabella'];
  const original=JSON.stringify(source);
  assert.equal(catalogueProducts.length,51);
  assert.equal(new Set(catalogueProducts.map(p=>p.id)).size,51);
  assert(catalogueProducts.every(p=>!Object.hasOwn(p,'status') && !p.id.startsWith('sample-')));
  const routes=new Set();
  for(const dress of catalogueProducts){
    const doc=createProductDetailPreview(source,dress);
    const nodes=all(doc.nodes);
    assert.equal(doc.route,dress.previewRoute);
    assert(!routes.has(doc.route),'client dress route must be unique');
    routes.add(doc.route);
    assert.equal(dressDetailTitle(dress),dress.name);
    assert(doc.title.includes(dress.name));
    for(const id of ['header','footer','ht-ctc-chat']){
      const before=all(source.nodes).find(n=>n.attrs.id===id);
      if(before)assert(nodes.includes(before),'source '+id+' must not be replaced');
    }
    const section=nodes.find(n=>n.attrs['data-detail-preview']===dress.id);
    assert(section,'detail root missing');
    const content=all([section]);
    const photos=photosForDress(dress);
    const expectedDimensions=dressImageDimensions[dress.id];
    assert(expectedDimensions);
    assert.equal(content.find(n=>n.attrs['data-gallery-active-image']!==undefined)?.attrs.src,dress.image);
    assert.equal(content.find(n=>n.attrs['data-gallery-active-image']!==undefined)?.attrs.width,String(expectedDimensions.width));
    assert.equal(content.find(n=>n.attrs['data-gallery-active-image']!==undefined)?.attrs.height,String(expectedDimensions.height));
    const gallery=content.find(n=>n.attrs['data-detail-gallery']===dress.id);
    assert(gallery);
    assert.equal(gallery.attrs['data-gallery-origin'],'client');
    assert.deepEqual(JSON.parse(gallery.attrs['data-gallery-photos']),photos);
    assert.equal(content.filter(n=>n.attrs['data-gallery-next']!==undefined).length,photos.length>1?1:0);
    assert.equal(content.filter(n=>n.attrs['data-gallery-index']!==undefined).length,photos.length>1?photos.length:0);
    assert(content.some(n=>n.attrs['data-dress-frame']!==undefined));
    assert(!content.some(n=>n.attrs['data-sample-frame']!==undefined));
    const modal=nodes.find(n=>n.attrs['data-dress-photo-dialog']!==undefined);
    assert.equal(modal?.tag,'dialog');
    assert(find([modal],n=>n.attrs['data-dress-preview-photo']!==undefined));
    assert(find([modal],n=>n.attrs['data-dress-preview-close']!==undefined));
    assert.equal(content.find(n=>n.tag==='h1')?.children[0],dress.name);
    assert(!content.some(n=>n.attrs.class==='redcarpert-detail-collection'),
      'do not duplicate category in the client dress summary');
    const card=content.find(n=>n.attrs.class==='redcarpert-detail-card');
    assert(card);
    assert.equal(content.find(n=>n.attrs['data-sale-price']!==undefined)?.children[0],displaySalePriceForDress(dress.id));
    assert.equal(content.find(n=>n.attrs['data-rental-price']!==undefined)?.children[0],displayRentalPriceForDress(dress.id));
    assert.equal(content.find(n=>n.attrs.class==='redcarpert-detail-price-disclaimer')?.children[0],RENTAL_CONDITION_NOTE);
    const related=relatedDressesFor(dress);
    assert(related.every(r=>r.category===dress.category&&r.id!==dress.id));
    const relatedCards=content.filter(n=>n.attrs['data-related-dress']!==undefined);
    assert.deepEqual(relatedCards.map(n=>n.attrs['data-related-dress']),related.map(p=>p.id));
    for(const relatedDress of related){
      assert(content.some(n=>n.attrs['data-related-sale-price']===relatedDress.id &&
        n.children[0]===displaySalePriceForDress(relatedDress.id)));
      assert(content.some(n=>n.attrs['data-related-rental-price']===relatedDress.id &&
        n.children[0]===displayRentalPriceForDress(relatedDress.id)));
    }
    const fitting=content.find(n=>n.attrs['data-whatsapp-preview']!==undefined);
    assert.equal(fitting?.attrs['aria-label'],'Book a Fitting via WhatsApp');
    const message=dressFittingMessage(dress);
    assert(message.includes('*Dress:* '+dress.name));
    assert(message.includes('*Sale Price:* '+displaySalePriceForDress(dress.id)));
    assert(message.includes('*Rental Price Range:* '+displayRentalPriceForDress(dress.id)));
    assert(message.includes('*Collection:* '+catalogueCategories.find(c=>c.id===dress.category).name));
    assert(!/sample|stock photo|demonstration|provisional/i.test(message));
    assert(!content.some(n=>n.attrs.class==='tabs wc-tabs'||n.attrs.class==='related products'));
  }
  assert.equal(JSON.stringify(source),original,'client previews must never mutate the donor template');
});

test('published multi-photo gallery arrows anchor to the dress image at every responsive width',()=>{
  const css=readFileSync('src/components/ProductDetailPreview.css','utf8');
  assert.match(css,
    /#main-container \[data-detail-preview\] \.redcarpert-detail-photo-frame\[data-dress-frame\] \{\s*position:\s*relative;/,
    'the real data-dress-frame must establish the arrow positioning context');
  assert.match(css,
    /#main-container \[data-detail-preview\] \.redcarpert-gallery-arrow \{[\s\S]*?position:\s*absolute;[\s\S]*?top:\s*50%;[\s\S]*?transform:\s*translateY\(-50%\);/,
    'arrows must be vertically centred inside that photo frame');
  const gown=catalogueProducts.find(product=>product.id==='modern-tradition-03');
  assert(gown,'the approved Modern Tradition multi-photo dress must exist');
  const doc=createProductDetailPreview(sitePages['/product/arabella'],gown);
  const frame=find(doc.nodes,node=>node.attrs['data-dress-frame']==='true');
  assert(frame,'published page must use the CSS-anchored photo frame');
  assert.equal(frame.children.filter(node=>typeof node!=='string' &&
    (node.attrs['data-gallery-previous']!==undefined ||
     node.attrs['data-gallery-next']!==undefined)).length,2,
    'both navigation buttons must remain inside the photo frame');
});

test('all multi-photo client galleries retain every real photo in original dress order',()=>{
  const manifests=[clientMermaidDresses,clientBallGowns,clientRuffledDresses,clientTwoInOneDresses];
  let count=0;
  const urls=new Set();
  for(const manifest of manifests)for(const record of manifest){
    const dress=catalogueProducts.find(d=>d.id===record.id);
    assert(dress,'missing imported client dress '+record.id);
    const photos=photosForDress(dress);
    assert.deepEqual(photos,record.photos);
    assert.equal(photos[0].url,dress.image);
    const expectedIndex=photos.map((photo,i)=>String(i+1).padStart(2,'0'));
    for(const [i,photo] of photos.entries()){
      assert(new URL(photo.url).pathname.toLowerCase().endsWith('-'+expectedIndex[i]+'.webp'));
      assert(!urls.has(photo.url),'a client photograph cannot be assigned twice');
      urls.add(photo.url);
    }
    const doc=createProductDetailPreview(sitePages['/product/arabella'],dress);
    const gallery=find(doc.nodes,n=>n.attrs['data-detail-gallery']===dress.id);
    assert.equal(JSON.parse(gallery.attrs['data-gallery-photos']).length,photos.length);
    count+=photos.length;
  }
  assert.equal(count,183);
  assert.equal(urls.size,183);
  assert.equal(photosForDress(catalogueProducts.find(d=>d.id==='2-in-1-nthabiseng-dress')).length,16);
});

test('only client ImageKit galleries and valid matching dress photo filenames are accepted',()=>{
  assert.doesNotThrow(()=>validateDressGalleryMappings());
  const dress=catalogueProducts.find(p=>p.id==='ball-gown-07');
  assert(dress && photosForDress(dress).length===1);
  const prefix='https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-dresses/ball-gown-dresses/';
  const make=photo=>({[dress.id]:[photo]});
  const good={url:prefix+'ball-gown-07-02.webp',alt:'Closeup view of Ball Gown 07'};
  assert.doesNotThrow(()=>validateDressGalleryMappings(make(good)));
  assert.equal(photosForDress(dress,make(good)).length,2);
  assert.throws(()=>validateDressGalleryMappings({invalid:[good]}),/Unrecognized dress gallery ID/);
  assert.throws(()=>validateDressGalleryMappings(make({...good,url:'javascript:alert(1)'})),/Invalid gallery photo/);
  assert.throws(()=>validateDressGalleryMappings(make({...good,url:'https://images.pexels.com/photos/123/demo.jpeg'})),/Invalid gallery photo/);
  assert.throws(()=>validateDressGalleryMappings(make({...good,url:prefix+'ball-gown-08-02.webp'})),/belongs to a different dress/);
  assert.throws(()=>validateDressGalleryMappings(make({...good,alt:''})),/Invalid gallery photo/);
  assert.throws(()=>validateDressGalleryMappings({[dress.id]:[good,good]}),/Repeated gallery photograph/);
  assert.throws(()=>photosForDress(dress,make({...good,url:dress.image})),/belongs to a different dress|duplicates the primary photograph/);
});

test('legacy or mutated donor layouts and unrecognized client mappings fail closed',()=>{
  const dress=catalogueProducts.find(p=>p.id==='ball-gown-01');
  for(const mutate of [
    doc=>{doc.route='/product/other';},
    doc=>{find(doc.nodes,n=>n.attrs.id==='product-15828').children=[];},
    doc=>{find(doc.nodes,n=>n.attrs.class==='price').children=['£999'];},
    doc=>{find(doc.nodes,n=>n.attrs.class==='slider wpgis-slider-for').children=[];},
  ]){
    const donor=structuredClone(sitePages['/product/arabella']);
    mutate(donor);
    assert.throws(()=>createProductDetailPreview(donor,dress),/incompatible/);
  }
  for(const changes of [{id:'invented'},{previewRoute:'/product/arabella'},{image:'https://example.com/photo.jpg'}]){
    assert.throws(()=>createProductDetailPreview(sitePages['/product/arabella'],{...dress,...changes}),/incompatible/);
  }
});
