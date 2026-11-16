import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePage } from '../scripts/lib/prepare-page.ts';
import { catalogueProducts } from '../src/data/catalogue.ts';
import { sampleFittingMessage } from '../src/lib/product-detail-preview.ts';
import { buildWhatsAppUrl } from '../src/config/whatsapp.ts';
import { directWhatsAppHandoffs } from '../src/lib/direct-whatsapp.ts';

const all = nodes => nodes.flatMap(node => typeof node === 'string' ? [] : [node,...all(node.children)]);

test('every approved page converts all on-site enquiry previews to native WhatsApp links',()=>{
  for(const route of ['/','/product','/contact-us','/about-us','/wedding-moments','/digital-lookbook',
    '/product-category/ball_gown',...catalogueProducts.map(item=>item.previewRoute)]){
    const {document,product}=preparePage(route);
    const before=JSON.stringify(document);
    const message=product?sampleFittingMessage(product):
      'Hello Redcarpert Wedding Dresses!\n\nI would like to enquire about your wedding dresses and arrange a fitting.\n\nCould you please provide more information?\n\nThank you.';
    const href=buildWhatsAppUrl(message);
    const updated=directWhatsAppHandoffs(document,href);
    const oldControls=all(document.nodes).filter(node=>Object.hasOwn(node.attrs,'data-whatsapp-preview'));
    const direct=all(updated.nodes).filter(node=>Object.hasOwn(node.attrs,'data-whatsapp-send'));
    assert(oldControls.length>=3,route+' must have at least footer, social and floating CTAs');
    assert.equal(direct.length,oldControls.length,route+' must convert every enquiry control');
    assert.equal(all(updated.nodes).filter(node=>Object.hasOwn(node.attrs,'data-whatsapp-preview')).length,0);
    for(const control of direct){
      assert.equal(control.tag,'a');
      assert.equal(control.attrs.href,href);
      assert.equal(control.attrs.target,'_blank');
      assert.equal(control.attrs.rel,'noopener noreferrer');
      assert.equal(control.attrs['aria-haspopup'],undefined);
      assert.equal(control.attrs.type,undefined);
    }
    assert.equal(JSON.stringify(document),before,'conversion must never mutate source document');
    assert.equal(new URL(href).searchParams.get('text'),message);
    if(product)assert(message.includes(product.name),route+' missing specific dress');
  }
});

test('rejects invalid WhatsApp destinations and unexpected preview widgets',()=>{
  const {document}=preparePage('/');
  for(const href of [
    'http://wa.me/27680458811?text=Hello',
    'https://wa.me/27680458812?text=Hello',
    'https://example.org/27680458811?text=Hello',
    'https://wa.me/27680458811',
  ]) assert.throws(()=>directWhatsAppHandoffs(document,href),/Invalid Redcarpert WhatsApp/);
  const changed=structuredClone(document);
  const control=all(changed.nodes).find(node=>Object.hasOwn(node.attrs,'data-whatsapp-preview'));
  assert(control);
  control.attrs['aria-haspopup']='menu';
  assert.throws(()=>directWhatsAppHandoffs(changed,buildWhatsAppUrl('Hello')),/Unexpected WhatsApp preview/);
});
