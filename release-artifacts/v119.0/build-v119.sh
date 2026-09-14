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
cat "${workflow_dir}/ppl-workflow-v1187.css" \
    "${release_dir}/ppl-design-v119.css" \
    "${release_dir}/ppl-home-v119.css" \
    "${release_dir}/ppl-polish-v119.css" \
    > "${staging}/ppl-workflow-v119.css"
cp "${repo_root}/public/ads.txt" "${staging}/ads.txt"

cat > "${staging}/_redirects" <<'EOF'
/admin https://print-prep-lab-admin.buildtools.workers.dev 302
/admin/ https://print-prep-lab-admin.buildtools.workers.dev 302
EOF

find "${staging}" -maxdepth 1 -type f -name '*.html' -print0 \
  | xargs -0 perl -pi -e 's/ppl-workflow-v1186\.js/ppl-workflow-v1187.js/g; s/ppl-workflow-v1186\.css/ppl-workflow-v119.css/g'
perl -pi -e 's/ppl-workflow-v1186\.js/ppl-workflow-v1187.js/g; s/ppl-workflow-v1186\.css/ppl-workflow-v119.css/g' "${staging}/_worker.js"

python3 - "${staging}" <<'PY'
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
replacements = {
    'â†’': '→', 'â†': '←', 'âœ“': '✓', 'آ·': '·',
    'â€”': '—', 'â€“': '–', 'â€™': '’', 'â€œ': '“',
    'â€': '”', 'Â©': '©',
}
changed = hits = 0
for p in root.glob('*.html'):
    s = p.read_text(encoding='utf-8')
    original = s
    for bad, good in replacements.items():
        count = s.count(bad)
        if count:
            hits += count
            s = s.replace(bad, good)
    if s != original:
        p.write_text(s, encoding='utf-8')
        changed += 1
print(f'normalized legacy punctuation: {hits} replacements across {changed} html files')

# One coherent navigation state across the professional surface. Pages that do
# not have a dedicated sidebar destination are grouped by the job decision they
# belong to instead of incorrectly highlighting Home.
groups = {
    '/command-center': {'command-center', 'enterprise-dashboard'},
    '/jobs': {'jobs', 'job-brief'},
    '/tools/print-readiness-checker': {'print-readiness-v111'},
    '/job-costing': {'job-costing', 'quote-compare'},
    '/supplier-intelligence': {'supplier-intelligence', 'procurement', 'provider-matrix'},
    '/release-center': {'release-center', 'release-packet', 'approval-matrix', 'customer-handoff', 'vendor-handoff', 'compliance-center'},
    '/production-analytics': {'production-analytics', 'audit-log'},
    '/vault': {'vault', 'file-manifest', 'production-archive'},
    '/operations': {
        'operations', 'capacity-planner', 'imposition-planner', 'qa-history', 'change-impact',
        'roll-media', 'packaging', 'risk-register', 'timeline', 'queue-planner', 'stock-coverage',
        'waste-ledger', 'revision-diff', 'calibration-registry', 'capa', 'fold-planner',
        'spine-planner', 'roll-diameter', 'pallet-planner', 'job-core', 'digital-twin',
        'automation-lab', 'schedule-optimizer', 'material-intelligence', 'signature-planner',
        'color-control', 'finishing-intelligence', 'fulfillment-center', 'readiness-audit',
        'sheet-planner', 'preflight', 'specs'
    },
    '/workspace#workspace-tools': {
        'workspace', 'inspector', 'proof-sheet', 'scenarios', 'prepress-lab', 'wall-layout',
        'troubleshoot', 'glossary', 'search', 'studio', 'batch', 'knowledge-base'
    },
}
route_for = {name: href for href, names in groups.items() for name in names}
custom_page_class = {'job-costing': 'ppl-page-costing', 'workspace': 'ppl-page-workspace'}
updated_nav = 0
for p in root.glob('*.html'):
    stem = p.stem
    if stem == 'home-v112':
        continue
    s = p.read_text(encoding='utf-8')
    nav_start = s.find('<nav class="ppl-side-nav">')
    if nav_start < 0:
        continue
    nav_end = s.find('</nav>', nav_start)
    if nav_end < 0:
        continue
    nav_end += len('</nav>')
    nav = s[nav_start:nav_end]
    nav = nav.replace('<a class="active" href="', '<a href="')
    href = route_for.get(stem, '/workspace#workspace-tools')
    needle = f'<a href="{href}">'
    if needle not in nav:
        href = '/workspace#workspace-tools'
        needle = f'<a href="{href}">'
    if needle in nav:
        nav = nav.replace(needle, f'<a class="active" href="{href}">', 1)
        updated_nav += 1
    s = s[:nav_start] + nav + s[nav_end:]

    page_class = custom_page_class.get(stem, f'ppl-page-{stem}')
    body_match = re.search(r'<body class="([^"]*)">', s)
    if body_match and page_class not in body_match.group(1).split():
        classes = f'{body_match.group(1)} {page_class}'.strip()
        s = s[:body_match.start()] + f'<body class="{classes}">' + s[body_match.end():]
    p.write_text(s, encoding='utf-8')
print(f'updated sidebar state on {updated_nav} static professional pages')
PY

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
grep -Fq 'class="active" href="/job-costing"' "${staging}/job-costing.html"
grep -Fq 'ppl-page-costing' "${staging}/job-costing.html"
grep -Fq 'class="active" href="/workspace#workspace-tools"' "${staging}/workspace.html"
grep -Fq 'ppl-page-workspace' "${staging}/workspace.html"
grep -Fq 'class="active" href="/supplier-intelligence"' "${staging}/supplier-intelligence.html"
grep -Fq 'class="active" href="/release-center"' "${staging}/release-center.html"
grep -Fq 'class="active" href="/production-analytics"' "${staging}/production-analytics.html"
grep -Fq 'class="active" href="/command-center"' "${staging}/command-center.html"
grep -Fq 'ppl-workflow-v119.css' "${staging}/operations.html"
grep -Fq 'google.com, pub-3369551572403499' "${staging}/ads.txt"

rm -f -- "${output}"
(cd "${staging}" && zip -q -X -r "${output}" . -x '*.DS_Store')
sha256sum "${output}"
