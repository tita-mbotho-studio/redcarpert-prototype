import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueProducts, catalogueCategories } from '../src/data/catalogue.ts';
import { initializeCatalogueFilter } from '../src/client/catalogue-filter.js';
import { modernTraditionPageForDress } from '../src/lib/modern-tradition.ts';

const element=(text='',attrs={})=>{
  const attributes=new Map(Object.entries(attrs));
  return {
    textContent:text,
    getAttribute:key=>attributes.get(key)??null,
    setAttribute:(key,value)=>attributes.set(key,String(value)),
    hasAttribute:key=>attributes.has(key),
    toggleAttribute:(key,enabled)=>enabled?attributes.set(key,''):attributes.delete(key),
  };
};

test('Modern Tradition filter relabels 4 cards 01–04, switches detail links and restores originals',()=>{
  const old={document:globalThis.document,window:globalThis.window,
    location:globalThis.location,history:globalThis.history};
  const buttons=catalogueCategories.map(c=>({dataset:{filterCategory:c.id},
    setAttribute(){},closest(){return this;}}));
  buttons.unshift({dataset:{filterCategory:'all'},setAttribute(){},closest(){return this;}});
  const visibleStatus=element();
  let onClick, onPopState;
  const controls={
    dataset:{},
    querySelectorAll:()=>buttons,
    querySelector:()=>visibleStatus,
    addEventListener:(name,handler)=>{if(name==='click')onClick=handler;},
    contains:()=>true,
  };
  const records=catalogueProducts.map(p=>{
    const ordinal=catalogueProducts.filter(x=>x.collections.includes('modern_tradition'))
      .findIndex(x=>x.id===p.id);
    const number=p.name.match(/(\d{2})$/)?.[1]??p.name.replace(/^(?:Mermaid|2 in 1) /,'');
    const collection=catalogueCategories.find(c=>c.id===p.category).name.replace(/ Dresses$/,'');
    const header=element(collection);
    const label=element(number,number.match(/^\d{2}$/)?{}:{'data-catalogue-named':''});
    const image=element('',{alt:p.imageAlt});
    const link=element('',{'aria-label':(p.name.match(/(\d{2})$/)?collection+' '+number:p.name)+': view dress photographs',
      href:'/redcarpert-prototype'+p.previewRoute+'/'});
    const card={
      dataset:{catalogueCategory:p.category,catalogueCollections:p.collections.join(' '),
        ...(ordinal>=0?{catalogueModernNumber:String(ordinal+1).padStart(2,'0'),
          catalogueModernHref:'/redcarpert-prototype'+modernTraditionPageForDress(p.id).route+'/'}:{})},
      hidden:false,classList:{toggle(){}},
      querySelector:selector=>selector==='.redcarpert-catalogue-collection'?header
        :selector==='.redcarpert-catalogue-number'?label
        :selector==='img'?image
        :selector==='a.woocommerce-LoopProduct-link'?link:null,
    };
    return {p,card,header,label,image,link,original:{number,collection,alt:p.imageAlt,
      aria:link.getAttribute('aria-label'),href:link.getAttribute('href'),
      named:label.hasAttribute('data-catalogue-named')}};
  });
  const grid={querySelectorAll:()=>records.map(r=>r.card)};
  globalThis.document={querySelector:selector=>selector==='[data-catalogue-filter]'?controls
    :selector==='ul.products[data-catalogue-preview]'?grid:null};
  globalThis.location={href:'https://example.test/product/',search:''};
  globalThis.history={pushState:(_state,_title,uri)=>{globalThis.location.href=uri;
    globalThis.location.search=new URL(uri).search;}};
  globalThis.window={addEventListener:(name,handler)=>{if(name==='popstate')onPopState=handler;}};

  try{
    initializeCatalogueFilter();
    assert.equal(visibleStatus.textContent,'Showing 56 of 56 wedding dresses');
    const click=id=>onClick({target:buttons.find(b=>b.dataset.filterCategory===id)});
    click('modern_tradition');
    const shown=records.filter(r=>!r.card.hidden);
    assert.equal(shown.length,4);
    assert.equal(visibleStatus.textContent,'Showing 4 of 56 wedding dresses');
    for(const [i,r] of shown.entries()){
      const ordinal=String(i+1).padStart(2,'0');
      assert.equal(r.header.textContent,'Modern Tradition');
      assert.equal(r.label.textContent,ordinal);
      assert.equal(r.link.getAttribute('aria-label'),'Modern Tradition '+ordinal+': view dress photographs');
      assert.equal(r.image.getAttribute('alt'),'Modern Tradition dress '+ordinal);
      assert.equal(r.link.getAttribute('href'),'/redcarpert-prototype'+modernTraditionPageForDress(r.p.id).route+'/');
      assert.equal(r.label.hasAttribute('data-catalogue-named'),false);
    }
    click('ball_gown');
    assert.equal(records.filter(r=>!r.card.hidden).length,12,
      'Ball Gown category must retain its twelve original dress listings');
    assert.equal(visibleStatus.textContent,'Showing 12 of 56 wedding dresses');
    click('ruffled');
    const shownRuffled=records.filter(r=>!r.card.hidden);
    assert.equal(shownRuffled.length,17,'Ruffled filter must expose all seventeen client dresses');
    assert(shownRuffled.every(r=>r.p.category==='ruffled'));
    assert.equal(visibleStatus.textContent,'Showing 17 of 56 wedding dresses');
    click('all');
    assert.equal(records.filter(r=>!r.card.hidden).length,56);
    assert.equal(visibleStatus.textContent,'Showing 56 of 56 wedding dresses');
    for(const r of records){
      assert.equal(r.header.textContent,r.original.collection);
      assert.equal(r.label.textContent,r.original.number);
      assert.equal(r.image.getAttribute('alt'),r.original.alt);
      assert.equal(r.link.getAttribute('aria-label'),r.original.aria);
      assert.equal(r.link.getAttribute('href'),r.original.href);
      assert.equal(r.label.hasAttribute('data-catalogue-named'),r.original.named);
    }
    globalThis.location.search='?category=modern_tradition';
    onPopState();
    assert.equal(records.filter(r=>!r.card.hidden).length,4);
    assert.equal(records.find(r=>r.p.id==='modern-tradition-04').link.getAttribute('href'),
      '/redcarpert-prototype/product/preview/modern-tradition-04/');
  }finally{
    for(const [key,value] of Object.entries(old)){
      if(value===undefined)delete globalThis[key];
      else globalThis[key]=value;
    }
  }
});
