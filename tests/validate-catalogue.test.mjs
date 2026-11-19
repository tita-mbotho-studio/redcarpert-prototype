import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogueProducts} from '../src/data/catalogue.ts';
import {validateCatalogue} from '../src/lib/validate-catalogue.ts';

const clone=()=>structuredClone(catalogueProducts);
const changeOne=(id,changes)=>clone().map(p=>p.id===id?{...p,...changes}:p);

test('56 uniquely identified dresses occupy the five approved collections',()=>{
 const records=clone(),before=JSON.stringify(records);
 assert.doesNotThrow(()=>validateCatalogue(records));
 assert.equal(JSON.stringify(records),before,'validation must not mutate source records');
 assert.equal(records.length,56);
 assert.deepEqual(Object.fromEntries(['mermaid','ball_gown','ruffled','modern_tradition','two_in_one']
   .map(category=>[category,records.filter(p=>p.category===category).length])),
   {mermaid:2,ball_gown:12,ruffled:17,modern_tradition:4,two_in_one:21});
 assert.equal(records.filter(p=>p.collections.includes('modern_tradition')).length,4);
 assert(records.every(p=>p.image.startsWith('https://ik.imagekit.io/')&&!Object.hasOwn(p,'status')&&
   p.imageCredit.provenance==='client-supplied'));
 assert(records.every(p=>Number.isSafeInteger(p.priceZar)&&p.priceZar>0));
});

test('invalid client identity, source photo, category, prices and membership fail before generation',()=>{
 const records=clone(),id='ball-gown-01',first=records[0];
 assert.throws(()=>validateCatalogue(records.slice(0,7)),/Catalogue must contain 56 dresses/);
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

test('Modern Tradition has four primary catalogue identities backed by verified client photos',()=>{
 const records=clone();
 const featured=records.filter(p=>p.collections.includes('modern_tradition'));
 assert.equal(featured.length,4);
 assert(featured.every(p=>p.category==='modern_tradition'&&p.collections.length===1&&
   typeof p.sourceDressId==='string'&&p.sourceDressId.length>0));
 assert.equal(new Set(featured.map(p=>p.id)).size,4);
 assert.equal(new Set(records.map(p=>p.id)).size,56);
 assert.throws(()=>validateCatalogue(changeOne('modern-tradition-01',
   {sourceDressId:'ball-gown-10'})),/Incorrect Modern Tradition source mapping/);
 assert.throws(()=>validateCatalogue(changeOne('mermaid-lefa-dress',
   {collections:['mermaid','modern_tradition']})),/Invalid multi-collection membership/);
});
