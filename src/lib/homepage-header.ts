type StickyHeader = {
  $el: { 0?: Element };
  init: () => void;
  isScrolled: () => boolean;
};

/** Keep the fullscreen homepage's original header proportions in its native footer tail. */
export function preserveHomepageHeader() {
  const header = document.querySelector("#header");
  if (!header || !document.querySelector("footer[data-homepage-footer]")) return;
  const prototype = (window as Window & {
    PEXETO?: { utils?: { stickyHeader?: { prototype: StickyHeader } } };
  }).PEXETO?.utils?.stickyHeader?.prototype;
  if (!prototype) return;
  const original = prototype.init;
  const observed: { instance?: StickyHeader; ownPredicate?: PropertyDescriptor } = {};
  function init(this: StickyHeader) {
    if (this.$el[0] !== header) return original.call(this);
    // Restore the shared prototype immediately; only this homepage instance
    // ignores native document scroll when deciding whether to compact.
    prototype!.init = original;
    observed.instance = this;
    observed.ownPredicate = Object.getOwnPropertyDescriptor(this, "isScrolled");
    this.isScrolled = () => false;
    original.call(this);
  }
  prototype.init = init;
  return () => {
    if (prototype.init === init) prototype.init = original;
    const { instance, ownPredicate } = observed;
    if (instance) {
      if (ownPredicate) Object.defineProperty(instance, "isScrolled", ownPredicate);
      else Reflect.deleteProperty(instance, "isScrolled");
    }
  };
}
