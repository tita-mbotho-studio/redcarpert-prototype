import { chromium } from 'playwright';
import assert from 'node:assert/strict';

/** Native homepage geometry and real user input at responsive viewports. */
const url='http://localhost:4173/redcarpert-prototype/';
const viewports=[
  {width:1440,height:900},
  {width:1024,height:768},
  {width:768,height:1024},
  {width:390,height:844},
  {width:375,height:667},
  {width:320,height:568},
];
const images=[
  'brand-pexels-sample.webp',
  'collection-pexels-sample.webp',
  'hero-pexels-sample.webp',
];
const browser=await chromium.launch({args:['--no-sandbox']});
try {
  for (const {width,height} of viewports) {
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.classList.contains('redcarpert-home-native'));
    await page.waitForTimeout(250);
    const m=await page.evaluate(()=>{
      const sections=[...document.querySelectorAll('.fullpage-wrapper > .section')];
      const box=e=>{
        const r=e.getBoundingClientRect();
        return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
      };
      return {
        sections:sections.map(s=>({
          box:box(s),
          bg:getComputedStyle(s).backgroundImage,
          size:getComputedStyle(s).backgroundSize,
          position:getComputedStyle(s).backgroundPosition,
          title:s.querySelector('.section-title') ? box(s.querySelector('.section-title')) : null,
          subtitle:s.querySelector('.section-desc') ? box(s.querySelector('.section-desc')) : null,
          button:s.querySelector('.section-content > a.button') ? box(s.querySelector('.section-content > a.button')) : null,
          titleFont:s.querySelector('.section-title') ? parseFloat(getComputedStyle(s.querySelector('.section-title')).fontSize) : null,
          buttonFont:s.querySelector('.section-content > a.button') ? parseFloat(getComputedStyle(s.querySelector('.section-content > a.button')).fontSize) : null,
          buttonLabel:s.querySelector('.section-content > a.button')?.textContent.trim()??null,
        })),
        footer:box(document.querySelector('footer[data-homepage-footer]')),
        horizontalOverflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
        scrollHeight:document.documentElement.scrollHeight,
        native:document.body.classList.contains('redcarpert-home-native'),
        fullpagePluginMounted:Boolean(document.querySelector('#superContainer')),
        loading:document.querySelector('.fullpage-wrapper')?.classList.contains('loading'),
        arrowLabel:sections[0]?.querySelector('.fullpage-scroll-arrow')?.getAttribute('aria-label'),
        header:box(document.querySelector('#header')),
      };
    });
    assert.equal(m.native,true,'native scroll should be enabled');
    assert.equal(m.fullpagePluginMounted,false,width+'px legacy fullpage plugin must not wrap document');
    assert.equal(m.loading,false,'remove legacy loading screen');
    assert.equal(m.sections.length,3,'exactly the original three photos');
    assert(m.sections.every((s,i)=>s.bg.includes(images[i])),width+'px photos changed or missing');
    for(const [i,s] of m.sections.entries()) {
      assert.equal(s.size,'cover',width+'px photo '+i+' must be cover framed');
      assert(s.box.width>=width-2,width+'px photo '+i+' should fill viewport width');
      assert(s.box.height>height*.69,width+'px photo '+i+' is too short');
      if(i>0)assert(Math.abs(s.box.y-m.sections[i-1].box.bottom)<3,
        width+'px photo '+i+' should follow previous photo without gaps or overlap');
      if(s.title) {
        assert(s.title.x>=0&&s.title.right<=width+1,width+'px title '+i+' horizontal overflow');
        assert(s.title.y>=s.box.y&&s.title.bottom<=s.box.bottom,width+'px title '+i+' must fit in photo');
        assert(s.titleFont>=23&&s.titleFont<=41,width+'px title '+i+' size inappropriate');
      }
      if(s.button) {
        assert(s.button.x>=0&&s.button.right<=width+1,width+'px button '+i+' clips');
        assert(s.button.height>=43,width+'px button '+i+' lacks touch target');
        assert(s.button.y>=s.box.y&&s.button.bottom<=s.box.bottom,width+'px button '+i+' not inside photo');
        assert(s.buttonFont>=11.5&&s.buttonFont<=14.5,width+'px button '+i+' font size inappropriate');
      }
      if(s.subtitle&&s.title){
        assert(s.subtitle.y>=s.title.bottom-1,width+'px subtitle should follow title');
        assert(s.subtitle.x>=0&&s.subtitle.right<=width+1,width+'px subtitle overflow');
      }
    }
    assert.equal(m.sections[1].title,null,'middle photograph must remain text-free');
    assert(m.sections[0].buttonLabel?.length>0&&m.sections[2].buttonLabel?.length>0,'preserve CTAs');
    assert(Math.abs(m.footer.y-m.sections[2].box.bottom)<4,width+'px footer should follow image three naturally');
    assert(m.scrollHeight>height*2.2,width+'px homepage must scroll vertically');
    assert(m.horizontalOverflow<=1.5,width+'px horizontal overflow: '+m.horizontalOverflow);
    assert.equal(m.arrowLabel,'Scroll to the next bridal photograph');

    await page.mouse.wheel(0,400);
    await page.waitForTimeout(600);
    let scroll=await page.evaluate(()=>scrollY);
    assert(scroll>20,width+'px wheel must scroll continuously rather than snap/lock');
    assert(scroll<650,width+'px wheel should not jump a full slide on one tick: '+scroll);
    await page.evaluate(()=>window.scrollTo({top: document.documentElement.scrollHeight,behavior:'instant'}));
    await page.waitForTimeout(130);
    const before=await page.evaluate(()=>scrollY);
    await page.mouse.wheel(0,-320);
    await page.waitForTimeout(700);
    const after=await page.evaluate(()=>scrollY);
    assert(after<before-15,width+'px should reverse smoothly from footer');
    assert(before-after<650,width+'px reverse wheel should not skip photo three');

    await page.locator('#header #logo-container > a').click();
    await page.waitForFunction(()=>scrollY<5,{},{timeout:5000});
    await page.locator('.fullpage-scroll-arrow').click();
    await page.waitForFunction(()=>scrollY>window.innerHeight*.5,{},{timeout:5000});
    const link=page.locator('.fullpage-wrapper > .section').first().locator('a.button');
    assert((await link.getAttribute('href')).includes('/product/'));
    assert.deepEqual(errors,[],width+'px browser errors');
    console.log('Native homepage PASS',width,height,m.sections.map(s=>Math.round(s.box.height)),m.sections.map(s=>s.position));
    await page.close();
  }
} finally { await browser.close(); }
