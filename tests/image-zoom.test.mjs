import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { catalogueProducts } from '../src/data/catalogue.ts';
import { createNodeRenderer } from '../scripts/lib/markup.ts';
import { renderWeddingMomentGallery, flattenWeddingMomentEvents, weddingMomentEvents } from '../src/lib/wedding-moments.ts';
import { mediaDeliveryUrl } from '../src/lib/media-delivery.ts';

const visit = nodes => nodes.flatMap(n => typeof n === 'string' ? [] : [n, ...visit(n.children)]);

test('digital lookbook offers an accessible enlarged photo on all 27 dress leaves, without eager downloads', () => {
  const html = createNodeRenderer([])({tag:'div',attrs:{'data-lookbook-viewer':'true'},children:[]});
  assert.equal((html.match(/data-book-image-zoom=""/g)||[]).length,27);
  assert.equal((html.match(/class="redcarpert-book-photo"/g)||[]).length,27);
  assert.equal((html.match(/data-book-page=/g)||[]).length,29);
  assert.equal((html.match(/data-book-zoom-preview=/g)||[]).length,27);
  assert.equal((html.match(/data-book-zoom-original=/g)||[]).length,27);
  for (const dress of catalogueProducts) {
    assert(html.includes('data-book-zoom-original="'+dress.image.replaceAll('&','&amp;')+'"'),
      dress.id+' original must be preserved for the popup');
    assert(html.includes('data-book-zoom-preview="'+mediaDeliveryUrl(dress.image,'preview').replaceAll('&','&amp;')+'"'),
      dress.id+' preview must use the shared 1920px delivery policy');
  }
  const modal = html.match(/<dialog id="redcarpert-book-photo-dialog"[\s\S]*?<\/dialog>/)?.[0];
  assert(modal,'book lightbox must be outside physical flipbook leaves');
  assert(html.indexOf(modal) > html.indexOf('id="redcarpert-flipbook"'));
  assert(!/<img[^>]*\bsrc=/.test(modal),'the large modal image must not load before click');
  for (const control of ['data-image-zoom-stage','data-image-zoom-photo','data-image-zoom-in','data-image-zoom-out','data-image-zoom-reset','data-book-image-close']) {
    assert(modal.includes(control),control+' missing from book popup');
  }
  assert(!html.includes('data-book-price='));
});

test('Wedding Moments enables photo-only zoom while preserving native video controls', () => {
  const nodes = visit(renderWeddingMomentGallery(flattenWeddingMomentEvents(weddingMomentEvents)));
  const dialog = nodes.find(n => n.tag==='dialog');
  assert.equal(dialog.attrs.id,'redcarpert-wedding-preview');
  const stage = nodes.find(n => n.attrs['data-image-zoom-stage']!==undefined);
  const photo = nodes.find(n => n.attrs['data-wedding-preview-photo']!==undefined);
  const player = nodes.find(n => n.tag==='video');
  assert.equal(stage.attrs.hidden,'hidden');
  assert.equal(photo.attrs['data-image-zoom-photo'],'');
  assert.equal(player.attrs.controls,'controls');
  assert.equal(player.attrs.playsinline,'playsinline');
  assert.equal(player.attrs.preload,'none');
  assert.equal(player.attrs['data-image-zoom-photo'],undefined,'videos must never be zoom targets');
  for (const attr of ['data-image-zoom-controls','data-image-zoom-in','data-image-zoom-out','data-image-zoom-reset','data-image-zoom-percent']) {
    assert(nodes.some(n => Object.hasOwn(n.attrs,attr)),attr+' missing');
  }
});

test('the shared controller supports bounded zoom, pointer pinch/pan, mouse wheel, focus and Escape', () => {
  const js = readFileSync('src/client/image-zoom.js','utf8');
  const css = readFileSync('src/components/ImageZoom.css','utf8');
  const reader = readFileSync('src/client/lookbook-reader.js','utf8');
  const wedding = readFileSync('src/client/wedding-moments.js','utf8');
  const generator = readFileSync('scripts/generate.ts','utf8');
  assert.match(js,/const MAX = 4/);
  assert.match(js,/pointerdown/);
  assert.match(js,/pointermove/);
  assert.match(js,/pointercancel/);
  assert.match(js,/wheel/);
  assert.match(js,/scale\s*\*/);
  assert.match(js,/dialog\.addEventListener\('close'/);
  assert.match(reader,/disableFlipByClick:\s*true/);
  assert.match(reader,/photoOpener\.focus|photoOpener\.focus\(/);
  assert.match(reader,/dialog\[open\]/);
  assert.match(wedding,/zoom\.setActive\(type === 'photo'\)/);
  assert.match(wedding,/video\.muted = false/);
  assert.match(css,/touch-action:\s*none/);
  assert.match(css,/object-fit:\s*contain/);
  assert.match(css,/@media \(max-width: 1000px\)/);
  assert(generator.includes("'src/components/ImageZoom.css'"));
});
