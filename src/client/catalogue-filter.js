/** Functional category filter for the mixed-source Wedding Dresses grid; never changes routes. */
export function initializeCatalogueFilter() {
  const controls=document.querySelector('[data-catalogue-filter]');
  const grid=document.querySelector('ul.products[data-catalogue-preview]');
  if(!controls || !grid)return;
  const buttons=[...controls.querySelectorAll('button[data-filter-category]')];
  const items=[...grid.querySelectorAll('li[data-catalogue-category]')];
  const allowed=new Set(buttons.map(b=>b.dataset.filterCategory));
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
