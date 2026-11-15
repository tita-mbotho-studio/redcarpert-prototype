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
 let original = product ? createProductDetailPreview(sitePages['/product/arabella'],product) : categoryTemplate ?? (route === '/digital-lookbook' ? {...sitePages['/about-us'],route,title:'Digital Lookbook | Redcarpert Wedding Dresses',description:'Interactive bridal lookbook featuring client Ball Gowns and illustrative collections, with a downloadable editorial PDF.'} : sitePages[route]);
 // Replace inherited Bridal Vanesa catalogue browser-tab metadata without
 // modifying any approved page structure, product card or visual style.
 const listingMetadata: Record<string, {title:string; description:string}> = {
  '/product': {
   title: 'Wedding Dresses | Redcarpert Wedding Dresses',
   description: 'Browse eleven client-photographed Ball Gowns and sixteen illustrative wedding dress inspirations across five collections. Enquire for confirmed prices and availability.',
  },
  '/product-category/mermaid': {
   title: 'Mermaid Wedding Dresses | Redcarpert',
   description: 'Browse illustrative Mermaid wedding dress photographs in the Redcarpert bridal collection preview.',
  },
  '/product-category/ball_gown': {
   title: 'Ball Gown Wedding Dresses | Redcarpert',
   description: 'Explore eleven client-supplied Ball Gown wedding dresses with multiple photographs of each gown. Enquire about prices and fittings.',
  },
 };
 for (const category of catalogueCategories.slice(2)) {
  const key = category.route.replace(/\/$/, '');
  listingMetadata[key] = {
   title: category.name + ' | Redcarpert Wedding Dresses',
   description: 'Explore illustrative ' + category.name + ' and indicative ZAR prices. Stock photos and prices are demonstration content only.',
  };
 }
 if (!original) throw new Error('Unknown public route: '+route);
 if(Object.hasOwn(listingMetadata,route)) original={...original,...listingMetadata[route]};
 if(route === '/') original = {...original, title:siteMetadata.title, description:siteMetadata.description};
 if(['/about-us','/contact-us','/wedding-moments'].includes(route)) original = {...original,title:route==='/about-us'?'About Us | Redcarpert Wedding Dresses':route==='/contact-us'?'Contact Us | Redcarpert Wedding Dresses':'Wedding Moments | Redcarpert Wedding Dresses',description:route==='/about-us'?"Learn about Redcarpert's bridal collections and fitting enquiries.":route==='/contact-us'?'Contact and fitting enquiry information for the Redcarpert prototype.':'Wedding Moments: a celebration of couples, family, friends, photographs and films. Stock inspiration is labelled until real wedding stories are available.'};
 const editorial = adaptEditorialDocument(adaptFooterBranding(correctFooterLinks(adaptLogo(adaptNavigation(addHomepageFooter(adaptHomepageBackgrounds(adaptHomepageCollectionYears(adaptSiteDocument(adaptCatalogue(adaptFooterSocials(original),catalogueProducts),contentAdaptations))),sitePages['/about-us']))))));
 // Final icon pass runs only after the canonical layout/branding guards.
 const document = modernizeSiteIcons(editorial);
 return {document, product};
}
