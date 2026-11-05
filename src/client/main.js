import { HeaderNavigationAlignment } from './HeaderNavigationAlignment.js';
import { FooterScrollToTop } from './FooterScrollToTop.js';
import { HomepageFooterScroll } from './HomepageFooterScroll.js';
import { SiteRuntime } from './SiteRuntime.js';
import { initializeEnquiryPreview } from './enquiry-preview.js';
import { initializeLookbookReader } from './lookbook-reader.js';
import { initializeCatalogueFilter } from './catalogue-filter.js';
import { initializeBridesGallery } from './brides-gallery.js';

const data = JSON.parse(document.getElementById('page-runtime').textContent);
// Static Pages HTML keeps a build-time year as a fallback, and the visitor's
// current year takes over on every page load (no annual deploy required).
const copyrightYear = document.querySelector('#footer[data-redcarpert-footer] [data-copyright-year]');
if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());
initializeEnquiryPreview();
initializeLookbookReader(import.meta.env.BASE_URL);
initializeCatalogueFilter();
initializeBridesGallery();
HeaderNavigationAlignment();
if (document.querySelector('footer[data-homepage-footer]')) HomepageFooterScroll(); else FooterScrollToTop();
SiteRuntime({document:data});
