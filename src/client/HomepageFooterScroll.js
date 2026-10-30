const homepageFullscreen = {};
/** Called by the runtime after theme scripts load, before the homepage config runs. */
export function captureHomepageFullscreen() {
    const prototype = window.PEXETO?.Fullpage?.prototype;
    if (!prototype)
        return;
    const original = prototype.init;
    const observed = {};
    function init() {
        prototype.init = original;
        original.call(this);
        observed.instance = this;
        homepageFullscreen.instance = this;
    }
    prototype.init = init;
    return () => {
        if (prototype.init === init)
            prototype.init = original;
        if (homepageFullscreen.instance === observed.instance)
            homepageFullscreen.instance = undefined;
    };
}
/** A native-scroll tail, not another fullscreen section. Mobile already scrolls natively. */
export function HomepageFooterScroll() {
    (() => {
        let nativeTail = false;
        let lastSectionWheel = -Infinity;
        let sectionWheelDirection = 0;
        let homeRequested = false;
        let frame = 0;
        let target = 0;
        let direction = 0;
        let lastTailWheel = -Infinity;
        let returningWheel = false;
        let returningKey = false;
        const footer = document.querySelector("footer[data-homepage-footer]");
        if (!footer)
            return;
        const api = () => window.jQuery?.fn?.fullpage;
        const last = () => [...document.querySelectorAll(".fullpage-wrapper > .section")].at(-1);
        const mobile = () => document.body.classList.contains("mobile");
        const ignored = (eventTarget) => document.querySelector("dialog[open]")
            || (eventTarget instanceof Element && eventTarget.closest("input, textarea, select, [contenteditable=true]"));
        const ready = () => {
            const section = last();
            return !mobile() && api() && homepageFullscreen.instance && !homepageFullscreen.instance.inAnimation
                && homepageFullscreen.instance.current === 2 && section?.classList.contains("active")
                && Math.abs(section.getBoundingClientRect().top) < 2;
        };
        const restore = () => {
            if (!nativeTail)
                return;
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
            if (container)
                container.style.transform = "none";
            nativeTail = true;
            target = window.scrollY;
            direction = 0;
        };
        const advance = (delta) => {
            const section = last();
            if (!section)
                return;
            const boundary = window.scrollY + section.getBoundingClientRect().top;
            if (Math.sign(delta) !== direction)
                target = window.scrollY;
            direction = Math.sign(delta);
            // Bound the destination before scrolling, rather than correcting an
            // overshoot in a scroll handler after earlier sections have been exposed.
            const end = Math.max(boundary, document.documentElement.scrollHeight - window.innerHeight);
            target = Math.max(boundary, Math.min(end, target + delta));
            if (delta < 0 && window.scrollY <= boundary + 1)
                restore();
            else
                window.scrollTo({ top: target, behavior: "smooth" });
        };
        const wheel = (event) => {
            if (ignored(event.target) || mobile() || !event.deltaY)
                return;
            const now = performance.now();
            const freshGesture = now - lastSectionWheel >= 180 || Math.sign(event.deltaY) !== sectionWheelDirection;
            sectionWheelDirection = Math.sign(event.deltaY);
            lastSectionWheel = now;
            if (homeRequested || (!nativeTail && event.deltaY > 0 && homepageFullscreen.instance?.current === 2
                && (homepageFullscreen.instance.inAnimation || !freshGesture))) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
            // Consecutive momentum events belong to the return gesture. A fresh
            // gesture after a quiet interval can use the original section navigation.
            if (!nativeTail && returningWheel && event.deltaY < 0 && now - lastTailWheel < 180) {
                lastTailWheel = now;
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
            returningWheel = false;
            if (!nativeTail && !(event.deltaY > 0 && ready()))
                return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (!nativeTail)
                enter();
            lastTailWheel = now;
            returningWheel = event.deltaY < 0;
            const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
            advance(Math.sign(pixels) * Math.min(Math.abs(pixels), 120));
        };
        const scroll = () => {
            if (nativeTail && direction < 0 && Math.abs(last()?.getBoundingClientRect().top ?? Infinity) < 1)
                restore();
        };
        const key = (event) => {
            if (ignored(event.target) || mobile())
                return;
            const down = ["ArrowDown", "PageDown", "End", " "].includes(event.key) && !event.shiftKey;
            const up = ["ArrowUp", "PageUp", "Home"].includes(event.key) || (event.key === " " && event.shiftKey);
            if (!down && !up)
                return;
            if (homeRequested || (!nativeTail && down && homepageFullscreen.instance?.current === 2
                && (homepageFullscreen.instance.inAnimation || event.repeat))) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
            if (!nativeTail && returningKey && event.repeat && up) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
            if (!nativeTail && !(down && ready()))
                return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (!nativeTail)
                enter();
            returningKey = up;
            const distance = event.key.startsWith("Arrow") ? 40 : window.innerHeight * 0.8;
            advance(up ? -distance : distance);
        };
        const keyup = () => { returningKey = false; };
        // Reapply the API's active-section alignment after initialization has moved
        // fixed header elements out of the container. Do not inherit a stale offset.
        const settle = () => {
            if (!homepageFullscreen.instance || homepageFullscreen.instance.inAnimation || document.readyState !== "complete"
                || document.querySelector(".fullpage-wrapper.loading")) {
                frame = requestAnimationFrame(settle);
                return;
            }
            if (homeRequested) {
                restore();
                returningWheel = returningKey = false;
                if (!mobile())
                    api()?.setAutoScrolling(true);
                if (homepageFullscreen.instance.current !== 0)
                    homepageFullscreen.instance.moveTo(0);
                if (mobile())
                    window.scrollTo({ top: 0, behavior: "smooth" });
                else
                    window.scrollTo({ top: 0, behavior: "instant" });
                homeRequested = false;
            }
            else if (!mobile()) {
                api()?.setAutoScrolling(true);
                window.scrollTo({ top: 0, behavior: "instant" });
            }
            else {
                const section = document.querySelectorAll(".fullpage-wrapper > .section")[homepageFullscreen.instance.current];
                const top = homepageFullscreen.instance.current && section ? window.scrollY + section.getBoundingClientRect().top : 0;
                window.scrollTo({ top, behavior: "instant" });
            }
        };
        frame = requestAnimationFrame(settle);
        const click = (event) => {
            if (!(event.target instanceof Element))
                return;
            if (event.target.closest(".fullpage-nav"))
                restore();
            const home = event.target.closest('#header #logo-container > a[href="/redcarpert-prototype/"], #header #menu-item-15418 > a[href="/"]');
            if (!home || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
                return;
            event.preventDefault();
            // replaceState does not emit the empty-hash event that the legacy plugin
            // interprets as section -1. Keep normal explicit section deep links intact.
            history.replaceState(history.state, "", `${location.pathname}${location.search}#1`);
            restore();
            homeRequested = true;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(settle);
            const menu = document.querySelector("#header .mob-nav-menu");
            if (menu && getComputedStyle(menu).display !== "none")
                document.querySelector("#header .mobile-nav")?.click();
        };
        const hashchange = () => {
            if (!location.hash)
                history.replaceState(history.state, "", `${location.pathname}${location.search}#1`);
            if (nativeTail && location.hash !== "#3")
                restore();
        };
        window.addEventListener("wheel", wheel, { capture: true, passive: false });
        window.addEventListener("keydown", key, true);
        window.addEventListener("keyup", keyup, true);
        window.addEventListener("scroll", scroll, true);
        window.addEventListener("click", click, true);
        window.addEventListener("hashchange", hashchange, true);
        return () => {
            window.removeEventListener("wheel", wheel, true);
            window.removeEventListener("keydown", key, true);
            window.removeEventListener("keyup", keyup, true);
            window.removeEventListener("scroll", scroll, true);
            window.removeEventListener("click", click, true);
            window.removeEventListener("hashchange", hashchange, true);
            cancelAnimationFrame(frame);
            restore();
        };
    })();
    return null;
}
