import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import worker, { SESSION_COOKIE, signSession } from "../worker-no-zero-trust.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

class Statement {
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
    return new Statement(this.database, sql);
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

const envBase = () => ({
  ADMIN_EMAILS: "owner@example.com",
  ADMIN_PASSWORD: "A-very-long-owner-password-2026!",
  CSRF_SECRET: "c".repeat(40),
  AUDIT_SECRET: "a".repeat(40),
  SESSION_SECRET: "s".repeat(40),
});

test("authenticated logout requires CSRF, clears the host cookie, and leaves the API unauthenticated", async () => {
  const database = new TestD1();
  const env = { ...envBase(), DB: database };
  const origin = "https://print-prep-lab-admin.test-account.workers.dev";
  try {
    const token = await signSession("owner@example.com", "admin", env);
    const cookie = `${SESSION_COOKIE}=${token}`;

    const session = await worker.fetch(new Request(`${origin}/api/session`, {
      headers: { Cookie: cookie, "CF-Connecting-IP": "203.0.113.20" },
    }), env);
    assert.equal(session.status, 200);
    const sessionBody = await session.json();
    assert.match(sessionBody.csrfToken, /^[0-9a-f]{64}$/);

    const noCsrf = await worker.fetch(new Request(`${origin}/api/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/json",
        Origin: origin,
        "Sec-Fetch-Site": "same-origin",
        "CF-Connecting-IP": "203.0.113.20",
      },
      body: "{}",
    }), env);
    assert.equal(noCsrf.status, 403);

    const logout = await worker.fetch(new Request(`${origin}/api/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/json",
        Origin: origin,
        "Sec-Fetch-Site": "same-origin",
        "CF-Connecting-IP": "203.0.113.20",
        "X-CSRF-Token": sessionBody.csrfToken,
      },
      body: "{}",
    }), env);
    assert.equal(logout.status, 200);
    const setCookie = logout.headers.get("Set-Cookie") || "";
    assert.match(setCookie, new RegExp(`^${SESSION_COOKIE}=`));
    assert.match(setCookie, /Max-Age=0/);
    assert.match(setCookie, /Secure/);
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Strict/);

    const clearedCookie = setCookie.split(";", 1)[0];
    const afterLogout = await worker.fetch(new Request(`${origin}/api/session`, {
      headers: { Cookie: clearedCookie, "CF-Connecting-IP": "203.0.113.20" },
    }), env);
    assert.equal(afterLogout.status, 401);
  } finally {
    database.close();
  }
});
