import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({args:['--no-sandbox']});
try{
  for(const width of [1440,768,390]){
    const page=await browser.newPage({viewport:{width,height:900}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://images.pexels.com/**',route=>route.abort());
    await page.goto('http://localhost:4173/redcarpert-prototype/product/',{waitUntil:'domcontentloaded'});
    const controls=page.locator('[data-catalogue-filter]');
    const samples=page.locator('[data-catalogue-id]');
    const visible=page.locator('[data-catalogue-id]:visible');
    await controls.waitFor();
    assert.equal(await samples.count(),8);assert.equal(await visible.count(),8);
    const buttons=controls.locator('button[data-filter-category]');
    assert.equal(await buttons.count(),3);
    await buttons.nth(1).click();
    assert.equal(await visible.count(),4);
    assert.equal(await page.locator('[data-catalogue-category="mermaid"]:visible').count(),4);
    assert.equal(await controls.getAttribute('data-active-category'),'mermaid');
    assert.equal(new URL(page.url()).searchParams.get('category'),'mermaid');
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await visible.count(),4,'filter reload preserved');
    await page.locator('button[data-filter-category="ball_gown"]').click();
    assert.equal(await visible.count(),4);
    assert.equal(await page.locator('[data-catalogue-category="ball_gown"]:visible').count(),4);
    await page.locator('button[data-filter-category="all"]').click();
    assert.equal(await visible.count(),8);
    assert.equal(new URL(page.url()).searchParams.has('category'),false);

    await page.goto('http://localhost:4173/redcarpert-prototype/our-brides/',{waitUntil:'domcontentloaded'});
    const gallery=page.locator('[data-brides-gallery]');
    await gallery.waitFor();
    const cards=gallery.locator('[data-bride-card]');
    assert.equal(await cards.count(),18);
    assert.equal(await gallery.locator('.redcarpert-bride-accent').count(),6);
    assert.equal(await gallery.locator(':scope > *').count(),24);
    const id=Number(await gallery.getAttribute('data-gallery-pattern'));
    assert(id>=1&&id<=5,'selected one of five layouts');
    const geometry=await page.evaluate(()=>{
      const images=[...document.querySelectorAll('[data-brides-gallery] [data-bride-card] img')];
      const img=images[0].getBoundingClientRect();
      const container=document.querySelector('[data-brides-gallery]');
      return {ratio:img.width/img.height,columns:getComputedStyle(container).gridTemplateColumns.split(' ').length,overflow:document.documentElement.scrollWidth>innerWidth+1};
    });
    assert(Math.abs(geometry.ratio-370/444)<0.02,'photo ratio must match catalogue');
    assert.equal(geometry.columns,width===1440?4:2,'responsive column count');
    assert.equal(geometry.overflow,false,'gallery horizontal overflow');

    const first=cards.first().locator('button[data-bride-preview]');
    await first.click();
    const dialog=page.locator('#redcarpert-bride-preview');
    assert(await dialog.evaluate(e=>e.open),'image card opens');
    assert.equal(await dialog.evaluate(e=>getComputedStyle(e,'::backdrop').backdropFilter.includes('blur')),true,'blurred overlay');
    const bounds=await dialog.boundingBox();
    assert(bounds && bounds.width<width && bounds.height<=900,'preview stays inside viewport');
    await page.keyboard.press('Escape');
    assert.equal(await dialog.evaluate(e=>e.open),false,'Escape closes');
    await first.click();
    await page.locator('[data-bride-preview-close]').click();
    assert.equal(await dialog.evaluate(e=>e.open),false,'close button works');
    await page.reload({waitUntil:'domcontentloaded'});
    const next=Number(await gallery.getAttribute('data-gallery-pattern'));
    assert(next>=1&&next<=5&&next!==id,'refresh chooses different pattern');
    assert.equal(await cards.count(),18);
    assert.deepEqual(errors,[],'no runtime JavaScript failures at '+width);
    await page.close();
    console.log('Catalogue filter and Our Brides PASS',width,'px; patterns',id,'→',next);
  }
}finally{await browser.close();}
