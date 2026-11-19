import clientMermaidDresses from "./client-mermaid-dresses.json" with { type: "json" };
import clientBallGowns from "./client-ball-gowns.json" with { type: "json" };
import clientTwoInOneDresses from "./client-two-in-one-dresses.json" with { type: "json" };
import clientRuffledDresses from "./client-ruffled-dresses.json" with { type: "json" };
import imageLinks from "./image-links.json" with { type: "json" };
import { requireImageLink } from "../lib/image-links.ts";
import { priceForDress, type PriceZar } from "../lib/pricing.ts";

/** Catalogue records retain image provenance internally for asset replacement and licensing. */
export type DressCategory = "mermaid" | "ball_gown" | "ruffled" | "modern_tradition" | "two_in_one";
export interface CatalogueProduct {
  readonly id: string;
  readonly name: string;
  readonly category: DressCategory;
  readonly priceZar: PriceZar;
  readonly image: string;
  readonly imageAlt: string;
  readonly detailReference: null;
  readonly previewRoute: `/product/preview/${string}`;
  readonly status: "sample" | "client";
  readonly imageCredit: { readonly photographer: string; readonly sourceUrl: string; readonly provenance: string };
}
export const catalogueCategories = [
  { id: "mermaid", name: "Mermaid", route: "/product-category/mermaid/" },
  { id: "ball_gown", name: "Ball Gown", route: "/product-category/ball_gown/" },
  { id: "ruffled", name: "Ruffled Dresses", route: "/product-category/ruffled/" },
  { id: "modern_tradition", name: "Modern Tradition Dresses", route: "/product-category/modern_tradition/" },
  { id: "two_in_one", name: "2 in 1 Dresses", route: "/product-category/two_in_one/" },
] as const;

/** Primary photographs for all client dress groups come from their CSV imports. */
export const catalogueProducts: readonly CatalogueProduct[] = [
  ...clientMermaidDresses.map(dress => ({
    id: dress.id, name: dress.name, category: "mermaid" as const,
    priceZar: priceForDress(dress.id),
    image: dress.photos[0].url,
    imageAlt: dress.photos[0].alt,
    detailReference: null,
    previewRoute: `/product/preview/${dress.id}` as const,
    status: "client" as const,
    imageCredit: {photographer:"Client supplied",sourceUrl:dress.photos[0].url,provenance:"client-supplied"},
  })),
  ...clientBallGowns.map(gown => ({
    id: gown.id,
    name: gown.name,
    category: "ball_gown" as const,
    priceZar: priceForDress(gown.id),
    image: gown.photos[0].url,
    imageAlt: gown.photos[0].alt,
    detailReference: null,
    previewRoute: `/product/preview/${gown.id}` as const,
    status: "client" as const,
    imageCredit: { photographer: "Client supplied", sourceUrl: gown.photos[0].url, provenance: "client-supplied" },
  })),
  ...clientRuffledDresses.map(dress => ({
    id: dress.id,
    name: dress.name,
    category: "ruffled" as const,
    priceZar: priceForDress(dress.id),
    image: dress.photos[0].url,
    imageAlt: dress.photos[0].alt,
    detailReference: null,
    previewRoute: `/product/preview/${dress.id}` as const,
    status: "client" as const,
    imageCredit: { photographer: "Client supplied", sourceUrl: dress.photos[0].url, provenance: "client-supplied" },
  })),
  {
    id: "sample-modern-tradition-01", priceZar: priceForDress("sample-modern-tradition-01"), name: "Sample 13", category: "modern_tradition", status: "sample",
    image: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-01").url,
    imageAlt: "Modern Tradition wedding dress photograph",
    detailReference: null, previewRoute: "/product/preview/sample-13-modern-tradition",
    imageCredit: { photographer: "Taiye Salawu", sourceUrl: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-01").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-modern-tradition-02", priceZar: priceForDress("sample-modern-tradition-02"), name: "Sample 14", category: "modern_tradition", status: "sample",
    image: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-02").url,
    imageAlt: "Modern Tradition wedding dress photograph",
    detailReference: null, previewRoute: "/product/preview/sample-14-modern-tradition",
    imageCredit: { photographer: "Taiye Salawu", sourceUrl: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-02").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-modern-tradition-03", priceZar: priceForDress("sample-modern-tradition-03"), name: "Sample 15", category: "modern_tradition", status: "sample",
    image: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-03").url,
    imageAlt: "Modern Tradition wedding dress photograph",
    detailReference: null, previewRoute: "/product/preview/sample-15-modern-tradition",
    imageCredit: { photographer: "Mensa Bonsu", sourceUrl: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-03").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-modern-tradition-04", priceZar: priceForDress("sample-modern-tradition-04"), name: "Sample 16", category: "modern_tradition", status: "sample",
    image: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-04").url,
    imageAlt: "Modern Tradition wedding dress photograph",
    detailReference: null, previewRoute: "/product/preview/sample-16-modern-tradition",
    imageCredit: { photographer: "Milly Lavish", sourceUrl: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-04").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  ...clientTwoInOneDresses.map(dress => ({
    id: dress.id, name: dress.name, category: "two_in_one" as const,
    priceZar: priceForDress(dress.id),
    image: dress.photos[0].url,
    imageAlt: dress.photos[0].alt,
    detailReference: null,
    previewRoute: `/product/preview/${dress.id}` as const,
    status: "client" as const,
    imageCredit: {photographer:"Client supplied",sourceUrl:dress.photos[0].url,provenance:"client-supplied"},
  })),

];
