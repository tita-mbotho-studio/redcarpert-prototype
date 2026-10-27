import assert from 'node:assert/strict';
import test from 'node:test';
import {sitePages} from '../src/data/site.ts';
import {adaptFooterSocials} from '../src/lib/footer-social-adapter.ts';
import {adaptNavigation} from '../src/lib/navigation-adapter.ts';
import {addHomepageFooter} from '../src/lib/homepage-footer.ts';
import {correctFooterLinks,legacyInstagramIcon,localInstagramIcon} from '../src/lib/footer-link-corrections.ts';
const all=nodes=>nodes.flatMap(n=>typeof n==='string'?[]:[n,...all(n.children)]);
const prepare=d=>adaptNavigation(addHomepageFooter(adaptFooterSocials(d),sitePages['/about-us']));
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
test('all captures preserve every subtree except exact icon, control attributes and Contact link',()=>{
 for(const source of Object.values(sitePages)){
  const input=freeze(prepare(source));const before=JSON.stringify(input);const output=correctFooterLinks(input);
  const compare=(a,b)=>{
   if(typeof a==='string')return assert.equal(a,b);
   const icon=a.tag==='img'&&a.attrs.src===legacyInstagramIcon;
   const control=a.attrs.class==='scroll-to-top';
   const contact=a.attrs.href==='https://www.instagram.com/bridal_vanesa/?utm_source=chatgpt.com';
   if(icon)assert.deepEqual(b.attrs,{...a.attrs,src:localInstagramIcon});
   else if(control)assert.deepEqual(b.attrs,{...a.attrs,role:'button',tabindex:'0','aria-label':'Scroll to top'});
   else if(contact){assert.equal(b.attrs.href,undefined);assert.equal(b.attrs.target,undefined);assert.equal(b.attrs['aria-disabled'],'true');assert.equal(b.attrs.class,a.attrs.class);assert.equal(b.children,a.children);}
   else assert.deepEqual(a.attrs,b.attrs);
   a.children.forEach((n,i)=>compare(n,b.children[i]));
   if(!all([a]).some(n=>n.attrs.src===legacyInstagramIcon||n.attrs.class==='scroll-to-top'||n.attrs.href?.includes('instagram.com/bridal_vanesa/?')))assert.equal(a,b);
  };
  input.nodes.forEach((n,i)=>compare(n,output.nodes[i]));
  assert.equal(JSON.stringify(input),before);
  assert.equal(all(output.nodes).filter(n=>n.attrs.src===localInstagramIcon).length,1);
 }
});
test('rejects missing, duplicate or unexpected captured targets',()=>{
 const input=prepare(sitePages['/contact-us']);
 const missing=structuredClone(input);all(missing.nodes).find(n=>n.attrs.src===legacyInstagramIcon).attrs.src='/unknown.png';
 assert.throws(()=>correctFooterLinks(missing),/expected unique/);
 const duplicate=structuredClone(input);all(duplicate.nodes).find(n=>n.tag==='footer').children.push(structuredClone(all(duplicate.nodes).find(n=>n.attrs.src===legacyInstagramIcon)));
 assert.throws(()=>correctFooterLinks(duplicate),/expected unique/);
 const changed=structuredClone(input);all(changed.nodes).find(n=>n.attrs.href?.includes('instagram.com/bridal_vanesa/?')).children=['changed'];
 assert.throws(()=>correctFooterLinks(changed),/Contact Instagram shape/);
 assert.throws(()=>correctFooterLinks(correctFooterLinks(input)),/expected unique|scroll control shape/);
});
