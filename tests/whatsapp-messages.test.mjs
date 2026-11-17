import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueProducts, catalogueCategories } from '../src/data/catalogue.ts';
import { displaySalePriceForDress, displayRentalPriceForDress, salePriceForDress } from '../src/lib/pricing.ts';
import { generalFittingMessage, dressFittingMessage, dressPageUrl } from '../src/lib/whatsapp-messages.ts';
import { sampleFittingMessage } from '../src/lib/product-detail-preview.ts';
import { buildWhatsAppUrl } from '../src/config/whatsapp.ts';

test('general fitting enquiries are grammatical, readable and use one shared source', () => {
  const message=generalFittingMessage();
  assert.equal(message, [
    'Hello Redcarpert Wedding Dresses,',
    '',
    'I would like to enquire about your wedding dress collections and book a fitting.',
    '',
    'Could you please share your available appointment dates and explain how the fitting process works?',
    '',
    'Thank you.',
  ].join('\n'));
  assert(!message.includes('\n\n\n'),'avoid excessive blank space');
  assert.equal(new URL(buildWhatsAppUrl(message)).searchParams.get('text'), message,
    'WhatsApp must receive the original line breaks and punctuation');
});

test('every one of the 27 dresses uses the SAME neutral and accurately priced enquiry', () => {
  assert.equal(catalogueProducts.length,27);
  for(const product of catalogueProducts){
    const message=dressFittingMessage(product);
    const category=catalogueCategories.find(c=>c.id===product.category);
    const dressName=product.status==='client' ? product.name : product.name.replace(/^Sample /,'Look ');
    assert(category);
    assert.equal(sampleFittingMessage(product),message,'legacy route must use one shared template');
    assert(message.startsWith('Hello Redcarpert Wedding Dresses,\n\n'));
    assert(message.endsWith('\n\nThank you.'));
    assert(!message.includes('\n\n\n'),'avoid excessive whitespace');
    assert(message.includes('*Dress:* '+dressName),product.id+' missing dress label');
    assert(message.includes('*Collection:* '+category.name),product.id+' missing category');
    assert(message.includes('*'+(salePriceForDress(product.id)===null?'Sale price':'Example sale price')+':* '+displaySalePriceForDress(product.id)),
      product.id+' must match the example sale price or its pending state');
    assert(message.includes('*Rental price range:* '+displayRentalPriceForDress(product.id)),
      product.id+' must show rental price as pending');
    assert(message.includes('*Dress link:* '+dressPageUrl(product)));
    assert.equal((message.match(/\*Rental price range:\*/g)||[]).length,1);
    assert(message.includes('the final sale price'),'the business must confirm final prices');
    assert(message.includes('not a final quotation'),'example prices require a clear disclaimer');
    assert(message.includes('available sizes'));
    assert(message.includes('fitting appointment dates'));
    assert(message.includes('new or pre-owned'));
    assert(!/inspiration collection|inspiration photo|confirmed in stock|is in stock/i.test(message),
      product.id+' must not introduce a different inspiration-specific message or make stock claims');
    const url=new URL(buildWhatsAppUrl(message));
    assert.equal(url.origin,'https://wa.me');
    assert.equal(url.searchParams.size,1);
    assert.equal(url.searchParams.get('text'),message,'URL encoding must preserve newlines and prices');
  }
});

test('dress links use the public Pages path and preserve the same dress reference',()=>{
  for(const product of catalogueProducts){
    const url=new URL(dressPageUrl(product));
    assert.equal(url.origin,'https://tita-mbotho-studio.github.io');
    assert.equal(url.pathname,'/redcarpert-prototype'+product.previewRoute+'/');
    assert(!url.search && !url.hash);
  }
});
