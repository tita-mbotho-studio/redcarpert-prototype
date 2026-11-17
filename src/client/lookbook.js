/** Book content is derived directly from the published catalogue; no duplicate images or links. */
import { catalogueProducts, catalogueCategories } from '../data/catalogue.ts';
import { displaySalePriceForDress, displayRentalPriceForDress, salePriceLabelForDress } from '../lib/pricing.ts';
export const lookbookEntries = catalogueProducts.map(product => ({
  id: product.id,
  category: catalogueCategories.find(c => c.id === product.category)?.name ?? 'Wedding Dresses',
  name: product.name,
  image: product.image,
  priceZar: product.priceZar,
  salePriceLabel: salePriceLabelForDress(product.id),
  salePriceDisplay: displaySalePriceForDress(product.id),
  rentalPriceDisplay: displayRentalPriceForDress(product.id),
  alt: product.imageAlt,
  href: product.previewRoute + '/',
  photographer: product.imageCredit.photographer,
}));
