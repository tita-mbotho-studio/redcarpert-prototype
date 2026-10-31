# Implementation 14: Catalogue filtering and Our Brides gallery

Branch: implementation/14-catalogue-filter-brides-gallery. Implementation 13 main baseline. No merge or deployment before visual approval.

## Approved changes
- On /product/, three working category filters: All Dresses / Mermaid / Ball Gown, preserving sample counts, card geometry and category routes.
- On /our-brides/, 18 independent, credited Pexels sample photographs displayed as the same 370:444 image ratio as the catalogue, plus six complementary shade tiles in one of five predesigned layouts.
- Four cards per desktop row, responsive two columns on tablet/mobile. Pattern and photo ordering randomize on page load; sessionStorage prevents immediately repeating the pattern in the same tab. Stable during browsing.
- Centered constrained image-card preview in native modal dialog, blurred and darkened backdrop, Escape, close button and outside click.
- Source assets strictly remote; no downloaded photos and no claims about real Redcarpert clients.

## Pexels photo credits
All photos are illustrative, not confirmed Redcarpert customers. Pexels imagery is loaded remotely and never stored in the repository.

| Image | Photographer | Source |
| --- | --- | --- |
| 01 | Leeloo The First | https://www.pexels.com/photo/woman-in-white-floral-lace-wedding-dress-4545094/ |
| 02 | Bárbara Marques | https://www.pexels.com/photo/portrait-of-bride-in-white-dress-and-veil-10587269/ |
| 03 | Alexander Mass | https://www.pexels.com/photo/elegant-bride-in-outdoor-wedding-ceremony-33435175/ |
| 04 | Alexander Mass | https://www.pexels.com/photo/elegant-bridal-portrait-with-lace-veil-39903996/ |
| 05 | Bárbara Marques | https://www.pexels.com/photo/wedding-photo-of-bride-in-white-dress-and-long-veil-10587270/ |
| 06 | Danielle Reese | https://www.pexels.com/photo/woman-in-wedding-dress-2495648/ |
| 07 | ArtHouse Studio | https://www.pexels.com/photo/portrait-of-bride-wearing-veil-and-wedding-dress-4645961/ |
| 08 | Dina Ashraf | https://www.pexels.com/photo/portrait-of-a-bride-in-a-white-embroidered-wedding-dress-and-a-chiffon-veil-19751829/ |
| 09 | Nataliya Vaitkevich | https://www.pexels.com/photo/woman-in-white-floral-dress-4456481/ |
| 10 | HONG SON | https://www.pexels.com/photo/a-beautiful-bride-wearing-white-gown-and-veil-5646476/ |
| 11 | Alexander Mass | https://www.pexels.com/photo/elegant-bride-in-white-wedding-veil-portrait-34328152/ |
| 12 | Alexander Mass | https://www.pexels.com/photo/smiling-bride-in-elegant-white-wedding-dress-39903999/ |
| 13 | Joy Marino | https://www.pexels.com/photo/woman-wearing-wedding-dress-and-veil-3031777/ |
| 14 | cottonbro studio | https://www.pexels.com/photo/wedding-fashion-model-in-white-clothing-covered-with-tulle-fabric-7289121/ |
| 15 | Leeloo The First | https://www.pexels.com/photo/woman-in-white-dress-wearing-straw-hat-and-veil-holding-flowers-5038574/ |
| 16 | Danik Prihodko | https://www.pexels.com/photo/bride-in-wedding-dress-and-hat-15865463/ |
| 17 | Uday Ahir | https://www.pexels.com/photo/bride-in-wedding-dress-under-serene-tree-39980506/ |
| 18 | Alexander Mass | https://www.pexels.com/photo/elegant-outdoor-wedding-bride-with-bouquet-39837863/ |
