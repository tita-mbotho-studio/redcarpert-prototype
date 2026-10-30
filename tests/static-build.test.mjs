import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import sharp from 'sharp';
const walk = dir => readdirSync(dir,{withFileTypes:true}).flatMap(file=>file.isDirectory()?walk(path.join(dir,file.name)):[path.join(dir,file.name)]);
const available = existsSync('dist/index.html');
test('static deployment contains complete approved pages, local paths and no application server', {skip:!available},()=>{
 const files=walk('dist'), htmlFiles=files.filter(f=>f.endsWith('.html'));
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 assert.equal(routes.length,16);
 assert.equal(htmlFiles.length,routes.length+1);
 for(const route of routes){
  const html=readFileSync(path.join('dist',route,'index.html'),'utf8');
  assert.match(html,/<!doctype html>/i);assert.match(html,/<header id="header"/);assert.match(html,/<footer/);assert.match(html,/WhatsApp Enquiry Preview/);
  assert.doesNotMatch(html,/__NEXT_DATA__|self\.__next|\/_next\/|data-settings=/);
  for(const [,url] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)){
   assert(url.startsWith('/redcarpert-prototype/'),url);
   const local=path.join('dist',url.slice('/redcarpert-prototype/'.length));
   assert(existsSync(local)||existsSync(path.join(local,'index.html')),url);
  }
  assert.doesNotMatch(html,/(?:href|action)="(?:https?:\/\/(?:wa\.me|[^/]*whatsapp\.)|whatsapp:)/i);
 }
 assert(!files.some(f=>f.includes('/api/')||f.includes('_next')||f.includes('documents/')));
 assert(!existsSync('dist/product/arabella/index.html'));
 const lock=JSON.parse(readFileSync('package-lock.json','utf8'));
 for(const name of ['next','react','react-dom'])assert(!lock.packages['node_modules/'+name]);
 assert.match(readFileSync('dist/404.html','utf8'),/Page not found/);
 const pdf=readFileSync('dist/digital-lookbook/Redcarpert-Sample-Lookbook.pdf');assert.equal(pdf.subarray(0,8).toString(),'%PDF-1.4');assert.match(pdf.toString('latin1'),/\/Count 2/);
});
test('copied classic scripts remain valid JavaScript and the footer SVG decodes',{skip:!available},async()=>{
 for(const file of walk('dist/site-assets').filter(f=>f.endsWith('.js')))new vm.Script(readFileSync(file,'utf8'),{filename:file});
 const image=await sharp('dist/redcarpert/instagram.svg').png().toBuffer();assert(image.length>100);
});
\ntest('ten-page interactive book and eight shared Pexels products are published without local copies',{skip:!available},()=>{
 const book=readFileSync('dist/digital-lookbook/index.html','utf8');
 assert.equal((book.match(/data-book-page=/g)||[]).length,10);
 assert.equal((book.match(/class="redcarpert-book-logo"/g)||[]).length,2);
 assert.match(book,/data-book-next/); assert.match(book,/data-book-previous/);
 const gallery=readFileSync('dist/product/index.html','utf8');
 assert.equal((gallery.match(/data-catalogue-id=/g)||[]).length,8);
 for(const [category,count] of [['mermaid',4],['ball_gown',4]]) {
  const html=readFileSync('dist/product-category/'+category+'/index.html','utf8');
  assert.equal((html.match(/data-catalogue-id=/g)||[]).length,count);
 }
 const routes=JSON.parse(readFileSync('.generated/routes.json','utf8'));
 assert.equal(routes.filter(p=>p.startsWith('/product/preview/')).length,8);
 assert.equal((book.match(/https:\/\/images\.pexels\.com\/photos\//g)||[]).length,9);
 for(const route of routes.filter(p=>p.startsWith('/product/preview/'))) {
  const html=readFileSync('dist'+route+'/index.html','utf8');
  assert.match(html,/https:\/\/images\.pexels\.com\/photos\//);
  assert.match(html,/not confirmed Redcarpert inventory/i);
 }
});
