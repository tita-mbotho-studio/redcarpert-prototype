import assert from 'node:assert/strict';
import test from 'node:test';
import { preserveHomepageHeader } from '../src/lib/homepage-header.ts';

function fixture(home = true) {
  const header = {};
  const previous = { window: globalThis.window, document: globalThis.document };
  class StickyHeader {
    constructor(element = header) { this.$el = { 0: element }; this.calls = 0; }
    isScrolled() { return true; }
    init() { this.calls++; this.compact = this.isScrolled(); }
  }
  globalThis.document = { querySelector: selector => selector === '#header' ? header : home ? {} : null };
  globalThis.window = { PEXETO: { utils: { stickyHeader: StickyHeader } } };
  return { StickyHeader, restore() { Object.assign(globalThis, previous); } };
}

test('only the homepage instance keeps normal geometry, delegating original initialization once', () => {
  const f = fixture();
  try {
    const original = f.StickyHeader.prototype.init;
    const predicate = f.StickyHeader.prototype.isScrolled;
    const release = preserveHomepageHeader();
    const header = new f.StickyHeader(); header.init();
    assert.equal(header.compact, false); assert.equal(header.calls, 1);
    assert.strictEqual(f.StickyHeader.prototype.init, original);
    assert.strictEqual(f.StickyHeader.prototype.isScrolled, predicate);
    assert.equal(new f.StickyHeader().isScrolled(), true);
    release();
    assert.equal(header.isScrolled(), true); assert.equal(Object.hasOwn(header, 'isScrolled'), false);
  } finally { f.restore(); }
});

test('informational pages and other header instances retain original sticky behaviour', () => {
  for (const home of [false, true]) {
    const f = fixture(home);
    try {
      const original = f.StickyHeader.prototype.init;
      const release = preserveHomepageHeader();
      if (!home) { assert.equal(release, undefined); assert.strictEqual(f.StickyHeader.prototype.init, original); }
      const other = new f.StickyHeader({}); other.init();
      assert.equal(other.compact, true); assert.equal(other.calls, 1);
      release?.(); assert.strictEqual(f.StickyHeader.prototype.init, original);
    } finally { f.restore(); }
  }
});

test('cleanup restores a pending hook or an existing own predicate without changing its descriptor', () => {
  const f = fixture();
  try {
    const original = f.StickyHeader.prototype.init;
    preserveHomepageHeader()(); assert.strictEqual(f.StickyHeader.prototype.init, original);
    const header = new f.StickyHeader();
    Object.defineProperty(header, 'isScrolled', { value: () => true, configurable: true, writable: true, enumerable: false });
    const descriptor = Object.getOwnPropertyDescriptor(header, 'isScrolled');
    const release = preserveHomepageHeader(); header.init(); release();
    assert.deepEqual(Object.getOwnPropertyDescriptor(header, 'isScrolled'), descriptor);
  } finally { f.restore(); }
});

test('missing theme API is a harmless no-op', () => {
  const f = fixture();
  try { globalThis.window = {}; assert.equal(preserveHomepageHeader(), undefined); }
  finally { f.restore(); }
});
