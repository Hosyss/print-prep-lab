import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workerUrl = new URL("../worker-no-zero-trust.js", import.meta.url);

test("self-hosted session and health contracts describe password + TOTP without Access terminology", async () => {
  const source = await readFile(workerUrl, "utf8");

  assert.match(source, /sessionVerified: true/);
  assert.match(source, /mfaEnforcement: "password-plus-totp"/);
  assert.match(source, /auth: "password-plus-totp"/);
  assert.match(source, /publicIntegration: false/);

  assert.doesNotMatch(source, /accessVerified/);
  assert.doesNotMatch(source, /cloudflare-access-policy/);
  assert.doesNotMatch(source, /CF_ACCESS_|Cf-Access-Jwt-Assertion|CF_Authorization|cloudflareaccess\.com/);
});
