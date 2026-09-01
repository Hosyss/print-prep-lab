import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import {
  PUBLISH_CONFIRMATION,
  SECURITY_HEADERS,
  timingSafeEqual,
  validateAccessClaims,
  validateConfig,
  default as worker,
} from "../worker.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const safeConfig = {
  brand: { name: "Print Prep Lab", defaultLocale: "en", secondaryLocale: "ar" },
  seo: {
    defaultTitle: "Print Prep Lab",
    defaultDescription: "Practical print preparation tools and guidance.",
  },
  site: { announcement: { enabled: false, text: "" }, maintenanceMode: false },
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

function base64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

async function signedAccessToken(privateKey, payload, kid = "test-key") {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT", kid }));
  const body = base64Url(JSON.stringify(payload));
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(`${header}.${body}`),
  );
  return `${header}.${body}.${base64Url(signature)}`;
}

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
  constructor(schema) {
    this.database = new DatabaseSync(":memory:");
    this.database.exec(schema);
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

test("admin CSP is self-only and contains no inline/eval escape", () => {
  const csp = SECURITY_HEADERS["Content-Security-Policy"];
  assert.match(csp, /script-src 'self'/);
  assert.match(csp, /connect-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|script-src[^;]*https:/);
});

test("admin is not cacheable, indexable or frameable", () => {
  assert.match(SECURITY_HEADERS["Cache-Control"], /no-store/);
  assert.match(SECURITY_HEADERS["X-Robots-Tag"], /noindex/);
  assert.equal(SECURITY_HEADERS["X-Frame-Options"], "DENY");
  assert.equal(SECURITY_HEADERS["Referrer-Policy"], "no-referrer");
  assert.match(SECURITY_HEADERS["Strict-Transport-Security"], /includeSubDomains/);
});

test("expanded bilingual safe config validates deterministically", () => {
  assert.deepEqual(validateConfig(safeConfig), safeConfig);
});

test("HTML and executable URL payloads are rejected", () => {
  const html = structuredClone(safeConfig);
  html.site.announcement.text = "<img src=x onerror=alert(1)>";
  assert.throws(() => validateConfig(html), /HTML-like/);

  const scheme = structuredClone(safeConfig);
  scheme.seo.defaultDescription = "javascript:alert(1)";
  assert.throws(() => validateConfig(scheme), /executable/);
});

test("calculator, code and arbitrary section fields are rejected", () => {
  const calculator = structuredClone(safeConfig);
  calculator.calculators = { formula: "quantity * price" };
  assert.throws(() => validateConfig(calculator), /Unsupported top-level/);

  const script = structuredClone(safeConfig);
  script.pageOverrides["/quote-compare"].script = "alert(1)";
  assert.throws(() => validateConfig(script), /Unsupported override field/);

  const html = structuredClone(safeConfig);
  html.pageOverrides["/quote-compare"].sections[0].html = "bold";
  assert.throws(() => validateConfig(html), /Unsupported section field/);
});

test("unsafe routes, links and feature keys are rejected", () => {
  const route = structuredClone(safeConfig);
  route.pageOverrides = { "//evil.example": { title: "x", enabled: true, sections: [] } };
  assert.throws(() => validateConfig(route), /unsafe/);

  const href = structuredClone(safeConfig);
  href.navigation[0].href = "https://evil.example";
  assert.throws(() => validateConfig(href), /unsafe/);

  const feature = structuredClone(safeConfig);
  feature.features = { "Bad Key": true };
  assert.throws(() => validateConfig(feature), /Feature key/);
});

test("duplicate navigation and section identifiers are rejected", () => {
  const navigation = structuredClone(safeConfig);
  navigation.navigation.push({ ...navigation.navigation[0] });
  assert.throws(() => validateConfig(navigation), /Duplicate navigation/);

  const sections = structuredClone(safeConfig);
  sections.pageOverrides["/quote-compare"].sections.push({
    ...sections.pageOverrides["/quote-compare"].sections[0],
  });
  assert.throws(() => validateConfig(sections), /Duplicate section/);
});

test("tool visibility accepts only explicit booleans", () => {
  const config = structuredClone(safeConfig);
  config.toolVisibility["/quote-compare"].enabled = "yes";
  assert.throws(() => validateConfig(config), /boolean/);
});

test("prototype-pollution keys are rejected recursively", () => {
  const value = JSON.parse(JSON.stringify(safeConfig));
  Object.defineProperty(value.pageOverrides["/quote-compare"].sections[0], "__proto__", {
    value: "bad",
    enumerable: true,
  });
  assert.throws(() => validateConfig(value), /forbidden key/);
});

test("Access claims require exact issuer, audience, lifetime and owner email", () => {
  const now = 1_800_000_000;
  const env = {
    CF_ACCESS_TEAM_DOMAIN: "printpreplab.cloudflareaccess.com",
    CF_ACCESS_AUD: "admin-audience",
    ADMIN_EMAILS: "owner@example.com",
  };
  const claims = {
    iss: "https://printpreplab.cloudflareaccess.com",
    aud: ["admin-audience"],
    exp: now + 600,
    iat: now - 10,
    sub: "owner-subject",
    email: "OWNER@example.com",
  };
  assert.equal(validateAccessClaims(claims, env, now).email, "owner@example.com");
  assert.throws(() => validateAccessClaims({ ...claims, iss: "https://evil.example" }, env, now), /issuer/);
  assert.throws(() => validateAccessClaims({ ...claims, aud: ["wrong"] }, env, now), /audience/);
  assert.throws(() => validateAccessClaims({ ...claims, email: "other@example.com" }, env, now), /not authorized/);
  assert.throws(() => validateAccessClaims({ ...claims, exp: now - 60 }, env, now), /expired/);
});

test("Worker rejects bad host or missing Access and accepts a signed owner token", async () => {
  const keys = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", keys.publicKey);
  publicJwk.kid = "test-key";
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";

  const env = {
    CF_ACCESS_TEAM_DOMAIN: "admin-integration.cloudflareaccess.com",
    CF_ACCESS_AUD: "owner-audience",
    ADMIN_EMAILS: "owner@example.com",
    ADMIN_ORIGIN: "https://admin.example.com",
    CSRF_SECRET: "c".repeat(40),
    AUDIT_SECRET: "a".repeat(40),
    ASSETS: { fetch: async () => new Response("admin", { status: 200, headers: { "Content-Type": "text/plain" } }) },
  };

  const wrongHost = await worker.fetch(new Request("https://wrong.example.com/"), env);
  assert.equal(wrongHost.status, 421);
  assert.match(wrongHost.headers.get("Cache-Control"), /no-store/);

  const missing = await worker.fetch(new Request("https://admin.example.com/"), env);
  assert.equal(missing.status, 401);

  const now = Math.floor(Date.now() / 1000);
  const token = await signedAccessToken(keys.privateKey, {
    iss: "https://admin-integration.cloudflareaccess.com",
    aud: ["owner-audience"],
    exp: now + 600,
    iat: now - 5,
    sub: "owner-subject",
    email: "owner@example.com",
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.equal(String(input), "https://admin-integration.cloudflareaccess.com/cdn-cgi/access/certs");
    return Response.json({ keys: [publicJwk] });
  };
  try {
    const authorized = await worker.fetch(new Request("https://admin.example.com/", {
      headers: { "Cf-Access-Jwt-Assertion": token },
    }), env);
    assert.equal(authorized.status, 200);
    assert.equal(await authorized.text(), "admin");
    assert.match(authorized.headers.get("Content-Security-Policy"), /script-src 'self'/);

    const tamperIndex = token.lastIndexOf(".") + 8;
    const tampered = `${token.slice(0, tamperIndex)}${token[tamperIndex] === "A" ? "B" : "A"}${token.slice(tamperIndex + 1)}`;
    const rejected = await worker.fetch(new Request("https://admin.example.com/", {
      headers: { "Cf-Access-Jwt-Assertion": tampered },
    }), env);
    assert.equal(rejected.status, 401);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("authenticated API enforces CSRF/origin and records backup, snapshot and audit", async () => {
  const keys = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", keys.publicKey);
  publicJwk.kid = "api-key";
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";
  const now = Math.floor(Date.now() / 1000);
  const token = await signedAccessToken(keys.privateKey, {
    iss: "https://admin-api.cloudflareaccess.com",
    aud: ["api-audience"],
    exp: now + 600,
    iat: now - 5,
    sub: "owner-subject",
    identity_nonce: "session-one",
    email: "owner@example.com",
  }, "api-key");
  const database = new TestD1(fs.readFileSync(path.join(root, "schema.sql"), "utf8"));
  const env = {
    CF_ACCESS_TEAM_DOMAIN: "admin-api.cloudflareaccess.com",
    CF_ACCESS_AUD: "api-audience",
    ADMIN_EMAILS: "owner@example.com",
    ADMIN_ORIGIN: "https://admin.example.com",
    CSRF_SECRET: "c".repeat(40),
    AUDIT_SECRET: "a".repeat(40),
    DB: database,
    ASSETS: { fetch: async () => new Response("admin") },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.equal(String(input), "https://admin-api.cloudflareaccess.com/cdn-cgi/access/certs");
    return Response.json({ keys: [publicJwk] });
  };
  const request = (pathname, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set("Cf-Access-Jwt-Assertion", token);
    return worker.fetch(new Request(`https://admin.example.com${pathname}`, { ...options, headers }), env);
  };
  try {
    const sessionResponse = await request("/api/session");
    assert.equal(sessionResponse.status, 200);
    const session = await sessionResponse.json();
    assert.equal(session.email, "owner@example.com");
    assert.equal(session.publicIntegration, false);
    assert.match(session.csrfToken, /^[0-9a-f]{64}$/);

    const initialResponse = await request("/api/config");
    assert.equal(initialResponse.status, 200);
    const initial = await initialResponse.json();
    assert.equal(initial.revision, 0);

    const missingCsrf = await request("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Origin: "https://admin.example.com" },
      body: JSON.stringify({ expectedRevision: 0, config: safeConfig }),
    });
    assert.equal(missingCsrf.status, 403);

    const wrongOrigin = await request("/api/config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://evil.example",
        "X-CSRF-Token": session.csrfToken,
      },
      body: JSON.stringify({ expectedRevision: 0, config: safeConfig }),
    });
    assert.equal(wrongOrigin.status, 403);

    const oversized = await request("/api/config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://admin.example.com",
        "X-CSRF-Token": session.csrfToken,
      },
      body: JSON.stringify({ padding: "x".repeat(70 * 1024) }),
    });
    assert.equal(oversized.status, 413);

    const saveResponse = await request("/api/config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://admin.example.com",
        "Sec-Fetch-Site": "same-origin",
        "X-CSRF-Token": session.csrfToken,
      },
      body: JSON.stringify({ expectedRevision: 0, config: safeConfig }),
    });
    assert.equal(saveResponse.status, 200);
    const saved = await saveResponse.json();
    assert.equal(saved.revision, 1);
    assert.deepEqual(saved.config, safeConfig);

    const staleResponse = await request("/api/config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://admin.example.com",
        "X-CSRF-Token": session.csrfToken,
      },
      body: JSON.stringify({ expectedRevision: 0, config: safeConfig }),
    });
    assert.equal(staleResponse.status, 409);

    const backupsResponse = await request("/api/backups");
    const backups = await backupsResponse.json();
    assert.equal(backups.backups.length, 1);
    assert.equal(backups.backups[0].revision, 0);

    const restoreResponse = await request(`/api/backups/${backups.backups[0].id}/restore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://admin.example.com",
        "Sec-Fetch-Site": "same-origin",
        "X-CSRF-Token": session.csrfToken,
      },
      body: JSON.stringify({ expectedRevision: 1 }),
    });
    assert.equal(restoreResponse.status, 200);
    const restored = await restoreResponse.json();
    assert.equal(restored.revision, 2);
    assert.equal(restored.config.brand.name, "Print Prep Lab");

    const backupsAfterRestore = await (await request("/api/backups")).json();
    assert.equal(backupsAfterRestore.backups.length, 2);

    const publishResponse = await request("/api/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://admin.example.com",
        "Sec-Fetch-Site": "same-origin",
        "X-CSRF-Token": session.csrfToken,
      },
      body: JSON.stringify({ expectedRevision: 2, confirmation: PUBLISH_CONFIRMATION }),
    });
    assert.equal(publishResponse.status, 201);
    const snapshot = await publishResponse.json();
    assert.equal(snapshot.revision, 2);
    assert.equal(snapshot.publicIntegration, false);

    const auditResponse = await request("/api/audit");
    const audit = await auditResponse.json();
    assert.deepEqual(audit.entries.map((entry) => entry.action).sort(), ["config.restore", "config.update", "snapshot.publish"]);
    assert.ok(audit.entries.every((entry) => /^[0-9a-f]{64}$/.test(entry.entryHash)));
    const rateKeys = database.database.prepare("SELECT key FROM rate_limits").all();
    assert.ok(rateKeys.length > 0);
    assert.ok(rateKeys.every((row) => /^[0-9a-f]{64}$/.test(row.key)));
  } finally {
    globalThis.fetch = originalFetch;
    database.close();
  }
});

test("timing-safe comparison has correct behavior", () => {
  assert.equal(timingSafeEqual("abcd", "abcd"), true);
  assert.equal(timingSafeEqual("abcd", "abce"), false);
  assert.equal(timingSafeEqual("abcd", "abc"), false);
});

test("browser assets contain no inline execution or raw HTML sinks", () => {
  const html = fs.readFileSync(path.join(root, "public/index.html"), "utf8");
  const js = fs.readFileSync(path.join(root, "public/admin.js"), "utf8");
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
  assert.doesNotMatch(html, /<style\b|\son[a-z]+\s*=/i);
  assert.doesNotMatch(js, /\b(?:innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\s*\(|new\s+Function)\b/);
  assert.doesNotMatch(js, /\b(?:localStorage|sessionStorage)\b/);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("catalog covers the pinned recovery pages plus all live sitemap content", () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, "public/site-catalog.json"), "utf8"));
  assert.equal(catalog.release, "v118.7");
  assert.equal(catalog.count, 113);
  assert.equal(catalog.pages.length, 113);
  assert.equal(new Set(catalog.pages.map((page) => page.route)).size, 113);
  const recoveryPages = catalog.pages.filter((page) => page.sourceType === "recovery-html");
  const sitemapPages = catalog.pages.filter((page) => page.sourceType === "production-sitemap");
  assert.equal(recoveryPages.length, 66);
  assert.equal(sitemapPages.length, 47);
  assert.ok(recoveryPages.every((page) => page.file.endsWith(".html")));
  assert.ok(sitemapPages.every((page) => page.file === "" && page.indexedInProduction === true));
  assert.ok(catalog.pages.some((page) => page.route === "/quote-compare"));
  assert.ok(catalog.pages.some((page) => page.route === "/tools/dpi-ppi-calculator"));
  assert.ok(catalog.pages.some((page) => page.route === "/guides/print-resolution-guide"));
  assert.ok(catalog.pages.some((page) => page.route === "/sizes/a4"));
  assert.ok(!catalog.pages.some((page) => String(page.file || "").startsWith("google")));
  assert.equal(catalog.sourceProvenance.productionSitemapRoutes, 79);
  assert.equal(catalog.sourceProvenance.recoveryManagedRoutes, 66);
  assert.equal(catalog.sourceProvenance.unionManagedRoutes, 113);
  assert.deepEqual(catalog.sourceProvenance.excludedSystemHtml, ["google6d67c58ff3b5201c.html"]);
});

test("schema contains isolated storage, backups, audit and rate limits", () => {
  const sql = fs.readFileSync(path.join(root, "schema.sql"), "utf8");
  for (const table of ["configs", "backups", "published_snapshots", "audit_log", "rate_limits"]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
  assert.match(sql, /entry_hash TEXT NOT NULL UNIQUE/);
});

test("deployment config has no public workers.dev fallback or committed IDs", () => {
  const wrangler = fs.readFileSync(path.join(root, "wrangler.toml"), "utf8");
  assert.match(wrangler, /workers_dev\s*=\s*false/);
  assert.match(wrangler, /database_id\s*=\s*"REPLACE_AFTER_CREATING_D1"/);
  assert.doesNotMatch(wrangler, /CSRF_SECRET\s*=\s*"[^a]/);
  assert.equal(PUBLISH_CONFIRMATION, "PUBLISH PRINT PREP LAB");
});

test("Worker exposes no destructive audit or executable-control endpoint", () => {
  const worker = fs.readFileSync(path.join(root, "worker.js"), "utf8");
  assert.doesNotMatch(worker, /DELETE FROM audit_log|UPDATE audit_log|\/api\/(?:code|formula|secret|deploy)/i);
  assert.doesNotMatch(worker, /(?:headers\.set\(|SECURITY_HEADERS\s*=)[^\n]*Access-Control-Allow-Origin/);
  assert.match(worker, /publicIntegration:\s*false/);
});
