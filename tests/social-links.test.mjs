import test from 'node:test';
import assert from 'node:assert/strict';
import { OFFICIAL_SOCIAL_LINKS } from '../src/config/social-links.ts';

test('footer social links match only the four client-supplied profiles', () => {
  assert.deepEqual(OFFICIAL_SOCIAL_LINKS.map(({platform,handle,url,icon})=>({platform,handle,url,icon})),[
    {
      platform:'Instagram',handle:'@Redcarpert_wedding_dresses',
      url:'https://www.instagram.com/Redcarpert_wedding_dresses/',icon:'instagram',
    },
    {
      platform:'TikTok',handle:'@Redcarpertweddingdresses',
      url:'https://www.tiktok.com/@Redcarpertweddingdresses',icon:'tiktok',
    },
    {
      platform:'TikTok',handle:'@redcarpertweddinggowns',
      url:'https://www.tiktok.com/@redcarpertweddinggowns',icon:'tiktok',
    },
    {
      platform:'Facebook',handle:'@redcarpertcouture_bridal',
      url:'https://www.facebook.com/redcarpertcouture_bridal/',icon:'facebook-f',
    },
  ]);
  const urls=OFFICIAL_SOCIAL_LINKS.map(s=>s.url);
  assert.equal(new Set(urls).size,4,'each social icon must have its own profile URL');
  for(const profile of OFFICIAL_SOCIAL_LINKS){
    const url=new URL(profile.url);
    assert.equal(url.protocol,'https:');
    assert.equal(url.username,'');
    assert.equal(url.password,'');
    assert.equal(url.search,'');
    assert.equal(url.hash,'');
    assert(!/youtube|twitter|pinterest/i.test(profile.platform));
  }
});
