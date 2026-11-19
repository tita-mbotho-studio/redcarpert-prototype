/**
 * Site-wide, context-aware media delivery.
 *
 * Original uploaded URLs always remain the source of truth in JSON and gallery
 * metadata. Only trusted image CDNs are transformed; local assets, unknown
 * hosts, videos and already-transformed ImageKit URLs are left alone.
 *
 * Add future photos to existing manifests: call mediaDeliveryUrl(source, preset)
 * when constructing HTML, or let the shared HTML renderer handle ordinary imgs.
 */
export type MediaImagePreset =
  | "tile" | "card" | "detail" | "preview" | "lookbook" | "team" | "hero";

const presets: Record<MediaImagePreset, { width: number; height: number; quality: number }> = {
  tile:     { width: 640,  height: 640,  quality: 72 },
  card:     { width: 740,  height: 740,  quality: 76 },
  detail:   { width: 1280, height: 1800, quality: 82 },
  preview:  { width: 1920, height: 1920, quality: 82 },
  lookbook: { width: 1200, height: 1600, quality: 80 },
  team:     { width: 900,  height: 1200, quality: 76 },
  hero:     { width: 2000, height: 2000, quality: 83 },
};

export function mediaDeliveryUrl(source: string, preset: MediaImagePreset): string {
  if (typeof source !== "string" || !source.startsWith("https://")) return source;
  let url: URL;
  try { url = new URL(source); }
  catch { return source; }
  if (url.username || url.password || url.protocol !== "https:") return source;
  const config = presets[preset];
  if (!config) return source;

  // Never resize actual MP4/WebM or SVG media.
  if (/\.(?:mp4|webm|svg)$/i.test(url.pathname)) return source;
  if (url.hostname === "ik.imagekit.io") {
    if (url.searchParams.has("tr") || url.pathname.startsWith("/tr:")) return source;
    const transform = `w-${config.width},h-${config.height},c-at_max,q-${config.quality},f-auto`;
    const marker = source.indexOf("#");
    const beforeFragment = marker === -1 ? source : source.slice(0,marker);
    const fragment = marker === -1 ? "" : source.slice(marker);
    return beforeFragment + (url.search ? "&" : "?") + "tr=" + transform + fragment;
  }

  return source;
}

/** Common policy for generated HTML, including newly added image elements. */
export function mediaImageAttrs(
  attrs: Readonly<Record<string, string>>,
): Record<string, string> {
  if (!attrs.src || attrs["data-media-skip"] === "true") return { ...attrs };
  const cls = attrs.class ?? "";
  const requested = attrs["data-media-preset"];
  const preset: MediaImagePreset = requested && Object.prototype.hasOwnProperty.call(presets, requested)
    ? requested as MediaImagePreset
    : Object.prototype.hasOwnProperty.call(attrs,"data-gallery-active-image") ? "detail"
    : /(?:woocommerce_thumbnail|redcarpert-catalogue)/.test(cls) ? "card"
    : "team";
  const optimized = mediaDeliveryUrl(attrs.src,preset);
  const out = { ...attrs };
  if (optimized !== attrs.src) {
    out["data-media-original"] = attrs.src;
    out.src = optimized;
    // A pre-existing srcset pointing at originals must never override the
    // optimized URL and silently bypass the delivery policy.
    delete out.srcset;
    delete out.sizes;
  }
  if (/^https:\/\//.test(attrs.src)) {
    if (!out.decoding) out.decoding = "async";
    if (!out.loading) out.loading = out.fetchpriority === "high" ||
      Object.prototype.hasOwnProperty.call(out,"data-gallery-active-image")
      ? "eager" : "lazy";
  }
  return out;
}

/** Native videos never download ahead of a real click; optional poster images
 * share the small thumbnail policy and preserve their original URL. */
export function mediaVideoAttrs(
  attrs: Readonly<Record<string,string>>,
): Record<string,string> {
  const out = {...attrs};
  if (!out.preload && !Object.prototype.hasOwnProperty.call(out,"autoplay"))
    out.preload = "none";
  if (out.poster) {
    const optimized = mediaDeliveryUrl(out.poster,"tile");
    if (optimized !== out.poster) {
      out["data-media-poster-original"] = out.poster;
      out.poster = optimized;
    }
  }
  return out;
}
