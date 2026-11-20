import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { catalogueProducts } from '../src/data/catalogue.ts';
import { weddingMomentEvents } from '../src/lib/wedding-moments.ts';

/** Exercise the centralized fallback with deliberately failed CDN derivatives.
 * Run after npm run preview, against http://localhost:4173. */
const browser=await chromium.launch({args:['--no-sandbox']});
const root='http://localhost:4173/redcarpert-wedding-dresses';
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="#d0c0b0"/></svg>';
try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const failures=[];
  page.on('pageerror',e=>failures.push(e.message));
  await page.route('https://ik.imagekit.io/**',route=>{
    const url=new URL(route.request().url());
    return url.searchParams.has('tr')
      ? route.abort('failed')
      : route.fulfill({status:200,contentType:'image/svg+xml',body:svg});
  });

  await page.goto(root+'/product/preview/ball-gown-01/',{waitUntil:'domcontentloaded'});
  const detail=page.locator('[data-gallery-active-image]');
  const original=catalogueProducts.find(item=>item.id==='ball-gown-01')?.image;
  assert(original?.startsWith('https://ik.imagekit.io/'));
  await page.waitForFunction(expected=>{
    const img=document.querySelector('[data-gallery-active-image]');
    return img && img.getAttribute('src')===expected && img.naturalWidth>0;
  },original,{timeout:15000});
  assert.equal(await detail.getAttribute('src'),original,
    'failed CDN derivative must fall back to original detailed image');

  await page.goto(root+'/wedding-moments/',{waitUntil:'domcontentloaded'});
  const tile=page.locator('[data-wedding-moments-grid] img').first();
  const tileOriginal=weddingMomentEvents[0].media[0].poster;
  assert(tileOriginal?.includes('/ik-thumbnail.jpg'));
  await page.waitForFunction(expected=>{
    const img=document.querySelector('[data-wedding-moments-grid] img');
    return img && img.getAttribute('src')===expected && img.naturalWidth>0;
  },tileOriginal,{timeout:15000});
  assert.equal(await tile.getAttribute('src'),tileOriginal,
    'failed Wedding Moments thumbnail derivative must fall back to its original poster');
  assert.equal(await page.locator('[data-wedding-moments-grid] button[data-wedding-media=video]').count(),1,
    'video still opens by user interaction, rather than downloading eagerly');

  await page.goto(root+'/',{waitUntil:'domcontentloaded'});
  const originalHero=await page.locator('[data-media-background-original]').first().getAttribute('data-media-background-original');
  await page.waitForFunction(original=>{
    const panel=document.querySelector('[data-media-background-original]');
    return panel?.style.getPropertyValue('--redcarpert-home-photo').includes(original);
  },originalHero,{timeout:15000});
  assert.equal(await page.locator('[data-media-background-original]').count(),3,
    'all three homepage photos retain fallback URLs');
  assert.deepEqual(failures,[],'media errors must be handled, not crash application JS');
  await page.close();
  console.log('Central media delivery fallback PASS: dress detail, Wedding Moments and homepage');
} finally {
  await browser.close();
}
