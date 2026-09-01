import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import worker, { SESSION_COOKIE, totpCode, verifyTotpStep } from "../worker-no-zero-trust.js";

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

function cookiePair(setCookie) {
  return String(setCookie || "").split(";", 1)[0];
}

function loginRequest(env, totp, ip = "203.0.113.120") {
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

test("concurrent reuse of one valid TOTP step creates exactly one Admin session and a fresh step is accepted", async () => {
  const db = new TestD1();
  const env = envFor(db);
  const realNow = Date.now;
  let nowMs = 1_800_000_000_000;
  Date.now = () => nowMs;
  try {
    const start = await loginRequest(env, null);
    assert.equal(start.status, 202);
    const setupCookie = cookiePair(start.headers.get("Set-Cookie"));
    assert.match(setupCookie, new RegExp(`^${SESSION_COOKIE}=`));

    const setup = await worker.fetch(new Request(`${origin}/api/auth/totp/setup`, {
      headers: { Cookie: setupCookie },
    }), env);
    assert.equal(setup.status, 200);
    const { secret } = await setup.json();

    const initialStep = Math.floor(nowMs / 30_000);
    const enrollmentCode = await totpCode(secret, initialStep);
    assert.equal(await verifyTotpStep(secret, enrollmentCode, nowMs), initialStep);

    const confirm = await worker.fetch(new Request(`${origin}/api/auth/totp/confirm`, {
      method: "POST",
      headers: {
        Cookie: setupCookie,
        "Content-Type": "application/json",
        Origin: origin,
        "Sec-Fetch-Site": "same-origin",
      },
      body: JSON.stringify({ totp: enrollmentCode }),
    }), env);
    assert.equal(confirm.status, 200);

    const [candidateA, candidateB] = await Promise.all([
      loginRequest(env, enrollmentCode, "203.0.113.120"),
      loginRequest(env, enrollmentCode, "203.0.113.121"),
    ]);
    const candidates = [candidateA, candidateB];
    assert.deepEqual(candidates.map((response) => response.status).sort((a, b) => a - b), [200, 401]);
    const accepted = candidates.find((response) => response.status === 200);
    const rejected = candidates.find((response) => response.status === 401);
    assert.match(accepted.headers.get("Set-Cookie"), /HttpOnly/);
    assert.equal((await rejected.json()).error, "invalid_credentials");

    assert.equal(db.database.prepare("SELECT COUNT(*) AS count FROM audit_log WHERE action = 'auth.login'").get().count, 1);
    assert.equal(db.database.prepare("SELECT COUNT(*) AS count FROM rate_limits WHERE window_start = ?").get(initialStep).count, 1);

    do {
      nowMs += 30_000;
    } while (await totpCode(secret, Math.floor(nowMs / 30_000)) === enrollmentCode);
    const freshStep = Math.floor(nowMs / 30_000);
    const freshCode = await totpCode(secret, freshStep);
    const fresh = await loginRequest(env, freshCode, "203.0.113.122");
    assert.equal(fresh.status, 200);
    assert.equal(db.database.prepare("SELECT COUNT(*) AS count FROM audit_log WHERE action = 'auth.login'").get().count, 2);
    assert.equal(db.database.prepare("SELECT COUNT(*) AS count FROM rate_limits WHERE window_start = ?").get(freshStep).count, 1);
  } finally {
    Date.now = realNow;
    db.close();
  }
});
