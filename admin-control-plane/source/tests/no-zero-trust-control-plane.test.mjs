import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import worker, { SESSION_COOKIE, signSession } from "../worker-no-zero-trust.js";
import { PUBLISH_CONFIRMATION } from "../worker.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const safeConfig = {
  brand: { name: "Print Prep Lab", defaultLocale: "en", secondaryLocale: "ar" },
  seo: {
    defaultTitle: "Print Prep Lab Admin Integration",
    defaultDescription: "Protected structured configuration test.",
  },
  site: { announcement: { enabled: true, text: "Protected test announcement" }, maintenanceMode: false },
  features: { job_companion: true },
  navigation: [{ id: "home", label: "Home", labelAr: "الرئيسية", href: "/", enabled: true }],
  pageOverrides: {
    "/quote-compare": {
      title: "Quote Comparator",
      titleAr: "مقارنة عروض الأسعار",
      description: "Compare print quotes.",
      descriptionAr: "قارن عروض أسعار الطباعة.",
      h1: "Compare quotes",
      h1Ar: "قارن العروض",
      intro: "Decision support.",
      introAr: "دعم القرار.",
      enabled: true,
      sections: [{
        id: "how_it_works",
        heading: "How it works",
        headingAr: "كيف تعمل",
        body: "Enter comparable values and review the result.",
        bodyAr: "أدخل قيما قابلة للمقارنة ثم راجع النتيجة.",
        enabled: true,
      }],
    },
  },
  toolVisibility: { "/quote-compare": { enabled: true, navVisible: true, searchVisible: true } },
};

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

function baseEnv(database) {
  return {
    ADMIN_EMAILS: "owner@example.com",
    ADMIN_PASSWORD: "A-very-long-owner-password-2026!",
    ADMIN_ORIGIN: "https://admin.example.com",
    CSRF_SECRET: "csrf-" + "c".repeat(40),
    AUDIT_SECRET: "audit-" + "a".repeat(40),
    SESSION_SECRET: "session-" + "s".repeat(40),
    DB: database,
    ASSETS: { fetch: async () => new Response("admin") },
  };
}

function cookiePair(token) {
  return `${SESSION_COOKIE}=${token}`;
}

test("self-hosted MFA worker protects draft, backup, restore, snapshot and audit operations end to end", async () => {
  const database = new TestD1();
  const env = baseEnv(database);
  const token = await signSession("owner@example.com", "admin", env);
  const cookie = cookiePair(token);

  const request = async (pathname, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set("Cookie", cookie);
    headers.set("CF-Connecting-IP", "203.0.113.44");
    return worker.fetch(new Request(`https://admin.example.com${pathname}`, { ...options, headers }), env);
  };

  const writeHeaders = (csrf, origin = "https://admin.example.com") => ({
    "Content-Type": "application/json",
    Origin: origin,
    "Sec-Fetch-Site": "same-origin",
    "X-CSRF-Token": csrf,
  });

  try {
    const sessionResponse = await request("/api/session");
    assert.equal(sessionResponse.status, 200);
    const session = await sessionResponse.json();
    assert.equal(session.email, "owner@example.com");
    assert.equal(session.mfaEnforcement, "password-plus-totp");
    assert.equal(session.publicIntegration, true);
    assert.match(session.csrfToken, /^[0-9a-f]{64}$/);

    const initialResponse = await request("/api/config");
    assert.equal(initialResponse.status, 200);
    const initial = await initialResponse.json();
    assert.equal(initial.revision, 0);

    const missingCsrf = await request("/api/config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://admin.example.com",
        "Sec-Fetch-Site": "same-origin",
      },
      body: JSON.stringify({ expectedRevision: 0, config: safeConfig }),
    });
    assert.equal(missingCsrf.status, 403);

    const wrongOrigin = await request("/api/config", {
      method: "PUT",
      headers: writeHeaders(session.csrfToken, "https://evil.example"),
      body: JSON.stringify({ expectedRevision: 0, config: safeConfig }),
    });
    assert.equal(wrongOrigin.status, 403);

    const saveResponse = await request("/api/config", {
      method: "PUT",
      headers: writeHeaders(session.csrfToken),
      body: JSON.stringify({ expectedRevision: 0, config: safeConfig }),
    });
    assert.equal(saveResponse.status, 200);
    const saved = await saveResponse.json();
    assert.equal(saved.revision, 1);
    assert.deepEqual(saved.config, safeConfig);

    const staleResponse = await request("/api/config", {
      method: "PUT",
      headers: writeHeaders(session.csrfToken),
      body: JSON.stringify({ expectedRevision: 0, config: safeConfig }),
    });
    assert.equal(staleResponse.status, 409);

    const backupsResponse = await request("/api/backups");
    assert.equal(backupsResponse.status, 200);
    const backups = await backupsResponse.json();
    assert.equal(backups.backups.length, 1);
    assert.equal(backups.backups[0].revision, 0);

    const restoreResponse = await request(`/api/backups/${backups.backups[0].id}/restore`, {
      method: "POST",
      headers: writeHeaders(session.csrfToken),
      body: JSON.stringify({ expectedRevision: 1 }),
    });
    assert.equal(restoreResponse.status, 200);
    const restored = await restoreResponse.json();
    assert.equal(restored.revision, 2);
    assert.equal(restored.config.brand.name, "Print Prep Lab");

    const backupsAfterRestore = await (await request("/api/backups")).json();
    assert.equal(backupsAfterRestore.backups.length, 2);

    const restoreSafetyBackup = backupsAfterRestore.backups.find((backup) => backup.kind === "restore");
    assert.ok(restoreSafetyBackup);
    database.database.prepare("UPDATE backups SET payload = payload || 'tampered' WHERE id = ?").run(restoreSafetyBackup.id);
    const corruptRestore = await request(`/api/backups/${restoreSafetyBackup.id}/restore`, {
      method: "POST",
      headers: writeHeaders(session.csrfToken),
      body: JSON.stringify({ expectedRevision: 2 }),
    });
    assert.equal(corruptRestore.status, 409);
    const corruptBody = await corruptRestore.json();
    assert.equal(corruptBody.error, "storage_integrity_error");

    const wrongConfirmation = await request("/api/publish", {
      method: "POST",
      headers: writeHeaders(session.csrfToken),
      body: JSON.stringify({ expectedRevision: 2, confirmation: "PUBLISH" }),
    });
    assert.equal(wrongConfirmation.status, 400);

    const publishResponse = await request("/api/publish", {
      method: "POST",
      headers: writeHeaders(session.csrfToken),
      body: JSON.stringify({ expectedRevision: 2, confirmation: PUBLISH_CONFIRMATION }),
    });
    assert.equal(publishResponse.status, 201);
    const snapshot = await publishResponse.json();
    assert.equal(snapshot.revision, 2);
    assert.equal(snapshot.publicIntegration, true);

    const snapshotRows = database.database.prepare("SELECT revision, checksum FROM published_snapshots").all();
    assert.equal(snapshotRows.length, 1);
    assert.equal(Number(snapshotRows[0].revision), 2);
    assert.match(snapshotRows[0].checksum, /^[0-9a-f]{64}$/);

    const auditResponse = await request("/api/audit");
    assert.equal(auditResponse.status, 200);
    const audit = await auditResponse.json();
    assert.deepEqual(
      audit.entries.map((entry) => entry.action).sort(),
      ["config.restore", "config.update", "snapshot.publish"],
    );
    assert.ok(audit.entries.every((entry) => /^[0-9a-f]{64}$/.test(entry.entryHash)));

    const current = await (await request("/api/config")).json();
    assert.equal(current.revision, 2);
    assert.equal(current.config.brand.name, "Print Prep Lab");

    const rateKeys = database.database.prepare("SELECT key FROM rate_limits").all();
    assert.ok(rateKeys.length > 0);
    assert.ok(rateKeys.every((row) => /^[0-9a-f]{64}$/.test(row.key)));
  } finally {
    database.close();
  }
});
