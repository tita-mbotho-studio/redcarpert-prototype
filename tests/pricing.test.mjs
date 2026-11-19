import test from 'node:test';
import assert from 'node:assert/strict';
import products from '../src/data/products.json' with {type:'json'};
import {catalogueProducts} from '../src/data/catalogue.ts';
import {
  priceForDress,displayDressPrice,displayPriceForDress,salePriceForDress,
  rentalPriceRangeForDress,displaySalePriceForDress,displayRentalPriceForDress,
  salePriceLabelForDress,RENTAL_CONDITION_NOTE
} from '../src/lib/pricing.ts';
import {createNodeRenderer} from '../scripts/lib/markup.ts';
import {lookbookEntries} from '../src/client/lookbook.js';

test('all 51 dresses have editable positive fixed sale and ascending rental prices',()=>{
  assert.equal(products.currency,'ZAR');
  assert.equal(products.priceStatus,'draft');
  assert.equal(products.rentalPriceStatus,'draft');
  assert.equal(products.priceApproval,'pending-client-review');
  assert.equal(products.dresses.length,51);
  assert.equal(new Set(products.dresses.map(d=>d.id)).size,51);
  assert.deepEqual(products.dresses.map(d=>d.id).sort(),catalogueProducts.map(p=>p.id).sort());
  assert.equal(products.dresses.filter(d=>d.id.startsWith('ball-gown-')).length,12);
  assert.equal(Object.keys(products.priceRangesZar).length,51,'keep legacy data separate');
  for(const d of products.dresses){
    assert(Number.isSafeInteger(d.priceZar)&&d.priceZar>0,d.id+' needs a fixed sale price');
    const r=d.rentalPriceRangeZar;
    assert(Number.isSafeInteger(r?.minZar)&&r.minZar>0,d.id+' missing rental minimum');
    assert(Number.isSafeInteger(r?.maxZar)&&r.maxZar>r.minZar,d.id+' invalid rental range');
    assert.equal(priceForDress(d.id),d.priceZar);
    assert.equal(salePriceForDress(d.id),d.priceZar);
    assert.deepEqual(rentalPriceRangeForDress(d.id),r);
    assert.equal(displaySalePriceForDress(d.id),displayDressPrice(d.priceZar));
    assert.equal(displayRentalPriceForDress(d.id),displayDressPrice(r));
    assert.equal(salePriceLabelForDress(d.id),'Sale Price');
    assert.match(displaySalePriceForDress(d.id),/^R /);
    assert.match(displayRentalPriceForDress(d.id),/^R .* – R /);
    assert.notEqual(displayPriceForDress(d.id),displayRentalPriceForDress(d.id),
      'legacy illustrative range must not be copied as a rental amount');
  }
  for(const fn of [priceForDress,salePriceForDress,rentalPriceRangeForDress]){
    assert.throws(()=>fn('missing-gown'),/missing price|missing rental/);
  }
});

test('rand amounts format cleanly and reject invalid values',()=>{
  assert.equal(displayDressPrice(12500).replace(/\s/g,' '),'R 12 500');
  assert.equal(displayDressPrice({minZar:4200,maxZar:6900}).replace(/\s/g,' '),'R 4 200 – R 6 900');
  for(const value of [-1,0,12.5,NaN,Infinity])assert.throws(()=>displayDressPrice(value),/Invalid wedding dress price/);
  assert.throws(()=>displayDressPrice({minZar:7000,maxZar:4000}),/Invalid wedding dress price range/);
});

test('digital lookbook contains the same labelled fixed sale and rental prices as all dress pages',()=>{
  const render=createNodeRenderer([]);
  const html=render({tag:'div',attrs:{'data-lookbook-viewer':'true'},children:[]});
  assert.equal((html.match(/data-book-page=/g)||[]).length,53);
  assert.equal((html.match(/data-book-sale-price=/g)||[]).length,51);
  assert.equal((html.match(/data-book-rental-price=/g)||[]).length,51);
  assert.equal((html.match(/data-book-sale-label=/g)||[]).length,51);
  assert.equal((html.match(/class="redcarpert-book-price-pair"/g)||[]).length,51);
  assert.equal((html.match(/class="redcarpert-book-condition-note"/g)||[]).length,51);
  assert.equal(html.split(RENTAL_CONDITION_NOTE).length-1,51);
  assert.equal(lookbookEntries.length,51);
  const cover=html.match(/<article class="redcarpert-book-page redcarpert-book-cover[^"]*"[^>]*>[\s\S]*?<\/article>/)?.[0];
  assert(cover&&cover.includes('Walking on red carpet with confidence'));
  assert.equal((cover.match(/<img /g)||[]).length,1);
  for(const p of catalogueProducts){
    const entry=lookbookEntries.find(e=>e.id===p.id);
    assert(entry);
    assert.equal(entry.salePriceDisplay,displaySalePriceForDress(p.id));
    assert.equal(entry.rentalPriceDisplay,displayRentalPriceForDress(p.id));
    assert.equal(entry.salePriceLabel,'Sale Price');
    assert(html.includes('data-book-sale-price="'+p.id+'">'+entry.salePriceDisplay+'</p>'));
    assert(html.includes('data-book-rental-price="'+p.id+'">'+entry.rentalPriceDisplay+'</p>'));
    assert(html.includes('data-book-sale-label="'+p.id+'">Sale Price</span>'));
  }
  assert.doesNotMatch(html,/data-book-price=|Indicative range|Example range|Inspiration photo|To be confirmed|price disclaimer/i);
  assert(!html.includes('R 0'));
});
