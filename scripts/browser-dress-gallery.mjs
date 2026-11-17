import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import { displayPriceForDress } from '../src/lib/pricing.ts';

// Exercise the production controller against a synthetic three-angle dress.
// This avoids representing unrelated placeholder dresses as multiple views of one gown.
const source=readFileSync('src/client/dress-gallery.js','utf8')
  .replace('export function initializeDressGalleries()', 'function initializeDressGalleries()')
  + '\nwindow.testInitializeDressGalleries = initializeDressGalleries;';
const photos=[
 {url:'https://ik.imagekit.io/kw8awoqvwi/test/front.webp',alt:'Front view of same gown'},
 {url:'https://ik.imagekit.io/kw8awoqvwi/test/side.webp',alt:'Side view of same gown'},
 {url:'https://ik.imagekit.io/kw8awoqvwi/test/back.webp',alt:'Back view of same gown'},
];
const browser=await chromium.launch({args:['--no-sandbox']});
try {
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:840},hasTouch:width===390,isMobile:width===390});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.route('https://ik.imagekit.io/**',route=>route.abort());
  await page.setContent('<div data-detail-gallery="sample-mermaid" tabindex="0" '+
   'data-gallery-photos=\''+JSON.stringify(photos)+'\'>'+
   '<div data-sample-frame><img data-gallery-active-image alt=""><a data-gallery-enlarge href="#">Expand</a>'+
   '<button data-gallery-previous type="button">Previous</button><button data-gallery-next type="button">Next</button></div>'+
   photos.map((_,i)=>'<button type="button" data-gallery-index="'+i+'">Photo '+(i+1)+'</button>').join('')+
   '<span data-gallery-counter aria-live="polite">01 / 03</span></div>');
  await page.addScriptTag({content:source});
  await page.evaluate(()=>window.testInitializeDressGalleries());
  const gallery=page.locator('[data-detail-gallery]');
  const image=gallery.locator('[data-gallery-active-image]');
  const enlarge=gallery.locator('[data-gallery-enlarge]');
  const counter=gallery.locator('[data-gallery-counter]');
  const current=async()=>Number(await gallery.getAttribute('data-active-photo'));
  assert.equal(await current(),0);
  assert.equal(await counter.textContent(),'01 / 03');
  await gallery.locator('[data-gallery-next]').click();
  assert.equal(await current(),1);
  assert.equal(await image.getAttribute('src'),photos[1].url);
  assert.equal(await image.getAttribute('alt'),photos[1].alt);
  assert.equal(await enlarge.getAttribute('href'),photos[1].url);
  assert.equal(await counter.textContent(),'02 / 03');
  await gallery.locator('[data-gallery-index="2"]').click();
  assert.equal(await current(),2);
  assert.deepEqual(await gallery.locator('[data-gallery-index]').evaluateAll(dots=>dots.map(dot=>dot.getAttribute('aria-pressed'))),['false','false','true']);
  await gallery.locator('[data-gallery-next]').click();
  assert.equal(await current(),0,'gallery loops to first view');
  await gallery.locator('[data-gallery-previous]').click();
  assert.equal(await current(),2,'gallery loops to last view');
  await gallery.focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal(await current(),1,'left keyboard navigation works');
  await page.keyboard.press('ArrowRight');
  assert.equal(await current(),2,'right keyboard navigation works');
  if(width===390){
    await page.evaluate(()=>{
      const frame=document.querySelector('[data-sample-frame]');
      const point=(x,y)=>new Touch({identifier:1,target:frame,clientX:x,clientY:y});
      frame.dispatchEvent(new TouchEvent('touchstart',{touches:[point(250,160)],bubbles:true}));
      frame.dispatchEvent(new TouchEvent('touchend',{changedTouches:[point(70,155)],bubbles:true}));
    });
    assert.equal(await current(),0,'mobile horizontal swipe changes photo');
  }
  assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log('Three-photo dress gallery PASS: arrows, dots, image link, keyboard and touch');
 // Check the actual generated Sample 17 page, which now has two Pexels photographs
 // of one gown rather than just our synthetic isolated controller fixture.
 const actual=await browser.newPage({viewport:{width:1280,height:900}});
 const liveErrors=[];
 actual.on('pageerror',error=>liveErrors.push(error.message));
 await actual.goto('http://localhost:4173/redcarpert-prototype/product/preview/sample-17-two-in-one/',{
   waitUntil:'domcontentloaded',
   timeout:30000,
 });
 const liveGallery=actual.locator('[data-detail-gallery="sample-two-in-one-01"]');
 await liveGallery.locator('[data-gallery-next]').waitFor({timeout:20000});
 // The approved detail card must stay centre-aligned across screen sizes:
 // collection, dress name, price label and ZAR price above Book a Fitting.
 for(const width of [1280,768,640,390,320]){
   await actual.setViewportSize({width,height:900});
   const alignment=await actual.locator('.redcarpert-detail-card').evaluate(card=>{
     const selectors=['.redcarpert-detail-collection','h1.redcarpert-detail-name',
       '.redcarpert-detail-price-label','.redcarpert-detail-price-value'];
     return selectors.map(selector=>{
       const element=card.querySelector(selector);
       return {selector,textAlign:element?getComputedStyle(element).textAlign:null};
     });
   });
   assert(alignment.every(({textAlign})=>textAlign==='center'),
     width+'px dress collection, heading and price must all be centred: '+JSON.stringify(alignment));
   const fittingSize=await actual.locator('.redcarpert-detail-actions a.redcarpert-detail-fitting-button').evaluate(button=>{
     const bounds=button.getBoundingClientRect();
     return {width:bounds.width,height:bounds.height};
   });
   assert(fittingSize.height>=43.5,width+'px Book a Fitting must remain tappable');
   if(width<=640)assert(fittingSize.width<=200.5,width+'px Book a Fitting should stay compact on mobile');
   const sideOverflow=await actual.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
   assert.equal(sideOverflow,false,width+'px detail card must not cause horizontal scrolling');
 }
 assert.equal(await liveGallery.locator('[data-gallery-index]').count(),2);
 assert.equal(await liveGallery.locator('[data-gallery-counter]').textContent(),'01 / 02');
 assert.match(await liveGallery.locator('[data-gallery-active-image]').getAttribute('src'),/20370059/);
 await liveGallery.locator('[data-gallery-next]').click();
 assert.equal(await liveGallery.locator('[data-gallery-counter]').textContent(),'02 / 02');
 assert.match(await liveGallery.locator('[data-gallery-active-image]').getAttribute('src'),/20370060/);
 assert.match(await liveGallery.locator('[data-gallery-enlarge]').getAttribute('href'),/20370060/);
 await liveGallery.locator('[data-gallery-previous]').click();
 assert.equal(await liveGallery.locator('[data-gallery-counter]').textContent(),'01 / 02');
 // Verify actual client Ball Gown 03: four unique photos, no sample pricing.
 await actual.goto('http://localhost:4173/redcarpert-prototype/product/preview/ball-gown-03/',{waitUntil:'domcontentloaded'});
 const gown=actual.locator('[data-detail-gallery="ball-gown-03"]');
 await gown.locator('[data-gallery-next]').waitFor({timeout:20000});
 assert.equal(await gown.locator('[data-gallery-index]').count(),4);
 assert.equal(await gown.locator('[data-gallery-counter]').textContent(),'01 / 04');
 assert.equal(await gown.getAttribute('data-gallery-origin'),'client');
 assert.match(await gown.locator('[data-gallery-active-image]').getAttribute('src'),/ball-gown-03-main\.webp/);
 await gown.locator('[data-gallery-next]').click();
 assert.equal(await gown.locator('[data-gallery-counter]').textContent(),'02 / 04');
 assert.match(await gown.locator('[data-gallery-active-image]').getAttribute('src'),/ball-gown-03-back\.webp/);
 assert.match(await gown.locator('[data-gallery-enlarge]').getAttribute('href'),/ball-gown-03-back\.webp/);
 assert.equal(await actual.locator('[data-dress-price]').textContent(),displayPriceForDress('ball-gown-03'));
 assert.match(await actual.locator('.redcarpert-detail-price-disclaimer').textContent(),/new or pre-owned/);
 assert.equal(await actual.locator('.redcarpert-detail-price-label').textContent(),'INDICATIVE PRICE RANGE');
 assert.equal(await actual.locator('.sample-detail-notice').count(),0,'client gown has no provenance notice');
 // Single-photo client gowns still show the full silhouette without empty arrows.
 await actual.goto('http://localhost:4173/redcarpert-prototype/product/preview/ball-gown-07/',{waitUntil:'domcontentloaded'});
 const singleClient=actual.locator('[data-detail-gallery="ball-gown-07"]');
 assert.equal(await singleClient.locator('[data-gallery-next]').count(),0);
 assert.equal(await singleClient.locator('[data-gallery-index]').count(),0);
 assert.equal(await singleClient.locator('[data-gallery-active-image]').evaluate(img=>getComputedStyle(img).objectFit),'contain');
 // Wedding Dresses listing cards are intentionally price-free.
 await actual.goto('http://localhost:4173/redcarpert-prototype/product/',{waitUntil:'domcontentloaded'});
 for(const width of [1280,390]){
   await actual.setViewportSize({width,height:900});
   const cards=actual.locator('ul.products[data-catalogue-preview] li.product');
   assert.equal(await cards.count(),27);
   const alignment=await cards.evaluateAll(items=>items.map(card=>{
     const title=card.querySelector('.woocommerce-loop-product__title');
     const note=card.querySelector('.catalogue-sample-note');
     return {
       title:title?getComputedStyle(title).textAlign:null,
       note:note?getComputedStyle(note).textAlign:null,
     };
   }));
   assert(alignment.every(item=>item.title==='center' && (item.note===null || item.note==='center')),
     width+'px Wedding Dresses names and inspiration labels stay centered: '+JSON.stringify(alignment));
   assert.equal(await cards.locator('[data-dress-price]').count(),0);
   assert.equal(await cards.locator('.redcarpert-catalogue-price').count(),0);
   assert.equal(await cards.locator('.redcarpert-catalogue-condition-note').count(),0);
   const clientCard=actual.locator('[data-catalogue-id="ball-gown-03"]');
   assert.equal(await clientCard.locator('.catalogue-sample-note').count(),0);
   assert.equal(await clientCard.locator('h2.woocommerce-loop-product__title').textContent(),'Ball Gown 03');
 }
 await actual.close();
 assert.deepEqual(liveErrors,[],'real Pexels demo route should have no JS errors');
 console.log('Live Pexels Sample 17 PASS: gallery renders, arrow navigation changes photograph');

} finally {
 await browser.close();
}
