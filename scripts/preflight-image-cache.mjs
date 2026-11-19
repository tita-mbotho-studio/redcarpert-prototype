import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {catalogueProducts} from '../src/data/catalogue.ts';
import {photosForDress} from '../src/lib/dress-gallery.ts';
import {homepageBackgrounds} from '../src/lib/homepage-backgrounds.ts';
import {weddingMomentEvents} from '../src/lib/wedding-moments.ts';
import {mediaDeliveryUrl} from '../src/lib/media-delivery.ts';
import imageLinks from '../src/data/image-links.json' with {type:'json'};
import {buildImageCachePlan,warmImageCachePlan} from './lib/image-cache-preflight.mjs';

// Manual-deploy preflight: npm run media:audit is network-free; the pipeline's
// npm run media:prepare validates and warms exactly the referenced CDN variants.
const args=new Set(process.argv.slice(2));
if (![...args].every(arg=>['--audit-only','--warm'].includes(arg)) ||
    (args.has('--audit-only') && args.has('--warm')))
  throw new Error('Use --audit-only or --warm');
const plan=buildImageCachePlan({
  catalogueProducts,photosForDress,homepageBackgrounds,
  team:imageLinks.about_us.team,weddingMomentEvents,mediaDeliveryUrl,
});
const fingerprint=createHash('sha256')
  .update(plan.requests.map(item=>item.url).sort().join('\n')).digest('hex');
const report={
  fingerprint,
  uniqueClientImageSources:plan.uniqueSources,
  optimizedVariants:plan.requests.length,
  unversionedSources:plan.unversioned.length,
  unversionedExamples:plan.unversioned.slice(0,5),
  mode:args.has('--warm')?'warm':'audit-only',
};
console.log('[ImageKit] '+report.uniqueClientImageSources+
  ' unique source images, '+report.optimizedVariants+
  ' responsive derivatives, '+report.unversionedSources+' unversioned source URLs.');
if (report.unversionedSources>0)
  console.warn('[ImageKit] Replacing image content at an unchanged URL can leave CDN/browser caches stale. '+
    'When a client image changes, update its manifest URL with ImageKit updatedAt.');
if (args.has('--warm')) {
  const warm=await warmImageCachePlan(plan);
  Object.assign(report,{
    warmedVariants:warm.optimized,
    originalFallbacks:warm.originalFallbacks,
    downloadedBytes:warm.downloadedBytes,
  });
  if (warm.originalFallbacks>0)
    console.warn('[ImageKit] '+warm.originalFallbacks+
      ' transformations fell back to client originals; check CDN delivery.');
  console.log('[ImageKit] Warmed '+warm.optimized+' variants and verified '+
    warm.originalFallbacks+' original fallbacks ('+
    Math.round(warm.downloadedBytes/1048576)+' MiB transferred).');
}
await mkdir('.cache/redcarpert-image-preflight',{recursive:true});
await writeFile('.cache/redcarpert-image-preflight/report.json',JSON.stringify(report,null,2)+'\n');
console.log('[ImageKit] Audit fingerprint: '+fingerprint.slice(0,16));
