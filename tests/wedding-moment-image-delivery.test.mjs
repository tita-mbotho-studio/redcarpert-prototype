import test from 'node:test';
import assert from 'node:assert/strict';
import { weddingMomentDeliveryImage } from '../src/lib/wedding-moment-image-delivery.ts';
import {
  flattenWeddingMomentEvents, renderWeddingMomentGallery, weddingMomentEvents,
} from '../src/lib/wedding-moments.ts';

const all = nodes => nodes.flatMap(node => typeof node === 'string' ? [] : [node, ...all(node.children)]);
const photo = 'https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-moments/wedding-moments-56.jpg';
const videoPoster = 'https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-moments/wedding-moments-88.mp4/ik-thumbnail.jpg';

test('ImageKit tile transformations preserve entire image and source URLs', () => {
  const thumbnail = weddingMomentDeliveryImage(photo, 'tile');
  const preview = weddingMomentDeliveryImage(photo, 'preview');
  assert.equal(thumbnail, photo + '?tr=w-640,h-640,c-at_max,q-72,f-auto');
  assert.equal(preview, photo + '?tr=w-1920,h-1920,c-at_max,q-82,f-auto');
  assert.equal(weddingMomentDeliveryImage(videoPoster,'tile'),
    videoPoster + '?tr=w-640,h-640,c-at_max,q-72,f-auto');
  assert.equal(weddingMomentDeliveryImage(photo + '?updatedAt=42','tile'),
    photo + '?updatedAt=42&tr=w-640,h-640,c-at_max,q-72,f-auto');
  assert.equal(weddingMomentDeliveryImage(photo + '?tr=w-100','tile'),
    photo + '?tr=w-100');
  assert.equal(weddingMomentDeliveryImage(photo + '?v=2#details','tile'),
    photo + '?v=2&tr=w-640,h-640,c-at_max,q-72,f-auto#details');
  assert.equal(weddingMomentDeliveryImage('https://another-cdn.example/photo.jpg','tile'),
    'https://another-cdn.example/photo.jpg');
});

test('only first 16 wedding media cards load initially; thumbnails are not originals', () => {
  const nodes = all(renderWeddingMomentGallery(flattenWeddingMomentEvents(weddingMomentEvents)));
  const grid = nodes.find(n => Object.hasOwn(n.attrs,'data-wedding-moments-grid'));
  const template = nodes.find(n => n.tag==='template');
  assert.equal(grid.children.length,16);
  assert.equal(template.children.length,flattenWeddingMomentEvents(weddingMomentEvents).length-16);
  const visible = all(grid.children);
  const buttons = visible.filter(n => Object.hasOwn(n.attrs,'data-wedding-media'));
  const images = visible.filter(n => n.tag==='img');
  assert.equal(buttons.length,16);
  assert.equal(images.length,16);
  for (const image of images) {
    const original=image.attrs['data-wedding-original-thumbnail'];
    assert(original?.startsWith('https://ik.imagekit.io/'));
    assert.equal(image.attrs.src,weddingMomentDeliveryImage(original,'tile'));
    assert.equal(image.attrs.decoding,'async');
  }
  assert.equal(images.filter(n=>n.attrs.loading==='eager').length,4);
  assert.equal(images.filter(n=>n.attrs.loading==='lazy').length,12);
  assert.equal(images[0].attrs.fetchpriority,'high');
  for (const button of buttons) {
    const original=button.attrs['data-wedding-src'];
    assert(!original.includes('?tr='),'source URL remains the original client media');
    if(button.attrs['data-wedding-media']==='photo') {
      assert.equal(button.attrs['data-wedding-preview-src'],weddingMomentDeliveryImage(original,'preview'));
    } else {
      assert.equal(button.attrs['data-wedding-preview-src'],undefined);
    }
  }
  const player=nodes.find(n=>n.tag==='video');
  assert.equal(player.attrs.src,undefined);
  assert.equal(player.attrs.preload,'none');
});
