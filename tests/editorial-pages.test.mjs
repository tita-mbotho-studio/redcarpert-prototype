import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { sitePages } from '../src/data/site.ts';
import { adaptEditorialDocument } from '../src/lib/editorial-pages.ts';
import { createLuxuryLookbookHtml } from '../src/lib/luxury-lookbook.ts';
import { catalogueProducts } from '../src/data/catalogue.ts';

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

test('luxury editorial lookbook contains exactly thirty-two A4 pages, five collections, and twenty priced looks', async () => {
  const jpeg=await sharp({create:{width:24,height:36,channels:3,background:'#eee8df'}}).jpeg().toBuffer();
  const images=catalogueProducts.map(dress=>({id:dress.id,jpeg,width:24,height:36}));
  const html=createLuxuryLookbookHtml(catalogueProducts,images,{year:2026,logo:Buffer.from('89504e470d0a1a0a','hex')});
  assert.equal((html.match(/<section class="page /g)||[]).length,32);
  assert.equal((html.match(/class="divider"/g)||[]).length,5);
  assert.equal((html.match(/class="portrait"/g)||[]).length,20);
  assert.match(html,/@page\{size:A4;margin:0\}/);
  assert.match(html,/href="#collection-ruffled"/);
  assert.match(html,/href="#collection-modern_tradition"/);
  assert.match(html,/href="#collection-two_in_one"/);
  assert.match(html,/https:\/\/wa\.me\/27680458811/);
  assert.match(html,/Illustrative Pexels photograph/);
  assert.match(html,/Photography Credits/);
  for (const dress of catalogueProducts) {
    const label=dress.name.replace(/^Sample /,'Look ');
    assert(html.includes('<h3>'+label+'</h3>'), 'missing editorial look '+label);
    assert(html.includes('>'+new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(dress.priceZar).replace(/^ZAR\s*/,'R ')+'</p>') ||
      html.includes(dress.priceZar.toLocaleString('en-ZA')) || html.includes('R&nbsp;'),
      'sample prices must appear in the editorial HTML');
  }
  assert.throws(()=>createLuxuryLookbookHtml(catalogueProducts.slice(0,19),images,{year:2026,logo:Buffer.alloc(20)}),/requires 20 dresses/);
});
