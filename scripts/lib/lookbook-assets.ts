import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { CatalogueProduct } from "../../src/data/catalogue.ts";
import type { LuxuryLookbookImage } from "../../src/lib/luxury-lookbook.ts";

const cacheDirectory=path.resolve(".cache/redcarpert-lookbook");
const targetPhotoWidthMm=170;
const targetPhotoHeightMm=197;
export interface ImageAuditEntry {
  readonly id: string;
  readonly sourceUrl: string;
  readonly width: number;
  readonly height: number;
  readonly effectiveDpi: number;
  readonly printReady: boolean;
  readonly byteSize: number;
}
const photoId = (url: string): string | null => {
  const result=/\/photos\/(\d+)\/pexels-photo-\1\.jpeg/.exec(url);
  if(result) return result[1];
  if(url.startsWith("https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-dresses/"))
    return null;
  throw new Error("Unapproved lookbook image URL "+url);
};
async function cachedJpeg(product: CatalogueProduct): Promise<{image:LuxuryLookbookImage;audit:ImageAuditEntry}> {
  const id=photoId(product.image);
  const name=product.id+"-"+createHash("sha256").update(product.image).digest("hex").slice(0,10);
  const file=path.join(cacheDirectory,name+".jpeg");
  const record=path.join(cacheDirectory,name+".json");
  let image:Buffer;
  let audit:ImageAuditEntry;
  try {
    image=await readFile(file);
    audit=JSON.parse(await readFile(record,"utf8")) as ImageAuditEntry;
  } catch {
    const possibleSources=id
      ? ["https://images.pexels.com/photos/"+id+"/pexels-photo-"+id+".jpeg",product.image]
      : [product.image];
    let original:Buffer|undefined;
    let lastError:unknown;
    for(const url of possibleSources) {
      try {
        const response=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{"Accept":"image/jpeg,image/*"}});
        if(!response.ok)throw new Error("Pexels HTTP "+response.status+" for "+url);
        const size=Number(response.headers.get("content-length")||0);
        if(size>25_000_000)throw new Error("Photo exceeds 25 MB: "+product.id);
        const buffer=Buffer.from(await response.arrayBuffer());
        if(buffer.length>25_000_000)throw new Error("Photo exceeds 25 MB: "+product.id);
        const info=await sharp(buffer).metadata();
        if(!info.width||!info.height||info.width<600||info.height<600)throw new Error("Photo lacks adequate dimensions: "+product.id);
        original=buffer;
        break;
      } catch(error){lastError=error;}
    }
    if(!original)throw new Error("Cannot obtain lookbook photograph "+product.id+": "+String(lastError));
    const meta=await sharp(original).metadata();
    if(!meta.width||!meta.height)throw new Error("Unrecognizable lookbook photo "+product.id);
    const scale=Math.min(targetPhotoWidthMm/meta.width,targetPhotoHeightMm/meta.height);
    const effectiveDpi=Math.round(25.4/scale);
    // Cache source high-res metadata and only the screen-optimized JPEG; do not commit Pexels originals.
    image=await sharp(original).rotate().resize({width:2000,height:2500,fit:"inside",withoutEnlargement:true})
      .flatten({background:"#F5F0E9"}).jpeg({quality:86,progressive:false,mozjpeg:true}).toBuffer();
    const final=await sharp(image).metadata();
    if(!final.width||!final.height)throw new Error("Invalid processed lookbook JPEG "+product.id);
    audit={id:product.id,sourceUrl:product.imageCredit.sourceUrl,width:meta.width,height:meta.height,
      effectiveDpi,printReady:effectiveDpi>=300,byteSize:image.length};
    await mkdir(cacheDirectory,{recursive:true});
    await Promise.all([writeFile(file,image),writeFile(record,JSON.stringify(audit,null,2)+"\n")]);
  }
  const output=await sharp(image).metadata();
  if(!output.width||!output.height)throw new Error("Corrupt cached lookbook photo "+product.id);
  return {image:{id:product.id,jpeg:image,width:output.width,height:output.height},audit};
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
