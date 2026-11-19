import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueProducts, catalogueCategories } from '../src/data/catalogue.ts';
import { modernTraditionPages } from '../src/lib/modern-tradition.ts';
import { lookbookPlacements } from '../src/lib/lookbook-placements.ts';

test('both books include all 51 unique catalogue dresses grouped into five collections', () => {
  const placements=lookbookPlacements(catalogueProducts);
  assert.equal(catalogueProducts.length,51);
  assert.equal(placements.length,51);
  assert.equal(new Set(placements.map(p=>p.id)).size,51);
  assert.equal(new Set(placements.map(p=>p.product.id)).size,51);
  assert.deepEqual([...new Set(placements.map(p=>p.category))],
    catalogueCategories.map(c=>c.id));
  assert.deepEqual(catalogueCategories.map(category=>
    placements.filter(p=>p.category===category.id).length),[2,12,12,4,21]);
  let index=0;
  for(const category of catalogueCategories){
    const group=placements.filter(p=>p.category===category.id);
    assert.deepEqual(placements.slice(index,index+group.length),group,
      category.id+' must occupy one continuous section');
    for(const placement of group){
      assert.equal(placement.id,placement.product.id);
      assert.equal(placement.detailRoute,placement.product.previewRoute);
      assert.equal(placement.category,placement.product.category);
      assert.equal(placement.displayName,placement.product.name);
    }
    index+=group.length;
  }
});

test('Modern Tradition has four separate dress identities and individual detail links', () => {
  const placements=lookbookPlacements(catalogueProducts);
  const features=placements.filter(p=>p.isModernTradition);
  assert.equal(features.length,4);
  assert.deepEqual(features.map(p=>p.displayName),[
    'Modern Tradition 01','Modern Tradition 02','Modern Tradition 03','Modern Tradition 04']);
  assert.deepEqual(features.map(p=>p.id),[
    'modern-tradition-01','modern-tradition-02','modern-tradition-03','modern-tradition-04']);
  assert.deepEqual(features.map(p=>p.detailRoute),modernTraditionPages.map(page=>page.route));
  for(const feature of features){
    const source=placements.find(p=>p.id===feature.product.sourceDressId);
    assert(source && !source.isModernTradition);
    assert.notEqual(feature.id,source.id);
    assert.notEqual(feature.detailRoute,source.detailRoute);
    assert.equal(feature.product.image,source.product.image,'reuse approved client image URL');
    assert.notStrictEqual(feature.product,source.product,'independent product identity');
  }
  assert.equal(placements.length+2,53,'interactive book leaf count');
  assert.equal(placements.length+catalogueCategories.length+7,63,'A4 editorial page count');
  assert.throws(()=>lookbookPlacements([...catalogueProducts,catalogueProducts[0]]),/duplicate dress IDs/);
});
