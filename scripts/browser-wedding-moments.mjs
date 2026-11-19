import { chromium } from "playwright";
import assert from "node:assert/strict";
import { weddingMomentEvents } from "../src/lib/wedding-moments.ts";
import { weddingMomentDeliveryImage } from "../src/lib/wedding-moment-image-delivery.ts";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const base = "https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-moments/";
const media=weddingMomentEvents[0].media;
const videoSource=media.find(item=>item.type==='video').url;
const firstPhotoSource=media.find(item=>item.type==='photo').url;
const totalMedia=media.length;
try {
  for (const width of [1440, 1000, 768, 640, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    // The media request is mocked below, so observe play() instead of expecting
    // an empty MP4 response to decode. Also exercise a browser playback denial.
    await page.addInitScript(blockAudioPlayback => {
      window.__weddingVideoPlayAttempts = [];
      const nativePlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...args) {
        if (this.matches('[data-wedding-preview-video]')) {
          window.__weddingVideoPlayAttempts.push({
            muted: this.muted,
            controls: this.controls,
            src: this.getAttribute('src'),
            dialogOpen: this.closest('dialog')?.open,
          });
          return blockAudioPlayback
            ? Promise.reject(new DOMException('Playback with sound blocked', 'NotAllowedError'))
            : Promise.resolve();
        }
        return nativePlay.apply(this, args);
      };
    }, width === 320);
    const errors = [];
    const galleryImageRequests = [];
    page.on("pageerror", err => errors.push(err.message));
    await page.route("https://ik.imagekit.io/**", route => {
      const url = route.request().url();
      if (url.includes("/wedding-moments/") &&
          (new URL(url).pathname.endsWith(".webp") ||
           new URL(url).pathname.endsWith("/ik-thumbnail.jpg"))) {
        galleryImageRequests.push(url);
      }
      if (route.request().resourceType() === "media") {
        return route.fulfill({ status: 200, contentType: "video/mp4", body: "" });
      }
      return route.fulfill({
        status: 200, contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#eee0d2"/></svg>',
      });
    });

    await page.goto("http://localhost:4173/redcarpert-prototype/wedding-moments/",
      { waitUntil: "domcontentloaded" });
    await page.locator("[data-wedding-moments-grid] button").first().waitFor();
    assert.equal(await page.title(), "Wedding Moments | Redcarpert Wedding Dresses");
    assert.equal(await page.locator("h1").filter({ hasText: "Wedding Moments" }).count(), 1);
    const content = page.locator(".redcarpert-moments-content-box");
    assert.equal(await page.locator('[data-editorial-route="/wedding-moments"]').count(), 1,
      "page metadata route must not be rewritten as a navigation URL");
    assert.equal(await content.locator(".redcarpert-moments-subtitle").textContent(),
      "The love, the laughter, the unforgettable moments.");
    assert.equal(await content.locator("h2,h3,figcaption").count(), 0);

    const gallery = page.locator("[data-wedding-moments-grid]");
    assert.equal(await gallery.count(), 1, "one continuous client gallery");
    const cards = gallery.locator("[data-wedding-moment-id]");
    const loadMore = page.locator("[data-wedding-load-more]");
    const template = page.locator("template[data-wedding-moments-remaining]");
    assert.equal(await cards.count(), 16, "first sixteen cards only");
    assert.equal(await template.evaluate(el => el.content.children.length), totalMedia-16,
      "remaining media tiles stay inert until selected");
    assert.equal(await loadMore.count(), 1);
    const loadMoreBox=await loadMore.boundingBox();
    assert(loadMoreBox,'Load More control must be visible before pagination');
    assert(loadMoreBox.height>=43.5,width+'px Load More needs a comfortable touch target');
    assert(loadMoreBox.x>=-1&&loadMoreBox.x+loadMoreBox.width<=width+1,
      width+'px Load More must remain within the viewport');
    const maxLoadMoreWidth=width<=640?130.5:width<=1000?145.5:160.5;
    assert(loadMoreBox.width<=maxLoadMoreWidth,
      width+'px Load More button must scale with the viewport');
    const loadMoreStyle=await loadMore.evaluate(el=>{
      const style=getComputedStyle(el);
      return {fontSize:parseFloat(style.fontSize),paddingLeft:parseFloat(style.paddingLeft),whiteSpace:style.whiteSpace};
    });
    assert.equal(loadMoreStyle.whiteSpace,'normal',
      width+'px Load More label must not force an oversized button');
    if(width<=640) {
      assert(loadMoreStyle.fontSize<=11.25,width+'px Load More text must shrink on phones');
      assert(loadMoreStyle.paddingLeft<=14.5,width+'px Load More padding must shrink on phones');
    }
    const counter = page.locator("[data-wedding-count]");
    assert.equal(await counter.textContent(), "Showing 16 of 90 wedding moments");
    const assertCenteredCounter = async () => {
      const alignment = await counter.evaluate(node => {
        const box = node.getBoundingClientRect();
        const parent = node.parentElement.getBoundingClientRect();
        return {
          textAlign: getComputedStyle(node).textAlign,
          horizontalOffset: Math.abs((box.left + box.right) / 2 - (parent.left + parent.right) / 2),
        };
      });
      assert.equal(alignment.textAlign, "center", "counter text must be centred at " + width + "px");
      assert(alignment.horizontalOffset < 2, "counter must align with gallery centre at " + width + "px");
    };
    await assertCenteredCounter();
    assert.equal(await gallery.locator("button[data-wedding-media=video]").count(), 1);
    assert.equal(await gallery.locator("button[data-wedding-media=photo]").count(), 15);
    const firstTiles = await gallery.locator('img').evaluateAll(images => images.map(img => ({
      source: img.getAttribute('src'),
      original: img.dataset.weddingOriginalThumbnail,
      loading: img.loading,
    })));
    assert.equal(firstTiles.length,16);
    assert(firstTiles.every(tile => tile.source?.includes('?tr=w-640,h-640,c-at_max,q-72,f-auto')),
      'visible tiles should request compact ImageKit versions, not original JPG files');
    assert(firstTiles.every(tile => tile.original?.startsWith(base)),
      'all client original media URLs must remain accessible as fallbacks');
    assert.equal(firstTiles.filter(tile => tile.loading === 'eager').length,4);
    assert.equal(firstTiles.filter(tile => tile.loading === 'lazy').length,12);
    assert.equal(await gallery.locator("a[href*='pexels.com']").count(), 0,
      "no stock video links after switching to real client media");
    assert.equal(await gallery.locator("button[data-wedding-media=video]").first()
      .getAttribute("data-wedding-src"), videoSource);

    const geometry = await page.evaluate(() => {
      const grid = document.querySelector("[data-wedding-moments-grid]");
      const image = document.querySelector("[data-wedding-moments-grid] img");
      const rect = image.getBoundingClientRect();
      return {
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        ratio: rect.width / rect.height,
        overflow: Math.max(document.documentElement.scrollWidth,
          document.body.scrollWidth) > innerWidth + 2,
      };
    });
    assert.equal(geometry.columns, width > 768 ? 4 : 2);
    assert(Math.abs(geometry.ratio - 1) < .02, "all media cards remain square");
    assert.equal(geometry.overflow, false, "no horizontal scrolling");

    // The X belongs outside the visible media, not over the photograph or film.
    // On wider desktops it sits to the right; on phones/tablets it sits above.
    const assertCloseOutsideMedia = async mediaSelector => {
      const positions = await dialog.evaluate((el, selector) => {
        const media = el.querySelector(selector).getBoundingClientRect();
        const close = el.querySelector('[data-wedding-preview-close]').getBoundingClientRect();
        return {
          media: {left: media.left, top: media.top, right: media.right, bottom: media.bottom},
          close: {left: close.left, top: close.top, right: close.right, bottom: close.bottom},
        };
      }, mediaSelector);
      const {media, close} = positions;
      assert(close.left >= -1 && close.right <= width+1,
        width+'px close button must remain inside the horizontal viewport');
      assert(close.top >= -1 && close.bottom <= 901,
        width+'px close button must remain inside the vertical viewport');
      if(width > 1000) {
        assert(close.left >= media.right+6,
          width+'px close button must be just to the right, not over the media');
        assert(close.left <= media.right+18,
          width+'px close button must remain near the upper-right corner');
        assert(Math.abs(close.top-media.top)<=2,
          width+'px close button must align with media top');
      } else {
        assert(close.bottom <= media.top-4,
          width+'px close button must be entirely above the media');
        assert(close.bottom >= media.top-14,
          width+'px close button should be just outside the top-right corner');
        assert(Math.abs(close.right-media.right)<=2,
          width+'px close button must align with media right edge');
      }
    };

    const firstPhoto = gallery.locator("button[data-wedding-media=photo]").first();
    assert.equal(await firstPhoto.getAttribute("data-wedding-src"),
      firstPhotoSource);
    assert.equal(await firstPhoto.getAttribute("data-wedding-preview-src"),
      weddingMomentDeliveryImage(firstPhotoSource,'preview'));
    await firstPhoto.click();
    const dialog = page.locator("#redcarpert-wedding-preview");
    assert(await dialog.evaluate(el => el.open));
    const fullImage = dialog.locator("[data-wedding-preview-photo]");
    await fullImage.waitFor({ state: "visible", timeout: 12000 });
    await page.waitForFunction(() => {
      const image = document.querySelector('[data-wedding-preview-photo]');
      return image?.complete && image.naturalWidth > 0;
    }, { timeout: 12000 });
    assert.equal(await fullImage.evaluate(el => getComputedStyle(el).objectFit), "contain");
    const photoFrame = await dialog.evaluate(el => {
      const inner = el.querySelector('.redcarpert-moment-dialog-inner');
      const image = el.querySelector('[data-wedding-preview-photo]');
      const style = getComputedStyle(inner);
      const imageBox = image.getBoundingClientRect();
      const innerBox = inner.getBoundingClientRect();
      return {
        padding: style.padding,
        background: style.backgroundColor,
        shadow: style.boxShadow,
        border: style.borderTopWidth,
        imageWidth: imageBox.width,
        frameWidth: innerBox.width,
        imageHeight: imageBox.height,
        frameHeight: innerBox.height,
      };
    });
    assert.equal(photoFrame.padding, '0px', width + 'px photo popup should have no padding');
    assert.equal(photoFrame.background, 'rgba(0, 0, 0, 0)', width + 'px photo popup should have no white background');
    assert.equal(photoFrame.shadow, 'none', width + 'px photo popup should have no frame shadow');
    assert.equal(photoFrame.border, '0px', width + 'px photo popup should have no border');
    assert(Math.abs(photoFrame.frameWidth - photoFrame.imageWidth) <= 2,
      width + 'px photo must fill the popup without side mats');
    assert(Math.abs(photoFrame.frameHeight - photoFrame.imageHeight) <= 2,
      width + 'px photo must fill the popup without top/bottom mats');
    await assertCloseOutsideMedia('[data-wedding-preview-photo]');
    await page.keyboard.press("Escape");
    assert.equal(await dialog.evaluate(el => el.open), false);
    await page.waitForFunction(() =>
      !document.querySelector("[data-wedding-preview-photo]").hasAttribute("src"),
      { timeout: 12000 });
    assert.equal(await fullImage.getAttribute("src"), null, "close removes large photo");

    const filmButton = gallery.locator("button[data-wedding-media=video]").first();
    await filmButton.click();
    const player = dialog.locator("[data-wedding-preview-video]");
    await player.waitFor({ state: "visible", timeout: 12000 });
    assert.equal(await player.getAttribute("src"), videoSource);
    assert(await player.evaluate(el => el.controls), "native video controls");
    assert(await player.evaluate(el => el.playsInline), "video plays inline on mobile");
    const videoFrame = await dialog.evaluate(el => {
      const inner = el.querySelector('.redcarpert-moment-dialog-inner');
      const video = el.querySelector('[data-wedding-preview-video]');
      const style = getComputedStyle(inner);
      const videoStyle = getComputedStyle(video);
      const videoBox = video.getBoundingClientRect();
      const innerBox = inner.getBoundingClientRect();
      return {
        padding: style.padding,
        background: style.backgroundColor,
        shadow: style.boxShadow,
        border: videoStyle.borderTopWidth,
        videoWidth: videoBox.width,
        frameWidth: innerBox.width,
      };
    });
    assert.equal(videoFrame.padding, '0px', width + 'px video popup should have no padding');
    assert.equal(videoFrame.background, 'rgba(0, 0, 0, 0)', width + 'px video popup should have no white background');
    assert.equal(videoFrame.shadow, 'none', width + 'px video popup should have no frame shadow');
    assert.equal(videoFrame.border, '0px', width + 'px video popup should have no border');
    assert(Math.abs(videoFrame.frameWidth - videoFrame.videoWidth) <= 2,
      width + 'px video must fill the popup without side mats');
    await assertCloseOutsideMedia('[data-wedding-preview-video]');
    const playbackAttempts = await page.evaluate(() => window.__weddingVideoPlayAttempts);
    assert.equal(playbackAttempts.length, 1, width + 'px clicking a film must attempt immediate playback');
    assert.equal(playbackAttempts[0].muted, false, width + 'px film should start with sound');
    assert.equal(playbackAttempts[0].controls, true, 'native video controls must remain available');
    assert.equal(playbackAttempts[0].dialogOpen, true, 'playback must be attempted after opening the popup');
    assert.equal(playbackAttempts[0].src, videoSource);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() =>
      !document.querySelector("[data-wedding-preview-video]").hasAttribute("src"),
      { timeout: 12000 });
    assert.equal(await player.getAttribute("src"), null, "close unloads video");

    for (const expected of [32, 48, 64, 80, 90]) {
      await loadMore.click();
      assert.equal(await cards.count(), expected, "Load More reveals another batch");
      assert.equal(await counter.textContent(),
        "Showing " + expected + " of " + totalMedia + " wedding moments");
    }
    assert.equal(await template.evaluate(el => el.content.children.length), 0);
    assert.equal(await loadMore.isVisible(), false, "Load More disappears when finished");
    await assertCenteredCounter();
    assert.equal(await gallery.locator("img").count(), totalMedia);
    assert.deepEqual(errors, [], "no JavaScript errors at " + width + "px");
    console.log("Wedding Moments real media PASS", width + "px",
      "image requests observed:", galleryImageRequests.length);
    await page.close();
  }
} finally {
  await browser.close();
}
