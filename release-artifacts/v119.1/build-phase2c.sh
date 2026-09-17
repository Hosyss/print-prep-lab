#!/usr/bin/env bash
set -euo pipefail
release_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
base_zip="${release_dir}/print-prep-lab-pages-v119-2b-supplier-eligibility.zip"
output="${release_dir}/print-prep-lab-pages-v119-2c-jobs-linked.zip"
staging="$(mktemp -d)"
trap 'rm -rf -- "${staging}"' EXIT

bash "${release_dir}/build-phase2b.sh"
[[ -s "${base_zip}" ]] || { echo "Missing Phase 2b base artifact" >&2; exit 66; }
unzip -q "${base_zip}" -d "${staging}"
python3 "${release_dir}/phase2c-jobs-patch.py" \
  "${staging}/enterprise-suite.js" \
  "${staging}/jobs.js" \
  "${staging}/jobs.html" \
  "${staging}/job-core.html"
node --check "${staging}/enterprise-suite.js"
node --check "${staging}/jobs.js"
grep -Fq 'selected-job-id-v1' "${staging}/enterprise-suite.js"
grep -Fq 'enterprise-job-cores-v2' "${staging}/enterprise-suite.js"
grep -Fq 'data-select' "${staging}/jobs.js"
grep -Fq 'id="ec-selected-job"' "${staging}/job-core.html"
! grep -Fq 'value="Sample print job"' "${staging}/job-core.html"
! grep -Fq 'Initial production baseline</textarea>' "${staging}/job-core.html"
grep -Fq "decisionModel:'explicit-fields-v2'" "${staging}/enterprise-suite.js"
grep -Fq "decisionModel:'explicit-eligibility-v1'" "${staging}/enterprise-suite.js"
grep -Fq 'Who is it for?' "${staging}/home-v112.html"
rm -f -- "${output}"
(cd "${staging}" && zip -q -X -r "${output}" . -x '*.DS_Store')
sha256sum "${output}"
