import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
import products from '../src/data/products.json' with { type: 'json' };
import { displaySalePriceForDress, displayRentalPriceForDress } from '../src/lib/pricing.ts';
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});let results=[];
for(const width of [1440,768,390]){
const p=await b.newPage({viewport:{width,height:900}});let errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://localhost:4173/redcarpert-prototype/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2600);
if(width===1440){
  await p.keyboard.press('ArrowDown');
  await p.waitForTimeout(650);
  assert(await p.evaluate(()=>scrollY>0),'native keyboard scrolling');
  await p.mouse.wheel(0,320);
  await p.waitForTimeout(650);
  assert(await p.evaluate(()=>scrollY>100),'native wheel scrolling');
  await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  await p.waitForTimeout(100);
  assert(await p.evaluate(()=>document.querySelector('footer[data-homepage-footer]').getBoundingClientRect().top<innerHeight),'footer follows photos in natural flow');
  // The approved header tucks away on downward scroll; reveal it with
  // an upward wheel gesture before testing the logo's Home reset.
  await p.mouse.move(width/2,450);
  await p.mouse.wheel(0,-340);
  await p.waitForTimeout(550);
  assert(await p.evaluate(()=>!document.body.classList.contains('redcarpert-header-tucked')),'header returns on upward scroll');
  await p.locator('#header #logo-container > a').click();
  await p.waitForFunction(()=>scrollY<5,{},{timeout:5000});
}
else{await p.locator('#header .mobile-nav').click();await p.waitForTimeout(500);assert(await p.locator('#header .mob-nav-menu').isVisible());await p.locator('#header .mob-nav-arrow').click();await p.waitForTimeout(500);assert(await p.locator('#header .mob-nav-menu .sub-menu').isVisible());await p.locator('#header .mob-nav-menu a').filter({hasText:/^Mermaid$/}).click();await p.waitForTimeout(1500);assert(p.url().includes('/redcarpert-prototype/product-category/mermaid'));}
await p.goto('http://localhost:4173/redcarpert-prototype/product/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
const filterButtons=await p.locator('.redcarpert-catalogue-filter').evaluate(group=>
  [...group.querySelectorAll('button[data-filter-category]')].map(button=>{
    const r=button.getBoundingClientRect();
    return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right};
  }));
assert.equal(filterButtons.length,6,'all six catalogue filter choices must remain');
const filterRows=[];
for(const button of filterButtons){
  const row=filterRows.find(items=>Math.abs(items[0].y-button.y)<2);
  if(row)row.push(button);else filterRows.push([button]);
  assert(button.height>=43.5,width+'px filter needs a touch-friendly height');
  assert(button.width<=210.5,width+'px filter button must stay compact');
  assert(button.x>=-1&&button.right<=width+1,width+'px filter button must not overflow');
}
assert.deepEqual(filterRows.map(row=>row.length),width<=640?[2,2,2]:width<=1000?[3,3]:[4,2],
  width+'px category filters should use compact responsive rows');
assert.equal(await p.locator('[data-catalogue-id]').count(),35);
const expectedByCategory={mermaid:4,ball_gown:11,ruffled:12,modern_tradition:4,two_in_one:4};
for(const [category,expected] of Object.entries(expectedByCategory)){
  await p.locator('[data-filter-category="'+category+'"]').click();
  assert.equal(await p.locator('[data-catalogue-id]:visible').count(),expected);
  assert.equal(await p.locator('[data-filter-status]').textContent(),'Showing '+expected+' of 35 wedding dresses');
}await p.locator('[data-filter-category="all"]').click();await p.locator('[data-catalogue-id="sample-mermaid"] a').click();await p.waitForTimeout(1600);assert(p.url().includes('/product/preview/sample-01-mermaid'));const price=products.dresses.find(d=>d.id==='sample-mermaid')?.priceZar;assert(price!==undefined);assert.equal(await p.locator('[data-sale-price]').textContent(),displaySalePriceForDress('sample-mermaid'));assert.equal(await p.locator('[data-rental-price]').textContent(),displayRentalPriceForDress('sample-mermaid'));assert.equal(await p.locator('[data-related-dress]').count(),3);assert.equal(await p.locator('.redcarpert-detail-collection').textContent(),'Mermaid Collection');const fitting=p.locator('[data-detail-preview] .redcarpert-detail-actions a.redcarpert-detail-fitting-button');assert.equal(await fitting.getAttribute('aria-label'),'Book a Fitting via WhatsApp');assert.equal(await fitting.textContent(),'');const liveLink=new URL(await fitting.getAttribute('href'));assert.equal(liveLink.hostname,'wa.me');assert.equal(liveLink.pathname,'/27680458811');assert.match(liveLink.searchParams.get('text'),/\*Dress:\* Look 01/);assert.match(liveLink.searchParams.get('text'),/\*Collection:\* Mermaid/);assert.match(liveLink.searchParams.get('text'),/\*Sale Price:\* R /);assert.match(liveLink.searchParams.get('text'),/\*Rental Price Range:\* R /);assert.equal(await fitting.getAttribute('target'),'_blank');assert.equal(await p.locator('#enquiry-preview').count(),0);await p.context().route('https://wa.me/**',req=>req.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Intercepted WhatsApp link</title>'}));const [fittingPopup]=await Promise.all([p.context().waitForEvent('page'),fitting.click()]);await fittingPopup.waitForLoadState('domcontentloaded');assert.equal(fittingPopup.url(),liveLink.toString());await fittingPopup.close();await p.locator('.wpgis-popup').click();await p.waitForTimeout(500);assert(await p.locator('.fancybox-container').isVisible());await p.keyboard.press('Escape');await p.locator('.fancybox-container').waitFor({state:'hidden'});await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(400);const topControl = p.locator('footer > .scroll-to-top');if(await topControl.isVisible()) await topControl.click();else await topControl.evaluate(control=>control.click());await p.waitForTimeout(1200);assert.equal(await p.evaluate(()=>Math.round(scrollY)),0);
await p.goto('http://localhost:4173/redcarpert-prototype/digital-lookbook/',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1400);const [download]=await Promise.all([p.waitForEvent('download'),p.getByRole('link',{name:'Download The Bridal Edit (PDF)'}).click()]);const file=await download.path();assert.match(fs.readFileSync(file).subarray(0,8).toString(),/^%PDF-1\.[4-9]/);assert.equal(download.suggestedFilename(),'Redcarpert-The-Bridal-Edit-'+new Date().getFullYear()+'.pdf');assert.deepEqual(errors,[]);results.push({width,homepageScroll:true,navigation:true,catalogue:true,sample:true,enquiry:true,zoom:true,scrollToTop:true,pdf:true});await p.close();}
fs.writeFileSync('/tmp/10-interactions.json',JSON.stringify(results,null,2));await b.close();console.log(results)})();
