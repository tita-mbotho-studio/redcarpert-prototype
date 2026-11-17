import test from 'node:test';
import assert from 'node:assert/strict';
import { WHATSAPP_NUMBER, WHATSAPP_DISPLAY_NUMBER, buildWhatsAppUrl } from '../src/config/whatsapp.ts';
import { catalogueProducts,catalogueCategories } from '../src/data/catalogue.ts';
import { sampleFittingMessage } from '../src/lib/product-detail-preview.ts';
import { displayPriceForDress } from '../src/lib/pricing.ts';
import { dressPageUrl, generalFittingMessage } from '../src/lib/whatsapp-messages.ts';

test('client-authorized South African WhatsApp number is formatted correctly',()=>{
  assert.equal(WHATSAPP_NUMBER,'27680458811');
  assert.equal(WHATSAPP_DISPLAY_NUMBER,'+27 68 045 8811');
});

test('live WhatsApp link encodes the full multiline message and does not automatically send',()=>{
  const message='Hello Redcarpert Wedding Dresses!\n\nI would like a fitting for a Mermaid dress & a veil.';
  const url=new URL(buildWhatsAppUrl(message));
  assert.equal(url.protocol,'https:');
  assert.equal(url.hostname,'wa.me');
  assert.equal(url.pathname,'/27680458811');
  assert.deepEqual([...url.searchParams.keys()],['text']);
  assert.equal(url.searchParams.get('text'),message);
  assert.throws(()=>buildWhatsAppUrl('   '),/empty WhatsApp message/);
});

test('all 27 dress enquiries use one readable template and match published indicative ranges',()=>{
  assert.equal(catalogueProducts.length,27);
  for(const dress of catalogueProducts){
    const message=sampleFittingMessage(dress);
    const url=new URL(buildWhatsAppUrl(message));
    assert.equal(url.searchParams.get('text'),message);
    const name=dress.status==='client'?dress.name:dress.name.replace(/^Sample /,'Look ');
    const category=catalogueCategories.find(c=>c.id===dress.category);
    assert(category);
    assert(message.includes('*Dress:* '+name),dress.id+' missing dress name');
    assert(message.includes('*Collection:* '+category.name),dress.id+' missing category');
    assert(message.includes('*Indicative price range:* '+displayPriceForDress(dress.id,dress.priceZar)),
      dress.id+' missing or incorrect indicative price');
    assert(message.includes('*Dress link:* '+dressPageUrl(dress)),dress.id+' missing dress link');
    assert(message.includes('the final price'),dress.id+' must request price confirmation');
    assert(message.includes('whether this dress or a similar style is available'),
      dress.id+' must not assume a gown is in stock');
    assert(!message.includes('inspiration collection'),dress.id+' should not have a separate inspiration-only message');
  }
});

test('general enquiry is reused across all non-dress actions',()=>{
  const message=generalFittingMessage();
  assert(message.includes('book a fitting'));
  assert(message.includes('available appointment dates'));
  assert.equal(new URL(buildWhatsAppUrl(message)).searchParams.get('text'),message);
});
