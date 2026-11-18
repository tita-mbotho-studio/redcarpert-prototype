import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalogueProducts, catalogueCategories } from '../src/data/catalogue.ts';
import { adaptCatalogue } from '../src/lib/catalogue-adapter.ts';
import { sitePages } from '../src/data/site.ts';

const all = nodes => nodes.flatMap(node => typeof node === 'string' ? [] : [node, ...all(node.children)]);
const routes = ['/product', ...catalogueCategories.map(category => category.route.replace(/\/$/, ''))];
const source = route => sitePages[route] ?? { ...sitePages['/product-category/mermaid'], route };

test('each of the five collections uses the same editorial name, divider and number layout', () => {
  const observed = new Set();
  for (const route of routes) {
    const document = adaptCatalogue(source(route), catalogueProducts);
    const cards = all(document.nodes).filter(n => Object.hasOwn(n.attrs, 'data-catalogue-id'));
    const expected = route === '/product' ? catalogueProducts :
      catalogueProducts.filter(p => route.endsWith('/' + p.category));
    assert.equal(cards.length, expected.length, route);
    for (const [index,card] of cards.entries()) {
      const product = expected[index];
      observed.add(product.category);
      const category = catalogueCategories.find(c => c.id === product.category);
      const name = category.name.replace(/ Dresses$/, '');
      const number = product.name.match(/(\d{2})$/)?.[1];
      const title = all([card]).find(n => n.tag === 'h2');
      const image = all([card]).find(n => n.tag === 'img');
      const link = all([card]).find(n => n.tag === 'a');
      assert.equal(title.attrs.class, 'woocommerce-loop-product__title redcarpert-catalogue-title');
      assert.deepEqual(title.children.map(n => n.attrs.class), [
        'redcarpert-catalogue-collection',
        'redcarpert-catalogue-divider',
        'redcarpert-catalogue-number',
      ]);
      assert.equal(title.children[0].children[0], name);
      assert.equal(title.children[1].attrs['aria-hidden'], 'true');
      assert.deepEqual(title.children[1].children, []);
      assert.equal(title.children[2].children[0], number);
      assert.equal(link.attrs['aria-label'], `${name} ${number}: view dress photographs`);
      assert.equal(link.attrs.href, product.previewRoute);
      assert.equal(image.attrs.src, product.image);
      assert.match(image.attrs.style, /aspect-ratio: 1 \/ 1/);
      assert(!all([card]).some(n => Object.hasOwn(n.attrs, 'data-dress-price')));
    }
  }
  assert.deepEqual([...observed].sort(), catalogueCategories.map(c => c.id).sort());
});

test('luxury typography remains centred, accessible and responsive without pricing captions', () => {
  const css = readFileSync('src/components/CatalogueListing.css', 'utf8');
  const generator = readFileSync('scripts/generate.ts','utf8');
  assert.doesNotMatch(css, /@import\s+url\(/, 'font imports must not appear halfway through the concatenated stylesheet');
  assert.match(generator, /fonts\.googleapis\.com\/css2\?family=Cormorant\+Garamond/);
  assert.match(generator, /catalogueFontLinks/);
  assert.match(generator, /route\.startsWith\('\/product-category\/'\)/);
  assert.match(css, /"Cormorant Garamond"/);
  assert.match(css, /Montserrat/);
  assert.match(css, /\.redcarpert-catalogue-collection/);
  assert.match(css, /\.redcarpert-catalogue-divider/);
  assert.match(css, /\.redcarpert-catalogue-number/);
  assert.match(css, /text-align:\s*center\s*!important/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(css, /catalogue-sample-note|redcarpert-catalogue-condition-note|redcarpert-catalogue-price/);
});
