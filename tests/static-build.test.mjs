import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import sharp from 'sharp';
import {catalogueProducts} from '../src/data/catalogue.ts';
import {displayPriceForDress, PRICE_CONDITION_DISCLAIMER} from '../src/lib/pricing.ts';
import {photosForDress} from '../src/lib/dress-gallery.ts';
import {sampleFittingMessage,sampleDetailTitle} from '../src/lib/product-detail-preview.ts';
import {buildWhatsAppUrl} from '../src/config/whatsapp.ts';
const walk = dir => readdirSync(dir,{withFileTypes:true}).flatMap(file=>file.isDirectory()?walk(path.join(dir,file.name)):[path.join(dir,file.name)]);
const available = existsSync('dist/index.html');
test('static deployment contains complete approved pages, local paths and no application server', {skip:!available},()=>{
 const files=walk('dist'), htmlFiles=files.filter(f=>f.endsWith('.html'));
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 assert.equal(routes.length,38);
 assert.equal(htmlFiles.length,routes.length+1);
 for(const route of routes){
  const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
  assert.match(html,/<!doctype html>/i);assert.match(html,/<header id="header"/);assert.match(html,/<footer/);
  assert.doesNotMatch(html,/id="enquiry-preview"|data-whatsapp-preview|WhatsApp Enquiry Preview/,
    route+' must not include the old website-based WhatsApp preview');
  assert.doesNotMatch(html,/__NEXT_DATA__|self\.__next|\/_next\/|data-settings=/);
  for(const [,url] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)){
   assert(url.startsWith('/redcarpert-prototype/'),url);
   const local=path.join('dist',url.slice('/redcarpert-prototype/'.length));
   assert(existsSync(local)||existsSync(path.join(local,'index.html')),url);
  }
  const handoffs=[...html.matchAll(/<a\b[^>]*\bdata-whatsapp-send\b[^>]*\bhref="([^"]+)"[^>]*>/gi)];
  assert(handoffs.length>=3,route+' must contain direct fitting, footer and floating WhatsApp links');
  const product=catalogueProducts.find(item=>item.previewRoute.replace(/\/$/,'')===route.replace(/\/$/,''));
  const expectedMessage=product ? sampleFittingMessage(product)
    : 'Hello Redcarpert Wedding Dresses!\n\nI would like to ask about your wedding dresses and book a fitting. Could you please help me?\n\nThank you.';
  const expectedUrl=buildWhatsAppUrl(expectedMessage);
  for(const [,href] of handoffs){
    const linkUrl=new URL(href.replaceAll('&amp;','&'));
    assert.equal(linkUrl.toString(),expectedUrl,route+' wrong direct WhatsApp message');
    assert.equal(linkUrl.origin,'https://wa.me');
  }
  for(const [markup] of handoffs){
    assert.match(markup,/target="_blank"/);
    assert.match(markup,/rel="noopener noreferrer"/);
    assert.doesNotMatch(markup,/aria-haspopup="dialog"/);
  }
  if(product)assert(expectedMessage.includes(sampleDetailTitle(product)),route+' must identify its specific gown');
 }
 assert(!files.some(f=>f.includes('/api/')||f.includes('_next')||f.includes('documents/')));
 assert(!existsSync('dist/product/arabella/index.html'));
 const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
 for(const name of ['next','react','react-dom'])assert(!lock.packages['node_modules/'+name]);
 assert.match(readFileSync('dist/404.html','utf8'),/Page not found/);
 const year=new Date().getFullYear();
 const premiumPdf='dist/digital-lookbook/Redcarpert-The-Bridal-Edit-'+year+'.pdf';
 const pdf=readFileSync(premiumPdf);assert.match(pdf.subarray(0,8).toString(),/^%PDF-1\.[4-9]/);
 assert.match(pdf.toString('latin1'),/\/Count 39/);
 assert.deepEqual(pdf,readFileSync('dist/digital-lookbook/Redcarpert-Sample-Lookbook.pdf'),'old PDF URL remains available');
 const downloadHtml=readFileSync('dist/digital-lookbook/index.html','utf8');
 assert(downloadHtml.includes('Redcarpert-The-Bridal-Edit-'+year+'.pdf'),'download button must use annual editorial PDF');
 const audit=JSON.parse(readFileSync('.generated/lookbook-image-audit.json','utf8'));
 assert.equal(audit.photoCount,27);assert.equal(audit.photos.length,27);
});
test('copied classic scripts remain valid and every page uses modern Font Awesome controls',{skip:!available},()=>{
 for(const file of walk('dist/site-assets').filter(f=>f.endsWith('.js')))new vm.Script(readFileSync(file,'utf8'),{filename:file});
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 for(const route of routes){
  const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
  assert.match(html,/fontawesome-free@7\.3\.1\/css\/all\.min\.css/);
  assert.match(html,/fa-brands fa-whatsapp/,route+' must contain branded WhatsApp icon');
  assert.match(html,/id="redcarpert-floating-whatsapp"/,route+' must use modern widget');
  assert.doesNotMatch(html,/id="ht-ctc-chat"|htwasqicona-chat|\/redcarpert\/instagram\.svg/,route+' must not ship old WhatsApp markup or social SVG');
  assert.match(html,/redcarpert-whatsapp-float-dismiss/,route+' missing accessible dismiss button');
  assert.match(html,/data-dismiss-whatsapp/,route+' missing close behaviour');
  assert.match(html,/class="redcarpert-footer-social-whatsapp"/,route+' must provide footer WhatsApp');
  assert.match(html,/class="redcarpert-footer-book"/,route+' must provide a fitting CTA');
  assert.doesNotMatch(html,/FITTING ENQUIRIES|Via WhatsApp/,route+' contains old redundant footer text');
 }
});

test('twenty-nine-page book contains client Ball Gowns and illustrative designs',{skip:!available},()=>{
 const book=readFileSync('dist/digital-lookbook/index.html','utf8');
 assert.equal((book.match(/data-book-page=/g)||[]).length,29);
 assert.equal((book.match(/data-book-price=/g)||[]).length,27);
 assert.equal((book.match(/class="redcarpert-book-condition-note"/g)||[]).length,27);
 assert(book.includes(PRICE_CONDITION_DISCLAIMER));
 for(const product of catalogueProducts){
  assert(book.includes('data-book-price="'+product.id+'">'+displayPriceForDress(product.id, product.priceZar)+'</p>'),
    'book price does not match products.json for '+product.id);
 }
 assert.equal((book.match(/class="redcarpert-book-logo"/g)||[]).length,2);
 assert.match(book,/data-book-next/); assert.match(book,/data-book-previous/);
 // The lookbook adopts the approved dress-detail chevrons without visible labels.
 const prevArrow=book.match(/<button\b[^>]*\bdata-book-previous\b[^>]*>[\s\S]*?<\/button>/)?.[0];
 const nextArrow=book.match(/<button\b[^>]*\bdata-book-next\b[^>]*>[\s\S]*?<\/button>/)?.[0];
 assert(prevArrow&&nextArrow,'both lookbook page arrows must render');
 assert.match(prevArrow,/aria-label="Previous page"/);
 assert.match(nextArrow,/aria-label="Next page"/);
 assert.match(prevArrow,/<i class="fa-solid fa-chevron-left" aria-hidden="true"><\/i><\/button>$/);
 assert.match(nextArrow,/<i class="fa-solid fa-chevron-right" aria-hidden="true"><\/i><\/button>$/);
 assert.doesNotMatch(prevArrow,/>Previous</);
 assert.doesNotMatch(nextArrow,/>Next</);
 const gallery=readFileSync('dist/product/index.html','utf8');
 assert.equal((gallery.match(/data-catalogue-id=/g)||[]).length,27);
 for(const [category,count] of [['mermaid',4],['ball_gown',11],['ruffled',4],['modern_tradition',4],['two_in_one',4]]) {
  const html=readFileSync('dist/product-category/'+category+'/index.html','utf8');
  assert.equal((html.match(/data-catalogue-id=/g)||[]).length,count);
 }
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 assert.equal(routes.filter(p=>p.startsWith('/product/preview/')).length,27);
 assert.equal((book.match(/https:\/\/images\.pexels\.com\/photos\//g)||[]).length,16);
 assert.match(book,/Walking on red carpet with confidence/);
 assert.doesNotMatch(book,/redcarpert-book-cover-photo/);
 assert.equal((book.match(/class="redcarpert-book-photo"/g)||[]).length,27);
 assert.equal((book.match(/https:\/\/ik\.imagekit\.io\/kw8awoqvwi\/red-carpet-wedding-dresses\/wedding-dresses\/ball-gown-/g)||[]).length,11);
 assert.doesNotMatch(book,/Client-supplied photographs/);
 assert.doesNotMatch(book,/Price to be confirmed/);
 assert.match(book,/Indicative range/);
 assert.match(book,/Inspiration photo and example price/);
 assert.doesNotMatch(book,/Image and price are illustrative/);
 for(const route of routes.filter(p=>p.startsWith('/product/preview/'))) {
  const html=readFileSync('dist'+route+'/index.html','utf8');
  assert.match(html,/class="redcarpert-detail-card"/);
  assert.match(html,/data-dress-price=""/);
  const product=catalogueProducts.find(p=>p.previewRoute===route);
  assert(product,'unknown dress detail route: '+route);
  if(product.status==='client'){
    assert.match(html,/https:\/\/ik\.imagekit\.io\/kw8awoqvwi\//);
    assert.doesNotMatch(html,/Client-supplied dress photographs|class="redcarpert-detail-collection"/);
    assert.doesNotMatch(html,/ILLUSTRATIVE PRICE|Sample imagery and indicative pricing only/);
    assert.match(html,/INDICATIVE PRICE RANGE/);
    assert.match(html,/new or pre-owned/);
  }else{
    assert.match(html,/https:\/\/images\.pexels\.com\/photos\//);
    assert.match(html,/not confirmed as available/i);
    assert.match(html,/EXAMPLE PRICE/);
    assert.match(html,/Look \d{2}/);
  }
  assert(html.includes('data-detail-gallery="'+product.id+'"'),'product detail must contain a reusable photo gallery');
  assert.match(html,/data-gallery-photos="/,'gallery metadata must be emitted by static HTML');
  assert.match(html,/data-gallery-active-image=""/,'one active photograph must be present');
  const mappedPhotos=photosForDress(product);
  if(mappedPhotos.length>1){
    assert.match(html,/data-gallery-next=""/,'multi-photo demo must show next button');
    assert.match(html,/data-gallery-previous=""/,'multi-photo demo must show previous button');
    assert.equal((html.match(/data-gallery-index="/g)||[]).length,mappedPhotos.length,
      'the gallery should render a dot for each photograph');
    assert.match(html, /data-gallery-counter=""/,'multi-photo demo shows photo counter');
  }else{
    assert.doesNotMatch(html,/data-gallery-next=""/,'single-photo samples must not expose misleading gallery controls');
    assert.doesNotMatch(html,/data-gallery-index="/,'single-photo samples must not expose misleading dots');
  }
  assert(html.includes('data-dress-price="">'+displayPriceForDress(product.id, product.priceZar)+'</p>'),
    'detail price does not match products.json for '+route);
  assert.match(html,/Book a Fitting/);
 }
});


test('release readiness: all public pages have Redcarpert metadata and safe outbound links',{skip:!available},()=>{
  const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
  assert.equal(routes.length,38);
  const expectedTitles={
    '/product':'Wedding Dresses | Redcarpert Wedding Dresses',
    '/product-category/mermaid':'Mermaid Wedding Dresses | Redcarpert',
    '/product-category/ball_gown':'Ball Gown Wedding Dresses | Redcarpert',
    '/product-category/ruffled':'Ruffled Dresses | Redcarpert Wedding Dresses',
    '/product-category/modern_tradition':'Modern Tradition Dresses | Redcarpert Wedding Dresses',
    '/product-category/two_in_one':'2 in 1 Dresses | Redcarpert Wedding Dresses',
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
    assert(html.includes('Book a Fitting'),route+' missing customer fitting action');
    assert.doesNotMatch(description,/prototype|demonstration|illustrative|indicative|sample preview/i,
      route+' contains internal or unclear wording in its page description');
    assert(!/(?:href|action)="(?:https?:\/\/[^"]*whatsapp\.(?:com|net)|whatsapp:|intent:)/i.test(html),
      route+' contains an unapproved WhatsApp/intent destination');
    for(const [,href] of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)){
      assert(!/^(?:javascript:|data:|vbscript:)/i.test(href),route+' unsafe anchor '+href);
      if(/^https?:\/\//i.test(href)){
        const outbound=new URL(href.replaceAll('&amp;','&'));
        const host=outbound.hostname.toLowerCase();
        if (host==='www.google.com') {
          assert.equal(route,'/contact-us','only the Contact page may link to an external map');
          assert.equal(outbound.pathname,'/maps/search/','external Google link must be a Maps search only');
          assert.equal(outbound.searchParams.get('api'),'1');
          assert.equal(outbound.searchParams.get('query'),'Pomona, Kempton Park, Gauteng, South Africa');
          assert.equal(outbound.searchParams.size,2,'external map link must not contain tracking parameters');
          continue;
        }
        assert(['images.pexels.com','ik.imagekit.io','wa.me'].includes(host),
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

test('release readiness: verification and deployment require explicit manual workflow dispatch',()=>{
  const yaml=readFileSync('.github/workflows/pages.yml','utf8').replace(/\r\n?/g,'\n');
  assert.match(yaml,/^  workflow_dispatch:$/m,'owner must explicitly dispatch the Pages workflow');
  assert.doesNotMatch(yaml,/^  (?:push|pull_request|schedule):/m,'merges and branch pushes must never initiate Pages Actions');
  assert.match(yaml,/    needs: build/,'deployment must wait for successful build and tests');
  assert.match(yaml,/if: github\.ref == 'refs\/heads\/main'/,'deployment is restricted to main');
  assert.match(yaml,/npm run test:browser/,'production must pass browser checks');
  assert.match(yaml,/actions\/upload-pages-artifact@/);
  assert.match(yaml,/actions\/deploy-pages@/);
  assert.doesNotMatch(yaml,/approve_deployment|inputs\.approve_deployment/,'manual workflow dispatch is the explicit release approval');
  assert.doesNotMatch(yaml,/^  pull_request:/m,'pull requests must not deploy');
  const verification=readFileSync('.github/workflows/verify.yml','utf8').replace(/\r\n?/g,'\n');
  assert.match(verification,/workflow_dispatch:/);
  assert.doesNotMatch(verification,/^  (?:push|pull_request):/m,'development verification remains opt-in');
});

test('Redcarpert browser-tab and touch icons are generated from the new bridal monogram on every page', {skip:!available}, async()=>{
 const source='public/redcarpert/brand/redcarpert-bridal-monogram.svg';
 const output=[
  {size:32,name:'redcarpert-bridal-favicon-v2-32.png',rel:'icon'},
  {size:180,name:'redcarpert-bridal-touch-v2-180.png',rel:'apple-touch-icon'},
 ];
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 for(const {size,name,rel} of output){
  const target='dist/redcarpert/brand/'+name;
  assert(existsSync(target),'missing generated icon: '+target);
  const expected=await sharp(source)
    .resize(size,size,{fit:'contain',background:{r:0,g:0,b:0,alpha:1}}).png().toBuffer();
  const actual=readFileSync(target);
  assert(actual.equals(expected),name+' must be derived from the approved current Redcarpert logo');
  const info=await sharp(actual).metadata();
  assert.equal(info.format,'png');
  assert.equal(info.width,size);
  assert.equal(info.height,size);
  for(const route of routes){
   const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
   assert(html.includes('rel="'+rel+'"'),route+' must declare '+rel);
   assert(html.includes('href="/redcarpert-prototype/redcarpert/brand/'+name+'"'),route+' must point to current branded icon '+name);
   assert(!html.includes('cropped-logo-2-1'),route+' must not reference the old reference-site tab icon');
  }
  const missing=readFileSync('dist/404.html','utf8');
  assert(missing.includes('href="/redcarpert-prototype/redcarpert/brand/'+name+'"'),'404 page must use the current '+rel);
 }
});

test('Implementation 22: every static page starts with a bounded, branded global loading screen', {skip:!available},async()=>{
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 const generated='dist/redcarpert/brand/redcarpert-logo-optimized.webp';
 assert(existsSync(generated),'missing derived logo used by all pages');
 const original='public/redcarpert/brand/redcarpert-logo.png';
 const optimized=readFileSync(generated);
 assert(optimized.length<readFileSync(original).length/2,'approved logo derivative should be considerably smaller');
 const info=await sharp(optimized).metadata();
 assert.equal(info.format,'webp');
 assert(info.width<=640&&info.width>200);
 for(const route of routes){
  const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
  const loader=html.indexOf('id="redcarpert-page-loader"');
  const header=html.indexOf('<header id="header"');
  assert(loader>0&&header>loader,route+' loader must precede site header');
  assert.match(html,/id="redcarpert-loader-critical"/,route+' loader critical CSS missing');
  assert.match(html,/redcarpert-logo-optimized\.webp/,route+' must render optimised approved logo');
  assert.match(html,/Loading Redcarpert Wedding Dresses/,route+' missing branded status');
  assert.match(html,/redcarpertLoaderFallback=setTimeout/,route+' must fail open if JS stalls');
  assert.match(html,/<noscript><style>#redcarpert-page-loader\{display:none!important\}<\/style><\/noscript>/,
    route+' must fail open with JavaScript disabled');
  assert.match(html,/role="status" aria-live="polite"/,route+' loader must be accessible');
  if(route==='/'){
   const year=new Date().getFullYear();
   assert.match(html,new RegExp('data-collection-year="start"[^>]*>'+year+'<'), 'homepage first year fallback should match build year');
   assert.match(html,new RegExp('data-collection-year="end"[^>]*>'+(year+1)+'<'), 'homepage next year fallback should match build year');
   assert(html.includes(' Collectıon'), 'keep the approved collection heading wording');
   // Apply homepage-only transparent header rules before JavaScript arrives.
   assert.match(html,/<body class="[^"]*\bredcarpert-home-native\b/,
     'homepage must carry its transparent overlay class from the first paint');
   assert(html.includes('<link rel="preconnect" href="https://ik.imagekit.io">'),
     'homepage should preconnect to client ImageKit image host');
   const imagekitUrls=JSON.parse(readFileSync("src/data/image-links.json","utf8")).home_page.hero.map(image=>image.url);
   assert.equal(imagekitUrls.length,3,"homepage manifest must list three approved photos");
   assert(html.includes('href="'+imagekitUrls[0]+'" as="image" type="image/webp" fetchpriority="high"'),
     'first client photograph should be priority-preloaded');
   assert(html.includes('data-hero-url="'+imagekitUrls[0]+'"'),
     'homepage loader should wait for first client photograph');
   for(const url of imagekitUrls)assert(html.includes(url),'homepage missing approved photo '+url);
   assert(html.indexOf('rel="preload"')<html.indexOf('src="\/redcarpert-prototype\/redcarpert\/brand\/redcarpert-logo-optimized.webp"'),
    'hero preload should be declared before loading logo');
  } else {
   assert(!html.includes('data-hero-url='),route+' must not load the homepage hero');
   assert(!html.includes('ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/'),
     route+' should not request homepage-only photography');
   assert.doesNotMatch(html,/<body class="[^"]*\bredcarpert-home-native\b/,
     route+' must retain its approved interior header styling');
  }
 }
});


test('Wedding Moments production HTML preserves ImageKit URLs and visible pagination status',{skip:!available},()=>{
 const html=readFileSync('dist/wedding-moments/index.html','utf8');
 const base='https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-moments/';
 assert(html.includes('src="'+base+'wedding-moments-56.jpg"'), 'real image URL was modified during HTML generation');
 assert(html.includes('data-wedding-src="'+base+'wedding-moments-88.mp4"'), 'client video URL was modified during HTML generation');
 assert(html.includes('src="'+base+'wedding-moments-88.mp4/ik-thumbnail.jpg"'), 'ImageKit video poster URL was modified');
 assert(html.includes('Showing 16 of 87 wedding moments'), 'initial gallery counter missing');
 assert(html.includes('data-wedding-moments-remaining'), 'deferred media template missing');
 assert(html.includes('data-wedding-load-more'), 'pagination control missing');
 assert(!html.includes(base.replace('/wedding-moments/','/redcarpert-prototype/wedding-moments/')),
   'external CDN URLs must never contain the GitHub Pages base');
 assert(!html.includes('red-carpet-wedding-dresses/redcarpert-prototype/wedding-moments/'),
   'prefix must not be inserted inside an ImageKit media URL');
});
