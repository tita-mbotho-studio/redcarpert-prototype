import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";

function elements(nodes: DocumentNode[]): DocumentElement[] {
  return nodes.flatMap((node) => typeof node === "string" ? [] : [node, ...elements(node.children)]);
}

// Reuse only the canonical subtree; the source document and all original nodes remain immutable.
export function addHomepageFooter(document: SiteDocumentData, source: SiteDocumentData): SiteDocumentData {
  if (document.route !== "/") return document;
  const fail = (): never => { throw new Error("Homepage footer: unexpected canonical footer, content or insertion point"); };
  if (source.route !== "/about-us") return fail();
  const main = document.nodes[1];
  const sourceMain = source.nodes[1];
  if (typeof main === "string" || main?.attrs.id !== "main-container" || typeof sourceMain === "string") return fail();
  const original = sourceMain?.children[3];
  if (!original || typeof original === "string" || original.tag !== "footer" || original.attrs.id !== "footer" || original.attrs.class !== "center") return fail();
  const existing = elements(document.nodes);
  if (existing.some((node) => node.tag === "footer" || node.attrs.id === "footer")) return fail();
  const wrapper = main.children[1];
  if (!wrapper || typeof wrapper === "string" || wrapper.attrs.class !== "page-wrapper") return fail();
  const sections = elements(wrapper.children).filter((node) => node.attrs.class?.split(/\s+/).includes("section"));
  if (sections.length !== 3 || sections.some((node) => node.attrs.class !== "section section-text layout-cc")) return fail();
  const footer = structuredClone(original);
  const nodes = elements([footer]);
  const one = (predicate: (node: DocumentElement) => boolean): DocumentElement => {
    const matches = nodes.filter(predicate);
    return matches.length === 1 ? matches[0] : fail();
  };
  // Remove only the copied homepage control; canonical informational footers stay intact.
  const scrollToTop = one((node) => node.attrs.class === "scroll-to-top");
  if (!footer.children.includes(scrollToTop)) return fail();
  footer.children = footer.children.filter((node) => node !== scrollToTop);
  const text = (id: string, expected: string, replacement: string) => {
    const widget = one((node) => node.attrs.id === id);
    const paragraph = elements(widget.children).find((node) => node.tag === "p");
    if (!paragraph || paragraph.children.length !== 1 || paragraph.children[0] !== expected) return fail();
    paragraph.children = [replacement];
  };
  text("block-20", "Vienna Austria  🇦🇹  Denizli Turkiye 🇹🇷 ", "Contact details to be confirmed");
  text("block-21", "+90 533 413 16 09", "Phone number to be confirmed");
  text("block-22", "bridalvanesa@gmail.com", "Contact details to be confirmed");
  const credit = one((node) => node.attrs.id === "block-13");
  const paragraph = elements(credit.children).find((node) => node.tag === "p");
  const sub = elements(credit.children).find((node) => node.tag === "sub");
  if (paragraph?.children[0] !== "Website Design By:" || sub?.children[0] !== "TATLI MEDIA") return fail();
  paragraph.children[0] = "Client prototype";
  sub.children = ["Demonstration only"];
  const copyright = one((node) => node.attrs.class === "copyrights");
  if (copyright.children.join("") !== "\n© COPYRIGHT Brıdal Vanesa") return fail();
  copyright.children = ["\n© COPYRIGHT Redcarpert Wedding Dresses"];

  // Neutral text placeholder in the existing image slot, not a new business logo.
  // Keep its original canvas, dimensions, classes and loading behaviour.
  const logo = one((node) => node.tag === "img" && node.attrs.class === "wp-image-13926");
  if (logo.attrs.width !== "1024" || logo.attrs.height !== "322" || !logo.attrs.src.endsWith("/logo-alt-2-1024x322.png")) return fail();
  const placeholder = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="322" viewBox="0 0 1024 322"><text x="512" y="161" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="52" fill="white">Redcarpert Wedding Dresses</text></svg>';
  logo.attrs.src = `data:image/svg+xml,${encodeURIComponent(placeholder)}`;
  logo.attrs.alt = "Redcarpert Wedding Dresses";
  delete logo.attrs.srcset;
  delete logo.attrs.sizes;

  const socialDestinations = [
    ["https://www.instagram.com/bridal_vanesa/", "Instagram"],
    ["https://www.youtube.com/@BridalVanesa", "YouTube"],
    ["https://twitter.com/vanesabridal", "Twitter"],
    ["https://tr.pinterest.com/vanesabridal/", "Pinterest"],
    ["https://www.tiktok.com/@bridalvanesa", "TikTok"],
  ];
  if (nodes.filter((node) => node.tag === "a").length !== socialDestinations.length) return fail();
  for (const [destination, label] of socialDestinations) {
    const link = one((node) => node.tag === "a" && node.attrs.href === destination);
    delete link.attrs.href;
    delete link.attrs.target;
    delete link.attrs.title;
    link.attrs["aria-disabled"] = "true";
    link.attrs["aria-label"] = `${label}: destination to be confirmed`;
  }
  const ids = new Set(existing.map((node) => node.attrs.id).filter(Boolean));
  for (const node of nodes) {
    if (node.attrs.id && ids.has(node.attrs.id)) return fail();
    if (node.attrs.id) ids.add(node.attrs.id);
  }
  footer.attrs["data-homepage-footer"] = "true";
  // Same ancestry as the informational pages: directly after .page-wrapper.
  const children = [...main.children];
  children.splice(2, 0, footer);
  return { ...document, nodes: document.nodes.map((node, index) => index === 1 ? { ...main, children } : node) };
}
