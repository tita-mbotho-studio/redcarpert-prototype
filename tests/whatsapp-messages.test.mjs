import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueProducts, catalogueCategories } from '../src/data/catalogue.ts';
import { displaySalePriceForDress, displayRentalPriceForDress, RENTAL_CONDITION_NOTE } from '../src/lib/pricing.ts';
import { generalFittingMessage, dressFittingMessage, dressPageUrl } from '../src/lib/whatsapp-messages.ts';
import { sampleFittingMessage } from '../src/lib/product-detail-preview.ts';
import { buildWhatsAppUrl } from '../src/config/whatsapp.ts';

test('general fitting enquiries are grammatical, readable and use one shared source', () => {
  const message=generalFittingMessage();
  assert.equal(message, [
    'Hello Redcarpert Wedding Dresses,',
    '',
    'I would like to book a wedding dress fitting.',
    '',
    'Please share available fitting dates and times, and any information I need before my appointment.',
    '',
    'Thank you.',
  ].join('\n'));
  assert(!message.includes('\n\n\n'),'avoid excessive blank space');
  assert.equal(new URL(buildWhatsAppUrl(message)).searchParams.get('text'), message,
    'WhatsApp must receive the original line breaks and punctuation');
});

test('every one of the 51 dresses uses the SAME neutral and accurately priced enquiry', () => {
  assert.equal(catalogueProducts.length,51);
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
    assert(message.includes('*Sale Price:* '+displaySalePriceForDress(product.id)),
      product.id+' must match its fixed sale price');
    assert(message.includes('*Rental Price Range:* '+displayRentalPriceForDress(product.id)),
      product.id+' must show its full rental range');
    assert(message.includes('*Dress Link:* '+dressPageUrl(product)));
    assert.equal(message.split(RENTAL_CONDITION_NOTE).length-1,1,
      'dress enquiry must include the condition-based rental qualification once');
    assert.equal((message.match(/\*Rental Price Range:\*/g)||[]).length,1);
    assert(!/example|provisional|quotation|to be confirmed/i.test(message),
      'enquiry must not contain temporary pricing notices');
    assert(message.includes('available sizes'));
    assert(message.includes('fitting appointment dates'));
    assert(message.includes('before booking'));
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
