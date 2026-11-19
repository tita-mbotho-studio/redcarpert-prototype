import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueProducts, catalogueCategories } from '../src/data/catalogue.ts';
import { modernTraditionPages } from '../src/lib/modern-tradition.ts';
import { lookbookPlacements } from '../src/lib/lookbook-placements.ts';

test('both books derive all five collections from a single ordered catalogue view', () => {
  const placements=lookbookPlacements(catalogueProducts);
  assert.equal(catalogueProducts.length,47);
  assert.equal(placements.length,51);
  assert.equal(new Set(placements.map(p=>p.id)).size,51);
  assert.equal(new Set(placements.map(p=>p.product.id)).size,47);
  const categories=[...new Set(placements.map(p=>p.category))];
  assert.deepEqual(categories,catalogueCategories.map(c=>c.id));
  assert.deepEqual(catalogueCategories.map(category=>
    placements.filter(p=>p.category===category.id).length),[2,12,12,4,21]);
  let index=0;
  for(const category of catalogueCategories){
    const group=placements.filter(p=>p.category===category.id);
    assert(group.length>0);
    assert.deepEqual(placements.slice(index,index+group.length),group,
      category.id+' must occupy one continuous section');
    index+=group.length;
  }
});

test('Modern Tradition has four separate book appearances but no duplicate product records', () => {
  const placements=lookbookPlacements(catalogueProducts);
  const features=placements.filter(p=>p.isModernTradition);
  assert.equal(features.length,4);
  assert.deepEqual(features.map(p=>p.displayName),[
    'Modern Tradition 01','Modern Tradition 02','Modern Tradition 03','Modern Tradition 04']);
  assert.deepEqual(features.map(p=>p.id),[
    'modern-tradition-01','modern-tradition-02','modern-tradition-03','modern-tradition-04']);
  assert.deepEqual(features.map(p=>p.detailRoute),modernTraditionPages.map(page=>page.route));
  assert.deepEqual(features.map(p=>p.product.id),modernTraditionPages.map(page=>page.product.id));
  for(const feature of features){
    const original=placements.find(p=>p.id===feature.product.id);
    assert(original && !original.isModernTradition);
    assert.strictEqual(feature.product,original.product,
      'both appearances must use the same canonical client dress, photo and price');
    assert.equal(original.detailRoute,feature.product.previewRoute);
    assert.notEqual(feature.detailRoute,original.detailRoute);
  }
  assert.equal(placements.length+2,53,'interactive book leaf count');
  assert.equal(placements.length+catalogueCategories.length+7,63,'A4 editorial page count');
});
