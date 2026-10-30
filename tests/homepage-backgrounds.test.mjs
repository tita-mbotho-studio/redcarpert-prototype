import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";
import sharp from "sharp";
import { adaptHomepageBackgrounds } from "../src/lib/homepage-backgrounds.ts";
import { adaptSiteDocument } from "../src/lib/content-adapter.ts";
import { contentAdaptations } from "../src/data/content-adaptations.ts";
import { sitePages } from "../src/data/site.ts";

const expectedImages = [
  ["/site-assets/ec8b6b2c4222396c44.png", "/redcarpert/home/brand-pexels-sample.webp", 2560, 1370],
  ["/site-assets/9def3725208290c4ef.png", "/redcarpert/home/collection-pexels-sample.webp", 2560, 1370],
  ["/site-assets/46f8a1c412d65fd42b.png", "/redcarpert/home/hero-pexels-sample.webp", 2540, 1250],
];
const at = (document, section) => document.nodes[1].children[1].children[4].children[1].children[1].children[section];
const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
};

test("only the three approved inline URL substrings change; text, layout, CSS and runtime data survive", () => {
  freeze(sitePages);
  const textAdapted = adaptSiteDocument(sitePages["/"], contentAdaptations);
  const expected = structuredClone(textAdapted);
  expectedImages.forEach(([oldUrl, newUrl], index) => {
    const node = at(expected, index);
    assert.equal(node.attrs.style, `background-image:url("${oldUrl}");background-position:center center;`);
    node.attrs.style = `background-image:url("${newUrl}");background-position:center center;`;
  });
  const result = adaptHomepageBackgrounds(textAdapted);
  assert.deepEqual(result, expected);
  for (const key of Object.keys(textAdapted).filter((key) => key !== "nodes")) assert.strictEqual(result[key], textAdapted[key], key);
  assert.equal(at(result, 0).children[0].children[2].children[0], "Explore Wedding Dresses");
  assert.equal(at(result, 0).children[0].children[2].attrs.href, "/product/");
  assert.equal(at(result, 2).children[0].children[0].children[0], "Redcarpert Wedding Dresses");
  assert.strictEqual(result.nodes[1].children[1].children[2], textAdapted.nodes[1].children[1].children[2], "Header remains shared");
});

test("all original documents stay immutable and all other 7 routes retain their original image references", () => {
  const hash = () => createHash("sha256").update(JSON.stringify(sitePages)).digest("hex");
  const before = hash();
  assert.equal(Object.keys(sitePages).length, 8);
  for (const [route, original] of Object.entries(sitePages)) {
    const result = adaptHomepageBackgrounds(original);
    if (route !== "/") assert.strictEqual(result, original, route);
  }
  assert.equal(hash(), before);
});

test("unexpected URLs, extra declarations, changed classes/tags or missing/reordered sections fail closed", () => {
  for (const modify of [
    (node) => { node.attrs.style = node.attrs.style.replace(".png", "-unexpected.png"); },
    (node) => { node.attrs.style += "background-size:contain;"; },
    (node) => { node.attrs.class = "different-section"; },
    (node) => { node.tag = "section"; },
  ]) {
    const document = structuredClone(sitePages["/"]);
    modify(at(document, 1));
    const before = JSON.stringify(document);
    assert.throws(() => adaptHomepageBackgrounds(document), /expected original section and inline style/);
    assert.equal(JSON.stringify(document), before, "A failure after an earlier replacement cannot mutate the input");
  }
  const missing = structuredClone(sitePages["/"]);
  missing.nodes = [];
  assert.throws(() => adaptHomepageBackgrounds(missing), /expected original section/);
  const reordered = structuredClone(sitePages["/"]);
  const sections = reordered.nodes[1].children[1].children[4].children[1].children[1].children;
  [sections[0], sections[1]] = [sections[1], sections[0]];
  assert.throws(() => adaptHomepageBackgrounds(reordered), /expected original section/);
});

test("replacement assets decode as compact WebP at their unchanged canvas dimensions", async () => {
  for (const [original, replacement, width, height] of expectedImages) {
    const oldImage = await sharp(readFileSync(`public${original}`)).metadata();
    const image = sharp(readFileSync(`public${replacement}`));
    const metadata = await image.metadata();
    assert.deepEqual([metadata.width, metadata.height], [width, height]);
    assert.deepEqual([oldImage.width, oldImage.height], original.includes("ec8b6") ? [2540, 1250] : [2560, 1370]);
    assert.equal(metadata.format, "webp");
    assert.ok(statSync(`public${replacement}`).size < 1_000_000);
    await image.raw().toBuffer(); // Decode the whole raster, not only its header.
  }
});
