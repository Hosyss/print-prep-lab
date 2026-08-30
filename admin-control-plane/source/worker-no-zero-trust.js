import {
  PUBLISH_CONFIRMATION,
  SECURITY_HEADERS,
  timingSafeEqual,
  validateConfig,
} from "./worker.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SESSION_COOKIE = "__Host-ppl_admin_session";
const MAX_BODY_BYTES = 64 * 1024;
const MAX_AUDIT_ROWS = 100;
const MAX_BACKUP_ROWS = 50;
const ADMIN_SESSION_SECONDS = 30 * 60;
const SETUP_SESSION_SECONDS = 10 * 60;
const LOGIN_WINDOW_SECONDS = 10 * 60;
const LOGIN_ATTEMPT_LIMIT = 5;

const DEFAULT_CONFIG = Object.freeze({
  brand: { name: "Print Prep Lab", defaultLocale: "en", secondaryLocale: "ar" },
  seo: {
    defaultTitle: "Print Prep Lab",
    defaultDescription: "Practical print preparation tools and guidance.",
  },
  site: { announcement: { enabled: false, text: "" }, maintenanceMode: false },
  features: { job_companion: true },
  navigation: [],
  pageOverrides: {},
  toolVisibility: {},
});

class HttpError extends Error {
  constructor(status, message, code = "request_rejected", headers = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

function responseWithSecurity(response, requestId) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  headers.set("X-Request-Id", requestId);
  headers.delete("Access-Control-Allow-Origin");
  headers.delete("Access-Control-Allow-Credentials");
  headers.delete("Server");
  headers.delete("X-Powered-By");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

function requireString(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(503, `Missing protected runtime value: ${name}.`, "runtime_not_configured");
  }
  return value;
}

function requireSecret(value, name) {
  const secret = requireString(value, name);
  if (encoder.encode(secret).byteLength < 32) {
    throw new HttpError(503, `${name} does not meet the minimum length.`, "runtime_not_configured");
  }
  return secret;
}

function requirePassword(value) {
  const password = requireString(value, "ADMIN_PASSWORD");
  if (password.length < 20 || password.length > 256) {
    throw new HttpError(503, "ADMIN_PASSWORD must be between 20 and 256 characters.", "runtime_not_configured");
  }
  return password;
}

function requireRuntimeSecrets(env) {
  const csrf = requireSecret(env.CSRF_SECRET, "CSRF_SECRET");
  const audit = requireSecret(env.AUDIT_SECRET, "AUDIT_SECRET");
  const session = requireSecret(env.SESSION_SECRET, "SESSION_SECRET");
  const password = requirePassword(env.ADMIN_PASSWORD);
  const values = [csrf, audit, session, password];
  for (let left = 0; left < values.length; left += 1) {
    for (let right = left + 1; right < values.length; right += 1) {
      if (timingSafeEqual(values[left], values[right])) {
        throw new HttpError(503, "Protected runtime secrets must be distinct.", "runtime_not_configured");
      }
    }
  }
}

function allowedEmails(value) {
  const emails = requireString(value, "ADMIN_EMAILS")
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!emails.length || emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new HttpError(503, "ADMIN_EMAILS is invalid.", "runtime_not_configured");
  }
  return new Set(emails);
}

function adminOrigin(request, env) {
  const url = new URL(request.url);
  if (url.protocol !== "https:") throw new HttpError(421, "Admin hostname was rejected.", "host_rejected");
  const configured = String(env.ADMIN_ORIGIN || "").trim();
  if (configured) {
    let expected;
    try {
      expected = new URL(configured);
    } catch {
      throw new HttpError(503, "ADMIN_ORIGIN is invalid.", "runtime_not_configured");
    }
    if (expected.protocol !== "https:" || expected.origin !== configured || expected.pathname !== "/" || expected.search || expected.hash) {
      throw new HttpError(503, "ADMIN_ORIGIN must be an exact HTTPS origin without a trailing slash.", "runtime_not_configured");
    }
    if (!timingSafeEqual(url.origin, expected.origin)) throw new HttpError(421, "Admin hostname was rejected.", "host_rejected");
    return expected.origin;
  }
  if (!/^print-prep-lab-admin\.[a-z0-9-]+\.workers\.dev$/i.test(url.hostname)) {
    throw new HttpError(421, "Admin hostname was rejected.", "host_rejected");
  }
  return url.origin;
}

function parseCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  for (const item of cookie.split(";")) {
    const index = item.indexOf("=");
    if (index < 0) continue;
    if (item.slice(0, index).trim() === name) return item.slice(index + 1).trim();
  }
  return "";
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid base64url value.");
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) output[index] = binary.charCodeAt(index);
  return output;
}

async function sha256Hex(value) {
  return bytesToHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function hmacHex(secret, value, hash = "SHA-256") {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash },
    false,
    ["sign"],
  );
  return bytesToHex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

async function signSession(email, purpose, env, nowSeconds = Math.floor(Date.now() / 1000)) {
  const ttl = purpose === "totp-setup" ? SETUP_SESSION_SECONDS : ADMIN_SESSION_SECONDS;
  const payload = {
    v: 1,
    email,
    purpose,
    iat: nowSeconds,
    exp: nowSeconds + ttl,
    jti: crypto.randomUUID(),
  };
  const encoded = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await hmacHex(requireSecret(env.SESSION_SECRET, "SESSION_SECRET"), `session:v1:${encoded}`);
  return `${encoded}.${signature}`;
}

async function verifySessionToken(token, env, expectedPurpose, nowSeconds = Math.floor(Date.now() / 1000)) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2 || !/^[0-9a-f]{64}$/.test(parts[1])) {
    throw new HttpError(401, "Admin session is required.", "session_required");
  }
  const expected = await hmacHex(requireSecret(env.SESSION_SECRET, "SESSION_SECRET"), `session:v1:${parts[0]}`);
  if (!timingSafeEqual(parts[1], expected)) throw new HttpError(401, "Admin session was rejected.", "invalid_session");
  let payload;
  try {
    payload = JSON.parse(decoder.decode(base64UrlToBytes(parts[0])));
  } catch {
    throw new HttpError(401, "Admin session was rejected.", "invalid_session");
  }
  if (payload?.v !== 1 || payload?.purpose !== expectedPurpose || !Number.isInteger(payload?.iat) || !Number.isInteger(payload?.exp)) {
    throw new HttpError(401, "Admin session was rejected.", "invalid_session");
  }
  if (payload.iat > nowSeconds + 30 || payload.exp <= nowSeconds || payload.exp - payload.iat > ADMIN_SESSION_SECONDS + 30) {
    throw new HttpError(401, "Admin session expired.", "invalid_session");
  }
  const email = String(payload.email || "").trim().toLowerCase();
  if (!allowedEmails(env.ADMIN_EMAILS).has(email) || !/^[0-9a-f-]{36}$/i.test(String(payload.jti || ""))) {
    throw new HttpError(401, "Admin session was rejected.", "invalid_session");
  }
  return { email, purpose: payload.purpose, issuedAt: payload.iat, expiresAt: payload.exp, sessionId: payload.jti };
}

async function authenticate(request, env, purpose = "admin") {
  return verifySessionToken(parseCookie(request, SESSION_COOKIE), env, purpose);
}

function sessionCookie(token, maxAge) {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Strict; Priority=High`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict; Priority=High`;
}

function base32Encode(bytes) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = String(value || "").toUpperCase().replace(/[\s=-]/g, "");
  if (normalized.length < 16 || !/^[A-Z2-7]+$/.test(normalized)) throw new Error("Invalid TOTP secret.");
  let bits = 0;
  let buffer = 0;
  const output = [];
  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

async function totpCode(secret, step) {
  const key = await crypto.subtle.importKey(
    "raw",
    base32Decode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const counter = new ArrayBuffer(8);
  new DataView(counter).setBigUint64(0, BigInt(step), false);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, counter));
  const offset = digest[digest.length - 1] & 15;
  const number = ((digest[offset] & 127) << 24)
    | (digest[offset + 1] << 16)
    | (digest[offset + 2] << 8)
    | digest[offset + 3];
  return String(number % 1_000_000).padStart(6, "0");
}

async function verifyTotp(secret, code, nowMs = Date.now()) {
  if (!/^\d{6}$/.test(String(code || ""))) return false;
  const step = Math.floor(nowMs / 30_000);
  for (const delta of [-1, 0, 1]) {
    if (timingSafeEqual(await totpCode(secret, step + delta), String(code))) return true;
  }
  return false;
}

async function aesKey(env) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(requireSecret(env.SESSION_SECRET, "SESSION_SECRET")));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptTotpSecret(secret, env) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(env), encoder.encode(secret));
  return { ciphertext: bytesToBase64Url(encrypted), iv: bytesToBase64Url(iv) };
}

async function decryptTotpSecret(row, env) {
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlToBytes(row.iv) },
      await aesKey(env),
      base64UrlToBytes(row.ciphertext),
    );
    return decoder.decode(decrypted);
  } catch {
    throw new HttpError(500, "TOTP storage integrity verification failed.", "storage_integrity_error");
  }
}

function canonicalStringify(value) {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalStringify(item)).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function cloneDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

async function currentConfig(env) {
  const row = await env.DB.prepare("SELECT revision, payload, checksum, updated_by, updated_at FROM configs WHERE id = 'draft'").first();
  if (!row) {
    const config = cloneDefaultConfig();
    const payload = canonicalStringify(config);
    return { revision: 0, config, checksum: await sha256Hex(payload), updatedBy: null, updatedAt: null };
  }
  let parsed;
  try {
    parsed = JSON.parse(row.payload);
  } catch {
    throw new HttpError(500, "Stored configuration is unreadable.", "storage_integrity_error");
  }
  const config = validateConfig(parsed);
  const payload = canonicalStringify(config);
  const checksum = await sha256Hex(payload);
  if (!timingSafeEqual(checksum, row.checksum)) throw new HttpError(500, "Stored configuration integrity check failed.", "storage_integrity_error");
  return {
    revision: Number(row.revision),
    config,
    checksum,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

function integerRevision(value, name = "expectedRevision") {
  if (!Number.isInteger(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
    throw new HttpError(400, `${name} must be a non-negative integer.`, "invalid_revision");
  }
  return value;
}

function databaseChanges(result) {
  return Number(result?.meta?.changes ?? result?.changes ?? 0);
}

async function auditRecord(env, auth, requestId, action, resource, metadata) {
  const previous = await env.DB.prepare("SELECT entry_hash FROM audit_log ORDER BY occurred_at DESC, id DESC LIMIT 1").first();
  const record = {
    id: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    actor: auth.email,
    action,
    resource,
    requestId,
    metadata,
  };
  const previousHash = String(previous?.entry_hash || "GENESIS");
  const entryHash = await hmacHex(requireSecret(env.AUDIT_SECRET, "AUDIT_SECRET"), `${previousHash}.${canonicalStringify(record)}`);
  return { ...record, previousHash, entryHash };
}

function auditStatement(env, record) {
  return env.DB.prepare(
    "INSERT INTO audit_log (id, occurred_at, actor, action, resource, request_id, metadata, previous_hash, entry_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(
    record.id,
    record.occurredAt,
    record.actor,
    record.action,
    record.resource,
    record.requestId,
    canonicalStringify(record.metadata),
    record.previousHash,
    record.entryHash,
  );
}

async function readJson(request) {
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw new HttpError(413, "Request body is too large.", "body_too_large");
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_BODY_BYTES) throw new HttpError(413, "Request body is too large.", "body_too_large");
  let value;
  try {
    value = JSON.parse(decoder.decode(bytes));
  } catch {
    throw new HttpError(400, "Request JSON is invalid.", "invalid_json");
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "Request JSON must be an object.", "invalid_json");
  return value;
}

function requireJsonWrite(request, origin) {
  const suppliedOrigin = request.headers.get("Origin") || "";
  if (!timingSafeEqual(suppliedOrigin, origin)) throw new HttpError(403, "Write origin was rejected.", "origin_rejected");
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (fetchSite && fetchSite !== "same-origin") throw new HttpError(403, "Cross-site write was rejected.", "origin_rejected");
  const contentType = request.headers.get("Content-Type") || "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) throw new HttpError(415, "Writes must use application/json.", "unsupported_media_type");
}

async function csrfToken(auth, env) {
  return hmacHex(requireSecret(env.CSRF_SECRET, "CSRF_SECRET"), `csrf:v3:${auth.sessionId}:${auth.email}:${auth.expiresAt}`);
}

async function requireCsrf(request, auth, env) {
  const supplied = request.headers.get("X-CSRF-Token") || "";
  const expected = await csrfToken(auth, env);
  if (!supplied || !timingSafeEqual(supplied, expected)) throw new HttpError(403, "CSRF verification failed.", "csrf_rejected");
}

async function loginRateLimit(request, env) {
  if (!env.DB?.prepare) throw new HttpError(503, "Admin database is not configured.", "runtime_not_configured");
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = await hmacHex(requireSecret(env.AUDIT_SECRET, "AUDIT_SECRET"), `login:v1:${ip}`);
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / LOGIN_WINDOW_SECONDS) * LOGIN_WINDOW_SECONDS;
  await env.DB.prepare(
    "INSERT INTO rate_limits (key, window_start, count, expires_at) VALUES (?, ?, 1, ?) ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1, expires_at = excluded.expires_at",
  ).bind(key, windowStart, windowStart + LOGIN_WINDOW_SECONDS * 2).run();
  const row = await env.DB.prepare("SELECT count FROM rate_limits WHERE key = ? AND window_start = ?").bind(key, windowStart).first();
  if (Number(row?.count || 0) > LOGIN_ATTEMPT_LIMIT) {
    throw new HttpError(429, "Too many sign-in attempts. Try again later.", "rate_limited", { "Retry-After": String(LOGIN_WINDOW_SECONDS) });
  }
}

async function rateLimit(request, env, auth, write) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const identityKey = await hmacHex(requireSecret(env.AUDIT_SECRET, "AUDIT_SECRET"), `rate:v3:${auth.email}:${ip}:${write ? "write" : "read"}`);
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / 60) * 60;
  const limit = write ? 30 : 180;
  await env.DB.prepare(
    "INSERT INTO rate_limits (key, window_start, count, expires_at) VALUES (?, ?, 1, ?) ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1, expires_at = excluded.expires_at",
  ).bind(identityKey, windowStart, windowStart + 180).run();
  const row = await env.DB.prepare("SELECT count FROM rate_limits WHERE key = ? AND window_start = ?").bind(identityKey, windowStart).first();
  if (Number(row?.count || 0) > limit) throw new HttpError(429, "Too many admin requests. Try again shortly.", "rate_limited", { "Retry-After": "60" });
  if (now % 17 === 0) env.DB.prepare("DELETE FROM rate_limits WHERE expires_at < ?").bind(now).run().catch(() => {});
}

async function totpRow(env) {
  return env.DB.prepare("SELECT ciphertext, iv, created_at, verified_at FROM auth_settings WHERE id = 'totp'").first();
}

async function createTotpSetup(env) {
  const existing = await totpRow(env);
  if (existing?.verified_at) throw new HttpError(409, "TOTP is already configured.", "totp_already_configured");
  if (existing) return decryptTotpSecret(existing, env);
  const secret = base32Encode(crypto.getRandomValues(new Uint8Array(20)));
  const encrypted = await encryptTotpSecret(secret, env);
  await env.DB.prepare(
    "INSERT INTO auth_settings (id, ciphertext, iv, created_at, verified_at) VALUES ('totp', ?, ?, ?, NULL)",
  ).bind(encrypted.ciphertext, encrypted.iv, new Date().toISOString()).run();
  return secret;
}

async function handleLogin(request, env, origin, requestId) {
  requireJsonWrite(request, origin);
  await loginRateLimit(request, env);
  const body = await readJson(request);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const validIdentity = allowedEmails(env.ADMIN_EMAILS).has(email);
  const validPassword = timingSafeEqual(password, requirePassword(env.ADMIN_PASSWORD));
  if (!validIdentity || !validPassword) throw new HttpError(401, "The sign-in details were rejected.", "invalid_credentials");

  const row = await totpRow(env);
  if (row?.verified_at) {
    if (!body.totp) throw new HttpError(401, "Authenticator code is required.", "totp_required");
    if (!await verifyTotp(await decryptTotpSecret(row, env), String(body.totp))) {
      throw new HttpError(401, "The sign-in details were rejected.", "invalid_credentials");
    }
    const auth = { email };
    const audit = await auditRecord(env, auth, requestId, "auth.login", "session", { mfa: "totp" });
    await auditStatement(env, audit).run();
    const token = await signSession(email, "admin", env);
    return jsonResponse(
      { ok: true, authenticated: true, mfa: "totp" },
      200,
      { "Set-Cookie": sessionCookie(token, ADMIN_SESSION_SECONDS) },
    );
  }

  const token = await signSession(email, "totp-setup", env);
  return jsonResponse(
    { ok: true, authenticated: false, setupRequired: true },
    202,
    { "Set-Cookie": sessionCookie(token, SETUP_SESSION_SECONDS) },
  );
}

async function handleTotpSetup(request, env) {
  const auth = await authenticate(request, env, "totp-setup");
  const row = await totpRow(env);
  if (row?.verified_at) throw new HttpError(409, "TOTP is already configured.", "totp_already_configured");
  const secret = await createTotpSetup(env);
  const label = encodeURIComponent(`Print Prep Lab Admin:${auth.email}`);
  const issuer = encodeURIComponent("Print Prep Lab Admin");
  return jsonResponse({
    secret,
    account: auth.email,
    otpauthUri: `otpauth://totp/${label}?secret=${encodeURIComponent(secret)}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`,
  });
}

async function handleTotpConfirm(request, env, origin, requestId) {
  requireJsonWrite(request, origin);
  const auth = await authenticate(request, env, "totp-setup");
  const body = await readJson(request);
  const row = await totpRow(env);
  if (!row || row.verified_at) throw new HttpError(409, "TOTP setup is not available.", "totp_setup_unavailable");
  if (!await verifyTotp(await decryptTotpSecret(row, env), String(body.totp || ""))) {
    throw new HttpError(401, "Authenticator code was rejected.", "invalid_totp");
  }
  const verifiedAt = new Date().toISOString();
  await env.DB.prepare("UPDATE auth_settings SET verified_at = ? WHERE id = 'totp' AND verified_at IS NULL").bind(verifiedAt).run();
  const audit = await auditRecord(env, auth, requestId, "auth.totp.enroll", "totp", { verifiedAt });
  await auditStatement(env, audit).run();
  const token = await signSession(auth.email, "admin", env);
  return jsonResponse(
    { ok: true, authenticated: true, mfa: "totp" },
    200,
    { "Set-Cookie": sessionCookie(token, ADMIN_SESSION_SECONDS) },
  );
}

async function saveConfig(env, auth, requestId, body) {
  const expectedRevision = integerRevision(body.expectedRevision);
  let config;
  try {
    config = validateConfig(body.config);
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : "Configuration was rejected.", "invalid_config");
  }
  const current = await currentConfig(env);
  if (current.revision !== expectedRevision) throw new HttpError(409, "The draft changed in another session. Reload before saving.", "revision_conflict");
  const payload = canonicalStringify(config);
  const checksum = await sha256Hex(payload);
  const revision = expectedRevision + 1;
  const now = new Date().toISOString();
  const backupId = crypto.randomUUID();
  const audit = await auditRecord(env, auth, requestId, "config.update", "draft", { fromRevision: current.revision, toRevision: revision, checksum });
  const results = await env.DB.batch([
    env.DB.prepare("INSERT INTO backups (id, kind, revision, payload, checksum, created_by, created_at) VALUES (?, 'update', ?, ?, ?, ?, ?)")
      .bind(backupId, current.revision, canonicalStringify(current.config), current.checksum, auth.email, now),
    env.DB.prepare("INSERT INTO configs (id, revision, payload, checksum, updated_by, updated_at) VALUES ('draft', ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET revision = excluded.revision, payload = excluded.payload, checksum = excluded.checksum, updated_by = excluded.updated_by, updated_at = excluded.updated_at WHERE configs.revision = ?")
      .bind(revision, payload, checksum, auth.email, now, expectedRevision),
    auditStatement(env, audit),
  ]);
  if (databaseChanges(results[1]) !== 1) throw new HttpError(409, "The draft changed in another session. Reload before saving.", "revision_conflict");
  return { revision, config, checksum, updatedBy: auth.email, updatedAt: now };
}

async function listBackups(env) {
  const rows = await env.DB.prepare("SELECT id, kind, revision, checksum, created_by, created_at FROM backups ORDER BY created_at DESC LIMIT ?")
    .bind(MAX_BACKUP_ROWS).all();
  return (rows?.results || []).map((row) => ({
    id: row.id,
    kind: row.kind,
    revision: Number(row.revision),
    checksum: row.checksum,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));
}

async function restoreBackup(env, auth, requestId, backupId, body) {
  if (!/^[0-9a-f-]{36}$/i.test(backupId)) throw new HttpError(404, "Backup was not found.", "not_found");
  const expectedRevision = integerRevision(body.expectedRevision);
  const current = await currentConfig(env);
  if (current.revision !== expectedRevision) throw new HttpError(409, "The draft changed in another session. Reload before restoring.", "revision_conflict");
  const backup = await env.DB.prepare("SELECT id, revision, payload, checksum FROM backups WHERE id = ?").bind(backupId).first();
  if (!backup) throw new HttpError(404, "Backup was not found.", "not_found");
  if (!timingSafeEqual(await sha256Hex(String(backup.payload)), backup.checksum)) throw new HttpError(409, "Backup integrity verification failed.", "storage_integrity_error");
  let config;
  try {
    config = validateConfig(JSON.parse(backup.payload));
  } catch {
    throw new HttpError(409, "Backup configuration validation failed.", "storage_integrity_error");
  }
  const payload = canonicalStringify(config);
  const checksum = await sha256Hex(payload);
  const revision = expectedRevision + 1;
  const now = new Date().toISOString();
  const audit = await auditRecord(env, auth, requestId, "config.restore", `backup:${backupId}`, {
    fromRevision: current.revision,
    backupRevision: Number(backup.revision),
    toRevision: revision,
    checksum,
  });
  const results = await env.DB.batch([
    env.DB.prepare("INSERT INTO backups (id, kind, revision, payload, checksum, created_by, created_at) VALUES (?, 'restore', ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), current.revision, canonicalStringify(current.config), current.checksum, auth.email, now),
    env.DB.prepare("UPDATE configs SET revision = ?, payload = ?, checksum = ?, updated_by = ?, updated_at = ? WHERE id = 'draft' AND revision = ?")
      .bind(revision, payload, checksum, auth.email, now, expectedRevision),
    auditStatement(env, audit),
  ]);
  if (databaseChanges(results[1]) !== 1) throw new HttpError(409, "The draft changed in another session. Reload before restoring.", "revision_conflict");
  return { revision, config, checksum, updatedBy: auth.email, updatedAt: now };
}

async function publishSnapshot(env, auth, requestId, body) {
  const expectedRevision = integerRevision(body.expectedRevision);
  if (!timingSafeEqual(String(body.confirmation || ""), PUBLISH_CONFIRMATION)) {
    throw new HttpError(400, "The publication confirmation phrase is incorrect.", "confirmation_required");
  }
  const current = await currentConfig(env);
  if (current.revision === 0) throw new HttpError(409, "Save a draft before publishing.", "draft_required");
  if (current.revision !== expectedRevision) throw new HttpError(409, "The draft changed in another session. Reload before publishing.", "revision_conflict");
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const audit = await auditRecord(env, auth, requestId, "snapshot.publish", `snapshot:${id}`, {
    revision: current.revision,
    checksum: current.checksum,
    publicIntegration: false,
  });
  await env.DB.batch([
    env.DB.prepare("INSERT INTO published_snapshots (id, revision, payload, checksum, published_by, published_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, current.revision, canonicalStringify(current.config), current.checksum, auth.email, now),
    auditStatement(env, audit),
  ]);
  return {
    id,
    revision: current.revision,
    checksum: current.checksum,
    publishedBy: auth.email,
    publishedAt: now,
    publicIntegration: false,
  };
}

async function listAudit(env) {
  const rows = await env.DB.prepare("SELECT id, occurred_at, actor, action, resource, request_id, metadata, previous_hash, entry_hash FROM audit_log ORDER BY occurred_at DESC, id DESC LIMIT ?")
    .bind(MAX_AUDIT_ROWS).all();
  return (rows?.results || []).map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    actor: row.actor,
    action: row.action,
    resource: row.resource,
    requestId: row.request_id,
    metadata: JSON.parse(row.metadata),
    previousHash: row.previous_hash,
    entryHash: row.entry_hash,
  }));
}

async function handleApi(request, env, auth, requestId, url, origin) {
  const write = !["GET", "HEAD"].includes(request.method);
  await rateLimit(request, env, auth, write);
  if (write) {
    requireJsonWrite(request, origin);
    await requireCsrf(request, auth, env);
  }
  if (url.pathname === "/api/session" && request.method === "GET") {
    return jsonResponse({
      email: auth.email,
      csrfToken: await csrfToken(auth, env),
      expiresAt: new Date(auth.expiresAt * 1000).toISOString(),
      accessVerified: true,
      mfaEnforcement: "password-plus-totp",
      publicIntegration: false,
    });
  }
  if (url.pathname === "/api/health" && request.method === "GET") {
    await env.DB.prepare("SELECT 1 AS ok").first();
    return jsonResponse({ ok: true, accessVerified: true, database: "reachable", auth: "password-plus-totp", publicIntegration: false });
  }
  if (url.pathname === "/api/config" && request.method === "GET") return jsonResponse(await currentConfig(env));
  if (url.pathname === "/api/config" && request.method === "PUT") return jsonResponse(await saveConfig(env, auth, requestId, await readJson(request)));
  if (url.pathname === "/api/backups" && request.method === "GET") return jsonResponse({ backups: await listBackups(env) });
  const restoreMatch = url.pathname.match(/^\/api\/backups\/([0-9a-f-]{36})\/restore$/i);
  if (restoreMatch && request.method === "POST") return jsonResponse(await restoreBackup(env, auth, requestId, restoreMatch[1], await readJson(request)));
  if (url.pathname === "/api/publish" && request.method === "POST") return jsonResponse(await publishSnapshot(env, auth, requestId, await readJson(request)), 201);
  if (url.pathname === "/api/audit" && request.method === "GET") return jsonResponse({ entries: await listAudit(env) });
  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    return jsonResponse({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
  }
  throw new HttpError(404, "Admin endpoint was not found.", "not_found");
}

async function asset(env, request, pathname) {
  if (!env.ASSETS?.fetch) throw new HttpError(503, "Admin assets are not configured.", "runtime_not_configured");
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return env.ASSETS.fetch(new Request(url, request));
}

async function handleRequest(request, env, requestId) {
  if (request.method === "TRACE" || request.method === "CONNECT") {
    throw new HttpError(405, "Method is not allowed.", "method_not_allowed", { Allow: "GET, HEAD, POST, PUT" });
  }
  const origin = adminOrigin(request, env);
  requireRuntimeSecrets(env);
  if (!env.DB?.prepare) throw new HttpError(503, "Admin database is not configured.", "runtime_not_configured");
  const url = new URL(request.url);

  if (url.pathname === "/api/auth/login" && request.method === "POST") return handleLogin(request, env, origin, requestId);
  if (url.pathname === "/api/auth/totp/setup" && request.method === "GET") return handleTotpSetup(request, env);
  if (url.pathname === "/api/auth/totp/confirm" && request.method === "POST") return handleTotpConfirm(request, env, origin, requestId);

  if (["/login.html", "/login.js", "/login.css"].includes(url.pathname)) {
    if (!["GET", "HEAD"].includes(request.method)) throw new HttpError(405, "Method is not allowed.", "method_not_allowed", { Allow: "GET, HEAD" });
    return asset(env, request, url.pathname);
  }

  let auth;
  try {
    auth = await authenticate(request, env, "admin");
  } catch (error) {
    if (url.pathname === "/" && ["GET", "HEAD"].includes(request.method)) return asset(env, request, "/login.html");
    throw error;
  }

  if (url.pathname.startsWith("/api/")) return handleApi(request, env, auth, requestId, url, origin);
  if (!["GET", "HEAD"].includes(request.method)) throw new HttpError(405, "Method is not allowed.", "method_not_allowed", { Allow: "GET, HEAD" });
  if (url.pathname === "/login.html") return new Response(null, { status: 302, headers: { Location: "/" } });
  return asset(env, request, url.pathname);
}

export default {
  async fetch(request, env) {
    const requestId = crypto.randomUUID();
    try {
      return responseWithSecurity(await handleRequest(request, env, requestId), requestId);
    } catch (error) {
      const known = error instanceof HttpError;
      const status = known ? error.status : 500;
      const message = known ? error.message : "The admin request could not be completed.";
      const code = known ? error.code : "internal_error";
      if (!known) console.error("Print Prep Lab Admin request failed", { requestId, code });
      return responseWithSecurity(jsonResponse({ error: code, message, requestId }, status, known ? error.headers : {}), requestId);
    }
  },
};

export {
  SESSION_COOKIE,
  signSession,
  verifySessionToken,
  totpCode,
  verifyTotp,
};
