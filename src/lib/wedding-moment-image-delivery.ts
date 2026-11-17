/**
 * Keep original client URLs as the source of truth; use smaller ImageKit
 * derivatives for gallery tiles and high-quality, uncropped popup previews.
 * Never transform arbitrary providers or rewrite an existing transformation.
 */
export function weddingMomentDeliveryImage(
  source: string,
  variant: "tile" | "preview",
): string {
  const url = new URL(source);
  if (url.protocol !== "https:" || url.hostname !== "ik.imagekit.io" ||
      url.searchParams.has("tr")) return source;

  const transform = variant === "tile"
    ? "w-640,h-640,c-at_max,q-72,f-auto"
    : "w-1920,h-1920,c-at_max,q-82,f-auto";
  return source + (url.search ? "&" : "?") + "tr=" + transform;
}
