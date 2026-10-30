import { lookbookEntries } from './lookbook.js';

/** Simple prototype reader. Interactive page-turn version is Implementation 13. */
export function initializeLookbookReader(base) {
const viewer = document.querySelector('.redcarpert-lookbook');
if (viewer) {
  let index = 0;
  function update() {
    const item = lookbookEntries[index], image = viewer.querySelector('img');
    image.src = base + item.image.slice(1); image.alt = item.alt;
    image.width = index === 0 ? 1696 : 1484; image.height = index === 0 ? 2528 : 2212;
    viewer.querySelector('h3').textContent = item.category;
    viewer.querySelector('[data-sample]').textContent = item.name + ' — demonstration photograph';
    viewer.querySelector('[data-detail]').href = base + item.href.slice(1);
    viewer.querySelector('[aria-live]').textContent = `Page ${index + 1} of 2`;
    viewer.querySelector('[data-previous]').disabled = index === 0; viewer.querySelector('[data-next]').disabled = index === 1;
  }
  viewer.querySelector('[data-previous]').onclick = () => { index = Math.max(0,index-1); update(); };
  viewer.querySelector('[data-next]').onclick = () => { index = Math.min(1,index+1); update(); };
}
}
