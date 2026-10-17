# Inspectable PDF case studies

The current AdSense screen reports low-value content after a second rejection. That label does not identify a particular page or establish a required article count. The source already contains twelve guides, eight tools, worked calculations and editorial policies. This release addresses a concrete usability gap: the PDF inspector previously required a visitor's own file, and the PDF guide did not provide real files with independently reproducible findings.

## Visitor-facing change

Three original one-page PDFs demonstrate matched geometry, insufficient bleed with low image PPI, and unspecified trim/bleed boxes. The existing PDF guide includes server-rendered bilingual analysis, arithmetic, expected findings, corrections and download links. A visitor can open any example in the actual inspector with A4, 3 mm and 300 PPI targets preloaded. The exercise explains why matching these measurements does not approve a file for production.

The files are purpose-built RGB training assets, not production templates or PDF/X examples. Each contains one 600 by 300 pixel raster placement. The documented dimensions are verified against the distributed PDF bytes. Public downloads are served from the existing site; personal PDFs remain browser-local.

## Maintenance and evidence

- `scripts/generate-pdf-samples.mjs` recreates the assets from `lib/pdf-samples.ts` with fixed creation dates.
- `public/samples/manifest.json` records each original's SHA-256, dimensions and image placement.
- Asset checks inspect the actual PDF dictionaries, image dimensions and hashes.
- Browser QA opens each file in the existing parser at 1365 by 900 and 390 by 844, checks dimensions/PPI/bleed decisions, tests guide downloads and automatic loading, and captures English/Arabic evidence.
- Server-rendered checks cover the worked analysis and all download links without requiring JavaScript.
- Only the two materially changed routes receive October 17 modification dates; untouched guidance retains its previous review date.

Local verification before the first commit: TypeScript, the production build and 96 calculation/asset tests passed. The existing PR workflow is the gate for rendered-content, retained-workspace and browser verification; the production workflow publishes its exact validated artifact after merge. Workflow results and screenshots belong to that commit's GitHub Actions evidence.

The site's identity, existing Cloudflare project and production address remain intact. No Admin authentication, secrets, TOTP or D1 configuration is changed. This release does not request an AdSense re-review and does not claim acceptance is guaranteed.
