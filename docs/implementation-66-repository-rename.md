# Implementation 66 — Official Redcarpert repository and GitHub Pages URL

## Intended names
- Brand: **Redcarpert Wedding Dresses** (retain the client's spelling).
- Current GitHub repo: `tita-mbotho-studio/redcarpert-prototype`.
- Target GitHub repo: `tita-mbotho-studio/redcarpert-wedding-dresses`.
- Current Pages URL: `https://tita-mbotho-studio.github.io/redcarpert-prototype/`.
- **Target** Pages URL (not live until rename and redeploy): `https://tita-mbotho-studio.github.io/redcarpert-wedding-dresses/`.

## Important GitHub Pages behavior
GitHub repository rename redirects Git URLs and repository web pages, but **not GitHub Pages project site URLs**. Source code, Vite's `base`, generated links, PDF link construction, test assertions and CI preview URLs therefore need to use the new subpath before publishing. Do not send the target URL to the client until it returns a correct live catalogue.

## Prepared on branch `implementation/66-rename-repository-pages-base`
- `src/config/site.ts`: change the single shared `REPOSITORY_BASE`.
- `package.json` / `package-lock.json`: new package name, correct repo owner and branded description.
- `.github/workflows/pages.yml` and `verify.yml`: new preview/probe URL; **manual-only workflow triggers unchanged**.
- Vite, static generation, JavaScript browser regressions and affected unit tests: new Pages URL/path.
- README and scripts instructions: accurate official client catalogue description and new local/preview paths.

## Controlled migration order (requires GitHub repository administrator)
1. Review the branch and its draft PR. Run `npm ci`, `npm run setup`, `npm run check`, `npm run test:dist`, and (with `npm run preview -- --port 4173` running) `npm run test:browser`.
2. Explicitly approve/merge the PR **without deploying**; the old published Pages version stays serving its prior content while the repository name is unchanged.
3. In the GitHub repository go to **Settings → General → Repository name**, enter `redcarpert-wedding-dresses` and click **Rename**. Only an administrator can perform this step; it cannot be done by the current connected GitHub editing actions.
4. Set the local remote: `git remote set-url origin https://github.com/tita-mbotho-studio/redcarpert-wedding-dresses.git`. The local directory can retain its existing name or be renamed independently.
5. Confirm the renamed repository's **Settings → Pages** source is still GitHub Actions and run the existing `pages.yml` workflow **manually on main**. Do not auto-enable push deployments.
6. Require unit, lint, typecheck, full build/PDF, distribution and Chromium browser tests to pass; verify the successful Pages deploy job.
7. In a fresh browser verify `/redcarpert-wedding-dresses/`, `/product/` (56 dresses), `/product-category/ruffled/` (17 dresses), `/product/preview/ruffled-dress-17/`, `/digital-lookbook/` (56 dress entries), the PDF download, WhatsApp links, and that built JS/CSS/images return 200.
8. **Only then** send the client-review email with the new URL.

No alternate DNS/custom domain has been assumed. The client's separate branded domain is planned for the following week and will be configured independently.

Do not merge, rename or trigger deployment merely by pushing this preparatory branch.
