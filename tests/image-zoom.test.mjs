import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { catalogueProducts } from '../src/data/catalogue.ts';
import { createNodeRenderer } from '../scripts/lib/markup.ts';
import { renderWeddingMomentGallery, flattenWeddingMomentEvents, weddingMomentEvents } from '../src/lib/wedding-moments.ts';
import { mediaDeliveryUrl } from '../src/lib/media-delivery.ts';
import { isInsideContainedPhoto, paperTurnDirection } from '../src/client/lookbook-click-regions.js';

const visit = nodes => nodes.flatMap(n => typeof n === 'string' ? [] : [n, ...visit(n.children)]);

test('digital lookbook offers an accessible enlarged photo on all 35 dress leaves, without eager downloads', () => {
  const html = createNodeRenderer([])({tag:'div',attrs:{'data-lookbook-viewer':'true'},children:[]});
  assert.equal((html.match(/data-book-image-zoom=""/g)||[]).length,35);
  assert.equal((html.match(/class="redcarpert-book-photo"/g)||[]).length,35);
  assert.equal((html.match(/data-book-page=/g)||[]).length,37);
  assert.equal((html.match(/data-book-zoom-preview=/g)||[]).length,35);
  assert.equal((html.match(/data-book-zoom-original=/g)||[]).length,35);
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

test('lookbook hit targets separate visible dress pixels from ivory side gutters', () => {
  const bounds = { left: 100, top: 50, width: 300, height: 300 };
  // A tall portrait is centred inside a square image element. The element
  // itself is 300px wide but only ~193px of it contains visible photo pixels.
  assert.equal(isInsideContainedPhoto(bounds, 900, 1400, 250, 200), true,
    'clicking actual wedding dress pixels opens zoom');
  assert.equal(isInsideContainedPhoto(bounds, 900, 1400, 110, 200), false,
    'left ivory gutter must turn backward');
  assert.equal(isInsideContainedPhoto(bounds, 900, 1400, 390, 200), false,
    'right ivory gutter must turn forward');
  assert.equal(isInsideContainedPhoto(bounds, 1400, 900, 250, 60), false,
    'landscape photograph also has blank vertical gutters');
  assert.equal(isInsideContainedPhoto(bounds, 1400, 900, 250, 200), true);
  assert.equal(isInsideContainedPhoto(bounds, 0, 0, 250, 200), true,
    'unloaded photographs retain a click-to-zoom fallback');
  assert.equal(paperTurnDirection({left:100,width:300},110), -1);
  assert.equal(paperTurnDirection({left:100,width:300},390), 1);
  assert.equal(paperTurnDirection({left:100,width:300},250), 1);
});

test('book paper turns without obstructing photo zoom, details or keyboard focus', () => {
  const reader = readFileSync('src/client/lookbook-reader.js','utf8');
  const css = readFileSync('src/components/EditorialPages.css','utf8');
  assert.match(reader, /isInsideContainedPhoto\(/);
  assert.match(reader, /paperTurnDirection\(/);
  assert.match(reader, /book\.addEventListener\('click'/,
    'blank paper clicks must be handled in the shared book root');
  assert.match(reader, /PageFlip's wrapper layers/,
    'click navigation must handle both physical pages and PageFlip wrappers');
  assert.match(reader, /pointerup/,
    'a completed mouse drag must never cause an extra page turn');
  assert.match(reader, /event\.target\.closest\('\[data-book-image-zoom\],a,button/,
    'photos and detail links must keep their own actions');
  assert.match(reader, /Date\.now\(\) < suppressZoomUntil/,
    'swipes must not cause accidental page turns');
  assert.match(reader, /redcarpert-book-pointer-return/);
  assert.match(css, /\.redcarpert-book-zoom-trigger\.redcarpert-book-pointer-return:focus-visible\s*\{/);
  assert.match(css, /outline: none !important/);
  assert.match(css, /\.redcarpert-book-zoom-trigger:focus-visible\s*\{[^}]*outline: 2px solid/,
    'keyboard users must retain a visible focus indication');
});

test('lightbox close X has no brown ring in Lookbook or Wedding Moments', () => {
  const css = readFileSync('src/components/ImageZoom.css', 'utf8');
  assert.match(css, /\.redcarpert-image-zoom-close,\s*\.redcarpert-wedding-preview-close\s*\{\s*outline: none !important;/,
    'both close buttons should suppress the circular outline');
  assert.match(css, /\.redcarpert-image-zoom-close:focus-visible,\s*\.redcarpert-wedding-preview-close:focus-visible\s*\{[^}]*outline: none !important;/,
    'focused close buttons must not regain a gold outline');
  assert.match(css, /\.redcarpert-image-zoom-close:focus-visible,\s*\.redcarpert-wedding-preview-close:focus-visible\s*\{[^}]*background:/,
    'keyboard focus should have a non-ring visual indicator');
  assert.match(css, /\.redcarpert-image-zoom-controls button:focus-visible\s*\{[^}]*outline: 2px solid/,
    'zoom-in, zoom-out and reset must keep their accessible focus outline');
});

test('3D book remains available on all screen types while the zoom action does not turn a page', () => {
  const reader=readFileSync('src/client/lookbook-reader.js','utf8');
  const moments=readFileSync('src/client/wedding-moments.js','utf8');
  const zoom=readFileSync('src/client/image-zoom.js','utf8');
  const photoCss=readFileSync('src/components/ImageZoom.css','utf8');
  const momentsCss=readFileSync('src/components/WeddingMoments.css','utf8');
  const browser=readFileSync('scripts/browser-responsive-zoom.mjs','utf8');
  const enhanced=readFileSync('scripts/browser-lookbook-enhanced.mjs','utf8');
  assert.match(reader,/loadPageFlip\(\)\.then\(PageFlip => \{/);
  assert.match(reader,/usePortrait:\s*true/);
  assert.match(reader,/disableFlipByClick:\s*true/,
    'PageFlip 3D animation remains, while controlled paper clicks turn once');
  assert.match(reader,/clickEventForward:\s*true/,
    'zoom buttons and dress detail links remain clickable');
  assert.doesNotMatch(reader,/fineDesktop|restoreFallback|cleanPages|matchMedia\('\(min-width: 1101px/,
    'do not replace the 3D book with a flat reader on phones or tablets');
  assert.match(reader,/if \(!\(event\.target instanceof Element\) \|\| dialog\?\.open/,
    'paper clicks use a single delegated click handler');
  assert.match(reader,/event\.stopImmediatePropagation\(\)/,
    'handled stationary mouseups must not trigger a second vendor turn');
  assert.match(reader,/engine\.userStop\(\{ x: clientX - rect\.left, y: clientY - rect\.top \}, true\)/,
    'intercepted taps must finish vendor touch state without a second page flip');
  assert.match(reader,/finishHandledGesture\(event\.clientX, event\.clientY\)/,
    'mouse release must not leave a pending vendor gesture');
  assert.match(reader,/finishHandledGesture\(touch\.clientX, touch\.clientY\)/,
    'touch release must not leave a pending vendor gesture');
  assert.match(reader,/book\.addEventListener\('touchend', event => \{/,
    'real stationary touch taps must be handled in the 3D reader');
  assert.match(reader,/enhancedTouch/);
  assert.match(reader,/event\.stopImmediatePropagation\(\)/,
    'a handled paper touch must not reach the vendor a second time');
  assert.match(reader,/if \(photo && openBookPhoto\) openBookPhoto\(trigger\)/,
    'touch zoom and touch page turning must be exclusive');
  assert.match(reader,/isInsideContainedPhoto\(/,
    'ivory gutters should remain paper-turn regions');
  assert.match(reader,/turn\(paperDirection\(event\.clientX\)\)/,
    'blank image letterboxing still turns the book');
  assert.match(reader,/const moved = Math\.hypot/,
    'dragging and swiping must not open photograph zoom');
  assert.match(reader,/previous\.addEventListener\('click', \(\) => turn\(-1\)\)/);
  assert.match(reader,/next\.addEventListener\('click', \(\) => turn\(1\)\)/);
  assert.match(reader,/button\.addEventListener\('touchend', event =>/,
    'the page controls must work after a swipe on phones');
  assert.match(reader,/book\.addEventListener\('touchend'/,
    'fallback retains its swipe navigation when the CDN is unavailable');
  assert.match(moments,/grid\.addEventListener\('click'/);
  assert.doesNotMatch(moments,/grid\.addEventListener\('pointerup'/,
    'Wedding Moments thumbnails continue to use standard button clicks');
  assert.match(photoCss,/@media \(max-width: 1000px\)\s*\{[^}]*\.redcarpert-image-zoom-dialog \{ padding-top: 52px; \}/);
  assert.match(momentsCss,/@media \(max-width: 1000px\)\s*\{[^}]*\.redcarpert-wedding-dialog \{ padding-top: 52px; \}/);
  assert.match(zoom,/image\.addEventListener\('load'/);
  assert.match(zoom,/refresh: paint/);
  assert.match(reader,/zoom\.refresh\(\)/);
  assert.match(browser,/page\.touchscreen\.tap/);
  assert.match(browser,/await book\.scrollIntoViewIfNeeded\(\)/,
    '3D test must position the book in the viewport before tapping');
  assert.match(browser,/document\.elementFromPoint\(x,y\)/,
    '3D test must select a visible paper hit target');
  assert.doesNotMatch(browser,/coverRect\.(?:right|top)/,
    'invalid bounding-box properties must never produce mouse.click NaN');
  assert.match(browser,/real two-finger pinch/);
  assert.match(browser,/page\.setViewportSize/);
  assert.match(browser,/\[1440, 1024, 768, 390, 320\]/);
  assert.match(browser,/photoSnapshot=await book\.evaluate/,
    '3D tap test must locate a rendered photograph on the active spread');
  assert.doesNotMatch(browser,/page\.locator\('\[data-book-page="2"\] \[data-book-image-zoom\] img'\)/,
    'active PageFlip spreads are not guaranteed to show page 2');
  assert.match(enhanced,/page-flip/);
});
