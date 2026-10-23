import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";

// Deliberately excludes layout, plugin configuration, event and dimension attributes.
const contentAttributes = ["alt", "title", "aria-label", "href", "src", "srcset", "sizes"] as const;
type ContentAttribute = typeof contentAttributes[number];

type ContentChange =
  | { readonly kind: "text"; readonly childIndex: number; readonly expected: string; readonly value: string }
  | { readonly kind: "attribute"; readonly name: ContentAttribute; readonly expected: string; readonly value: string };

export interface ContentAdaptation {
  readonly id: string;
  readonly route: string;
  readonly target: {
    readonly tag: string;
    readonly attrs: Readonly<Record<string, string>>;
    // Optional exact child-index path from document.nodes for repeated markup.
    // Tag, attribute and old-value checks still apply when a path is specified.
    readonly path?: readonly number[];
  };
  readonly changes: readonly ContentChange[];
}

/** Pure, server-side content editing. Empty/unrelated rules return the exact input. */
export function adaptSiteDocument(document: SiteDocumentData, adaptations: readonly ContentAdaptation[]): SiteDocumentData {
  const rules = adaptations.filter((rule) => rule.route === document.route);
  if (!rules.length) return document;

  const replacements = new Map<DocumentElement, DocumentElement>();
  const changedFields = new Map<DocumentElement, Set<string>>();
  const ids = new Set<string>();
  for (const rule of rules) {
    const fail = (reason: string): never => { throw new Error(`Content adaptation "${rule.id}" on ${document.route}: ${reason}`); };
    if (ids.has(rule.id)) fail("duplicate rule id");
    ids.add(rule.id);
    const matches: DocumentElement[] = [];
    const targetPath = rule.target.path;
    const find = (nodes: DocumentNode[], parentPath: readonly number[]) => {
      nodes.forEach((node, index) => {
        if (typeof node === "string") return;
        const path = [...parentPath, index];
        if (node.tag === rule.target.tag
          && Object.entries(rule.target.attrs).every(([name, value]) => node.attrs[name] === value)
          && (!targetPath || (path.length === targetPath.length && path.every((part, i) => part === targetPath[i])))) matches.push(node);
        find(node.children, path);
      });
    };
    find(document.nodes, []);
    if (matches.length !== 1) fail(`expected exactly one target, found ${matches.length}`);
    const node = matches[0];
    if (["script", "style", "noscript", "link"].includes(node.tag)) fail("executable/style nodes cannot be adapted");
    const replacement = replacements.get(node) ?? { ...node, attrs: { ...node.attrs }, children: [...node.children] };
    const fields = changedFields.get(node) ?? new Set<string>();
    for (const change of rule.changes) {
      const field = change.kind === "text" ? `text:${change.childIndex}` : `attribute:${change.name}`;
      if (fields.has(field)) fail("overlapping changes to the same content field");
      fields.add(field);
      if (change.kind === "text") {
        if (!Number.isInteger(change.childIndex) || change.childIndex < 0
          || typeof node.children[change.childIndex] !== "string"
          || node.children[change.childIndex] !== change.expected) fail("text slot does not match its expected value");
        replacement.children[change.childIndex] = change.value;
      } else {
        // Runtime check also protects callers using plain JS or untyped configuration.
        if (!(contentAttributes as readonly string[]).includes(change.name)) fail("attribute is outside the content allowlist");
        if (!Object.hasOwn(node.attrs, change.name) || node.attrs[change.name] !== change.expected) fail("attribute does not match its expected value");
        replacement.attrs[change.name] = change.value;
      }
    }
    replacements.set(node, replacement);
    changedFields.set(node, fields);
  }

  // Copy only edited nodes and their ancestors; keep all untouched data references.
  const update = (nodes: DocumentNode[]): DocumentNode[] => {
    let changed = false;
    const updated = nodes.map((node) => {
      if (typeof node === "string") return node;
      const replacement = replacements.get(node) ?? node;
      const children = update(replacement.children);
      const result = children === replacement.children ? replacement : { ...replacement, children };
      if (result !== node) changed = true;
      return result;
    });
    return changed ? updated : nodes;
  };
  return { ...document, nodes: update(document.nodes) };
}
