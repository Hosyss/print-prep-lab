#!/usr/bin/env bash
set -euo pipefail

release_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
base_zip="${release_dir}/print-prep-lab-pages-v119-2a-explicit-status.zip"
output="${release_dir}/print-prep-lab-pages-v119-2b-supplier-eligibility.zip"
staging="$(mktemp -d)"
trap 'rm -rf -- "${staging}"' EXIT

bash "${release_dir}/build-phase2a.sh"
[[ -s "${base_zip}" ]] || { echo "Missing Phase 2a base artifact" >&2; exit 66; }
unzip -q "${base_zip}" -d "${staging}"

python3 "${release_dir}/phase2b-supplier-patch.py" \
  "${staging}/enterprise-suite.js" \
  "${staging}/supplier-intelligence.html"
node --check "${staging}/enterprise-suite.js"

grep -Fq "decisionModel:'explicit-eligibility-v1'" "${staging}/enterprise-suite.js"
grep -Fq 'id="si-eligibility"' "${staging}/supplier-intelligence.html"
grep -Fq 'Weights are fixed in Phase 2' "${staging}/supplier-intelligence.html"
! grep -Fq 'user-controlled weights' "${staging}/supplier-intelligence.html"
! grep -Fq 'r.cap<70' "${staging}/enterprise-suite.js"
grep -Fq "decisionModel:'explicit-fields-v2'" "${staging}/enterprise-suite.js"
grep -Fq 'blockers:blocked.map' "${staging}/enterprise-suite.js"
grep -Fq 'function jobCore()' "${staging}/enterprise-suite.js"
grep -Fq 'Who is it for?' "${staging}/home-v112.html"

rm -f -- "${output}"
(cd "${staging}" && zip -q -X -r "${output}" . -x '*.DS_Store')
sha256sum "${output}"
