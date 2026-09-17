#!/usr/bin/env bash
set -euo pipefail
release_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
base_zip="${release_dir}/print-prep-lab-pages-v119-2b-supplier-eligibility.zip"
output="${release_dir}/print-prep-lab-pages-adsense-readiness-final.zip"
staging="$(mktemp -d)"
trap 'rm -rf -- "${staging}"' EXIT
bash "${release_dir}/build-phase2b.sh"
[[ -s "${base_zip}" ]] || { echo "Missing Phase 2b base artifact" >&2; exit 66; }
unzip -q "${base_zip}" -d "${staging}"
python3 "${release_dir}/jobs-jobcore-patch.py" "${staging}"
python3 "${release_dir}/jobs-jobcore-legacy-review-patch.py" "${staging}"
python3 "${release_dir}/final-polish-patch.py" "${staging}"
node --check "${staging}/enterprise-suite.js"
node --check "${staging}/jobs.js"
grep -Fq "decisionModel:'explicit-fields-v2'" "${staging}/enterprise-suite.js"
grep -Fq "decisionModel:'explicit-eligibility-v1'" "${staging}/enterprise-suite.js"
grep -Fq "selected-job-id-v1" "${staging}/enterprise-suite.js"
grep -Fq "data-select" "${staging}/jobs.js"
grep -Fq "legacyId" "${staging}/enterprise-suite.js"
! grep -Fq 'value="Sample print job"' "${staging}/job-core.html"
! grep -Eq 'blockedWord|okayWord' "${staging}/enterprise-suite.js"
grep -Fq 'Who is it for?' "${staging}/home-v112.html"
test -s "${staging}/og-image.png"
python3 - "${staging}/search-index.json" <<'PY'
import json,sys
p=sys.argv[1]; d=json.load(open(p)); paths={x.get('path') for x in d.get('items',[])}
ghosts={'/workflow','/tools/best-print-size-finder','/tools/mat-frame-calculator','/tools/poster-tiling-calculator','/tools/saddle-stitch-booklet-calculator','/guides/best-file-format-for-printing','/guides/choose-best-photo-print-size','/guides/mat-frame-sizing-guide','/guides/rgb-vs-cmyk-printing','/guides/saddle-stitch-booklet-page-count','/guides/tiled-poster-printing-guide'}
assert not (paths & ghosts), paths & ghosts
PY
for p in jobs.html job-core.html supplier-intelligence.html release-center.html readiness-audit.html command-center.html; do
  grep -Fq 'noindex,follow' "${staging}/${p}"
done
rm -f -- "${output}"
(cd "${staging}" && zip -q -X -r "${output}" . -x '*.DS_Store')
sha256sum "${output}"
