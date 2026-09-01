import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import worker, { SESSION_COOKIE, signSession } from "../worker-no-zero-trust.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://admin.example.com";

class Statement {
  constructor(db, sql) { this.db = db; this.sql = sql; this.values = []; }
  bind(...values) { this.values = values; return this; }
  async first() { return this.db.prepare(this.sql).get(...this.values) || null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.values) }; }
  async run() { const result = this.db.prepare(this.sql).run(...this.values); return { meta: { changes: Number(result.changes) } }; }
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
    ADMIN_ORIGIN: origin,
    CSRF_SECRET: "csrf-" + "c".repeat(40),
    AUDIT_SECRET: "audit-" + "a".repeat(40),
    SESSION_SECRET: "session-" + "s".repeat(40),
    DB: db,
    ASSETS: { fetch: async () => new Response("admin") },
  };
}

async function context(db, ip = "203.0.113.90") {
  const env = envFor(db);
  const token = await signSession("owner@example.com", "admin", env);
  const cookie = `${SESSION_COOKIE}=${token}`;
  const request = async (pathname, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set("Cookie", cookie);
    headers.set("CF-Connecting-IP", ip);
    return worker.fetch(new Request(`${origin}${pathname}`, { ...options, headers }), env);
  };
  const session = await (await request("/api/session")).json();
  return { env, request, csrf: session.csrfToken };
}

function writeHeaders(csrf) {
  return {
    "Content-Type": "application/json",
    Origin: origin,
    "Sec-Fetch-Site": "same-origin",
    "X-CSRF-Token": csrf,
  };
}

test("concurrent saves with the same revision serialize so the rejected save leaves no orphan backup or audit entry", async () => {
  const db = new TestD1();
  try {
    const { request, csrf } = await context(db);
    const initial = await (await request("/api/config")).json();
    const configA = structuredClone(initial.config);
    const configB = structuredClone(initial.config);
    configA.site.announcement.text = "Concurrent A";
    configB.site.announcement.text = "Concurrent B";

    const makeSave = (config) => request("/api/config", {
      method: "PUT",
      headers: writeHeaders(csrf),
      body: JSON.stringify({ expectedRevision: 0, config }),
    });

    const [first, second] = await Promise.all([makeSave(configA), makeSave(configB)]);
    assert.deepEqual([first.status, second.status].sort((a, b) => a - b), [200, 409]);

    assert.equal(db.database.prepare("SELECT revision FROM configs WHERE id = 'draft'").get().revision, 1);
    assert.equal(db.database.prepare("SELECT COUNT(*) AS count FROM backups").get().count, 1);
    assert.equal(db.database.prepare("SELECT COUNT(*) AS count FROM audit_log").get().count, 1);

    const audit = await request("/api/audit");
    assert.equal(audit.status, 200);
    const body = await audit.json();
    assert.equal(body.integrityVerified, true);
    assert.equal(body.entries.length, 1);
    assert.equal(body.entries[0].action, "config.update");
  } finally {
    db.close();
  }
});

test("an expired write lease is safely reclaimed instead of permanently blocking Admin writes", async () => {
  const db = new TestD1();
  try {
    db.database.prepare("INSERT INTO rate_limits (key, window_start, count, expires_at) VALUES (?, 0, 12345, 0)").run("admin-write-lease-v1");
    const { request, csrf } = await context(db, "203.0.113.91");
    const initial = await (await request("/api/config")).json();
    const response = await request("/api/config", {
      method: "PUT",
      headers: writeHeaders(csrf),
      body: JSON.stringify({ expectedRevision: 0, config: initial.config }),
    });
    assert.equal(response.status, 200);
    assert.equal(db.database.prepare("SELECT COUNT(*) AS count FROM rate_limits WHERE key = ?").get("admin-write-lease-v1").count, 0);
  } finally {
    db.close();
  }
});
