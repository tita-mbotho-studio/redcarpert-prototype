import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import imageLinks from "../src/data/image-links.json" with { type: "json" };
import { requireImageLink } from "../src/lib/image-links.ts";
import { catalogueProducts } from "../src/data/catalogue.ts";
import { adaptEditorialDocument } from "../src/lib/editorial-pages.ts";
import { sitePages } from "../src/data/site.ts";

const descendants = children => children.flatMap(node =>
  typeof node === "string" ? [] : [node, ...descendants(node.children)]);

test("remaining Pexels stock imagery is limited to inspiration catalogue photographs", () => {
  const collection = Object.values(imageLinks.products).flat();
  assert.equal(collection.length, 12);
  assert.equal(new Set(collection.map(item => item.id)).size, 12);
  assert.equal(new Set(collection.map(item => item.url)).size, 12);
  for (const item of collection) {
    const url = new URL(item.url);
    assert.equal(url.hostname, "images.pexels.com");
    assert(url.pathname.startsWith("/photos/"));
    if ("sourceUrl" in item) {
      const source = new URL(item.sourceUrl);
      assert.equal(source.hostname, "www.pexels.com");
      assert(source.pathname.startsWith("/photo/"));
      const id = url.pathname.match(/\/photos\/(\d+)\//)?.[1];
      assert(id && source.pathname.endsWith(id + "/"));
    }
  }
  assert.equal(collection.filter(x => "sourceUrl" in x).length, 12);

});

test("catalogue photos and lookbook links stay identical", () => {
  assert.equal(catalogueProducts.length, 35);
  const sampleDresses=catalogueProducts.filter(product=>product.status==='sample');
  assert.equal(sampleDresses.length,12);
  for (const product of sampleDresses) {
    const ref = requireImageLink(imageLinks.products[product.category], product.id);
    assert.equal(product.image, ref.url);
    assert.equal(product.imageCredit.sourceUrl, ref.sourceUrl);
    assert.match(product.imageAlt, /wedding dress photograph/);
  }
  assert.equal(imageLinks.products.ball_gown.length,0,'retired sample Ball Gown photo URLs should not remain');
  assert.equal(imageLinks.products.ruffled.length,0,'Ruffled client assets now live in the dedicated gallery manifest');
  assert.equal(catalogueProducts.filter(product=>product.status==='client').length,23);
});

test("About Us displays all six named, client-supplied ImageKit models", () => {
  const nodes = descendants(adaptEditorialDocument(sitePages["/about-us"]).nodes);
  const cards = nodes.filter(node => node.attrs.class === "redcarpert-editorial-team-card");
  assert.equal(cards.length, 6);
  assert.deepEqual(cards.map(card => descendants(card.children)
    .find(node => node.tag === "img")?.attrs.src), imageLinks.about_us.team.map(item => item.url));
  assert.deepEqual(cards.map(card => descendants(card.children)
    .find(node => node.tag === "h3")?.children[0]), imageLinks.about_us.team.map(item => item.name));
  assert(cards.every(card => descendants(card.children)
    .some(node => node.tag === "img" && node.attrs.src.startsWith("https://ik.imagekit.io/"))));
});

test("live modules contain no duplicate Pexels image URLs outside the manifest", () => {
  for (const path of ["src/data/catalogue.ts", "src/lib/editorial-pages.ts"]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /https:\/\/images\.pexels\.com\//, path);
  }
  assert.equal(imageLinks.about_us.atelier.length, 0);
  assert.equal(imageLinks.contact_us.length, 0);
  assert.equal(imageLinks.digital_lookbook.length, 0);
});
