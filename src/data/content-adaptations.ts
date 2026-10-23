import type { ContentAdaptation } from "@/lib/content-adapter";

// Only the approved homepage text slots change; all captured attributes stay intact.
export const contentAdaptations: readonly ContentAdaptation[] = [
  {
    id: "home-brand-heading",
    route: "/",
    target: {
      tag: "h2",
      attrs: { class: "section-title", style: "color:#ffffff;font-weight:bold;text-transform:uppercase;font-size:40px;" },
      path: [1, 1, 4, 1, 1, 2, 0, 0],
    },
    changes: [{ kind: "text", childIndex: 0, expected: "VANESA BRIDAL", value: "Redcarpert Wedding Dresses" }],
  },
  {
    id: "home-hero-cta",
    route: "/",
    target: {
      tag: "a",
      attrs: { class: "button", href: "/product/", style: "background-color:##fffdd0;" },
      path: [1, 1, 4, 1, 1, 0, 0, 2],
    },
    changes: [{ kind: "text", childIndex: 0, expected: "EXPLORE COLLECTION", value: "Explore Wedding Dresses" }],
  },
];
