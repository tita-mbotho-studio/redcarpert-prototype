"use client";

import { useState } from "react";

const entries = [
  {
    category: "Mermaid",
    name: "Sample 01",
    image: "/redcarpert/gallery/sample-01-mermaid-pexels.webp",
    alt: "Stock bridal image of a fitted gown, not confirmed Redcarpert inventory",
    href: "/product/preview/sample-01-mermaid/",
  },
  {
    category: "Ball Gown",
    name: "Sample 02",
    image: "/redcarpert/gallery/sample-02-ball-gown-pexels.webp",
    alt: "Stock bridal image of a full gown, not confirmed Redcarpert inventory",
    href: "/product/preview/sample-02-ball-gown/",
  },
] as const;

/** One shared, small reader for the two real sample image assets. */
export function DigitalLookbook() {
  const [index, setIndex] = useState(0);
  const product = entries[index];
  return (
    <section className="redcarpert-lookbook" aria-label="Digital bridal lookbook">
      <div className="redcarpert-lookbook-frame">
        <div className="redcarpert-lookbook-image">
          {/* The source images are the existing clean portrait WebPs, not composites. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.alt} width={index === 0 ? 1696 : 1484} height={index === 0 ? 2528 : 2212} />
        </div>
        <div className="redcarpert-lookbook-copy">
          <p className="redcarpert-lookbook-eyebrow">REDCARPERT WEDDING DRESSES</p>
          <h3>{product.category}</h3>
          <p>{product.name} — demonstration photograph</p>
          <p className="redcarpert-lookbook-note">Not confirmed Redcarpert inventory. Actual dresses and photography will follow client approval.</p>
          <a href={product.href}>View sample dress details</a>
          <div className="redcarpert-lookbook-controls" aria-label="Lookbook page controls">
            <button type="button" disabled={index === 0} onClick={() => setIndex(n => Math.max(0, n - 1))} aria-label="Previous dress">Previous</button>
            <span aria-live="polite">Page {index + 1} of {entries.length}</span>
            <button type="button" disabled={index === entries.length - 1} onClick={() => setIndex(n => Math.min(entries.length - 1, n + 1))} aria-label="Next dress">Next</button>
          </div>
        </div>
      </div>
      <div className="redcarpert-lookbook-download">
        <a className="button" href="/digital-lookbook/pdf/" download="Redcarpert-Sample-Lookbook.pdf">Download sample lookbook (PDF)</a>
      </div>
    </section>
  );
}
