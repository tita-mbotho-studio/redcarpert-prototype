import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import sharp from 'sharp';
import {catalogueProducts} from '../src/data/catalogue.ts';
import {lookbookPlacements} from '../src/lib/lookbook-placements.ts';
import {modernTraditionPages,modernTraditionPageForRoute,modernTraditionPageForDress} from '../src/lib/modern-tradition.ts';
import {displaySalePriceForDress, displayRentalPriceForDress, salePriceLabelForDress, RENTAL_CONDITION_NOTE} from '../src/lib/pricing.ts';
import {photosForDress} from '../src/lib/dress-gallery.ts';
import {mediaDeliveryUrl} from '../src/lib/media-delivery.ts';
import {generalFittingMessage,dressFittingMessage} from '../src/lib/whatsapp-messages.ts';
import {buildWhatsAppUrl} from '../src/config/whatsapp.ts';
import {OFFICIAL_SOCIAL_LINKS} from '../src/config/social-links.ts';
const walk = dir => readdirSync(dir,{withFileTypes:true}).flatMap(file=>file.isDirectory()?walk(path.join(dir,file.name)):[path.join(dir,file.name)]);
const available = existsSync('dist/index.html');
test('static deployment contains complete approved pages, local paths and no application server', {skip:!available},()=>{
 const files=walk('dist'), htmlFiles=files.filter(f=>f.endsWith('.html'));
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 assert.equal(routes.length,catalogueProducts.length+modernTraditionPages.length+11);
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
  const modernPage=modernTraditionPageForRoute(route);
   const product=modernPage?.product ?? catalogueProducts.find(item=>item.previewRoute.replace(/\/$/,'')===route.replace(/\/$/,''));
  const expectedMessage=product ? dressFittingMessage(product,modernPage) : generalFittingMessage();
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
  if(product)assert(expectedMessage.includes('*Dress:*') && expectedMessage.includes('*Rental Price Range:*') && expectedMessage.includes('*Sale Price:*'),route+' must identify its gown, sale and rental pricing');
 }
 assert(!files.some(f=>f.includes('/api/')||f.includes('_next')||f.includes('documents/')));
 assert(!existsSync('dist/product/arabella/index.html'));
 const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
 for(const name of ['next','react','react-dom'])assert(!lock.packages['node_modules/'+name]);
 assert.match(readFileSync('dist/404.html','utf8'),/Page not found/);
 const year=new Date().getFullYear();
 const premiumPdf='dist/digital-lookbook/Redcarpert-The-Bridal-Edit-'+year+'.pdf';
 const pdf=readFileSync(premiumPdf);assert.match(pdf.subarray(0,8).toString(),/^%PDF-1\.[4-9]/);
 assert.match(pdf.toString('latin1'),/\/Count 63/);
 assert(!existsSync('dist/digital-lookbook/Redcarpert-Sample-Lookbook.pdf'),'obsolete sample PDF must not be published');
 const downloadHtml=readFileSync('dist/digital-lookbook/index.html','utf8');
 assert(downloadHtml.includes('Redcarpert-The-Bridal-Edit-'+year+'.pdf'),'download button must use annual editorial PDF');
 const audit=JSON.parse(readFileSync('.generated/lookbook-image-audit.json','utf8'));
 assert.equal(audit.photoCount,catalogueProducts.length);assert.equal(audit.photos.length,catalogueProducts.length);
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

test('the expanded book contains all client Mermaid, Ball Gown and 2 in 1 dresses',{skip:!available},()=>{
 const book=readFileSync('dist/digital-lookbook/index.html','utf8');
 assert.equal((book.match(/data-book-page=/g)||[]).length,lookbookPlacements(catalogueProducts).length+2);
 assert.equal((book.match(/data-book-sale-price=/g)||[]).length,lookbookPlacements(catalogueProducts).length);
 assert.equal((book.match(/data-book-rental-price=/g)||[]).length,lookbookPlacements(catalogueProducts).length);
 assert.equal((book.match(/data-book-sale-label=/g)||[]).length,lookbookPlacements(catalogueProducts).length);
 assert.equal((book.match(/class="redcarpert-book-condition-note"/g)||[]).length,lookbookPlacements(catalogueProducts).length);
 assert.equal(book.split(RENTAL_CONDITION_NOTE).length-1,lookbookPlacements(catalogueProducts).length);
 assert.doesNotMatch(book,/Inspiration photo|Example sale price|price disclaimer|not confirmed|To be confirmed/i);
 for(const product of catalogueProducts){
  assert(book.includes('data-book-sale-price="'+product.id+'">'+displaySalePriceForDress(product.id)+'</p>'),
    'book sale price does not match products.json for '+product.id);
  assert(book.includes('data-book-rental-price="'+product.id+'">'+displayRentalPriceForDress(product.id)+'</p>'),
    'book rental status does not match products.json for '+product.id);
  assert(book.includes('data-book-sale-label="'+product.id+'">'+salePriceLabelForDress(product.id)+'</span>'),
    'book must show a fixed sale-price label for '+product.id);
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
 assert.equal((gallery.match(/data-catalogue-id=/g)||[]).length,lookbookPlacements(catalogueProducts).length);
 const listingPages=[gallery];
 for(const category of ['mermaid','ball_gown','ruffled','modern_tradition','two_in_one']) {
  const html=readFileSync('dist/product-category/'+category+'/index.html','utf8');
  const expected=catalogueProducts.filter(product=>product.collections.includes(category));
  assert.equal((html.match(/data-catalogue-id=/g)||[]).length,expected.length);
  for(const product of expected) assert(html.includes('data-catalogue-id="'+product.id+'"'),
    'missing '+product.id+' in '+category+' category page');
  listingPages.push(html);
 }
 for(const html of listingPages) {
   const cardCount=(html.match(/data-catalogue-id=/g)||[]).length;
   assert.equal((html.match(/class="woocommerce-loop-product__title redcarpert-catalogue-title"/g)||[]).length,cardCount);
   for(const name of ['redcarpert-catalogue-collection','redcarpert-catalogue-divider','redcarpert-catalogue-number']){
     assert.equal((html.match(new RegExp('class="'+name+'"','g'))||[]).length,cardCount,
       'all published catalogue cards must contain '+name);
   }
   assert.doesNotMatch(html,/class="redcarpert-catalogue-collection">(?:Sample|Look|Ball Gown \d{2})/,
     'catalogue headings should show collection names only');
   assert.doesNotMatch(html,/data-dress-price=|class="redcarpert-catalogue-price"|class="redcarpert-catalogue-condition-note"/,
     'catalogue cards must not repeat detail-page pricing');
   assert.doesNotMatch(html,/Prices vary depending on whether the dress is new or pre-owned/,
     'condition disclaimer is for dress details and lookbooks, not listing pages');
 }
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 assert.equal(routes.filter(p=>p.startsWith('/product/preview/')).length,lookbookPlacements(catalogueProducts).length+modernTraditionPages.length);
  assert.doesNotMatch(book,/images\.pexels\.com|data-sample-id=/,'client-only digital book');
 assert.match(book,/Walking on red carpet with confidence/);
 assert.doesNotMatch(book,/redcarpert-book-cover-photo/);
 assert.equal((book.match(/class="redcarpert-book-photo"/g)||[]).length,lookbookPlacements(catalogueProducts).length);
 assert.equal((book.match(/<img src="https:\/\/ik\.imagekit\.io\/kw8awoqvwi\/red-carpet-wedding-dresses\/wedding-dresses\/ball-gown-/g)||[]).length,15);

 assert.equal((book.match(/<img src="https:\/\/ik\.imagekit\.io\/kw8awoqvwi\/red-carpet-wedding-dresses\/wedding-dresses\/ruffled-dresses\//g)||[]).length,12,
   'interactive book should contain exactly twelve new client Ruffled photographs');
 assert(routes.includes('/product/preview/ruffled-dress-12'),'twelfth Ruffled detail route must exist');
 assert(!routes.some(route=>route.includes('/sample-')),'no retired sample dress routes');

 assert.doesNotMatch(book,/Client-supplied photographs/);
 assert.doesNotMatch(book,/To be confirmed|provisional|illustrative sale|example sale price/i);
 assert.doesNotMatch(book,/data-book-price=|redcarpert-book-range-label|Indicative range/,
   'online book may not show the old single illustrative price range');
 assert.doesNotMatch(book,/Inspiration photo and example price|not confirmed stock/i);
 assert.doesNotMatch(book,/Image and price are illustrative/);
 for(const route of routes.filter(p=>p.startsWith('/product/preview/'))) {
  const html=readFileSync('dist'+route+'/index.html','utf8');
  assert.match(html,/class="redcarpert-detail-card"/);
  assert.match(html,/data-sale-price=""/);
  assert.match(html,/data-rental-price=""/);
  const modernPage=modernTraditionPageForRoute(route);
   const product=modernPage?.product ?? catalogueProducts.find(p=>p.previewRoute===route);
  assert(product,'unknown dress detail route: '+route);
   if(modernPage){
     assert(html.includes('data-modern-tradition-number="'+modernPage.number+'"'));
     assert(html.includes('class="product_title entry-title redcarpert-detail-name">'+modernPage.name+'</h1>'));
     assert(html.includes('<title>'+modernPage.name+' | Redcarpert Wedding Dresses</title>'));
   }
  assert.match(html,/https:\/\/ik\.imagekit\.io\/kw8awoqvwi\//);
   assert.doesNotMatch(html,/Client-supplied dress photographs|class="redcarpert-detail-collection"/);
   assert.match(html,/SALE PRICE/);
   assert.match(html,/RENTAL PRICE RANGE/);
   assert.doesNotMatch(html,/price disclaimer|Example sale price|images\.pexels\.com/i);
   assert(html.includes('data-detail-gallery="'+product.id+'"'),'product detail must contain a reusable photo gallery');
  assert.match(html,/data-gallery-photos="/,'gallery metadata must be emitted by static HTML');
  assert.match(html,/data-gallery-active-image=""/,'one active photograph must be present');
  const mappedPhotos=photosForDress(product);
  if(mappedPhotos.length>1){
    assert.match(html,/data-gallery-next=""/,'multi-photo client dress must show next button');
    assert.match(html,/data-gallery-previous=""/,'multi-photo client dress must show previous button');
    assert.equal((html.match(/data-gallery-index="/g)||[]).length,mappedPhotos.length,
      'the gallery should render a dot for each photograph');
    assert.match(html, /data-gallery-counter=""/,'multi-photo client dress shows photo counter');
  }else{
    assert.doesNotMatch(html,/data-gallery-next=""/,'single-photo client dresses must not expose misleading gallery controls');
    assert.doesNotMatch(html,/data-gallery-index="/,'single-photo client dresses must not expose misleading dots');
  }
  assert(html.includes('data-sale-price="">'+displaySalePriceForDress(product.id)+'</p>'),
    'detail sale price does not match products.json for '+route);
  assert(html.includes('data-rental-price="">'+displayRentalPriceForDress(product.id)+'</p>'),
    'detail rental price must match the central ZAR schedule for '+route);
  assert(html.includes('<p class="redcarpert-detail-price-disclaimer">'+RENTAL_CONDITION_NOTE+'</p>'),
    'dress detail must explain condition-based rental pricing');
  assert(html.includes('<p class="redcarpert-related-disclaimer">'+RENTAL_CONDITION_NOTE+'</p>'),
    'related dresses must share the rental condition note');
  assert.doesNotMatch(html,/To be confirmed|EXAMPLE SALE PRICE|This photo is for inspiration/i,
    'detail page must not display temporary development disclaimers');
  const categoryMatches=modernPage
     ? modernTraditionPages.filter(page=>page.product.id!==product.id).map(page=>page.product)
     : catalogueProducts.filter(d=>d.category===product.category&&d.id!==product.id);
  const relatedIds=[...html.matchAll(/data-related-dress="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(relatedIds.length,Math.min(4,categoryMatches.length),
    'unexpected related dress card count for '+route);
  assert.equal(new Set(relatedIds).size,relatedIds.length,
    'related dress section may not repeat a gown');
  for(const id of relatedIds){
    const dress=categoryMatches.find(item=>item.id===id);
    assert(dress,'related dress must belong to the same category and exclude current gown');
    const expectedRelatedRoute=modernPage ? modernTraditionPageForDress(id).route : dress.previewRoute;
     assert(html.includes('href="/redcarpert-prototype'+expectedRelatedRoute+'/"'),
      'related dress must link to the correct detail page');
    assert(html.includes('data-related-dress="'+id+'"'),'related dress marker must be present');
    assert(html.includes('data-related-sale-price="'+id+'">'+displaySalePriceForDress(id)+'</span>'),
      'related sale price must match the detail page for '+id);
    assert(html.includes('data-related-rental-price="'+id+'">'+displayRentalPriceForDress(id)+'</span>'),
      'related rental price must match the detail page for '+id);
  }
  assert.match(html,/Book a Fitting/);
  assert(html.includes('<p class="redcarpert-icon-cta-label">Book a Fitting</p>'),
    'fitting label must be above the icon on '+route);
  const detailCta=html.match(/<a\b[^>]*class="button redcarpert-icon-cta-button redcarpert-detail-fitting-button"[^>]*>[\s\S]*?<\/a>/)?.[0];
  assert(detailCta,'missing compact direct WhatsApp fitting link for '+route);
  assert(detailCta.includes('aria-label="Book a Fitting via WhatsApp"'));
  assert(detailCta.includes('<i class="fa-brands fa-whatsapp" aria-hidden="true"></i>'),
    'fitting link must contain only the WhatsApp glyph');
  assert(!detailCta.includes('>Book a Fitting<'),'fitting link must not contain visible button wording');
 }
});


test('release readiness: all public pages have Redcarpert metadata and safe outbound links',{skip:!available},()=>{
  const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
  assert.equal(routes.length,catalogueProducts.length+modernTraditionPages.length+11);
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
        if(OFFICIAL_SOCIAL_LINKS.some(profile=>profile.url===outbound.href)){
          assert.equal(outbound.search,'',route+' social profile URL must not contain tracking parameters');
          continue;
        }
        assert(['ik.imagekit.io','wa.me'].includes(host),
          route+' links to an unapproved external site: '+href);
        if(outbound.hostname==='wa.me') {
          assert.equal(outbound.pathname,'/27680458811');
          assert.equal(outbound.searchParams.size,1,'WhatsApp URL can contain only the message query');
          assert(outbound.searchParams.get('text')?.includes('Redcarpert'));
        }
      }
    }
    const socialTags=[...html.matchAll(/<a\b[^>]*\bclass="redcarpert-footer-social-link"[^>]*><i class="fa-brands fa-([^"]+)" aria-hidden="true"><\/i><\/a>/g)];
    assert.equal(socialTags.length,4,route+' must show four approved social profiles');
    OFFICIAL_SOCIAL_LINKS.forEach((profile,index)=>{
      const [markup,icon]=socialTags[index];
      assert.equal(icon,profile.icon,route+' wrong icon for '+profile.handle);
      assert(markup.includes('href="'+profile.url+'"'),route+' wrong social profile '+profile.handle);
      assert(markup.includes('aria-label="'+profile.platform+' '+profile.handle+'"'),route+' inaccessible social profile');
      assert(markup.includes('target="_blank"') && markup.includes('rel="noopener noreferrer"'),
        route+' external social links must open safely');
    });
    assert(!/fa-youtube|fa-x-twitter|fa-pinterest-p|redcarpert-footer-social-placeholder/.test(html),
      route+' still shows removed or inactive social media icons');
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
   const heroDelivery=mediaDeliveryUrl(imagekitUrls[0],"hero");
   const encodedHeroDelivery=heroDelivery.replaceAll('&','&amp;');
   assert(html.includes('href="'+encodedHeroDelivery+'" as="image" fetchpriority="high"'),
     'first client photograph should be priority-preloaded');
   assert(html.includes('data-hero-url="'+heroDelivery+'"'),
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


test('Wedding Moments production HTML uses CDN thumbnails, preserves originals and visible pagination status',{skip:!available},()=>{
 const html=readFileSync('dist/wedding-moments/index.html','utf8');
 const base='https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-moments/';
 const uploaded=JSON.parse(readFileSync('src/data/image-links.json','utf8')).wedding_moments.events[0].media;
 const photo=uploaded.find(item=>item.type==='photo');
 const video=uploaded.find(item=>item.type==='video');
 const esc=value=>value.replaceAll('&','&amp;');
 assert(html.includes('src="'+esc(mediaDeliveryUrl(photo.url,'tile'))+'"'),
   'uploaded WebP photo tiles must use optimized derivatives');
 assert(html.includes('data-wedding-src="'+esc(photo.url)+'"'),
   'original WebP must remain available for fallback');
 assert(html.includes('data-wedding-preview-src="'+esc(mediaDeliveryUrl(photo.url,'preview'))+'"'),
   'uploaded WebP preview must use the shared CDN preset');
 assert(html.includes('data-wedding-src="'+esc(video.url)+'"'),
   'playback URL must preserve the exact new client MP4 link');
 assert(html.includes('src="'+esc(mediaDeliveryUrl(video.poster,'tile'))+'"'),
   'video poster must be optimized as a still');
 assert(html.includes('<link rel="preconnect" href="https://ik.imagekit.io">'),
   'page should open an ImageKit connection before its media requests');
 assert(html.includes('Showing 16 of 90 wedding moments'), 'initial gallery counter missing');
 assert(html.includes('data-wedding-moments-remaining'), 'deferred media template missing');
 assert(html.includes('data-wedding-load-more'), 'pagination control missing');
 assert(!html.includes(base.replace('/wedding-moments/','/redcarpert-prototype/wedding-moments/')),
   'external CDN URLs must never contain the GitHub Pages base');
 assert(!html.includes('red-carpet-wedding-dresses/redcarpert-prototype/wedding-moments/'),
   'prefix must not be inserted inside an ImageKit media URL');
});

test('all produced pages apply shared delivery to dress, lookbook, and homepage media',{skip:!available},()=>{
  const escapeUrl = value=>value.replaceAll('&','&amp;');
  const product=catalogueProducts.find(p=>p.id==='ball-gown-01');
  assert(product);
  const catalogue=readFileSync('dist/product/index.html','utf8');
  const cardUrl=mediaDeliveryUrl(product.image,'card');
  assert(catalogue.includes('src="'+escapeUrl(cardUrl)+'"'),'catalogue cards must use screen-sized photos');
  assert(catalogue.includes('data-media-original="'+escapeUrl(product.image)+'"'),
    'catalogue original source must remain accessible on delivery failure');
  const detail=readFileSync('dist'+product.previewRoute+'/index.html','utf8');
  assert(detail.includes('src="'+escapeUrl(mediaDeliveryUrl(product.image,'detail'))+'"'),
    'detail card must not load an oversized original');
  assert(detail.includes('data-dress-photo-dialog=""'),
    'dress details must provide the new borderless native image viewer');
  assert(detail.includes('data-dress-preview-photo=""'),
    'the modal image should load a larger source only when clicked');
  assert(!detail.includes('data-gallery-enlarge=""') && !detail.includes('data-fancybox="product-gallery"'),
    'legacy zoom controls must not ship in the dress page');
  assert(detail.includes('data-gallery-photos="'),
    'the original photo URL must remain available in the gallery metadata');
  const book=readFileSync('dist/digital-lookbook/index.html','utf8');
  assert(book.includes('src="'+escapeUrl(mediaDeliveryUrl(product.image,'lookbook'))+'"'),
    'online lookbook should use a dedicated lightweight photograph');
  const homepage=readFileSync('dist/index.html','utf8');
  const heroes=JSON.parse(readFileSync('src/data/image-links.json','utf8')).home_page.hero;
  for(const photo of heroes){
    const optimized=mediaDeliveryUrl(photo.url,'hero');
    assert(homepage.includes('data-media-background-original="'+photo.url+'"'));
    assert(homepage.includes('data-media-background-src="'+escapeUrl(optimized)+'"'));
  }
  assert(homepage.includes('href="'+escapeUrl(mediaDeliveryUrl(heroes[0].url,'hero'))+'" as="image" fetchpriority="high"'),
    'homepage preload and CSS should point to the same optimized resource');
});

test('future HTML image additions inherit provider-safe media delivery defaults',{skip:!available},()=>{
 const htmlFiles=walk('dist').filter(file=>file.endsWith('.html'));
 let checked=0;
 for(const file of htmlFiles){
  const html=readFileSync(file,'utf8');
  for(const match of html.matchAll(/<img\b[^>]*?\bsrc="([^"]+)"/g)){
   const src=match[1].replaceAll('&amp;','&');
   if(!/^https:\/\//.test(src)) continue;
   const url=new URL(src);
   if(url.hostname==='ik.imagekit.io'){
    assert(url.searchParams.has('tr')||url.pathname.startsWith('/tr:'),
      file+' contains an unoptimized ImageKit <img>: '+src);
    checked++;
   }
  }
 }
 assert(checked>=80,'expected optimized wedding, dress, lookbook and editorial photos');
});

test('only the three approved published CTAs use label-above, icon-only actions',{skip:!available},()=>{
 const published=[
  {route:'/about-us',kind:'fitting',label:'Book a Fitting',icon:'fa-brands fa-whatsapp'},
  {route:'/contact-us',kind:'fitting',label:'Book a Fitting',icon:'fa-brands fa-whatsapp'},
  {route:'/digital-lookbook',kind:'download',label:'Download The Bridal Edit (PDF)',icon:'fa-solid fa-file-arrow-down'},
 ];
 for(const {route,kind,label,icon} of published){
  const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
  const groups=[...html.matchAll(/data-redcarpert-icon-cta="([^"]+)"/g)];
  assert.deepEqual(groups.map(x=>x[1]),[kind],route+' must have exactly one approved icon CTA');
  assert(html.includes('<p class="redcarpert-icon-cta-label">'+label+'</p>'),
   route+' needs a visible label outside the action');
  const area=html.slice(html.indexOf('data-redcarpert-icon-cta="'+kind+'"'));
  const link=area.match(/<a class="button redcarpert-icon-cta-button"([^>]*)><i class="([^"]+)" aria-hidden="true"><\/i><\/a>/);
  assert(link,route+' must use an icon-only anchor with no visible button text');
  assert.equal(link[2],icon);
  if(kind==='fitting'){
   assert(link[1].includes('data-whatsapp-send=""'));
   assert(link[1].includes('href="https://wa.me/'));
   assert(link[1].includes('aria-label="Book a Fitting via WhatsApp"'));
   assert(link[1].includes('target="_blank"'));
  }else{
   assert(link[1].includes('aria-label="Download The Bridal Edit (PDF)"'));
   assert.match(link[1],/href="\/redcarpert-prototype\/digital-lookbook\/Redcarpert-The-Bridal-Edit-\d{4}\.pdf"/);
   assert.match(link[1],/download="Redcarpert-The-Bridal-Edit-\d{4}\.pdf"/);
  }
 }
 const distinct=['/product','/wedding-moments','/product/preview/ball-gown-01'];
 for(const route of distinct){
  const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
  assert(!html.includes('data-redcarpert-icon-cta='),
   route+' must retain the existing CTA style');
 }
});


test('catalogue font is loaded once via a valid head stylesheet, never as a late CSS import', {skip:!available},()=>{
 const expected = 'href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&amp;display=swap"';
 for(const route of ['product','product-category/mermaid','product-category/ball_gown',
   'product-category/ruffled','product-category/modern_tradition','product-category/two_in_one']) {
   const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
   const head=html.split('</head>')[0];
   assert(head.includes(expected),route+' must load Cormorant Garamond before the combined CSS');
   assert.equal(head.split(expected).length-1,1,route+' must not request the same font twice');
 }
 for(const route of ['','wedding-moments','digital-lookbook','contact-us']) {
   const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
   assert(!html.includes(expected),route+' should not download unused catalogue typography');
 }
 assert.doesNotMatch(readFileSync('src/components/CatalogueListing.css','utf8'),
   /@import\s+url\(/,'do not reintroduce a PostCSS-invalid import halfway through the CSS bundle');
});
