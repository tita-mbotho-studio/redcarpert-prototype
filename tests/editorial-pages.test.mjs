import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { sitePages } from '../src/data/site.ts';
import { adaptEditorialDocument } from '../src/lib/editorial-pages.ts';
import imageLinks from '../src/data/image-links.json' with { type: 'json' };
import { createLuxuryLookbookHtml } from '../src/lib/luxury-lookbook.ts';
import { lookbookPlacements } from '../src/lib/lookbook-placements.ts';
import { catalogueProducts, catalogueCategories } from '../src/data/catalogue.ts';
import { displaySalePriceForDress, displayRentalPriceForDress, salePriceLabelForDress, RENTAL_CONDITION_NOTE } from '../src/lib/pricing.ts';
import { generalFittingMessage } from '../src/lib/whatsapp-messages.ts';
import { buildWhatsAppUrl } from '../src/config/whatsapp.ts';
import { createNodeRenderer } from '../scripts/lib/markup.ts';

const nodes = list => list.flatMap(n => typeof n === 'string' ? [] : [n, ...nodes(n.children)]);
test('About Us model portraits fill their width without shaded side strips or cropping', () => {
  const css=readFileSync('src/components/EditorialPages.css','utf8');
  const match=css.match(/\.redcarpert-editorial-team-card img \{([^}]+)\}/);
  assert(match,'missing model image presentation styles');
  const rules=match[1];
  assert.match(rules,/width:\s*100%/);
  assert.match(rules,/height:\s*auto/);
  assert.match(rules,/aspect-ratio:\s*auto/);
  assert.match(rules,/object-fit:\s*initial/);
  assert.match(rules,/background:\s*transparent/);
  assert.doesNotMatch(rules,/object-fit:\s*contain|object-fit:\s*cover|aspect-ratio:\s*3\s*\/\s*4/);
});

test('new Redcarpert editorial content reuses source shell and never exposes original business copy', () => {
  for (const route of ['/about-us', '/contact-us', '/wedding-moments', '/digital-lookbook']) {
    const capture = sitePages[route === '/digital-lookbook' ? '/about-us' : route];
    const source = { ...capture, route };
    const before = JSON.stringify(capture);
    const actual = adaptEditorialDocument(source);
    const sourceNodes = nodes(capture.nodes), rendered = nodes(actual.nodes);
    for (const id of ['header', 'footer']) {
      const old = sourceNodes.find(n => n.attrs.id === id);
      assert.strictEqual(rendered.find(n => n.attrs.id === id), old, id + ' preserved in ' + route);
    }
    const content = rendered.find(n => n.attrs['data-editorial-route'] === route);
    assert(content, 'missing editorial content for ' + route);
    // Search customer-visible copy, not opaque ImageKit updatedAt timestamps.
    // An uploaded image URL can coincidentally contain "1980" as digits.
    const contentNodes=nodes([content]);
    const customerCopy=contentNodes.flatMap(n=>[
      ...n.children.filter(child=>typeof child==='string'),
      n.attrs.alt ?? '',n.attrs.title ?? '',n.attrs['aria-label'] ?? '',
    ]).join(' ');
    const contentUrls=contentNodes.flatMap(n=>[
      n.attrs.src ?? '',n.attrs.href ?? '',n.attrs.poster ?? '',
    ]).join(' ');
    assert.doesNotMatch(customerCopy,/BRIDAL VANESA|bridalvanesa|Vienna|Denizli|1980/i,
      route+' must not show original business wording');
    assert.doesNotMatch(contentUrls,/bridalvanesa|bridal_vanesa/i,
      route+' must not link to the original business');
    if (route === '/wedding-moments') {
      assert.equal(nodes(content.children).filter(n => n.tag === 'h2').length, 0,
        'minimal Wedding Moments has no category headings');
    } else {
      assert.equal(nodes(content.children).filter(n => n.tag === 'h2').length > 0, true);
    }
    if (route === '/digital-lookbook') {
      assert.equal(nodes(content.children).filter(n => n.attrs['data-lookbook-viewer'] === 'true').length, 1);
      assert(nodes(content.children).some(n => n.attrs.id === 'redcarpert-lookbook-title'));
      assert.doesNotMatch(JSON.stringify(content),/not confirmed in stock|inspiration|illustrative/i);
      assert.doesNotMatch(JSON.stringify(content),/illustrative|prototype|demonstration/i);
    }
    if (route === '/about-us' || route === '/contact-us' || route === '/digital-lookbook') {
      assert(rendered.some(n => n.attrs.class === 'page-title redcarpert-editorial-page-title'));
      assert(nodes(content.children).some(n => n.attrs.class === 'redcarpert-editorial-hero'));
    }
    if (route === '/about-us') {
      const team=nodes(content.children).filter(n => n.attrs.class === 'redcarpert-editorial-team-card');
      const names=['Shantel','Refiloe','Olga','Mapaseka','Defny','Paula'];
      assert.equal(team.length,6,'About Us must display all six client-supplied models');
      assert.match(JSON.stringify(content),/Your Dream Dress Starts Here/);
      assert.match(JSON.stringify(content),/Book Your Fitting/);
      assert.match(JSON.stringify(content),/Meet Our Models/);
      assert.doesNotMatch(JSON.stringify(content),/prefilled|illustrative|demonstration|prototype|Photo by .* on Pexels|not Redcarpert staff/i,
        'About Us must remove legacy placeholder copy and photo credits');
      for(const [i,card] of team.entries()){
        const image=nodes(card.children).find(n=>n.tag==='img');
        const model=imageLinks.about_us.team[i];
        const caption=nodes(card.children).find(n=>n.tag==='h3');
        assert.equal(model.name,names[i]);
        assert.equal(image.attrs.src,model.url,'portrait must come from its ImageKit record');
        assert.equal(image.attrs.alt,'Portrait of '+names[i]+', Redcarpert bridal model');
        assert.equal(image.attrs.loading,'lazy');
        assert.equal(image.attrs.decoding,'async');
        assert.equal(image.attrs.width,String(model.width));
        assert.equal(image.attrs.height,String(model.height));
        assert.equal(caption.children[0],names[i],'caption must show the model name');
        assert.equal(nodes(card.children).filter(n=>n.tag==='small'||n.tag==='p').length,0,
          'do not display placeholder descriptions or Pexels credits');
      }
    }
    if (route === '/contact-us') {
      const container=rendered.find(n=>n.attrs.id==='content-container');
      assert.equal(container.attrs.class,'content-boxed layout-full');
      assert(!rendered.some(n=>n.attrs.id==='sidebar'),'empty sidebar must be removed from Contact Us');
      assert(rendered.some(n=>n.attrs.id==='full-width'),'Contact Us must use About Us content width');
      const contact=JSON.stringify(content);
      const readText=value=>typeof value==='string'?value:value.children.map(readText).join(' ');
      const visibleText=readText(content);
      const map=nodes(content.children).find(n=>n.tag==='iframe');
      assert(map,'Contact Us must include an embedded map');
      assert.equal(map.attrs.src,'https://www.google.com/maps?q=Pomona%2C%20Kempton%20Park%2C%20Gauteng%2C%20South%20Africa&output=embed');
      assert.equal(map.attrs.loading,'lazy');
      assert.match(map.attrs.title,/Pomona area in Kempton Park/);
      assert.match(map.attrs['aria-label'],/general Pomona area/);
      assert.match(visibleText,/Let's find your wedding dress/);
      assert.match(visibleText,/How to Book a Fitting/);
      assert.match(visibleText,/Book a Fitting/);
      assert.match(visibleText,/Message us on WhatsApp to ask about our dresses or book a fitting/);
      assert.match(visibleText,/Find a Dress/);
      assert.match(visibleText,/Message Us/);
      assert.match(visibleText,/Confirm Your Appointment/);
      assert.match(visibleText,/Fittings are by appointment only/);
      assert.match(visibleText,/Pomona/);
      assert.match(visibleText,/This map shows the general area/);
      assert.match(visibleText,/exact studio address and directions on WhatsApp once your fitting appointment is confirmed/);
      assert.doesNotMatch(visibleText,/illustrative|prefilled|website preview|prototype|sample imagery|studio pin/i,
        'Contact Us wording must be clear and customer-ready');
      assert.doesNotMatch(contact,/Sunnyside|Our Pretoria Location/,'Contact Us must not show the old Pretoria area');
      const mapLink=nodes(content.children).find(n=>n.tag==='a' && n.attrs.href?.startsWith('https://www.google.com/maps/search/'));
      assert(mapLink);
      assert.equal(mapLink.attrs.href,'https://www.google.com/maps/search/?api=1&query=Pomona%2C%20Kempton%20Park%2C%20Gauteng%2C%20South%20Africa');
      assert.equal(mapLink.attrs.target,'_blank');
      assert.equal(mapLink.attrs.rel,'noopener noreferrer');
      assert.equal(mapLink.children[0],'View Pomona on Google Maps');
    }
    assert.equal(JSON.stringify(capture), before);
  }
});

test('luxury editorial lookbook contains all catalogue dresses and accurate A4 pages', async () => {
  const jpeg=await sharp({create:{width:24,height:36,channels:3,background:'#eee8df'}}).jpeg().toBuffer();
  const images=catalogueProducts.map(dress=>({id:dress.id,jpeg,width:24,height:36}));
  const placements=lookbookPlacements(catalogueProducts);
  const html=createLuxuryLookbookHtml(catalogueProducts,images,{year:2026,logo:Buffer.from('89504e470d0a1a0a','hex')});
  const online=createNodeRenderer([])({tag:'div',attrs:{'data-lookbook-viewer':'true'},children:[]});
  for(const statement of [
    'Walking on red carpet with confidence',
    'Discover the wedding dress styles you love.',
    'Find your wedding dress.'
  ]) {
    assert(online.includes(statement)&&html.includes(statement),'online/PDF edition mismatch: '+statement);
  }
  assert.equal((online.match(/class="redcarpert-book-photo"/g)||[]).length,placements.length);
  assert.equal((html.match(/class="portrait"/g)||[]).length,placements.length);
  assert.equal((html.match(/<section class="page /g)||[]).length,placements.length+12);
  assert.equal((html.match(/class="page divider"/g)||[]).length,5);
  assert.equal((html.match(/class="portrait"/g)||[]).length,placements.length);
  assert.match(html,/@page\{size:A4;margin:0\}/);
  assert.match(html,/href="#collection-ruffled"/);
  assert.match(html,/href="#collection-modern_tradition"/);
  assert.match(html,/href="#collection-two_in_one"/);
  assert.match(html,/https:\/\/wa\.me\/27680458811/);
  const cover=html.match(/<section class="page cover" id="cover">([\s\S]*?)<\/section>/)?.[1];
  assert(cover, 'PDF cover is present');
  assert.equal((cover.match(/<img /g) || []).length, 1, 'PDF front cover uses only the official logo');
  assert.match(cover, /Walking on red carpet with confidence/);
  assert.match(cover, /Discover the wedding dress styles you love\./);
  assert.doesNotMatch(cover, /cover-photo|Bridal cover inspiration|data:image\/jpeg/);
  assert.match(html, /\.cover\{background:linear-gradient\(155deg,#FDFBF8,#F5F0E9\)\}/);
  assert.match(html, /\.page\.dress \.content\{left:20mm;right:20mm;/);
  assert.match(html, /\.portrait img\{[^"]*object-fit:contain/);
  assert.match(html, /\.dress-bottom\{[^"]*justify-content:center;align-items:center;[^"]*text-align:center/);
  assert.equal((html.match(/class="detail-link"/g)||[]).length,placements.length);
  assert.equal((html.match(/class="amount-label"/g)||[]).length,placements.length*2);
  assert.equal((html.match(/class="price-pair"/g)||[]).length,placements.length);
  assert.equal((html.match(/data-pdf-sale-price=/g)||[]).length,placements.length);
  assert.equal((html.match(/data-pdf-rental-price=/g)||[]).length,placements.length);
  assert.equal((html.match(/data-pdf-sale-label=/g)||[]).length,placements.length);
  assert.equal((html.match(/class="price-condition"/g)||[]).length,placements.length);
  assert.equal((online.match(/class="redcarpert-book-condition-note"/g)||[]).length,placements.length);
  assert.equal(online.split(RENTAL_CONDITION_NOTE).length-1,placements.length);
  assert.equal(html.split(RENTAL_CONDITION_NOTE).length-1,placements.length);
  assert.doesNotMatch(html,/Inspiration photo and example price|to be confirmed|provisional pricing/i);
  const back=html.match(/<section class="page back" id="back-cover">([\s\S]*?)<\/section>/)?.[1];
  assert(back, 'PDF back cover is present');
  assert.match(back, /Find your wedding dress\./);
  assert.match(back, /Browse Wedding Dresses/);
  assert.match(back, /Book a Fitting/);
  assert.match(html,/Your Fitting Journey/);
  assert(html.includes('https://wa.me/27680458811?text='));
  assert(html.includes(buildWhatsAppUrl(generalFittingMessage()).replaceAll('&','&amp;')),
    'PDF booking action must use the canonical formatted general message');
  assert.doesNotMatch(html,/Client-supplied photography/);
  assert.doesNotMatch(html,/Photo on Pexels|Ball Gown photos: Redcarpert Wedding Dresses/);
  assert.doesNotMatch(html,/To be confirmed|EXAMPLE SALE PRICE|Example sale price/i,
    'all PDF sale and rental figures must be populated');
  assert.doesNotMatch(html,/Indicative range|Example range/,
    'PDF must not display stale illustrative single-price ranges');
  // Page numbers must follow current catalogue sizes when more CSV batches arrive.
  let collectionPage=5;
  for(const category of catalogueCategories){
    const page=String(collectionPage).padStart(2,'0');
    assert(html.includes('href="#collection-'+category.id+'">'+category.name+
      '</a><span class="page-number">'+page+'</span>'),
      'contents page mismatch for '+category.id);
    collectionPage+=1+placements.filter(placement=>placement.category===category.id).length;
  }
  const totalPdfPages=placements.length+catalogueCategories.length+7;
  const lastNumberedPage=String(totalPdfPages-1).padStart(2,'0');
  assert(html.includes(lastNumberedPage+' / '+String(totalPdfPages).padStart(2,'0')),
    'PDF page folios must reflect the current catalogue length');
  for (const dress of catalogueProducts) {
    const label=dress.name;
    assert(html.includes('<h3>'+label+'</h3>'), 'missing editorial look '+label);
    assert(online.includes('<h3>'+label+'</h3>'),'online reader missing '+label);
    const sale=displaySalePriceForDress(dress.id);
    const rental=displayRentalPriceForDress(dress.id);
    const saleLabel=salePriceLabelForDress(dress.id);
    assert(online.includes('data-book-sale-price="'+dress.id+'">'+sale+'</p>'),
      'online reader sale price mismatch '+label);
    assert(online.includes('data-book-rental-price="'+dress.id+'">'+rental+'</p>'),
      'online reader rental price mismatch '+label);
    assert(online.includes('data-book-sale-label="'+dress.id+'">'+saleLabel+'</span>'),
      'online reader sale label mismatch '+label);
    assert(html.includes('data-pdf-sale-price="'+dress.id+'">'+sale+'</p>'),
      'PDF sale price must match the dress detail page for '+label);
    assert(html.includes('data-pdf-rental-price="'+dress.id+'">'+rental+'</p>'),
      'PDF rental price must match the dress detail page for '+label);
    assert(html.includes('data-pdf-sale-label="'+dress.id+'">'+saleLabel+'</p>'),
      'PDF must distinguish fixed example sale prices from unconfirmed sale prices for '+label);
    assert(html.includes('href="https://tita-mbotho-studio.github.io/redcarpert-prototype'+dress.previewRoute+'/"'),
      'missing link to '+label+' preview');
  }
  assert.equal(placements.length,51);
  assert.equal((online.match(/data-book-category="modern_tradition"/g)||[]).length,4);
  for (const placement of placements.filter(p=>p.isModernTradition)) {
    assert(online.includes('data-book-entry-id="'+placement.id+'" data-book-category="modern_tradition"'));
    assert(online.includes('<h3>'+placement.displayName+'</h3>'));
    assert(online.includes('href="'+placement.detailRoute+'/">View dress details</a>'));
    assert(html.includes('id="look-'+placement.id+'"'));
    assert(html.includes('<h3>'+placement.displayName+'</h3>'));
    assert(html.includes('href="https://tita-mbotho-studio.github.io/redcarpert-prototype'+placement.detailRoute+'/">View dress details</a>'));
  }
  assert.throws(()=>createLuxuryLookbookHtml(catalogueProducts.slice(0,19),images,{year:2026,logo:Buffer.alloc(20)}),/needs one photograph per dress/);
});

test('only the approved editorial fittings use label-above, icon-only WhatsApp controls', () => {
  for (const route of ['/about-us','/contact-us','/digital-lookbook','/wedding-moments']) {
    const capture=sitePages[route==='/digital-lookbook'?'/about-us':route];
    const doc=adaptEditorialDocument({...capture,route});
    const groups=nodes(doc.nodes).filter(n=>Object.hasOwn(n.attrs,'data-redcarpert-icon-cta'));
    assert.equal(groups.length,route==='/about-us'||route==='/contact-us'?1:0,
      route+' must not introduce icon-only actions outside the agreed sections');
    if(!groups.length)continue;
    const group=groups[0];
    assert.equal(group.attrs.class,'redcarpert-icon-cta');
    assert.equal(group.attrs['data-redcarpert-icon-cta'],'fitting');
    const [label,button]=group.children;
    assert.equal(label.tag,'p');
    assert.equal(label.attrs.class,'redcarpert-icon-cta-label');
    assert.deepEqual(label.children,['Book a Fitting']);
    assert.equal(button.tag,'button');
    assert.equal(button.attrs['data-whatsapp-preview'],'');
    assert.equal(button.attrs['aria-haspopup'],'dialog');
    assert.equal(button.attrs['aria-label'],'Book a Fitting via WhatsApp');
    assert.equal(button.children.length,1);
    const icon=button.children[0];
    assert.equal(icon.tag,'i');
    assert.equal(icon.attrs.class,'fa-brands fa-whatsapp');
    assert.equal(icon.attrs['aria-hidden'],'true');
    assert.deepEqual(icon.children,[],'visible button copy must stay outside the icon');
  }
});

test('digital lookbook download label is outside the button, with accessible Font Awesome icon and unchanged PDF target',()=>{
  const source=adaptEditorialDocument({...sitePages['/about-us'],route:'/digital-lookbook'});
  const viewer=nodes(source.nodes).find(n=>n.attrs['data-lookbook-viewer']==='true');
  assert(viewer);
  const html=createNodeRenderer([])(viewer);
  const block=html.match(/<div class="redcarpert-lookbook-download redcarpert-icon-cta" data-redcarpert-icon-cta="download">([\s\S]*?)<\/div>/);
  assert(block,'lookbook download must use the agreed compact icon group');
  assert.match(block[1],/<p class="redcarpert-icon-cta-label">Download The Bridal Edit \(PDF\)<\/p>/);
  assert.match(block[1],/<a class="button redcarpert-icon-cta-button" href="\/digital-lookbook\/Redcarpert-The-Bridal-Edit-\d{4}\.pdf" download="Redcarpert-The-Bridal-Edit-\d{4}\.pdf" aria-label="Download The Bridal Edit \(PDF\)">/);
  assert.match(block[1],/<i class="fa-solid fa-file-arrow-down" aria-hidden="true"><\/i><\/a>/);
  assert.doesNotMatch(block[1],/<a[^>]*>Download The Bridal Edit/,'download label must not be inside the clickable control');
});
