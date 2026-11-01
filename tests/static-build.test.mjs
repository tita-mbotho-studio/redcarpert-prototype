import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import sharp from 'sharp';
const walk = dir => readdirSync(dir,{withFileTypes:true}).flatMap(file=>file.isDirectory()?walk(path.join(dir,file.name)):[path.join(dir,file.name)]);
const available = existsSync('dist/index.html');
test('static deployment contains complete approved pages, local paths and no application server', {skip:!available},()=>{
 const files=walk('dist'), htmlFiles=files.filter(f=>f.endsWith('.html'));
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 assert.equal(routes.length,16);
 assert.equal(htmlFiles.length,routes.length+1);
 for(const route of routes){
  const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
  assert.match(html,/<!doctype html>/i);assert.match(html,/<header id="header"/);assert.match(html,/<footer/);assert.match(html,/WhatsApp Enquiry Preview/);
  assert.doesNotMatch(html,/__NEXT_DATA__|self\.__next|\/_next\/|data-settings=/);
  for(const [,url] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)){
   assert(url.startsWith('/redcarpert-prototype/'),url);
   const local=path.join('dist',url.slice('/redcarpert-prototype/'.length));
   assert(existsSync(local)||existsSync(path.join(local,'index.html')),url);
  }
  const handoffs=[...html.matchAll(/<a\b[^>]*\bdata-whatsapp-send\b[^>]*\bhref="([^"]+)"[^>]*>/gi)];
  assert.equal(handoffs.length,1,route+' must have exactly one approved WhatsApp handoff');
  const sendLink=handoffs[0][0];
  const sendUrl=new URL(handoffs[0][1].replaceAll('&amp;','&'));
  assert.equal(sendUrl.origin,'https://wa.me');
  assert.equal(sendUrl.pathname,'/27680458811');
  assert(sendUrl.searchParams.get('text')?.includes('Hello Redcarpert Wedding Dresses!'));
  assert.match(sendLink,/target="_blank"/);
  assert.match(sendLink,/rel="noopener noreferrer"/);
  const sample=route.match(/\/product\/preview\/sample-(\d{2})-/);
  if(sample)assert(sendUrl.searchParams.get('text')?.includes('Sample '+sample[1]),
    route+' must retain its individual sample-dress enquiry');
 }
 assert(!files.some(f=>f.includes('/api/')||f.includes('_next')||f.includes('documents/')));
 assert(!existsSync('dist/product/arabella/index.html'));
 const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
 for(const name of ['next','react','react-dom'])assert(!lock.packages['node_modules/'+name]);
 assert.match(readFileSync('dist/404.html','utf8'),/Page not found/);
 const pdf=readFileSync('dist/digital-lookbook/Redcarpert-Sample-Lookbook.pdf');assert.equal(pdf.subarray(0,8).toString(),'%PDF-1.4');assert.match(pdf.toString('latin1'),/\/Count 2/);
});
test('copied classic scripts remain valid JavaScript and the footer SVG decodes',{skip:!available},async()=>{
 for(const file of walk('dist/site-assets').filter(f=>f.endsWith('.js')))new vm.Script(readFileSync(file,'utf8'),{filename:file});
 const image=await sharp('dist/redcarpert/instagram.svg').png().toBuffer();assert(image.length>100);
});

test('ten-page interactive book and eight shared Pexels products are published without local copies',{skip:!available},()=>{
 const book=readFileSync('dist/digital-lookbook/index.html','utf8');
 assert.equal((book.match(/data-book-page=/g)||[]).length,10);
 assert.equal((book.match(/class="redcarpert-book-logo"/g)||[]).length,2);
 assert.match(book,/data-book-next/); assert.match(book,/data-book-previous/);
 const gallery=readFileSync('dist/product/index.html','utf8');
 assert.equal((gallery.match(/data-catalogue-id=/g)||[]).length,8);
 for(const [category,count] of [['mermaid',4],['ball_gown',4]]) {
  const html=readFileSync('dist/product-category/'+category+'/index.html','utf8');
  assert.equal((html.match(/data-catalogue-id=/g)||[]).length,count);
 }
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 assert.equal(routes.filter(p=>p.startsWith('/product/preview/')).length,8);
 assert.equal((book.match(/https:\/\/images\.pexels\.com\/photos\//g)||[]).length,9);
 for(const route of routes.filter(p=>p.startsWith('/product/preview/'))) {
  const html=readFileSync('dist'+route+'/index.html','utf8');
  assert.match(html,/https:\/\/images\.pexels\.com\/photos\//);
  assert.match(html,/not confirmed Redcarpert inventory/i);
 }
});


test('release readiness: all public pages have Redcarpert metadata and safe outbound links',{skip:!available},()=>{
  const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
  assert.equal(routes.length,16);
  const expectedTitles={
    '/product':'Wedding Dresses | Redcarpert Wedding Dresses',
    '/product-category/mermaid':'Mermaid Wedding Dresses | Redcarpert',
    '/product-category/ball_gown':'Ball Gown Wedding Dresses | Redcarpert',
  };
  for(const route of routes){
    const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
    const title=html.match(/<title>([^<]+)<\/title>/i)?.[1];
    const description=html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
    assert(title?.includes('Redcarpert'),route+' missing Redcarpert page title');
    assert(description?.trim(),route+' missing SEO description');
    assert(!/bridal[\s_-]*vanesa|vanesabridal|nirvanatakipcim|tatli media|Ürün kategorileri/i.test(title),
      route+' exposes inherited reference-site title');
    if(expectedTitles[route])assert.equal(title,expectedTitles[route]);
    assert(html.includes('Nothing is sent until you press Send in WhatsApp.'),
      route+' missing explicit WhatsApp user-send disclosure');
    assert(!/(?:href|action)="(?:https?:\/\/[^"]*whatsapp\.(?:com|net)|whatsapp:|intent:)/i.test(html),
      route+' contains an unapproved WhatsApp/intent destination');
    for(const [,href] of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)){
      assert(!/^(?:javascript:|data:|vbscript:)/i.test(href),route+' unsafe anchor '+href);
      if(/^https?:\/\//i.test(href)){
        const outbound=new URL(href.replaceAll('&amp;','&'));
        assert(['images.pexels.com','wa.me'].includes(outbound.hostname.toLowerCase()),
          route+' links to an unapproved external site: '+href);
        if(outbound.hostname==='wa.me') {
          assert.equal(outbound.pathname,'/27680458811');
          assert.equal(outbound.searchParams.size,1,'WhatsApp URL can contain only the message query');
          assert(outbound.searchParams.get('text')?.includes('Redcarpert'));
        }
      }
    }
    for(const [,resource] of html.matchAll(/<(?:img|link|script)\b[^>]*\b(?:href|src)="([^"]+)"/gi)){
      assert(!/(?:bridalvanesa\.com|nirvanatakipcim\.com|instagram\.com\/bridal_vanesa)/i.test(resource),
        route+' contains a reference-site asset: '+resource);
    }
  }
});

test('release readiness: public GitHub Pages deployment requires explicit manual approval',()=>{
  const yaml=readFileSync('.github/workflows/pages.yml','utf8');
  assert.match(yaml,/workflow_dispatch:/);
  assert.match(yaml,/approve_deployment:/);
  assert.match(yaml,/default:\s*false/);
  assert.match(yaml,/github\.event_name == 'workflow_dispatch' && inputs\.approve_deployment/);
  assert.match(yaml,/actions\/deploy-pages@/);
});
