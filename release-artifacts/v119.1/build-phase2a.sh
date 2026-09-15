#!/usr/bin/env bash
set -euo pipefail

release_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${release_dir}/../.." && pwd)"
base_zip="${release_dir}/print-prep-lab-pages-v119-1-home-legacy-fix.zip"
output="${release_dir}/print-prep-lab-pages-v119-2a-explicit-status.zip"
staging="$(mktemp -d)"
trap 'rm -rf -- "${staging}"' EXIT

bash "${release_dir}/build-v1191.sh"
[[ -s "${base_zip}" ]] || { echo "Missing v119.1 base artifact" >&2; exit 66; }
unzip -q "${base_zip}" -d "${staging}"

python3 "${release_dir}/phase2a-suite-patch.py" "${staging}/enterprise-suite.js"
cat "${release_dir}/enterprise-status-v1.js" "${staging}/enterprise-suite.js" > "${staging}/enterprise-suite.phase2a.js"
mv "${staging}/enterprise-suite.phase2a.js" "${staging}/enterprise-suite.js"
node --check "${staging}/enterprise-suite.js"

for page in digital-twin.html release-center.html enterprise-dashboard.html readiness-audit.html command-center.html; do
  grep -Fq '/enterprise-suite.js' "${staging}/${page}"
done
! grep -Eq 'blockedWord|okayWord|JSON\.stringify\([^)]*\).*BLOCK' "${staging}/enterprise-suite.js"
grep -Fq 'PPLStatusRules' "${staging}/enterprise-suite.js"
grep -Fq 'function supplier()' "${staging}/enterprise-suite.js"
grep -Fq 'function jobCore()' "${staging}/enterprise-suite.js"
grep -Fq 'Who is it for?' "${staging}/home-v112.html"
grep -Fq 'PROFESSIONAL WORKSPACE' "${staging}/command-center.html"

rm -f -- "${output}"
(cd "${staging}" && zip -q -X -r "${output}" . -x '*.DS_Store')
sha256sum "${output}"
