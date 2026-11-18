import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNodeRenderer} from '../scripts/lib/markup.ts';
import {catalogueProducts} from '../src/data/catalogue.ts';
import {getRenderedPhotoBounds, pointIsOnPhoto} from '../src/client/lookbook-zoom.js';

const bookMarkup = () =>
  createNodeRenderer([])({tag:'div',attrs:{'data-lookbook-viewer':'true'},children:[]});

test('the lookbook photograph itself is the only zoom target: no icon, button or overlay', () => {
  const html = bookMarkup();
  assert.equal((html.match(/data-book-zoom-photo(?= )/g) ?? []).length,catalogueProducts.length);
  assert.equal((html.match(/role="button" tabindex="0" aria-haspopup="dialog"/g) ?? []).length,catalogueProducts.length);
  assert.equal((html.match(/data-book-zoom-original="https:\/\//g) ?? []).length,catalogueProducts.length);
  assert.equal((html.match(/data-book-zoom-src="https:\/\//g) ?? []).length,catalogueProducts.length);
  assert.equal((html.match(/class="redcarpert-book-photo"/g) ?? []).length,catalogueProducts.length);
  assert.doesNotMatch(html,/data-book-zoom-trigger|redcarpert-book-zoom-trigger|redcarpert-book-zoom-controls|data-book-zoom-stage/);
  assert.doesNotMatch(html,/data-book-zoom-in|data-book-zoom-out|data-book-zoom-reset|data-book-zoom-percent/);
  assert.doesNotMatch(html,/<button[^>]*class="redcarpert-book-zoom/);
});

test('lookbook photo dialog shares exact Wedding Moments media and close-button classes', () => {
  const html = bookMarkup();
  const weddingCss = readFileSync('src/components/WeddingMoments.css','utf8');
  assert.match(html,/<dialog class="redcarpert-wedding-dialog redcarpert-book-zoom-dialog" data-book-zoom-dialog/);
  assert.match(html,/<div class="redcarpert-moment-dialog-inner"><img class="redcarpert-wedding-preview-image" data-book-zoom-image/);
  assert.match(html,/<button type="button" class="redcarpert-wedding-preview-close" data-book-zoom-close/);
  assert.match(html,/class="fa-solid fa-xmark"/);
  assert.equal((html.match(/data-book-zoom-dialog/g) ?? []).length,1);
  assert.match(weddingCss,/\.redcarpert-wedding-dialog::backdrop/);
  assert.match(weddingCss,/backdrop-filter: blur\(12px\)/);
  assert.match(weddingCss,/\.redcarpert-wedding-preview-image/);
  assert.match(weddingCss,/\.redcarpert-wedding-preview-close/);
});

test('painted object-fit contain photo bounds exclude white image gutters', () => {
  const image = {
    naturalWidth: 900,
    naturalHeight: 1600,
    getBoundingClientRect: () => ({left:10,top:20,width:400,height:400}),
  };
  const bounds = getRenderedPhotoBounds(image);
  assert.deepEqual(bounds,{left:97.5,top:20,right:322.5,bottom:420,width:225,height:400});
  assert.equal(pointIsOnPhoto(image,12,200),false);
  assert.equal(pointIsOnPhoto(image,100,200),true);
  assert.equal(pointIsOnPhoto(image,310,300),true);
  assert.equal(pointIsOnPhoto(image,350,300),false);
  assert.equal(getRenderedPhotoBounds({...image,naturalWidth:0}),null);
});

test('tap interception does not replace or disable native StPageFlip gestures', () => {
  const src = readFileSync('src/client/lookbook-zoom.js','utf8');
  const reader = readFileSync('src/client/lookbook-reader.js','utf8');
  assert.match(src,/window\.addEventListener\('pointerdown'/);
  assert.match(src,/window\.addEventListener\('pointermove'/);
  assert.match(src,/window\.addEventListener\('pointerup'/);
  assert.match(src,/maxTapMovement = 4\.5/);
  assert.match(src,/getPageFlip\(\)\?\.userStop\(\{x:0, y:0\}, true\)/);
  assert.match(src,/dialog\.showModal\(\)/);
  assert.match(src,/previousFocus|opener\?\.isConnected/);
  assert.doesNotMatch(src,/pageFlip\.flipNext\(|pageFlip\.flipPrev\(|disableFlipByClick/);
  assert.match(src,/dialog\.addEventListener\('keydown', event => event\.stopPropagation\(\)\)/,
    'keyboard handling inside the dialog must be isolated from the book');
  assert.match(reader,/initializeLookbookZoom\(viewer, book, \(\) => engine\)/);
  assert.match(reader,/pageFlip\.loadFromHTML\(flipPages\)/);
  assert.match(reader,/mobileScrollSupport: false, clickEventForward: true, swipeDistance: 35/);
});

test('Dress Details uses the Wedding Moments-style photo modal instead of the old expand icon and Fancybox', () => {
  const detail=readFileSync('src/lib/product-detail-preview.ts','utf8');
  const controller=readFileSync('src/client/dress-gallery.js','utf8');
  assert.doesNotMatch(detail,/class: "wpgis-popup redcarpert-modern-zoom"/);
  assert.doesNotMatch(detail,/"data-fancybox": "product-gallery"/);
  assert.doesNotMatch(detail,/"data-gallery-enlarge": ""/);
  assert.match(detail,/"data-gallery-active-image": "", tabindex: "0", role: "button"/);
  assert.match(detail,/"aria-haspopup": "dialog"/);
  assert.match(detail,/redcarpert-wedding-dialog redcarpert-dress-photo-dialog/);
  assert.match(detail,/class: "redcarpert-wedding-preview-image"/);
  assert.match(detail,/class: "redcarpert-wedding-preview-close"/);
  assert.match(controller,/setMediaImage\(preview, photo.url, 'preview'\)/);
  assert.match(controller,/dialog\.showModal\(\)/);
  assert.match(controller,/frame\.addEventListener\('touchend'/);
});

test('lookbook removes pointer focus frames while retaining keyboard focus and original Wedding Moments styling', () => {
  const css=readFileSync('src/components/LookbookZoom.css','utf8');
  const controller=readFileSync('src/client/lookbook-zoom.js','utf8');
  assert.match(css,/\.redcarpert-book-photo img\[data-book-zoom-photo\] \{[^}]*border:\s*0 !important;[^}]*box-shadow:\s*none !important;/);
  assert.match(css,/img\[data-book-zoom-photo\]\.redcarpert-book-pointer-restored:focus-visible \{[^}]*outline:\s*none !important;/);
  assert.match(css,/\.redcarpert-book-zoom-dialog\.redcarpert-book-pointer-opened \.redcarpert-wedding-preview-close:focus-visible \{[^}]*outline:\s*none !important;/);
  assert.match(css,/img\[data-book-zoom-photo\]:focus-visible \{[^}]*outline:\s*2px solid #666;/,
    'keyboard users should retain a neutral focus indicator');
  assert.match(controller,/dialog\.classList\.toggle\('redcarpert-book-pointer-opened', viaPointer\)/);
  assert.match(controller,/restoredImage\.classList\.add\('redcarpert-book-pointer-restored'\)/);
  assert.match(controller,/restoredImage\.addEventListener\('blur'/);
  assert.doesNotMatch(css,/^\.redcarpert-wedding-dialog(?=:|\s|\{)/m,
    'do not override the wedding-moments dialog globally');
});
