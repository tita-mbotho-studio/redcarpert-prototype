import clientMermaidDresses from "../data/client-mermaid-dresses.json" with { type: "json" };
import clientBallGowns from "../data/client-ball-gowns.json" with { type: "json" };
import clientTwoInOneDresses from "../data/client-two-in-one-dresses.json" with { type: "json" };
import clientRuffledDresses from "../data/client-ruffled-dresses.json" with { type: "json" };
import extraGalleryImages from "../data/dress-gallery-images.json" with { type: "json" };
import { catalogueProducts, type CatalogueProduct } from "../data/catalogue.ts";

export interface DressGalleryPhoto {
  readonly url: string;
  readonly alt: string;
}

/**
 * The catalogue photograph always comes first. Optional subsequent photos are
 * mapped by stable dress ID; do not show unrelated stock photos as dress angles.
 * Client gown galleries live in their category manifests; other photos may be
 * added to src/data/dress-gallery-images.json.
 */
export const additionalDressPhotos: Readonly<Record<string, readonly DressGalleryPhoto[]>> = {
  ...extraGalleryImages,
  ...Object.fromEntries([...clientMermaidDresses, ...clientBallGowns,
    ...clientRuffledDresses, ...clientTwoInOneDresses]
    .map(dress => [dress.id, dress.photos.slice(1)])),
};

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
      const product = catalogueProducts.find(item=>item.id===productId);
      if (product?.status === 'client') {
        const folder = {
          mermaid:'mermaid-dresses',ball_gown:'ball-gown-dresses',
          ruffled:'ruffled-dresses',two_in_one:'2-in-1-dresses',
          modern_tradition:'',
        }[product.category];
        const prefix = 'https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-dresses/' + folder + '/';
        const filename = new URL(photo.url).pathname.split('/').at(-1) ?? '';
        const match = new RegExp('^' + productId + '-([0-9]{2})[.]webp$', 'i').exec(filename);
        if (!photo.url.toLowerCase().startsWith(prefix.toLowerCase()) || !match ||
            Number(match[1])<2 || Number(match[1])>99 ||
            !/^(?:|[?]updatedAt=\d{13})$/.test(new URL(photo.url).search)) {
          throw new Error('Client gallery photograph belongs to a different dress: '+productId);
        }
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
