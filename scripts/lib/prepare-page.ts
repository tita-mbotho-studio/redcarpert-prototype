import { sitePages } from '../../src/data/site';
import { catalogueProducts, catalogueCategories } from '../../src/data/catalogue';
import { contentAdaptations } from '../../src/data/content-adaptations';
import { adaptSiteDocument } from '../../src/lib/content-adapter';
import { adaptHomepageBackgrounds } from '../../src/lib/homepage-backgrounds';
import { adaptHomepageCollectionYears } from '../../src/lib/homepage-collection-years';
import { adaptFooterSocials } from '../../src/lib/footer-social-adapter';
import { adaptLogo } from '../../src/lib/logo-adapter';
import { adaptNavigation } from '../../src/lib/navigation-adapter';
import { addHomepageFooter } from '../../src/lib/homepage-footer';
import { adaptFooterBranding } from '../../src/lib/footer-branding-adapter';
import { correctFooterLinks } from '../../src/lib/footer-link-corrections';
import { adaptCatalogue } from '../../src/lib/catalogue-adapter';
import { adaptEditorialDocument } from '../../src/lib/editorial-pages';
import { modernizeSiteIcons } from '../../src/lib/modern-icons';
import { createProductDetailPreview } from '../../src/lib/product-detail-preview';
import { siteMetadata } from '../../src/data/metadata';

/** Produce the existing approved page tree without touching its structure. */
export function preparePage(route: string) {
 const product = catalogueProducts.find(p=>p.previewRoute===route);
 const newCategory = catalogueCategories.slice(2).find(c => c.route.replace(/\/$/, '') === route);
 const categoryTemplate = newCategory ? {...sitePages['/product-category/mermaid'], route} : undefined;
 let original = product ? createProductDetailPreview(sitePages['/product/arabella'],product) : categoryTemplate ?? (route === '/digital-lookbook' ? {...sitePages['/about-us'],route,title:'Digital Lookbook | Redcarpert Wedding Dresses',description:'Browse wedding dress styles online or in our downloadable lookbook.'} : sitePages[route]);
 // Replace inherited Bridal Vanesa catalogue browser-tab metadata without
 // modifying any approved page structure, product card or visual style.
 const listingMetadata: Record<string, {title:string; description:string}> = {
  '/product': {
   title: 'Wedding Dresses | Redcarpert Wedding Dresses',
   description: 'Explore wedding dresses and style ideas across five collections. Message us about fittings and prices.',
  },
  '/product-category/mermaid': {
   title: 'Mermaid Wedding Dresses | Redcarpert',
   description: 'See Mermaid wedding dress inspiration and ask Redcarpert about available dresses and prices.',
  },
  '/product-category/ball_gown': {
   title: 'Ball Gown Wedding Dresses | Redcarpert',
   description: 'Explore Redcarpert Ball Gown dresses and message us to book a fitting.',
  },
 };
 for (const category of catalogueCategories.slice(2)) {
  const key = category.route.replace(/\/$/, '');
  listingMetadata[key] = {
   title: category.name + ' | Redcarpert Wedding Dresses',
   description: 'Explore ' + category.name + ' style ideas and ask Redcarpert about available dresses and prices.',
  };
 }
 if (!original) throw new Error('Unknown public route: '+route);
 if(Object.hasOwn(listingMetadata,route)) original={...original,...listingMetadata[route]};
 if(route === '/') original = {...original, title:siteMetadata.title, description:siteMetadata.description};
 if(['/about-us','/contact-us','/wedding-moments'].includes(route)) original = {...original,title:route==='/about-us'?'About Us | Redcarpert Wedding Dresses':route==='/contact-us'?'Contact Us | Redcarpert Wedding Dresses':'Wedding Moments | Redcarpert Wedding Dresses',description:route==='/about-us'?"Learn about our wedding dress collections and book a fitting on WhatsApp.":route==='/contact-us'?'Book a wedding dress fitting in Pomona, Kempton Park. The exact address is shared on WhatsApp after confirmation.':'Browse wedding photos and videos in the Wedding Moments gallery.'};
 const editorial = adaptEditorialDocument(adaptFooterBranding(correctFooterLinks(adaptLogo(adaptNavigation(addHomepageFooter(adaptHomepageBackgrounds(adaptHomepageCollectionYears(adaptSiteDocument(adaptCatalogue(adaptFooterSocials(original),catalogueProducts),contentAdaptations))),sitePages['/about-us']))))));
 // Final icon pass runs only after the canonical layout/branding guards.
 const document = modernizeSiteIcons(editorial);
 return {document, product};
}
