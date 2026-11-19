import test from 'node:test';
import assert from 'node:assert/strict';
import {buildImageCachePlan,validateImageKitSource,warmImageCachePlan}
  from '../scripts/lib/image-cache-preflight.mjs';

const root='https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/';
const client=root+'wedding-dresses/mermaid-dresses/mermaid-lefa-dress-01.webp?updatedAt=1795000000000';
const photo2=root+'wedding-dresses/mermaid-dresses/mermaid-lefa-dress-02.webp?updatedAt=1795000000001';
const transform=(src,preset)=>src+(src.includes('?')?'&':'?')+
  'tr=w-640,h-640,c-at_max,q-72,f-auto';
const plan=()=>buildImageCachePlan({
  catalogueProducts:[
    {id:'mermaid-01',image:client},
    {id:'modern-tradition-01',image:client},
  ],
  photosForDress:()=>[{url:client},{url:photo2}],
  homepageBackgrounds:[{replacement:root+'home-page/hero.webp'}],
  team:[{url:root+'about-us/model.jpg'}],
  weddingMomentEvents:[{media:[
    {type:'photo',url:root+'wedding-moments/moment.webp?updatedAt=1795000000002'},
    {type:'video',url:root+'wedding-moments/film.mp4',
      poster:root+'wedding-moments/film.mp4/ik-thumbnail.jpg'},
  ]}],
  mediaDeliveryUrl:transform,
});

test('deployment media plan deduplicates shared Modern Tradition images and preserves the original paths',()=>{
  const result=plan();
  assert.equal(result.uniqueSources,6);
  assert.equal(result.requests.length,9);
  assert.equal(result.unversioned.length,3);
  assert.equal(result.requests.filter(r=>r.preset==='detail').length,2);
  assert.equal(result.requests.filter(r=>r.preset==='card').length,1);
  assert(result.requests.every(r=>new URL(r.url).pathname===new URL(r.source).pathname));
  assert(result.requests.every(r=>r.url.includes('c-at_max')));
  assert(!result.requests.some(r=>r.url.includes('.mp4?')));
});

test('deployment refuses unsafe hosts, nonimages and unapproved transformations',()=>{
  for(const bad of [
    'http://ik.imagekit.io/kw8awoqvwi/image.webp',
    'https://images.pexels.com/photo.webp',
    'https://ik.imagekit.io/other/image.webp',
    root+'wedding-moments/moment.mp4',
    root+'wedding-dresses/file.webp#unversioned-fragment',
  ]) assert.throws(()=>validateImageKitSource(bad),/Unapproved/);
  const input={
    catalogueProducts:[{image:client}],photosForDress:()=>[{url:client}],
    homepageBackgrounds:[],team:[],weddingMomentEvents:[],
    mediaDeliveryUrl:src=>src+'?tr=w-10,h-10,c-maintain_ratio',
  };
  assert.throws(()=>buildImageCachePlan(input),/Unsafe image transformation/);
});

const picture=(status=200)=>({
  ok:status===200,status,
  headers:new Headers({'content-type':'image/webp','content-length':'150'}),
  arrayBuffer:async()=>new ArrayBuffer(150),
});

test('deploy warm-up verifies client photos and uses originals if transformations fail',async()=>{
  const input=plan();
  const calls=[];
  const fetchImpl=async url=>{
    calls.push(url);
    return url.includes('tr=') && url.includes('hero.webp') ? picture(404) : picture();
  };
  const warmed=await warmImageCachePlan(input,{workers:3,fetchImpl});
  assert.equal(warmed.requests,input.requests.length);
  assert.equal(warmed.originalFallbacks,1);
  assert.equal(warmed.optimized,input.requests.length-1);
  assert(calls.includes(root+'home-page/hero.webp'));
  assert(warmed.results.every(r=>r.bytes===150));
});

test('deploy warm-up stops if an original and its optimized version both fail',async()=>{
  const input=plan();
  const fetchImpl=async url=>url.includes('hero.webp')?picture(404):picture();
  await assert.rejects(()=>warmImageCachePlan(input,{workers:1,fetchImpl}),
    /Cannot deploy: .*photo unavailable/);
});
