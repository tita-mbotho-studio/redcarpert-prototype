import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { catalogueProducts, catalogueCategories } from '../src/data/catalogue.ts';

/** Production-browser coverage for editorial listing cards on all six routes. */
const origin = 'http://localhost:4173/redcarpert-prototype';
const routes = ['/product', ...catalogueCategories.map(c => c.route.replace(/\/$/, ''))];
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  for (const width of [1440, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    try {
      for (const route of routes) {
        await page.goto(origin + route + '/', { waitUntil: 'domcontentloaded' });
        const expected = route === '/product' ? catalogueProducts :
          catalogueProducts.filter(p => route.endsWith('/' + p.category));
        const cards = await page.locator('ul.products[data-catalogue-preview] li.product').evaluateAll(nodes => nodes.map(card => {
          const img = card.querySelector('img');
          const link = card.querySelector('a.woocommerce-LoopProduct-link');
          const title = card.querySelector('h2.redcarpert-catalogue-title');
          const collection = title?.querySelector('.redcarpert-catalogue-collection');
          const divider = title?.querySelector('.redcarpert-catalogue-divider');
          const number = title?.querySelector('.redcarpert-catalogue-number');
          if (!img || !link || !title || !collection || !divider || !number) return { invalid: true };
          const rect = element => {
            const r = element.getBoundingClientRect();
            return { left:r.left, right:r.right, top:r.top, bottom:r.bottom,
              width:r.width, height:r.height, cx:r.left+r.width/2 };
          };
          return {
            id: card.getAttribute('data-catalogue-id'),
            name: collection.textContent.trim(),
            number: number.textContent.trim(),
            link: link.getAttribute('href'),
            label: link.getAttribute('aria-label'),
            hiddenRule: divider.getAttribute('aria-hidden'),
            childClasses: [...title.children].map(c => c.className),
            titleAlignment: getComputedStyle(title).textAlign,
            collectionFont: getComputedStyle(collection).fontFamily,
            numberFont: getComputedStyle(number).fontFamily,
            cardRect: rect(card), imageRect: rect(img), titleRect: rect(title),
            collectionRect: rect(collection), dividerRect: rect(divider), numberRect: rect(number),
            priceCount: card.querySelectorAll('[data-dress-price], .redcarpert-catalogue-price').length,
          };
        }));
        assert.equal(cards.length, expected.length, width + 'px ' + route + ' card count');
        for (const [index, card] of cards.entries()) {
          const product = expected[index];
          const category = catalogueCategories.find(c => c.id === product.category);
          const name = category.name.replace(/ Dresses$/, '');
          const number = product.name.match(/(\d{2})$/)?.[1];
          assert(!card.invalid, width + 'px ' + route + ' missing editorial card components');
          assert.equal(card.id, product.id);
          assert.equal(card.name, name);
          assert.equal(card.number, number);
          assert.equal(card.hiddenRule, 'true');
          assert.deepEqual(card.childClasses, [
            'redcarpert-catalogue-collection',
            'redcarpert-catalogue-divider',
            'redcarpert-catalogue-number',
          ]);
          assert(card.link?.endsWith(product.previewRoute + '/'), product.id + ' detail link must stay intact');
          assert.equal(card.label, name + ' ' + number + ': view dress photographs');
          assert.equal(card.titleAlignment, 'center');
          assert.match(card.collectionFont, /Cormorant Garamond/);
          assert.match(card.numberFont, /Montserrat/);
          assert(card.collectionRect.bottom <= card.dividerRect.top + 1,
            width + 'px ' + product.id + ' name overlaps divider');
          assert(card.dividerRect.bottom <= card.numberRect.top + 1,
            width + 'px ' + product.id + ' divider overlaps number');
          assert(Math.abs(card.dividerRect.cx - card.titleRect.cx) < 3,
            width + 'px ' + product.id + ' divider is off centre');
          assert(card.numberRect.bottom <= card.titleRect.bottom + 2,
            width + 'px ' + product.id + ' number extends beyond title');
          assert(card.imageRect.bottom <= card.titleRect.top + 2,
            width + 'px ' + product.id + ' image overlaps title');
          assert(card.cardRect.left >= -1 && card.cardRect.right <= width + 1,
            width + 'px ' + product.id + ' escapes viewport');
          assert(Math.abs(card.imageRect.width - card.imageRect.height) <= 2,
            width + 'px ' + product.id + ' must keep square photo');
          assert.equal(card.priceCount, 0);
        }
        // Regression for WooCommerce's nth-child(2n) float: selecting any
        // category must pack its FIRST visible dress into column one, then
        // fill subsequent cards left-to-right with no empty grid slots.
        if (route === '/product') {
          const columns = width <= 640 ? 2 : width <= 1000 ? 3 : 4;
          for (const filter of ['all', ...catalogueCategories.map(c => c.id)]) {
            await page.locator('[data-filter-category="' + filter + '"]').click();
            const matching = filter === 'all' ? catalogueProducts :
              catalogueProducts.filter(product => product.category === filter);
            const layout = await page.locator('ul.products[data-catalogue-preview]').evaluate(grid => {
              const rect = el => {
                const box = el.getBoundingClientRect();
                return {left:box.left,top:box.top,right:box.right,width:box.width};
              };
              const visible = [...grid.querySelectorAll('li.product')].filter(
                item => getComputedStyle(item).display !== 'none'
              );
              return {
                display:getComputedStyle(grid).display,
                columns:getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length,
                beforeDisplay:getComputedStyle(grid,'::before').display,
                afterDisplay:getComputedStyle(grid,'::after').display,
                grid:rect(grid),
                items:visible.map(card => ({
                  id:card.getAttribute('data-catalogue-id'),
                  box:rect(card),
                  float:getComputedStyle(card).float,
                  clear:getComputedStyle(card).clear,
                })),
              };
            });
            const prefix = width + 'px ' + filter + ': ';
            assert.equal(layout.display, 'grid', prefix + 'catalogue must use CSS Grid');
            assert.equal(layout.columns, columns, prefix + 'unexpected responsive column count');
            assert.equal(layout.beforeDisplay, 'none', prefix + 'WooCommerce ::before occupies a grid slot');
            assert.equal(layout.afterDisplay, 'none', prefix + 'WooCommerce ::after occupies a grid slot');
            assert.deepEqual(layout.items.map(item => item.id), matching.map(item => item.id),
              prefix + 'filter must preserve complete dress order');
            assert.equal(await page.locator('[data-filter-status]').textContent(),
              'Showing ' + matching.length + ' of 35 wedding dresses');
            assert(layout.items.length > 0, prefix + 'category must contain visible dresses');
            const left = layout.items[0].box.left;
            assert(Math.abs(left - layout.grid.left) <= 2,
              prefix + 'FIRST visible dress must start in FIRST column: ' + JSON.stringify(layout.items[0]));
            for (const [index, item] of layout.items.entries()) {
              assert.equal(item.float, 'none', prefix + item.id + ' must not float');
              assert.equal(item.clear, 'none', prefix + item.id + ' must not clear rows');
              assert(item.box.left >= layout.grid.left - 2 &&
                item.box.right <= layout.grid.right + 2,
                prefix + item.id + ' extends beyond catalogue grid');
              const rowStart = layout.items[index - index % columns];
              assert(Math.abs(item.box.top - rowStart.box.top) <= 2,
                prefix + item.id + ' is displaced from its row');
              if (index % columns === 0) {
                assert(Math.abs(item.box.left - left) <= 2,
                  prefix + item.id + ' row must begin at column one');
              } else {
                assert(item.box.left > layout.items[index - 1].box.left + 2,
                  prefix + item.id + ' must appear to the right of the previous dress');
              }
              if (index >= columns) {
                assert(item.box.top > layout.items[index - columns].box.top + 2,
                  prefix + item.id + ' must be in the next row');
              }
            }
          }
          await page.locator('[data-filter-category="all"]').click();
        }
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          width + 'px ' + route + ' must not scroll horizontally');
      }
    } finally { await page.close(); }
  }
  console.log('Luxury catalogue cards PASS: five collections, 35 labels, four viewports');
} finally { await browser.close(); }
