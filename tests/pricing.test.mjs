import test from "node:test";
import assert from "node:assert/strict";
import products from "../src/data/products.json" with { type: "json" };
import { catalogueProducts } from "../src/data/catalogue.ts";
import { priceForDress, displayDressPrice, displayPriceForDress, PRICE_CONDITION_DISCLAIMER, SALE_RENTAL_DISCLAIMER, LOOKBOOK_PRICING_DISCLAIMER, PRICE_PENDING_LABEL, salePriceForDress, salePriceLabelForDress, rentalPriceRangeForDress, displaySalePriceForDress, displayRentalPriceForDress } from "../src/lib/pricing.ts";
import { createNodeRenderer } from "../scripts/lib/markup.ts";
import { lookbookEntries } from "../src/client/lookbook.js";

test("central products.json has one ZAR price slot per approved dress", () => {
  assert.equal(products.currency, "ZAR");
  assert.equal(products.priceStatus, "mixed");
  assert.equal(products.priceRangeStatus, "illustrative");
  assert.equal(products.dresses.length, 27);
  assert.equal(typeof products.priceRangesZar, "object");
  assert(products.priceRangesZar !== null);
  assert.equal(Object.keys(products.priceRangesZar).length, 27);
  for(const range of Object.values(products.priceRangesZar)) {
    assert(Number.isSafeInteger(range.minZar) && range.minZar > 0);
    assert(Number.isSafeInteger(range.maxZar) && range.maxZar > range.minZar);
  }
  const ids = products.dresses.map(dress => dress.id);
  assert.equal(new Set(ids).size, 27);
  assert.deepEqual([...ids].sort(), catalogueProducts.map(dress => dress.id).sort());
  for (const product of catalogueProducts) {
    assert.equal(product.priceZar, priceForDress(product.id));
    assert(product.priceZar === null || (Number.isSafeInteger(product.priceZar) && product.priceZar > 0),
      "prices must be unassigned or positive whole-rand amounts");
  }
  assert.throws(() => priceForDress("unknown-dress"), /missing price/);
});

test("sale and rental prices remain distinct, with unsupplied rental ranges pending", () => {
  assert.equal(products.dresses.length,27);
  assert.equal(products.dresses.filter(x=>x.priceZar!==null).length,16);
  assert.equal(products.dresses.filter(x=>x.priceZar===null).length,11);
  assert.match(SALE_RENTAL_DISCLAIMER,/examples only/);
  assert.match(SALE_RENTAL_DISCLAIMER,/rental prices/i);
  assert.match(SALE_RENTAL_DISCLAIMER,/new or pre-owned/i);
  for(const record of products.dresses){
    assert(Object.hasOwn(record,'rentalPriceRangeZar'));
    assert.equal(record.rentalPriceRangeZar,null,'no rental prices may be invented');
    assert.equal(salePriceForDress(record.id),record.priceZar);
    assert.equal(rentalPriceRangeForDress(record.id),null);
    assert.equal(displayRentalPriceForDress(record.id),PRICE_PENDING_LABEL);
    assert.equal(displaySalePriceForDress(record.id),
      record.priceZar===null?PRICE_PENDING_LABEL:displayDressPrice(record.priceZar));
    assert.notEqual(displayPriceForDress(record.id),displayRentalPriceForDress(record.id),
      'legacy lookbook indicative range is NOT a rental price');
  }
  assert.throws(()=>rentalPriceRangeForDress('unknown-dress'),/missing rental price/);
  assert.throws(()=>salePriceForDress('unknown-dress'),/missing price/);
});

test("price formatting works for unassigned and verified integer ZAR prices", () => {
  assert.equal(displayDressPrice(null), "Price to be confirmed");
  assert.equal(displayDressPrice(12500).replace(/\s/g, " "), "R 12 500");
  assert.equal(displayDressPrice(950).replace(/\s/g, " "), "R 950");
  assert.equal(displayDressPrice({minZar:12500,maxZar:18900}).replace(/\s/g, " "), "R 12 500 – R 18 900");
  assert.throws(() => displayDressPrice({minZar:20000,maxZar:15000}),/Invalid wedding dress price range/);
  assert.match(PRICE_CONDITION_DISCLAIMER,/new or pre-owned/);
  for(const record of products.dresses) {
    const range=products.priceRangesZar[record.id];
    assert.equal(displayPriceForDress(record.id),displayDressPrice(range ?? record.priceZar));
  }
  for (const invalid of [0, -120, 100.25, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => displayDressPrice(invalid), /Invalid wedding dress price/);
  }
});

test("the 29-page Digital Lookbook includes example sale and pending rental prices on all 27 dress leaves", () => {
  const render = createNodeRenderer([]);
  const html = render({ tag: "div", attrs: { "data-lookbook-viewer": "true" }, children: [] });
  assert.equal((html.match(/data-book-page=/g) || []).length, 29);
  assert.equal((html.match(/data-book-sale-price=/g) || []).length, 27);
  assert.equal((html.match(/data-book-rental-price=/g) || []).length, 27);
  assert.equal((html.match(/data-book-sale-label=/g) || []).length, 27);
  assert.equal((html.match(/class="redcarpert-book-price-pair"/g) || []).length, 27);
  assert.equal(lookbookEntries.length,27);
  const cover=html.match(/<article class="redcarpert-book-page redcarpert-book-cover[^"]*"[^>]*>[\s\S]*?<\/article>/)?.[0];
  assert(cover,'book cover missing');
  assert.equal((cover.match(/<img /g)||[]).length,1,'cover must contain the Redcarpert logo only');
  assert.match(cover,/Walking on red carpet with confidence/);
  assert.match(cover,/redcarpert-book-cover-description/);
  assert.doesNotMatch(cover,/images\.pexels|redcarpert-book-cover-photo/);
  assert.equal((html.match(/class="redcarpert-book-photo"/g)||[]).length,27);
  assert.equal((html.match(/class="redcarpert-book-copy"/g)||[]).length,27);
  assert.equal((html.match(/<h3>Look \d{2}<\/h3>/g)||[]).length,16);
  assert.equal((html.match(/<h3>Ball Gown \d{2}<\/h3>/g)||[]).length,11);
  for (const product of catalogueProducts) {
    const entry=lookbookEntries.find(item=>item.id===product.id);
    assert(entry,'every catalogue dress must appear in the digital book');
    const sale=displaySalePriceForDress(product.id);
    const rental=displayRentalPriceForDress(product.id);
    const label=salePriceLabelForDress(product.id);
    assert.equal(entry.salePriceDisplay,sale);
    assert.equal(entry.rentalPriceDisplay,rental);
    assert.equal(entry.salePriceLabel,label);
    assert(html.includes('data-book-sale-price="'+product.id+'">'+sale+'</p>'),product.id+' sale mismatch');
    assert(html.includes('data-book-rental-price="'+product.id+'">'+rental+'</p>'),product.id+' rental mismatch');
    assert(html.includes('data-book-sale-label="'+product.id+'">'+label+'</span>'),product.id+' sale label mismatch');
  }
  assert.equal((html.match(/class="redcarpert-book-condition-note"/g)||[]).length,27);
  assert(html.includes(LOOKBOOK_PRICING_DISCLAIMER));
  assert.equal((html.match(/To be confirmed/g)||[]).length,27+11,
    '27 rentals and 11 unpriced sale gowns must show To be confirmed');
  assert(!html.includes("data-book-price="),'legacy single-range price must not be displayed');
  assert(!html.includes("redcarpert-book-range-label"));
  assert(!html.includes("R 0"),"never invent a zero-price dress");
});
