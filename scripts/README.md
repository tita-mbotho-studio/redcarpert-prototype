Run `npm ci` and `npm run setup` with Node.js 24. Start the local site using `npm run dev` at http://localhost:5173/redcarpert-wedding-dresses/. Restart the dev command after modifying the catalogue or page generators.

`npm run check` runs lint, TypeScript checks, the production Vite/PDF build and unit tests. `npm run test:dist` validates generated routes and PDF; with `npm run preview -- --port 4173` running, `npm run test:browser` executes the Chromium suite at http://localhost:4173/redcarpert-wedding-dresses/.

All deployments require explicit owner approval via the manual GitHub Pages workflow. Never publish a feature branch or merge without authorization. ImageKit client media is external; maintain approved client URLs and `updatedAt` version parameters when replacing photographs.
