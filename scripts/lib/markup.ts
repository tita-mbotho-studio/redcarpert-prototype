import { catalogueProducts, catalogueCategories } from '../../src/data/catalogue.ts';
import { displayDressPrice } from '../../src/lib/pricing.ts';
import type { DocumentNode } from '../../src/types/site';

export const escapeHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function lookbook() {
 const editionYear = new Date().getFullYear();
 const pdfName = 'Redcarpert-The-Bridal-Edit-' + editionYear + '.pdf';
 const pageCount = catalogueProducts.length + 2;
 const dresses = catalogueProducts.map((product, i) => {
   const category = (catalogueCategories.find(c => c.id === product.category)?.name ?? 'WEDDING DRESSES').toUpperCase();
   const pageNumber = i + 2;
   return '<article class="redcarpert-book-page redcarpert-book-dress" data-book-page="' + pageNumber + '" data-sample-id="' + escapeHtml(product.id) + '">' +
     '<div class="redcarpert-book-page-inner"><div class="redcarpert-book-photo"><img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.imageAlt) + '" loading="' + (i > 1 ? 'lazy' : 'eager') + '" decoding="async"></div>' +
     '<div class="redcarpert-book-copy"><span class="redcarpert-book-kicker">REDCARPERT / SAMPLE COLLECTION</span><h3>' + category + '</h3><p>' + escapeHtml(product.name) + ' · Demonstration photograph</p>' +
     '<p class="redcarpert-book-price" data-book-price="' + escapeHtml(product.id) + '">' + escapeHtml(displayDressPrice(product.priceZar)) + '</p>' +
     '<a href="' + escapeHtml(product.previewRoute) + '/">View sample dress details</a><small>Indicative prices · Stock photos, not confirmed Redcarpert inventory</small></div>' +
     '<span class="redcarpert-book-folio">' + String(pageNumber).padStart(2,'0') + ' / ' + String(pageCount).padStart(2,'0') + '</span></div></article>';
 }).join('');
 const coverImage = escapeHtml(catalogueProducts[0].image);
 const logo = '/redcarpert/brand/redcarpert-logo.png';
 const cover = '<article class="redcarpert-book-page redcarpert-book-cover is-current" data-density="hard" data-book-page="1"><div class="redcarpert-book-cover-inner">' +
   '<img class="redcarpert-book-logo" src="' + logo + '" alt="Redcarpert logo" width="400" height="200">' +
   '<p class="redcarpert-book-kicker">THE BRIDAL EDIT · SAMPLE COLLECTION</p><h3>Digital<br>Lookbook</h3>' +
   '<div class="redcarpert-book-cover-photo"><img src="' + coverImage + '" alt="Pexels bridal editorial photograph, demonstration only" decoding="async"></div>' +
   '<p class="redcarpert-book-cover-foot">FIVE BRIDAL COLLECTIONS · 2026</p><small>Images and prices are illustrative</small></div></article>';
 const back = '<article class="redcarpert-book-page redcarpert-book-back" data-density="hard" data-book-page="' + pageCount + '"><div class="redcarpert-book-back-inner">' +
   '<span class="redcarpert-book-kicker">YOUR BRIDAL STORY BEGINS HERE</span><img class="redcarpert-book-logo" src="' + logo + '" alt="Redcarpert logo" width="400" height="200">' +
   '<h3>Find your silhouette.</h3><p>Explore five bridal collections, then enquire about a fitting.</p>' +
   '<div class="redcarpert-book-back-links"><a href="/product/">Browse Wedding Dresses</a><a href="/contact-us/">Fitting enquiries</a></div>' +
   '<small>Demonstration collection · No confirmed client inventory</small></div></article>';
 return '<section class="redcarpert-lookbook" aria-label="Interactive Redcarpert bridal book">' +
   '<p class="redcarpert-book-intro">Turn the pages to explore twenty sample dresses in five categories. ZAR prices are illustrative only; photographs are stock images, not Redcarpert inventory.</p>' +
   '<div class="redcarpert-book-shell"><div id="redcarpert-flipbook" class="redcarpert-book" tabindex="0" aria-label="' + pageCount + '-page bridal lookbook">' + cover + dresses + back + '</div></div>' +
   '<div class="redcarpert-book-controls" aria-label="Book navigation"><button type="button" data-book-previous disabled aria-label="Previous page"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i>Previous</button>' +
   '<span data-book-status role="status" aria-live="polite">Page 1 of ' + pageCount + '</span><button type="button" data-book-next aria-label="Next page">Next<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div>' +
   '<p class="redcarpert-book-help">Use the arrows or swipe to turn pages. Select a dress to view its details.</p>' +
   '<div class="redcarpert-lookbook-download"><a class="button" href="/digital-lookbook/' + pdfName + '" download="' + pdfName + '">Download The Bridal Edit (PDF)</a><p>A 32-page editorial publication with five bridal collections, 20 illustrative looks and indicative ZAR prices.</p></div>' +
   '</section>';
}
const voids = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
export function createNodeRenderer(routes: readonly string[]) {
function render(node: DocumentNode): string {
 if(typeof node === 'string') return escapeHtml(node);
 if(['script','noscript'].includes(node.tag)) return '';
 if(node.attrs['data-lookbook-viewer'] === 'true') return lookbook();
 const attrs = {...node.attrs};
 if (attrs.href && routes.includes(attrs.href) && attrs.href !== '/') attrs.href += '/';
 if(attrs.class?.split(/\s+/).includes('ht_ctc_chat_data')) delete attrs['data-settings'];
 if(attrs.href && /^(?:https?:\/\/(?:wa\.me|[^/]*whatsapp\.(?:com|net))|whatsapp:|intent:)/i.test(attrs.href)) {
  delete attrs.href; delete attrs.target; Object.assign(attrs,{'data-whatsapp-preview':'',role:'button',tabindex:'0','aria-haspopup':'dialog'});
 }
 const a = Object.entries(attrs).filter(([k,v])=>!/^on/i.test(k) && !(k==='src'&&!v)).map(([k,v])=>` ${k}="${escapeHtml(v)}"`).join('');
 return `<${node.tag}${a}>`+(voids.has(node.tag)?'':node.children.map(render).join('')+`</${node.tag}>`);
}

 return render;
}
