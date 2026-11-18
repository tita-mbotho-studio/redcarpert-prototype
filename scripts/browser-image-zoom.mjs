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
      'closing via Escape returns focus for keyboard navigation');

    // A pointer click on X should retain logical focus without a brown ring.
    await trigger.click();
    assert(await dialog.evaluate(node=>node.open),'photo can still be enlarged after Escape');
    await dialog.locator('[data-book-image-close]').click();
    await page.waitForFunction(() => document.querySelector(
      '.redcarpert-book-page.is-current [data-book-image-zoom]'
    )?.classList.contains('redcarpert-book-pointer-return'));
    const focusStyle=await trigger.evaluate(node=>({
      focused: document.activeElement===node,
      outlineStyle: getComputedStyle(node).outlineStyle,
      outlineWidth: getComputedStyle(node).outlineWidth,
    }));
    assert(focusStyle.focused,'closing X should restore logical focus');
    assert(focusStyle.outlineStyle==='none'||focusStyle.outlineWidth==='0px',
      'clicking X must not leave a brown image border');
    assert.equal(await book.getAttribute('data-current-page'),'2',
      'closing X must preserve the active book page');

    // object-fit:contain paints only the centre of the full-width <img> box.
    // Its ivory side gutters should turn pages, not trigger photo enlargement.
    const gutter=await trigger.evaluate(button=>{
      const img=button.querySelector('img');
      const box=img.getBoundingClientRect();
      const factor=Math.min(box.width/img.naturalWidth,box.height/img.naturalHeight);
      return {left:box.left+4,right:box.right-4,y:box.top+box.height/2,
        width:(box.width-factor*img.naturalWidth)/2};
    });
    assert(gutter.width>8,'mock portrait must have white side gutters');
    await page.mouse.move((gutter.left+gutter.right)/2,gutter.y);
    assert.equal(await trigger.evaluate(node=>getComputedStyle(node).cursor),'zoom-in',
      'hovering the photograph must advertise zoom');
    await page.mouse.move(gutter.right,gutter.y);
    assert.equal(await trigger.evaluate(node=>getComputedStyle(node).cursor),'pointer',
      'hovering blank ivory paper must advertise a page turn');
    await page.mouse.click(gutter.right,gutter.y);
    assert.equal(await dialog.evaluate(node=>node.open),false,
      'white space around photograph must not open zoom');
    assert.equal(await book.getAttribute('data-current-page'),'3',
      'clicking right-hand gutter should turn forward');
    const nextDress=page.locator('.redcarpert-book-page.is-current [data-book-image-zoom]');
    const left=await nextDress.evaluate(button=>{
      const box=button.querySelector('img').getBoundingClientRect();
      return {x:box.left+4,y:box.top+box.height/2};
    });
    await page.mouse.click(left.x,left.y);
    assert.equal(await book.getAttribute('data-current-page'),'2',
      'clicking left-hand gutter should turn backward');

    // Empty paper margins outside the image frame also turn pages.
    const paper=await page.locator('.redcarpert-book-page.is-current').evaluate(leaf=>{
      const box=leaf.getBoundingClientRect();
      const photo=leaf.querySelector('.redcarpert-book-photo').getBoundingClientRect();
      return {x:box.right-5,y:photo.top+photo.height/2};
    });
    await page.mouse.click(paper.x,paper.y);
    assert.equal(await book.getAttribute('data-current-page'),'3',
      'clicking blank paper should turn without using bottom arrow buttons');
    await next.click();
    assert.equal(await book.getAttribute('data-current-page'),'4',
      'existing bottom arrows must still work after paper click');

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
