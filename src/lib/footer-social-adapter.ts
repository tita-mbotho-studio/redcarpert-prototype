import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";

const socials = [
  ["Instagram", "https://www.instagram.com/bridal_vanesa/", "https://nirvanatakipcim.com/gelinlik/wp-content/themes/thestory/images/icons_white/instagram.png"],
  ["YouTube", "https://www.youtube.com/@BridalVanesa", "/site-assets/3d94819dd14ede1760.png"],
  ["Twitter", "https://twitter.com/vanesabridal", "/site-assets/4600dc5b99e2f02b67.png"],
  ["Pinterest", "https://tr.pinterest.com/vanesabridal/", "/site-assets/3b9a6e23cf5c478efd.png"],
  ["TikTok", "https://www.tiktok.com/@bridalvanesa", "/site-assets/54721da2e3bb14d829.png"],
] as const;
const elements = (nodes: DocumentNode[]) => nodes.filter((node): node is DocumentElement => typeof node !== "string");
const find = (nodes: DocumentNode[], predicate: (node: DocumentElement) => boolean): DocumentElement[] =>
  elements(nodes).flatMap(node => [...(predicate(node) ? [node] : []), ...find(node.children, predicate)]);

/** Run on captures before addHomepageFooter; its already-safe copied footer remains its responsibility. */
export function adaptFooterSocials(document: SiteDocumentData): SiteDocumentData {
  const fail = (detail: string): never => { throw new Error(`Footer socials ${document.route}: incompatible captured footer (${detail})`); };
  const footers = find(document.nodes, node => node.tag === "footer" || node.attrs.id === "footer");
  if (document.route === "/") {
    if (footers.length) fail("homepage must precede footer insertion");
    return document;
  }
  if (footers.length !== 1 || footers[0].tag !== "footer" || footers[0].attrs.id !== "footer" || footers[0].attrs.class !== "center") fail("unique canonical footer");
  const footer = footers[0];
  const one = (nodes: DocumentNode[], tag: string, className: string) => {
    const matches = elements(nodes).filter(node => node.tag === tag && node.attrs.class === className);
    return matches.length === 1 ? matches[0] : fail(className);
  };
  const bottom = one(footer.children, "div", "footer-bottom");
  const boxed = one(bottom.children, "div", "section-boxed");
  const profiles = one(boxed.children, "div", "social-profiles");
  const list = one(profiles.children, "ul", "social-icons");
  if (find([footer], node => node.attrs.class?.split(/\s+/).includes("social-icons") ?? false).length !== 1) fail("unique social list");
  const items = elements(list.children);
  if (items.length !== socials.length) fail("five social items");
  const replacements = new Map<DocumentElement, DocumentElement>();
  const only = (node: DocumentElement, tag: string) => {
    const children = elements(node.children);
    if (children.length !== 1 || children[0].tag !== tag || node.children.some(child => typeof child === "string" && child.trim())) fail(`${tag} wrapper`);
    return children[0];
  };
  items.forEach((item, index) => {
    const [platform, href, src] = socials[index];
    if (item.tag !== "li") fail("list item");
    const anchor = only(item, "a");
    const wrapper = only(anchor, "div");
    const image = only(wrapper, "img");
    if (anchor.attrs.href !== href || anchor.attrs.target !== "_blank"
      || anchor.attrs.title !== (index === 4 ? "z" : undefined)
      || Object.keys(anchor.attrs).some(key => !["href", "target", "title"].includes(key))
      || Object.keys(wrapper.attrs).length || Object.keys(item.attrs).length
      || image.attrs.src !== src || image.attrs.alt !== "" || Object.keys(image.attrs).length !== 2 || image.children.length) fail(platform);
    const attrs = { ...anchor.attrs };
    delete attrs.href;
    delete attrs.target;
    delete attrs.title;
    Object.assign(attrs, { style: "cursor: pointer", role: "link", "aria-disabled": "true", "aria-label": `${platform}: destination not yet available` });
    replacements.set(anchor, { ...anchor, attrs });
  });
  if (find([footer], node => node.tag === "a" && socials.some(([, href]) => node.attrs.href === href)).some(node => !replacements.has(node))) fail("unexpected social anchor outside list");
  const visit = (node: DocumentNode): DocumentNode => {
    if (typeof node === "string") return node;
    const replacement = replacements.get(node);
    if (replacement) return replacement;
    const children = node.children.map(visit);
    return children.some((child, index) => child !== node.children[index]) ? { ...node, children } : node;
  };
  return { ...document, nodes: document.nodes.map(visit) };
}
