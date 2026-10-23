"use client";

import { useEffect } from "react";

type FullpageApi = { setAutoScrolling: (enabled: boolean) => void; moveTo: (section: number) => void };

/** A native-scroll tail, not another fullscreen section. Mobile already scrolls natively. */
export function HomepageFooterScroll() {
  useEffect(() => {
    let nativeTail = false;
    const footer = document.querySelector<HTMLElement>("footer[data-homepage-footer]");
    if (!footer) return;
    const api = () => (window as Window & { jQuery?: { fn?: { fullpage?: FullpageApi } } }).jQuery?.fn?.fullpage;
    const last = () => [...document.querySelectorAll<HTMLElement>(".fullpage-wrapper > .section")].at(-1);
    const mobile = () => document.body.classList.contains("mobile");
    const ignored = (target: EventTarget | null) => document.querySelector("dialog[open]")
      || (target instanceof Element && target.closest("input, textarea, select, [contenteditable=true]"));
    const ready = () => {
      const section = last();
      return !mobile() && api() && section?.classList.contains("active")
        && Math.abs(section.getBoundingClientRect().top) < 2;
    };
    const restore = () => {
      if (nativeTail) {
        nativeTail = false;
        api()?.setAutoScrolling(true);
        window.scrollTo(0, 0);
      }
    };
    const enter = () => {
      api()?.setAutoScrolling(false);
      // The plugin leaves a zero transform, which traps the footer's fixed
      // scroll-to-top control in a transformed containing block during native flow.
      const container = document.getElementById("superContainer");
      if (container) container.style.transform = "none";
      nativeTail = true;
    };
    const atBoundary = () => {
      const section = last();
      return section && section.getBoundingClientRect().top >= -1;
    };
    const wheel = (event: WheelEvent) => {
      if (ignored(event.target) || mobile() || !event.deltaY) return;
      if (nativeTail) {
        if (event.deltaY < 0 && atBoundary()) restore();
        else event.stopImmediatePropagation(); // Native scrolling, without the theme's section-wheel handler.
      } else if (event.deltaY > 0 && ready()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        enter();
        // Consume the boundary gesture so its full delta cannot skip straight
        // into the footer. The next gesture scrolls the native tail normally.
      }
    };
    const scroll = () => {
      // A large wheel/PageUp gesture must stop at the final section, not skip
      // the theme's fullscreen navigation by scrolling into earlier sections.
      const top = last()?.getBoundingClientRect().top ?? 0;
      if (nativeTail && top > 0) window.scrollBy(0, top);
      // Preserve the original theme's two visibility states. Its body wheel
      // listener is bypassed while the desktop section handler is intercepted.
      const control = footer.querySelector<HTMLElement>(".scroll-to-top");
      if (control) {
        const visible = window.scrollY > window.innerHeight;
        control.style.opacity = visible ? "1" : "0";
        control.style.marginBottom = visible ? "0px" : "-30px";
      }
    };
    const key = (event: KeyboardEvent) => {
      if (ignored(event.target) || mobile()) return;
      const down = ["ArrowDown", "PageDown", "End", " "].includes(event.key) && !event.shiftKey;
      const up = ["ArrowUp", "PageUp", "Home"].includes(event.key) || (event.key === " " && event.shiftKey);
      if (nativeTail && up && atBoundary()) restore();
      else if (nativeTail && (down || up)) event.stopImmediatePropagation();
      else if (down && ready()) {
        enter();
        event.preventDefault(); // Consume the boundary key, as with wheel input.
        event.stopImmediatePropagation();
      }
    };
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(".fullpage-nav")) restore();
      if (event.target.closest("footer[data-homepage-footer] .scroll-to-top")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!mobile()) { restore(); api()?.moveTo(1); }
        else window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    // Resizing in the tail retains native flow; the original plugin still owns section sizing.
    window.addEventListener("wheel", wheel, { capture: true, passive: false });
    window.addEventListener("keydown", key, true);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("wheel", wheel, true);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("click", click, true);
      restore();
    };
  }, []);
  return null;
}
