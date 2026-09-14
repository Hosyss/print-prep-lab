# Print Prep Lab v118.6 recovery handoff — 2026-08-30

## Decision

- v118.6 is the recovery candidate built from the approved v118.5 package.
- Do not merge this branch into `main` and do not deploy it automatically.
- Production was not changed while preparing or validating this package.
- The isolated Admin control plane remains on `security/admin-control-plane-v2-20260830` and is not part of this ZIP.

## Recovery scope

- Keep Arabic translation browser-local and remove the external translation runtime from every public page.
- Make language application idempotent so switching English/Arabic cannot trigger a mutation loop.
- Stop the Job Companion language/runtime loop.
- Remove the document-flow spacer that caused the large empty area below pages.
- Bound the mobile drawer to the dynamic viewport and device safe area.
- Preserve v118.5 content and calculation modules.

## Artifact

- File: `print-prep-lab-pages-20260830-v118-6-runtime-mobile-arabic-recovery.zip`
- SHA-256: `d5b5ff59645402c06e86fe009d6474d8c2fcfc124ef3af29295f68428f9f6625`
- Release manifest: `V118_6_RELEASE.json`

## Fresh-ZIP verification

- 71/71 JavaScript files passed syntax checks.
- 79/79 sitemap routes returned HTTP 200 in the packaged Worker simulation.
- 103/103 discovered internal routes returned HTTP 200.
- All 66 public HTML pages load the v118.6 UI/workflow recovery assets.
- All 64 referenced static assets are present; the generated web manifest route also returned HTTP 200.
- The package release gate reports 4,020 Arabic dictionary entries, 0 missing audited strings, and 6/6 recovery tests passed.

The internal visual-preview browser could not reach the otherwise healthy local preview, so this does not replace the required user review and live mobile/Arabic QA before any Production upload.

## Deployment gate

When Cloudflare access is available, upload only the ZIP above to the existing `printpreplab` Pages project, then test mobile, Arabic switching, Job Companion, page bottoms, tool calculations, headers, sitemap and robots before treating the release as live.
