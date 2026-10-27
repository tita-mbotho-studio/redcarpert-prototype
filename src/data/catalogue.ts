/** Stock sample imagery only. No record represents confirmed Redcarpert inventory. */
export type DressCategory = "mermaid" | "ball_gown";
export interface CatalogueProduct {
  readonly id: string;
  readonly name: string;
  readonly category: DressCategory;
  readonly image: string;
  readonly imageAlt: string;
  /** Verified client product destination only; sample demonstrations never populate this. */
  readonly detailReference: string | null;
  /** Explicit demonstration route, separate from verified product references. */
  readonly previewRoute: "/product/preview/sample-01-mermaid" | "/product/preview/sample-02-ball-gown";
  readonly status: "sample";
  readonly imageCredit: { readonly photographer: string; readonly sourceUrl: string; readonly provenance: string };
}
export const catalogueCategories = [
  { id: "mermaid", name: "Mermaid", route: "/product-category/mermaid/" },
  { id: "ball_gown", name: "Ball Gown", route: "/product-category/ball_gown/" },
] as const;
export const catalogueProducts: readonly CatalogueProduct[] = [
  {
    id: "sample-mermaid", name: "Sample 01", category: "mermaid", status: "sample",
    image: "/redcarpert/home/hero-pexels-sample.webp",
    imageAlt: "Stock bridal photograph of a fitted gown — sample imagery, not Redcarpert inventory",
    detailReference: null,
    previewRoute: "/product/preview/sample-01-mermaid",
    imageCredit: { photographer: "Trần Long", sourceUrl: "https://www.pexels.com/photo/elegant-asian-bride-on-path-in-countryside-5984238/", provenance: "codex-reports/05-homepage-imagery.md" },
  },
  {
    id: "sample-ball-gown", name: "Sample 02", category: "ball_gown", status: "sample",
    image: "/redcarpert/home/collection-pexels-sample.webp",
    imageAlt: "Stock bridal photograph of a full gown — sample imagery, not Redcarpert inventory",
    detailReference: null,
    previewRoute: "/product/preview/sample-02-ball-gown",
    imageCredit: { photographer: "Thalia villa", sourceUrl: "https://www.pexels.com/photo/woman-in-white-wedding-dress-4277970/", provenance: "codex-reports/05-homepage-imagery.md" },
  },
];
