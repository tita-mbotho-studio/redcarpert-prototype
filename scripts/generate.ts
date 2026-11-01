import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { sitePages } from '../src/data/site';
import { catalogueProducts } from '../src/data/catalogue';
import { publicStaticRoutes } from '../src/lib/public-routes';
import { createSampleLookbookPdf } from '../src/lib/lookbook-pdf';
import { sampleFittingMessage } from '../src/lib/product-detail-preview';
import { siteMetadata } from '../src/data/metadata';
import { REPOSITORY_BASE } from '../src/config/site';
import { validateCatalogue } from '../src/lib/validate-catalogue';
import { escapeHtml, createNodeRenderer } from './lib/markup';
import { assets, track, prefix, copyTrackedAssets } from './lib/assets';
import { preparePage } from './lib/prepare-page';
const base = REPOSITORY_BASE;
const root = '.generated';
// Validate all catalogue records and public routes before clearing prior generated files.
validateCatalogue(catalogueProducts);
const routes = ['/',...publicStaticRoutes(sitePages,catalogueProducts.map(p=>p.previewRoute))];
await rm(root, {recursive:true,force:true});
await mkdir(root,{recursive:true});
const cssFiles = ['src/styles/globals.css',...['FooterBranding','CatalogueListing','ProductDetailPreview','EditorialPages'].map(n=>'src/components/'+n+'.css'),'src/client/enquiry.css','src/components/CatalogueFilter.css','src/components/BridesGallery.css'];
const extraCss = (await Promise.all(cssFiles.map(f=>readFile(f,'utf8')))).join('\n')+'\nhtml:has(footer[data-homepage-footer]),body:has(footer[data-homepage-footer]){scrollbar-width:none}html:has(footer[data-homepage-footer])::-webkit-scrollbar,body:has(footer[data-homepage-footer])::-webkit-scrollbar{display:none}';

const render = createNodeRenderer(routes);
for(const route of routes) {
 const {document,product} = preparePage(route);
 const message = product ? sampleFittingMessage(product) : 'Hello Redcarpert Wedding Dresses!\n\nI would like to enquire about your wedding dresses and arrange a fitting.\n\nCould you please provide more information?\n\nThank you.';
 const modal = `<dialog id="enquiry-preview" class="dialog" aria-labelledby="enquiry-title" aria-describedby="enquiry-notice"><p class="demo">Demonstration</p><h2 id="enquiry-title" class="title">WhatsApp Enquiry Preview</h2><p id="enquiry-notice" class="notice">Preview only — WhatsApp Business number not yet confirmed. No message will be sent.</p><p class="message">${escapeHtml(message)}</p><div class="actions"><button type="button" data-copy>Copy Message</button><button type="button" data-close>Close</button></div><p class="status" role="status"></p></dialog>`;
 const runtime = {bodyClass:document.bodyClass,htmlClass:document.htmlClass,scripts:document.scripts,themeConfig:document.themeConfig,postScripts:document.postScripts};
 let html = `<!doctype html><html lang="en-US" class="${escapeHtml(document.htmlClass)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(document.title||siteMetadata.title)}</title><meta name="description" content="${escapeHtml(document.description||siteMetadata.description)}"><link rel="icon" href="/seo/cropped-logo-2-1-32x32.png"><link rel="apple-touch-icon" href="/seo/cropped-logo-2-1-180x180.png">${document.styles.map(s=>s.href?`<link rel="stylesheet" href="${escapeHtml(s.href)}"${s.media?` media="${escapeHtml(s.media)}"`:''}>`:`<style>${s.css??''}</style>`).join('')}<style>${extraCss}</style></head><body class="${escapeHtml(document.bodyClass)}">${document.nodes.map(render).join('')}${modal}<script id="page-runtime" type="application/json">${JSON.stringify(runtime).replace(/</g,'\\u003c')}</script><script type="module" src="/src/client/main.js"></script></body></html>`;
 html = html.replaceAll('/digital-lookbook/pdf/','/digital-lookbook/Redcarpert-Sample-Lookbook.pdf');
 track(html); html = prefix(html).replace(base+'src/client/main.js','/src/client/main.js');
 const dir = path.join(root,route); await mkdir(dir,{recursive:true}); await writeFile(path.join(dir,'index.html'),html);
}
track(await readFile('src/client/lookbook.js','utf8'));
await copyTrackedAssets(root);
const photos = await Promise.all([
 {src:'sample-01-mermaid-pexels.webp',category:'Mermaid' as const,sample:'Sample 01',photographer:'Tran Long'},
 {src:'sample-02-ball-gown-pexels.webp',category:'Ball Gown' as const,sample:'Sample 02',photographer:'Thalia villa'},
].map(async item=>{const {data,info}=await sharp('public/redcarpert/gallery/'+item.src).removeAlpha().jpeg({quality:90,progressive:false}).toBuffer({resolveWithObject:true});return {...item,jpeg:data,width:info.width,height:info.height};}));
await mkdir(root+'/static/digital-lookbook',{recursive:true});
await writeFile(root+'/static/digital-lookbook/Redcarpert-Sample-Lookbook.pdf',createSampleLookbookPdf(photos));
await writeFile(root+'/404.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found | Redcarpert</title></head><body><main><h1>Page not found</h1><p>This page is unavailable.</p><a href="${base}">Return to Redcarpert Wedding Dresses</a></main></body></html>`);
await writeFile(root+'/routes.json',JSON.stringify(routes));
console.log(`Generated ${routes.length} approved pages and ${assets.size} reachable assets.`);
