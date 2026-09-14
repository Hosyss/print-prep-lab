#!/usr/bin/env bash
set -euo pipefail

release_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${release_dir}/../.." && pwd)"
baseline="${repo_root}/release-artifacts/v118.6/print-prep-lab-pages-20260830-v118-6-runtime-mobile-arabic-recovery.zip"
workflow_dir="${repo_root}/release-artifacts/v118.8"
output="${release_dir}/print-prep-lab-pages-v119-professional-preview.zip"
staging="$(mktemp -d)"
trap 'rm -rf -- "${staging}"' EXIT

unzip -q "${baseline}" -d "${staging}"
cp "${release_dir}/ppl-home-v119.html" "${staging}/home-v112.html"
cp "${workflow_dir}/ppl-workflow-v1187.js" "${staging}/ppl-workflow-v1187.js"
cat "${workflow_dir}/ppl-workflow-v1187.css" "${release_dir}/ppl-design-v119.css" "${release_dir}/ppl-home-v119.css" > "${staging}/ppl-workflow-v119.css"
cp "${repo_root}/public/ads.txt" "${staging}/ads.txt"

cat > "${staging}/_redirects" <<'EOF'
/admin https://print-prep-lab-admin.buildtools.workers.dev 302
/admin/ https://print-prep-lab-admin.buildtools.workers.dev 302
EOF

find "${staging}" -maxdepth 1 -type f -name '*.html' -print0 \
  | xargs -0 perl -pi -e 's/ppl-workflow-v1186\.js/ppl-workflow-v1187.js/g; s/ppl-workflow-v1186\.css/ppl-workflow-v119.css/g'
perl -pi -e 's/ppl-workflow-v1186\.js/ppl-workflow-v1187.js/g; s/ppl-workflow-v1186\.css/ppl-workflow-v119.css/g' "${staging}/_worker.js"

python3 - "${staging}/operations.html" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
s = p.read_text(encoding='utf-8')
s = s.replace(
    'One board for the job<br/><em>after the file is ready.</em>',
    'Run the job from one clear operations board.'
)
s = s.replace(
    'Read the browser-local signals created across Print Prep Lab and expose what is missing before release: file identity, preflight, cost, capacity, imposition, quote assumptions and QA blockers. The board does not create evidence that was never recorded.',
    'Bring together the signals already recorded across Print Prep Lab — file identity, preflight, cost, capacity, imposition, quotes and QA — so you can see what is ready, what is missing and what still needs review before release.'
)
s = s.replace('<a class="active" href="/">', '<a href="/">', 1)
s = s.replace('<a href="/operations"><svg', '<a class="active" href="/operations"><svg', 1)
p.write_text(s, encoding='utf-8')
PY

perl -0pi -e 's/if \(redirectResponse\) return redirectResponse;/if (redirectResponse) return redirectResponse;\n      if (url.pathname === "\/admin" || url.pathname === "\/admin\/") return new Response(null, { status: 302, headers: { Location: "https:\/\/print-prep-lab-admin.buildtools.workers.dev", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow, noarchive" } });/' "${staging}/_worker.js"

node - "${staging}/_routes.json" <<'NODE'
const fs = require('node:fs');
const path = process.argv[2];
const routes = JSON.parse(fs.readFileSync(path, 'utf8'));
for (const asset of ['/ppl-workflow-v119.css', '/ppl-workflow-v1187.js', '/ads.txt']) {
  if (!routes.exclude.includes(asset)) routes.exclude.push(asset);
}
fs.writeFileSync(path, `${JSON.stringify(routes)}\n`);
NODE

cat >> "${staging}/_headers" <<'EOF'

/ppl-workflow-v119.css
  Cache-Control: public, max-age=3600

/ppl-workflow-v1187.js
  Cache-Control: public, max-age=31536000, immutable

/ads.txt
  Cache-Control: public, max-age=300
EOF

node --check "${staging}/_worker.js"
grep -Fq 'Print preparation, without the guesswork.' "${staging}/home-v112.html"
grep -Fq 'Run the job from one clear operations board.' "${staging}/operations.html"
grep -Fq 'ppl-workflow-v119.css' "${staging}/operations.html"
grep -Fq 'google.com, pub-3369551572403499' "${staging}/ads.txt"

rm -f -- "${output}"
(cd "${staging}" && zip -q -X -r "${output}" . -x '*.DS_Store')
sha256sum "${output}"
