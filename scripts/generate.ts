import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { sitePages } from '../src/data/site';
import { catalogueProducts } from '../src/data/catalogue';
import { publicStaticRoutes } from '../src/lib/public-routes';
import { createLuxuryLookbookPdf } from '../src/lib/luxury-lookbook';
import { prepareLookbookImages } from './lib/lookbook-assets';
import { sampleFittingMessage } from '../src/lib/product-detail-preview';
import { siteMetadata } from '../src/data/metadata';
import { pageLoaderCss, pageLoaderMarkup, pageLoaderFallback } from '../src/lib/page-loader';
import { homepageBackgrounds } from '../src/lib/homepage-backgrounds';
import { REPOSITORY_BASE } from '../src/config/site';
import { buildWhatsAppUrl } from '../src/config/whatsapp';
import { directWhatsAppHandoffs } from '../src/lib/direct-whatsapp';
import { validateCatalogue } from '../src/lib/validate-catalogue';
import { validateDressGalleryMappings } from '../src/lib/dress-gallery';
import { escapeHtml, createNodeRenderer } from './lib/markup';
import { assets, track, prefix, copyTrackedAssets } from './lib/assets';
import { preparePage } from './lib/prepare-page';
const base = REPOSITORY_BASE;
const root = '.generated';
// Validate all catalogue records and public routes before clearing prior generated files.
validateCatalogue(catalogueProducts);
validateDressGalleryMappings();
const routes = ['/',...publicStaticRoutes(sitePages,catalogueProducts.map(p=>p.previewRoute))];
await rm(root, {recursive:true,force:true});
await mkdir(root,{recursive:true});
const cssFiles = ['src/styles/globals.css',...['FooterBranding','CatalogueListing','ProductDetailPreview','EditorialPages','HomepageExperience'].map(n=>'src/components/'+n+'.css'),'src/components/CatalogueFilter.css','src/components/WeddingMoments.css','src/components/ModernIcons.css'];
// Native homepage scrolling should retain the browser's vertical scrollbar.
// No synthetic scrollbar hiding or fullpage/footer handoff is necessary.
const extraCss = (await Promise.all(cssFiles.map(f=>readFile(f,'utf8')))).join('\n');

const render = createNodeRenderer(routes);

// Create favicon and home-screen artwork from the new standalone bridal monogram SVG without modifying
// the approved header/footer logos. Unique filenames prevent browsers from serving cached
// icons inherited from the earlier reference-site capture.
const faviconRoot = path.join(root, 'static', 'redcarpert', 'brand');
await mkdir(faviconRoot, {recursive: true});
const faviconSource = 'public/redcarpert/brand/redcarpert-bridal-monogram.svg';
const faviconFiles = [
 { size: 32, name: 'redcarpert-bridal-favicon-v2-32.png' },
 { size: 180, name: 'redcarpert-bridal-touch-v2-180.png' },
] as const;
for (const {size, name} of faviconFiles) {
 await sharp(faviconSource)
  .resize(size, size, {fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 1}})
  .png().toFile(path.join(faviconRoot, name));
}
// The original approved 1 MB logo remains the source of truth. Derive a
// compact, full-canvas WebP for header, footer and loading screen.
await sharp('public/redcarpert/brand/redcarpert-logo.png')
  .resize({width:640,withoutEnlargement:true})
  .webp({quality:84,effort:5})
  .toFile(path.join(faviconRoot,'redcarpert-logo-optimized.webp'));
for(const route of routes) {
 const {document: preparedDocument,product} = preparePage(route);
 const message = product ? sampleFittingMessage(product) : 'Hello Redcarpert Wedding Dresses!\n\nI would like to ask about your wedding dresses and book a fitting. Could you please help me?\n\nThank you.';
 const whatsappHref = buildWhatsAppUrl(message);
 const document = directWhatsAppHandoffs(preparedDocument,whatsappHref);
 // Apply homepage-only rules on the very first paint, before client scripts
 // start. This prevents the inherited theme briefly rendering a solid header.
 const initialBodyClass = route === '/' ? document.bodyClass + ' redcarpert-home-native' : document.bodyClass;
 const runtime = {bodyClass:initialBodyClass,htmlClass:document.htmlClass,scripts:document.scripts,themeConfig:document.themeConfig,postScripts:document.postScripts};
 const heroPreload = route==='/' ? `<link rel="preconnect" href="https://ik.imagekit.io"><link rel="preload" href="${escapeHtml(homepageBackgrounds[0].replacement)}" as="image" type="image/webp" fetchpriority="high">` : '';
 const weddingMomentsPreconnect = route === '/wedding-moments'
   ? '<link rel="preconnect" href="https://ik.imagekit.io">' : '';
 let html = `<!doctype html><html lang="en-US" class="${escapeHtml(document.htmlClass)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(document.title||siteMetadata.title)}</title><meta name="description" content="${escapeHtml(document.description||siteMetadata.description)}">${heroPreload}${weddingMomentsPreconnect}<style id="redcarpert-loader-critical">${pageLoaderCss}</style><noscript><style>#redcarpert-page-loader{display:none!important}</style></noscript><link rel="icon" type="image/png" sizes="32x32" href="/redcarpert/brand/redcarpert-bridal-favicon-v2-32.png"><link rel="apple-touch-icon" sizes="180x180" href="/redcarpert/brand/redcarpert-bridal-touch-v2-180.png">${document.styles.map(s=>s.href?`<link rel="stylesheet" href="${escapeHtml(s.href)}"${s.media?` media="${escapeHtml(s.media)}"`:''}>`:`<style>${s.css??''}</style>`).join('')}<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.3.1/css/all.min.css"><style>${extraCss}</style></head><body class="${escapeHtml(initialBodyClass)}">${pageLoaderMarkup(route === '/')}${pageLoaderFallback}${document.nodes.map(render).join('')}<script id="page-runtime" type="application/json">${JSON.stringify(runtime).replace(/</g,'\\u003c')}</script><script type="module" src="/src/client/main.js"></script></body></html>`;
 html = html.replaceAll('/digital-lookbook/pdf/','/digital-lookbook/Redcarpert-Sample-Lookbook.pdf');
 track(html); html = prefix(html).replace(base+'src/client/main.js','/src/client/main.js');
 const dir = path.join(root,route); await mkdir(dir,{recursive:true}); await writeFile(path.join(dir,'index.html'),html);
}
track(await readFile('src/client/lookbook.js','utf8'));
await copyTrackedAssets(root);
const editionYear=new Date().getFullYear();
const {images:bookImages,audit:bookImageAudit}=await prepareLookbookImages(catalogueProducts);
const officialLogo=await readFile('public/redcarpert/brand/redcarpert-logo.png');
const pdf=await createLuxuryLookbookPdf(catalogueProducts,bookImages,{year:editionYear,logo:officialLogo});
await mkdir(root+'/static/digital-lookbook',{recursive:true});
const premiumPdfName='Redcarpert-The-Bridal-Edit-'+editionYear+'.pdf';
await Promise.all([
 writeFile(root+'/static/digital-lookbook/'+premiumPdfName,pdf),
 // Preserve older links already shared with clients.
 writeFile(root+'/static/digital-lookbook/Redcarpert-Sample-Lookbook.pdf',pdf),
 writeFile(root+'/lookbook-image-audit.json',JSON.stringify({editionYear,photoCount:bookImageAudit.length,photos:bookImageAudit},null,2)),
]);
await writeFile(root+'/404.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found | Redcarpert</title><link rel="icon" type="image/png" sizes="32x32" href="${base}redcarpert/brand/redcarpert-bridal-favicon-v2-32.png"><link rel="apple-touch-icon" sizes="180x180" href="${base}redcarpert/brand/redcarpert-bridal-touch-v2-180.png"></head><body><main><h1>Page not found</h1><p>This page is unavailable.</p><a href="${base}">Return to Redcarpert Wedding Dresses</a></main></body></html>`);
await writeFile(root+'/routes.json',JSON.stringify(routes));
console.log(`Generated ${routes.length} approved pages and ${assets.size} reachable assets.`);
