import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNodeRenderer} from '../scripts/lib/markup.ts';
import {catalogueProducts} from '../src/data/catalogue.ts';

test('each lookbook gown has one independent modern Font Awesome zoom control', () => {
  const html=createNodeRenderer([])({tag:'div',attrs:{'data-lookbook-viewer':'true'},children:[]});
  const triggers=[...html.matchAll(/<button type="button" class="redcarpert-book-zoom-trigger"[^>]+>/g)].map(m=>m[0]);
  assert.equal(triggers.length,catalogueProducts.length);
  assert(triggers.every(button=>button.includes('data-book-zoom-src="https://') &&
    button.includes('data-book-zoom-original="https://') && button.includes('aria-haspopup="dialog"')));
  assert.equal((html.match(/class="fa-solid fa-up-right-and-down-left-from-center"/g)??[]).length,
    catalogueProducts.length);
  assert.equal((html.match(/class="redcarpert-book-photo"/g)??[]).length,catalogueProducts.length);
  assert.match(html,/<dialog class="redcarpert-book-zoom-dialog" data-book-zoom-dialog/);
  assert.match(html,/data-book-zoom-stage/);
  assert.match(html,/data-book-zoom-image/);
  assert.match(html,/data-book-zoom-percent/);
  assert.match(html,/data-book-zoom-close/);
  assert.match(html,/data-book-zoom-in/);
  assert.match(html,/data-book-zoom-out/);
  assert.match(html,/data-book-zoom-reset/);
  assert.equal((html.match(/data-book-zoom-dialog/g)??[]).length,1,
    'zoom must use one viewer outside animated paper');
  assert.doesNotMatch(html,/class="redcarpert-book-photo"[^>]*onclick/);
});

test('the dress detail and lookbook use the same modern expand icon without replacing detail Fancybox', () => {
  const detail=readFileSync('src/lib/product-detail-preview.ts','utf8');
  assert.match(detail,/class: "wpgis-popup redcarpert-modern-zoom"/);
  assert.match(detail,/class: "fa-solid fa-up-right-and-down-left-from-center"/);
  assert.match(detail,/"data-fancybox": "product-gallery"/);
  assert.doesNotMatch(detail,/class: "wpgis-popup fa fa-expand"/);
});

test('zoom listeners are limited to the explicit trigger and do not replace PageFlip', () => {
  const js=readFileSync('src/client/lookbook-zoom.js','utf8');
  const book=readFileSync('src/client/lookbook-reader.js','utf8');
  const css=readFileSync('src/components/LookbookZoom.css','utf8');
  assert.match(js,/trigger\.addEventListener\('click'/);
  assert.match(js,/event\.stopPropagation\(\)/);
  assert.match(js,/dialog\.showModal\(\)/);
  assert.match(js,/dialog\.addEventListener\('close'/);
  assert.match(js,/previousFocus\?\.focus/);
  assert.match(book,/initializeLookbookZoom\(viewer\)/);
  assert.match(book,/pageFlip\.loadFromHTML\(flipPages\)/);
  assert.match(book,/mobileScrollSupport: false, clickEventForward: true/);
  assert.match(css,/\.redcarpert-book-zoom-stage\s*\{/);
  assert.match(css,/touch-action:\s*none/);
});
