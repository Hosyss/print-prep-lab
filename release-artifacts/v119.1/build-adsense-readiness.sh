#!/usr/bin/env bash
set -euo pipefail
release_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${release_dir}/../.." && pwd)"
base_zip="${release_dir}/print-prep-lab-pages-v119-2c-jobs-linked.zip"
output="${release_dir}/print-prep-lab-pages-adsense-readiness-final.zip"
staging="$(mktemp -d)"
trap 'rm -rf -- "${staging}"' EXIT

# Apply source-only corrections once, then build the current public app.
python3 "${release_dir}/final-source-patch.py" "${repo_root}"
(
  cd "${repo_root}"
  npm run build
  npm run prepare:pages
)

# Preserve the proven layered release artifact, then add Supplier and Jobs fixes.
bash "${release_dir}/build-phase2c.sh"
[[ -s "${base_zip}" ]] || { echo "Missing Phase 2c base artifact" >&2; exit 66; }
unzip -q "${base_zip}" -d "${staging}"
marker="${GITHUB_SHA:-manual-final-readiness}"
python3 "${release_dir}/final-artifact-patch.py" "${staging}" "${marker}"
python3 "${release_dir}/final-artifact-review-patch.py" "${staging}"

node --check "${staging}/enterprise-suite.js"
node --check "${staging}/jobs.js"
grep -Fq "decisionModel:'explicit-fields-v2'" "${staging}/enterprise-suite.js"
grep -Fq "decisionModel:'explicit-eligibility-v1'" "${staging}/enterprise-suite.js"
grep -Fq 'enterprise-job-cores-v2' "${staging}/enterprise-suite.js"
grep -Fq 'selected-job-id-v1' "${staging}/enterprise-suite.js"
grep -Fq 'JSON.stringify(id)' "${staging}/jobs.js"
grep -Fq 'ppl-final-build-marker:' "${staging}/enterprise-suite.js"
grep -Fq 'max-age=0, must-revalidate' "${staging}/_headers"
grep -Fq 'id="workflow"' "${staging}/home-v112.html"
grep -Fq 'Who is it for?' "${staging}/home-v112.html"
grep -Fq 'لمن صُمم؟' "${staging}/home-v112.html"
! grep -Fq 'value="Sample print job"' "${staging}/job-core.html"
! grep -Fq 'user-controlled weights' "${staging}/supplier-intelligence.html"
grep -R -Fq 'Example values are pre-filled.' "${staging}"
grep -R -Fq 'final-readiness-mobile-guard' "${staging}"
grep -Fq 'headers.delete("If-None-Match")' "${staging}/_worker.js"
test -s "${staging}/og-image.png"
python3 - "${staging}/search-index.json" <<'PY'
import json,sys
p=sys.argv[1]; d=json.load(open(p,encoding='utf-8'))
ghosts={'/workflow','/tools/best-print-size-finder','/tools/mat-frame-calculator','/tools/poster-tiling-calculator','/tools/saddle-stitch-booklet-calculator','/guides/best-file-format-for-printing','/guides/choose-best-photo-print-size','/guides/mat-frame-sizing-guide','/guides/rgb-vs-cmyk-printing','/guides/saddle-stitch-booklet-page-count','/guides/tiled-poster-printing-guide'}
assert d['count']==len(d['items'])
assert not any(x.get('path') in ghosts for x in d['items'])
print('search-index routes reconciled:',d['count'])
PY
for p in jobs.html job-core.html supplier-intelligence.html release-center.html readiness-audit.html command-center.html enterprise-dashboard.html digital-twin.html vault.html operations.html file-manifest.html production-archive.html; do
  grep -Fq 'noindex,follow' "${staging}/${p}"
done

rm -f -- "${output}"
(cd "${staging}" && zip -q -X -r "${output}" . -x '*.DS_Store')
sha256sum "${output}"
