import type { DocumentNode } from '../../src/types/site';

export const escapeHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function lookbook() {
 return `<section class="redcarpert-lookbook" aria-label="Digital bridal lookbook"><div class="redcarpert-lookbook-frame"><div class="redcarpert-lookbook-image"><img src="/redcarpert/gallery/sample-01-mermaid-pexels.webp" alt="Stock bridal image of a fitted gown, not confirmed Redcarpert inventory" width="1696" height="2528"></div><div class="redcarpert-lookbook-copy"><p class="redcarpert-lookbook-eyebrow">REDCARPERT WEDDING DRESSES</p><h3>Mermaid</h3><p data-sample>Sample 01 — demonstration photograph</p><p class="redcarpert-lookbook-note">Not confirmed Redcarpert inventory. Actual dresses and photography will follow client approval.</p><a data-detail href="/product/preview/sample-01-mermaid/">View sample dress details</a><div class="redcarpert-lookbook-controls" aria-label="Lookbook page controls"><button type="button" data-previous disabled aria-label="Previous dress">Previous</button><span aria-live="polite">Page 1 of 2</span><button type="button" data-next aria-label="Next dress">Next</button></div></div></div><div class="redcarpert-lookbook-download"><a class="button" href="/digital-lookbook/Redcarpert-Sample-Lookbook.pdf" download="Redcarpert-Sample-Lookbook.pdf">Download sample lookbook (PDF)</a></div></section>`;
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
