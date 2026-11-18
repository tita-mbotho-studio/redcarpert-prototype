import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import imageLinks from '../src/data/image-links.json' with {type:'json'};
import {catalogueProducts} from '../src/data/catalogue.ts';
import {homepageBackgrounds} from '../src/lib/homepage-backgrounds.ts';
import {photosForDress} from '../src/lib/dress-gallery.ts';
import {weddingMomentEvents} from '../src/lib/wedding-moments.ts';
import {mediaDeliveryUrl,mediaImageAttrs,mediaVideoAttrs} from '../src/lib/media-delivery.ts';

const safeImage = (source,preset) => {
  const original=new URL(source),target=new URL(mediaDeliveryUrl(source,preset));
  assert.equal(original.protocol,'https:');
  assert(['ik.imagekit.io','images.pexels.com'].includes(original.hostname),
    'unexpected remote image host: '+original.hostname);
  assert.equal(target.hostname,original.hostname);
  assert.equal(target.pathname,original.pathname,'optimization must preserve the source asset');
  if(original.hostname==='ik.imagekit.io'){
    assert(target.searchParams.has('tr'),'ImageKit transform missing for '+source);
    assert.match(target.searchParams.get('tr'),/^w-\d+,h-\d+,c-at_max,q-\d+,f-auto$/);
  }else{
    assert.equal(target.searchParams.get('auto'),'compress');
    assert.equal(target.searchParams.get('cs'),'tinysrgb');
    assert(Number(target.searchParams.get('w'))>0);
  }
  return target.toString();
};

test('all three homepage backgrounds use the shared optimized hero delivery and original fallbacks',()=>{
  assert.equal(homepageBackgrounds.length,3);
  for(const hero of homepageBackgrounds){
    assert.equal(hero.delivery,safeImage(hero.replacement,'hero'));
    assert.equal(hero.original.startsWith('/site-assets/'),true);
  }
});

test('all catalogue and individual gallery photographs use approved image presets',()=>{
  assert.equal(catalogueProducts.length,35);
  let count=0;
  for(const product of catalogueProducts){
    for(const preset of ['card','detail','lookbook','preview'])safeImage(product.image,preset);
    const card=mediaImageAttrs({src:product.image,class:'redcarpert-catalogue',loading:'lazy'});
    assert.equal(card.src,mediaDeliveryUrl(product.image,'card'));
    if(card.src!==product.image)assert.equal(card['data-media-original'],product.image);
    const gallery=photosForDress(product);
    for(const image of gallery){
      safeImage(image.url,'detail');
      const attrs=mediaImageAttrs({src:image.url,'data-gallery-active-image':'',fetchpriority:'high'});
      assert.equal(attrs.src,mediaDeliveryUrl(image.url,'detail'));
      assert.equal(attrs.loading,'eager');
      count++;
    }
  }
  assert(count>=35,'every dress requires at least one approved gallery image');
});

test('all six About Us model portraits have the team preset and fallback metadata',()=>{
  assert.equal(imageLinks.about_us.team.length,6);
  for(const model of imageLinks.about_us.team){
    const optimized=safeImage(model.url,'team');
    const attrs=mediaImageAttrs({src:model.url,alt:'Portrait of '+model.name,loading:'lazy'});
    assert.equal(attrs.src,optimized);
    assert.equal(attrs['data-media-original'],model.url);
    assert.equal(attrs.loading,'lazy');
    assert.equal(attrs.decoding,'async');
    assert(model.width>0&&model.height>0);
  }
});

test('Wedding Moments thumbnails and video posters share image optimization, never transcode the video URL',()=>{
  const media=weddingMomentEvents.flatMap(event=>event.media);
  assert(media.length>=80,'do not silently drop wedding media during updates');
  let videoCount=0;
  for(const item of media){
    if(item.type==='photo'){
      safeImage(item.url,'tile');
      safeImage(item.url,'preview');
    }else{
      videoCount++;
      const poster=safeImage(item.poster,'tile');
      const attrs=mediaVideoAttrs({src:item.url,poster:item.poster});
      assert.equal(attrs.src,item.url,'videos must not be transformed as images');
      assert.equal(attrs.preload,'none','videos must not download ahead of user interaction');
      assert.equal(attrs.poster,poster);
      assert.equal(attrs['data-media-poster-original'],item.poster);
    }
  }
  assert(videoCount>=1);
});

test('optimized-image fallback remains central, rather than hardcoded per page',()=>{
  const files=[
    'src/client/MediaDelivery.js','src/client/dress-gallery.js',
    'src/lib/wedding-moment-image-delivery.ts','src/lib/homepage-backgrounds.ts',
    'scripts/lib/markup.ts',
  ];
  assert(readFileSync('src/client/MediaDelivery.js','utf8').includes('restoreImage'));
  for(const file of files){
    const source=readFileSync(file,'utf8');
    assert(!/w-\d+,h-\d+,c-at_max/.test(source),file+' hardcodes a duplicate CDN transform');
  }
  const pipeline=readFileSync('scripts/lib/lookbook-assets.ts','utf8');
  assert(pipeline.includes('withoutEnlargement:true'),'PDF images must never be upscaled');
  assert(pipeline.includes('mozjpeg:true'),'PDF JPGs must use compression');
  assert(pipeline.includes('estimateLookbookPrintDpi'),'PDF print quality must be audited');
});
