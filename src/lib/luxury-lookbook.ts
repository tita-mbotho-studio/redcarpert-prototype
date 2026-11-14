import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import type { CatalogueProduct } from "../data/catalogue.ts";
import { catalogueCategories } from "../data/catalogue.ts";
import { displayDressPrice } from "./pricing.ts";

/** A4 luxury editorial PDF: cover + three front-matter pages + five collection openers + twenty dress pages + three closing pages. */
export interface LuxuryLookbookImage {
  readonly id: string;
  readonly jpeg: Buffer;
  readonly width: number;
  readonly height: number;
}
export interface LuxuryLookbookOptions {
  readonly year: number;
  readonly logo: Buffer;
}
const esc = (s: string): string => s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const two = (n: number): string => String(n).padStart(2, "0");
const imageData = (data: Buffer, mime: "image/jpeg" | "image/png"): string =>
  "data:" + mime + ";base64," + data.toString("base64");
const price = (p: CatalogueProduct): string => esc(displayDressPrice(p.priceZar));

const style = [
  "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Montserrat:wght@400;500;600&display=swap');",
  "@page{size:A4;margin:0}",
  "*{box-sizing:border-box}",
  "html,body{margin:0;padding:0;background:#FDFBF8;color:#4C4035;-webkit-print-color-adjust:exact;print-color-adjust:exact}",
  "body{font-family:Montserrat,Arial,sans-serif}",
  "h1,h2,h3,p{margin:0;padding:0}",
  "h1,h2,h3{font-family:'Cormorant Garamond',Georgia,serif;font-weight:400}",
  "a{color:inherit;text-decoration:none}",
  ".page{position:relative;width:210mm;height:296.8mm;overflow:hidden;page-break-after:always;break-after:page;background:#FDFBF8}",
  ".page:last-child{page-break-after:auto;break-after:auto}",
  ".content{position:absolute;inset:18mm 18mm 18mm 22mm;display:flex;flex-direction:column}",
  ".page:nth-child(even) .content{left:18mm;right:22mm}",
  ".kicker{font:500 9pt/1.5 Montserrat,Arial,sans-serif;letter-spacing:.20em;text-transform:uppercase;color:#947B5C}",
  ".folio{position:absolute;left:22mm;bottom:9mm;font:500 8pt/1 Montserrat,Arial,sans-serif;letter-spacing:.12em;color:#998A7C}",
  ".page:nth-child(even) .folio{left:18mm}",
  ".cover .content{align-items:center;text-align:center}",
  ".logo{display:block;width:67mm;height:22mm;object-fit:contain;filter:brightness(0)}",
  ".cover h1{font-size:52pt;line-height:.96;margin:7mm 0 7mm}",
  ".goldline{background:#947B5C;width:28mm;height:.55mm}",
  ".cover-photo{height:167mm;width:145mm;display:flex;align-items:center;justify-content:center;background:#FDFBF8;margin:8mm 0 8mm;padding:2mm;border:0}",
  ".cover-photo img{display:block;width:100%;height:100%;object-fit:contain}",
  ".cover-tail{margin-top:auto;font-size:9pt;letter-spacing:.12em;text-transform:uppercase}",
  ".tiny{font:400 7.8pt/1.5 Montserrat,Arial,sans-serif;color:#8B7C6D}",
  ".cover .tiny{margin-top:3mm}",
  ".front .content{justify-content:center}",
  ".front h1{font-size:76pt;line-height:.93;margin:16mm 0 10mm;letter-spacing:-.03em}",
  ".front .lead{font-size:11.5pt;line-height:2.1;max-width:128mm;color:#665A4E;margin-top:11mm}",
  ".welcome .content{justify-content:center}",
  ".welcome h2{font-size:48pt;line-height:1.06;max-width:142mm;margin:11mm 0}",
  ".welcome p{font-size:11pt;line-height:2;max-width:138mm;margin-bottom:7mm;color:#695D51}",
  ".contents .content{padding-top:12mm}",
  ".contents h2{font-size:54pt;margin:7mm 0 14mm}",
  ".entry{display:flex;align-items:baseline;gap:7mm;padding:6mm 0;border-bottom:.25mm solid #E9DED2}",
  ".entry .num{font-size:10pt;color:#947B5C;width:11mm}",
  ".entry a{flex:1;font:400 23pt/1.1 'Cormorant Garamond',Georgia,serif}",
  ".entry .page-number{font-size:10pt;color:#7E7164}",
  ".divider{background:#F5F0E9}",
  ".divider .content{justify-content:center}",
  ".divider .number{font:400 91pt/1 'Cormorant Garamond',Georgia,serif;color:#D8C9B9}",
  ".divider h2{font-size:61pt;line-height:1.05;max-width:144mm;margin:5mm 0 13mm}",
  ".divider .intro{max-width:108mm;color:#76685B;font-size:10pt;line-height:1.9;margin-top:12mm}",
  ".dress .content{padding-top:2mm}",
  ".dress-top{display:flex;justify-content:space-between;align-items:baseline;gap:7mm}",
  ".look-ref{font:500 8pt/1 Montserrat,Arial,sans-serif;letter-spacing:.12em;color:#8E8276}",
  ".fine-rule{height:.25mm;background:#E9DED2;margin:5mm 0 6mm}",
  ".portrait{width:100%;height:197mm;background:#FDFBF8;display:flex;justify-content:center;align-items:center}",
  ".portrait img{display:block;width:100%;height:100%;object-fit:contain;object-position:center}",
  ".dress-bottom{display:flex;justify-content:space-between;align-items:flex-start;gap:8mm;margin-top:6mm}",
  ".dress-bottom h3{font-size:29pt;line-height:1.05}",
  ".dress-bottom .kind{font-size:8pt;letter-spacing:.10em;text-transform:uppercase;color:#857569;margin-top:2mm}",
  ".amount{font-size:17pt;font-weight:500;text-align:right;white-space:nowrap}",
  ".amount-label{font-size:7.7pt;color:#85766A;text-align:right;margin-top:2mm}",
  ".dress .disclosure{margin-top:auto;font-size:7.4pt;color:#8C8074}",
  ".contact .content{justify-content:center}",
  ".contact h2{font-size:58pt;line-height:1.07;margin:7mm 0 13mm}",
  ".contact p{font-size:11pt;line-height:1.95;max-width:139mm;margin-bottom:7mm}",
  ".button{display:inline-block;align-self:flex-start;background:#4C4035;color:white;padding:5mm 9mm;font-size:9pt;letter-spacing:.05em;margin:7mm 0}",
  ".contact .web{font-size:9pt;color:#947B5C;margin-top:9mm}",
  ".credits .content{justify-content:center}",
  ".credits h2{font-size:43pt;margin:5mm 0 11mm}",
  ".credit-columns{display:grid;grid-template-columns:1fr 1fr;gap:11mm}",
  ".credit{border-bottom:.25mm solid #E9DED2;padding:3mm 0;font-size:8pt;min-height:12mm}",
  ".credit .n{color:#947B5C;margin-right:3mm}",
  ".credit a{display:block;text-decoration:underline;color:#78675A;font-size:7pt;margin-top:1mm}",
  ".credits .note{font-size:7.8pt;line-height:1.65;margin-top:10mm;color:#76685B}",
  ".back{background:#F5F0E9}",
  ".back .content{justify-content:center;align-items:center;text-align:center}",
  ".back .logo{width:89mm;height:30mm}",
  ".back h2{font-size:48pt;line-height:1.08;margin:20mm 0 12mm}",
  ".back p{font-size:10pt;line-height:2;max-width:116mm;margin:12mm 0}",
  ".back a{font-size:9pt;color:#947B5C;margin-top:12mm}",
  "@media screen{body{background:#E6E0D9}.page{margin:14px auto;box-shadow:0 10px 35px #0002}}"
].join("\n");

const page = (index: number, type: string, id: string, contents: string): string =>
  '<section class="page ' + type + '" id="' + id + '"><div class="content">' +
  contents + '</div>' + (index===1||index===32?'':'<div class="folio">'+two(index)+' / 32</div>') + '</section>';
const tag = (value: string): string => '<span class="kicker">' + esc(value) + '</span>';

export function createLuxuryLookbookHtml(products: readonly CatalogueProduct[], images: readonly LuxuryLookbookImage[], options: LuxuryLookbookOptions): string {
  if (products.length !== 20 || catalogueCategories.length !== 5) throw new Error("The Bridal Edit requires 20 dresses in 5 categories");
  if (options.year < 2026 || !Number.isInteger(options.year)) throw new Error("Invalid edition year");
  const sources = new Map(images.map(image=>[image.id,image]));
  if (sources.size !== 20) throw new Error("The Bridal Edit requires twenty unique photos");
  const photograph = (id: string): string => {
    const item = sources.get(id);
    if (!item || !item.jpeg.subarray(0,2).equals(Buffer.from([0xff,0xd8])) || item.width<=0||item.height<=0) throw new Error("Invalid PDF photo "+id);
    return imageData(item.jpeg,"image/jpeg");
  };
  const logo = imageData(options.logo,"image/png");
  const pages: string[] = [];
  pages.push(page(1,"cover","cover",'<img class="logo" src="'+logo+'" alt="Redcarpert logo">'+tag("Redcarpert Wedding Dresses")+
    '<h1>The Bridal Edit</h1><div class="goldline"></div><div class="cover-photo"><img src="'+photograph(products[0].id)+'" alt="Bridal cover inspiration"></div>'+
    '<p class="cover-tail">The '+options.year+' Edition &nbsp; / &nbsp; Five Collections</p><p class="tiny">Illustrative photography and prices</p>'));
  pages.push(page(2,"front","title",tag("A thoughtful bridal collection")+
    '<h1>The<br>Bridal<br>Edit.</h1><div class="goldline"></div><p class="lead">A curated collection of bridal inspiration, photographed and arranged for the moments that become memories.</p>'));
  pages.push(page(3,"welcome","welcome",tag("A note from Redcarpert")+
    '<h2>Every bridal story starts with an idea.</h2><p>Explore silhouettes and details at your own pace. Find the looks you love, then start a fitting conversation directly with Redcarpert.</p>'+
    '<p>These photographs and ZAR prices illustrate possibilities. They are not confirmed Redcarpert stock or final selling quotations.</p>'+tag("Redcarpert Wedding Dresses")));
  pages.push(page(4,"contents","contents",tag("The bridal edit")+'<h2>Contents</h2>'+
    catalogueCategories.map((cat,i)=>'<div class="entry"><span class="num">0'+(i+1)+'</span><a href="#collection-'+cat.id+'">'+esc(cat.name)+'</a><span class="page-number">'+two(5+i*5)+'</span></div>').join("")+
    '<p class="tiny" style="margin-top:15mm">Twenty sample looks across five bridal categories.</p>'));
  let pageNumber=5;
  for (const [index,category] of catalogueCategories.entries()) {
    const dresses=products.filter(p=>p.category===category.id);
    if (dresses.length!==4) throw new Error("Collection must have exactly four sample dresses: "+category.id);
    pages.push(page(pageNumber++,"divider","collection-"+category.id,
      tag("Collection "+two(index+1)+" / 05")+'<p class="number">'+two(index+1)+'</p><h2>'+esc(category.name)+'</h2>'+
      '<div class="goldline"></div><p class="intro">Four thoughtfully curated styling references. Discover your favourite look, then enquire about available dresses and fittings.</p>'));
    for (const dress of dresses) {
      const look=dress.name.replace(/^Sample /,"Look ");
      pages.push(page(pageNumber++,"dress","look-"+dress.id,
        '<div class="dress-top">'+tag(category.name)+'<span class="look-ref">'+esc(look.toUpperCase())+' / REDCARPERT</span></div><div class="fine-rule"></div>'+
        '<div class="portrait"><img src="'+photograph(dress.id)+'" alt="'+esc(dress.imageAlt)+'"></div>'+
        '<div class="dress-bottom"><div><h3>'+esc(look)+'</h3><p class="kind">'+esc(category.name)+'</p></div>'+
        '<div><p class="amount">'+price(dress)+'</p><p class="amount-label">Indicative ZAR price</p></div></div>'+
        '<p class="disclosure">Illustrative Pexels photograph / Not confirmed Redcarpert inventory</p>'));
    }
  }
  if(pageNumber!==30)throw new Error("Incorrect editorial page sequence");
  const enquiry="https://wa.me/27680458811?text="+encodeURIComponent("Hello Redcarpert Wedding Dresses! I would like to enquire about a dress fitting.");
  const website="https://tita-mbotho-studio.github.io/redcarpert-prototype/";
  pages.push(page(30,"contact","fittings",tag("Your bridal story")+
    '<h2>Find the look.<br>Begin the conversation.</h2><p>See a style that speaks to you? Contact Redcarpert to discuss fitting appointments, dress availability and confirmed pricing.</p>'+
    '<a class="button" href="'+esc(enquiry)+'">ENQUIRE VIA WHATSAPP</a><p class="tiny">Nothing is sent until you choose Send in WhatsApp.</p>'+
    '<a class="web" href="'+esc(website)+'">'+esc(website)+'</a>'));
  const credits=products.map(dress=>'<div class="credit"><span class="n">'+esc(dress.name.replace(/^Sample /,"Look "))+'</span>'+
    esc(dress.imageCredit.photographer)+'<a href="'+esc(dress.imageCredit.sourceUrl)+'">Pexels photograph</a></div>');
  pages.push(page(31,"credits","credits",tag("With thanks")+
    '<h2>Photography Credits</h2><div class="credit-columns"><div>'+credits.slice(0,10).join("")+'</div><div>'+credits.slice(10).join("")+'</div></div>'+
    '<p class="note">All photography is sourced from Pexels and is used here for styling inspiration only. The sample dresses, illustrative ZAR prices and photographs do not establish stock, availability or final selling prices. The 2 in 1 photographs do not verify convertible construction.</p>'));
  pages.push(page(32,"back","back-cover",'<img class="logo" src="'+logo+'" alt="Redcarpert logo">'+
    '<h2>Your bridal story<br>begins here.</h2><div class="goldline"></div>'+
    '<p>For every special moment, discover a look that feels like yours.</p><a href="'+esc(website)+'">REDCARPERT WEDDING DRESSES</a>'));
  if(pages.length!==32)throw new Error("Expected 32 pages, found "+pages.length);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Redcarpert - The Bridal Edit '+options.year+'</title>'+
    '<meta name="viewport" content="width=device-width,initial-scale=1"><style>'+style+'</style></head><body>'+pages.join("\n")+'</body></html>';
}

export async function createLuxuryLookbookPdf(products: readonly CatalogueProduct[], images: readonly LuxuryLookbookImage[], options: LuxuryLookbookOptions): Promise<Buffer> {
  const html=createLuxuryLookbookHtml(products,images,options);
  const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  try {
    const tab=await browser.newPage({viewport:{width:1240,height:1754},deviceScaleFactor:1});
    await tab.setContent(html,{waitUntil:"load",timeout:60000});
    await tab.evaluate(async()=>{await document.fonts.ready;});
    const missing=await tab.evaluate(()=>Array.from(document.images).filter(image=>!image.complete||!image.naturalWidth).map(image=>image.alt));
    if(missing.length)throw new Error("Lookbook images failed to render: "+missing.join(", "));
    const count=await tab.locator("section.page").count();
    if(count!==32)throw new Error("Wrong rendered book page count "+count);
    if(process.env.REDCARPERT_BOOK_PREVIEW==="1") {
      const folder=".generated/lookbook-previews";
      await mkdir(folder,{recursive:true});
      for(const id of ["cover","collection-mermaid","look-sample-mermaid","collection-modern_tradition","credits","back-cover"]) {
        await tab.locator("#"+id).screenshot({path:folder+"/"+id+".png",animations:"disabled"});
      }
    }
    const pdf=await tab.pdf({
      format:"A4",printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false,
      outline:true,tagged:true
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
