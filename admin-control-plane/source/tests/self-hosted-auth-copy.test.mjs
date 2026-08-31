import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const indexUrl = new URL("../public/index.html", import.meta.url);
const adminUrl = new URL("../public/admin.js", import.meta.url);
const copyUrl = new URL("../public/auth-status-copy.js", import.meta.url);
const workerUrl = new URL("../worker-no-zero-trust.js", import.meta.url);

test("admin overview describes self-hosted password + TOTP protection", async () => {
  const html = await readFile(indexUrl, "utf8");
  assert.match(html, /Password \+ TOTP session verified inside the Worker/);
  assert.match(html, /Time-based authenticator \(TOTP\) MFA/);
  assert.doesNotMatch(html, /Cloudflare Access deny-by-default policy/);
  assert.doesNotMatch(html, /JWT verified again inside the Worker/);
});

test("self-hosted admin source contains no stale Cloudflare Access status or startup copy", async () => {
  const source = await readFile(adminUrl, "utf8");
  assert.match(source, /function setSessionState\(/);
  assert.match(source, /Session verified/);
  assert.match(source, /Session check failed/);
  assert.match(source, /Authenticated/);
  assert.match(source, /Verify the protected session and the dedicated Admin database/);
  assert.doesNotMatch(source, /function setAccessState\(/);
  assert.doesNotMatch(source, /Access verified|Protection check failed|Verify Cloudflare Access and the dedicated database/);
});

test("session UI provides CSRF-protected sign-out and expiry handling without unsafe browser storage", async () => {
  const source = await readFile(copyUrl, "utf8");
  assert.match(source, /Session verified/);
  assert.match(source, /\/api\/auth\/logout/);
  assert.match(source, /X-CSRF-Token/);
  assert.match(source, /expiresAt/);
  assert.match(source, /window\.location\.replace\("\/"\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|innerHTML|outerHTML|insertAdjacentHTML/);
});

test("logout endpoint is POST-only, clears the host session cookie, and remains behind authenticated CSRF handling", async () => {
  const source = await readFile(workerUrl, "utf8");
  assert.match(source, /url\.pathname === "\/api\/auth\/logout" && request\.method === "POST"/);
  assert.match(source, /Set-Cookie": clearSessionCookie\(\)/);
  assert.match(source, /if \(write\) \{[\s\S]*requireJsonWrite\(request, origin\);[\s\S]*requireCsrf\(request, auth, env\);/);
});

test("large Admin catalog UI provides safe page and tool filtering with source context", async () => {
  const source = await readFile(copyUrl, "utf8");
  assert.match(source, /page-filter/);
  assert.match(source, /tool-filter/);
  assert.match(source, /\/site-catalog\.json/);
  assert.match(source, /payload\.pages\.length !== 113/);
  assert.match(source, /baselineH1/);
  assert.match(source, /baselineDescription/);
  assert.match(source, /sourceType/);
  assert.match(source, /indexedInProduction/);
  assert.match(source, /No managed pages match this filter/);
  assert.match(source, /Admin catalog search could not start/);
  assert.match(source, /loadCatalogUx\(\)\.catch/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\s*\(|new\s+Function/);
});
