import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({args:['--no-sandbox']});
const origin='http://localhost:4173/redcarpert-prototype';
const image='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1400">'+
  '<rect width="900" height="1400" fill="#e9ddd2"/></svg>';

try {
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
      await activate(prev);
      assert.equal(await book.getAttribute('data-current-page'),'3',
        'Previous must work after a real touch swipe');
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
} finally {
  await browser.close();
}
