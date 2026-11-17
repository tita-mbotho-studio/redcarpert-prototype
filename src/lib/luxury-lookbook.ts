import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import type { CatalogueProduct } from "../data/catalogue.ts";
import { catalogueCategories } from "../data/catalogue.ts";
import { displaySalePriceForDress, displayRentalPriceForDress, salePriceLabelForDress, RENTAL_CONDITION_NOTE } from "./pricing.ts";
import { generalFittingMessage } from "./whatsapp-messages.ts";
import { buildWhatsAppUrl } from "../config/whatsapp.ts";

/** A4 luxury editorial PDF: cover + three front-matter pages + five collection openers + one page per dress + three closing pages. */
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
const salePrice = (p: CatalogueProduct): string => esc(displaySalePriceForDress(p.id));
const rentalPrice = (p: CatalogueProduct): string => esc(displayRentalPriceForDress(p.id));

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
  ".cover{background:linear-gradient(155deg,#FDFBF8,#F5F0E9)}",
  ".cover .content{align-items:center;justify-content:center;text-align:center;gap:12mm}",
  ".logo{display:block;width:67mm;height:22mm;object-fit:contain}",
  ".cover .logo{width:88mm;height:34mm}",
  ".cover h1{font:italic 400 32pt/1.2 Georgia,serif;max-width:148mm;letter-spacing:-.012em}",
  ".cover-description{max-width:125mm;font:400 11pt/1.8 Montserrat,Arial,sans-serif;color:#786B60}",
  ".goldline{background:#947B5C;width:28mm;height:.55mm}",

  ".tiny{font:400 7.8pt/1.5 Montserrat,Arial,sans-serif;color:#8B7C6D}",

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
  ".page.dress .content{left:20mm;right:20mm;padding-top:2mm}",
  ".dress-top{display:flex;align-items:center;justify-content:center;min-height:5mm}",
  ".look-ref{font:500 8pt/1 Montserrat,Arial,sans-serif;letter-spacing:.12em;color:#8E8276}",
  ".fine-rule{height:.25mm;background:#E9DED2;margin:5mm 0 6mm}",
  ".portrait{width:100%;height:164mm;flex:0 0 164mm;background:#FDFBF8;display:flex;justify-content:center;align-items:center;border:0;padding:0}",
  ".portrait img{display:block;width:100%;height:100%;object-fit:contain;object-position:center}",
  ".dress-bottom{display:flex;flex:1 1 0;min-height:0;flex-direction:column;justify-content:center;align-items:center;gap:2.1mm;text-align:center;padding:3mm 0 6mm}",
  ".dress-bottom .kind{font:500 8pt/1.3 Montserrat,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#947B5C}",
  ".dress-bottom h3{font:400 28pt/1.12 Georgia,serif;letter-spacing:-.015em}",
  ".price-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7mm;align-items:start;width:100%;max-width:144mm;margin:1mm auto}",
  ".price-item{display:flex;flex-direction:column;align-items:center;gap:1.5mm;min-width:0}",
  ".price-item+.price-item{border-left:.25mm solid #E9DED2;padding-left:6mm}",
  ".amount{font:500 14pt/1.3 Montserrat,Arial,sans-serif;color:#65513D;white-space:nowrap}",
  ".amount-label{font:500 7.5pt/1.3 Montserrat,Arial,sans-serif;color:#85766A;text-transform:uppercase;letter-spacing:.035em}",
  ".price-condition{font:400 7pt/1.4 Montserrat,Arial,sans-serif;color:#8C8074;text-align:center;max-width:147mm}",
  ".dress-bottom .detail-link{font:500 9pt/1.4 Montserrat,Arial,sans-serif;color:#8D6845;text-decoration:underline;text-underline-offset:3px}",
  ".dress .disclosure{font:400 7.2pt/1.5 Montserrat,Arial,sans-serif;color:#8C8074;text-align:center;margin:0 auto;max-width:150mm}",
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
  ".back{background:linear-gradient(150deg,#F7F3ED,#E8DDCF)}",
  ".back .content{justify-content:center;align-items:center;text-align:center}",
  ".back .logo{width:89mm;height:30mm}",
  ".back h2{font:400 43pt/1.12 Georgia,serif;margin:10mm 0 3mm}",
  ".back p{font:400 11pt/1.8 Montserrat,Arial,sans-serif;max-width:118mm;margin:2mm 0 6mm}",
  ".back .brand-slogan{font:italic 400 18pt/1.4 Georgia,serif;color:#8D674A;max-width:138mm;margin:3mm 0}",
  ".back-links{display:flex;flex-direction:column;align-items:center;gap:5mm;margin:5mm 0}",
  ".back-links a{font:500 10pt/1.5 Montserrat,Arial,sans-serif;color:#8A684A;text-decoration:underline;text-underline-offset:3px}",
  ".back .back-notice{font:400 8pt/1.5 Montserrat,Arial,sans-serif;color:#786E63;max-width:135mm}",
  "@media screen{body{background:#E6E0D9}.page{margin:14px auto;box-shadow:0 10px 35px #0002}}"
].join("\n");

const page = (index: number, type: string, id: string, contents: string): string =>
  '<section class="page ' + type + '" id="' + id + '"><div class="content">' +
  contents + '</div>' + (type==="cover"||type==="back"?'':'<div class="folio">'+two(index)+' / __PAGE_TOTAL__</div>') + '</section>';
const tag = (value: string): string => '<span class="kicker">' + esc(value) + '</span>';

export function createLuxuryLookbookHtml(products: readonly CatalogueProduct[], images: readonly LuxuryLookbookImage[], options: LuxuryLookbookOptions): string {
  if (products.length !== 27 || catalogueCategories.length !== 5) throw new Error("The Bridal Edit requires 27 dresses in five categories");
  if (options.year < 2026 || !Number.isInteger(options.year)) throw new Error("Invalid edition year");
  const sources = new Map(images.map(image=>[image.id,image]));
  if (sources.size !== products.length) throw new Error("The Bridal Edit needs one photograph per dress");
  const photograph = (id: string): string => {
    const item = sources.get(id);
    if (!item || !item.jpeg.subarray(0,2).equals(Buffer.from([0xff,0xd8])) || item.width<=0||item.height<=0) throw new Error("Invalid PDF photo "+id);
    return imageData(item.jpeg,"image/jpeg");
  };
  const totalPages=products.length+catalogueCategories.length+7;
  const sectionStarts=new Map<string,number>();
  let nextStart=5;
  for (const category of catalogueCategories) {
    sectionStarts.set(category.id,nextStart);
    nextStart+=1+products.filter(p=>p.category===category.id).length;
  }
  const logo = imageData(options.logo,"image/png");
  const pages: string[] = [];
  const website="https://tita-mbotho-studio.github.io/redcarpert-prototype/";
  pages.push(page(1,"cover","cover",
    '<img class="logo" src="'+logo+'" alt="Redcarpert Wedding Dresses logo">'+
    '<div class="goldline" aria-hidden="true"></div>'+
    '<h1>Walking on red carpet with confidence</h1>'+
    '<p class="cover-description">Discover the wedding dress styles you love.</p>'));
  pages.push(page(2,"front","title",tag("Explore wedding dress styles")+
    '<h1>The<br>Bridal<br>Edit.</h1><div class="goldline"></div><p class="lead">Explore our wedding dress styles and find your favourite look.</p>'));
  pages.push(page(3,"welcome","welcome",tag("A note from Redcarpert")+
    '<h2>Your dream dress starts here.</h2><p>Browse our styles and find a dress you love. Message us on WhatsApp to ask about fittings.</p>'+
    '<p>Explore five bridal collections, discover the details you love and book your fitting with Redcarpert.</p>'+tag("Redcarpert Wedding Dresses")));
  pages.push(page(4,"contents","contents",tag("The bridal edit")+'<h2>Contents</h2>'+
    catalogueCategories.map((cat,i)=>'<div class="entry"><span class="num">0'+(i+1)+'</span><a href="#collection-'+cat.id+'">'+esc(cat.name)+'</a><span class="page-number">'+two(sectionStarts.get(cat.id)??0)+'</span></div>').join("")+
    '<p class="tiny" style="margin-top:15mm">'+products.length+' wedding dress looks across five collections.</p>'));
  let pageNumber=5;
  for (const [index,category] of catalogueCategories.entries()) {
    const dresses=products.filter(p=>p.category===category.id);
    if(!dresses.length || sectionStarts.get(category.id)!==pageNumber)
      throw new Error("Collection page alignment failed for "+category.id);
    pages.push(page(pageNumber++,"divider","collection-"+category.id,
      tag("Collection "+two(index+1)+" / 05")+'<p class="number">'+two(index+1)+'</p><h2>'+esc(category.name)+'</h2>'+
      '<div class="goldline"></div><p class="intro">'+(category.id==="ball_gown"
        ? "Explore "+dresses.length+" Ball Gown wedding dresses and find a style you love."
        : "Explore "+dresses.length+" wedding dresses and discover a look that feels like you.")+'</p>'));
    for (const dress of dresses) {
      const look=dress.status==="client"?dress.name:dress.name.replace(/^Sample /,"Look ");
      const detailUrl=website.replace(/\/$/,"")+dress.previewRoute+"/";
      pages.push(page(pageNumber++,"dress","look-"+dress.id,
        '<div class="dress-top">'+tag("REDCARPERT WEDDING DRESSES")+'</div><div class="fine-rule"></div>'+
        '<div class="portrait"><img src="'+photograph(dress.id)+'" alt="'+esc(dress.imageAlt)+'"></div>'+
        '<div class="dress-bottom">'+(dress.status==="client"?"":'<span class="kind">'+esc(category.name)+'</span>')+
        '<h3>'+esc(look)+'</h3>'+
        '<div class="price-pair" aria-label="Sale and rental prices">'+
        '<div class="price-item"><p class="amount-label" data-pdf-sale-label="'+esc(dress.id)+'">'+esc(salePriceLabelForDress(dress.id))+'</p>'+
        '<p class="amount" data-pdf-sale-price="'+esc(dress.id)+'">'+salePrice(dress)+'</p></div>'+
        '<div class="price-item"><p class="amount-label">Rental Price Range</p>'+
        '<p class="amount" data-pdf-rental-price="'+esc(dress.id)+'">'+rentalPrice(dress)+'</p></div></div>'+
        '<p class="price-condition">'+esc(RENTAL_CONDITION_NOTE)+'</p>'+
        '<a class="detail-link" href="'+esc(detailUrl)+'">View dress details</a></div>'));
    }
  }
  if(pageNumber!==nextStart)throw new Error("Incorrect collection page sequence");
  const enquiry=buildWhatsAppUrl(generalFittingMessage());
  pages.push(page(pageNumber++,"contact","fittings",tag("Your bridal story")+
    '<h2>Found a dress?<br>Book a fitting.</h2><p>Message us on WhatsApp to ask about prices, available dresses and fittings.</p>'+
    '<a class="button" href="'+esc(enquiry)+'">BOOK A FITTING ON WHATSAPP</a><p class="tiny">Fittings by appointment only.</p>'+
    '<a class="web" href="'+esc(website)+'">'+esc(website)+'</a>'));
  // Keep image attribution in catalogue metadata and docs/asset-credits.md.
  // The printed page focuses on the visitor's fitting journey.
  pages.push(page(pageNumber++,"credits","credits",tag("The Redcarpert experience")+
    '<h2>Your Fitting Journey</h2><div class="credit-columns">'+
    '<div>'+
    '<div class="credit"><span class="n">01</span> Explore our five bridal collections</div>'+
    '<div class="credit"><span class="n">02</span> Discover your favourite dress</div>'+
    '</div><div>'+
    '<div class="credit"><span class="n">03</span> Browse sale and rental prices</div>'+
    '<div class="credit"><span class="n">04</span> Book a fitting on WhatsApp</div>'+
    '</div></div>'+
    '<p class="note">Our team is here to help you explore the collections and arrange your bridal fitting.</p>'));
  pages.push(page(pageNumber++,"back","back-cover",
    '<img class="logo" src="'+logo+'" alt="Redcarpert Wedding Dresses logo">'+
    '<p class="brand-slogan">Walking on red carpet with confidence</p>'+
    '<h2>Find your wedding dress.</h2>'+
    '<p>Explore our collections and message us to book a fitting.</p>'+
    '<div class="back-links"><a href="'+esc(website)+'product/">Browse Wedding Dresses</a>'+
    '<a href="'+esc(website)+'contact-us/">Book a Fitting</a></div>'));
  if(pages.length!==totalPages||pageNumber!==totalPages+1)throw new Error("Expected "+totalPages+" editorial pages, got "+pages.length);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Redcarpert - The Bridal Edit '+options.year+'</title>'+
    '<meta name="viewport" content="width=device-width,initial-scale=1"><style>'+style+'</style></head><body>'+
    pages.join("\n").replaceAll("__PAGE_TOTAL__",two(totalPages))+'</body></html>';
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
    // Check actual Chromium layout before printing: the two prices, disclaimer
    // and dress link must remain within the fixed A4 editorial page on all 27
    // dress pages. Do not silently hide clipped pricing behind overflow:hidden.
    const clipped=await tab.evaluate(()=>{
      return [...document.querySelectorAll<HTMLElement>("section.page.dress")].flatMap(section=>{
        const bottom=section.querySelector<HTMLElement>(".dress-bottom");
        const pair=section.querySelector<HTMLElement>(".price-pair");
        const fields=section.querySelectorAll<HTMLElement>(".price-item");
        if(!bottom || !pair || fields.length!==2) return [section.id+": missing pricing"];
        const frame=bottom.getBoundingClientRect();
        const children=[...bottom.children] as HTMLElement[];
        const outside=children.some(child=>{
          const rect=child.getBoundingClientRect();
          return rect.top<frame.top-2 || rect.bottom>frame.bottom+2 ||
            rect.left<frame.left-2 || rect.right>frame.right+2;
        });
        return outside || bottom.scrollHeight>bottom.clientHeight+2
          ? [section.id+": pricing or disclaimer overflows PDF frame"] : [];
      });
    });
    if(clipped.length)throw new Error("Lookbook PDF content clipped: "+clipped.join(", "));
    const count=await tab.locator("section.page").count();
    if(count!==products.length+catalogueCategories.length+7)throw new Error("Wrong rendered book page count "+count);
    if(process.env.REDCARPERT_BOOK_PREVIEW==="1") {
      const folder=".generated/lookbook-previews";
      await mkdir(folder,{recursive:true});
      for(const id of ["cover","collection-mermaid","collection-ball_gown","look-ball-gown-01","look-sample-mermaid","collection-modern_tradition","credits","back-cover"]) {
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
