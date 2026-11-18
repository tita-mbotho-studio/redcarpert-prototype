import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import products from '../src/data/products.json' with {type:'json'};
const pageCount=products.dresses.length+2;

/** Real StPageFlip regression, not the CDN-blocked fallback test.
 * Isolate flipping from the externally hosted Pexels image availability. */
const browser = await chromium.launch({args:['--no-sandbox']});
const root = 'http://localhost:4173/redcarpert-prototype/digital-lookbook/';
try {
  // Animated two-page rendering is deliberately desktop-only. The responsive
  // touch regression suite covers the single-page reader at <=1100px.
  for (const width of [1440, 1280]) {
    const mobile = false;
    const page = await browser.newPage({
      viewport: {width,height:900},
      isMobile:false,
      hasTouch:false,
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

    // An actual pointer click on blank cover paper should turn the enhanced
    // PageFlip reader, without requiring the bottom navigation buttons.
    const cover=book.locator('[data-book-page="1"]');
    const coverBox=await cover.boundingBox();
    assert(coverBox,'enhanced front cover should be visible');
    await page.mouse.click(coverBox.x+coverBox.width-8,
      coverBox.y+Math.min(26,coverBox.height*.05));
    position=await progresses(position,1);
    assert(position>1,'clicking blank right-hand book paper should flip forward');
    await previous.click();
    position=await progresses(position,-1);
    assert.equal(position,1,'previous button should still return to cover');

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

    // Moving between DevTools desktop and mobile widths must not leave a dead
    // PageFlip overlay or break the Previous/Next controls.
    if (width === 1440) {
      await next.click();
      position=await progresses(position,1);
      await page.setViewportSize({width:390,height:844});
      await page.waitForFunction(()=>
        document.querySelector('#redcarpert-flipbook')?.dataset.engine==='fallback');
      const mobilePage=await current();
      assert(mobilePage>=2,'responsive teardown must preserve the current page');
      const mobilePrevious=page.getByRole('button',{name:'Previous page',exact:true});
      await mobilePrevious.click();
      assert.equal(await current(),mobilePage-1,
        'Previous must work after switching from desktop flip to mobile reader');
      await next.click();
      assert.equal(await current(),mobilePage,
        'Next must work after switching from desktop flip to mobile reader');
      await page.setViewportSize({width:1440,height:900});
      await page.waitForFunction(()=>
        document.querySelector('#redcarpert-flipbook')?.dataset.engine==='page-flip',
        null,{timeout:20000});
      assert.equal(await current(),mobilePage,
        'reactivated desktop PageFlip must retain the current page');
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'no horizontal overflow');
    assert.deepEqual(errors,[],'no JavaScript errors');
    console.log('Enhanced lookbook PASS',width,'px, at',position,'last page, real vendor loaded');
    await page.close();
  }
} finally { await browser.close(); }
