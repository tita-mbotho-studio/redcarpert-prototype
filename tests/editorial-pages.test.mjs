import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { sitePages } from '../src/data/site.ts';
import { adaptEditorialDocument } from '../src/lib/editorial-pages.ts';
import { createLuxuryLookbookHtml } from '../src/lib/luxury-lookbook.ts';
import { catalogueProducts } from '../src/data/catalogue.ts';
import { displayDressPrice } from '../src/lib/pricing.ts';
import { createNodeRenderer } from '../scripts/lib/markup.ts';

const nodes = list => list.flatMap(n => typeof n === 'string' ? [] : [n, ...nodes(n.children)]);
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
    assert(!/BRIDAL VANESA|bridalvanesa|Vienna|Denizli|1980/.test(JSON.stringify(content)));
    if (route === '/wedding-moments') {
      assert.equal(nodes(content.children).filter(n => n.tag === 'h2').length, 0,
        'minimal Wedding Moments has no category headings');
    } else {
      assert.equal(nodes(content.children).filter(n => n.tag === 'h2').length > 0, true);
    }
    if (route === '/digital-lookbook') {
      assert.equal(nodes(content.children).filter(n => n.attrs['data-lookbook-viewer'] === 'true').length, 1);
      assert(nodes(content.children).some(n => n.attrs.id === 'redcarpert-lookbook-title'));
    }
    if (route === '/about-us' || route === '/contact-us' || route === '/digital-lookbook') {
      assert(rendered.some(n => n.attrs.class === 'page-title redcarpert-editorial-page-title'));
      assert(nodes(content.children).some(n => n.attrs.class === 'redcarpert-editorial-hero'));
    }
    if (route === '/about-us') {
      const team=nodes(content.children).filter(n => n.attrs.class === 'redcarpert-editorial-team-card');
      assert.equal(team.length,3,'Meet the Team requires three placeholder cards');
      for(const card of team){
        const image=nodes(card.children).find(n=>n.tag==='img');
        assert(image.attrs.src.startsWith('https://images.pexels.com/photos/'), 'team photographs must remain remote placeholders');
        assert.match(JSON.stringify(card),/Not Redcarpert staff/);
      }
    }
    if (route === '/contact-us') {
      const container=rendered.find(n=>n.attrs.id==='content-container');
      assert.equal(container.attrs.class,'content-boxed layout-full');
      assert(!rendered.some(n=>n.attrs.id==='sidebar'),'empty sidebar must be removed from Contact Us');
      assert(rendered.some(n=>n.attrs.id==='full-width'),'Contact Us must use About Us content width');
      const map=nodes(content.children).find(n=>n.tag==='iframe');
      assert(map,'Contact Us must include an embedded map');
      assert.equal(map.attrs.src,'https://www.google.com/maps?q=Sunnyside%2C%20Pretoria%2C%20South%20Africa&output=embed');
      assert.equal(map.attrs.loading,'lazy');
      assert.match(JSON.stringify(content),/not a precise studio pin/);
      const mapLink=nodes(content.children).find(n=>n.tag==='a' && n.attrs.href?.startsWith('https://www.google.com/maps/search/'));
      assert(mapLink);
      assert.equal(mapLink.attrs.rel,'noopener noreferrer');
    }
    assert.equal(JSON.stringify(capture), before);
  }
});

test('luxury editorial lookbook contains thirty-nine A4 pages with client gowns and attributed samples', async () => {
  const jpeg=await sharp({create:{width:24,height:36,channels:3,background:'#eee8df'}}).jpeg().toBuffer();
  const images=catalogueProducts.map(dress=>({id:dress.id,jpeg,width:24,height:36}));
  const html=createLuxuryLookbookHtml(catalogueProducts,images,{year:2026,logo:Buffer.from('89504e470d0a1a0a','hex')});
  const online=createNodeRenderer([])({tag:'div',attrs:{'data-lookbook-viewer':'true'},children:[]});
  for(const statement of [
    'Your bridal story begins here.',
    'A considered edit of bridal inspiration for the moment that feels like yours.',
    'Find your silhouette.'
  ]) {
    assert(online.includes(statement)&&html.includes(statement),'online/PDF edition mismatch: '+statement);
  }
  assert.equal((online.match(/class="redcarpert-book-photo"/g)||[]).length,27);
  assert.equal((html.match(/class="portrait"/g)||[]).length,27);
  assert.equal((html.match(/<section class="page /g)||[]).length,39);
  assert.equal((html.match(/class="page divider"/g)||[]).length,5);
  assert.equal((html.match(/class="portrait"/g)||[]).length,27);
  assert.match(html,/@page\{size:A4;margin:0\}/);
  assert.match(html,/href="#collection-ruffled"/);
  assert.match(html,/href="#collection-modern_tradition"/);
  assert.match(html,/href="#collection-two_in_one"/);
  assert.match(html,/https:\/\/wa\.me\/27680458811/);
  const cover=html.match(/<section class="page cover" id="cover">([\s\S]*?)<\/section>/)?.[1];
  assert(cover, 'PDF cover is present');
  assert.equal((cover.match(/<img /g) || []).length, 1, 'PDF front cover uses only the official logo');
  assert.match(cover, /Your bridal story begins here\./);
  assert.match(cover, /A considered edit of bridal inspiration for the moment that feels like yours\./);
  assert.doesNotMatch(cover, /cover-photo|Bridal cover inspiration|data:image\/jpeg/);
  assert.match(html, /\.cover\{background:linear-gradient\(155deg,#FDFBF8,#F5F0E9\)\}/);
  assert.match(html, /\.page\.dress \.content\{left:20mm;right:20mm;/);
  assert.match(html, /\.portrait img\{[^"]*object-fit:contain/);
  assert.match(html, /\.dress-bottom\{[^"]*justify-content:center;align-items:center;[^"]*text-align:center/);
  assert.equal((html.match(/class="detail-link"/g)||[]).length,27);
  assert.equal((html.match(/class="amount-label"/g)||[]).length,16);
  assert.match(html, /Illustrative photograph and price/);
  const back=html.match(/<section class="page back" id="back-cover">([\s\S]*?)<\/section>/)?.[1];
  assert(back, 'PDF back cover is present');
  assert.match(back, /Find your silhouette\./);
  assert.match(back, /Browse Wedding Dresses/);
  assert.match(back, /Fitting enquiries/);
  assert.match(html,/Photography Credits/);
  assert.doesNotMatch(html,/Client-supplied photography/);
  assert.match(html,/Ball Gown collection: Redcarpert Wedding Dresses/);
  assert.match(html,/Price to be confirmed/);
  for(const [id,page] of [['mermaid','05'],['ball_gown','10'],['ruffled','22'],['modern_tradition','27'],['two_in_one','32']]){
    assert(html.includes('href="#collection-'+id+'">'+
      (id==='ball_gown'?'Ball Gown':id==='mermaid'?'Mermaid':id==='ruffled'?'Ruffled Dresses':id==='modern_tradition'?'Modern Tradition Dresses':'2 in 1 Dresses')+
      '</a><span class="page-number">'+page+'</span>'), 'contents page mismatch for '+id);
  }
  assert.match(html,/39 \/ 39|38 \/ 39/,'the PDF page folios should use the current page count');
  for (const dress of catalogueProducts) {
    const label=dress.status==='client'?dress.name:dress.name.replace(/^Sample /,'Look ');
    assert(html.includes('<h3>'+label+'</h3>'), 'missing editorial look '+label);
    assert(online.includes('<h3>'+label+'</h3>'),'online reader missing '+label);
    assert(online.includes('data-book-price="'+dress.id+'">'+displayDressPrice(dress.priceZar)+'</p>'),
      'online reader price mismatch '+label);
    assert(html.includes('<p class="amount">'+displayDressPrice(dress.priceZar)+'</p>'), 'missing ZAR price '+label);
    assert(html.includes('href="https://tita-mbotho-studio.github.io/redcarpert-prototype'+dress.previewRoute+'/"'),
      'missing link to '+label+' preview');
  }
  assert.throws(()=>createLuxuryLookbookHtml(catalogueProducts.slice(0,19),images,{year:2026,logo:Buffer.alloc(20)}),/requires 27 dresses/);
});
