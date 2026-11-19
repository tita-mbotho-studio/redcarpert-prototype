# Client Media Sources

The live Redcarpert bridal catalogue is built exclusively from client-supplied ImageKit assets. All dress photographs are maintained in the four canonical client JSON manifests and are never copied into a stock-photo or sample catalogue.

| Collection | Client dresses | Client photographs | Data source |
|---|---:|---:|---|
| Mermaid | 2 | 6 | `src/data/client-mermaid-dresses.json` |
| Ball Gown | 12 | 34 | `src/data/client-ball-gowns.json` |
| Ruffled | 12 | 38 | `src/data/client-ruffled-dresses.json` |
| 2 in 1 | 21 | 105 | `src/data/client-two-in-one-dresses.json` |
| **Total** | **47** | **183** | |

Modern Tradition is a colour-based cross-list of eight dresses drawn from the existing client categories, defined in `src/data/modern-tradition-features.json`. It adds no extra dress IDs, media files, pricing or detail routes.

Wedding Moments uses **90 client-supplied assets** (89 WebP photos and 1 MP4), maintained in `src/data/image-links.json`. The homepage and About Us photos also use their approved client URLs in that manifest.

Only the approved client files are part of the generated product catalogue, interactive lookbook or printed PDF. Source filenames and ImageKit identifiers are preserved for audit and easy updates.
