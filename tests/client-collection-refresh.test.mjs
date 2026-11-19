import assert from 'node:assert/strict';
import test from 'node:test';
import imageLinks from '../src/data/image-links.json' with {type:'json'};
import mermaid from '../src/data/client-mermaid-dresses.json' with {type:'json'};
import ballGowns from '../src/data/client-ball-gowns.json' with {type:'json'};
import twoInOne from '../src/data/client-two-in-one-dresses.json' with {type:'json'};
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

test('all four client dress CSV batches preserve every photo and ordered gown group',()=>{
  const families=[
    {records:mermaid,category:'mermaid',group:'mermaid-dresses',count:2,total:6,query:false},
    {records:ballGowns,category:'ball_gown',group:'ball-gown-dresses',count:12,total:34,query:true},
    {records:ruffled,category:'ruffled',group:'ruffled-dresses',count:17,total:65,query:false},
    {records:twoInOne,category:'two_in_one',group:'2-in-1-dresses',count:21,total:105,query:false},
  ];
  const urls=new Set();
  for(const family of families){
    assert.equal(family.records.length,family.count);
    assert.equal(family.records.reduce((n,x)=>n+x.photos.length,0),family.total);
    for(const dress of family.records){
      const product=catalogueProducts.find(item=>item.id===dress.id);
      assert(product,'missing client dress '+dress.id);
      assert(!Object.hasOwn(product,'status'));
      assert.equal(product.category,family.category);
      assert.equal(product.name,dress.name);
      assert.equal(product.image,dress.photos[0].url);
      assert.equal(product.previewRoute,'/product/preview/'+dress.id);
      assert.deepEqual(photosForDress(product),dress.photos);
      const indexes=dress.photos.map(p=>Number(new URL(p.url).pathname.match(/-([0-9]{2})[.]webp$/)?.[1]));
      assert.deepEqual(indexes,Array.from({length:dress.photos.length},(_,i)=>i+1),
        dress.id+' must start with image -01 and retain all angles in numeric order');
      for(const photo of dress.photos){
        const url=new URL(photo.url);
        assert.equal(url.hostname,'ik.imagekit.io');
        assert(url.pathname.toLowerCase().startsWith('/kw8awoqvwi/red-carpet-wedding-dresses/wedding-dresses/'+family.group+'/'));
        assert(photo.alt.includes(dress.name));
        if(family.query) assert.match(url.searchParams.get('updatedAt'),/^\d{13}$/);
        else assert.equal(url.search,'');
        assert(!urls.has(photo.url),'client photograph duplicated: '+photo.url);
        urls.add(photo.url);
        const delivered=new URL(mediaDeliveryUrl(photo.url,'detail'));
        assert.equal(delivered.pathname,url.pathname);
        assert.equal(delivered.searchParams.get('updatedAt'),url.searchParams.get('updatedAt'));
        assert(delivered.searchParams.has('tr'));
      }
    }
  }
  assert.equal(urls.size,210);
  assert.equal(ballGowns[3].photos.length,5);
  assert.match(ballGowns[3].photos[0].url,/ball-gown-04-01[.]webp/);
  assert.equal(twoInOne.find(x=>x.id==='2-in-1-nthabiseng-dress').photos.length,16);
  assert.doesNotThrow(()=>validateDressGalleryMappings());
});

test('the 56-dress catalogue and editable ZAR pricing stay synchronized',()=>{
  assert.equal(catalogueProducts.length,56);
  assert(catalogueProducts.every(x=>!Object.hasOwn(x,'status')));
  assert.deepEqual(Object.fromEntries(['mermaid','ball_gown','ruffled','modern_tradition','two_in_one']
    .map(category=>[category,catalogueProducts.filter(x=>x.category===category).length])),
    {mermaid:2,ball_gown:12,ruffled:17,modern_tradition:4,two_in_one:21});
  assert.equal(prices.dresses.length,56);
  assert.equal(Object.keys(prices.priceRangesZar).length,56);
  assert.deepEqual(catalogueProducts.map(x=>x.id).sort(),prices.dresses.map(x=>x.id).sort());
  assert.equal(new Set(catalogueProducts.map(x=>x.image)).size,52);
  for(const product of catalogueProducts){
    const record=prices.dresses.find(item=>item.id===product.id);
    assert(Number.isSafeInteger(record?.priceZar) && record.priceZar>0);
    assert(Number.isSafeInteger(record?.rentalPriceRangeZar.minZar));
    assert(record.rentalPriceRangeZar.maxZar>record.rentalPriceRangeZar.minZar);
  }
});
