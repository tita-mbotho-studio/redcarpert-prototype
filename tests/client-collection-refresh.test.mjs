import assert from 'node:assert/strict';
import test from 'node:test';
import imageLinks from '../src/data/image-links.json' with {type:'json'};
import ballGowns from '../src/data/client-ball-gowns.json' with {type:'json'};
import ruffled from '../src/data/client-ruffled-dresses.json' with {type:'json'};
import prices from '../src/data/products.json' with {type:'json'};
import { catalogueProducts } from '../src/data/catalogue.ts';
import { mediaDeliveryUrl } from '../src/lib/media-delivery.ts';
import { photosForDress, validateDressGalleryMappings } from '../src/lib/dress-gallery.ts';

const root = 'https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses';

test('updated homepage originals and ImageKit hero optimizations keep all three supplied revisions',()=>{
  const versions=['1794955340352','1794955340262','1794955340871'];
  assert.equal(imageLinks.home_page.hero.length,3);
  for (const [index,photo] of imageLinks.home_page.hero.entries()) {
    const name='home-page-'+(index+1);
    const url=new URL(photo.url);
    assert.equal(photo.id,name);
    assert.equal(url.origin+url.pathname,root+'/home-page/'+name+'.webp');
    assert.equal(url.searchParams.get('updatedAt'),versions[index]);
    assert.equal(url.searchParams.size,1);
    const delivered=new URL(mediaDeliveryUrl(photo.url,'hero'));
    assert.equal(delivered.searchParams.get('updatedAt'),versions[index]);
    assert(delivered.searchParams.has('tr'));
  }
});

test('the eleven Ball Gowns and twelve Ruffled dresses have 65 unique correctly mapped photos',()=>{
  const families=[
    {records:ballGowns,group:'ball-gown-dresses',prefix:'ball-gown',label:'Ball Gown',
     expected:[3,3,4,1,4,2,1,1,4,1,3],total:27},
    {records:ruffled,group:'ruffled-dresses',prefix:'ruffled-dress',label:'Ruffled Dress',
     expected:[2,1,3,3,3,2,2,4,9,2,6,1],total:38},
  ];
  const urls=new Set();
  for(const family of families){
    assert.equal(family.records.length,family.expected.length);
    assert.equal(family.records.reduce((sum,r)=>sum+r.photos.length,0),family.total);
    assert.deepEqual(family.records.map(r=>r.photos.length),family.expected);
    for(const [index,dress] of family.records.entries()){
      const num=String(index+1).padStart(2,'0');
      const id=family.prefix+'-'+num;
      assert.equal(dress.id,id);
      assert.equal(dress.name,family.label+' '+num);
      const product=catalogueProducts.find(item=>item.id===id);
      assert(product,'missing catalogue item '+id);
      assert.equal(product.status,'client');
      assert.equal(product.image,dress.photos[0].url);
      assert.equal(product.previewRoute,'/product/preview/'+id);
      assert.deepEqual(photosForDress(product),dress.photos);
      const photoIndexes=dress.photos.map(p=>Number(p.url.match(/-(\d{2})\.webp/)?.[1]));
      assert.deepEqual(photoIndexes,[...photoIndexes].sort((a,b)=>a-b),
        id+' photographs must be ordered by filename number');
      for(const [photoIndex,photo] of dress.photos.entries()){
        const src=new URL(photo.url);
        const expected=root+'/wedding-dresses/'+family.group+'/'+id+'-'+
          String(photoIndexes[photoIndex]).padStart(2,'0')+'.webp';
        assert.equal(src.origin+src.pathname,expected);
        assert.match(src.searchParams.get('updatedAt'),/^\d{13}$/);
        assert.equal(src.searchParams.size,1);
        assert(photo.alt.includes(dress.name));
        assert(!urls.has(photo.url),'duplicate client photo '+photo.url);
        urls.add(photo.url);
        const delivered=new URL(mediaDeliveryUrl(photo.url,'detail'));
        assert.equal(delivered.pathname,src.pathname);
        assert.equal(delivered.searchParams.get('updatedAt'),src.searchParams.get('updatedAt'));
        assert(delivered.searchParams.has('tr'));
      }
    }
  }
  assert.equal(urls.size,65);
  assert.equal(ballGowns[3].photos.length,1);
  assert.match(ballGowns[3].photos[0].url,/ball-gown-04-02\.webp/);
  assert(![...urls].some(x=>x.includes('ball-gown-04-01.webp')),
    'do not invent the missing 04-01 file');
  assert.equal(ballGowns[2].photos.filter(x=>x.url.includes('ball-gown-03-04.webp')).length,1);
  assert.doesNotThrow(()=>validateDressGalleryMappings());
});

test('all 35 dresses keep consistent catalogue IDs, rental and sale prices',()=>{
  assert.equal(catalogueProducts.length,35);
  assert.equal(catalogueProducts.filter(x=>x.status==='client').length,23);
  assert.equal(catalogueProducts.filter(x=>x.category==='ruffled').length,12);
  assert.equal(catalogueProducts.filter(x=>x.category==='ball_gown').length,11);
  assert.equal(prices.dresses.length,35);
  assert.equal(Object.keys(prices.priceRangesZar).length,35);
  assert.deepEqual(catalogueProducts.map(x=>x.id).sort(),prices.dresses.map(x=>x.id).sort());
  assert.equal(new Set(catalogueProducts.map(x=>x.image)).size,35);
  assert.equal(imageLinks.products.ruffled.length,0);
  for(const dress of ruffled){
    const record=prices.dresses.find(item=>item.id===dress.id);
    assert(Number.isSafeInteger(record?.priceZar) && record.priceZar>0);
    assert(Number.isSafeInteger(record?.rentalPriceRangeZar.minZar));
    assert(record.rentalPriceRangeZar.maxZar>record.rentalPriceRangeZar.minZar);
  }
});
