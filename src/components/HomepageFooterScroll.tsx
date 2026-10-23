"use client";

import { useEffect } from "react";

type FullpageApi = { setAutoScrolling: (enabled: boolean) => void };

/** A native-scroll tail, not another fullscreen section. Mobile already scrolls natively. */
export function HomepageFooterScroll() {
  useEffect(() => {
    let nativeTail = false;
    let target = 0;
    let direction = 0;
    let lastTailWheel = -Infinity;
    let returningWheel = false;
    let returningKey = false;
    const footer = document.querySelector<HTMLElement>("footer[data-homepage-footer]");
    if (!footer) return;
    const api = () => (window as Window & { jQuery?: { fn?: { fullpage?: FullpageApi } } }).jQuery?.fn?.fullpage;
    const last = () => [...document.querySelectorAll<HTMLElement>(".fullpage-wrapper > .section")].at(-1);
    const mobile = () => document.body.classList.contains("mobile");
    const ignored = (eventTarget: EventTarget | null) => document.querySelector("dialog[open]")
      || (eventTarget instanceof Element && eventTarget.closest("input, textarea, select, [contenteditable=true]"));
    const ready = () => {
      const section = last();
      return !mobile() && api() && section?.classList.contains("active")
        && Math.abs(section.getBoundingClientRect().top) < 2;
    };
    const restore = () => {
      if (!nativeTail) return;
      nativeTail = false;
      // Cancel pending native motion before the plugin reapplies section 3's
      // transform. No input that reaches this boundary may also reach the theme.
      window.scrollTo({ top: window.scrollY, behavior: "instant" });
      api()?.setAutoScrolling(true);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    const enter = () => {
      api()?.setAutoScrolling(false);
      // Keep viewport-fixed theme elements anchored during native flow.
      const container = document.getElementById("superContainer");
      if (container) container.style.transform = "none";
      nativeTail = true;
      target = window.scrollY;
      direction = 0;
    };
    const advance = (delta: number) => {
      const section = last();
      if (!section) return;
      const boundary = window.scrollY + section.getBoundingClientRect().top;
      if (Math.sign(delta) !== direction) target = window.scrollY;
      direction = Math.sign(delta);
      // Bound the destination before scrolling, rather than correcting an
      // overshoot in a scroll handler after earlier sections have been exposed.
      const end = Math.max(boundary, document.documentElement.scrollHeight - window.innerHeight);
      target = Math.max(boundary, Math.min(end, target + delta));
      if (delta < 0 && window.scrollY <= boundary + 1) restore();
      else window.scrollTo({ top: target, behavior: "smooth" });
    };
    const wheel = (event: WheelEvent) => {
      if (ignored(event.target) || mobile() || !event.deltaY) return;
      const now = performance.now();
      // Consecutive momentum events belong to the return gesture. A fresh
      // gesture after a quiet interval can use the original section navigation.
      if (!nativeTail && returningWheel && event.deltaY < 0 && now - lastTailWheel < 180) {
        lastTailWheel = now;
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      returningWheel = false;
      if (!nativeTail && !(event.deltaY > 0 && ready())) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!nativeTail) enter();
      lastTailWheel = now;
      returningWheel = event.deltaY < 0;
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      advance(Math.sign(pixels) * Math.min(Math.abs(pixels), 120));
    };
    const scroll = () => {
      if (nativeTail && direction < 0 && Math.abs(last()?.getBoundingClientRect().top ?? Infinity) < 1) restore();
    };
    const key = (event: KeyboardEvent) => {
      if (ignored(event.target) || mobile()) return;
      const down = ["ArrowDown", "PageDown", "End", " "].includes(event.key) && !event.shiftKey;
      const up = ["ArrowUp", "PageUp", "Home"].includes(event.key) || (event.key === " " && event.shiftKey);
      if (!down && !up) return;
      if (!nativeTail && returningKey && event.repeat && up) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (!nativeTail && !(down && ready())) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!nativeTail) enter();
      returningKey = up;
      const distance = event.key.startsWith("Arrow") ? 40 : window.innerHeight * 0.8;
      advance(up ? -distance : distance);
    };
    const keyup = () => { returningKey = false; };
    const click = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest(".fullpage-nav")) restore();
    };
    window.addEventListener("wheel", wheel, { capture: true, passive: false });
    window.addEventListener("keydown", key, true);
    window.addEventListener("keyup", keyup, true);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("wheel", wheel, true);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("keyup", keyup, true);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("click", click, true);
      restore();
    };
  }, []);
  return null;
}
