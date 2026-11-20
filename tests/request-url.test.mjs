import test from 'node:test';
import assert from 'node:assert/strict';
import { localRequestPath } from '../scripts/lib/request-url.ts';

test('Vite URLs preserve approved base paths and query-independent matching', () => {
  assert.equal(localRequestPath('/redcarpert-wedding-dresses/'),'/');
  assert.equal(localRequestPath('/redcarpert-wedding-dresses/digital-lookbook/'),'/digital-lookbook/');
  assert.equal(localRequestPath('/redcarpert-wedding-dresses/product?orderby=date'),'/product');
  assert.equal(localRequestPath('/@vite/client'),'/@vite/client');
  assert.equal(localRequestPath('/redcarpert-wedding-dresses2/'),'/redcarpert-wedding-dresses2/');
});

test('malformed and traversal requests fail closed without throwing', () => {
  for (const value of ['/%','/%ZZ','/%E0%A4%A','/redcarpert-wedding-dresses/%2E%2E/private','/redcarpert-wedding-dresses/../secret','/redcarpert-wedding-dresses/%00','/redcarpert-wedding-dresses/%5Cetc']) {
    assert.equal(localRequestPath(value),null,value);
  }
});
