#!/usr/bin/env bash
set -euo pipefail

release_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${release_dir}/../.." && pwd)"
v119_dir="${repo_root}/release-artifacts/v119.0"
v119_zip="${v119_dir}/print-prep-lab-pages-v119-professional-preview.zip"
output="${release_dir}/print-prep-lab-pages-v119-1-home-legacy-fix.zip"
staging="$(mktemp -d)"
trap 'rm -rf -- "${staging}"' EXIT

bash "${v119_dir}/build-v119.sh"
[[ -s "${v119_zip}" ]] || { echo "Missing v119 base artifact" >&2; exit 66; }
unzip -q "${v119_zip}" -d "${staging}"

python3 - "${staging}" <<'PY'
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])

# Normalize only user-facing legacy release branding. Internal filenames,
# route names, data keys and scripts stay unchanged for compatibility.
def clean_visible_text(text: str) -> str:
    text = re.sub(r'\bv\d+(?:[–-]v\d+)?\s*·\s*ENTERPRISE PLATFORM\b', 'PROFESSIONAL WORKSPACE', text, flags=re.I)
    text = re.sub(r'\bv61[–-]v100\s*·\s*Enterprise layer\b', 'Professional modules', text, flags=re.I)
    text = re.sub(r'\bv100 Command\b', 'Command Center', text, flags=re.I)
    text = re.sub(r'\bThe v100 command view\b', 'The command view', text, flags=re.I)
    text = re.sub(r'\bthe v100 command view\b', 'the command view', text, flags=re.I)
    text = re.sub(r'\bThe v100 platform\b', 'The platform', text, flags=re.I)
    text = re.sub(r'\bthe v100 platform\b', 'the platform', text, flags=re.I)
    text = re.sub(r'\bv100 platform\b', 'local-first workspace', text, flags=re.I)
    text = re.sub(r'\bv\d+(?:[–-]v\d+)?\s*·\s*Local-first planning\.', 'Local-first planning.', text, flags=re.I)
    if re.fullmatch(r'\s*v\d+(?:[–-]v\d+)?\s*', text):
        return 'Module'
    return text

changed = 0
for p in root.glob('*.html'):
    s = p.read_text(encoding='utf-8')
    original = s

    # Language switching must not resurrect the old layer label.
    s = s.replace('data-en="v61–v100 · Enterprise layer"', 'data-en="Professional modules"')
    s = s.replace('data-ar="v61–v100 · طبقة المؤسسة"', 'data-ar="وحدات احترافية"')

    # Rename the old dashboard product label while keeping its route stable.
    s = s.replace('Enterprise Dashboard', 'Workspace Dashboard')
    s = s.replace('enterprise signals', 'workspace signals')

    # Do not touch inline scripts/styles; clean actual rendered text nodes only.
    parts = re.split(r'(<(?:script|style)\b.*?</(?:script|style)>)', s, flags=re.I | re.S)
    for i in range(0, len(parts), 2):
        parts[i] = re.sub(r'>([^<]+)<', lambda m: '>' + clean_visible_text(m.group(1)) + '<', parts[i])
    s = ''.join(parts)

    if s != original:
        p.write_text(s, encoding='utf-8')
        changed += 1
print(f'normalized legacy release branding on {changed} static html pages')

failures = []
for p in root.glob('*.html'):
    s = p.read_text(encoding='utf-8')
    visible = re.sub(r'<(?:script|style)\b.*?</(?:script|style)>', '', s, flags=re.I | re.S)
    checks = {
        'v100 Command': r'>[^<]*\bv100 Command\b[^<]*<',
        'enterprise platform badge': r'>[^<]*ENTERPRISE PLATFORM[^<]*<',
        'enterprise layer badge': r'>[^<]*Enterprise layer[^<]*<',
        'standalone visible release number': r'>\s*v\d+(?:[–-]v\d+)?\s*<',
        'v100 platform copy': r'>[^<]*\bv100 platform\b[^<]*<',
        'v100 command-view copy': r'>[^<]*\bv100 command view\b[^<]*<',
    }
    for label, pattern in checks.items():
        if re.search(pattern, visible, flags=re.I):
            failures.append(f'{p.name}: {label}')
if failures:
    raise SystemExit('Visible legacy release branding remains:\n' + '\n'.join(failures))
PY

grep -Fq 'What is Print Prep Lab?' "${staging}/home-v112.html"
grep -Fq 'Why do people use it?' "${staging}/home-v112.html"
grep -Fq 'Who is it for?' "${staging}/home-v112.html"
grep -Fq 'Commercial and digital printers' "${staging}/home-v112.html"
grep -Fq 'Graphic designers' "${staging}/home-v112.html"
grep -Fq 'Packaging teams' "${staging}/home-v112.html"
grep -Fq 'Print sellers and small brands' "${staging}/home-v112.html"
grep -Fq 'Students and print labs' "${staging}/home-v112.html"
grep -Fq 'What can it help you solve?' "${staging}/home-v112.html"
grep -Fq 'لمن صُمم؟' "${staging}/home-v112.html"
grep -Fq '.home-v119-about' "${staging}/ppl-workflow-v119.css"
grep -Fq 'Command Center' "${staging}/command-center.html"
grep -Fq 'PROFESSIONAL WORKSPACE' "${staging}/command-center.html"

rm -f -- "${output}"
(cd "${staging}" && zip -q -X -r "${output}" . -x '*.DS_Store')
sha256sum "${output}"
