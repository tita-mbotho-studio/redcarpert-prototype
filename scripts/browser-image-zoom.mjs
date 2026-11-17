import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({args:['--no-sandbox']});
const origin = 'http://localhost:4173/redcarpert-prototype';
const placeholder = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1400"><rect width="900" height="1400" fill="#e8dfd6"/></svg>';
const media = async route => {
  if (route.request().resourceType() === 'media') {
    return route.fulfill({status:200,contentType:'video/mp4',body:''});
  }
  return route.fulfill({status:200,contentType:'image/svg+xml',body:placeholder});
};

try {
  for (const width of [1440, 390]) {
    const mobile = width === 390;
    const page = await browser.newPage({viewport:{width,height:900},hasTouch:mobile,isMobile:mobile});
    const errors = [];
    page.on('pageerror',e => errors.push(e.message));
    await page.route('https://cdn.jsdelivr.net/npm/page-flip@2.0.7/**',route=>route.abort());
    await page.route('https://ik.imagekit.io/**',media);
    await page.route('https://images.pexels.com/**',media);
    await page.addInitScript(() => {
      const native = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...args) {
        return this.hasAttribute('data-wedding-preview-video') ? Promise.resolve() : native.apply(this,args);
      };
    });

    // Book: full-size photographs load on demand and do not turn the page.
    await page.goto(origin + '/digital-lookbook/',{waitUntil:'domcontentloaded'});
    await page.locator('#redcarpert-flipbook[data-engine="fallback"]').waitFor();
    const next = page.getByRole('button',{name:'Next page',exact:true});
    await next.click();
    const book = page.locator('#redcarpert-flipbook');
    assert.equal(await book.getAttribute('data-current-page'),'2');
    assert.equal(await page.locator('[data-book-image-zoom]').count(),27);
    const dialog = page.locator('#redcarpert-book-photo-dialog');
    const enlarged = dialog.locator('[data-image-zoom-photo]');
    assert.equal(await enlarged.getAttribute('src'),null,'large image is lazy until click');
    const trigger = page.locator('.redcarpert-book-page.is-current [data-book-image-zoom]');
    const original = await trigger.getAttribute('data-book-zoom-original');
    const preview = await trigger.getAttribute('data-book-zoom-preview');
    assert(original && preview);
    await trigger.click();
    assert(await dialog.evaluate(node => node.open));
    assert.equal(await enlarged.getAttribute('src'),preview);
    assert.equal(await enlarged.getAttribute('data-media-original'),preview===original?null:original);
    assert.equal(await dialog.locator('[data-image-zoom-percent]').textContent(),'100%');
    await dialog.locator('[data-image-zoom-in]').click();
    assert.equal(await dialog.locator('[data-image-zoom-percent]').textContent(),'150%');
    await dialog.locator('[data-image-zoom-in]').click();
    assert.equal(await dialog.locator('[data-image-zoom-percent]').textContent(),'225%');
    await dialog.locator('[data-image-zoom-out]').click();
    assert.equal(await dialog.locator('[data-image-zoom-percent]').textContent(),'150%');
    await dialog.locator('[data-image-zoom-reset]').click();
    assert.equal(await dialog.locator('[data-image-zoom-percent]').textContent(),'100%');
    const stage = dialog.locator('[data-image-zoom-stage]');
    await stage.hover();
    await page.mouse.wheel(0,-120);
    assert.equal(await dialog.locator('[data-image-zoom-percent]').textContent(),'120%');
    await dialog.locator('[data-image-zoom-reset]').click();

    if (mobile) {
      const bounds = await stage.boundingBox();
      assert(bounds && bounds.width>80 && bounds.height>80,'zoom stage must be visible on mobile');
      const cx = bounds.x+bounds.width/2, cy=bounds.y+bounds.height/2;
      const session = await page.context().newCDPSession(page);
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[
        {x:cx-25,y:cy},{x:cx+25,y:cy}
      ]});
      await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[
        {x:cx-70,y:cy},{x:cx+70,y:cy}
      ]});
      await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      const percent = Number((await dialog.locator('[data-image-zoom-percent]').textContent()).replace('%',''));
      assert(percent > 100 && percent <= 400,'touch pinch should magnify the wedding dress');
    }

    await page.keyboard.press('Escape');
    assert.equal(await dialog.evaluate(node=>node.open),false);
    assert.equal(await enlarged.getAttribute('src'),null,'close releases the large photograph');
    assert.equal(await book.getAttribute('data-current-page'),'2','closing zoom preserves the book page');
    assert.equal(await trigger.evaluate(node=>document.activeElement===node),true,
      'closing returns focus to the photograph control');
    await next.click();
    assert.equal(await book.getAttribute('data-current-page'),'3','page turning still works after zoom');

    // Wedding Moments: the same zoom is available on photos, not videos.
    await page.goto(origin + '/wedding-moments/',{waitUntil:'domcontentloaded'});
    const photo = page.locator('[data-wedding-moments-grid] button[data-wedding-media="photo"]').first();
    await photo.click();
    const moments = page.locator('#redcarpert-wedding-preview');
    assert(await moments.evaluate(node=>node.open));
    assert.equal(await moments.locator('[data-image-zoom-controls]').isVisible(),true);
    assert.equal(await moments.locator('[data-image-zoom-percent]').textContent(),'100%');
    await moments.locator('[data-image-zoom-in]').click();
    assert.equal(await moments.locator('[data-image-zoom-percent]').textContent(),'150%');
    await moments.locator('[data-image-zoom-reset]').click();
    assert.equal(await moments.locator('[data-image-zoom-percent]').textContent(),'100%');
    await moments.locator('[data-wedding-preview-close]').click();
    assert.equal(await moments.evaluate(node=>node.open),false);
    assert.equal(await photo.evaluate(node=>document.activeElement===node),true);
    await page.locator('[data-wedding-moments-grid] button[data-wedding-media="video"]').first().click();
    assert(await moments.evaluate(node=>node.open));
    assert.equal(await moments.locator('[data-image-zoom-controls]').isVisible(),false,
      'videos retain native playback, not photo zoom controls');
    assert.equal(await moments.locator('[data-wedding-preview-video]').evaluate(node=>node.controls),true);
    await page.keyboard.press('Escape');
    assert.equal(await moments.evaluate(node=>node.open),false);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    assert.deepEqual(errors,[]);
    await page.close();
    console.log('Shared photo zoom PASS at',width,'px');
  }
} finally {
  await browser.close();
}
