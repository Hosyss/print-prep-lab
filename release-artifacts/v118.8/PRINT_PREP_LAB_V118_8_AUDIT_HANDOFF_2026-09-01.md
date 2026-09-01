# Print Prep Lab v118.8 audit handoff — 2026-09-01

## Source of truth

- Production was inspected before any change.
- Production was found to be newer than the GitHub v118.6 recovery branch: it serves the v118.7 workflow hotfix.
- v118.8 preserves the exact live v118.7 workflow JavaScript and CSS and restores that state to a reproducible recovery artifact.
- Production was not changed while preparing this release.
- The isolated Admin Worker and Admin D1 were not changed or connected to the public site.

## Confirmed findings

- 79/79 public sitemap routes returned HTTP 200.
- 163 same-origin routes/assets were checked with 0 failed responses.
- Public pages had 0 missing titles, descriptions or canonicals, 0 invalid H1 counts and 0 duplicate titles/descriptions.
- Live English/Arabic switching completed repeatedly without a mutation loop, freeze or horizontal overflow.
- The live release had a source-control drift: v118.7 was live but absent from GitHub.
- Versioned v118.6/v118.7 assets returned `Cache-Control: max-age=0`, preventing effective browser caching.
- Repeated live HTML requests showed high TTFB from the audit environment, commonly 4.5–7 seconds.
- The Admin package had no lockfile, so `npm ci` could not reproduce the verified dependency graph.

## v118.8 changes

- Preserve the exact v118.7 mobile launcher and contrast hotfix already live.
- Update all static and bundled route references from the v118.6 workflow assets to v118.7.
- Add immutable one-year caching for versioned v118.6/v118.7 public assets.
- Add a ten-minute Cloudflare edge HTML cache with stale-while-revalidate while browsers continue to revalidate HTML.
- Add `/admin` and `/admin/` as external 302 entry points to the isolated password-and-TOTP Admin Worker; no public write API or secret is introduced.
- Keep AdSense runtime disabled while preserving the publisher meta tag and authorized `ads.txt`.
- Preserve all existing calculator, editorial, Arabic, routing, noindex and local-data behavior.
- Add deterministic cache-header assertions to the source test suite.
- Add a lockfile to the isolated Admin package for reproducible `npm ci` builds.

## Verification

- Public source lint: PASS.
- Print mathematics: 87/87 PASS.
- Rendered HTML/SEO/security suite: 9/9 PASS.
- Public build and artifact validation: PASS.
- v118.8 JavaScript syntax checks: PASS.
- v118.8 packaged Worker simulation: 90 discovered HTML routes PASS; v118.7 workflow asset PASS.
- Admin clean install with `npm ci`: PASS.
- Admin security suite: 43/43 PASS.

## Artifact

- File: `print-prep-lab-pages-20260901-v118-8-performance-source-recovery.zip`
- SHA-256: `16f83e640fdd0486c79fa827f4d7b2059ebfdc7a5ef0cb9e49e1e1893b49b340`
- Size: approximately 1.5 MiB.

## Release boundary

- Do not merge this branch into the stale `main` branch.
- Do not upload automatically.
- Review the immutable Preview first, including phone layout, Arabic switching, Job Companion, page bottoms and tool calculations.
- After an authorized Production upload, verify the cache headers and repeat the public route/asset smoke against `https://printpreplab.pages.dev`.
