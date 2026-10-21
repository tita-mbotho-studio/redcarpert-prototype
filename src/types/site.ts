export interface DocumentElement {
  tag: string;
  attrs: Record<string, string>;
  children: DocumentNode[];
}

export type DocumentNode = string | DocumentElement;

export interface SiteDocumentData {
  route: string;
  title: string;
  description: string;
  bodyClass: string;
  htmlClass: string;
  nodes: DocumentNode[];
  styles: Array<{ href?: string; css?: string; media?: string }>;
  themeConfig: string;
  scripts: string[];
  postScripts?: string[];
  rendered: { bodyClass: string; htmlClass: string };
}
