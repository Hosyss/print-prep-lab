import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("no-zero-trust admin disables preview URLs and HTML canonical redirects", () => {
  const wrangler = fs.readFileSync(path.join(root, "wrangler-no-zero-trust.toml"), "utf8");
  assert.match(wrangler, /^preview_urls\s*=\s*false$/m);
  assert.match(wrangler, /^html_handling\s*=\s*"none"$/m);
  assert.match(wrangler, /^not_found_handling\s*=\s*"single-page-application"$/m);
  assert.match(wrangler, /^run_worker_first\s*=\s*true$/m);
});
