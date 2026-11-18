import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateLookbookPhotoDimensions,
  estimateLookbookPrintDpi,
  shouldReportLookbookPrintWarning,
} from '../scripts/lib/lookbook-assets.ts';

test('small client-supplied Ball Gown photos do not prevent PDF/site generation', () => {
  assert.doesNotThrow(() => validateLookbookPhotoDimensions({width:520,height:900},'client','ball-gown-06'));
  assert.doesNotThrow(() => validateLookbookPhotoDimensions({width:400,height:400},'client','ball-gown-06'));
  assert.doesNotThrow(() => validateLookbookPhotoDimensions({width:1200,height:1800},'client','ball-gown-03'));
});

test('Pexels sources retain the minimum resolution rule', () => {
  assert.doesNotThrow(() => validateLookbookPhotoDimensions({width:1200,height:1800},'sample','sample-mermaid'));
  assert.throws(() => validateLookbookPhotoDimensions({width:520,height:900},'sample','sample-mermaid'),
    /Pexels source too small for PDF/);
});

test('invalid or unreadable source images are still rejected', () => {
  for (const d of [{width:0,height:800},{width:250},{width:NaN,height:800},{width:-10,height:200}]) {
    assert.throws(() => validateLookbookPhotoDimensions(d,'client','ball-gown-06'),
      /Invalid lookbook image dimensions/);
  }
});

test('print readiness is estimated from actual encoded PDF image dimensions', () => {
  const small=estimateLookbookPrintDpi(520,900);
  assert(small>0 && small<300,'smaller client photos should be marked below print quality');
  assert(estimateLookbookPrintDpi(2000,2500)>=300);
  assert.throws(() => estimateLookbookPrintDpi(0,1200),/Invalid processed lookbook image dimensions/);
});

test('routine client print-resolution warnings are opt-in without changing DPI audit or error handling', () => {
  // The default is quiet unless REDCARPERT_PDF_PRINT_WARNINGS=1 is set.
  assert.equal(shouldReportLookbookPrintWarning('client',false,false),false);
  assert.equal(shouldReportLookbookPrintWarning('client',true,false),false);
  assert.equal(shouldReportLookbookPrintWarning('client',false,true),true);
  assert.equal(shouldReportLookbookPrintWarning('client',true,true),false);
  assert.equal(shouldReportLookbookPrintWarning('sample',false,true),false);
});
