import { catalogueProducts, catalogueCategories, type CatalogueProduct } from "../data/catalogue.ts";
import { displayDressPrice } from "./pricing.ts";
import { photosForDress, type DressGalleryPhoto } from "./dress-gallery.ts";
import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";

const elements = (nodes: DocumentNode[]) => nodes.filter((n): n is DocumentElement => typeof n !== "string");
const all = (nodes: DocumentNode[]): DocumentElement[] => elements(nodes).flatMap(n => [n, ...all(n.children)]);
const node = (tag: string, attrs: Record<string, string>, children: DocumentNode[]): DocumentElement => ({ tag, attrs, children });

/** Primary catalogue photographs are shared by book, grid and detail pages. */
export const sampleGalleryImages: Record<string, {src: string; width: number; height: number}> = Object.fromEntries(
  catalogueProducts.map(product => [product.id, {src:product.image,width:1200,height:1800}]),
);

const categoryName = (product: CatalogueProduct) => catalogueCategories.find(item => item.id === product.category)?.name ?? "Wedding Dresses";
export function sampleDetailTitle(product: CatalogueProduct): string {
  return product.status === "client" ? product.name : `${product.name} — ${categoryName(product)}`;
}

export function sampleFittingMessage(product: CatalogueProduct): string {
  if(product.status === "client") return `Hello Redcarpert Wedding Dresses!\n\nI am interested in ${sampleDetailTitle(product)} and would like to enquire about a fitting.\n\nCould you please confirm the price and availability?\n\nThank you.`;
  return `Hello Redcarpert Wedding Dresses!\n\nI would like to enquire about a fitting. I was viewing the ${sampleDetailTitle(product)} demonstration. I understand this photograph is sample imagery, not confirmed Redcarpert inventory.\n\nCould you please provide more information?\n\nThank you.`;
}

/** Dress detail document from one guarded source capture; legacy routes stay intact. */
export function createProductDetailPreview(
  source: SiteDocumentData,
  product: CatalogueProduct,
  galleryMappings?: Readonly<Record<string, readonly DressGalleryPhoto[]>>,
): SiteDocumentData {
  const fail = (detail: string): never => { throw new Error(`Product detail preview: incompatible ${detail}`); };
  if (source.route !== "/product/arabella") fail("source route");
  const original = catalogueProducts.find(entry => entry.id === product.id);
  if (!original || JSON.stringify(product) !== JSON.stringify(original)
    || !["sample","client"].includes(product.status) || product.detailReference !== null) fail("sample mapping");
  const one = (nodes: DocumentElement[], predicate: (n: DocumentElement) => boolean, detail: string) => {
    const matches = nodes.filter(predicate);
    return matches.length === 1 ? matches[0] : fail(detail);
  };
  const root = one(all(source.nodes), n => n.attrs.id === "product-15828", "product root");
  const parts = elements(root.children);
  if (root.tag !== "div" || parts.length !== 4 || parts.map(n => n.attrs.class).join("|") !== "images|summary entry-summary|woocommerce-tabs wc-tabs-wrapper|related products") fail("product sections");
  const [images, summary, tabs, related] = parts;
  const slider = one(elements(images.children), n => n.attrs.class === "slider wpgis-slider-for", "slider");
  const thumbs = one(elements(images.children), n => n.attrs.id === "wpgis-gallery", "thumbnails");
  if (elements(slider.children).length !== 5 || elements(thumbs.children).length !== 5) fail("gallery count");
  const firstSlide = elements(slider.children)[0];
  const firstImage = elements(firstSlide.children)[0];
  if (firstSlide.attrs.class !== "zoom" || firstImage.tag !== "img" || firstImage.attrs.width !== "848" || firstImage.attrs.height !== "1264"
    || firstImage.attrs.src !== "/site-assets/da2a2c0ad7f169a475.png") fail("gallery frame");
  const title = one(elements(summary.children), n => n.tag === "h1" && n.attrs.class === "product_title entry-title", "title");
  const price = one(elements(summary.children), n => n.attrs.class === "price", "shipping slot");
  if (title.children.join("") !== "Arabella" || price.children.join("") !== "Worldwide Shipping" || elements(summary.children).length !== 3) fail("summary content");
  if (elements(tabs.children).map(n => n.attrs.id || n.attrs.class).join("|") !== "tabs wc-tabs|tab-description|tab-reviews"
    || all(related.children).filter(n => n.tag === "li").length !== 3) fail("tabs/related sections");
  // SHARE is a sibling of the captured product, not part of its summary/gallery.
  const share = one(all(source.nodes), n => n.attrs.class === "social-share", "share section");
  const parent = one(all(source.nodes), n => elements(n.children).includes(root), "product parent");
  const shareItems = all(share.children).filter(n => n.tag === "li");
  if (share.tag !== "div" || !elements(parent.children).includes(share)
    || elements(share.children)[0]?.children.join("") !== "Share"
    || shareItems.map(n => n.attrs.title).join("|") !== "Facebook|Twitter|Google+|Pinterest"
    || shareItems.some(n => n.attrs["data-url"] !== "https://bridalvanesa.com/product/arabella/")) fail("share content");

  const category = categoryName(product);
  const client = product.status === "client";
  const gallery = sampleGalleryImages[product.id as keyof typeof sampleGalleryImages];
  const photos = photosForDress(product, galleryMappings);
  const hasGallery = photos.length > 1;
  const arrow = (direction: "previous" | "next") =>
    node("button", {
      type: "button",
      class: "redcarpert-gallery-arrow redcarpert-gallery-arrow-" + direction,
      ["data-gallery-" + direction]: "",
      "aria-label": direction === "previous" ? "Previous dress photograph" : "Next dress photograph",
    }, [
      node("i", { class: direction === "previous" ? "fa-solid fa-chevron-left" : "fa-solid fa-chevron-right", "aria-hidden": "true" }, []),
    ]);
  const dots = hasGallery ? node("div", { class: "redcarpert-detail-gallery-pagination", "aria-label": "Dress photograph navigation" }, [
    ...photos.map((_, index) => node("button", {
      type: "button",
      class: index === 0 ? "redcarpert-gallery-dot is-active" : "redcarpert-gallery-dot",
      "data-gallery-index": String(index),
      "aria-label": "View photograph " + (index + 1) + " of " + photos.length,
      "aria-pressed": index === 0 ? "true" : "false",
    }, [])),
    node("span", { class: "redcarpert-gallery-counter", "data-gallery-counter": "", "aria-live": "polite", "aria-atomic": "true" }, [
      "01 / " + String(photos.length).padStart(2, "0"),
    ]),
  ]) : null;
  const preview = { ...root, attrs: { id: `detail-${product.id}`, class: "product", "data-detail-preview": product.id }, children: [
    { ...images, attrs: {
      ...images.attrs,
      "data-detail-gallery": product.id,
      "data-gallery-photos": JSON.stringify(photos),
      "data-gallery-origin": client ? "client" : "sample",
      ...(hasGallery ? { tabindex: "0", role: "region", "aria-label": product.name + " photo gallery", "aria-keyshortcuts": "ArrowLeft ArrowRight" } : {}),
    }, children: [
      { ...slider, attrs: {
        ...slider.attrs,
        // The inherited slick/gallery plugin must not re-clone our own multi-photo controls.
        ...(hasGallery ? { class: "slider redcarpert-multi-photo-slider" } : {}),
      }, children: [node("div", { class: "zoom", "data-sample-frame": "true" }, [
        node("img", {
          src: photos[0].url, width: String(gallery.width), height: String(gallery.height),
          class: "attachment-shop_single size-shop_single wp-post-image",
          alt: photos[0].alt, decoding: "async", fetchpriority: "high", "data-gallery-active-image": "",
        }, []),
        node("a", {
          href: photos[0].url, class: "wpgis-popup fa fa-expand",
          "data-fancybox": "product-gallery", "data-gallery-enlarge": "",
          "aria-label": "Enlarge dress photograph",
        }, []),
        ...(hasGallery ? [arrow("previous"), arrow("next")] : []),
      ])] },
      ...(dots ? [dots] : []),
    ] },
    { ...summary, attrs: { ...summary.attrs, "data-redcarpert-detail-summary": "true" }, children: [
      node("section", { class: "redcarpert-detail-card", "aria-label": "Dress information" }, [
        node("p", { class: "redcarpert-detail-collection" }, [client ? "REDCARPERT COLLECTION" : category.endsWith("Dresses") ? category : category + " Collection"]),
        { ...title, attrs: { ...title.attrs, class: "product_title entry-title redcarpert-detail-name" }, children: [product.name] },
        node("div", { class: "redcarpert-detail-divider", "aria-hidden": "true" }, []),
        node("div", { class: "redcarpert-detail-pricing" }, [
          node("span", { class: "redcarpert-detail-price-label" }, [client ? "PRICE" : "ILLUSTRATIVE PRICE"]),
          node("p", { class: "redcarpert-detail-price-value", "data-dress-price": "" },
            [displayDressPrice(product.priceZar)]),
        ]),
        node("div", { class: "redcarpert-detail-actions" }, [
          node("button", { type: "button", class: "button redcarpert-detail-fitting-button", "data-whatsapp-preview": "", "aria-haspopup": "dialog" }, ["Book a Fitting"]),
          node("small", { class: "redcarpert-detail-enquiry-note" }, ["Enquire via WhatsApp"]),
        ]),
      ]),
      node("p", { class: "sample-detail-notice" },
        [client
          ? "Client-supplied dress photographs. Please enquire to confirm price, availability and fitting details."
          : "Sample imagery and indicative pricing only — not confirmed Redcarpert inventory or a final quotation."]),
    ] },
  ] };
  const visit = (n: DocumentNode): DocumentNode | null => {
    if (typeof n === "string") return n;
    if (n === share) return null;
    if (n === root) return preview;
    const children = n.children.map(visit).filter((child): child is DocumentNode => child !== null);
    return children.length !== n.children.length || children.some((c, i) => c !== n.children[i]) ? { ...n, children } : n;
  };
  return { ...source, route: product.previewRoute,
    title: client ? `${sampleDetailTitle(product)} | Redcarpert Wedding Dresses` : `${sampleDetailTitle(product)} | Sample Preview | Redcarpert`,
    description: client
      ? "Explore client-supplied photographs of this Ball Gown wedding dress. Enquire for price, availability and fitting information."
      : "Sample dress detail demonstration. Stock imagery, not confirmed Redcarpert inventory.",
    nodes: source.nodes.map(visit).filter((n): n is DocumentNode => n !== null) };
}
