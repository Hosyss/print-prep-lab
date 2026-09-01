#!/usr/bin/env bash
set -euo pipefail

release_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${release_dir}/../.." && pwd)"
baseline="${repo_root}/release-artifacts/v118.6/print-prep-lab-pages-20260830-v118-6-runtime-mobile-arabic-recovery.zip"
output="${release_dir}/print-prep-lab-pages-20260901-v118-8-performance-source-recovery.zip"
staging="$(mktemp -d)"
trap 'rm -rf -- "${staging}"' EXIT

unzip -q "${baseline}" -d "${staging}"
cp "${release_dir}/ppl-workflow-v1187.js" "${staging}/ppl-workflow-v1187.js"
cp "${release_dir}/ppl-workflow-v1187.css" "${staging}/ppl-workflow-v1187.css"
cp "${release_dir}/V118_8_RELEASE.json" "${staging}/V118_8_RELEASE.json"
cat > "${staging}/_redirects" <<'EOF'
/admin https://print-prep-lab-admin.buildtools.workers.dev 302
/admin/ https://print-prep-lab-admin.buildtools.workers.dev 302
EOF

find "${staging}" -maxdepth 1 -type f -name '*.html' -print0 \
  | xargs -0 perl -pi -e 's/ppl-workflow-v1186\.(js|css)/ppl-workflow-v1187.$1/g'
perl -pi -e 's/ppl-workflow-v1186/ppl-workflow-v1187/g' "${staging}/_worker.js"
perl -pi -e 's/headers\.set\("Cache-Control", "public, max-age=0, must-revalidate"\);/headers.set("Cache-Control", "public, max-age=0, must-revalidate");\n    headers.set("CDN-Cache-Control", "public, max-age=600, stale-while-revalidate=86400");/' "${staging}/_worker.js"

node - "${staging}/_routes.json" <<'NODE'
const fs = require('node:fs');
const path = process.argv[2];
const routes = JSON.parse(fs.readFileSync(path, 'utf8'));
for (const asset of ['/ppl-workflow-v1187.css', '/ppl-workflow-v1187.js']) {
  if (!routes.exclude.includes(asset)) routes.exclude.push(asset);
}
fs.writeFileSync(path, `${JSON.stringify(routes)}\n`);
NODE

node - "${staging}/_headers" <<'NODE'
const fs = require('node:fs');
const path = process.argv[2];
let headers = fs.readFileSync(path, 'utf8').trimEnd();
const rules = [
  ['/ppl-app-v112.css', 'public, max-age=31536000, immutable'],
  ['/ppl-app-v1186.js', 'public, max-age=31536000, immutable'],
  ['/ppl-ui-v1186.js', 'public, max-age=31536000, immutable'],
  ['/ppl-ar-v1186.json', 'public, max-age=31536000, immutable'],
  ['/ppl-workflow-v1187.css', 'public, max-age=31536000, immutable'],
  ['/ppl-workflow-v1187.js', 'public, max-age=31536000, immutable'],
  ['/ads-review-disabled.js', 'public, max-age=86400'],
];
for (const [route, value] of rules) {
  if (!headers.includes(`\n${route}\n`)) headers += `\n\n${route}\n  Cache-Control: ${value}`;
}
fs.writeFileSync(path, `${headers}\n`);
NODE

find "${staging}" -exec touch -t 202609010000 {} +
rm -f -- "${output}"
(cd "${staging}" && zip -q -X -r "${output}" . -x '*.DS_Store')
sha256sum "${output}"
