import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";
import { bridalGalleryPhotos } from "@/data/bridal-gallery";

const node = (tag: string, attrs: Record<string, string>, children: DocumentNode[]): DocumentElement => ({ tag, attrs, children });
const elements = (list: DocumentNode[]) => list.filter((x): x is DocumentElement => typeof x !== "string");
const all = (list: DocumentNode[]): DocumentElement[] => elements(list).flatMap((x) => [x, ...all(x.children)]);

type EditorialRoute = "/digital-lookbook" | "/our-brides" | "/about-us" | "/contact-us";
const editorialRoutes: readonly EditorialRoute[] = ["/digital-lookbook", "/our-brides", "/about-us", "/contact-us"];

const p = (text: string) => node("p", {}, [text]);
const h = (text: string) => node("h2", {}, [text]);
const link = (href: string, label: string) => node("a", { href }, [label]);
const image = (src: string, alt: string) => node("img", { src, alt, loading: "lazy", decoding: "async" }, []);
const fitting = () => node("button", { type: "button", class: "button", "data-whatsapp-preview": "", "aria-haspopup": "dialog" }, ["Enquire about a fitting"]);

function editorialContent(route: EditorialRoute): DocumentNode[] {
  if (route === "/digital-lookbook") return [
    h("Digital Lookbook"),
    p("Explore a preview of Mermaid and Ball Gown wedding dresses. Photographs are demonstration imagery, not confirmed Redcarpert inventory."),
    node("div", { "data-lookbook-viewer": "true" }, []),
  ];
  if (route === "/our-brides") return [
    h("Bridal Inspiration"),
    p("An editorial gallery of bridal moments and silhouettes. These are sample Pexels photographs, not pictures of Redcarpert clients or completed fittings."),
    node("div", { class: "redcarpert-inspiration-grid", "data-brides-gallery": "true", "aria-label": "Sample bridal inspiration photographs" }, bridalGalleryPhotos.map((photo, index) =>
      node("figure", { class: "redcarpert-bride-card", "data-bride-card": photo.id }, [
        node("button", {
          type: "button", "data-bride-preview": photo.id, "data-bridal-caption": photo.caption,
          "data-bridal-photographer": photo.photographer, "aria-haspopup": "dialog",
          "aria-label": "Enlarge " + photo.caption + " (sample photograph)"
        }, [
          node("img", {
            src: photo.image, alt: photo.alt, width: "370", height: "444",
            loading: index < 4 ? "eager" : "lazy", decoding: "async"
          }, []),
        ]),
        node("figcaption", {}, [photo.caption]),
      ])
    )),
    p("Gallery inspiration only. Client-approved photographs will replace these samples when available."),
    node("dialog", {
      id: "redcarpert-bride-preview", class: "redcarpert-bride-dialog",
      "aria-label": "Enlarged bridal inspiration photograph"
    }, [
      node("figure", { class: "redcarpert-bride-dialog-inner" }, [
        node("button", { class: "redcarpert-bride-dialog-close", type: "button", "data-bride-preview-close": "", "aria-label": "Close photo preview" }, ["×"]),
        node("img", { "data-bride-preview-image": "", alt: "Enlarged bridal inspiration photograph", decoding: "async" }, []),
        node("figcaption", {}, [
          node("span", { "data-bride-preview-caption": "" }, ["Bridal inspiration"]),
          node("small", { "data-bride-preview-credit": "" }, ["Sample photography"]),
        ]),
      ]),
    ]),
  ];
  if (route === "/about-us") return [
    h("Redcarpert Wedding Dresses"),
    p("Redcarpert Wedding Dresses is presenting its bridal collections through a catalogue designed to help brides explore styles and enquire about fittings."),
    h("Our Collections"),
    p("The prototype introduces two silhouettes: Mermaid and Ball Gown. Browse the galleries to see how the finished catalogue and individual dress pages will work."),
    node("p", {}, [link("/product-category/mermaid/", "Explore Mermaid"), "  |  ", link("/product-category/ball_gown/", "Explore Ball Gown")]),
    h("Atelier & Fitting Enquiries"),
    p("Our fitting enquiry experience lets visitors express interest in a specific dress through WhatsApp. Appointment arrangements and studio details will be confirmed by Redcarpert."),
    fitting(),
    p("The current dress photographs are illustrative samples and are not confirmed Redcarpert inventory."),
  ];
  return [
    h("Fitting Enquiries"),
    p("Explore the Mermaid and Ball Gown collections, then send an enquiry about a fitting using the WhatsApp enquiry preview."),
    fitting(),
    h("Contact Details"),
    p("The business WhatsApp number, studio location and opening hours are awaiting client confirmation. No message is sent from this demonstration."),
    p("For a dress-specific enquiry, open an individual sample dress page and select Enquire about a fitting."),
    node("p", {}, [link("/product/", "Browse Wedding Dresses")]),
  ];
}

/** Content-only substitution inside the captured page shell. No source CSS, header,
 * footer, main wrapper, responsive breakpoints, or image galleries are mutated. */
export function adaptEditorialDocument(document: SiteDocumentData): SiteDocumentData {
  if (!editorialRoutes.includes(document.route as EditorialRoute)) return document;
  const route = document.route as EditorialRoute;
  const matches = all(document.nodes);
  const one = (predicate: (n: DocumentElement) => boolean, description: string) => {
    const found = matches.filter(predicate);
    if (found.length !== 1) throw new Error(`Editorial ${route}: expected one ${description}, found ${found.length}`);
    return found[0];
  };
  const main = one(n => n.attrs.id === "main-container", "site shell");
  const footer = one(n => n.tag === "footer" && n.attrs.id === "footer", "footer");
  const header = one(n => n.tag === "header" && n.attrs.id === "header", "header");
  const box = one(n => n.attrs.class === "content-box" && n.tag === "div", "content box");
  const pageTitle = one(n => n.tag === "div" && n.attrs.class === "page-title", "page title");
  const title = all(pageTitle.children).find(n => n.tag === "h1"
    && n.children.length === 1 && typeof n.children[0] === "string");
  if (!title) throw new Error(`Editorial ${route}: missing page banner heading`);
  if (!all([main]).includes(footer) || !all([main]).includes(header) || !all([main]).includes(box)) throw new Error("Editorial: invalid shell");
  const replacement = new Map<DocumentElement, DocumentElement>([
    [title, { ...title, children: [route === "/digital-lookbook" ? "Digital Lookbook" : route === "/our-brides" ? "Our Brides" : route === "/about-us" ? "About Us" : "Contact Us"] }],
    [box, { ...box, children: [node("div", { class: "redcarpert-editorial", "data-editorial-route": route }, editorialContent(route))] }],
  ]);
  const visit = (current: DocumentNode): DocumentNode => {
    if (typeof current === "string") return current;
    const chosen = replacement.get(current) ?? current;
    const mapped = chosen.children.map(visit);
    return mapped.some((n, i) => n !== chosen.children[i]) ? { ...chosen, children: mapped } : chosen;
  };
  return { ...document, nodes: document.nodes.map(visit) };
}
