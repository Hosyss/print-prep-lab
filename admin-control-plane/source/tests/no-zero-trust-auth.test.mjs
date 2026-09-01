import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import worker, {
  SESSION_COOKIE,
  signSession,
  totpCode,
  verifySessionToken,
  verifyTotp,
} from "../worker-no-zero-trust.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

class TestD1Statement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
    this.values = [];
  }
  bind(...values) {
    this.values = values;
    return this;
  }
  async first() {
    return this.database.prepare(this.sql).get(...this.values) || null;
  }
  async all() {
    return { results: this.database.prepare(this.sql).all(...this.values) };
  }
  async run() {
    const result = this.database.prepare(this.sql).run(...this.values);
    return { meta: { changes: Number(result.changes) } };
  }
}

class TestD1 {
  constructor() {
    this.database = new DatabaseSync(":memory:");
    this.database.exec(fs.readFileSync(path.join(root, "schema.sql"), "utf8"));
    this.database.exec(fs.readFileSync(path.join(root, "migrations/0002_auth_settings.sql"), "utf8"));
  }
  prepare(sql) {
    return new TestD1Statement(this.database, sql);
  }
  async batch(statements) {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      this.database.exec("COMMIT");
      return results;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
  close() {
    this.database.close();
  }
}

const baseEnv = () => ({
  ADMIN_EMAILS: "owner@example.com",
  ADMIN_PASSWORD: "A-very-long-owner-password-2026!",
  CSRF_SECRET: "c".repeat(40),
  AUDIT_SECRET: "a".repeat(40),
  SESSION_SECRET: "s".repeat(40),
});

function cookiePair(setCookie) {
  return String(setCookie || "").split(";", 1)[0];
}

test("self-hosted session tokens are signed, purpose-bound and expiring", async () => {
  const env = baseEnv();
  const now = 1_800_000_000;
  const admin = await signSession("owner@example.com", "admin", env, now);
  const verified = await verifySessionToken(admin, env, "admin", now + 30);
  assert.equal(verified.email, "owner@example.com");
  assert.equal(verified.purpose, "admin");
  await assert.rejects(() => verifySessionToken(admin, env, "totp-setup", now + 30), /session/i);
  await assert.rejects(() => verifySessionToken(`${admin.slice(0, -1)}${admin.endsWith("0") ? "1" : "0"}`, env, "admin", now + 30), /session/i);
  await assert.rejects(() => verifySessionToken(admin, env, "admin", now + 1900), /expired|session/i);
});

test("TOTP verification accepts the current window and rejects a wrong code", async () => {
  const secret = "JBSWY3DPEHPK3PXP";
  const now = 1_800_000_000_000;
  const code = await totpCode(secret, Math.floor(now / 30_000));
  assert.match(code, /^\d{6}$/);
  assert.equal(await verifyTotp(secret, code, now), true);
  assert.equal(await verifyTotp(secret, code === "000000" ? "000001" : "000000", now), false);
});

test("login assets avoid inline execution and browser storage", () => {
  const html = fs.readFileSync(path.join(root, "public/login.html"), "utf8");
  const js = fs.readFileSync(path.join(root, "public/login.js"), "utf8");
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
  assert.doesNotMatch(html, /<style\b|\son[a-z]+\s*=/i);
  assert.doesNotMatch(js, /\b(?:innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\s*\(|new\s+Function)\b/);
  assert.doesNotMatch(js, /\b(?:localStorage|sessionStorage)\b/);
});

test("no-zero-trust deployment config is explicit and contains no committed auth secrets", () => {
  const wrangler = fs.readFileSync(path.join(root, "wrangler-no-zero-trust.toml"), "utf8");
  assert.match(wrangler, /main\s*=\s*"worker-no-zero-trust\.js"/);
  assert.match(wrangler, /workers_dev\s*=\s*true/);
  assert.match(wrangler, /database_id\s*=\s*"REPLACE_AFTER_CREATING_D1"/);
  assert.doesNotMatch(wrangler, /ADMIN_PASSWORD\s*=\s*".+"/);
  assert.doesNotMatch(wrangler, /SESSION_SECRET\s*=\s*".+"/);
  const source = fs.readFileSync(path.join(root, "worker-no-zero-trust.js"), "utf8");
  assert.doesNotMatch(source, /cloudflareaccess\.com|Cf-Access-Jwt-Assertion|CF_Authorization/);
});

test("first sign-in enrolls encrypted TOTP and creates an HttpOnly admin session", async () => {
  const database = new TestD1();
  const env = {
    ...baseEnv(),
    DB: database,
    ASSETS: {
      fetch: async (request) => new Response(`asset:${new URL(request.url).pathname}`, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    },
  };
  const origin = "https://print-prep-lab-admin.test-account.workers.dev";
  try {
    const wrongHost = await worker.fetch(new Request("https://evil.example/"), env);
    assert.equal(wrongHost.status, 421);

    const loginPage = await worker.fetch(new Request(`${origin}/`), env);
    assert.equal(loginPage.status, 200);
    assert.equal(await loginPage.text(), "asset:/login.html");

    const badOrigin = await worker.fetch(new Request(`${origin}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
      body: JSON.stringify({ email: "owner@example.com", password: env.ADMIN_PASSWORD }),
    }), env);
    assert.equal(badOrigin.status, 403);

    const login = await worker.fetch(new Request(`${origin}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        "Sec-Fetch-Site": "same-origin",
        "CF-Connecting-IP": "203.0.113.10",
      },
      body: JSON.stringify({ email: "owner@example.com", password: env.ADMIN_PASSWORD }),
    }), env);
    assert.equal(login.status, 202);
    const setupCookie = cookiePair(login.headers.get("Set-Cookie"));
    assert.match(setupCookie, new RegExp(`^${SESSION_COOKIE}=`));
    assert.match(login.headers.get("Set-Cookie"), /HttpOnly/);
    assert.match(login.headers.get("Set-Cookie"), /SameSite=Strict/);

    const setup = await worker.fetch(new Request(`${origin}/api/auth/totp/setup`, {
      headers: { Cookie: setupCookie },
    }), env);
    assert.equal(setup.status, 200);
    const setupBody = await setup.json();
    assert.match(setupBody.secret, /^[A-Z2-7]{20,}$/);
    assert.equal(setupBody.account, "owner@example.com");

    const rowBefore = database.database.prepare("SELECT ciphertext, verified_at FROM auth_settings WHERE id = 'totp'").get();
    assert.ok(rowBefore.ciphertext);
    assert.equal(rowBefore.verified_at, null);
    assert.notEqual(rowBefore.ciphertext, setupBody.secret);

    const code = await totpCode(setupBody.secret, Math.floor(Date.now() / 30_000));
    const confirm = await worker.fetch(new Request(`${origin}/api/auth/totp/confirm`, {
      method: "POST",
      headers: {
        Cookie: setupCookie,
        "Content-Type": "application/json",
        Origin: origin,
        "Sec-Fetch-Site": "same-origin",
      },
      body: JSON.stringify({ totp: code }),
    }), env);
    assert.equal(confirm.status, 200);
    const adminCookie = cookiePair(confirm.headers.get("Set-Cookie"));
    assert.match(adminCookie, new RegExp(`^${SESSION_COOKIE}=`));

    const rowAfter = database.database.prepare("SELECT verified_at FROM auth_settings WHERE id = 'totp'").get();
    assert.ok(rowAfter.verified_at);

    const session = await worker.fetch(new Request(`${origin}/api/session`, {
      headers: { Cookie: adminCookie, "CF-Connecting-IP": "203.0.113.10" },
    }), env);
    assert.equal(session.status, 200);
    const sessionBody = await session.json();
    assert.equal(sessionBody.email, "owner@example.com");
    assert.equal(sessionBody.mfaEnforcement, "password-plus-totp");
    assert.match(sessionBody.csrfToken, /^[0-9a-f]{64}$/);

    const blocked = await worker.fetch(new Request(`${origin}/api/session`), env);
    assert.equal(blocked.status, 401);
  } finally {
    database.close();
  }
});
