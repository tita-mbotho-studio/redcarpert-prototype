import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogueProducts} from '../src/data/catalogue.ts';
import {validateCatalogue} from '../src/lib/validate-catalogue.ts';
const clone = () => structuredClone(catalogueProducts);

test('twenty-seven dresses validate: eleven client Ball Gowns and sixteen Pexels samples', () => {
 const records=clone(), original=JSON.stringify(records);
 assert.doesNotThrow(()=>validateCatalogue(records));
 assert.equal(JSON.stringify(records),original);
 assert.equal(records.length,27);
 assert.equal(records.filter(p=>p.status==='client'&&p.category==='ball_gown').length,11);
 assert.equal(records.filter(p=>p.status==='sample').length,16);
 for(const category of ['mermaid','ruffled','modern_tradition','two_in_one'])
   assert.equal(records.filter(p=>p.category===category).length,4);
 assert(records.every(p=>Number.isSafeInteger(p.priceZar) && p.priceZar>0));
});

test('duplicate IDs, image URLs and routes fail before generation',()=>{
 const records=clone();
 assert.throws(()=>validateCatalogue(records.map((p,i)=>i===1?{...p,id:records[0].id}:p)),/Duplicate or invalid product ID/);
 assert.throws(()=>validateCatalogue(records.map((p,i)=>i===1?{...p,previewRoute:records[0].previewRoute}:p)),/Duplicate or invalid preview route/);
 assert.throws(()=>validateCatalogue(records.map((p,i)=>i===1?{...p,image:records[0].image}:p)),/Duplicate primary photograph/);
 assert.throws(()=>validateCatalogue(records.slice(0,7)),/eleven client Ball Gowns and sixteen sample dresses/);
});

test('Pexels samples reject bad hosts, missing attribution and status claims',()=>{
 const products=clone();
 for(const [change,message] of [
  [{status:'confirmed'},/Unverified catalogue status/],
  [{detailReference:'/product/real'},/Unverified catalogue status/],
  [{image:'https://example.com/bad.jpg'},/Unapproved Pexels image/],
  [{priceZar:-1},/Invalid catalogue price/],
  [{priceZar:3499.99},/Invalid catalogue price/],
  [{image:'https://images.pexels.com.evil.com/photos/1/pexels-photo-1.jpeg'},/Unapproved Pexels image/],
  [{image:'/redcarpert/../bad.webp'},/Unapproved Pexels image/],
  [{category:'other'},/Unapproved category/],
  [{name:''},/Missing descriptive bridal photograph alt text/],
  [{imageAlt:'missing'},/Missing descriptive bridal photograph alt text/],
  [{imageCredit:{...products[0].imageCredit,sourceUrl:'https://example.com'}},/Missing image provenance/],
 ]) assert.throws(()=>validateCatalogue(products.map((p,i)=>i===0?{...p,...change}:p)),message);
});

test('client Ball Gown mapping rejects wrong URLs, names and invented prices',()=>{
 const products=clone();
 const index=products.findIndex(p=>p.id==='ball-gown-01');
 assert(index>=0);
 for(const change of [
  {image:'https://example.com/bad.webp'},
  {image:'https://ik.imagekit.io/kw8awoqvwi/wrong/ball-gown-01-main.webp'},
  {priceZar:0},
  {name:'Sample 01'},
  {imageAlt:'Not a valid client photo'},
  {imageCredit:{...products[index].imageCredit,photographer:'Unknown'}},
 ]) assert.throws(()=>validateCatalogue(products.map((p,i)=>i===index?{...p,...change}:p)),
   /Incorrect client Ball Gown mapping|Invalid client photo metadata|Invalid catalogue price/);
});
