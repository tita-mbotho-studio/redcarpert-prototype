import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import products from '../src/data/products.json' with {type:'json'};

const base = 'http://localhost:4173/redcarpert-prototype';
const routes = ['/digital-lookbook/', '/about-us/', '/contact-us/'];
const viewports = [
  {width: 1440, height: 900},
  {width: 1024, height: 768},
  {width: 1000, height: 800},
  {width: 768, height: 900},
  {width: 640, height: 800},
  {width: 560, height: 760},
  {width: 390, height: 844},
  {width: 375, height: 667},
  {width: 320, height: 568},
];
const browser = await chromium.launch({args: ['--no-sandbox']});
try {
  for (const {width, height} of viewports) {
    for (const route of routes) {
      const page = await browser.newPage({viewport: {width, height}});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      // CSS geometry is independent of provider availability or consent state.
      await page.route('https://www.google.com/maps/**', r => r.abort());
      await page.route('https://images.pexels.com/**', r => r.abort());
      await page.goto(base + route, {waitUntil: 'domcontentloaded'});
      const metrics = await page.evaluate(() => {
        const wrap = document.querySelector('.redcarpert-editorial');
        const title = document.querySelector('.redcarpert-editorial-page-title h1');
        const banner = document.querySelector('.redcarpert-editorial-page-title');
        const hero = wrap.querySelector('.redcarpert-editorial-hero');
        const panels = [...wrap.querySelectorAll('.redcarpert-editorial-panel')];
        const box = e => {
          const r = e.getBoundingClientRect();
          return {x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom, center:r.x+r.width/2};
        };
        const control = e => ({
          ...box(e),
          fontSize: parseFloat(getComputedStyle(e).fontSize),
          paddingLeft: parseFloat(getComputedStyle(e).paddingLeft),
          whiteSpace: getComputedStyle(e).whiteSpace,
        });
        const range = document.createRange();
        range.selectNodeContents(title);
        const titleText = range.getBoundingClientRect();
        const map = wrap.querySelector('.redcarpert-editorial-map');
        const team = wrap.querySelector('.redcarpert-editorial-team-grid');
        return {
          title: box(title),
          banner: box(banner),
          titleTextCenter: titleText.x + titleText.width / 2,
          hero: box(hero),
          root: box(wrap),
          panels: panels.map(box),
          h2Alignments: [...wrap.querySelectorAll('.redcarpert-editorial-hero h2, .redcarpert-editorial-panel h2')].map(h => getComputedStyle(h).textAlign),
          panelCount: panels.length,
          layoutClass: document.querySelector('#content-container')?.className,
          sidebar: Boolean(document.querySelector('#content-container #sidebar')),
          map: map ? box(map) : null,
          mapSrc: map?.querySelector('iframe')?.getAttribute('src') ?? null,
          mapLink: wrap.querySelector('a[href^="https://www.google.com/maps/search/"]')?.href ?? null,
          teamCount: team?.querySelectorAll('figure').length ?? 0,
          teamColumns: team ? getComputedStyle(team).gridTemplateColumns.split(' ').length : 0,
          teamLast: team ? box(team.lastElementChild) : null,
          teamSources: team ? [...team.querySelectorAll('img')].map(img => img.getAttribute('src')) : [],
          actionGroup: wrap.querySelector('.redcarpert-editorial-actions') ? box(wrap.querySelector('.redcarpert-editorial-actions')) : null,
          actionButtons: [...wrap.querySelectorAll('.redcarpert-editorial-actions .redcarpert-editorial-action')].map(box),
          fittingButtons: [...wrap.querySelectorAll('a.button[data-whatsapp-send]')].map(control),
          downloadButton: wrap.querySelector('.redcarpert-lookbook-download a.button') ? control(wrap.querySelector('.redcarpert-lookbook-download a.button')) : null,
          bookPages: wrap.querySelectorAll('#redcarpert-flipbook [data-book-page]').length,
          scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        };
      });
      assert.equal(metrics.layoutClass, 'content-boxed layout-full', width + 'px ' + route + ' layout must be full width');
      assert.equal(metrics.sidebar, false, width + 'px ' + route + ' should not have a sidebar');
      assert.equal(metrics.h2Alignments.every(a => a === 'center'), true, width + 'px ' + route + ' headings should be centred');
      assert(Math.abs(metrics.hero.center - metrics.root.center) <= 2, width + 'px ' + route + ' hero is off centre');
      assert(Math.abs(metrics.titleTextCenter - metrics.banner.center) <= 3, width + 'px ' + route + ' page title is off centre');
      for (const panel of metrics.panels) {
        assert(Math.abs(panel.center - metrics.root.center) <= 2, width + 'px ' + route + ' panel is off centre');
        assert(panel.width <= metrics.root.width + 1, width + 'px ' + route + ' panel exceeds root width');
      }
      for (const button of metrics.fittingButtons) {
        assert(button.height>=43.5,width+'px '+route+' fitting button needs a comfortable touch target');
        assert(button.right<=width+1&&button.x>=-1,width+'px '+route+' fitting button must not overflow');
        const maxFittingWidth=width<=640?205.5:width<=1000?230.5:260.5;
        assert(button.width<=maxFittingWidth,width+'px '+route+' fitting button must stay compact');
        assert.equal(button.whiteSpace,'normal',width+'px '+route+' fitting label must wrap if needed');
        if(width<=640)assert(button.fontSize<=11.75,width+'px '+route+' fitting label must be phone-sized');
      }
      for (const action of metrics.actionButtons) {
        assert(action.height>=43.5,width+'px '+route+' collection action must be tappable');
        assert(action.width<=210.5,width+'px '+route+' action must not become oversized');
      }
      if (route === '/about-us/') {
        assert.equal(metrics.actionButtons.length,5,'all five collection links must remain');
        const expectedColumns=width<=640?2:width<=1000?3:5;
        const rows=[];
        for(const action of metrics.actionButtons){
          const existing=rows.find(row=>Math.abs(row[0].y-action.y)<=1);
          if(existing)existing.push(action);else rows.push([action]);
        }
        const expectedRows=expectedColumns===5?[5]:expectedColumns===3?[3,2]:[2,2,1];
        assert.deepEqual(rows.map(row=>row.length),expectedRows,
          width+'px About Us must use five / three-two / two-two-one responsive columns');
        if(rows.at(-1).length===1){
          assert(Math.abs(rows.at(-1)[0].center-metrics.actionGroup.center)<=2,
            width+'px final collection button must be centred');
        }else{
          const last=rows.at(-1);
          const center=(last[0].x+last.at(-1).right)/2;
          assert(Math.abs(center-metrics.actionGroup.center)<=2,
            width+'px partial last button row must be centred');
        }
        assert.equal(metrics.teamCount, 3);
        assert(metrics.teamSources.every(s => s.startsWith('https://images.pexels.com/photos/')));
        assert(metrics.teamColumns >= 1 && metrics.teamColumns <= 3);
        if (metrics.teamColumns===2) {
          assert(Math.abs(metrics.teamLast.center - metrics.root.center)<=2,
            width + 'px the last team card must be centred on tablet');
        }
      } else if (route === '/contact-us/') {
        assert.equal(metrics.actionButtons.length,1,'Contact Us keeps its browse-dresses action');
        assert(Math.abs(metrics.actionButtons[0].center-metrics.actionGroup.center)<=2,
          width+'px Contact Us action must stay centered');
        assert.equal(metrics.panelCount, 3);
        assert(metrics.map && metrics.map.width > 200, width + 'px map missing or collapsed');
        assert(Math.abs(metrics.map.center - metrics.root.center) <= 2, width + 'px map is not centred');
        assert(metrics.mapSrc.includes('Pomona%2C%20Kempton%20Park%2C%20Gauteng%2C%20South%20Africa'));
        assert(metrics.mapLink.includes('Pomona'));
      } else {
        assert(metrics.downloadButton,'lookbook download action must be present');
        assert(metrics.downloadButton.height>=43.5,width+'px lookbook download must be tappable');
        const maxDownloadWidth=width<=640?225.5:width<=1000?250.5:280.5;
        assert(metrics.downloadButton.width<=maxDownloadWidth,
          width+'px lookbook download must shrink with the viewport');
        assert.equal(metrics.downloadButton.whiteSpace,'normal',
          width+'px lookbook download must wrap rather than overflow');
        if(width<=640) {
          assert(metrics.downloadButton.fontSize<=11.25,
            width+'px lookbook download font must scale down on phones');
          assert(metrics.downloadButton.paddingLeft<=12.5,
            width+'px lookbook download padding must scale down on phones');
        }
        assert.equal(metrics.bookPages, products.dresses.length+2, 'flippable book must remain intact');
      }
      assert(metrics.scrollWidth <= width+1.5, width + 'px ' + route + ' horizontal overflow: ' + metrics.scrollWidth);
      assert.deepEqual(errors, [], width + 'px ' + route + ' browser errors');
      console.log('Editorial layout PASS',width,route,'panels',metrics.panelCount,'map',Boolean(metrics.map));
      await page.close();
    }
  }
} finally {
  await browser.close();
}
