import { chromium } from 'playwright';
import assert from 'node:assert/strict';

/**
 * Footer regression: preserve header/footer logo geometry, three columns and
 * navigation type; keep both footer headings on one line at every viewport.
 * Includes the requested 375 × 667 phone size. No remote images required.
 */
const viewports = [
  {width:1440,height:900},
  {width:1024,height:768},
  {width:768,height:900},
  {width:390,height:844},
  {width:375,height:667},
  {width:360,height:740},
  {width:320,height:568},
];
const browser = await chromium.launch({args:['--no-sandbox']});
try {
  for (const {width,height} of viewports) {
    for (const route of ['/product/', '/about-us/']) {
      const page = await browser.newPage({viewport:{width,height}});
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
          headings:[...footer.querySelectorAll('.redcarpert-footer-heading')].map(heading=>({
            text:heading.textContent.trim().toUpperCase(),
            height:heading.getBoundingClientRect().height,
            lineHeight:parseFloat(getComputedStyle(heading).lineHeight),
            clientWidth:heading.clientWidth,
            scrollWidth:heading.scrollWidth,
            overflowWrap:getComputedStyle(heading).overflowWrap,
            whiteSpace:getComputedStyle(heading).whiteSpace,
          })),
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
        // Only the two heading labels tighten below 341px; all other type remains unchanged.
        const isHeading=String(type.className).includes('redcarpert-footer-heading');
        const expectedFont=width<=340 && isHeading ? 10.5 : metrics.headerFont;
        assert(Math.abs(type.size-expectedFont)<=0.1,
          width+'px '+route+' footer '+type.className+' font-size must remain '+expectedFont+'px: '+JSON.stringify(metrics));
      }
      assert(metrics.horizontalOverflow<=1.5,width+'px '+route+' horizontal overflow: '+metrics.horizontalOverflow);
      assert.equal(metrics.tagline,'Elegant bridal collections');
      const headings=['COLLECTIONS','FITTING ENQUIRIES'];
      for (const label of headings) {
        const heading=metrics.headings.find(h=>h.text===label);
        assert(heading,width+'px '+route+' is missing '+label);
        assert.equal(heading.whiteSpace,'nowrap',width+'px '+route+' '+label+' should not wrap');
        assert(heading.height<=heading.lineHeight+1,
          width+'px '+route+' '+label+' must be one line: '+JSON.stringify(heading));
        assert(heading.scrollWidth<=heading.clientWidth+1,
          width+'px '+route+' '+label+' must fit within its column: '+JSON.stringify(heading));
        assert.equal(heading.overflowWrap,'normal',width+'px '+route+' '+label+' should not split mid-word');
      }
      const totalWidth=metrics.gridColumns.reduce((sum,c)=>sum+c.width,0);
      const expectedFirst=width<=340?0.33:width<=640?0.36:0.45;
      assert(Math.abs(metrics.gridColumns[0].width/totalWidth-expectedFirst)<0.01,
        width+'px '+route+' unexpected logo column ratio: '+JSON.stringify(metrics.gridColumns));
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
