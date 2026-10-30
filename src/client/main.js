import { HeaderNavigationAlignment } from './HeaderNavigationAlignment.js';
import { FooterScrollToTop } from './FooterScrollToTop.js';
import { HomepageFooterScroll } from './HomepageFooterScroll.js';
import { SiteRuntime } from './SiteRuntime.js';
import { lookbookEntries } from './lookbook.js';
const base = import.meta.env.BASE_URL;
const data = JSON.parse(document.getElementById('page-runtime').textContent);
const dialog = document.querySelector('#enquiry-preview');
let trigger;
function open(control) { trigger = control; dialog.querySelector('[role=status]').textContent = ''; if (!dialog.open) dialog.showModal(); }
window.addEventListener('click', event => {
  const control = event.target.closest?.('#ht-ctc-chat, [data-whatsapp-preview]');
  if (!control) return;
  event.preventDefault(); event.stopImmediatePropagation(); open(control);
}, true);
window.addEventListener('keydown', event => {
  if (dialog.open) {
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
    const buttons = [...dialog.querySelectorAll('button')];
    if (event.key === 'Tab' && event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
    else if (event.key === 'Tab' && !event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
    return;
  }
  const control = event.target.closest?.('#ht-ctc-chat, [data-whatsapp-preview]');
  if (control && ['Enter', ' '].includes(event.key)) { event.preventDefault(); event.stopImmediatePropagation(); if (!event.repeat) open(control); }
}, true);
for (const type of ['wheel','touchmove']) window.addEventListener(type, event => { if (dialog.open) event.stopImmediatePropagation(); }, {capture:true,passive:true});
dialog.addEventListener('close', () => trigger?.focus({preventScroll:true}));
dialog.querySelector('[data-close]').onclick = () => dialog.close();
dialog.querySelector('[data-copy]').onclick = async () => {
  const message = dialog.querySelector('.message');
  try { await navigator.clipboard.writeText(message.textContent); dialog.querySelector('[role=status]').textContent = 'Message copied.'; }
  catch { const range = document.createRange(); range.selectNodeContents(message); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); dialog.querySelector('[role=status]').textContent = 'Automatic copying is unavailable. The message is selected; use your device’s Copy command.'; }
};
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
HeaderNavigationAlignment();
if (document.querySelector('footer[data-homepage-footer]')) HomepageFooterScroll(); else FooterScrollToTop();
SiteRuntime({document:data});
