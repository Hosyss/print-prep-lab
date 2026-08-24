#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_dir}/.." && pwd)"
client_dir="${project_root}/dist/client"
worker_file="${project_root}/dist/server/index.js"
output_dir="${project_root}/.cloudflare/pages"

[[ -d "${client_dir}" ]] || {
  echo "Missing dist/client. Run npm run build first." >&2
  exit 66
}

[[ -f "${worker_file}" ]] || {
  echo "Missing dist/server/index.js. Run npm run build first." >&2
  exit 66
}

if [[ "${output_dir}" != "${project_root}/.cloudflare/pages" ]]; then
  echo "Refusing to clear an unexpected Pages output path." >&2
  exit 70
fi

rm -rf -- "${output_dir}"
mkdir -p "${output_dir}"
cp -R "${client_dir}/." "${output_dir}/"
cp "${worker_file}" "${output_dir}/_worker.js"

for required_file in _worker.js _routes.json ads.txt favicon.svg og-image.png; do
  [[ -f "${output_dir}/${required_file}" ]] || {
    echo "Missing Pages artifact: ${required_file}" >&2
    exit 66
  }
done

echo "Prepared Cloudflare Pages artifact at .cloudflare/pages"
