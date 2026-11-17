import test from "node:test";
import assert from "node:assert/strict";
import products from "../src/data/products.json" with { type: "json" };
import { catalogueProducts } from "../src/data/catalogue.ts";
import { priceForDress, displayDressPrice, displayPriceForDress, PRICE_CONDITION_DISCLAIMER } from "../src/lib/pricing.ts";
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

test("the pre-rendered 29-page Digital Lookbook has twenty-seven JSON-backed price slots", () => {
  const render = createNodeRenderer([]);
  const html = render({ tag: "div", attrs: { "data-lookbook-viewer": "true" }, children: [] });
  assert.equal((html.match(/data-book-page=/g) || []).length, 29);
  assert.equal((html.match(/data-book-price=/g) || []).length, 27);
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
  assert.equal((html.match(/class="redcarpert-book-dress"/g) || []).length, 0,
    "book dress classes may include additional class names");
  for (const product of catalogueProducts) {
    assert(html.includes('data-book-price="' + product.id + '"'));
    assert.equal(lookbookEntries.find(entry=>entry.id===product.id)?.priceDisplay,displayPriceForDress(product.id),
      'reader and generated book must share one authoritative price range');
    assert(html.includes(displayPriceForDress(product.id)));
    assert(html.includes(PRICE_CONDITION_DISCLAIMER));
  }
  assert.equal((html.match(/class="redcarpert-book-range-label"/g)||[]).length,27);
  assert(!html.includes("Price to be confirmed"),"all customer-facing book prices should show placeholder ranges");
  assert(!html.includes("R 0"), "never invent a zero-price dress");
});
