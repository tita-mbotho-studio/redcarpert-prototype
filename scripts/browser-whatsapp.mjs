import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import { catalogueProducts } from '../src/data/catalogue.ts';
import { displaySalePriceForDress, displayRentalPriceForDress } from '../src/lib/pricing.ts';
import { generalFittingMessage } from '../src/lib/whatsapp-messages.ts';

// All WhatsApp handoffs are native links, not website review dialogs.
// Intercept wa.me before network access: never contact or message the business.
const browser=await chromium.launch({args:['--no-sandbox']});
try {
  for(const {route,width,name,trigger} of [
    {route:'/',width:1440,name:'homepage floating enquiry',trigger:'#redcarpert-floating-whatsapp [data-whatsapp-send]'},
    {route:'/product/preview/mermaid-lefa-dress/',width:390,name:'Mermaid dress fitting',trigger:'[data-detail-preview] [data-whatsapp-send]'},
    {route:'/product/preview/ball-gown-02/',width:768,name:'Ball Gown dress fitting',trigger:'[data-detail-preview] [data-whatsapp-send]'},
    {route:'/contact-us/',width:375,name:'mobile footer fitting',trigger:'#footer .redcarpert-footer-book'},
  ]){
    const context=await browser.newContext({viewport:{width,height:900}});
    await context.route('https://wa.me/**',request=>request.fulfill({
      status:200,contentType:'text/html',
      body:'<!doctype html><html><head><title>WhatsApp test handoff</title></head><body>Offline intercepted handoff</body></html>',
    }));
    const page=await context.newPage();
    await page.goto('http://localhost:4173/redcarpert-wedding-dresses'+route,{waitUntil:'domcontentloaded'});
    if(width<=640)assert(await page.locator('#redcarpert-floating-whatsapp').isHidden(),name+' floating widget must be hidden on phones');
    else assert(await page.locator('#redcarpert-floating-whatsapp [data-whatsapp-send]').isVisible(),name+' floating CTA must be visible');

    assert.equal(await page.locator('#enquiry-preview').count(),0,name+' must not render a website message preview');
    const control=page.locator(trigger);
    assert.equal(await control.evaluate(el=>el.tagName),'A',name+' must use a native direct link');
    assert.equal(await control.getAttribute('target'),'_blank');
    assert.equal(await control.getAttribute('rel'),'noopener noreferrer');
    const href=new URL((await control.getAttribute('href')).replaceAll('&amp;','&'));
    assert.equal(href.hostname,'wa.me');
    assert.equal(href.pathname,'/27680458811');
    const message=href.searchParams.get('text');
    assert(message?.startsWith('Hello Redcarpert Wedding Dresses,\n\n'),
      name+' must start with a readable greeting and blank line');
    if(name.includes('dress fitting')){
      const dress=name==='Mermaid dress fitting'
        ? catalogueProducts.find(d=>d.id==='mermaid-lefa-dress')
        : catalogueProducts.find(d=>d.id==='ball-gown-02');
      assert(dress,'browser test dress fixture is missing');
      assert(message.includes('*Sale Price:* '+displaySalePriceForDress(dress.id)),
        name+' must include the same sale price as its detail page');
      assert(message.includes('*Rental Price Range:* '+displayRentalPriceForDress(dress.id)),
        name+' must include the same rental price range as its detail page');
      assert(message.includes('*Collection:* '),name+' must identify the collection');
      assert(message.includes('available sizes'),name+' must ask about fitting sizes');
      assert(!message.includes('inspiration collection'),name+' must not use a separate inspiration message');
    } else {
      assert.equal(message,generalFittingMessage(),name+' must use the standardized general fitting message');
    }
    const [popup]=await Promise.all([context.waitForEvent('page'),control.click()]);
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(popup.url(),href.toString(),name+' must open the prepared WhatsApp message immediately');
    assert.equal(await popup.title(),'WhatsApp test handoff');
    await popup.close();

    if(width===1440){
      const close=page.locator('#redcarpert-floating-whatsapp [data-dismiss-whatsapp]');
      assert(await close.isVisible(),'desktop floating dismiss X must be visible');
      await close.click();
      assert(await page.locator('#redcarpert-floating-whatsapp').isHidden());
      assert.equal(await page.evaluate(()=>sessionStorage.getItem('redcarpert-floating-whatsapp-dismissed')),'1');
      await page.goto('http://localhost:4173/redcarpert-wedding-dresses/about-us/',{waitUntil:'domcontentloaded'});
      assert(await page.locator('#redcarpert-floating-whatsapp').isHidden(),'dismissal must persist across pages');
      const footer=page.locator('#footer .redcarpert-footer-social-whatsapp');
      const [footerPopup]=await Promise.all([context.waitForEvent('page'),footer.click()]);
      await footerPopup.waitForLoadState('domcontentloaded');
      assert.equal(new URL(footerPopup.url()).hostname,'wa.me','footer remains usable after floating CTA dismissed');
      await footerPopup.close();
    }
    await context.close();
    console.log('Direct WhatsApp handoff PASS',width,name);
  }
}finally {await browser.close();}
