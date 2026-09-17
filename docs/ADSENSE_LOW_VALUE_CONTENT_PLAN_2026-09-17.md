# Print Prep Lab — AdSense Low-Value Content Remediation Plan

Date: 2026-09-17
Branch: `content/adsense-low-value-20260917`
Base production-reviewed SHA: `5ef274ceb758b5dbde12d8d2ef1094774bea3e50`

## Scope

This branch addresses the AdSense rejection reason **Low-value content** only. It does not request an AdSense review, merge to `main`, or deploy Production.

The site currently exposes 38 sitemap pages. The plan is to improve the value density and verifiability of the existing public corpus rather than create filler pages.

## Public page decisions

| Route | Before | Decision on this branch | Reason |
|---|---|---|---|
| `/` | Strong product/workflow introduction | Keep / verify | Useful unique homepage; no need to inflate it with search-targeted prose. |
| `/tools` | Tool directory | Keep / verify | Navigation hub with a clear task taxonomy. |
| `/sizes` | Size directory | Keep / verify | Useful format-selection hub. |
| `/guides` | Guide directory | Keep / verify | Useful editorial navigation hub. |
| `/tools/print-readiness-checker` | Calculator + quick explanation | Improve | Add a post-crop worked decision, interpretation, assumptions and limits. |
| `/tools/pixels-to-print-size` | Calculator + formula/example | Improve | Add a reproducible camera-file example and explain why ratio/crop changes the decision. |
| `/tools/print-size-to-pixels` | Calculator + formula/example | Improve | Add exact A4 calculation, rounding sequence and bleed boundary. |
| `/tools/dpi-ppi-calculator` | Calculator + formula/example | Improve | Add independent axis calculation and explain the limiting density. |
| `/tools/paper-size-pixels-calculator` | Preset calculator + explanation | Improve | Add A3 conversion example and clarify why paper has no fixed pixel dimensions. |
| `/tools/aspect-ratio-crop-preview` | Crop calculator + explanation | Improve | Add retained-area arithmetic and a composition decision, not just a percentage. |
| `/tools/bleed-safe-area-calculator` | Bleed calculator + explanation | Improve | Add full trim/bleed/safe calculation and explain the separate production risks. |
| `/sizes/a2` | Detailed size reference | Keep / verify uniqueness | Has format-specific use cases and workflow context; audit similarity against other size pages. |
| `/sizes/a3` | Detailed size reference | Keep / verify uniqueness | Same. |
| `/sizes/a4` | Detailed size reference | Keep / verify uniqueness | Same. |
| `/sizes/a5` | Detailed size reference | Keep / verify uniqueness | Same. |
| `/sizes/us-letter` | Detailed size reference | Keep / verify uniqueness | Same. |
| `/sizes/us-legal` | Detailed size reference | Keep / verify uniqueness | Same. |
| `/sizes/4x6-photo` | Detailed size reference | Keep / verify uniqueness | Same. |
| `/sizes/5x7-photo` | Detailed size reference | Keep / verify uniqueness | Same. |
| `/sizes/8x10-photo` | Detailed size reference | Keep / verify uniqueness | Same. |
| `/sizes/11x14-photo` | Detailed size reference | Keep / verify uniqueness | Same. |
| `/sizes/12x18-photo` | Detailed size reference | Keep / verify uniqueness | Same. |
| `/sizes/16x20-photo` | Detailed size reference | Keep / verify uniqueness | Same. |
| `/guides/a4-vs-us-letter-printing` | Long-form decision guide | Keep / verify uniqueness | Distinct cross-format problem and practical workflow. |
| `/guides/aspect-ratio-cropping-print` | Long-form decision guide | Keep / verify uniqueness | Distinct crop-planning problem. |
| `/guides/bleed-trim-safe-area` | Long-form decision guide | Keep / verify uniqueness | Distinct production-boundary problem. |
| `/guides/dpi-vs-ppi` | Long-form concept guide | Keep / verify uniqueness | Distinct terminology and resolution decision. |
| `/guides/export-images-for-large-format-printing` | Long-form workflow guide | Keep / verify uniqueness | Distinct export/viewing-distance workflow. |
| `/guides/how-large-can-i-print-my-image` | Long-form decision guide | Keep / verify uniqueness | Distinct maximum-size decision. |
| `/guides/print-file-preflight-checklist` | Long-form checklist | Keep / verify uniqueness | Distinct preflight workflow. |
| `/guides/print-resolution-guide` | Long-form resolution guide | Keep / verify uniqueness | Distinct target-resolution decision. |
| `/about` | Publisher/purpose/process copy | Improve verifiability | Add direct links to publisher profile, repository, implementation and tests. |
| `/methodology` | Formula and rounding policy | Improve verifiability | Add direct links to implementation, tests and NIST measurement reference. |
| `/sources` | Source hierarchy and policy | Improve verifiability | Tie ISO, NIST and Adobe references to the exact claims they support. |
| `/editorial-policy` | Review/correction policy | Keep / verify | Already explains human responsibility, testing and anti-filler policy. |
| `/contact` | Public issue route + report template | Improve | Add the correction workflow and direct links to the issue template, math module and tests. |
| `/privacy` | Privacy policy | Keep | Required user-trust disclosure; not used as filler editorial content. |
| `/terms` | Terms and limitations | Keep | Required scope/limitation disclosure; not used as filler editorial content. |

## Pages intentionally kept noindex

These pages remain useful inside the local-first professional workflow but are not independent public editorial landing pages. They should not be added to the sitemap merely to increase page count.

| Route | Why it remains noindex |
|---|---|
| `/jobs` | Browser-local job data; value depends on user-entered project state. |
| `/job-core` | Browser-local job editor rather than standalone editorial content. |
| `/supplier-intelligence` | User-entered supplier decision workspace. |
| `/release-center` | Release state derived from local workflow evidence. |
| `/readiness-audit` | Audit view derived from local project state. |
| `/command-center` | Workspace command view, not a public reference. |
| `/enterprise-dashboard` | Operational dashboard assembled from local signals. |
| `/digital-twin` | Local workflow status view. |
| `/vault` | Local file/workflow index. |
| `/operations` | Operations board driven by local workflow state. |
| `/file-manifest` | Local manifest utility. |
| `/production-archive` | User-generated local archive. |

## Validation gates

1. Build and lint must pass.
2. Existing math, rendered HTML, status, Supplier and Jobs regressions must remain green.
3. The layered Pages artifact must still carry all previous AdSense-readiness fixes.
4. A content-value audit must crawl all sitemap pages, count main-content words, detect exact duplicate main content and report five-word-shingle similarity.
5. All 7 tool detail pages must expose a worked calculation, result interpretation, assumptions and limits.
6. About, Methodology and Sources must expose verifiable evidence links; Contact must expose a reproducible correction workflow.
7. Existing noindex operational routes must remain noindex.
8. Desktop and 390×844 mobile screenshots must be captured for the changed public pages; selected tool pages must also be checked in Arabic RTL.
9. Preview deploy only. No Production promotion and no AdSense review request.
