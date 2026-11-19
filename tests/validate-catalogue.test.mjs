import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogueProducts} from '../src/data/catalogue.ts';
import {validateCatalogue} from '../src/lib/validate-catalogue.ts';

const clone=()=>structuredClone(catalogueProducts);
const changeOne=(id,changes)=>clone().map(p=>p.id===id?{...p,...changes}:p);

test('only 47 client dresses are present in the approved source collections',()=>{
 const records=clone(),before=JSON.stringify(records);
 assert.doesNotThrow(()=>validateCatalogue(records));
 assert.equal(JSON.stringify(records),before,'validation must not mutate source records');
 assert.equal(records.length,47);
 assert.deepEqual(Object.fromEntries(['mermaid','ball_gown','ruffled','modern_tradition','two_in_one']
   .map(category=>[category,records.filter(p=>p.category===category).length])),
   {mermaid:2,ball_gown:12,ruffled:12,modern_tradition:0,two_in_one:21});
 assert.equal(records.filter(p=>p.collections.includes('modern_tradition')).length,8);
 assert(records.every(p=>p.image.startsWith('https://ik.imagekit.io/')&&!Object.hasOwn(p,'status')&&
   p.imageCredit.provenance==='client-supplied'));
 assert(records.every(p=>Number.isSafeInteger(p.priceZar)&&p.priceZar>0));
});

test('invalid client identity, source photo, category, prices and membership fail before generation',()=>{
 const records=clone(),id='ball-gown-01',first=records[0];
 assert.throws(()=>validateCatalogue(records.slice(0,7)),/Catalogue must contain 47 dresses/);
 assert.throws(()=>validateCatalogue(records.map((p,i)=>i===1?{...p,id:first.id}:p)),/Duplicate or invalid product ID/);
 assert.throws(()=>validateCatalogue(records.map((p,i)=>i===1?{...p,previewRoute:first.previewRoute}:p)),/Duplicate or invalid preview route/);
 assert.throws(()=>validateCatalogue(records.map((p,i)=>i===1?{...p,image:first.image}:p)),/Duplicate primary photograph/);
 for(const [change,expected] of [
   [{detailReference:'/product/other'},/Unverified catalogue status/],
   [{image:'https://images.pexels.com/photos/1/pexels-photo-1.jpeg'},/Invalid client photo metadata/],
   [{image:'https://ik.imagekit.io/kw8awoqvwi/wrong/photo.webp'},/Invalid client photo metadata/],
   [{imageAlt:'Incorrect client asset'},/Invalid client photo metadata/],
   [{imageCredit:{photographer:'Unknown',sourceUrl:first.image,provenance:'legacy'}},/Invalid client photo metadata/],
   [{name:'Unknown Dress'},/Incorrect client dress mapping/],
   [{category:'other'},/Unapproved category/],
   [{priceZar:-1},/Invalid catalogue price/],
   [{priceZar:3499.99},/Invalid catalogue price/],
   [{collections:['ball_gown','modern_tradition']},/Invalid multi-collection membership/],
 ]){
   assert.throws(()=>validateCatalogue(changeOne(id,change)),expected);
 }
});

test('Modern Tradition is always a client-only secondary colour collection',()=>{
 const records=clone();
 const featured=records.filter(p=>p.collections.includes('modern_tradition'));
 assert.equal(featured.length,8);
 assert(featured.every(p=>p.category!=='modern_tradition'&&p.collections.length===2));
 assert.throws(()=>validateCatalogue(changeOne('mermaid-lefa-dress',
   {collections:['mermaid','modern_tradition']})),/Invalid multi-collection membership/);
});
