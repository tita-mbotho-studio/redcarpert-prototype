import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { sitePages } from '../src/data/site.ts';
import { adaptEditorialDocument } from '../src/lib/editorial-pages.ts';
import { createSampleLookbookPdf } from '../src/lib/lookbook-pdf.ts';

const nodes = list => list.flatMap(n => typeof n === 'string' ? [] : [n, ...nodes(n.children)]);
test('new Redcarpert editorial content reuses source shell and never exposes original business copy', () => {
  for (const route of ['/about-us', '/contact-us', '/our-brides', '/digital-lookbook']) {
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
    assert.equal(nodes(content.children).filter(n => n.tag === 'h2').length > 0, true);
    if (route === '/digital-lookbook') {
      assert.equal(nodes(content.children).filter(n => n.attrs['data-lookbook-viewer'] === 'true').length, 1);
    }
    assert.equal(JSON.stringify(capture), before);
  }
});

test('lookbook PDF is a two-page illustrated PDF with correct xref and no client claims', async () => {
  const jpeg = await sharp({create:{width:24,height:36,channels:3,background:'#dddddd'}}).jpeg().toBuffer();
  const pdf = createSampleLookbookPdf([
    { jpeg, width: 24, height: 36, category: 'Mermaid', sample: 'Sample 01', photographer: 'Stock' },
    { jpeg, width: 24, height: 36, category: 'Ball Gown', sample: 'Sample 02', photographer: 'Stock' },
  ]);
  assert.equal(pdf.toString('latin1',0,8),'%PDF-1.4');
  const text = pdf.toString('latin1');
  assert.match(text,/\/Count 2/);
  assert.match(text,/DIGITAL LOOKBOOK/);
  assert.match(text,/not confirmed Redcarpert inventory/);
  assert.match(text,/\/DCTDecode/);
  assert.match(text,/startxref\n\d+\n%%EOF/);
});
