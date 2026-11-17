import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {catalogueProducts} from '../src/data/catalogue.ts';
import {createLuxuryLookbookHtml} from '../src/lib/luxury-lookbook.ts';
import {RENTAL_CONDITION_NOTE} from '../src/lib/pricing.ts';
import {createNodeRenderer} from '../scripts/lib/markup.ts';

const banned=/\b(?:inspiration|inspirational|illustrative|demonstration|provisional|not confirmed|stock photos?|example (?:sale |rental )?prices?|to be confirmed|sample (?:dress|photo|imagery))\b/i;
const visible=(html)=>html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
  .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi,' ')
  .replace(/<[^>]*>/g,' ')
  .replace(/\s+/g,' ');

test('interactive Bridal Edit shows full prices and no preview or temporary wording',()=>{
  const html=createNodeRenderer([])({tag:'div',attrs:{'data-lookbook-viewer':'true'},children:[]});
  assert.doesNotMatch(visible(html),banned);
  assert.equal((html.match(/data-book-sale-price=/g)||[]).length,27);
  assert.equal((html.match(/data-book-rental-price=/g)||[]).length,27);
  assert.equal(html.split(RENTAL_CONDITION_NOTE).length-1,27);
});

test('PDF source contains no development copy, fictional ownership claims or separate WhatsApp text',()=>{
  const images=catalogueProducts.map(p=>({id:p.id,jpeg:Buffer.from([0xff,0xd8,0xff,0xd9]),width:1200,height:1800}));
  const html=createLuxuryLookbookHtml(catalogueProducts,images,{year:2026,logo:Buffer.from([0x89,0x50,0x4e,0x47])});
  assert.equal((html.match(/<section class="page /g)||[]).length,39);
  assert.equal((html.match(/data-pdf-sale-price=/g)||[]).length,27);
  assert.equal((html.match(/data-pdf-rental-price=/g)||[]).length,27);
  assert.equal(html.split(RENTAL_CONDITION_NOTE).length-1,27);
  assert.doesNotMatch(visible(html),banned);
  assert.doesNotMatch(visible(html),/Photo on Pexels|client[- ]owned/i);
  assert.match(html,/Your Fitting Journey/);
});

test('published page text and metadata have no temporary catalogue notices',{skip:!existsSync('dist/index.html')},()=>{
  const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
  for(const route of routes){
    const html=readFileSync('dist'+(route==='/'?'':'/'+route.replace(/^\/+|\/+$/g,''))+'/index.html','utf8');
    const cleaned=visible(html);
    assert.doesNotMatch(cleaned,banned,route+' contains temporary public wording');
    const pageTitle=html.match(/<title>([^<]*)<\/title>/i)?.[1]||'';
    const description=html.match(/<meta[^>]+name="description"[^>]*content="([^"]*)"/i)?.[1]||'';
    assert.doesNotMatch(pageTitle+' '+description,banned,route+' has temporary SEO wording');
  }
});
