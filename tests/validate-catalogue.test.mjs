import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueProducts } from '../src/data/catalogue.ts';
import { validateCatalogue } from '../src/lib/validate-catalogue.ts';

const sample = () => structuredClone(catalogueProducts);
test('approved sample catalogue validates without mutation', () => {
  const products = sample(), original = JSON.stringify(products);
  assert.doesNotThrow(() => validateCatalogue(products));
  assert.equal(JSON.stringify(products), original);
});
test('invalid IDs and duplicate product routes fail before generation', () => {
  assert.throws(() => validateCatalogue([...sample(), {...sample()[0]}]), /Duplicate or invalid product ID/);
  assert.throws(() => validateCatalogue([{...sample()[0],id:'../escape'}]), /Duplicate or invalid product ID/);
  assert.throws(() => validateCatalogue([{...sample()[0],id:'other',previewRoute:sample()[1].previewRoute},sample()[1]]), /Duplicate or invalid preview route/);
});
test('no invented inventory, unsafe external images, or unapproved categories', () => {
  const product=sample()[0];
  for (const change of [
    {status:'confirmed'}, {detailReference:'/live-dress'}, {image:'https://example.com/spy.webp'},
    {image:'/redcarpert/../outside.webp'}, {category:'other'}, {name:'  '}, {imageAlt:''},
  ]) assert.throws(() => validateCatalogue([{...product,...change}]), /Unverified inventory|Product image|Unapproved category|Missing product content/);
  assert.throws(() => validateCatalogue([]), /Catalogue cannot be empty/);
});
