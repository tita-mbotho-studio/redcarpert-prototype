/** Shared, offline-testable ImageKit media plan for owner-authorized deployments.
 * The actual site still serves images from ImageKit; this plan merely verifies
 * and warms the same transformations without cropping or copying assets. */
const IMAGEKIT_PATH = '/kw8awoqvwi/red-carpet-wedding-dresses/';
const IMAGE_TYPES = /\.(?:webp|png|jpe?g|avif)$/i;

export function validateImageKitSource(source) {
  if (typeof source !== 'string' || /["'<>{}\\\r\n]/.test(source))
    throw new Error('Invalid client image URL');
  let url;
  try { url = new URL(source); }
  catch { throw new Error('Invalid client image URL: ' + source); }
  if (url.protocol !== 'https:' || url.hostname !== 'ik.imagekit.io' ||
      url.username || url.password || !url.pathname.startsWith(IMAGEKIT_PATH) ||
      !IMAGE_TYPES.test(url.pathname) || url.hash)
    throw new Error('Unapproved client image URL: ' + source);
  return url;
}

/** Every URL+transformation used in the current client manifests, once. */
export function buildImageCachePlan({
  catalogueProducts, photosForDress, homepageBackgrounds,
  team, weddingMomentEvents, mediaDeliveryUrl,
}) {
  const byUrl = new Map();
  const sources = new Set();
  const add = (source, preset, section) => {
    const original = validateImageKitSource(source);
    const delivered = mediaDeliveryUrl(source, preset);
    const transformed = validateImageKitSource(delivered);
    if (original.pathname !== transformed.pathname ||
        transformed.searchParams.get('tr')?.match(/^w-\d+,h-\d+,c-at_max,q-\d+,f-auto$/) === null ||
        !transformed.searchParams.has('tr') ||
        original.searchParams.get('updatedAt') !== transformed.searchParams.get('updatedAt')) {
      throw new Error('Unsafe image transformation: ' + source + ' (' + preset + ')');
    }
    sources.add(source);
    const existing = byUrl.get(delivered);
    if (existing) { existing.sections.add(section); return; }
    byUrl.set(delivered, {source, url:delivered, preset, sections:new Set([section])});
  };
  for (const product of catalogueProducts) {
    add(product.image, 'card', 'catalogue');
    add(product.image, 'lookbook', 'digital-lookbook');
    for (const photo of photosForDress(product)) add(photo.url, 'detail', 'dress-gallery');
  }
  for (const hero of homepageBackgrounds) add(hero.replacement, 'hero', 'homepage');
  for (const member of team) add(member.url, 'team', 'about-us');
  for (const event of weddingMomentEvents) for (const media of event.media) {
    if (media.type === 'photo') {
      add(media.url, 'tile', 'wedding-moments');
      add(media.url, 'preview', 'wedding-moments-modal');
    } else if (media.type === 'video') {
      // Warm the poster, not the large MP4 (native video stays on demand).
      add(media.poster, 'tile', 'wedding-moments-video-poster');
    } else throw new Error('Unknown wedding media type');
  }
  const unversioned = [...sources].filter(src=>!new URL(src).searchParams.has('updatedAt'));
  return {
    requests:[...byUrl.values()].map(item=>({...item,sections:[...item.sections]})),
    uniqueSources:sources.size, unversioned,
  };
}

async function downloadImage(url, {fetchImpl, timeoutMs, maxBytes}) {
  const response = await fetchImpl(url, {
    signal:AbortSignal.timeout(timeoutMs),headers:{accept:'image/avif,image/webp,image/*'},
  });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' for ' + url);
  if (!response.headers.get('content-type')?.toLowerCase().startsWith('image/'))
    throw new Error('Not an image response: ' + url);
  const length=Number(response.headers.get('content-length') || 0);
  if (length > maxBytes) throw new Error('Oversize image: ' + url);
  const data=await response.arrayBuffer();
  if (data.byteLength < 100 || data.byteLength > maxBytes)
    throw new Error('Empty or oversized image: ' + url);
  return data.byteLength;
}

/** Bounded warm-up: a failure of a derivative falls back once to its original.
 * A missing/broken original is a deployment blocker, never silently ignored. */
export async function warmImageCachePlan(plan, {
  fetchImpl=fetch, workers=4, timeoutMs=20000, maxBytes=12_000_000,
}={}) {
  if (!Number.isSafeInteger(workers) || workers < 1 || workers > 8)
    throw new Error('Expected 1-8 image warm-up workers');
  const results=new Array(plan.requests.length);
  const originalChecks=new Map();
  let cursor=0;
  async function checkOriginal(source) {
    if (!originalChecks.has(source))
      originalChecks.set(source, downloadImage(source,{fetchImpl,timeoutMs,maxBytes})
        .catch(error=>{originalChecks.delete(source);throw error;}));
    return originalChecks.get(source);
  }
  async function worker() {
    while (cursor < plan.requests.length) {
      const index=cursor++, item=plan.requests[index];
      let bytes=0, status='optimized';
      try {
        bytes=await downloadImage(item.url,{fetchImpl,timeoutMs,maxBytes});
      } catch (optimizedError) {
        try {
          bytes=await checkOriginal(item.source);
          status='original-fallback';
        } catch (originalError) {
          throw new Error('Cannot deploy: '+item.sections.join(',')+
            ' photo unavailable: '+item.source+'; optimized '+String(optimizedError)+
            '; original '+String(originalError));
        }
      }
      results[index]={...item,status,bytes};
    }
  }
  await Promise.all(Array.from({length:Math.min(workers,plan.requests.length)},()=>worker()));
  return {
    requests:results.length, optimized:results.filter(x=>x.status==='optimized').length,
    originalFallbacks:results.filter(x=>x.status==='original-fallback').length,
    downloadedBytes:results.reduce((n,x)=>n+x.bytes,0),
    results,
  };
}
