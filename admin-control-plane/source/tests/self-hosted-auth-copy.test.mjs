import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const indexUrl = new URL("../public/index.html", import.meta.url);
const copyUrl = new URL("../public/auth-status-copy.js", import.meta.url);

test("admin overview describes self-hosted password + TOTP protection", async () => {
  const html = await readFile(indexUrl, "utf8");
  assert.match(html, /Password \+ TOTP session verified inside the Worker/);
  assert.match(html, /Time-based authenticator \(TOTP\) MFA/);
  assert.doesNotMatch(html, /Cloudflare Access deny-by-default policy/);
  assert.doesNotMatch(html, /JWT verified again inside the Worker/);
});

test("session status compatibility copy avoids browser storage and unsafe DOM sinks", async () => {
  const source = await readFile(copyUrl, "utf8");
  assert.match(source, /Session verified/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|innerHTML|outerHTML|insertAdjacentHTML/);
});
