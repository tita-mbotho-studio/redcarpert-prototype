import test from 'node:test';
import assert from 'node:assert/strict';
import {preloadMediaImage,setMediaImage} from '../src/client/MediaDelivery.js';
import {mediaDeliveryUrl} from '../src/lib/media-delivery.ts';

const root='https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-dresses/';
const oldImage=globalThis.Image;
const failures=new Set();
const requested=[];
class FakeImage {
  naturalWidth=0;
  set src(url) {
    this._src=url;
    requested.push(url);
    queueMicrotask(()=>{
      if(failures.has(url)) this.onerror?.(new Error('Image failed'));
      else {this.naturalWidth=1200;this.onload?.();}
    });
  }
  get src(){return this._src;}
  decode(){return Promise.resolve();}
}
globalThis.Image=FakeImage;

test('adjacent gallery preload decodes one ImageKit source and deduplicates in-flight loads',async()=>{
  const original=root+'ball-gown-dresses/same-angle-01.webp?updatedAt=1795000000000';
  const start=requested.length;
  const first=preloadMediaImage(original,'detail');
  const again=preloadMediaImage(original,'detail');
  assert.strictEqual(first,again);
  assert.equal(await first,mediaDeliveryUrl(original,'detail'));
  assert.equal(requested.length-start,1);
  const active={dataset:{},removeAttribute(name){delete this[name];},src:''};
  setMediaImage(active,original,'detail',await first);
  assert.equal(active.src,mediaDeliveryUrl(original,'detail'));
  assert.equal(active.dataset.mediaOriginal,original);
});

test('failed derivative loads its actual client original, not the first dress photograph',async()=>{
  const original=root+'ball-gown-dresses/new-angle-02.webp?updatedAt=1795000000001';
  const derivative=mediaDeliveryUrl(original,'detail');
  failures.add(derivative);
  const resolved=await preloadMediaImage(original,'detail');
  assert.equal(resolved,original);
  assert(requested.includes(derivative));
  assert(requested.includes(original));
  failures.delete(derivative);
});

test('changed updatedAt creates a distinct browser preload and does not serve a stale entry',async()=>{
  const source=root+'ball-gown-dresses/same-angle-03.webp';
  const a=source+'?updatedAt=1795000000003';
  const b=source+'?updatedAt=1795000000004';
  assert.notEqual(await preloadMediaImage(a,'detail'),await preloadMediaImage(b,'detail'));
});

test('missing optimized and original media rejects and allows retry after correction',async()=>{
  const original=root+'ball-gown-dresses/missing-angle-04.webp?updatedAt=1795000000005';
  const derivative=mediaDeliveryUrl(original,'detail');
  failures.add(original);failures.add(derivative);
  await assert.rejects(()=>preloadMediaImage(original,'detail'),/Gallery photograph failed/);
  failures.delete(original);failures.delete(derivative);
  assert.equal(await preloadMediaImage(original,'detail'),derivative);
});

test('restore global Image constructor',()=>{
  if(oldImage===undefined) delete globalThis.Image;
  else globalThis.Image=oldImage;
  assert(true);
});
