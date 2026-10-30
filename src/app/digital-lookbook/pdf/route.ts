import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createSampleLookbookPdf } from "@/lib/lookbook-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Downloads a real, illustrated two-page PDF generated from local sample images. */
export async function GET() {
  const images = [
    { src: "sample-01-mermaid-pexels.webp", category: "Mermaid" as const, sample: "Sample 01", photographer: "Tran Long" },
    { src: "sample-02-ball-gown-pexels.webp", category: "Ball Gown" as const, sample: "Sample 02", photographer: "Thalia villa" },
  ];
  const photos = await Promise.all(images.map(async item => {
    const source = await readFile(path.join(process.cwd(), "public", "redcarpert", "gallery", item.src));
    const { data, info } = await sharp(source).removeAlpha().jpeg({ quality: 90, progressive: false }).toBuffer({ resolveWithObject: true });
    return { jpeg: data, width: info.width, height: info.height, category: item.category, sample: item.sample, photographer: item.photographer };
  }));
  const pdf = createSampleLookbookPdf(photos);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Redcarpert-Sample-Lookbook.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
