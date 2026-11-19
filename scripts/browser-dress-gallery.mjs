import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import { displaySalePriceForDress, displayRentalPriceForDress, RENTAL_CONDITION_NOTE } from '../src/lib/pricing.ts';
const ballGown03Photos=JSON.parse(readFileSync('src/data/client-ball-gowns.json','utf8'))
  .find(gown=>gown.id==='ball-gown-03').photos.map(photo=>photo.url);
const imagePath=url=>new URL(url).pathname;

// Exercise the production controller against a synthetic three-angle dress.
// This avoids representing unrelated placeholder dresses as multiple views of one gown.
const source=readFileSync('src/client/dress-gallery.js','utf8')
  // The isolated navigation fixture mocks the shared media transport; the
  // production page below exercises the actual imported delivery module.
  .replace("import { setMediaImage } from './MediaDelivery.js';",
    "const setMediaImage=(image,original,preset)=>{image.dataset.mediaOriginal=original;image.src=original+'?tr='+(preset==='preview'?'w-1920,h-1920,c-at_max,q-82,f-auto':'w-1280,h-1800,c-at_max,q-82,f-auto');};")
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
  await page.setContent('<div data-detail-gallery="mermaid-lefa-dress" tabindex="0" '+
   'data-gallery-photos=\''+JSON.stringify(photos)+'\'>'+
   '<div data-dress-frame><img data-gallery-active-image role="button" tabindex="0" '+
   'aria-haspopup="dialog" style="display:block;width:180px;height:250px" alt="">'+
   '<button data-gallery-previous type="button">Previous</button><button data-gallery-next type="button">Next</button></div>'+
   photos.map((_,i)=>'<button type="button" data-gallery-index="'+i+'">Photo '+(i+1)+'</button>').join('')+
   '<span data-gallery-counter aria-live="polite">01 / 03</span></div>'+
   '<dialog class="redcarpert-wedding-dialog redcarpert-dress-photo-dialog" data-dress-photo-dialog>'+
   '<div class="redcarpert-moment-dialog-inner"><img class="redcarpert-wedding-preview-image" data-dress-preview-photo>'+
   '<button class="redcarpert-wedding-preview-close" data-dress-preview-close type="button">'+
   '<i class="fa-solid fa-xmark"></i></button></div></dialog>');
  await page.addScriptTag({content:source});
  await page.evaluate(()=>window.testInitializeDressGalleries());
  const gallery=page.locator('[data-detail-gallery]');
  const image=gallery.locator('[data-gallery-active-image]');
  const modal=page.locator('[data-dress-photo-dialog]');
  const preview=modal.locator('[data-dress-preview-photo]');
  assert.equal(await page.locator('[data-gallery-enlarge],[data-fancybox]').count(),0,
    'legacy expand buttons and Fancybox must be removed');
  const counter=gallery.locator('[data-gallery-counter]');
  const current=async()=>Number(await gallery.getAttribute('data-active-photo'));
  assert.equal(await current(),0);
  assert.equal(await counter.textContent(),'01 / 03');
  await gallery.locator('[data-gallery-next]').click();
  assert.equal(await current(),1);
  assert.equal(await image.getAttribute('src'),photos[1].url+'?tr=w-1280,h-1800,c-at_max,q-82,f-auto');
  assert.equal(await image.getAttribute('data-media-original'),photos[1].url);
  assert.equal(await image.getAttribute('alt'),photos[1].alt);
  assert.equal(await image.getAttribute('aria-label'),'Enlarge photograph 2 of 3');
  await image.click();
  await modal.waitFor({state:'visible'});
  assert.equal(await preview.getAttribute('alt'),photos[1].alt);
  assert.equal(await preview.getAttribute('src'),photos[1].url+'?tr=w-1920,h-1920,c-at_max,q-82,f-auto');
  assert.equal(await current(),1,'opening a photo must not change gallery index');
  await modal.locator('[data-dress-preview-close]').click();
  await modal.waitFor({state:'hidden'});
  assert.equal(await current(),1,'closing a photo must not change gallery index');
  assert.equal(await image.evaluate(img=>document.activeElement===img),true,
    'focus must return to the photograph');
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
      const frame=document.querySelector('[data-dress-frame]');
      const point=(x,y)=>new Touch({identifier:1,target:frame,clientX:x,clientY:y});
      frame.dispatchEvent(new TouchEvent('touchstart',{touches:[point(250,160)],bubbles:true}));
      frame.dispatchEvent(new TouchEvent('touchend',{changedTouches:[point(70,155)],bubbles:true}));
    });
    assert.equal(await current(),0,'mobile horizontal swipe changes photo');
  }
  assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log('Three-photo dress gallery PASS: arrows, dots, direct photo modal, keyboard and touch');
 // Check the actual generated Sample 17 page, which now has two Pexels photographs
 // of one gown rather than just our synthetic isolated controller fixture.
 const actual=await browser.newPage({viewport:{width:1280,height:900}});
 const liveErrors=[];
 actual.on('pageerror',error=>liveErrors.push(error.message));
 await actual.goto('http://localhost:4173/redcarpert-prototype/product/preview/2-in-1-kwena-dress/',{
   waitUntil:'domcontentloaded',
   timeout:30000,
 });
 const liveGallery=actual.locator('[data-detail-gallery="2-in-1-kwena-dress"]');
 await liveGallery.locator('[data-gallery-next]').waitFor({timeout:20000});
 // The approved detail card must stay centre-aligned across screen sizes:
 // collection, dress name, price label and ZAR price above Book a Fitting.
 for(const width of [1920,1440,1280,1100,1051,1050,900,768,640,390,320]){
   await actual.setViewportSize({width,height:900});
   const alignment=await actual.locator('.redcarpert-detail-card').evaluate(card=>{
     const selectors=['.redcarpert-detail-collection','h1.redcarpert-detail-name',
       '.redcarpert-detail-price-label','.redcarpert-detail-price-value'];
     return selectors.map(selector=>{
       const element=card.querySelector(selector);
       return {selector,textAlign:element?getComputedStyle(element).textAlign:null};
     });
   });
   assert(alignment.every(({textAlign})=>textAlign===null || textAlign==='center'),
     width+'px dress collection, heading and price must all be centred: '+JSON.stringify(alignment));
   // Measure the actual rendered rental label and amount at every breakpoint.
   const rentalLayout=await actual.locator('.redcarpert-detail-price-options').evaluate(options=>{
     const rental=options.querySelector('[data-rental-price]');
     const sale=options.querySelector('[data-sale-price]');
     const label=options.querySelector('.redcarpert-detail-price-option:nth-child(2) .redcarpert-detail-price-label');
     const sizes=element=>{
       const style=getComputedStyle(element);
       return {
         content:element.textContent.trim(),
         height:element.getBoundingClientRect().height,
         lineHeight:parseFloat(style.lineHeight),
         scrollWidth:element.scrollWidth,
         clientWidth:element.clientWidth,
         whiteSpace:style.whiteSpace,
         fontSize:style.fontSize,
         fontFamily:style.fontFamily,
       };
     };
     const optionColumns=getComputedStyle(options).gridTemplateColumns.trim().split(/\s+/).length;
     return {label:sizes(label),rental:sizes(rental),sale:sizes(sale),columns:optionColumns};
   });
   assert.equal(rentalLayout.columns,1,
     width+'px both pricing values should have the same full-width layout');
   assert.equal(rentalLayout.rental.fontSize,rentalLayout.sale.fontSize,
     width+'px rental amount must use the SAME readable font size as sale price');
   assert.equal(rentalLayout.rental.fontFamily,rentalLayout.sale.fontFamily,
     width+'px rental amount must use the SAME font family as sale price');
   for(const [name,element] of [['rental label',rentalLayout.label],['rental amount',rentalLayout.rental]]){
     assert.equal(element.whiteSpace,'nowrap',width+'px '+name+' must not wrap');
     assert(element.height<=element.lineHeight+1.5,
       width+'px '+name+' occupies multiple lines: '+JSON.stringify(element));
     assert(element.scrollWidth<=element.clientWidth+1,
       width+'px '+name+' overflows its column: '+JSON.stringify(element));
   }
   const fitting=await actual.locator('.redcarpert-detail-actions').evaluate(group=>{
     const label=group.querySelector('.redcarpert-icon-cta-label');
     const button=group.querySelector('a.redcarpert-detail-fitting-button');
     const icon=button?.querySelector('i');
     const bounds=node=>{const rect=node.getBoundingClientRect();
       return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,
         centerX:rect.x+rect.width/2,centerY:rect.y+rect.height/2,
         bottom:rect.bottom};};
     return {labelText:label?.textContent?.trim(),label:label&&bounds(label),
       labelAlign:label&&getComputedStyle(label).textAlign,
       button:button&&bounds(button),buttonText:button?.textContent?.trim(),
       buttonLabel:button?.getAttribute('aria-label'),
       iconClass:icon?.className,iconHidden:icon?.getAttribute('aria-hidden'),
       icon:icon&&bounds(icon),buttonColor:button&&getComputedStyle(button).backgroundColor};
   });
   assert.equal(fitting.labelText,'Book a Fitting');
   assert.equal(fitting.buttonText,'',width+'px fitting action must be icon-only');
   assert.equal(fitting.labelAlign,'center');
   assert.equal(fitting.buttonLabel,'Book a Fitting via WhatsApp');
   assert.equal(fitting.iconClass,'fa-brands fa-whatsapp');
   assert.equal(fitting.iconHidden,'true');
   const expectedSize=width<=640?44:48;
   assert(Math.abs(fitting.button.width-expectedSize)<1 && Math.abs(fitting.button.height-expectedSize)<1,
     width+'px fitting icon must match the compact editorial '+expectedSize+'px target');
   assert(fitting.label.bottom<=fitting.button.y+1,width+'px label must be ABOVE the icon');
   assert(Math.abs(fitting.label.centerX-fitting.button.centerX)<2,width+'px label and icon must be centred');
   assert(Math.abs(fitting.icon.centerX-fitting.button.centerX)<=1.5
     && Math.abs(fitting.icon.centerY-fitting.button.centerY)<=1.5,
     width+'px WhatsApp glyph must be centred within the button');
   assert.notEqual(fitting.buttonColor,'rgb(97, 80, 66)',
     width+'px must not use the old filled fitting CTA');
   const relatedLayout=await actual.locator('.redcarpert-related-dresses').evaluate(section=>{
     const grid=section.querySelector('.redcarpert-related-grid');
     const cards=[...grid.querySelectorAll('[data-related-dress]')];
     const columns=getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
     const last=cards.at(-1).getBoundingClientRect();
     const container=grid.getBoundingClientRect();
     return {count:cards.length,columns,lastCenter:last.x+last.width/2,
       gridCenter:container.x+container.width/2};
   });
   assert.equal(relatedLayout.count,4,width+'px four same-category dresses should be suggested');
   const relatedPricing=await actual.locator('[data-related-dress]').evaluateAll(cards=>cards.map(card=>({
     id:card.getAttribute('data-related-dress'),
     sale:card.querySelector('[data-related-sale-price]')?.textContent?.trim(),
     rental:card.querySelector('[data-related-rental-price]')?.textContent?.trim(),
     labels:[...card.querySelectorAll('.redcarpert-related-price-label')]
       .map(label=>label.textContent.trim()),
   })));
   for(const entry of relatedPricing){
     assert.equal(entry.sale,displaySalePriceForDress(entry.id),width+'px related sale price mismatch');
     assert.equal(entry.rental,displayRentalPriceForDress(entry.id),width+'px related rental mismatch');
     assert.equal(entry.labels.length,2,width+'px related dress needs both price labels');
     assert.equal(entry.labels[1],'Rental Price Range');
   }
   assert.equal(relatedLayout.columns,width>1000?4:2,width+'px related cards must use the intended responsive columns');
   // Four related dresses fill complete two-column rows on mobile.
   const sideOverflow=await actual.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
   assert.equal(sideOverflow,false,width+'px detail card must not cause horizontal scrolling');
 }
 assert.equal(await liveGallery.locator('[data-gallery-index]').count(),3);
 assert.equal(await liveGallery.locator('[data-gallery-counter]').textContent(),'01 / 03');
 assert.match(await liveGallery.locator('[data-gallery-active-image]').getAttribute('src'),/2-in-1-kwena-dress-01[.]webp/);
 await liveGallery.locator('[data-gallery-next]').click();
 assert.equal(await liveGallery.locator('[data-gallery-counter]').textContent(),'02 / 03');
 assert.match(await liveGallery.locator('[data-gallery-active-image]').getAttribute('src'),/2-in-1-kwena-dress-02[.]webp/);
 assert.equal(await liveGallery.locator('[data-gallery-enlarge],[data-fancybox]').count(),0);
 await liveGallery.locator('[data-gallery-active-image]').click();
 const liveModal=actual.locator('[data-dress-photo-dialog]');
 await liveModal.waitFor({state:'visible'});
 assert.match(await liveModal.locator('[data-dress-preview-photo]').getAttribute('src'),/2-in-1-kwena-dress-02[.]webp/);
 assert.equal(await liveModal.locator('[data-dress-preview-close]').count(),1);
 await actual.keyboard.press('Escape');
 await liveModal.waitFor({state:'hidden'});
 assert.equal(await liveGallery.locator('[data-gallery-counter]').textContent(),'02 / 03');
 await liveGallery.locator('[data-gallery-previous]').click();
 assert.equal(await liveGallery.locator('[data-gallery-counter]').textContent(),'01 / 03');
 // Verify actual client Ball Gown 03: four unique photos, no sample pricing.
 await actual.goto('http://localhost:4173/redcarpert-prototype/product/preview/ball-gown-03/',{waitUntil:'domcontentloaded'});
 const gown=actual.locator('[data-detail-gallery="ball-gown-03"]');
 await gown.locator('[data-gallery-next]').waitFor({timeout:20000});
 assert.equal(await gown.locator('[data-gallery-index]').count(),4);
 assert.equal(await gown.locator('[data-gallery-counter]').textContent(),'01 / 04');
 assert.equal(await gown.getAttribute('data-gallery-origin'),'client');
  assert.equal(imagePath(await gown.locator('[data-gallery-active-image]').getAttribute('src')),imagePath(ballGown03Photos[0]));
 await gown.locator('[data-gallery-next]').click();
 assert.equal(await gown.locator('[data-gallery-counter]').textContent(),'02 / 04');
  assert.equal(imagePath(await gown.locator('[data-gallery-active-image]').getAttribute('src')),imagePath(ballGown03Photos[1]));
  await gown.locator('[data-gallery-active-image]').click();
 const clientModal=actual.locator('[data-dress-photo-dialog]');
 await clientModal.waitFor({state:'visible'});
 assert.equal(imagePath(await clientModal.locator('[data-dress-preview-photo]').getAttribute('src')),imagePath(ballGown03Photos[1]));
 await clientModal.locator('[data-dress-preview-close]').click();
 await clientModal.waitFor({state:'hidden'});
 assert.equal(await gown.locator('[data-gallery-counter]').textContent(),'02 / 04');
 assert.equal(await actual.locator('[data-sale-price]').textContent(),displaySalePriceForDress('ball-gown-03'));
 assert.equal(await actual.locator('[data-rental-price]').textContent(),displayRentalPriceForDress('ball-gown-03'));
 // Ball Gown 03 carries one of the longest actual ZAR rental ranges.
 for(const width of [1920,1440,1051,1050,768,640,390,320]){
   await actual.setViewportSize({width,height:900});
   const actualRange=await actual.locator('[data-rental-price]').evaluate(element=>{
     const css=getComputedStyle(element);
     return {
       whiteSpace:css.whiteSpace,scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,
       height:element.getBoundingClientRect().height,lineHeight:parseFloat(css.lineHeight),
     };
   });
   assert.equal(actualRange.whiteSpace,'nowrap',width+'px client rental range must not wrap');
   assert(actualRange.height<=actualRange.lineHeight+1.5,
     width+'px client rental amount must occupy exactly one line: '+JSON.stringify(actualRange));
   assert(actualRange.scrollWidth<=actualRange.clientWidth+1,
     width+'px client rental amount must fit its card: '+JSON.stringify(actualRange));
 }
 await actual.setViewportSize({width:1280,height:900});
 assert.equal(await actual.locator('.redcarpert-detail-price-disclaimer').textContent(),RENTAL_CONDITION_NOTE,
   'dress detail must show the new/pre-owned rental pricing qualification');
 assert.equal(await actual.locator('.redcarpert-related-disclaimer').textContent(),RENTAL_CONDITION_NOTE,
   'related dress prices must show the same qualification');
 assert.equal(await actual.locator('.redcarpert-detail-price-label').first().textContent(),'SALE PRICE');
 assert.equal(await actual.locator('.redcarpert-detail-price-label').nth(1).textContent(),'RENTAL PRICE RANGE');
 assert.equal(await actual.locator('[data-related-dress]').count(),4);
 assert.equal(await actual.locator('[data-related-dress="ball-gown-03"]').count(),0);
 assert.equal(await actual.locator('.redcarpert-related-grid a').count(),4);
 assert.equal(await actual.locator('.obsolete-detail-notice').count(),0,'client gown has no provenance notice');
 // Single-photo client gowns still show the full silhouette without empty arrows.
 await actual.goto('http://localhost:4173/redcarpert-prototype/product/preview/ball-gown-07/',{waitUntil:'domcontentloaded'});
 const singleClient=actual.locator('[data-detail-gallery="ball-gown-07"]');
 assert.equal(await singleClient.locator('[data-gallery-next]').count(),0);
 assert.equal(await singleClient.locator('[data-gallery-index]').count(),0);
 assert.equal(await singleClient.locator('[data-gallery-active-image]').evaluate(img=>getComputedStyle(img).objectFit),'contain');
 await singleClient.locator('[data-gallery-active-image]').click();
 const singleModal=actual.locator('[data-dress-photo-dialog]');
 await singleModal.waitFor({state:'visible'});
 assert.equal(await singleModal.locator('.redcarpert-wedding-preview-image').count(),1);
 assert.equal(await singleModal.locator('.redcarpert-wedding-preview-close').count(),1);
 await actual.keyboard.press('Escape');
 await singleModal.waitFor({state:'hidden'});
 // Wedding Dresses listing cards are intentionally price-free.
 await actual.goto('http://localhost:4173/redcarpert-prototype/product/',{waitUntil:'domcontentloaded'});
 for(const width of [1280,390]){
   await actual.setViewportSize({width,height:900});
   const cards=actual.locator('ul.products[data-catalogue-preview] li.product');
   assert.equal(await cards.count(),47);
   const alignment=await cards.evaluateAll(items=>items.map(card=>{
     const title=card.querySelector('.woocommerce-loop-product__title');
     const note=card.querySelector('.obsolete-catalogue-note');
     return {
       title:title?getComputedStyle(title).textAlign:null,
       note:note?getComputedStyle(note).textAlign:null,
     };
   }));
   assert(alignment.every(item=>item.title==='center' && (item.note===null || item.note==='center')),
     width+'px Wedding Dresses names must stay centered: '+JSON.stringify(alignment));
   assert.equal(await cards.locator('[data-dress-price]').count(),0);
   assert.equal(await cards.locator('.redcarpert-catalogue-price').count(),0);
   assert.equal(await cards.locator('.redcarpert-catalogue-condition-note').count(),0);
   const clientCard=actual.locator('[data-catalogue-id="ball-gown-03"]');
   assert.equal(await clientCard.locator('.obsolete-catalogue-note').count(),0);
   assert.equal(await clientCard.locator('.redcarpert-catalogue-collection').textContent(),'Ball Gown');
   assert.equal(await clientCard.locator('.redcarpert-catalogue-number').textContent(),'03');
 }
 await actual.close();
 assert.deepEqual(liveErrors,[],'real client dress routes should have no JS errors');
 console.log('Live client 2 in 1 Kwena Dress PASS: gallery arrows, rental pricing, direct photo modal');

} finally {
 await browser.close();
}
