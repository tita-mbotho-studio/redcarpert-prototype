import { chromium } from 'playwright';
import assert from 'node:assert/strict';

/**
 * Implementation 16 visual-geometry guard: header/footer logo parity,
 * nav/footer typography parity and original 3-column layout at every width.
 * Browses the built production preview. Does not require remote images to load.
 */
const browser = await chromium.launch({args:['--no-sandbox']});
try {
  for (const width of [1440, 768, 390]) {
    for (const route of ['/product/', '/about-us/']) {
      const page = await browser.newPage({viewport:{width,height:900}});
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto('http://localhost:4173/redcarpert-prototype'+route,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#header #logo-container img')
        && document.querySelector('#footer[data-redcarpert-footer] .wp-image-13926')
        && document.querySelectorAll('#footer[data-redcarpert-footer] .redcarpert-footer-columns > .col').length===3);
      await page.waitForTimeout(800);
      const metrics=await page.evaluate(()=>{
        const logo=document.querySelector('#header #logo-container img');
        const footer=document.querySelector('#footer[data-redcarpert-footer]');
        const footerLogo=footer.querySelector('.wp-image-13926');
        const nav=(innerWidth<=1000?document.querySelector('#header .mob-nav-menu a'):null)
          ?? document.querySelector('#header #menu-blog-layouts > li > a');
        const columns=[...footer.querySelectorAll('.redcarpert-footer-columns > .col')];
        const typeElements=[
          ...footer.querySelectorAll('.redcarpert-footer-heading, .redcarpert-footer-items, .redcarpert-footer-tagline, .copyrights')
        ];
        const box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right};};
        return {
          headerLogo:box(logo),footerLogo:box(footerLogo),
          headerFont:parseFloat(getComputedStyle(nav).fontSize),
          fontSizes:typeElements.map(e=>({className:e.className,size:parseFloat(getComputedStyle(e).fontSize)})),
          gridColumns:columns.map(box),
          gridDisplay:getComputedStyle(columns[0].parentElement).display,
          horizontalOverflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
          tagline:footer.querySelector('.redcarpert-footer-tagline')?.textContent?.trim(),
        };
      });
      assert.equal(metrics.gridDisplay,'grid',route+' footer must remain a grid');
      assert.equal(metrics.gridColumns.length,3,route+' must retain exactly three footer columns');
      assert(metrics.gridColumns.every(c=>c.width>0 && c.height>0),route+' collapsed footer column '+JSON.stringify(metrics));
      assert(metrics.gridColumns[0].x<metrics.gridColumns[1].x
        && metrics.gridColumns[1].x<metrics.gridColumns[2].x,route+' mobile footer was stacked');
      for(const key of ['width','height']){
        assert(Math.abs(metrics.headerLogo[key]-metrics.footerLogo[key])<=1.5,
          width+'px '+route+' '+key+' must exactly track the header: '+JSON.stringify(metrics));
      }
      for(const type of metrics.fontSizes){
        assert(Math.abs(type.size-metrics.headerFont)<=0.1,
          width+'px '+route+' footer '+type.className+' must use header font-size: '+JSON.stringify(metrics));
      }
      assert(metrics.horizontalOverflow<=1.5,width+'px '+route+' horizontal overflow: '+metrics.horizontalOverflow);
      assert.equal(metrics.tagline,'Elegant bridal collections');
      assert.deepEqual(errors,[],width+'px '+route+' page errors');
      console.log('Footer/header responsive parity PASS',width,route,
        'logo',Math.round(metrics.headerLogo.width)+'x'+Math.round(metrics.headerLogo.height),
        'font',metrics.headerFont+'px','columns',metrics.gridColumns.map(c=>Math.round(c.width)).join('/'));
      await page.close();
    }
  }
} finally {
  await browser.close();
}
