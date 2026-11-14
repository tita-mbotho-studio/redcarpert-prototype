import imageLinks from "./image-links.json" with { type: "json" };
import { requireImageLink } from "../lib/image-links.ts";
import { priceForDress, type PriceZar } from "../lib/pricing.ts";

/** Twenty curated Pexels demonstration dresses. Never describe these as Redcarpert stock. */
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
  readonly status: "sample";
  readonly imageCredit: { readonly photographer: string; readonly sourceUrl: string; readonly provenance: string };
}
export const catalogueCategories = [
  { id: "mermaid", name: "Mermaid", route: "/product-category/mermaid/" },
  { id: "ball_gown", name: "Ball Gown", route: "/product-category/ball_gown/" },
  { id: "ruffled", name: "Ruffled Dresses", route: "/product-category/ruffled/" },
  { id: "modern_tradition", name: "Modern Tradition Dresses", route: "/product-category/modern_tradition/" },
  { id: "two_in_one", name: "2 in 1 Dresses", route: "/product-category/two_in_one/" },
] as const;

/** Images stay on Pexels servers: there is no image fetch/download in the build. */
export const catalogueProducts: readonly CatalogueProduct[] = [
  {
    id: "sample-mermaid", priceZar: priceForDress("sample-mermaid"), name: "Sample 01", category: "mermaid", status: "sample",
    image: requireImageLink(imageLinks.products.mermaid, "sample-mermaid").url,
    imageAlt: "Pexels demonstration bridal photograph (Mermaid silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-01-mermaid",
    imageCredit: { photographer: "Trần Long", sourceUrl: requireImageLink(imageLinks.products.mermaid, "sample-mermaid").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-mermaid-02", priceZar: priceForDress("sample-mermaid-02"), name: "Sample 03", category: "mermaid", status: "sample",
    image: requireImageLink(imageLinks.products.mermaid, "sample-mermaid-02").url,
    imageAlt: "Pexels demonstration bridal photograph (Mermaid silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-03-mermaid",
    imageCredit: { photographer: "Tangerine Vitamins", sourceUrl: requireImageLink(imageLinks.products.mermaid, "sample-mermaid-02").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-mermaid-03", priceZar: priceForDress("sample-mermaid-03"), name: "Sample 04", category: "mermaid", status: "sample",
    image: requireImageLink(imageLinks.products.mermaid, "sample-mermaid-03").url,
    imageAlt: "Pexels demonstration bridal photograph (Mermaid silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-04-mermaid",
    imageCredit: { photographer: "Bestbe Models", sourceUrl: requireImageLink(imageLinks.products.mermaid, "sample-mermaid-03").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-mermaid-04", priceZar: priceForDress("sample-mermaid-04"), name: "Sample 05", category: "mermaid", status: "sample",
    image: requireImageLink(imageLinks.products.mermaid, "sample-mermaid-04").url,
    imageAlt: "Pexels demonstration bridal photograph (Mermaid silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-05-mermaid",
    imageCredit: { photographer: "Genaro Servín", sourceUrl: requireImageLink(imageLinks.products.mermaid, "sample-mermaid-04").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ball-gown", priceZar: priceForDress("sample-ball-gown"), name: "Sample 02", category: "ball_gown", status: "sample",
    image: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown").url,
    imageAlt: "Pexels demonstration bridal photograph (Ball Gown silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-02-ball-gown",
    imageCredit: { photographer: "Thalia villa", sourceUrl: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ball-gown-02", priceZar: priceForDress("sample-ball-gown-02"), name: "Sample 06", category: "ball_gown", status: "sample",
    image: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown-02").url,
    imageAlt: "Pexels demonstration bridal photograph (Ball Gown silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-06-ball-gown",
    imageCredit: { photographer: "Hiren Lad", sourceUrl: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown-02").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ball-gown-03", priceZar: priceForDress("sample-ball-gown-03"), name: "Sample 07", category: "ball_gown", status: "sample",
    image: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown-03").url,
    imageAlt: "Pexels demonstration bridal photograph (Ball Gown silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-07-ball-gown",
    imageCredit: { photographer: "Andrea Prochilo", sourceUrl: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown-03").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ball-gown-04", priceZar: priceForDress("sample-ball-gown-04"), name: "Sample 08", category: "ball_gown", status: "sample",
    image: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown-04").url,
    imageAlt: "Pexels demonstration bridal photograph (Ball Gown silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-08-ball-gown",
    imageCredit: { photographer: "Andrea Prochilo", sourceUrl: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown-04").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ruffled-01", priceZar: priceForDress("sample-ruffled-01"), name: "Sample 09", category: "ruffled", status: "sample",
    image: requireImageLink(imageLinks.products.ruffled, "sample-ruffled-01").url,
    imageAlt: "Pexels demonstration photograph (Ruffled Dresses styling inspiration) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-09-ruffled",
    imageCredit: { photographer: "Matilda Jacob", sourceUrl: requireImageLink(imageLinks.products.ruffled, "sample-ruffled-01").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ruffled-02", priceZar: priceForDress("sample-ruffled-02"), name: "Sample 10", category: "ruffled", status: "sample",
    image: requireImageLink(imageLinks.products.ruffled, "sample-ruffled-02").url,
    imageAlt: "Pexels demonstration photograph (Ruffled Dresses styling inspiration) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-10-ruffled",
    imageCredit: { photographer: "DΛVΞ GΛRCIΛ", sourceUrl: requireImageLink(imageLinks.products.ruffled, "sample-ruffled-02").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ruffled-03", priceZar: priceForDress("sample-ruffled-03"), name: "Sample 11", category: "ruffled", status: "sample",
    image: requireImageLink(imageLinks.products.ruffled, "sample-ruffled-03").url,
    imageAlt: "Pexels demonstration photograph (Ruffled Dresses styling inspiration) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-11-ruffled",
    imageCredit: { photographer: "Olga Solodilova", sourceUrl: requireImageLink(imageLinks.products.ruffled, "sample-ruffled-03").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ruffled-04", priceZar: priceForDress("sample-ruffled-04"), name: "Sample 12", category: "ruffled", status: "sample",
    image: requireImageLink(imageLinks.products.ruffled, "sample-ruffled-04").url,
    imageAlt: "Pexels demonstration photograph (Ruffled Dresses styling inspiration) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-12-ruffled",
    imageCredit: { photographer: "Rina Mayer", sourceUrl: requireImageLink(imageLinks.products.ruffled, "sample-ruffled-04").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-modern-tradition-01", priceZar: priceForDress("sample-modern-tradition-01"), name: "Sample 13", category: "modern_tradition", status: "sample",
    image: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-01").url,
    imageAlt: "Pexels demonstration photograph (Modern Tradition Dresses styling inspiration) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-13-modern-tradition",
    imageCredit: { photographer: "Taiye Salawu", sourceUrl: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-01").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-modern-tradition-02", priceZar: priceForDress("sample-modern-tradition-02"), name: "Sample 14", category: "modern_tradition", status: "sample",
    image: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-02").url,
    imageAlt: "Pexels demonstration photograph (Modern Tradition Dresses styling inspiration) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-14-modern-tradition",
    imageCredit: { photographer: "Taiye Salawu", sourceUrl: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-02").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-modern-tradition-03", priceZar: priceForDress("sample-modern-tradition-03"), name: "Sample 15", category: "modern_tradition", status: "sample",
    image: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-03").url,
    imageAlt: "Pexels demonstration photograph (Modern Tradition Dresses styling inspiration) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-15-modern-tradition",
    imageCredit: { photographer: "Milly Lavish", sourceUrl: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-03").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-modern-tradition-04", priceZar: priceForDress("sample-modern-tradition-04"), name: "Sample 16", category: "modern_tradition", status: "sample",
    image: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-04").url,
    imageAlt: "Pexels demonstration photograph (Modern Tradition Dresses styling inspiration) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-16-modern-tradition",
    imageCredit: { photographer: "Taiye Salawu", sourceUrl: requireImageLink(imageLinks.products.modern_tradition, "sample-modern-tradition-04").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-two-in-one-01", priceZar: priceForDress("sample-two-in-one-01"), name: "Sample 17", category: "two_in_one", status: "sample",
    image: requireImageLink(imageLinks.products.two_in_one, "sample-two-in-one-01").url,
    imageAlt: "Pexels demonstration photograph (Two-in-one style inspiration; no conversion mechanism verified) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-17-two-in-one",
    imageCredit: { photographer: "Esma Atak", sourceUrl: requireImageLink(imageLinks.products.two_in_one, "sample-two-in-one-01").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-two-in-one-02", priceZar: priceForDress("sample-two-in-one-02"), name: "Sample 18", category: "two_in_one", status: "sample",
    image: requireImageLink(imageLinks.products.two_in_one, "sample-two-in-one-02").url,
    imageAlt: "Pexels demonstration photograph (Two-in-one style inspiration; no conversion mechanism verified) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-18-two-in-one",
    imageCredit: { photographer: "Esma Atak", sourceUrl: requireImageLink(imageLinks.products.two_in_one, "sample-two-in-one-02").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-two-in-one-03", priceZar: priceForDress("sample-two-in-one-03"), name: "Sample 19", category: "two_in_one", status: "sample",
    image: requireImageLink(imageLinks.products.two_in_one, "sample-two-in-one-03").url,
    imageAlt: "Pexels demonstration photograph (Two-in-one style inspiration; no conversion mechanism verified) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-19-two-in-one",
    imageCredit: { photographer: "Esma Atak", sourceUrl: requireImageLink(imageLinks.products.two_in_one, "sample-two-in-one-03").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-two-in-one-04", priceZar: priceForDress("sample-two-in-one-04"), name: "Sample 20", category: "two_in_one", status: "sample",
    image: requireImageLink(imageLinks.products.two_in_one, "sample-two-in-one-04").url,
    imageAlt: "Pexels demonstration photograph (Two-in-one style inspiration; no conversion mechanism verified) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-20-two-in-one",
    imageCredit: { photographer: "Esma Atak", sourceUrl: requireImageLink(imageLinks.products.two_in_one, "sample-two-in-one-04").sourceUrl, provenance: "docs/asset-credits.md" },
  },
];
