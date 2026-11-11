import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const origin='http://localhost:4173/redcarpert-prototype';
const browser=await chromium.launch({args:['--no-sandbox']});
try {
  for(const {width,height} of [{width:1440,height:900},{width:768,height:1024},{width:375,height:667},{width:320,height:568}]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // Reproduce a slow first-photo response without changing the approved image.
    await page.route('**/redcarpert/home/brand-pexels-sample.webp',async route=>{
      await new Promise(resolve=>setTimeout(resolve,950));
      await route.continue();
    });
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    const loader=page.locator('#redcarpert-page-loader');
    assert.equal(await loader.isVisible(),true,width+'px loader should cover delayed hero');
    assert.equal(await page.locator('#redcarpert-page-loader .rc-load-logo').isVisible(),true);
    assert.equal(await page.locator('#redcarpert-page-loader .rc-load-spinner').count(),1);
    const heroPreload=await page.locator('link[rel="preload"][as="image"]').getAttribute('href');
    assert.equal(heroPreload,'/redcarpert-prototype/redcarpert/home/brand-pexels-sample.webp');
    await loader.waitFor({state:'detached',timeout:11000});
    const appearance=await page.evaluate(()=>{
      const header=document.querySelector('#header');
      return {
        background:getComputedStyle(document.querySelector('.fullpage-wrapper > .section')).backgroundImage,
        headerPosition:getComputedStyle(header).position,
        headerHeight:header.getBoundingClientRect().height,
        contentWidth:document.documentElement.scrollWidth,
      };
    });
    assert(appearance.background.includes('brand-pexels-sample.webp'));
    assert.equal(appearance.headerPosition,'fixed',width+'px header must remain accessible while scrolling');
    assert(appearance.contentWidth<=width+1.5,width+'px horizontal overflow');
    await page.evaluate(()=>scrollTo({top:Math.round(innerHeight*.6),behavior:'instant'}));
    await page.waitForTimeout(100);
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('fixed-header-scroll')),true);
    const compact = await page.evaluate(() => ({
      paddingTop:parseFloat(getComputedStyle(document.querySelector('#header')).paddingTop),
      logoMaxHeight:parseFloat(getComputedStyle(document.querySelector('#logo-container img')).maxHeight),
    }));
    assert(compact.paddingTop<=9,width+'px compact header must reduce vertical padding');
    assert(compact.logoMaxHeight<=(width<=1000?33:41),
      width+'px compact header logo must scale down: '+compact.logoMaxHeight);
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('redcarpert-header-tucked')),true,
      width+'px downward scroll must tuck compact header');
    await page.evaluate(()=>scrollTo({top:Math.round(innerHeight*.3),behavior:'instant'}));
    await page.waitForTimeout(100);
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('redcarpert-header-tucked')),false,
      width+'px scrolling up should reveal header');
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(100);
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('fixed-header-scroll')),false,
      width+'px initial header dimensions should restore at top');
    assert.deepEqual(errors,[],width+'px browser errors');
    console.log('Header + slow hero loader PASS',width,height);
    await page.close();
  }

  // The loader must apply to every editorial/catalogue route; never leave
  // a permanent overlay even when a request for remote imagery is aborted.
  const routes=['/product/','/our-brides/','/about-us/','/contact-us/','/digital-lookbook/'];
  for(const route of routes){
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.route('https://images.pexels.com/**',r=>r.abort());
    await page.goto(origin+route,{waitUntil:'domcontentloaded'});
    await page.locator('#redcarpert-page-loader').waitFor({state:'detached',timeout:11000});
    assert.equal(await page.locator('#header').isVisible(),true,route+' must remain usable');
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('redcarpert-home-native')),false);
    console.log('Site-wide loader PASS',route);
    await page.close();
  }
} finally {
  await browser.close();
}
