import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import worker, { totpCode } from "../worker-no-zero-trust.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://print-prep-lab-admin.test-account.workers.dev";

class TestD1Statement {
  constructor(database, sql) { this.database = database; this.sql = sql; this.values = []; }
  bind(...values) { this.values = values; return this; }
  async first() { return this.database.prepare(this.sql).get(...this.values) || null; }
  async all() { return { results: this.database.prepare(this.sql).all(...this.values) }; }
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
  prepare(sql) { return new TestD1Statement(this.database, sql); }
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

function envFor(database) {
  return {
    ADMIN_EMAILS: "owner@example.com",
    ADMIN_PASSWORD: "A-very-long-owner-password-2026!",
    CSRF_SECRET: "c".repeat(40),
    AUDIT_SECRET: "a".repeat(40),
    SESSION_SECRET: "s".repeat(40),
    DB: database,
  };
}

function loginRequest(body, ip = "203.0.113.40") {
  return new Request(`${origin}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      "Sec-Fetch-Site": "same-origin",
      "CF-Connecting-IP": ip,
    },
    body: JSON.stringify(body),
  });
}

function cookiePair(value) { return String(value || "").split(";", 1)[0]; }

async function enrollTotp(database, env) {
  const first = await worker.fetch(loginRequest({ email: "owner@example.com", password: env.ADMIN_PASSWORD }, "203.0.113.30"), env);
  assert.equal(first.status, 202);
  const setupCookie = cookiePair(first.headers.get("Set-Cookie"));
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

test("valid password requests waiting for TOTP do not consume the failed-login budget", async () => {
  const database = new TestD1();
  const env = envFor(database);
  try {
    await enrollTotp(database, env);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await worker.fetch(loginRequest({ email: "owner@example.com", password: env.ADMIN_PASSWORD }), env);
      assert.equal(response.status, 401);
      assert.equal((await response.json()).error, "totp_required");
    }
    const rows = database.database.prepare("SELECT COUNT(*) AS count FROM rate_limits").get();
    assert.equal(Number(rows.count), 0);
  } finally {
    database.close();
  }
});

test("only failed credentials consume the login budget and successful MFA clears prior failures", async () => {
  const database = new TestD1();
  const env = envFor(database);
  try {
    const secret = await enrollTotp(database, env);
    const ip = "203.0.113.50";
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await worker.fetch(loginRequest({ email: "owner@example.com", password: "wrong-password" }, ip), env);
      assert.equal(response.status, 401);
      assert.equal((await response.json()).error, "invalid_credentials");
    }
    const failedBucket = database.database.prepare("SELECT key, window_start FROM rate_limits WHERE count = 3").get();
    assert.ok(failedBucket?.key);

    const currentCode = await totpCode(secret, Math.floor(Date.now() / 30_000));
    const success = await worker.fetch(loginRequest({ email: "owner@example.com", password: env.ADMIN_PASSWORD, totp: currentCode }, ip), env);
    assert.equal(success.status, 200);
    assert.equal(Number(database.database.prepare("SELECT COUNT(*) AS count FROM rate_limits WHERE key = ? AND window_start = ?").get(failedBucket.key, failedBucket.window_start).count), 0);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await worker.fetch(loginRequest({ email: "owner@example.com", password: "wrong-password" }, ip), env);
      assert.equal(response.status, 401);
    }
    const blocked = await worker.fetch(loginRequest({ email: "owner@example.com", password: "wrong-password" }, ip), env);
    assert.equal(blocked.status, 429);
    assert.equal((await blocked.json()).error, "rate_limited");
    const retryAfter = Number(blocked.headers.get("Retry-After"));
    assert.ok(Number.isInteger(retryAfter) && retryAfter >= 1 && retryAfter <= 600);
  } finally {
    database.close();
  }
});
