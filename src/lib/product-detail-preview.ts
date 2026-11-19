import { catalogueProducts, catalogueCategories, type CatalogueProduct } from "../data/catalogue.ts";
import { displayRentalPriceForDress, displaySalePriceForDress, salePriceLabelForDress, RENTAL_CONDITION_NOTE } from "./pricing.ts";
import { dressFittingMessage } from "./whatsapp-messages.ts";
import { photosForDress, type DressGalleryPhoto } from "./dress-gallery.ts";
import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";

const elements = (nodes: DocumentNode[]) => nodes.filter((n): n is DocumentElement => typeof n !== "string");
const all = (nodes: DocumentNode[]): DocumentElement[] => elements(nodes).flatMap(n => [n, ...all(n.children)]);
const node = (tag: string, attrs: Record<string, string>, children: DocumentNode[]): DocumentElement => ({ tag, attrs, children });

/** Primary catalogue photographs are shared by book, grid and detail pages. */
export const dressImageDimensions: Record<string, {src: string; width: number; height: number}> = Object.fromEntries(
  catalogueProducts.map(product => [product.id, {src:product.image,width:1200,height:1800}]),
);

const categoryName = (product: CatalogueProduct) => catalogueCategories.find(item => item.id === product.category)?.name ?? "Wedding Dresses";
export function dressDetailTitle(product: CatalogueProduct): string {
  return product.name;
}

/** Same-category suggestions, excluding the current gown, in stable catalogue order. */
export function relatedDressesFor(product: CatalogueProduct, limit = 4): readonly CatalogueProduct[] {
  const group = catalogueProducts.filter(item => item.category === product.category);
  const index = group.findIndex(item => item.id === product.id);
  if (index < 0) throw new Error("Related dresses: unrecognized catalogue product " + product.id);
  if (!Number.isSafeInteger(limit) || limit < 0) throw new Error("Related dresses: invalid display limit");
  return [...group.slice(index + 1), ...group.slice(0, index)].slice(0, limit);
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
    || product.detailReference !== null) fail("dress mapping");
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
  const gallery = dressImageDimensions[product.id as keyof typeof dressImageDimensions];
  const photos = photosForDress(product, galleryMappings);
  const relatedDresses = relatedDressesFor(product);
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
      "data-gallery-origin": "client",
      ...(hasGallery ? { tabindex: "0", role: "region", "aria-label": product.name + " photo gallery", "aria-keyshortcuts": "ArrowLeft ArrowRight" } : {}),
    }, children: [
      { ...slider, attrs: {
        ...slider.attrs,
        // The inherited slick/gallery plugin must not re-clone our own multi-photo controls.
        class: hasGallery ? "slider redcarpert-multi-photo-slider" : "slider redcarpert-single-photo-slider",
      }, children: [node("div", { class: "redcarpert-detail-photo-frame", "data-dress-frame": "true" }, [
        node("img", {
          src: photos[0].url, width: String(gallery.width), height: String(gallery.height),
          class: "attachment-shop_single size-shop_single wp-post-image",
          alt: photos[0].alt, decoding: "async", fetchpriority: "high",
          "data-gallery-active-image": "", tabindex: "0", role: "button",
          "aria-haspopup": "dialog", "aria-label": "Enlarge photograph of " + product.name,
        }, []),
        ...(hasGallery ? [arrow("previous"), arrow("next")] : []),
      ])] },
      ...(dots ? [dots] : []),
    ] },
    { ...summary, attrs: { ...summary.attrs, "data-redcarpert-detail-summary": "true" }, children: [
      node("section", { class: "redcarpert-detail-card", "aria-label": "Dress information" }, [
        { ...title, attrs: { ...title.attrs, class: "product_title entry-title redcarpert-detail-name" }, children: [product.name] },
        node("div", { class: "redcarpert-detail-divider", "aria-hidden": "true" }, []),
        node("div", { class: "redcarpert-detail-pricing", "aria-label": "Sale and rental pricing" }, [
          node("div", { class: "redcarpert-detail-price-options" }, [
            node("div", { class: "redcarpert-detail-price-option" }, [
              node("span", { class: "redcarpert-detail-price-label" },
                [salePriceLabelForDress(product.id).toUpperCase()]),
              node("p", { class: "redcarpert-detail-price-value", "data-sale-price": "" },
                [displaySalePriceForDress(product.id)]),
            ]),
            node("div", { class: "redcarpert-detail-price-option" }, [
              node("span", { class: "redcarpert-detail-price-label" }, ["RENTAL PRICE RANGE"]),
              node("p", { class: "redcarpert-detail-price-value", "data-rental-price": "" },
                [displayRentalPriceForDress(product.id)]),
            ]),
          ]),
          node("p", { class: "redcarpert-detail-price-disclaimer" }, [RENTAL_CONDITION_NOTE]),
        ]),
        node("div", { class: "redcarpert-detail-actions redcarpert-icon-cta" }, [
          node("p", { class: "redcarpert-icon-cta-label" }, ["Book a Fitting"]),
          node("button", {
            type: "button",
            class: "button redcarpert-icon-cta-button redcarpert-detail-fitting-button",
            "data-whatsapp-preview": "",
            "aria-haspopup": "dialog",
            "aria-label": "Book a Fitting via WhatsApp",
          }, [
            node("i", { class: "fa-brands fa-whatsapp", "aria-hidden": "true" }, []),
          ]),
        ]),
      ]),
    ] },
    ...(relatedDresses.length > 0 ? [
      node("section", {
        class: "redcarpert-related-dresses",
        "data-related-count": String(relatedDresses.length),
        "aria-labelledby": "redcarpert-related-title-" + product.id,
      }, [
        node("h2", { id: "redcarpert-related-title-" + product.id },
          ["More from the " + category + " Collection"]),
        node("ul", { class: "redcarpert-related-grid" },
          relatedDresses.map(dress =>
            node("li", { class: "redcarpert-related-card", "data-related-dress": dress.id }, [
              node("a", { href: dress.previewRoute + "/", "aria-label": "View " + dressDetailTitle(dress) }, [
                node("img", {
                  src: dress.image,
                  alt: dress.imageAlt,
                  loading: "lazy",
                  decoding: "async",
                  width: "740",
                  height: "740",
                  "data-media-preset": "card",
                }, []),
                node("span", { class: "redcarpert-related-name" },
                  [dress.name]),
                node("div", { class: "redcarpert-related-prices", "aria-label": "Sale and rental pricing" }, [
                  node("div", { class: "redcarpert-related-price-pair" }, [
                    node("span", { class: "redcarpert-related-price-label" },
                      [salePriceLabelForDress(dress.id)]),
                    node("span", { class: "redcarpert-related-price-value", "data-related-sale-price": dress.id },
                      [displaySalePriceForDress(dress.id)]),
                  ]),
                  node("div", { class: "redcarpert-related-price-pair" }, [
                    node("span", { class: "redcarpert-related-price-label" }, ["Rental Price Range"]),
                    node("span", { class: "redcarpert-related-price-value", "data-related-rental-price": dress.id },
                      [displayRentalPriceForDress(dress.id)]),
                  ]),
                ]),
              ]),
            ]),
          ),
        ),
        node("p", { class: "redcarpert-related-disclaimer" }, [RENTAL_CONDITION_NOTE]),
      ]),
    ] : []),
  ] };
  // The photo viewer is mounted outside the inherited product/slider markup
  // so vendor zoom, Fancybox, and slide-cloning code cannot own its events.
  // Reuse Wedding Moments' approved borderless image presentation exactly.
  const imageDialog = node("dialog", {
    class: "redcarpert-wedding-dialog redcarpert-dress-photo-dialog",
    "data-dress-photo-dialog": "",
    "aria-label": "Enlarged wedding dress photograph",
  }, [
    node("div", { class: "redcarpert-moment-dialog-inner" }, [
      node("img", {
        class: "redcarpert-wedding-preview-image",
        "data-dress-preview-photo": "", alt: "", decoding: "async",
      }, []),
      node("button", {
        type: "button", class: "redcarpert-wedding-preview-close",
        "data-dress-preview-close": "", "aria-label": "Close enlarged photograph",
      }, [node("i", { class: "fa-solid fa-xmark", "aria-hidden": "true" }, [])]),
    ]),
  ]);
  const visit = (n: DocumentNode): DocumentNode | null => {
    if (typeof n === "string") return n;
    if (n === share) return null;
    if (n === root) return preview;
    const children = n.children.map(visit).filter((child): child is DocumentNode => child !== null);
    return children.length !== n.children.length || children.some((c, i) => c !== n.children[i]) ? { ...n, children } : n;
  };
  return { ...source, route: product.previewRoute,
    title: `${dressDetailTitle(product)} | Redcarpert Wedding Dresses`,
    description: "Explore " + dressDetailTitle(product) + ", view sale and rental prices, and book your bridal fitting with Redcarpert.",
    nodes: [...source.nodes.map(visit).filter((n): n is DocumentNode => n !== null), imageDialog] };
}
