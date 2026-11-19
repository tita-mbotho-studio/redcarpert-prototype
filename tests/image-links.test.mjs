import assert from "node:assert/strict";
import test from "node:test";
import imageLinks from "../src/data/image-links.json" with { type: "json" };
import { homepageBackgrounds } from "../src/lib/homepage-backgrounds.ts";

const isSafeImageUrl = (value) => {
  assert.equal(typeof value, "string");
  assert(!/["'\\\n\r<>]/.test(value), "image URLs must not contain HTML/CSS delimiters");
  const url = new URL(value);
  assert.equal(url.protocol, "https:", "published photos must use HTTPS");
  assert(url.hostname.length > 0);
};

test("the image manifest provides predictable sections for every editable page", () => {
  assert.deepEqual(Object.keys(imageLinks), [
    "home_page", "wedding_moments", "about_us", "contact_us", "digital_lookbook",
  ]);
  assert(Array.isArray(imageLinks.home_page.hero));
  assert(Array.isArray(imageLinks.wedding_moments.events));
  assert.deepEqual(Object.keys(imageLinks.about_us), ["atelier", "team"]);
  assert(Array.isArray(imageLinks.about_us.atelier));
  assert(Array.isArray(imageLinks.about_us.team));
  assert(Array.isArray(imageLinks.contact_us));
  assert(Array.isArray(imageLinks.digital_lookbook));
});

test("homepage uses manifest URLs directly, in the approved order", () => {
  const photos = imageLinks.home_page.hero;
  assert.deepEqual(photos.map((photo) => photo.id), ["home-page-1", "home-page-2", "home-page-3"]);
  assert.deepEqual(homepageBackgrounds.map((photo) => photo.replacement),
    photos.map((photo) => photo.url));
  for (const photo of photos) isSafeImageUrl(photo.url);
  assert.equal(new Set(photos.map((photo) => photo.id)).size, 3);
  assert.equal(new Set(photos.map((photo) => photo.url)).size, 3);
});

test("About Us uses six distinct named ImageKit portraits in the approved order", () => {
  const expected = ["Shantel", "Refiloe", "Olga", "Mapaseka", "Defny", "Paula"];
  const portraits = imageLinks.about_us.team;
  assert.equal(portraits.length, expected.length);
  assert.deepEqual(portraits.map(photo => photo.name), expected);
  assert.equal(new Set(portraits.map(photo => photo.id)).size, 6);
  assert.equal(new Set(portraits.map(photo => photo.url)).size, 6);
  for (const photo of portraits) {
    isSafeImageUrl(photo.url);
    const url = new URL(photo.url);
    assert.equal(url.hostname, "ik.imagekit.io");
    assert.equal(url.pathname,
      "/kw8awoqvwi/red-carpet-wedding-dresses/about-us/redcarpert-about-us-" + photo.id + ".jpg");
    assert.equal(photo.name.toLowerCase(), photo.id);
    assert(Number.isSafeInteger(photo.width) && photo.width > 0);
    assert(Number.isSafeInteger(photo.height) && photo.height > 0);
  }
});

test("future photo groups accept empty lists but require well-formed records when populated", () => {
  const entries = [
    ...imageLinks.wedding_moments.events.flatMap(event => event.media), ...imageLinks.about_us.atelier,
    ...imageLinks.about_us.team, ...imageLinks.contact_us,
    ...imageLinks.digital_lookbook,
  ];
  for (const photo of entries) {
    assert(photo && typeof photo === "object" && !Array.isArray(photo));
    assert.equal(typeof photo.id, "string");
    assert(photo.id.trim().length > 0);
    if (Object.hasOwn(photo, "url")) isSafeImageUrl(photo.url);
    if (Object.hasOwn(photo, "images")) {
      assert(Array.isArray(photo.images));
      for (const url of photo.images) isSafeImageUrl(url);
    }
    assert(Object.hasOwn(photo, "url") || Object.hasOwn(photo, "images"),
      "each future photo entry needs a url or images list");
  }
});
