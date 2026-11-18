import { chromium } from 'playwright';
import { preview } from 'vite';
import assert from 'node:assert/strict';

// Run a dedicated preview inside this test process. The test never depends
// on a separately started server, and it cannot accidentally hit an older
// Vite instance left listening on port 4173. Vite chooses an available port.
const previewServer = await preview({
  preview: { host: '127.0.0.1', port: 0, strictPort: false },
});
const address = previewServer.httpServer.address();
if (!address || typeof address === 'string') {
  throw new Error('Could not determine the Vite preview port');
}
const origin = 'http://127.0.0.1:' + address.port + '/redcarpert-prototype';
console.log('Testing freshly built site at ' + origin);
let browser;
const image='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1400">'+
  '<rect width="900" height="1400" fill="#e9ddd2"/></svg>';

try {
  browser = await chromium.launch({args:['--no-sandbox']});
  for (const width of [1440, 1024, 768, 390, 320]) {
    const touch=width<=1024;
    const page=await browser.newPage({
      viewport:{width,height:900},hasTouch:touch,isMobile:width<=768,
      reducedMotion:'no-preference',
    });
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // Exercise the deterministic non-animated reader first. The separate
    // browser-lookbook-enhanced suite covers the real PageFlip engine.
    await page.route('https://cdn.jsdelivr.net/npm/page-flip@2.0.7/**',route=>route.abort());
    await page.route('https://ik.imagekit.io/**',route=>
      route.request().resourceType()==='media'
        ? route.fulfill({status:200,contentType:'video/mp4',body:''})
        : route.fulfill({status:200,contentType:'image/svg+xml',body:image})
    );
    await page.route('https://images.pexels.com/**',route=>
      route.fulfill({status:200,contentType:'image/svg+xml',body:image}));
    await page.addInitScript(()=>{
      const original=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(...args){
        return this.matches('[data-wedding-preview-video]')
          ? Promise.resolve() : original.apply(this,args);
      };
    });
    const activate=locator=>touch?locator.tap():locator.click();
    const tapAt=(x,y)=>touch?page.touchscreen.tap(x,y):page.mouse.click(x,y);

    await page.goto(origin+'/digital-lookbook/',{waitUntil:'domcontentloaded'});
    const book=page.locator('#redcarpert-flipbook');
    await book.locator('.redcarpert-book-page.is-current').waitFor();
    await page.waitForFunction(()=>document.querySelector('#redcarpert-flipbook')?.dataset.engine==='fallback',
      null,{timeout:12000});
    await activate(page.getByRole('button',{name:'Next page',exact:true}));
    assert.equal(await book.getAttribute('data-current-page'),'2');
    const trigger=book.locator('.redcarpert-book-page.is-current [data-book-image-zoom]');
    await activate(trigger);
    const dialog=page.locator('#redcarpert-book-photo-dialog');
    assert(await dialog.evaluate(el=>el.open),width+'px tap photograph should open the zoom dialog');
    await page.waitForFunction(()=>
      document.querySelector('#redcarpert-book-photo-dialog [data-image-zoom-photo]')?.naturalWidth>0);
    const stage=dialog.locator('[data-image-zoom-stage]');
    assert((await stage.boundingBox())?.width>40,width+'px zoom stage must be visible');
    await activate(dialog.locator('[data-image-zoom-in]'));
    assert.equal(await dialog.locator('[data-image-zoom-percent]').textContent(),'150%');
    await activate(dialog.locator('[data-image-zoom-reset]'));
    assert.equal(await dialog.locator('[data-image-zoom-percent]').textContent(),'100%');
    if(width===390){
      const bounds=await stage.boundingBox();
      assert(bounds);
      const cx=bounds.x+bounds.width/2,cy=bounds.y+bounds.height/2;
      const devtools=await page.context().newCDPSession(page);
      await devtools.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[
        {x:cx-24,y:cy},{x:cx+24,y:cy},
      ]});
      await devtools.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[
        {x:cx-74,y:cy},{x:cx+74,y:cy},
      ]});
      await devtools.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      const percent=Number((await dialog.locator('[data-image-zoom-percent]').textContent()).replace('%',''));
      assert(percent>100&&percent<=400,'real two-finger pinch must zoom the phone photograph');
      await dialog.locator('[data-image-zoom-reset]').tap();
      assert.equal(await dialog.locator('[data-image-zoom-percent]').textContent(),'100%');
    }
    const close=dialog.locator('[data-book-image-close]');
    if(width<=1000){
      const frame=await dialog.boundingBox(),button=await close.boundingBox();
      assert(frame&&button,width+'px close button and modal must have layout');
      assert(button.y>=frame.y-1 && button.y+button.height<=frame.y+frame.height+1,
        width+'px X tap region must be inside the dialog, not only painted outside it');
    }
    await activate(close);
    assert.equal(await dialog.evaluate(el=>el.open),false,width+'px X should close zoom');
    assert.equal(await book.getAttribute('data-current-page'),'2',width+'px X should not turn the page');
    const outline=await trigger.evaluate(node=>getComputedStyle(node).outlineStyle);
    assert.equal(outline,'none',width+'px close X should not leave brown photo border');

    const gutter=await trigger.evaluate(button=>{
      const img=button.querySelector('img');
      const bounds=img.getBoundingClientRect();
      const ratio=Math.min(bounds.width/img.naturalWidth,bounds.height/img.naturalHeight);
      return {left:bounds.left+4,right:bounds.right-4,y:bounds.top+bounds.height/2,
        gap:(bounds.width-ratio*img.naturalWidth)/2};
    });
    assert(gutter.gap>5,width+'px test photo must leave an ivory side gutter');
    await tapAt(gutter.right,gutter.y);
    await page.waitForFunction(()=>document.querySelector('#redcarpert-flipbook')?.dataset.currentPage==='3');
    assert.equal(await dialog.evaluate(el=>el.open),false,width+'px gutter tap must not open zoom');
    const nextPhoto=book.locator('.redcarpert-book-page.is-current [data-book-image-zoom]');
    const left=await nextPhoto.evaluate(button=>{
      const box=button.querySelector('img').getBoundingClientRect();
      return {x:box.left+4,y:box.top+box.height/2};
    });
    await tapAt(left.x,left.y);
    await page.waitForFunction(()=>document.querySelector('#redcarpert-flipbook')?.dataset.currentPage==='2');
    const blank=await book.locator('.redcarpert-book-page.is-current').evaluate(leaf=>{
      const box=leaf.getBoundingClientRect();
      const photo=leaf.querySelector('.redcarpert-book-photo').getBoundingClientRect();
      return {x:box.right-5,y:photo.top+photo.height/2};
    });
    await tapAt(blank.x,blank.y);
    await page.waitForFunction(()=>document.querySelector('#redcarpert-flipbook')?.dataset.currentPage==='3');
    assert.equal(await dialog.evaluate(el=>el.open),false);
    const prev=page.getByRole('button',{name:'Previous page',exact:true});
    const forward=page.getByRole('button',{name:'Next page',exact:true});
    await activate(prev);
    assert.equal(await book.getAttribute('data-current-page'),'2',
      width+'px Previous control must always return to the preceding page');
    await activate(forward);
    assert.equal(await book.getAttribute('data-current-page'),'3',
      width+'px Next control must work after Previous');
    if (touch && width<=1100) {
      assert.equal(await book.getAttribute('data-engine'),'fallback',
        width+'px touch layout should avoid vendor PageFlip pointer interception');
    }
    if(width===390){
      await book.scrollIntoViewIfNeeded();
      const box=await book.boundingBox();
      assert(box,'touch swipe book must be visible');
      const y=box.y+box.height/2;
      const x1=box.x+box.width*.82,x2=box.x+box.width*.18;
      const devtools=await page.context().newCDPSession(page);
      await devtools.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y}]});
      await devtools.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x2,y}]});
      await devtools.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForFunction(()=>document.querySelector('#redcarpert-flipbook')?.dataset.currentPage==='4');
      assert.equal(await prev.isDisabled(),false,'Previous must remain enabled after a swipe');
      // Chromium can dispatch touchend but omit the compatibility click
      // immediately after a swipe. Verify the native touch handler ran and
      // that the click was suppressed instead of turning a second page.
      await page.evaluate(() => {
        window.__bookPreviousEvents = { touchend:0, click:0 };
        const control = document.querySelector('[data-book-previous]');
        control.addEventListener('touchend', () => { window.__bookPreviousEvents.touchend++; });
        control.addEventListener('click', () => { window.__bookPreviousEvents.click++; });
      });
      await activate(prev);
      try {
        await page.waitForFunction(() =>
          document.querySelector('#redcarpert-flipbook')?.dataset.currentPage === '3',
          null,{timeout:4000});
      } catch {
        const detail = await page.evaluate(() => ({
          page:document.querySelector('#redcarpert-flipbook')?.dataset.currentPage,
          engine:document.querySelector('#redcarpert-flipbook')?.dataset.engine,
          previousDisabled:document.querySelector('[data-book-previous]')?.disabled,
          previousEvents:window.__bookPreviousEvents,
        }));
        assert.fail('Previous must work immediately after a real touch swipe: ' +
          JSON.stringify(detail));
      }
      assert.equal(await book.getAttribute('data-current-page'),'3',
        'Previous must work after a real touch swipe');
      const handled = await page.evaluate(() => window.__bookPreviousEvents);
      assert.equal(handled.touchend,1,'Previous received exactly one touchend');
      assert.equal(handled.click,0,'handled touchend must suppress a duplicate click');
      // Ensure alternating buttons remain reliable after the swipe. Each tap
      // must update one page without a second synthetic click.
      await activate(forward);
      await page.waitForFunction(() =>
        document.querySelector('#redcarpert-flipbook')?.dataset.currentPage === '4',
        null,{timeout:4000});
      await activate(prev);
      await page.waitForFunction(() =>
        document.querySelector('#redcarpert-flipbook')?.dataset.currentPage === '3',
        null,{timeout:4000});
      assert.equal(await book.getAttribute('data-current-page'),'3',
        'alternating Previous and Next must not double-turn after a swipe');
    }

    // Switching the DevTools viewport after initialization must not strand
    // either page navigation or its photo click target.
    if(width===1024){
      await page.setViewportSize({width:390,height:844});
      const now=book.locator('.redcarpert-book-page.is-current [data-book-image-zoom]');
      await now.tap();
      assert(await dialog.evaluate(el=>el.open),'responsive mode switch should still allow photo zoom');
      await dialog.locator('[data-book-image-close]').tap();
      assert.equal(await dialog.evaluate(el=>el.open),false);
      await page.setViewportSize({width:1024,height:900});
    }

    await page.goto(origin+'/wedding-moments/',{waitUntil:'domcontentloaded'});
    const card=page.locator('[data-wedding-moments-grid] button[data-wedding-media="photo"]').first();
    await activate(card);
    const moments=page.locator('#redcarpert-wedding-preview');
    assert(await moments.evaluate(el=>el.open),width+'px wedding photo tap must open preview');
    await page.waitForFunction(()=>
      document.querySelector('#redcarpert-wedding-preview [data-image-zoom-photo]')?.naturalWidth>0);
    await activate(moments.locator('[data-image-zoom-in]'));
    assert.equal(await moments.locator('[data-image-zoom-percent]').textContent(),'150%');
    await activate(moments.locator('[data-image-zoom-reset]'));
    const closeMoments=moments.locator('[data-wedding-preview-close]');
    if(width<=1000){
      const frame=await moments.boundingBox(),button=await closeMoments.boundingBox();
      assert(frame&&button);
      assert(button.y>=frame.y-1 && button.y+button.height<=frame.y+frame.height+1,
        width+'px Wedding Moments close button needs a touch-safe hit region');
    }
    await activate(closeMoments);
    assert.equal(await moments.evaluate(el=>el.open),false,width+'px wedding X should close');
    const movie=page.locator('[data-wedding-moments-grid] button[data-wedding-media="video"]').first();
    await activate(movie);
    assert(await moments.evaluate(el=>el.open),width+'px video tap should keep working');
    assert.equal(await moments.locator('[data-image-zoom-controls]').isVisible(),false);
    await activate(closeMoments);
    assert.deepEqual(errors,[],width+'px browser must not raise uncaught errors');
    console.log('Real responsive '+(touch?'touch':'mouse')+' photo interactions PASS at '+width+'px');
    await page.close();
  }

  // The flat fallback remains a safety net if the CDN fails, but the real
  // editorial experience must keep its native animated PageFlip everywhere.
  // These requests are separate from the CDN-blocked fallback runs above.
  for (const width of [1440, 1024, 768, 390, 320]) {
    const touch = width <= 1024;
    const page = await browser.newPage({
      viewport: {width, height:900}, hasTouch:touch, isMobile:width <= 768,
      reducedMotion:'no-preference',
    });
    const pageErrors=[];
    page.on('pageerror', error=>pageErrors.push(error.message));
    await page.route('https://ik.imagekit.io/**', route=>route.fulfill({
      status:200,contentType:'image/svg+xml',body:image,
    }));
    await page.route('https://images.pexels.com/**', route=>route.fulfill({
      status:200,contentType:'image/svg+xml',body:image,
    }));
    await page.goto(origin+'/digital-lookbook/',{waitUntil:'domcontentloaded'});
    const book=page.locator('#redcarpert-flipbook');
    await page.waitForFunction(()=>
      document.querySelector('#redcarpert-flipbook')?.dataset.engine==='page-flip',
      null,{timeout:25000});
    assert.equal(await book.getAttribute('data-engine'),'page-flip',
      width+'px must use the 3D flipbook, not the plain-page reader');
    const current=async()=>Number(await book.getAttribute('data-current-page'));
    const progresses=async(previous,direction)=>{
      await page.waitForFunction(({previous,direction})=>{
        const value=Number(document.querySelector('#redcarpert-flipbook')?.dataset.currentPage);
        return direction > 0 ? value > previous : value < previous;
      },{previous,direction},{timeout:12000});
      await page.waitForTimeout(850);
      return current();
    };
    const activate=locator=>touch?locator.tap():locator.click();
    const at=async(x,y)=>touch?page.touchscreen.tap(x,y):page.mouse.click(x,y);
    const next=page.locator('[data-book-next]');
    const prev=page.locator('[data-book-previous]');
    let position=await current();
    assert.equal(position,1,width+'px 3D reader must begin at the cover');
    const cover=book.locator('[data-book-page="1"]');
    const coverRect=await cover.boundingBox();
    assert(coverRect&&coverRect.width>80,width+'px cover must render');
    // The old pre-zoom reader allowed a native paper tap to flip. Do not
    // require swipes or manual pointerup-to-click synthesis for this action.
    await at(coverRect.right-8,coverRect.top+Math.min(24,coverRect.height*.04));
    position=await progresses(position,1);
    assert(position>1,width+'px paper tap must make an animated page turn');
    await activate(prev);
    position=await progresses(position,-1);
    assert.equal(position,1,width+'px Previous must return to 3D cover');
    await activate(next);
    position=await progresses(position,1);
    const photoCandidate=await page.locator('[data-book-page="2"] [data-book-image-zoom] img')
      .evaluateAll(images=>{
        const options=images.map(img=>{
          const rect=img.getBoundingClientRect();
          return {x:rect.left+rect.width/2,y:rect.top+rect.height/2,
            width:rect.width,height:rect.height};
        }).filter(rect=>rect.width>30 && rect.height>30 && rect.x>0 &&
          rect.y>0 && rect.x<innerWidth && rect.y<innerHeight);
        return options[0]??null;
      });
    assert(photoCandidate,width+'px PageFlip must present a visible dress photograph');
    const beforeZoom=await current();
    await at(photoCandidate.x,photoCandidate.y);
    const dialog=page.locator('#redcarpert-book-photo-dialog');
    await page.waitForFunction(()=>
      document.querySelector('#redcarpert-book-photo-dialog')?.open,
      null,{timeout:5000});
    assert.equal(await dialog.evaluate(el=>el.open),true,
      width+'px touching the dress must open zoom, not turn the page');
    await page.waitForTimeout(860);
    assert.equal(await current(),beforeZoom,
      width+'px zoom must not start a delayed PageFlip turn');
    await activate(dialog.locator('[data-book-image-close]'));
    assert.equal(await dialog.evaluate(el=>el.open),false,width+'px X must close zoom');
    assert.equal(await current(),beforeZoom,width+'px closing zoom must retain the page');

    // Verify that neither button nor native swipe is broken after zoom.
    await activate(next);
    position=await progresses(beforeZoom,1);
    await activate(prev);
    position=await progresses(position,-1);
    assert.equal(position,beforeZoom,width+'px Previous after zoom must return');
    assert.deepEqual(pageErrors,[],width+'px 3D browser should not raise page errors');
    console.log('Real 3D PageFlip mouse/touch interactions PASS at '+width+'px');
    await page.close();
  }
} finally {
  try {
    await browser?.close();
  } finally {
    // Always stop our own preview, including assertion failures.
    await new Promise((resolve, reject) =>
      previewServer.httpServer.close(error => error ? reject(error) : resolve()));
  }
}
