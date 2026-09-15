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

install -m 0644 "${release_dir}/enterprise-status-v1.js" "${staging}/enterprise-status-v1.js"
python3 "${release_dir}/phase2a-suite-patch.py" "${staging}/enterprise-suite.js"

python3 - "${staging}" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
needle='<script defer="" src="/enterprise-suite.js"></script>'
insert='<script defer="" src="/enterprise-status-v1.js"></script>'+needle
changed=[]
for p in root.glob('*.html'):
    s=p.read_text(encoding='utf-8')
    if needle in s:
        if 'enterprise-status-v1.js' not in s:
            s=s.replace(needle,insert)
            p.write_text(s,encoding='utf-8')
        changed.append(p.name)
if not changed:
    raise SystemExit('No enterprise-suite consumers found in staged artifact')
print(f'phase2a status rules injected into {len(changed)} enterprise pages')
PY

for page in digital-twin.html release-center.html enterprise-dashboard.html readiness-audit.html command-center.html; do
  grep -Fq '/enterprise-status-v1.js' "${staging}/${page}"
  grep -Fq '/enterprise-suite.js' "${staging}/${page}"
done
! grep -Eq 'blockedWord|okayWord|JSON\.stringify\([^)]*\).*BLOCK' "${staging}/enterprise-suite.js"
grep -Fq 'PPLStatusRules' "${staging}/enterprise-status-v1.js"
grep -Fq 'function supplier()' "${staging}/enterprise-suite.js"
grep -Fq 'function jobCore()' "${staging}/enterprise-suite.js"
grep -Fq 'Who is it for?' "${staging}/home-v112.html"
grep -Fq 'PROFESSIONAL WORKSPACE' "${staging}/command-center.html"

rm -f -- "${output}"
(cd "${staging}" && zip -q -X -r "${output}" . -x '*.DS_Store')
sha256sum "${output}"
