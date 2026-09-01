import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import worker, { totpCode } from "../worker-no-zero-trust.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://print-prep-lab-admin.test-account.workers.dev";

class Statement {
  constructor(database, sql) { this.database = database; this.sql = sql; this.values = []; }
  bind(...values) { this.values = values; return this; }
  async first() { return this.database.prepare(this.sql).get(...this.values) || null; }
  async all() { return { results: this.database.prepare(this.sql).all(...this.values) }; }
  async run() { const result = this.database.prepare(this.sql).run(...this.values); return { meta: { changes: Number(result.changes) } }; }
}

class TestD1 {
  constructor() {
    this.database = new DatabaseSync(":memory:");
    this.database.exec(fs.readFileSync(path.join(root, "schema.sql"), "utf8"));
    this.database.exec(fs.readFileSync(path.join(root, "migrations/0002_auth_settings.sql"), "utf8"));
  }
  prepare(sql) { return new Statement(this.database, sql); }
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
  close() { this.database.close(); }
}

function envFor(db) {
  return {
    ADMIN_EMAILS: "owner@example.com",
    ADMIN_PASSWORD: "A-very-long-owner-password-2026!",
    CSRF_SECRET: "csrf-" + "c".repeat(40),
    AUDIT_SECRET: "audit-" + "a".repeat(40),
    SESSION_SECRET: "session-" + "s".repeat(40),
    DB: db,
    ASSETS: { fetch: async () => new Response("admin") },
  };
}

function cookiePair(value) { return String(value || "").split(";", 1)[0]; }

function loginRequest(env, totp, ip) {
  return worker.fetch(new Request(`${origin}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      "Sec-Fetch-Site": "same-origin",
      "CF-Connecting-IP": ip,
    },
    body: JSON.stringify({ email: "owner@example.com", password: env.ADMIN_PASSWORD, ...(totp ? { totp } : {}) }),
  }), env);
}

async function enroll(env) {
  const start = await loginRequest(env, null, "203.0.113.10");
  assert.equal(start.status, 202);
  const setupCookie = cookiePair(start.headers.get("Set-Cookie"));
  const setup = await worker.fetch(new Request(`${origin}/api/auth/totp/setup`, { headers: { Cookie: setupCookie } }), env);
  assert.equal(setup.status, 200);
  const { secret } = await setup.json();
  const code = await totpCode(secret, Math.floor(Date.now() / 30_000));
  const confirm = await worker.fetch(new Request(`${origin}/api/auth/totp/confirm`, {
    method: "POST",
    headers: { Cookie: setupCookie, "Content-Type": "application/json", Origin: origin, "Sec-Fetch-Site": "same-origin" },
    body: JSON.stringify({ totp: code }),
  }), env);
  assert.equal(confirm.status, 200);
  return secret;
}

async function wrongCodeFor(secret, step) {
  const forbidden = new Set();
  for (const delta of [-1, 0, 1]) forbidden.add(await totpCode(secret, step + delta));
  for (let value = 0; value < 1_000_000; value += 1) {
    const code = String(value).padStart(6, "0");
    if (!forbidden.has(code)) return code;
  }
  throw new Error("Unable to construct a non-matching TOTP code.");
}

test("correct-password TOTP guesses share one strict account budget across distributed IP addresses", async () => {
  const db = new TestD1();
  const env = envFor(db);
  const realNow = Date.now;
  let nowMs = 1_800_000_000_000;
  Date.now = () => nowMs;
  try {
    const secret = await enroll(env);
    const step = Math.floor(nowMs / 30_000);
    const wrong = await wrongCodeFor(secret, step);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await loginRequest(env, wrong, `198.51.100.${20 + attempt}`);
      assert.equal(response.status, 401);
      assert.equal((await response.json()).error, "invalid_credentials");
    }
    const correct = await totpCode(secret, step);
    const blocked = await loginRequest(env, correct, "198.51.100.99");
    assert.equal(blocked.status, 429);
    assert.equal((await blocked.json()).error, "rate_limited");
    const retryAfter = Number(blocked.headers.get("Retry-After"));
    assert.ok(Number.isInteger(retryAfter) && retryAfter >= 1 && retryAfter <= 600);
    assert.equal(db.database.prepare("SELECT COUNT(*) AS count FROM audit_log WHERE action = 'auth.login'").get().count, 0);

    nowMs += 601_000;
    const freshCode = await totpCode(secret, Math.floor(nowMs / 30_000));
    const recovered = await loginRequest(env, freshCode, "198.51.100.100");
    assert.equal(recovered.status, 200);
    assert.equal(db.database.prepare("SELECT COUNT(*) AS count FROM audit_log WHERE action = 'auth.login'").get().count, 1);
  } finally {
    Date.now = realNow;
    db.close();
  }
});

test("successful MFA clears the shared TOTP attempt budget for the current window", async () => {
  const db = new TestD1();
  const env = envFor(db);
  const realNow = Date.now;
  const nowMs = 1_810_000_000_000;
  Date.now = () => nowMs;
  try {
    const secret = await enroll(env);
    const step = Math.floor(nowMs / 30_000);
    const wrong = await wrongCodeFor(secret, step);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await loginRequest(env, wrong, `203.0.113.${40 + attempt}`);
      assert.equal(response.status, 401);
    }
    const accountBucket = db.database.prepare("SELECT key, window_start FROM rate_limits WHERE count = 3").get();
    assert.ok(accountBucket?.key);
    const correct = await totpCode(secret, step);
    const success = await loginRequest(env, correct, "203.0.113.60");
    assert.equal(success.status, 200);
    assert.equal(db.database.prepare("SELECT COUNT(*) AS count FROM rate_limits WHERE key = ? AND window_start = ?").get(accountBucket.key, accountBucket.window_start).count, 0);
  } finally {
    Date.now = realNow;
    db.close();
  }
});
