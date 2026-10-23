import type { DocumentNode, SiteDocumentData } from "@/types/site";

// Closed list of approved homepage backgrounds, not a general style-editing API.
export const homepageBackgrounds = [
  { section: 0, original: "/site-assets/ec8b6b2c4222396c44.png", replacement: "/redcarpert/home/hero-pexels-sample.webp" },
  { section: 1, original: "/site-assets/9def3725208290c4ef.png", replacement: "/redcarpert/home/collection-pexels-sample.webp" },
  { section: 2, original: "/site-assets/46f8a1c412d65fd42b.png", replacement: "/redcarpert/home/brand-pexels-sample.webp" },
] as const;

export function adaptHomepageBackgrounds(document: SiteDocumentData): SiteDocumentData {
  if (document.route !== "/") return document;
  let nodes = document.nodes;
  for (const background of homepageBackgrounds) {
    const path = [1, 1, 4, 1, 1, background.section];
    const expected = `background-image:url("${background.original}");background-position:center center;`;
    const fail = (): never => { throw new Error(`Homepage background ${background.section}: expected original section and inline style at ${path.join("/")}`); };
    const update = (children: DocumentNode[], depth: number): DocumentNode[] => {
      const index = path[depth];
      const node = children[index];
      if (!node || typeof node === "string") return fail();
      if (depth === path.length - 1) {
        if (node.tag !== "div" || node.attrs.class !== "section section-text layout-cc" || node.attrs.style !== expected) return fail();
        return children.map((child, i) => i === index
          ? { ...node, attrs: { ...node.attrs, style: expected.replace(background.original, background.replacement) } }
          : child);
      }
      const updated = update(node.children, depth + 1);
      return children.map((child, i) => i === index ? { ...node, children: updated } : child);
    };
    nodes = update(nodes, 0);
  }
  return { ...document, nodes };
}
