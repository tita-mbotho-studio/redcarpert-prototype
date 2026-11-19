import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { setTimeout as pause } from "node:timers/promises";
import path from "node:path";
import sharp from "sharp";
import type { CatalogueProduct } from "../../src/data/catalogue.ts";
import type { LuxuryLookbookImage } from "../../src/lib/luxury-lookbook.ts";

const cacheDirectory=path.resolve(".cache/redcarpert-lookbook");
const targetPhotoWidthMm=170;
const targetPhotoHeightMm=164; // Actual PDF dress-photo area in luxury-lookbook.ts
export interface ImageAuditEntry {
  readonly id: string;
  readonly sourceUrl: string;
  readonly width: number;
  readonly height: number;
  readonly effectiveDpi: number;
  readonly printReady: boolean;
  readonly byteSize: number;
}
const approvedClientPhoto = (url: string): void => {
  const prefix="https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-dresses/";
  if (!url.startsWith(prefix) || !/\.webp(?:\?updatedAt=\d{13})?$/.test(url)) {
    throw new Error("Unapproved client lookbook image URL "+url);
  }
};
/** Client originals are never artificially upscaled for the PDF. */
export function validateLookbookPhotoDimensions(
  dimensions: { readonly width?: number; readonly height?: number },
  id: string,
): void {
  const {width,height}=dimensions;
  if (!width || !height || !Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width<1 || height<1)
    throw new Error("Invalid lookbook image dimensions for "+id);
}

/** Conservative effective DPI for an image contained within the PDF photo area. */
export function estimateLookbookPrintDpi(width:number,height:number):number {
  if (!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1)
    throw new Error("Invalid processed lookbook image dimensions");
  return Math.round(25.4/Math.min(targetPhotoWidthMm/width,targetPhotoHeightMm/height));
}

/** The PDF embeds original client photographs to preserve their full detail.
 * Transient ImageKit timeouts, throttling and network failures are retried;
 * invalid responses, missing photos and image corruption remain hard failures. */
class TransientImageRequestError extends Error {}

export async function downloadLookbookClientImage(
  url: string,
  id: string,
  fetchImage: typeof fetch = fetch,
  delay: (milliseconds:number) => Promise<void> = milliseconds => pause(milliseconds).then(()=>{}),
): Promise<Buffer> {
  approvedClientPhoto(url);
  const timeouts=[20000,40000,60000];
  for(let attempt=0;attempt<timeouts.length;attempt++) {
    try {
      const response=await fetchImage(url,{
        signal:AbortSignal.timeout(timeouts[attempt]),
        headers:{"Accept":"image/webp,image/*"},
      });
      if(!response.ok) {
        const reason="ImageKit HTTP "+response.status+" for "+id;
        if(response.status===408 || response.status===429 || response.status>=500)
          throw new TransientImageRequestError(reason);
        throw new Error(reason);
      }
      const declared=Number(response.headers.get("content-length")||0);
      if(declared>25_000_000)throw new Error("Photo exceeds 25 MB: "+id);
      const buffer=Buffer.from(await response.arrayBuffer());
      if(buffer.length>25_000_000)throw new Error("Photo exceeds 25 MB: "+id);
      if(buffer.length===0)throw new Error("Empty lookbook photograph: "+id);
      return buffer;
    } catch(error) {
      const errorName=error && typeof error==="object" && "name" in error
        ? String(error.name) : "";
      const retryable=error instanceof TransientImageRequestError ||
        error instanceof TypeError || errorName==="TimeoutError" || errorName==="AbortError";
      if(!retryable || attempt===timeouts.length-1)
        throw new Error("Cannot obtain lookbook photograph "+id+
          " after "+(attempt+1)+" attempt(s): "+String(error),{cause:error});
      const backoff=1000*(attempt+1);
      console.warn("[Bridal Edit] "+id+": temporary image download error; retry "+
        (attempt+2)+"/"+timeouts.length+" after "+backoff+" ms ("+String(error)+")");
      await delay(backoff);
    }
  }
  throw new Error("Cannot obtain lookbook photograph "+id);
}

async function cachedJpeg(product: CatalogueProduct): Promise<{image:LuxuryLookbookImage;audit:ImageAuditEntry}> {
  approvedClientPhoto(product.image);
  const name=product.id+"-"+createHash("sha256").update(product.image).digest("hex").slice(0,10);
  const file=path.join(cacheDirectory,name+".jpeg");
  const record=path.join(cacheDirectory,name+".json");
  let image:Buffer;
  let audit:ImageAuditEntry;
  try {
    image=await readFile(file);
    audit=JSON.parse(await readFile(record,"utf8")) as ImageAuditEntry;
  } catch {
    const original=await downloadLookbookClientImage(product.image,product.id);
    const meta=await sharp(original).metadata();
    validateLookbookPhotoDimensions(meta,product.id);
    if(!meta.width||!meta.height)throw new Error("Unrecognizable lookbook photo "+product.id);
    // Cache source dimensions and a JPEG suitable for the embedded PDF.
    // Do not upscale smaller client photographs: this cannot add real detail.
    image=await sharp(original).rotate().resize({width:2000,height:2500,fit:"inside",withoutEnlargement:true})
      .flatten({background:"#F5F0E9"}).jpeg({quality:86,progressive:false,mozjpeg:true}).toBuffer();
    const final=await sharp(image).metadata();
    if(!final.width||!final.height)throw new Error("Invalid processed lookbook JPEG "+product.id);
    // Calculate realistic print DPI from the JPEG actually placed on the A4 page.
    const effectiveDpi=estimateLookbookPrintDpi(final.width,final.height);
    audit={id:product.id,sourceUrl:product.imageCredit.sourceUrl,width:meta.width,height:meta.height,
      effectiveDpi,printReady:effectiveDpi>=300,byteSize:image.length};
    await mkdir(cacheDirectory,{recursive:true});
    await Promise.all([writeFile(file,image),writeFile(record,JSON.stringify(audit,null,2)+"\n")]);
  }
  const output=await sharp(image).metadata();
  if(!output.width||!output.height)throw new Error("Corrupt cached lookbook photo "+product.id);
  // Old cached metadata may use an outdated print area; recompute without re-downloading.
  const actualDpi=estimateLookbookPrintDpi(output.width,output.height);
  if(audit.effectiveDpi!==actualDpi || audit.printReady!==(actualDpi>=300)) {
    audit={...audit,effectiveDpi:actualDpi,printReady:actualDpi>=300};
    await writeFile(record,JSON.stringify(audit,null,2)+"\n");
  }
  if(shouldReportLookbookPrintWarning(audit.printReady)) {
    console.warn("[Bridal Edit] "+product.id+": source image "+audit.width+"x"+audit.height+
      " px; estimated "+audit.effectiveDpi+" DPI in PDF. Included without upscaling; higher-resolution photo recommended for print.");
  }
  return {image:{id:product.id,jpeg:image,width:output.width,height:output.height},audit};
}

/** Print-readiness diagnostics are opt-in; every image is still audited and
 * true download/metadata/corruption errors remain hard failures. */
export function shouldReportLookbookPrintWarning(
  printReady: boolean,
  diagnosticsEnabled = process.env.REDCARPERT_PDF_PRINT_WARNINGS === "1",
): boolean {
  return diagnosticsEnabled && !printReady;
}

/** Three download workers limit peak bandwidth and avoid refetching cached files. */
export async function prepareLookbookImages(products:readonly CatalogueProduct[]):Promise<{
  images:LuxuryLookbookImage[];
  audit:ImageAuditEntry[];
}> {
  const images=new Array<LuxuryLookbookImage>(products.length);
  const audit=new Array<ImageAuditEntry>(products.length);
  let next=0;
  async function worker():Promise<void> {
    while(next<products.length) {
      const i=next++;
      const result=await cachedJpeg(products[i]);
      images[i]=result.image;
      audit[i]=result.audit;
    }
  }
  await Promise.all([worker(),worker(),worker()]);
  if(images.some(item=>!item)||audit.some(item=>!item))throw new Error("Incomplete lookbook images");
  return {images,audit};
}
