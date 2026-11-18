import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import products from '../src/data/products.json' with {type:'json'};
const pageCount=products.dresses.length+2;

/** Real StPageFlip regression, not the CDN-blocked fallback test.
 * Isolate flipping from the externally hosted Pexels image availability. */
const browser = await chromium.launch({args:['--no-sandbox']});
const root = 'http://localhost:4173/redcarpert-prototype/digital-lookbook/';
try {
  for (const width of [1440, 1024, 768, 390, 320]) {
    const mobile = width <= 390;
    const touch = width <= 1024;
    const page = await browser.newPage({
      viewport: {width,height:900},
      isMobile:mobile,
      hasTouch:touch,
      reducedMotion:'no-preference',
    });
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // Real PageFlip, but deterministic portrait images at every breakpoint.
    // Broken remote photos must not obscure whether responsive taps work.
    const portrait='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1400">'+
      '<rect width="900" height="1400" fill="#e9ddd2"/></svg>';
    for(const host of ['https://images.pexels.com/**','https://ik.imagekit.io/**']){
      await page.route(host,route=>route.fulfill({
        status:200,contentType:'image/svg+xml',body:portrait,
      }));
    }
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

    // An actual pointer click on blank cover paper should turn the enhanced
    // PageFlip reader, without requiring the bottom navigation buttons.
    const cover=book.locator('[data-book-page="1"]');
    const coverBox=await cover.boundingBox();
    assert(coverBox,'enhanced front cover should be visible');
    if (touch) await page.touchscreen.tap(coverBox.x+coverBox.width-8,
      coverBox.y+Math.min(26,coverBox.height*.05));
    else await page.mouse.click(coverBox.x+coverBox.width-8,
      coverBox.y+Math.min(26,coverBox.height*.05));
    position=await progresses(position,1);
    assert(position>1,'clicking blank right-hand book paper should flip forward');
    await previous.click();
    position=await progresses(position,-1);
    assert.equal(position,1,'previous button should still return to cover');

    // Test a real TOUCH tap on an animated leaf. The mobile/portrait PageFlip
    // renderer clones pages: a desktop mouse click cannot verify this path.
    if (touch) {
      await next.click();
      position=await progresses(position,1);
      const candidates=await book.locator('[data-book-page="2"] [data-book-image-zoom] img')
        .evaluateAll(images => images.map(img => {
          const r=img.getBoundingClientRect();
          const cx=r.left+r.width/2,cy=r.top+r.height/2;
          const hit=document.elementFromPoint(cx,cy);
          return {x:cx,y:cy,width:r.width,height:r.height,
            topmost:Boolean(hit?.closest?.('[data-book-image-zoom]')===img.closest('[data-book-image-zoom]'))};
        }).filter(p=>p.width>40 && p.height>40 &&
          p.x>=0 && p.x<innerWidth && p.y>=0 && p.y<innerHeight));
      assert(candidates.length,width+'px active dress leaf should render a tappable photo');
      const point=candidates.find(p=>p.topmost)??candidates[0];
      await page.touchscreen.tap(point.x,point.y);
      const dialog=page.locator('#redcarpert-book-photo-dialog');
      await page.waitForFunction(()=>document.querySelector('#redcarpert-book-photo-dialog')?.open,
        null,{timeout:10000});
      assert(await dialog.evaluate(node=>node.open),width+'px tap must enlarge portrait-mode book photo');
      await dialog.locator('[data-image-zoom-in]').tap();
      assert.equal(await dialog.locator('[data-image-zoom-percent]').textContent(),'150%');
      await dialog.locator('[data-book-image-close]').tap();
      assert.equal(await dialog.evaluate(node=>node.open),false);
      assert.equal(await current(),position,'close must preserve the same page');

      // Page margins are independent of the book's controls. Click a visible
      // empty area of the active physical leaf to flip forward on touch.
      const paper=await book.evaluate(book=>{
        const rect=book.getBoundingClientRect();
        return {x:rect.right-8,y:rect.top+Math.min(25,rect.height*.045)};
      });
      assert(paper.x>0&&paper.x<width,width+'px right-hand book margin must be visible');
      await page.touchscreen.tap(paper.x,paper.y);
      position=await progresses(position,1);
      await previous.click();
      position=await progresses(position,-1);
      await previous.click();
      position=await progresses(position,-1);
      assert.equal(position,1,'touch checks must leave the cover ready for existing navigation tests');
    }

    let count=0;
    while(position<pageCount && count<pageCount){
      assert.equal(await next.isDisabled(),false,'next disabled before back cover');
      await next.click();
      position=await progresses(position,1);
      count++;
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
