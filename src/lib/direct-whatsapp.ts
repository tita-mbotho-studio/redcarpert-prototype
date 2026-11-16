import type { DocumentElement, DocumentNode, SiteDocumentData } from "../types/site";
import { WHATSAPP_NUMBER } from "../config/whatsapp";

/**
 * Replace every website-level WhatsApp preview button with a real external link.
 * This runs after page-specific dress messages have been selected, so all CTAs
 * on a dress page carry that gown's name; other pages use the general enquiry.
 * No JavaScript or intermediate dialog is required for the visitor to proceed.
 */
export function directWhatsAppHandoffs(document: SiteDocumentData, href: string): SiteDocumentData {
  const url = new URL(href);
  if (url.protocol !== "https:" || url.hostname !== "wa.me" ||
      url.pathname !== `/${WHATSAPP_NUMBER}` || !url.searchParams.get("text") ||
      [...url.searchParams.keys()].join() !== "text") {
    throw new Error("Invalid Redcarpert WhatsApp handoff URL");
  }
  let count = 0;
  const visit = (node: DocumentNode): DocumentNode => {
    if (typeof node === "string") return node;
    const children = node.children.map(visit);
    if (Object.hasOwn(node.attrs, "data-whatsapp-preview")) {
      if (node.tag !== "button" || node.attrs.type !== "button" ||
          node.attrs["aria-haspopup"] !== "dialog" ||
          node.attrs["data-whatsapp-preview"] !== "") {
        throw new Error(`Unexpected WhatsApp preview control on ${document.route}`);
      }
      count++;
      const attrs = { ...node.attrs };
      delete attrs.type;
      delete attrs["aria-haspopup"];
      delete attrs["data-whatsapp-preview"];
      return {
        ...node,
        tag: "a",
        attrs: { ...attrs, "data-whatsapp-send": "", href, target: "_blank", rel: "noopener noreferrer" },
        children,
      } as DocumentElement;
    }
    return children.some((child, index) => child !== node.children[index])
      ? { ...node, children } : node;
  };
  const nodes = document.nodes.map(visit);
  // Footer fitting + footer social + floating WhatsApp must exist on every
  // approved page, in addition to any editorial or product-detail CTA.
  if (count < 3) throw new Error(`Missing direct WhatsApp controls on ${document.route}: ${count}`);
  return { ...document, nodes };
}
