import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('interactive book photographs sit directly on matching ivory paper', () => {
  const css=readFileSync('src/components/EditorialPages.css','utf8');
  const leaf=css.match(/\.redcarpert-book-photo \{([^}]+)\}/)?.[1];
  assert(leaf,'missing interactive photo frame');
  assert.match(css,/--book-paper:\s*#fdfbf8/i);
  assert.match(leaf,/background:\s*var\(--book-paper\)/);
  assert.match(leaf,/border:\s*0\s*;/);
  assert.match(css,/\.redcarpert-book-photo img \{[^}]*object-fit:\s*contain\s*;/);
});

test('downloadable PDF photograph surrounds use matching ivory without borders', () => {
  const source=readFileSync('src/lib/luxury-lookbook.ts','utf8');
  assert.match(source,/\.portrait\{[^"]*background:#FDFBF8;/);
  assert.match(source,/\.cover\{background:linear-gradient\(155deg,#FDFBF8,#F5F0E9\)\}/);
  assert.doesNotMatch(source,/\.cover-photo\{/,'the PDF must share the online logo-only cover');
  assert.match(source,/\.page\.dress \.content\{left:20mm;right:20mm;/);
  assert.match(source,/\.portrait img\{[^"]*object-fit:contain;/);
});
