import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import products from '../src/data/products.json' with { type: 'json' };
import { catalogueProducts } from '../src/data/catalogue.ts';
import { lookbookPlacements } from '../src/lib/lookbook-placements.ts';
import { displaySalePriceForDress, displayRentalPriceForDress, salePriceLabelForDress, RENTAL_CONDITION_NOTE } from '../src/lib/pricing.ts';

/** Test deterministic book behaviour without relying on third-party CDN availability. */
const placements=lookbookPlacements(catalogueProducts);
const pageCount=placements.length+2;
const browser = await chromium.launch({args:['--no-sandbox']});
try {
 for (const width of [1440, 768, 390]) {
  const mobile = width === 390;
  const page = await browser.newPage({viewport:{width,height:900},isMobile:mobile,hasTouch:mobile});
  const errors = [];
  page.on('pageerror',error=>errors.push(error.message));
  // Force the built-in fallback so the test never requires a remote animation vendor.
  await page.route('https://cdn.jsdelivr.net/npm/page-flip@2.0.7/**',route=>route.abort());
  await page.route('https://images.pexels.com/**',route=>route.abort());
  await page.goto('http://localhost:4173/redcarpert-wedding-dresses/digital-lookbook/',{waitUntil:'domcontentloaded'});
  await page.locator('#redcarpert-flipbook[data-engine="fallback"]').waitFor({timeout:10000});
  assert.equal(await page.locator('[data-book-page]').count(),pageCount);
  assert.equal(await page.locator('[data-book-sale-price]').count(),placements.length);
  assert.equal(await page.locator('[data-book-rental-price]').count(),placements.length);
  assert.equal(await page.locator('[data-book-sale-label]').count(),placements.length);
  assert.equal(await page.locator('.redcarpert-book-price-pair').count(),placements.length);
  const displayed=await page.locator('.redcarpert-book-dress').evaluateAll(cards=>cards.map(card=>({
    id:card.getAttribute('data-book-dress-id'),
    entryId:card.getAttribute('data-book-entry-id'),
    category:card.getAttribute('data-book-category'),
    href:card.querySelector('a[href*="/product/preview/"]')?.getAttribute('href'),
    sale:card.querySelector('[data-book-sale-price]')?.textContent,
    rental:card.querySelector('[data-book-rental-price]')?.textContent,
    saleLabel:card.querySelector('[data-book-sale-label]')?.textContent,
    conditionNote:card.querySelector('.redcarpert-book-condition-note')?.textContent,
  })));
  assert.equal(new Set(displayed.map(item=>item.id)).size,products.dresses.length);
  assert.equal(new Set(displayed.map(item=>item.entryId)).size,placements.length);
  assert.equal(displayed.filter(item=>item.category==='modern_tradition').length,4);
  for (const item of displayed.filter(item=>item.category==='modern_tradition')) {
    const placement=placements.find(p=>p.id===item.entryId);
    assert(placement?.isModernTradition);
    assert(item.href?.endsWith(placement.detailRoute+'/'));
  }
  for(const entry of displayed){
    assert.equal(entry.sale,displaySalePriceForDress(entry.id),entry.id+' sale price mismatch');
    assert.equal(entry.rental,displayRentalPriceForDress(entry.id),entry.id+' rental price mismatch');
    assert.equal(entry.saleLabel,salePriceLabelForDress(entry.id),entry.id+' sale label mismatch');
    assert.equal(entry.conditionNote,RENTAL_CONDITION_NOTE,entry.id+' must show the condition-based rental note');
  }
  assert.equal(await page.locator('.redcarpert-book-logo').count(),2);
  const cover=page.locator('.redcarpert-book-cover');
  assert.equal(await cover.locator('img').count(),1,'minimal cover contains only Redcarpert logo');
  assert.equal(await cover.locator('.redcarpert-book-cover-photo').count(),0,'cover must not include a stock image');
  assert.match(await cover.locator('h3').textContent(),/Walking on red carpet with confidence/);
  assert.equal(await page.locator('.redcarpert-book-dress').count(),placements.length);
  assert.equal(await page.locator('.redcarpert-book-dress[data-book-dress-id^="mermaid-"]').count(),2);
  assert.equal(await page.locator('.redcarpert-book-dress[data-book-dress-id^="ball-gown-"]').count(),12,
    'the Digital Lookbook must include exactly twelve Ball Gown dress entries');
  assert.equal(await page.locator('.redcarpert-book-dress[data-book-dress-id^="ruffled-"]').count(),17,
    'the Digital Lookbook must include all seventeen client Ruffled dresses');
  assert.equal(await page.locator('.redcarpert-book-dress a[href*="/product/preview/"]').count(),placements.length);
  const next = page.getByRole('button',{name:'Next page',exact:true});
  const previous = page.getByRole('button',{name:'Previous page',exact:true});
  // Accessible names remain for screen readers; visible labels are icons only.
  assert.equal(await previous.textContent(),'','previous control must have no visible text');
  assert.equal(await next.textContent(),'','next control must have no visible text');
  assert.equal(await previous.locator('.fa-solid.fa-chevron-left').count(),1);
  assert.equal(await next.locator('.fa-solid.fa-chevron-right').count(),1);
  assert(await previous.isDisabled(),'previous arrow must be disabled on the cover');

  // Compare computed appearance with the existing approved dress gallery arrows.
  const appearance=async locator=>locator.evaluate(button=>{
    const computed=getComputedStyle(button);
    const box=button.getBoundingClientRect();
    const icon=button.querySelector('i').getBoundingClientRect();
    return {
      width:Math.round(box.width*100)/100,height:Math.round(box.height*100)/100,
      borderRadius:computed.borderRadius,borderColor:computed.borderTopColor,
      borderWidth:computed.borderTopWidth,background:computed.backgroundColor,
      color:computed.color,shadow:computed.boxShadow,fontSize:computed.fontSize,
      iconCentered:Math.abs((icon.left+icon.right)/2-(box.left+box.right)/2)<=1.5
        && Math.abs((icon.top+icon.bottom)/2-(box.top+box.bottom)/2)<=1.5,
    };
  });
  const referencePage=await browser.newPage({viewport:{width,height:900},isMobile:mobile,hasTouch:mobile});
  await referencePage.goto('http://localhost:4173/redcarpert-wedding-dresses/product/preview/ball-gown-02/',{waitUntil:'domcontentloaded'});
  const reference=referencePage.locator('[data-gallery-next]');
  await reference.waitFor({state:'visible'});
  const expectedStyle=await appearance(reference);
  const actualStyle=await appearance(next);
  assert.deepEqual(actualStyle,expectedStyle,width+'px lookbook arrow must match dress gallery appearance');
  assert((await appearance(previous)).iconCentered,width+'px previous chevron must be centered');
  await referencePage.close();

  for(let i=2;i<=pageCount;i++){
   await next.click();
   assert.equal(await page.locator('[data-book-status]').textContent(),'Page '+i+' of '+pageCount);
   assert.equal(await page.locator('.redcarpert-book-page.is-current').count(),1);
   if(i===2) {
    const layout=await page.locator('.redcarpert-book-page.is-current').evaluate(dress=>{
      const leaf=dress.getBoundingClientRect();
      const photo=dress.querySelector('.redcarpert-book-photo');
      const photoBox=photo.getBoundingClientRect();
      const copy=dress.querySelector('.redcarpert-book-copy');
      const copyBox=copy.getBoundingClientRect();
      const img=photo.querySelector('img');
      return {
        left:photoBox.left-leaf.left,
        right:leaf.right-photoBox.right,
        objectFit:getComputedStyle(img).objectFit,
        detailsAlign:getComputedStyle(copy).textAlign,
        verticalAlignment:getComputedStyle(copy).justifyContent,
        centered:Math.abs(copyBox.left+copyBox.width/2-(leaf.left+leaf.width/2))<2,
        photoInside:photoBox.bottom<leaf.bottom,
        copyFits:copy.scrollHeight<=copy.clientHeight+1,
        priceFields:copy.querySelectorAll('.redcarpert-book-price-item').length,
        pricesInside:[...copy.querySelectorAll('.redcarpert-book-price-item')]
          .every(item=>item.getBoundingClientRect().bottom<=copyBox.bottom+1),
      };
    });
    assert(Math.abs(layout.left-layout.right)<=2,'dress image needs symmetric left/right book gutters');
    assert(layout.left>=15,'dress picture is too close to the page edge');
    assert.equal(layout.objectFit,'contain','keep the whole original photograph');
    assert.equal(layout.detailsAlign,'center','dress details must be centred');
    assert.equal(layout.verticalAlignment,'center','dress details must be vertically balanced');
    assert(layout.centered&&layout.photoInside,'book contents must stay centred inside the leaf');
    assert.equal(layout.priceFields,2,'sale and rental price must both fit on the book leaf');
    assert(layout.copyFits&&layout.pricesInside,width+'px book price text must not overflow or clip');
    // A stationary tap on the *painted photo* opens the same borderless viewer
    // as Wedding Moments. Inject a local image because the Pexels CDN is
    // deliberately blocked by this deterministic fallback test.
    const beforeZoom=await page.locator('[data-book-status]').textContent();
    const photo=page.locator('.redcarpert-book-page.is-current [data-book-zoom-photo]');
    assert.equal(await photo.count(),1);
    await photo.evaluate(image=>new Promise(resolve=>{
      image.onload=()=>{
        image.classList.remove('redcarpert-image-unavailable');
        image.closest('.redcarpert-book-photo')?.classList.remove('redcarpert-photo-failed');
        resolve();
      };
      const src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="900" height="1600"%3E%3Crect width="900" height="1600" fill="silver"/%3E%3C/svg%3E';
      image.dataset.bookZoomSrc=src;
      image.dataset.bookZoomOriginal=src;
      image.src=src;
    }));
    assert.equal(await page.locator('[data-book-zoom-trigger]').count(),0,'no visible expand button');
    await photo.click();
    const zoomDialog=page.locator('[data-book-zoom-dialog]');
    assert(await zoomDialog.isVisible(),'tapping photograph opens viewer');
    assert(await zoomDialog.evaluate(dialog=>dialog.classList.contains('redcarpert-wedding-dialog')));
    assert.equal(await zoomDialog.locator('.redcarpert-wedding-preview-image').count(),1);
    assert.equal(await zoomDialog.locator('.redcarpert-wedding-preview-close').count(),1);
    assert.equal(await zoomDialog.locator('[data-book-zoom-in],[data-book-zoom-out],[data-book-zoom-reset]').count(),0);
    assert.equal(await zoomDialog.locator('[data-book-zoom-close]').evaluate(button=>
      getComputedStyle(button).outlineStyle),'none',
      'pointer-opened modal X must have no focus ring');
    await page.keyboard.press('Escape');
    await zoomDialog.waitFor({state:'hidden'});
    await page.waitForFunction(()=>
      !!document.querySelector('.redcarpert-book-page.is-current img[data-book-zoom-photo].redcarpert-book-pointer-restored')
    );
    assert.equal(await photo.evaluate(image=>getComputedStyle(image).outlineStyle),'none',
      'restored photo must have no border-like focus ring');
    assert.equal(await photo.evaluate(image=>getComputedStyle(image).borderTopWidth),'0px',
      'the photograph must not have a decorative frame');
    assert.equal(await page.locator('[data-book-status]').textContent(),beforeZoom,
      'closing zoom must not turn the book');
   }
  }
  assert(await next.isDisabled());
  await previous.click();
  assert.equal(await page.locator('[data-book-status]').textContent(),'Page '+(pageCount-1)+' of '+pageCount);
  await page.locator('#redcarpert-flipbook').focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('[data-book-status]').textContent(),'Page '+(pageCount-2)+' of '+pageCount);
  if(mobile){
   const book=page.locator('#redcarpert-flipbook');
   const box=await book.boundingBox();
   assert(box);
   const client=await page.context().newCDPSession(page);
   const y=box.y+box.height/2;
   await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.8,y}]});
   await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*.2,y}]});
   await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert.equal(await page.locator('[data-book-status]').textContent(),'Page '+(pageCount-1)+' of '+pageCount);
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log('Book fallback, keyboard, mobile swipe, pages, image disclosures and responsive layout passed.');
} finally { await browser.close(); }
