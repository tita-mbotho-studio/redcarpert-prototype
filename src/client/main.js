import { HeaderNavigationAlignment } from './HeaderNavigationAlignment.js';
import { FooterScrollToTop } from './FooterScrollToTop.js';
import { HomepageFooterScroll } from './HomepageFooterScroll.js';
import { SiteRuntime } from './SiteRuntime.js';
import { initializeEnquiryPreview } from './enquiry-preview.js';
import { initializeLookbookReader } from './lookbook-reader.js';
import { initializeCatalogueFilter } from './catalogue-filter.js';
import { initializeBridesGallery } from './brides-gallery.js';

const data = JSON.parse(document.getElementById('page-runtime').textContent);
initializeEnquiryPreview();
initializeLookbookReader(import.meta.env.BASE_URL);
initializeCatalogueFilter();
initializeBridesGallery();
HeaderNavigationAlignment();
if (document.querySelector('footer[data-homepage-footer]')) HomepageFooterScroll(); else FooterScrollToTop();
SiteRuntime({document:data});
