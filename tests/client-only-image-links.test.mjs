import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import imageLinks from '../src/data/image-links.json' with {type:'json'};
import { catalogueProducts } from '../src/data/catalogue.ts';
import { adaptEditorialDocument } from '../src/lib/editorial-pages.ts';
import { sitePages } from '../src/data/site.ts';
import mermaid from '../src/data/client-mermaid-dresses.json' with {type:'json'};
import ballGowns from '../src/data/client-ball-gowns.json' with {type:'json'};
import ruffled from '../src/data/client-ruffled-dresses.json' with {type:'json'};
import twoInOne from '../src/data/client-two-in-one-dresses.json' with {type:'json'};

const descendants=children=>children.flatMap(node=>typeof node==='string'?[]:[node,...descendants(node.children)]);

test('56 unique dress listings backed by 210 original client ImageKit photographs are actively published',()=>{
  assert.equal(catalogueProducts.length,56);
  assert.equal(new Set(catalogueProducts.map(p=>p.id)).size,56);
  assert(!Object.hasOwn(imageLinks,'products'),'retired sample URL lists must not be shipped');
  assert(catalogueProducts.every(p=>!Object.hasOwn(p,'status')&&!p.id.startsWith('sample-')));
  const groups=[mermaid,ballGowns,ruffled,twoInOne];
  const records=groups.flat();
  assert.equal(records.length,52);
  const urls=records.flatMap(record=>record.photos.map(p=>p.url));
  assert.equal(urls.length,210);
  assert.equal(new Set(urls).size,210);
  for(const record of records){
    const product=catalogueProducts.find(p=>p.id===record.id);
    assert(product);
    assert.equal(product.image,record.photos[0].url);
    assert.equal(product.imageCredit.provenance,'client-supplied');
  }
  for(const url of urls){
    const parsed=new URL(url);
    assert.equal(parsed.hostname,'ik.imagekit.io');
    assert(parsed.pathname.startsWith('/kw8awoqvwi/red-carpet-wedding-dresses/wedding-dresses/'));
    assert(parsed.pathname.endsWith('.webp'));
  }
});

test('About Us continues showing all six client ImageKit model portraits',()=>{
  const nodes=descendants(adaptEditorialDocument(sitePages['/about-us']).nodes);
  const cards=nodes.filter(node=>node.attrs.class==='redcarpert-editorial-team-card');
  assert.equal(cards.length,6);
  assert.deepEqual(cards.map(card=>descendants(card.children).find(n=>n.tag==='img')?.attrs.src),
    imageLinks.about_us.team.map(item=>item.url));
});

test('active catalogue and PDF assets contain no sample or Pexels URL branches',()=>{
  const paths=[
    'src/data/catalogue.ts','src/lib/validate-catalogue.ts','src/lib/dress-gallery.ts',
    'scripts/lib/lookbook-assets.ts','src/lib/product-detail-preview.ts',
    'src/lib/luxury-lookbook.ts','scripts/lib/markup.ts',
  ];
  for(const path of paths){
    const source=readFileSync(path,'utf8');
    assert.doesNotMatch(source,/images\.pexels\.com|www\.pexels\.com|sampleFittingMessage|sampleGalleryImages|data-sample-id|status\s*===\s*['"]sample['"]/i,path);
  }
});
