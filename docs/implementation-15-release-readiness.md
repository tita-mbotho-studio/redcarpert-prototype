# Implementation 15 — Final MVP readiness and launch checklist

**Branch:** `implementation/15-release-readiness`  
**Starting baseline:** approved Implementation 14 merge `287ad1a`  
**Scope:** production-readiness verification and release handoff only; **no redesign or publication**.

## Current prototype

- **Vite static site** designed for GitHub Pages at `/redcarpert-prototype/`, no backend or checkout.
- **16 routes**: homepage, Wedding Dresses, Mermaid and Ball Gown categories, eight sample detail previews, About Us, Contact Us, Our Brides and Digital Lookbook.
- **Wedding Dresses:** eight remote Pexels demonstration photographs, square card thumbnails, category filter.
- **Our Brides:** 18 remote sample photographs in fixed order with six complementary shade cards randomized between five curated patterns; square cards and full-photo preview.
- **Digital Lookbook:** ten-page online reader with a PDF containing the original two sample pictures.
- **Fitting enquiry:** explicit non-sending WhatsApp preview. No verified recipient number, booking backend, prices, sizes or inventory.

## Automated release checks

- Source tests, ESLint, TypeScript, Vite production build and static artifact integrity.
- All public pages have Redcarpert-branded page titles/descriptions, not inherited Bridal Vanesa catalogue titles.
- No active external WhatsApp destination or unapproved external outbound links appear in the generated HTML.
- No captured reference-site image, script or stylesheet `src`/`href` points to the reference site's host.
- GitHub Pages deploy action is guarded by a manual `workflow_dispatch` with `approve_deployment` defaulting to `false`.
- Browser regressions cover the catalogue, filters, pages, 1440/768/390 viewports, mobile simulation, ten-page lookbook and preview interactions.

**A successful build is necessary but not sufficient for public launch.**

## Manual gates not yet confirmed

- [ ] Client approves whether the sample-content prototype may be published or whether real photographs and text must be supplied first.
- [ ] Client supplies and approves WhatsApp Business number, address, hours, and fitting information before enabling *real* enquiries. Keep preview-only if this is a demo release.
- [ ] Confirm rights to use the **retained WordPress-derived theme scripts/styles/fonts and reference-inspired design** before public release. The original captured source belongs to a third party; do not infer a publishing licence from technical success.
- [ ] Verify external Pexels URL availability, appropriateness and usage terms in a connected browser. Browser regressions may stub remote images.
- [ ] Test on a real iOS Safari device and Firefox, particularly gallery previews, mobile menu, scroll handoff and page turns. Existing Playwright coverage uses Chromium.
- [ ] Obtain final client and developer visual signoff at 1440px, 768px and 390px.
- [ ] Obtain explicit approval to deploy GitHub Pages.
- [ ] Smoke-test the live public URL and all 16 routes after approved deployment.

## Controlled release steps

1. Review the Implementation 15 draft PR and green CI at its **exact final head commit**.
2. Once approved, squash-merge the PR into `main`.
3. Check the `Deploy static Pages site` workflow **build** job on `main`. A push only builds/uploads an artifact, **not** the website deployment.
4. After client readiness and explicit publishing approval, manually run the workflow on **main** with `approve_deployment=true`. Never modify the guard to deploy automatically.
5. Confirm the actual published Pages URL, page titles, image loading, catalogue categories, gallery modal, mobile navigation, sample enquiry, lookbook and PDF.

**Release state:** candidate for testing and review. **Do not deploy until the manual gates are settled.**
