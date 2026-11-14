import extraGalleryImages from "../data/dress-gallery-images.json" with { type: "json" };
import { catalogueProducts, type CatalogueProduct } from "../data/catalogue.ts";

export interface DressGalleryPhoto {
  readonly url: string;
  readonly alt: string;
}

/**
 * The catalogue photograph always comes first. Optional subsequent photos are
 * mapped by stable dress ID; do not show unrelated stock photos as dress angles.
 * Add verified client photographs to src/data/dress-gallery-images.json.
 */
export const additionalDressPhotos = extraGalleryImages as Readonly<Record<string, readonly DressGalleryPhoto[]>>;

const approvedPhotoUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "ik.imagekit.io" || url.hostname === "images.pexels.com") &&
      !url.username && !url.password;
  } catch {
    return false;
  }
};

export function validateDressGalleryMappings(
  mappings: Readonly<Record<string, readonly DressGalleryPhoto[]>> = additionalDressPhotos,
): void {
  const known = new Set(catalogueProducts.map(product => product.id));
  for (const [productId, photos] of Object.entries(mappings)) {
    if (!known.has(productId)) throw new Error("Unrecognized dress gallery ID: " + productId);
    if (!Array.isArray(photos) || photos.length > 15) throw new Error("Invalid photo count for " + productId);
    const urls = new Set<string>();
    for (const photo of photos) {
      if (typeof photo?.url !== "string" || !approvedPhotoUrl(photo.url) ||
        typeof photo?.alt !== "string" || photo.alt.trim().length < 5 || photo.alt.length > 180) {
        throw new Error("Invalid gallery photo or alternative text for " + productId);
      }
      if (urls.has(photo.url)) throw new Error("Repeated gallery photograph for " + productId);
      urls.add(photo.url);
    }
  }
}

export function photosForDress(
  product: CatalogueProduct,
  mappings: Readonly<Record<string, readonly DressGalleryPhoto[]>> = additionalDressPhotos,
): readonly DressGalleryPhoto[] {
  validateDressGalleryMappings(mappings);
  const extras = mappings[product.id] ?? [];
  if (extras.some(photo => photo.url === product.image)) throw new Error("Gallery duplicates the primary photograph for " + product.id);
  return [{ url: product.image, alt: product.imageAlt }, ...extras];
}
