
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { sitePages } from '../src/data/site';
import { catalogueProducts } from '../src/data/catalogue';
import { contentAdaptations } from '../src/data/content-adaptations';
import { adaptSiteDocument } from '../src/lib/content-adapter';
import { adaptHomepageBackgrounds } from '../src/lib/homepage-backgrounds';
import { adaptFooterSocials } from '../src/lib/footer-social-adapter';
import { adaptLogo } from '../src/lib/logo-adapter';
import { adaptNavigation } from '../src/lib/navigation-adapter';
import { addHomepageFooter } from '../src/lib/homepage-footer';
import { adaptFooterBranding } from '../src/lib/footer-branding-adapter';
import { correctFooterLinks } from '../src/lib/footer-link-corrections';
import { adaptCatalogue } from '../src/lib/catalogue-adapter';
import { adaptEditorialDocument } from '../src/lib/editorial-pages';
import { createProductDetailPreview, sampleFittingMessage } from '../src/lib/product-detail-preview';
import { publicStaticRoutes } from '../src/lib/public-routes';
import { createSampleLookbookPdf } from '../src/lib/lookbook-pdf';
import { siteMetadata } from '../src/data/metadata';
import type { DocumentNode } from '../src/types/site';
const base = '/redcarpert-prototype/';
const root = '.generated';
await rm(root, {recursive:true,force:true});
await mkdir(root,{recursive:true});
const escape = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
// Rewrite known local URL namespaces only: a slash in JavaScript or SVG is not a path.
const prefix = (s: string) => s
 .replace(/((?:href|action)=["'])\/(?=["'])/g, '$1'+base)
 .replace(/\/(?=(?:site-assets|redcarpert|seo|images|product(?:-category)?|digital-lookbook|our-brides|about-us|contact-us)(?:\/|["'?#]))/g,base);

const assets = new Set<string>();
function track(text: string) {
  for (const match of text.matchAll(/\/(?:site-assets|redcarpert|seo|images)\/[^\s"'<>),;&\\]+/g)) { const asset = match[0].split(/[?#]/)[0]; if (existsSync('public'+asset)) assets.add(asset); }
}
function lookbook() {
 return `<section class="redcarpert-lookbook" aria-label="Digital bridal lookbook"><div class="redcarpert-lookbook-frame"><div class="redcarpert-lookbook-image"><img src="/redcarpert/gallery/sample-01-mermaid-pexels.webp" alt="Stock bridal image of a fitted gown, not confirmed Redcarpert inventory" width="1696" height="2528"></div><div class="redcarpert-lookbook-copy"><p class="redcarpert-lookbook-eyebrow">REDCARPERT WEDDING DRESSES</p><h3>Mermaid</h3><p data-sample>Sample 01 — demonstration photograph</p><p class="redcarpert-lookbook-note">Not confirmed Redcarpert inventory. Actual dresses and photography will follow client approval.</p><a data-detail href="/product/preview/sample-01-mermaid/">View sample dress details</a><div class="redcarpert-lookbook-controls" aria-label="Lookbook page controls"><button type="button" data-previous disabled aria-label="Previous dress">Previous</button><span aria-live="polite">Page 1 of 2</span><button type="button" data-next aria-label="Next dress">Next</button></div></div></div><div class="redcarpert-lookbook-download"><a class="button" href="/digital-lookbook/Redcarpert-Sample-Lookbook.pdf" download="Redcarpert-Sample-Lookbook.pdf">Download sample lookbook (PDF)</a></div></section>`;
}
const voids = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
function render(node: DocumentNode): string {
 if(typeof node === 'string') return escape(node);
 if(['script','noscript'].includes(node.tag)) return '';
 if(node.attrs['data-lookbook-viewer'] === 'true') return lookbook();
 const attrs = {...node.attrs};
 if (attrs.href && routes.includes(attrs.href) && attrs.href !== '/') attrs.href += '/';
 if(attrs.class?.split(/\s+/).includes('ht_ctc_chat_data')) delete attrs['data-settings'];
 if(attrs.href && /^(?:https?:\/\/(?:wa\.me|[^/]*whatsapp\.(?:com|net))|whatsapp:|intent:)/i.test(attrs.href)) {
  delete attrs.href; delete attrs.target; Object.assign(attrs,{'data-whatsapp-preview':'',role:'button',tabindex:'0','aria-haspopup':'dialog'});
 }
 const a = Object.entries(attrs).filter(([k,v])=>!/^on/i.test(k) && !(k==='src'&&!v)).map(([k,v])=>` ${k}="${escape(v)}"`).join('');
 return `<${node.tag}${a}>`+(voids.has(node.tag)?'':node.children.map(render).join('')+`</${node.tag}>`);
}
const cssFiles = ['src/styles/globals.css',...['FooterBranding','CatalogueListing','ProductDetailPreview','EditorialPages'].map(n=>'src/components/'+n+'.css'),'src/client/enquiry.css'];
const extraCss = (await Promise.all(cssFiles.map(f=>readFile(f,'utf8')))).join('\n')+'\nhtml:has(footer[data-homepage-footer]),body:has(footer[data-homepage-footer]){scrollbar-width:none}html:has(footer[data-homepage-footer])::-webkit-scrollbar,body:has(footer[data-homepage-footer])::-webkit-scrollbar{display:none}';
const routes = ['/',...publicStaticRoutes(sitePages,catalogueProducts.map(p=>p.previewRoute))];
for(const route of routes) {
 const product = catalogueProducts.find(p=>p.previewRoute===route);
 let original = product ? createProductDetailPreview(sitePages['/product/arabella'],product) : route === '/digital-lookbook' ? {...sitePages['/about-us'],route,title:'Digital Lookbook | Redcarpert Wedding Dresses',description:'Interactive sample bridal lookbook for Mermaid and Ball Gown dresses, with a downloadable PDF.'} : sitePages[route];
 if(route === '/') original = {...original, title:siteMetadata.title, description:siteMetadata.description};
 if(['/about-us','/contact-us','/our-brides'].includes(route)) original = {...original,title:route==='/about-us'?'About Us | Redcarpert Wedding Dresses':route==='/contact-us'?'Contact Us | Redcarpert Wedding Dresses':'Our Brides | Redcarpert Wedding Dresses',description:route==='/about-us'?"Learn about Redcarpert's bridal collections and fitting enquiries.":route==='/contact-us'?'Contact and fitting enquiry information for the Redcarpert prototype.':'Bridal inspiration gallery using clearly labelled sample photography.'};
 const document = adaptEditorialDocument(adaptFooterBranding(correctFooterLinks(adaptLogo(adaptNavigation(addHomepageFooter(adaptHomepageBackgrounds(adaptSiteDocument(adaptCatalogue(adaptFooterSocials(original),catalogueProducts),contentAdaptations)),sitePages['/about-us']))))));
 const message = product ? sampleFittingMessage(product) : 'Hello Redcarpert Wedding Dresses!\n\nI would like to enquire about your wedding dresses and arrange a fitting.\n\nCould you please provide more information?\n\nThank you.';
 const modal = `<dialog id="enquiry-preview" class="dialog" aria-labelledby="enquiry-title" aria-describedby="enquiry-notice"><p class="demo">Demonstration</p><h2 id="enquiry-title" class="title">WhatsApp Enquiry Preview</h2><p id="enquiry-notice" class="notice">Preview only — WhatsApp Business number not yet confirmed. No message will be sent.</p><p class="message">${escape(message)}</p><div class="actions"><button type="button" data-copy>Copy Message</button><button type="button" data-close>Close</button></div><p class="status" role="status"></p></dialog>`;
 const runtime = {bodyClass:document.bodyClass,htmlClass:document.htmlClass,scripts:document.scripts,themeConfig:document.themeConfig,postScripts:document.postScripts};
 let html = `<!doctype html><html lang="en-US" class="${escape(document.htmlClass)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(document.title||siteMetadata.title)}</title><meta name="description" content="${escape(document.description||siteMetadata.description)}"><link rel="icon" href="/seo/cropped-logo-2-1-32x32.png"><link rel="apple-touch-icon" href="/seo/cropped-logo-2-1-180x180.png">${document.styles.map(s=>s.href?`<link rel="stylesheet" href="${escape(s.href)}"${s.media?` media="${escape(s.media)}"`:''}>`:`<style>${s.css??''}</style>`).join('')}<style>${extraCss}</style></head><body class="${escape(document.bodyClass)}">${document.nodes.map(render).join('')}${modal}<script id="page-runtime" type="application/json">${JSON.stringify(runtime).replace(/</g,'\\u003c')}</script><script type="module" src="/src/client/main.js"></script></body></html>`;
 html = html.replaceAll('/digital-lookbook/pdf/','/digital-lookbook/Redcarpert-Sample-Lookbook.pdf');
 track(html); html = prefix(html).replace(base+'src/client/main.js','/src/client/main.js');
 const dir = path.join(root,route); await mkdir(dir,{recursive:true}); await writeFile(path.join(dir,'index.html'),html);
}
// Follow only referenced local assets, including transitive CSS URLs and script paths.
track(await readFile('src/client/lookbook.js','utf8'));
for(const asset of assets) {
 let bytes;
 try {bytes = await readFile('public'+asset);} catch {throw new Error('Missing required asset: '+asset);}
 if(/\.(css|js|svg)$/.test(asset)) {
  let text = bytes.toString();
  if(asset.endsWith('.css')) text = text.replace(/url\(\s*["']?([^"')]+)["']?\s*\)/g, (full,url) => {
   if(/^(?:data:|https?:|\/\/|#)/.test(url)) return full;
   const resolved=path.posix.resolve(path.posix.dirname(asset),url).split(/[?#]/)[0];
   return existsSync('public'+resolved) ? full : 'none';
  });
  // Captured WordPress endpoints have no role in this static prototype.
  text = text.replace(/PEXETO\.ajaxurl="[^"]*";/g,'');
  for(const match of (asset.endsWith('.css') ? text : '').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
   const url=match[1]; if(!/^(?:data:|https?:|\/\/|#)/.test(url)) { const resolved=path.posix.resolve(path.posix.dirname(asset),url).split(/[?#]/)[0]; assets.add(resolved); }
  }
  track(text); bytes=Buffer.from(prefix(text));
 }
 const target = path.join(root,'static',asset); await mkdir(path.dirname(target),{recursive:true}); await writeFile(target,bytes);
}
const photos = await Promise.all([
 {src:'sample-01-mermaid-pexels.webp',category:'Mermaid' as const,sample:'Sample 01',photographer:'Tran Long'},
 {src:'sample-02-ball-gown-pexels.webp',category:'Ball Gown' as const,sample:'Sample 02',photographer:'Thalia villa'},
].map(async item=>{const {data,info}=await sharp('public/redcarpert/gallery/'+item.src).removeAlpha().jpeg({quality:90,progressive:false}).toBuffer({resolveWithObject:true});return {...item,jpeg:data,width:info.width,height:info.height};}));
await mkdir(root+'/static/digital-lookbook',{recursive:true});
await writeFile(root+'/static/digital-lookbook/Redcarpert-Sample-Lookbook.pdf',createSampleLookbookPdf(photos));
await writeFile(root+'/404.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found | Redcarpert</title></head><body><main><h1>Page not found</h1><p>This page is unavailable.</p><a href="${base}">Return to Redcarpert Wedding Dresses</a></main></body></html>`);
await writeFile(root+'/routes.json',JSON.stringify(routes));
console.log(`Generated ${routes.length} approved pages and ${assets.size} reachable assets.`);
