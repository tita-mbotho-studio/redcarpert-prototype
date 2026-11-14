import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

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
} finally {
 await browser.close();
}
