import { mediaDeliveryUrl } from "./media-delivery.ts";

/** Compatibility entrypoint: Wedding Moments uses the same policy as every page. */
export function weddingMomentDeliveryImage(
  source: string,
  variant: "tile" | "preview",
): string {
  return mediaDeliveryUrl(source, variant);
}
