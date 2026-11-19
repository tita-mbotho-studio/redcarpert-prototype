import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateLookbookPhotoDimensions,
  estimateLookbookPrintDpi,
  shouldReportLookbookPrintWarning,
} from '../scripts/lib/lookbook-assets.ts';

test('small client-supplied Ball Gown photos do not prevent PDF/site generation', () => {
  assert.doesNotThrow(() => validateLookbookPhotoDimensions({width:520,height:900},'ball-gown-06'));
  assert.doesNotThrow(() => validateLookbookPhotoDimensions({width:400,height:400},'ball-gown-06'));
  assert.doesNotThrow(() => validateLookbookPhotoDimensions({width:1200,height:1800},'ball-gown-03'));
});

test('native client dress photographs remain valid even at lower print resolution',()=>{
 assert.doesNotThrow(()=>validateLookbookPhotoDimensions({width:1200,height:1800},'ball-gown-01'));
 assert.doesNotThrow(()=>validateLookbookPhotoDimensions({width:520,height:900},'ball-gown-06'));
});

test('invalid or unreadable source images are still rejected', () => {
  for (const d of [{width:0,height:800},{width:250},{width:NaN,height:800},{width:-10,height:200}]) {
    assert.throws(() => validateLookbookPhotoDimensions(d,'ball-gown-06'),
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
  assert.equal(shouldReportLookbookPrintWarning(false,false),false);
  assert.equal(shouldReportLookbookPrintWarning(true,false),false);
  assert.equal(shouldReportLookbookPrintWarning(false,true),true);
  assert.equal(shouldReportLookbookPrintWarning(true,true),false);
});
