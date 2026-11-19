/** Functional category filter; restores original dress links when leaving Modern Tradition. */
export function initializeCatalogueFilter() {
  const controls=document.querySelector('[data-catalogue-filter]');
  const grid=document.querySelector('ul.products[data-catalogue-preview]');
  if(!controls || !grid)return;
  const buttons=[...controls.querySelectorAll('button[data-filter-category]')];
  const items=[...grid.querySelectorAll('li[data-catalogue-category]')];
  const allowed=new Set(buttons.map(b=>b.dataset.filterCategory));
  // Remember each dress's native silhouette label and accessible link text.
  // Filtering into Modern Tradition relabels only the presentation, never the
  // underlying product ID, price or permanent source category.
  const originalCards=new Map(items.map(item=>{
    const heading=item.querySelector('.redcarpert-catalogue-collection');
    const number=item.querySelector('.redcarpert-catalogue-number');
    const image=item.querySelector('img');
    const link=item.querySelector('a.woocommerce-LoopProduct-link');
    return [item,{heading,number,image,link,
      collection:heading?.textContent??'',numberLabel:number?.textContent??'',
      named:number?.hasAttribute('data-catalogue-named')??false,
      alt:image?.getAttribute('alt')??'',aria:link?.getAttribute('aria-label')??'',
      href:link?.getAttribute('href')??''}];
  }));
  const current=()=>{
    const requested=new URLSearchParams(location.search).get('category');
    return allowed.has(requested)?requested:'all';
  };
  const apply=category=>{
    let shown=0;
    for(const item of items){
      const collections=(item.dataset.catalogueCollections||item.dataset.catalogueCategory||'').split(/\s+/);
      const visible=category==='all'||collections.includes(category);
      item.hidden=!visible;
      item.classList.toggle('redcarpert-filtered-out',!visible);
      const original=originalCards.get(item);
      if(original?.heading){
        const modern=category==='modern_tradition' && collections.includes('modern_tradition');
        original.heading.textContent=modern?'Modern Tradition':original.collection;
        const modernNumber=item.dataset.catalogueModernNumber;
        if(original.number){
          original.number.textContent=modern&&modernNumber?modernNumber:original.numberLabel;
          original.number.toggleAttribute('data-catalogue-named',!modern&&original.named);
        }
        if(original.image){
          original.image.setAttribute('alt',modern&&modernNumber
            ? 'Modern Tradition dress '+modernNumber:original.alt);
        }
        if(original.link){
          const contextualHref=item.dataset.catalogueModernHref;
          original.link.setAttribute('href',modern&&modernNumber&&contextualHref
            ? contextualHref : original.href);
          original.link.setAttribute('aria-label',modern&&modernNumber
            ? 'Modern Tradition '+modernNumber+': view dress photographs'
            : original.aria);
        }
      }
      // Grid places visible cards in source order; no four-column
      // first/last float bookkeeping is needed at any breakpoint.
      if(visible)shown++;
    }
    for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.filterCategory===category));
    const status=controls.querySelector('[data-filter-status]');
    if(status)status.textContent='Showing '+shown+' of '+items.length+' wedding dresses';
    controls.dataset.activeCategory=category;
  };
  apply(current());
  controls.addEventListener('click',event=>{
    const button=event.target.closest('button[data-filter-category]');
    if(!button||!controls.contains(button))return;
    const category=button.dataset.filterCategory;
    if(!allowed.has(category))return;
    const url=new URL(location.href);
    if(category==='all')url.searchParams.delete('category');
    else url.searchParams.set('category',category);
    if(url.href!==location.href)history.pushState(null,'',url);
    apply(category);
  });
  window.addEventListener('popstate',()=>apply(current()));
}
