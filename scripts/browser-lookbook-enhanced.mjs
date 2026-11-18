import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import products from '../src/data/products.json' with {type:'json'};
const pageCount=products.dresses.length+2;

/** Real StPageFlip regression, not the CDN-blocked fallback test.
 * Isolate flipping from the externally hosted Pexels image availability. */
const browser = await chromium.launch({args:['--no-sandbox']});
const root = 'http://localhost:4173/redcarpert-prototype/digital-lookbook/';
try {
  for (const width of [1440, 768, 390]) {
    const mobile = width === 390;
    const page = await browser.newPage({
      viewport: {width,height:900},
      isMobile:mobile,
      hasTouch:mobile,
      reducedMotion:'no-preference',
    });
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://images.pexels.com/**',route=>route.abort());
    await page.goto(root,{waitUntil:'domcontentloaded'});
    const book=page.locator('#redcarpert-flipbook');
    await book.locator('.stf__block').waitFor({timeout:30000});
    assert.equal(await book.getAttribute('data-engine'),'page-flip','must use real enhanced reader');
    assert.equal(await page.locator('[data-book-page]').count(),pageCount);
    assert.equal(await book.locator('.redcarpert-book-endpaper').count(),pageCount%2,'odd-length book needs one unnumbered physical endpaper');
    const current=async()=>Number(await book.getAttribute('data-current-page'));
    const progresses=async(previous,direction)=>{
      await page.waitForFunction(
        ({previous,direction})=>{
          const current=Number(document.querySelector('#redcarpert-flipbook')?.dataset.currentPage);
          return direction>0 ? current>previous : current<previous;
        },{previous,direction},{timeout:12000}
      );
      await page.waitForTimeout(880);
      const now=await current();
      assert(direction>0?now>previous:now<previous,'page-turn stalled');
      return now;
    };
    const next=page.getByRole('button',{name:'Next page',exact:true});
    const previous=page.getByRole('button',{name:'Previous page',exact:true});
    let position=await current();
    assert.equal(position,1,'starts on cover');
    let count=0;
    while(position<pageCount && count<pageCount){
      assert.equal(await next.isDisabled(),false,'next disabled before back cover');
      await next.click();
      position=await progresses(position,1);
      count++;
      if (count===1) {
        // The first dress uses a deliberately blocked Pexels source in CI.
        // Replace only this test photograph with a deterministic loaded image.
        const image=book.locator('[data-book-page="2"] img[data-book-zoom-photo]').first();
        await image.waitFor({state:'visible'});
        await image.evaluate(photo=>new Promise(resolve=>{
          photo.onload=()=>{
            photo.classList.remove('redcarpert-image-unavailable');
            photo.closest('.redcarpert-book-photo')?.classList.remove('redcarpert-photo-failed');
            resolve();
          };
          const src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="900" height="1600"%3E%3Crect width="900" height="1600" fill="silver"/%3E%3C/svg%3E';
          photo.dataset.bookZoomSrc=src;
          photo.dataset.bookZoomOriginal=src;
          photo.src=src;
        }));
        await image.click();
        const modal=page.locator('[data-book-zoom-dialog]');
        await modal.waitFor({state:'visible'});
        assert.equal(await current(),position,'photo click must not flip PageFlip');
        assert.equal(await modal.locator('.redcarpert-wedding-preview-image').count(),1);
        assert.equal(await modal.locator('[data-book-zoom-in],[data-book-zoom-out]').count(),0);
        await page.keyboard.press('Escape');
        await modal.waitFor({state:'hidden'});
        assert.equal(await current(),position,'closing photo viewer must keep book page');
        if (mobile) {
          // Swipe from inside the *painted photo*, not its ivory gutters.
          await image.scrollIntoViewIfNeeded();
          const pixels=await image.evaluate(photo=>{
            const r=photo.getBoundingClientRect();
            const scale=Math.min(r.width/photo.naturalWidth,r.height/photo.naturalHeight);
            const w=photo.naturalWidth*scale,h=photo.naturalHeight*scale;
            return {left:r.left+(r.width-w)/2,right:r.left+(r.width+w)/2,y:r.top+r.height/2};
          });
          const x1=pixels.right-(pixels.right-pixels.left)*.12;
          const x2=pixels.left+(pixels.right-pixels.left)*.12;
          assert(x1-x2>35,'the painted photograph must support a native swipe');
          const session=await page.context().newCDPSession(page);
          await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:pixels.y}]});
          for(let step=1;step<=5;step++) {
            await session.send('Input.dispatchTouchEvent',{
              type:'touchMove',touchPoints:[{x:x1+(x2-x1)*step/5,y:pixels.y}]
            });
          }
          await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
          const afterSwipe=await progresses(position,1);
          assert.equal(await modal.isVisible(),false,'swiping a photo must not open zoom');
          await previous.click();
          position=await progresses(afterSwipe,-1);
          assert.equal(position,2,'previous returns to the photographed leaf');
        }
      }
    }
    assert.equal(position,pageCount,'reached back cover across all spreads');
    assert.equal(await next.isDisabled(),true);
    await previous.click();
    position=await progresses(position,-1);
    await book.focus();
    await page.keyboard.press('ArrowLeft');
    position=await progresses(position,-1);
    await page.keyboard.press('ArrowRight');
    position=await progresses(position,1);
    count=0;
    while(position>1 && count<pageCount){
      await previous.click();
      position=await progresses(position,-1);
      count++;
    }
    assert.equal(position,1,'returned to front cover');
    assert.equal(await previous.isDisabled(),true);
    if (mobile) {
      // Previous/Next controls sit below the book. After navigating with
      // buttons, the book can be outside the viewport: touch coordinates
      // would otherwise land on the page background rather than the book.
      const livePage=book.locator('.stf__block');
      await livePage.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const bounds=await livePage.boundingBox();
      assert(bounds,'animated book is visible on mobile');
      const y=Math.max(35,Math.min(865,bounds.y+bounds.height*.5));
      const x1=bounds.x+bounds.width*.82;
      const x2=bounds.x+bounds.width*.14;
      const target=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.className??'none',{x:x1,y});
      console.log('Mobile enhanced swipe target',JSON.stringify({bounds,x1,x2,y,target}));
      const session=await page.context().newCDPSession(page);
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y}]});
      // StPageFlip treats a gesture as a swipe only when it finishes within
      // 250 ms. Six 55-ms pauses were intentionally producing a drag, not a
      // swipe; dispatch continuous motion without artificial slow delays.
      const started=Date.now();
      for(let i=1;i<=5;i++){
        await session.send('Input.dispatchTouchEvent',{
          type:'touchMove',touchPoints:[{x:x1+(x2-x1)*i/5,y}]
        });
      }
      console.log('Mobile swipe gesture dispatch duration',Date.now()-started,'ms');
      await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      position=await progresses(1,1);
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'no horizontal overflow');
    assert.deepEqual(errors,[],'no JavaScript errors');
    console.log('Enhanced lookbook PASS',width,'px, at',position,'last page, real vendor loaded');
    await page.close();
  }
} finally { await browser.close(); }
