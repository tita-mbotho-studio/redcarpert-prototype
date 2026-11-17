import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";
import imageLinks from "../data/image-links.json" with { type: "json" };
import { weddingMomentEvents, flattenWeddingMomentEvents, renderWeddingMomentGallery } from "./wedding-moments.ts";

const node = (tag: string, attrs: Record<string, string>, children: DocumentNode[]): DocumentElement => ({ tag, attrs, children });
const elements = (list: DocumentNode[]) => list.filter((x): x is DocumentElement => typeof x !== "string");
const all = (list: DocumentNode[]): DocumentElement[] => elements(list).flatMap((x) => [x, ...all(x.children)]);

type EditorialRoute = "/digital-lookbook" | "/wedding-moments" | "/about-us" | "/contact-us";
const editorialRoutes: readonly EditorialRoute[] = ["/digital-lookbook", "/wedding-moments", "/about-us", "/contact-us"];

const p = (text: string) => node("p", {}, [text]);
const h = (text: string, id?: string) => node("h2", id ? { id } : {}, [text]);
/** The approved editorial fitting CTAs show their wording above one small icon link. */
const fitting = (label = "Book a Fitting") => node("div", {
  class: "redcarpert-icon-cta",
  "data-redcarpert-icon-cta": "fitting",
}, [
  node("p", { class: "redcarpert-icon-cta-label" }, [label]),
  node("button", {
    type: "button",
    class: "button redcarpert-icon-cta-button",
    "data-whatsapp-preview": "",
    "aria-haspopup": "dialog",
    "aria-label": label + " via WhatsApp",
  }, [node("i", { class: "fa-brands fa-whatsapp", "aria-hidden": "true" }, [])]),
]);

function editorialContent(route: EditorialRoute): DocumentNode[] {
  if (route === "/digital-lookbook") return [
    node("section", { class: "redcarpert-editorial-hero", "aria-labelledby": "redcarpert-lookbook-title" }, [
      node("p", { class: "redcarpert-editorial-eyebrow" }, ["THE BRIDAL EDIT"]),
      node("h2", { id: "redcarpert-lookbook-title" }, ["Digital Lookbook"]),
      node("p", { class: "redcarpert-editorial-lead" }, ["Explore Our Wedding Dress Collections"]),
      p("Browse wedding dress styles and find the looks you love."),
      node("p", { class: "redcarpert-editorial-disclosure" }, ["Some photos show style ideas, not dresses confirmed in stock. Message us to check availability and prices."]),
    ]),
    node("div", { "data-lookbook-viewer": "true" }, []),
  ];
  if (route === "/wedding-moments") {
    return [
      node("p", { class: "redcarpert-moments-subtitle" },
        ["The love, the laughter, the unforgettable moments."]),
      ...renderWeddingMomentGallery(flattenWeddingMomentEvents(weddingMomentEvents)),
    ];
  }
  if (route === "/about-us") return [
    node("section", { class: "redcarpert-editorial-hero", "aria-labelledby": "redcarpert-story-title" }, [
      node("p", { class: "redcarpert-editorial-eyebrow" }, ["OUR STORY"]),
      node("h2", { id: "redcarpert-story-title" }, ["Your Dream Dress Starts Here"]),
      node("p", { class: "redcarpert-editorial-lead" }, ["Find a dress that feels like you."]),
      p("Browse our wedding dress collections, find styles you love and message us on WhatsApp to ask about a dress or book a fitting."),
    ]),
    node("section", { class: "redcarpert-editorial-panel", "aria-labelledby": "redcarpert-collections-title" }, [
      h("Our Collections", "redcarpert-collections-title"),
      p("Explore Mermaid, Ball Gown, Ruffled, Modern Tradition and 2 in 1 styles. Find your favourite and ask us what is available."),
      node("nav", { class: "redcarpert-editorial-actions", "aria-label": "Explore bridal collections" }, [
        node("a", { href: "/product-category/mermaid/", class: "redcarpert-editorial-action" }, ["Explore Mermaid"]),
        node("a", { href: "/product-category/ball_gown/", class: "redcarpert-editorial-action" }, ["Explore Ball Gown"]),
        node("a", { href: "/product-category/ruffled/", class: "redcarpert-editorial-action" }, ["Explore Ruffled Dresses"]),
        node("a", { href: "/product-category/modern_tradition/", class: "redcarpert-editorial-action" }, ["Explore Modern Tradition"]),
        node("a", { href: "/product-category/two_in_one/", class: "redcarpert-editorial-action" }, ["Explore 2 in 1 Dresses"]),
      ]),
    ]),
    node("section", { class: "redcarpert-editorial-panel", "aria-labelledby": "redcarpert-fitting-title" }, [
      h("Book Your Fitting", "redcarpert-fitting-title"),
      p("Found a dress you love? Message us on WhatsApp to ask about the style and arrange your fitting."),
      fitting("Book a Fitting"),
      node("p", { class: "redcarpert-editorial-disclosure" }, ["Some photos are for inspiration only. Ask us about dress availability and prices."]),
    ]),
    node("section", { class: "redcarpert-editorial-panel redcarpert-editorial-team", "aria-labelledby": "redcarpert-team-title" }, [
      h("Meet Our Models", "redcarpert-team-title"),
      p("Meet the models featured in our bridal photographs."),
      node("div", { class: "redcarpert-editorial-team-grid" },
        imageLinks.about_us.team.map((model) =>
          node("figure", { class: "redcarpert-editorial-team-card" }, [
            node("img", {
              src: model.url,
              alt: `Portrait of ${model.name}, Redcarpert bridal model`,
              loading: "lazy",
              decoding: "async",
              width: String(model.width),
              height: String(model.height),
            }, []),
            node("figcaption", {}, [
              node("h3", {}, [model.name]),
            ]),
          ]),
        ),
      ),
    ]),
  ];
  return [
    node("section", { class: "redcarpert-editorial-hero", "aria-labelledby": "redcarpert-contact-title" }, [
      node("p", { class: "redcarpert-editorial-eyebrow" }, ["GET IN TOUCH"]),
      node("h2", { id: "redcarpert-contact-title" }, ["Let's find your wedding dress"]),
      node("p", { class: "redcarpert-editorial-lead" }, ["We're here to help you find a dress you love."]),
      p("Message us on WhatsApp to ask about our dresses or book a fitting."),
      fitting("Book a Fitting"),
    ]),
    node("section", { class: "redcarpert-editorial-panel", "aria-labelledby": "redcarpert-enquiry-steps" }, [
      h("How to Book a Fitting", "redcarpert-enquiry-steps"),
      node("ol", { class: "redcarpert-editorial-steps" }, [
        node("li", {}, [node("strong", {}, ["Find a Dress"]), p("Browse our wedding dresses and choose a style you love.")]),
        node("li", {}, [node("strong", {}, ["Message Us"]), p("Contact us on WhatsApp to ask about the dress and book your fitting.")]),
        node("li", {}, [node("strong", {}, ["Confirm Your Appointment"]), p("We'll agree on a fitting time and confirm it with you.")]),
      ]),
      node("nav", { class: "redcarpert-editorial-actions", "aria-label": "Browse dresses and contact us" }, [
        node("a", { href: "/product/", class: "redcarpert-editorial-action" }, ["Browse Wedding Dresses"]),
      ]),
    ]),
    node("section", { class: "redcarpert-editorial-panel", "aria-labelledby": "redcarpert-visiting-title" }, [
      h("Before Your Visit", "redcarpert-visiting-title"),
      p("Fittings are by appointment only. Please book your fitting on WhatsApp before visiting."),
    ]),
    node("section", { class: "redcarpert-editorial-panel redcarpert-editorial-location", "aria-labelledby": "redcarpert-map-title" }, [
      h("Our Location", "redcarpert-map-title"),
      node("p", { class: "redcarpert-editorial-lead" }, ["Pomona · Kempton Park · Gauteng"]),
      p("We're in Pomona, Kempton Park. This map shows the general area."),
      node("div", { class: "redcarpert-editorial-map" }, [
        node("iframe", {
          title: "Map of the Pomona area in Kempton Park, Gauteng, South Africa",
          src: "https://www.google.com/maps?q=Pomona%2C%20Kempton%20Park%2C%20Gauteng%2C%20South%20Africa&output=embed",
          loading: "lazy",
          referrerpolicy: "no-referrer-when-downgrade",
          "aria-label": "Map showing the general Pomona area of Kempton Park, Gauteng, South Africa",
        }, []),
      ]),
      node("p", { class: "redcarpert-editorial-map-link" }, [
        node("a", { href: "https://www.google.com/maps/search/?api=1&query=Pomona%2C%20Kempton%20Park%2C%20Gauteng%2C%20South%20Africa", target: "_blank", rel: "noopener noreferrer" }, ["View Pomona on Google Maps"]),
      ]),
      node("p", { class: "redcarpert-editorial-disclosure" }, ["We'll share the exact studio address and directions on WhatsApp once your fitting appointment is confirmed."]),
    ]),
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
  // The captured Our Brides shell uses an unused right sidebar, while the
  // Wedding Dresses page uses a full-width four-column catalogue shell.
  // Adopt its content geometry without altering the shared header/footer.
  const replacements = new Map<DocumentElement, DocumentElement>();
  if (route === "/wedding-moments" || route === "/contact-us") {
    const container = one(n => n.attrs.id === "content-container", "page layout");
    const content = one(n => n.attrs.id === "content" && n.attrs.class === "content", "main content column");
    const sidebar = one(n => n.attrs.id === "sidebar" && n.attrs.class === "sidebar", "unused sidebar");
    if (container.attrs.class !== "content-boxed layout-right"
      || !elements(container.children).includes(content)
      || !elements(container.children).includes(sidebar)
      || elements(sidebar.children).length !== 0) {
      throw new Error(`Editorial ${route}: incompatible original sidebar layout`);
    }
    replacements.set(container, {
      ...container,
      attrs: { ...container.attrs, class: "content-boxed layout-full" },
      children: container.children.filter(child => child !== sidebar),
    });
    replacements.set(content, { ...content, attrs: { ...content.attrs, id: "full-width" } });
  }
  if (route !== "/wedding-moments") {
    replacements.set(pageTitle, {
      ...pageTitle,
      attrs: { ...pageTitle.attrs, class: "page-title redcarpert-editorial-page-title" },
    });
  }
  replacements.set(title, { ...title, children: [route === "/digital-lookbook" ? "Digital Lookbook" : route === "/wedding-moments" ? "Wedding Moments" : route === "/about-us" ? "About Us" : "Contact Us"] });
  replacements.set(box, { ...box, attrs: { ...box.attrs, class: route === "/wedding-moments" ? "content-box pexeto-woo-columns-4 redcarpert-moments-content-box" : box.attrs.class }, children: [node("div", { class: "redcarpert-editorial", "data-editorial-route": route }, editorialContent(route))] });
  const visit = (current: DocumentNode): DocumentNode => {
    if (typeof current === "string") return current;
    const chosen = replacements.get(current) ?? current;
    const mapped = chosen.children.map(visit);
    return mapped.some((n, i) => n !== chosen.children[i]) ? { ...chosen, children: mapped } : chosen;
  };
  return { ...document, nodes: document.nodes.map(visit) };
}
