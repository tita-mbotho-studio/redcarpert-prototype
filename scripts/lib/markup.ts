import { catalogueProducts, catalogueCategories } from '../../src/data/catalogue.ts';
import { displaySalePriceForDress, displayRentalPriceForDress, salePriceLabelForDress, RENTAL_CONDITION_NOTE } from '../../src/lib/pricing.ts';
import { WHATSAPP_NUMBER } from '../../src/config/whatsapp.ts';
import type { DocumentNode } from '../../src/types/site';
import { mediaDeliveryUrl, mediaImageAttrs, mediaVideoAttrs } from '../../src/lib/media-delivery.ts';

export const escapeHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function lookbook() {
 const editionYear = new Date().getFullYear();
 const pdfName = 'Redcarpert-The-Bridal-Edit-' + editionYear + '.pdf';
 const pageCount = catalogueProducts.length + 2;
 const pdfPageCount = catalogueProducts.length + catalogueCategories.length + 7;
 const dresses = catalogueProducts.map((product, i) => {
   const category = (catalogueCategories.find(c => c.id === product.category)?.name ?? 'WEDDING DRESSES').toUpperCase();
   const pageNumber = i + 2;
   const optimizedImage = mediaDeliveryUrl(product.image, "lookbook");
   const fallbackAttr = optimizedImage === product.image ? "" :
     ' data-media-original="' + escapeHtml(product.image) + '"';
   return '<article class="redcarpert-book-page redcarpert-book-dress" data-book-page="' + pageNumber + '" data-sample-id="' + escapeHtml(product.id) + '">' +
     '<div class="redcarpert-book-page-inner"><div class="redcarpert-book-photo"><img src="' + escapeHtml(optimizedImage) + '"' + fallbackAttr + ' alt="' + escapeHtml(product.imageAlt) + '" loading="' + (i > 1 ? 'lazy' : 'eager') + '" decoding="async">' +
     '<button type="button" class="redcarpert-book-zoom-trigger" data-book-zoom-trigger data-book-zoom-src="' + escapeHtml(mediaDeliveryUrl(product.image, "preview")) + '" data-book-zoom-original="' + escapeHtml(product.image) + '" aria-haspopup="dialog" aria-label="Enlarge photograph of ' + escapeHtml(product.name) + '">' +
     '<i class="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true"></i></button></div>' +
     '<div class="redcarpert-book-copy">' + (product.status === 'client' ? '' : '<span class="redcarpert-book-kicker">' + escapeHtml(category) + '</span>') + '<h3>' + escapeHtml(product.status === 'client' ? product.name : product.name.replace(/^Sample /, 'Look ')) + '</h3>' +
     '<div class="redcarpert-book-price-pair" aria-label="Sale and rental prices">' +
     '<div class="redcarpert-book-price-item"><span class="redcarpert-book-price-label" data-book-sale-label="' + escapeHtml(product.id) + '">' + escapeHtml(salePriceLabelForDress(product.id)) + '</span>' +
     '<p class="redcarpert-book-price" data-book-sale-price="' + escapeHtml(product.id) + '">' + escapeHtml(displaySalePriceForDress(product.id)) + '</p></div>' +
     '<div class="redcarpert-book-price-item"><span class="redcarpert-book-price-label">Rental Price Range</span>' +
     '<p class="redcarpert-book-price" data-book-rental-price="' + escapeHtml(product.id) + '">' + escapeHtml(displayRentalPriceForDress(product.id)) + '</p></div></div>' +
     '<p class="redcarpert-book-condition-note">' + escapeHtml(RENTAL_CONDITION_NOTE) + '</p>' +
     '<a href="' + escapeHtml(product.previewRoute) + '/">View dress details</a></div>' +
     '<span class="redcarpert-book-folio">' + String(pageNumber).padStart(2,'0') + ' / ' + String(pageCount).padStart(2,'0') + '</span></div></article>';
 }).join('');
 const logo = '/redcarpert/brand/redcarpert-logo-optimized.webp';
 const cover = '<article class="redcarpert-book-page redcarpert-book-cover is-current" data-density="hard" data-book-page="1"><div class="redcarpert-book-cover-inner">' +
   '<img class="redcarpert-book-logo" src="' + logo + '" alt="Redcarpert Wedding Dresses logo" width="400" height="200">' +
   '<span class="redcarpert-book-cover-rule" aria-hidden="true"></span>' +
   '<h3>Walking on red carpet with confidence</h3>' +
   '<p class="redcarpert-book-cover-description">Discover the wedding dress styles you love.</p></div></article>';
 const back = '<article class="redcarpert-book-page redcarpert-book-back" data-density="hard" data-book-page="' + pageCount + '"><div class="redcarpert-book-back-inner">' +
   '<span class="redcarpert-book-kicker">WALKING ON RED CARPET WITH CONFIDENCE</span><img class="redcarpert-book-logo" src="' + logo + '" alt="Redcarpert logo" width="400" height="200">' +
   '<h3>Find your wedding dress.</h3><p>Explore our collections and message us to book a fitting.</p>' +
   '<div class="redcarpert-book-back-links"><a href="/product/">Browse Wedding Dresses</a><a href="/contact-us/">Book a Fitting</a></div>' +
   '</div></article>';
 return '<section class="redcarpert-lookbook" aria-label="Interactive Redcarpert bridal book">' +
   '<p class="redcarpert-book-intro">Explore ' + catalogueProducts.length + ' wedding dress looks across five bridal collections.</p>' +
   '<div class="redcarpert-book-shell"><div id="redcarpert-flipbook" class="redcarpert-book" tabindex="0" aria-label="' + pageCount + '-page bridal lookbook">' + cover + dresses + back + '</div></div>' +
   '<div class="redcarpert-book-controls" aria-label="Book navigation"><button type="button" data-book-previous disabled aria-label="Previous page"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
   '<span data-book-status role="status" aria-live="polite">Page 1 of ' + pageCount + '</span><button type="button" data-book-next aria-label="Next page"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button></div>' +
   '<p class="redcarpert-book-help">Use the arrows or swipe to turn pages. Use the expand icon to view a larger photograph.</p>' +
   '<dialog class="redcarpert-book-zoom-dialog" data-book-zoom-dialog aria-label="Enlarged wedding dress photograph">' +
   '<button type="button" class="redcarpert-book-zoom-close" data-book-zoom-close aria-label="Close enlarged photograph"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
   '<div class="redcarpert-book-zoom-stage" data-book-zoom-stage><img data-book-zoom-image alt="" draggable="false"></div>' +
   '<div class="redcarpert-book-zoom-controls" aria-label="Image zoom controls">' +
   '<button type="button" data-book-zoom-out aria-label="Zoom out"><i class="fa-solid fa-minus" aria-hidden="true"></i></button>' +
   '<button type="button" data-book-zoom-reset aria-label="Reset zoom"><i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i></button>' +
   '<span data-book-zoom-percent aria-live="polite">100%</span>' +
   '<button type="button" data-book-zoom-in aria-label="Zoom in"><i class="fa-solid fa-plus" aria-hidden="true"></i></button></div></dialog>' +
   '<div class="redcarpert-lookbook-download redcarpert-icon-cta" data-redcarpert-icon-cta="download">' +
   '<p class="redcarpert-icon-cta-label">Download The Bridal Edit (PDF)</p>' +
   '<a class="button redcarpert-icon-cta-button" href="/digital-lookbook/' + pdfName + '" download="' + pdfName + '" aria-label="Download The Bridal Edit (PDF)">' +
   '<i class="fa-solid fa-file-arrow-down" aria-hidden="true"></i></a>' +
   '<p>A ' + pdfPageCount + '-page editorial publication featuring five wedding dress collections.</p></div>' +
   '</section>';
}
const voids = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
export function createNodeRenderer(routes: readonly string[]) {
function render(node: DocumentNode): string {
 if(typeof node === 'string') return escapeHtml(node);
 if(['script','noscript'].includes(node.tag)) return '';
 if(node.attrs['data-lookbook-viewer'] === 'true') return lookbook();
 const attrs = node.tag === 'img' ? mediaImageAttrs(node.attrs)
   : node.tag === 'video' ? mediaVideoAttrs(node.attrs) : {...node.attrs};
 if (attrs.href && routes.includes(attrs.href) && attrs.href !== '/') attrs.href += '/';
 if(attrs.class?.split(/\s+/).includes('ht_ctc_chat_data')) delete attrs['data-settings'];
 // Preserve only the explicitly approved, fully validated native wa.me links
 // from directWhatsAppHandoffs. Captured legacy contact URLs stay inert.
 const approvedWhatsApp = attrs['data-whatsapp-send'] === ''
   && attrs.href?.startsWith(`https://wa.me/${WHATSAPP_NUMBER}?text=`);
 if(attrs.href && /^(?:https?:\/\/(?:wa\.me|[^/]*whatsapp\.(?:com|net))|whatsapp:|intent:)/i.test(attrs.href)
   && !approvedWhatsApp) {
  delete attrs.href; delete attrs.target; Object.assign(attrs,{'data-whatsapp-preview':'',role:'button',tabindex:'0','aria-haspopup':'dialog'});
 }
 const a = Object.entries(attrs).filter(([k,v])=>!/^on/i.test(k) && !(k==='src'&&!v)).map(([k,v])=>` ${k}="${escapeHtml(v)}"`).join('');
 return `<${node.tag}${a}>`+(voids.has(node.tag)?'':node.children.map(render).join('')+`</${node.tag}>`);
}

 return render;
}
