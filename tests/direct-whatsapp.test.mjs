import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePage } from '../scripts/lib/prepare-page.ts';
import { catalogueProducts } from '../src/data/catalogue.ts';
import { sampleFittingMessage, sampleDetailTitle } from '../src/lib/product-detail-preview.ts';
import { buildWhatsAppUrl } from '../src/config/whatsapp.ts';
import { directWhatsAppHandoffs } from '../src/lib/direct-whatsapp.ts';
import { createNodeRenderer } from '../scripts/lib/markup.ts';

const all = nodes => nodes.flatMap(node => typeof node === 'string' ? [] : [node,...all(node.children)]);

test('every approved page converts all on-site enquiry previews to native WhatsApp links',()=>{
  for(const route of ['/','/product','/contact-us','/about-us','/wedding-moments','/digital-lookbook',
    '/product-category/ball_gown',...catalogueProducts.map(item=>item.previewRoute)]){
    const {document,product}=preparePage(route);
    const before=JSON.stringify(document);
    const message=product?sampleFittingMessage(product):
      'Hello Redcarpert Wedding Dresses!\n\nI would like to ask about your wedding dresses and book a fitting. Could you please help me?\n\nThank you.';
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
    if(product)assert(message.includes(sampleDetailTitle(product)),route+' missing specific dress');
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

test('static HTML renderer preserves real WhatsApp hrefs on footer, floating and dress controls',()=>{
  const render=createNodeRenderer([]);
  for(const route of ['/','/product/preview/sample-01-mermaid','/product/preview/ball-gown-02']){
    const {document,product}=preparePage(route);
    const message=product?sampleFittingMessage(product):
      'Hello Redcarpert Wedding Dresses!\n\nI would like to ask about your wedding dresses and book a fitting. Could you please help me?\n\nThank you.';
    const href=buildWhatsAppUrl(message);
    const converted=directWhatsAppHandoffs(document,href);
    const links=all(converted.nodes).filter(node=>node.attrs['data-whatsapp-send']==='');
    assert(links.length>=3,route+' expected several native WhatsApp controls');
    for(const link of links){
      const html=render(link);
      assert(html.includes('href="'+href.replaceAll('&','&amp;')+'"'),route+' lost WhatsApp href during rendering');
      assert(html.includes('data-whatsapp-send=""'),route+' lost approved direct-link marker');
      assert(html.includes('target="_blank"'),route+' lost safe external target');
      assert(!html.includes('data-whatsapp-preview'),route+' unexpectedly recreated the on-site preview');
    }
  }
});

test('renderer still blocks unapproved captured WhatsApp links',()=>{
  const render=createNodeRenderer([]);
  const html=render({tag:'a',attrs:{href:'https://wa.me/27680458811?text=Hello'},children:['Legacy reference']});
  assert(!html.includes('href='),'unmarked legacy WhatsApp links must not become clickable');
  assert(html.includes('data-whatsapp-preview=""'),'legacy safety guard must remain in place');
});
