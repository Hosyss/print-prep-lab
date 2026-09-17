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

check_has(){ local label="$1" file="$2" needle="$3"; echo "CHECK $label"; grep -Fq "$needle" "$file" || { echo "FAILED $label: missing [$needle] in $file" >&2; exit 1; }; }
check_not(){ local label="$1" file="$2" needle="$3"; echo "CHECK $label"; ! grep -Fq "$needle" "$file" || { echo "FAILED $label: unexpected [$needle] in $file" >&2; exit 1; }; }

echo "CHECK enterprise-suite syntax"; node --check "${staging}/enterprise-suite.js"
echo "CHECK jobs syntax"; node --check "${staging}/jobs.js"
check_has "2a decision model" "${staging}/enterprise-suite.js" "decisionModel:'explicit-fields-v2'"
check_has "2b decision model" "${staging}/enterprise-suite.js" "decisionModel:'explicit-eligibility-v1'"
check_has "per-job core storage" "${staging}/enterprise-suite.js" "enterprise-job-cores-v2"
check_has "selected job key" "${staging}/enterprise-suite.js" "selected-job-id-v1"
check_has "selected job JSON storage" "${staging}/jobs.js" "JSON.stringify(id)"
check_has "final build marker" "${staging}/enterprise-suite.js" "ppl-final-build-marker:"
check_has "mutable asset cache rule" "${staging}/_headers" "max-age=0, must-revalidate"
check_has "workflow anchor" "${staging}/home-v112.html" "id=\"workflow\""
check_has "English audience section" "${staging}/home-v112.html" "Who is it for?"
check_has "Arabic audience section" "${staging}/home-v112.html" "لمن صُمم؟"
check_not "sample job default removed" "${staging}/job-core.html" "value=\"Sample print job\""
check_not "adjustable weights claim removed" "${staging}/supplier-intelligence.html" "user-controlled weights"
echo "CHECK example-value notice"; grep -R -Fq 'Example values are pre-filled.' "${staging}" || { echo "FAILED example-value notice" >&2; exit 1; }
# The CSS bundler strips comments, so verify the source patch marker here;
# browser QA later verifies the actual mobile layout on every size route.
check_has "mobile source guard" "${repo_root}/app/globals.css" "final-readiness-mobile-guard"
check_has "reload conditional-header fix" "${staging}/_worker.js" 'headers.delete("If-None-Match")'
echo "CHECK social image"; test -s "${staging}/og-image.png" || { echo "FAILED social image missing" >&2; exit 1; }
python3 - "${staging}/search-index.json" <<'PY'
import json,sys
p=sys.argv[1]; d=json.load(open(p,encoding='utf-8'))
ghosts={'/workflow','/tools/best-print-size-finder','/tools/mat-frame-calculator','/tools/poster-tiling-calculator','/tools/saddle-stitch-booklet-calculator','/guides/best-file-format-for-printing','/guides/choose-best-photo-print-size','/guides/mat-frame-sizing-guide','/guides/rgb-vs-cmyk-printing','/guides/saddle-stitch-booklet-page-count','/guides/tiled-poster-printing-guide'}
assert d['count']==len(d['items'])
assert not any(x.get('path') in ghosts for x in d['items'])
print('search-index routes reconciled:',d['count'])
PY
for p in jobs.html job-core.html supplier-intelligence.html release-center.html readiness-audit.html command-center.html enterprise-dashboard.html digital-twin.html vault.html operations.html file-manifest.html production-archive.html; do
  echo "CHECK noindex $p"
  grep -Fq 'noindex,follow' "${staging}/${p}" || { echo "FAILED noindex $p" >&2; exit 1; }
done

rm -f -- "${output}"
(cd "${staging}" && zip -q -X -r "${output}" . -x '*.DS_Store')
sha256sum "${output}"
