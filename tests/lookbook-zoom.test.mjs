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

test('Dress Details retains the modern Font Awesome expand icon and existing Fancybox behaviour', () => {
  const detail=readFileSync('src/lib/product-detail-preview.ts','utf8');
  assert.match(detail,/class: "wpgis-popup redcarpert-modern-zoom"/);
  assert.match(detail,/class: "fa-solid fa-up-right-and-down-left-from-center"/);
  assert.match(detail,/"data-fancybox": "product-gallery"/);
  assert.doesNotMatch(detail,/class: "wpgis-popup fa fa-expand"/);
});
