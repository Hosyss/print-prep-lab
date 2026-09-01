const encoder = new TextEncoder();
const decoder = new TextDecoder();
const accessKeyCache = new Map();

export const SECURITY_HEADERS = Object.freeze({
  "Cache-Control": "no-store, max-age=0",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; manifest-src 'self'; media-src 'none'; worker-src 'none'",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), publickey-credentials-create=(), publickey-credentials-get=(), screen-wake-lock=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Permitted-Cross-Domain-Policies": "none",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
});

const MAX_BODY_BYTES = 64 * 1024;
const MAX_AUDIT_ROWS = 100;
const MAX_BACKUP_ROWS = 50;
const PUBLISH_CONFIRMATION = "PUBLISH PRINT PREP LAB";
const POISON_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const ALLOWED_TOP_LEVEL = new Set([
  "brand",
  "seo",
  "site",
  "features",
  "navigation",
  "pageOverrides",
  "toolVisibility",
]);

const DEFAULT_CONFIG = Object.freeze({
  brand: {
    name: "Print Prep Lab",
    defaultLocale: "en",
    secondaryLocale: "ar",
  },
  seo: {
    defaultTitle: "Print Prep Lab",
    defaultDescription: "Practical print preparation tools and guidance.",
  },
  site: {
    announcement: { enabled: false, text: "" },
    maintenanceMode: false,
  },
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

function requireDistinctSecrets(env) {
  const csrf = requireSecret(env.CSRF_SECRET, "CSRF_SECRET");
  const audit = requireSecret(env.AUDIT_SECRET, "AUDIT_SECRET");
  if (timingSafeEqual(csrf, audit)) {
    throw new HttpError(503, "CSRF_SECRET and AUDIT_SECRET must be different.", "runtime_not_configured");
  }
}

function normalizeTeamDomain(value) {
  const domain = requireString(value, "CF_ACCESS_TEAM_DOMAIN").trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloudflareaccess\.com$/.test(domain)) {
    throw new HttpError(503, "CF_ACCESS_TEAM_DOMAIN is invalid.", "runtime_not_configured");
  }
  return domain;
}

function exactAdminOrigin(value) {
  const raw = requireString(value, "ADMIN_ORIGIN").trim();
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new HttpError(503, "ADMIN_ORIGIN is invalid.", "runtime_not_configured");
  }
  if (url.protocol !== "https:" || url.origin !== raw || url.pathname !== "/" || url.search || url.hash) {
    throw new HttpError(503, "ADMIN_ORIGIN must be an exact HTTPS origin without a trailing slash.", "runtime_not_configured");
  }
  return url.origin;
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

function parseCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  for (const item of cookie.split(";")) {
    const index = item.indexOf("=");
    if (index < 0) continue;
    if (item.slice(0, index).trim() === name) return item.slice(index + 1).trim();
  }
  return "";
}

function accessTokenFromRequest(request) {
  return request.headers.get("Cf-Access-Jwt-Assertion") || parseCookie(request, "CF_Authorization");
}

function base64UrlBytes(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid base64url value.");
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) output[index] = binary.charCodeAt(index);
  return output;
}

function decodeJwtPart(value) {
  return JSON.parse(decoder.decode(base64UrlBytes(value)));
}

async function accessKeys(teamDomain) {
  const cached = accessKeyCache.get(teamDomain);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.keys;

  let response;
  try {
    response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`, {
      headers: { Accept: "application/json" },
      redirect: "error",
    });
  } catch {
    throw new HttpError(503, "Access verification is temporarily unavailable.", "access_unavailable");
  }
  if (!response.ok) throw new HttpError(503, "Access verification is temporarily unavailable.", "access_unavailable");
  const body = await response.json().catch(() => null);
  const keys = Array.isArray(body?.keys) ? body.keys : [];
  if (!keys.length) throw new HttpError(503, "Access verification is temporarily unavailable.", "access_unavailable");
  accessKeyCache.set(teamDomain, { keys, expiresAt: now + 10 * 60 * 1000 });
  return keys;
}

function validateAccessClaims(payload, env, nowSeconds = Math.floor(Date.now() / 1000)) {
  const teamDomain = normalizeTeamDomain(env.CF_ACCESS_TEAM_DOMAIN);
  const expectedIssuer = `https://${teamDomain}`;
  const issuer = String(payload?.iss || "").replace(/\/$/, "");
  if (issuer !== expectedIssuer) throw new HttpError(401, "Access token issuer was rejected.", "invalid_access_token");

  const audience = Array.isArray(payload?.aud) ? payload.aud : [payload?.aud];
  if (!audience.includes(requireString(env.CF_ACCESS_AUD, "CF_ACCESS_AUD"))) {
    throw new HttpError(401, "Access token audience was rejected.", "invalid_access_token");
  }
  if (!Number.isInteger(payload?.exp) || payload.exp <= nowSeconds - 30) {
    throw new HttpError(401, "Access token has expired.", "invalid_access_token");
  }
  if (payload?.nbf !== undefined && (!Number.isInteger(payload.nbf) || payload.nbf > nowSeconds + 30)) {
    throw new HttpError(401, "Access token is not active.", "invalid_access_token");
  }
  if (payload?.iat !== undefined && (!Number.isInteger(payload.iat) || payload.iat > nowSeconds + 60)) {
    throw new HttpError(401, "Access token issue time was rejected.", "invalid_access_token");
  }
  const email = String(payload?.email || "").trim().toLowerCase();
  if (!allowedEmails(env.ADMIN_EMAILS).has(email)) {
    throw new HttpError(403, "This identity is not authorized for Print Prep Lab Admin.", "admin_not_allowed");
  }
  const subject = String(payload?.sub || "").trim();
  if (!subject) throw new HttpError(401, "Access token subject was rejected.", "invalid_access_token");
  return {
    email,
    subject,
    expiresAt: payload.exp,
    sessionId: String(payload?.identity_nonce || payload?.jti || ""),
  };
}

async function authenticate(request, env) {
  const token = accessTokenFromRequest(request);
  if (!token) throw new HttpError(401, "Cloudflare Access authentication is required.", "access_required");
  const parts = token.split(".");
  if (parts.length !== 3) throw new HttpError(401, "Access token was rejected.", "invalid_access_token");

  let header;
  let payload;
  try {
    header = decodeJwtPart(parts[0]);
    payload = decodeJwtPart(parts[1]);
  } catch {
    throw new HttpError(401, "Access token was rejected.", "invalid_access_token");
  }
  if (header?.alg !== "RS256" || typeof header?.kid !== "string" || !header.kid) {
    throw new HttpError(401, "Access token algorithm was rejected.", "invalid_access_token");
  }

  const teamDomain = normalizeTeamDomain(env.CF_ACCESS_TEAM_DOMAIN);
  const jwks = await accessKeys(teamDomain);
  const jwk = jwks.find((candidate) => candidate?.kid === header.kid && candidate?.kty === "RSA");
  if (!jwk) {
    accessKeyCache.delete(teamDomain);
    throw new HttpError(401, "Access token signing key was rejected.", "invalid_access_token");
  }

  let verified = false;
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    verified = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      base64UrlBytes(parts[2]),
      encoder.encode(`${parts[0]}.${parts[1]}`),
    );
  } catch {
    verified = false;
  }
  if (!verified) throw new HttpError(401, "Access token signature was rejected.", "invalid_access_token");
  return validateAccessClaims(payload, env);
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value) {
  return bytesToHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToHex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export function timingSafeEqual(left, right) {
  const a = String(left ?? "");
  const b = String(right ?? "");
  const length = Math.max(a.length, b.length);
  let difference = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return difference === 0;
}

async function csrfToken(auth, env) {
  const secret = requireSecret(env.CSRF_SECRET, "CSRF_SECRET");
  return hmacHex(
    secret,
    `csrf:v2:${auth.subject}:${auth.email}:${auth.expiresAt}:${auth.sessionId}`,
  );
}

function requireJsonWrite(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (!timingSafeEqual(origin, exactAdminOrigin(env.ADMIN_ORIGIN))) {
    throw new HttpError(403, "Write origin was rejected.", "origin_rejected");
  }
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (fetchSite && fetchSite !== "same-origin") {
    throw new HttpError(403, "Cross-site write was rejected.", "origin_rejected");
  }
  const contentType = request.headers.get("Content-Type") || "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new HttpError(415, "Writes must use application/json.", "unsupported_media_type");
  }
}

async function requireCsrf(request, auth, env) {
  const supplied = request.headers.get("X-CSRF-Token") || "";
  const expected = await csrfToken(auth, env);
  if (!supplied || !timingSafeEqual(supplied, expected)) {
    throw new HttpError(403, "CSRF verification failed.", "csrf_rejected");
  }
}

async function readJson(request) {
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new HttpError(413, "Request body is too large.", "body_too_large");
  }
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_BODY_BYTES) throw new HttpError(413, "Request body is too large.", "body_too_large");
  let value;
  try {
    value = JSON.parse(decoder.decode(bytes));
  } catch {
    throw new HttpError(400, "Request JSON is invalid.", "invalid_json");
  }
  if (!isPlainObject(value)) throw new HttpError(400, "Request JSON must be an object.", "invalid_json");
  return value;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function rejectPoisonKeys(value, path = "config", depth = 0) {
  if (depth > 12) throw new TypeError(`${path} is nested too deeply.`);
  if (Array.isArray(value)) {
    if (value.length > 500) throw new TypeError(`${path} contains too many items.`);
    value.forEach((item, index) => rejectPoisonKeys(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, item] of Object.entries(value)) {
    if (POISON_KEYS.has(key)) throw new TypeError(`${path} contains a forbidden key.`);
    rejectPoisonKeys(item, `${path}.${key}`, depth + 1);
  }
}

function rejectUnknownKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new TypeError(`Unsupported ${label} field: ${key}`);
  }
}

function requiredObject(value, label) {
  if (!isPlainObject(value)) throw new TypeError(`${label} must be an object.`);
  return value;
}

function requiredBoolean(value, label) {
  if (typeof value !== "boolean") throw new TypeError(`${label} must be a boolean.`);
  return value;
}

function plainText(value, label, maximum, { allowEmpty = true } = {}) {
  if (typeof value !== "string") throw new TypeError(`${label} must be text.`);
  const text = value.trim();
  if (!allowEmpty && !text) throw new TypeError(`${label} is required.`);
  if (text.length > maximum) throw new TypeError(`${label} is too long.`);
  if (/[<>]/.test(text) || /(?:java|vb)script\s*:|data\s*:\s*text\/html/i.test(text)) {
    throw new TypeError(`${label} contains executable or HTML-like content.`);
  }
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) {
    throw new TypeError(`${label} contains control characters.`);
  }
  return text;
}

function routeValue(value, label, { allowHash = false } = {}) {
  const route = plainText(value, label, 240, { allowEmpty: false });
  const pattern = allowHash
    ? /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?(?:#[a-z0-9_-]+)?$/
    : /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/;
  if (!pattern.test(route) || route.includes("..") || route.includes("//")) throw new TypeError(`${label} is unsafe.`);
  return route;
}

function localeValue(value, label) {
  const locale = plainText(value, label, 12, { allowEmpty: false });
  if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(locale)) throw new TypeError(`${label} is invalid.`);
  return locale;
}

function requireTopLevel(value) {
  const input = requiredObject(value, "config");
  for (const key of Object.keys(input)) {
    if (!ALLOWED_TOP_LEVEL.has(key)) throw new TypeError(`Unsupported top-level field: ${key}`);
  }
  for (const key of ALLOWED_TOP_LEVEL) {
    if (!(key in input)) throw new TypeError(`Missing top-level field: ${key}`);
  }
  return input;
}

function validateBrand(value) {
  const input = requiredObject(value, "brand");
  rejectUnknownKeys(input, new Set(["name", "defaultLocale", "secondaryLocale"]), "brand");
  const name = plainText(input.name, "brand.name", 100, { allowEmpty: false });
  if (name !== "Print Prep Lab") throw new HttpError(400, "The protected site name cannot be changed.", "invalid_config");
  return {
    name,
    defaultLocale: localeValue(input.defaultLocale, "brand.defaultLocale"),
    secondaryLocale: localeValue(input.secondaryLocale, "brand.secondaryLocale"),
  };
}

function validateSeo(value) {
  const input = requiredObject(value, "seo");
  rejectUnknownKeys(input, new Set(["defaultTitle", "defaultDescription"]), "SEO");
  return {
    defaultTitle: plainText(input.defaultTitle, "seo.defaultTitle", 180, { allowEmpty: false }),
    defaultDescription: plainText(input.defaultDescription, "seo.defaultDescription", 500, { allowEmpty: false }),
  };
}

function validateSite(value) {
  const input = requiredObject(value, "site");
  rejectUnknownKeys(input, new Set(["announcement", "maintenanceMode"]), "site");
  const announcement = requiredObject(input.announcement, "site.announcement");
  rejectUnknownKeys(announcement, new Set(["enabled", "text"]), "announcement");
  return {
    announcement: {
      enabled: requiredBoolean(announcement.enabled, "site.announcement.enabled"),
      text: plainText(announcement.text, "site.announcement.text", 500),
    },
    maintenanceMode: requiredBoolean(input.maintenanceMode, "site.maintenanceMode"),
  };
}

function validateFeatures(value) {
  const input = requiredObject(value, "features");
  const keys = Object.keys(input);
  if (keys.length > 100) throw new TypeError("features contains too many entries.");
  const result = {};
  for (const key of keys.sort()) {
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(key)) throw new TypeError(`Feature key is invalid: ${key}`);
    result[key] = requiredBoolean(input[key], `features.${key}`);
  }
  return result;
}

function validateNavigation(value) {
  if (!Array.isArray(value) || value.length > 100) throw new TypeError("navigation must be an array with at most 100 entries.");
  const ids = new Set();
  return value.map((entry, index) => {
    const input = requiredObject(entry, `navigation[${index}]`);
    rejectUnknownKeys(input, new Set(["id", "label", "labelAr", "href", "enabled"]), "navigation");
    const id = plainText(input.id, `navigation[${index}].id`, 64, { allowEmpty: false });
    if (!/^[a-z][a-z0-9_-]*$/.test(id)) throw new TypeError(`navigation[${index}].id is invalid.`);
    if (ids.has(id)) throw new TypeError(`Duplicate navigation id: ${id}`);
    ids.add(id);
    return {
      id,
      label: plainText(input.label, `navigation[${index}].label`, 100, { allowEmpty: false }),
      labelAr: plainText(input.labelAr, `navigation[${index}].labelAr`, 100),
      href: routeValue(input.href, `navigation[${index}].href`, { allowHash: true }),
      enabled: requiredBoolean(input.enabled, `navigation[${index}].enabled`),
    };
  });
}

function optionalText(input, key, label, maximum) {
  return key in input ? plainText(input[key], label, maximum) : undefined;
}

function compactDefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function validateSections(value, route) {
  if (!Array.isArray(value) || value.length > 30) throw new TypeError(`${route}.sections must be an array with at most 30 entries.`);
  const ids = new Set();
  return value.map((entry, index) => {
    const input = requiredObject(entry, `${route}.sections[${index}]`);
    rejectUnknownKeys(input, new Set(["id", "heading", "headingAr", "body", "bodyAr", "enabled"]), "section");
    const id = plainText(input.id, `${route}.sections[${index}].id`, 64, { allowEmpty: false });
    if (!/^[a-z][a-z0-9_-]*$/.test(id)) throw new TypeError(`${route}.sections[${index}].id is invalid.`);
    if (ids.has(id)) throw new TypeError(`Duplicate section id on ${route}: ${id}`);
    ids.add(id);
    return compactDefined({
      id,
      heading: optionalText(input, "heading", `${route}.sections[${index}].heading`, 180),
      headingAr: optionalText(input, "headingAr", `${route}.sections[${index}].headingAr`, 180),
      body: optionalText(input, "body", `${route}.sections[${index}].body`, 4000),
      bodyAr: optionalText(input, "bodyAr", `${route}.sections[${index}].bodyAr`, 4000),
      enabled: requiredBoolean(input.enabled, `${route}.sections[${index}].enabled`),
    });
  });
}

function validatePageOverrides(value) {
  const input = requiredObject(value, "pageOverrides");
  const routes = Object.keys(input);
  if (routes.length > 200) throw new TypeError("pageOverrides contains too many routes.");
  const result = {};
  for (const rawRoute of routes.sort()) {
    const route = routeValue(rawRoute, "page override route");
    const override = requiredObject(input[rawRoute], `pageOverrides.${route}`);
    rejectUnknownKeys(
      override,
      new Set(["title", "titleAr", "description", "descriptionAr", "h1", "h1Ar", "intro", "introAr", "enabled", "sections"]),
      "override",
    );
    result[route] = compactDefined({
      title: optionalText(override, "title", `${route}.title`, 180),
      titleAr: optionalText(override, "titleAr", `${route}.titleAr`, 180),
      description: optionalText(override, "description", `${route}.description`, 500),
      descriptionAr: optionalText(override, "descriptionAr", `${route}.descriptionAr`, 500),
      h1: optionalText(override, "h1", `${route}.h1`, 240),
      h1Ar: optionalText(override, "h1Ar", `${route}.h1Ar`, 240),
      intro: optionalText(override, "intro", `${route}.intro`, 2000),
      introAr: optionalText(override, "introAr", `${route}.introAr`, 2000),
      enabled: requiredBoolean(override.enabled, `${route}.enabled`),
      sections: validateSections(override.sections, route),
    });
  }
  return result;
}

function validateToolVisibility(value) {
  const input = requiredObject(value, "toolVisibility");
  const routes = Object.keys(input);
  if (routes.length > 200) throw new TypeError("toolVisibility contains too many routes.");
  const result = {};
  for (const rawRoute of routes.sort()) {
    const route = routeValue(rawRoute, "tool visibility route");
    const settings = requiredObject(input[rawRoute], `toolVisibility.${route}`);
    rejectUnknownKeys(settings, new Set(["enabled", "navVisible", "searchVisible"]), "tool visibility");
    result[route] = {
      enabled: requiredBoolean(settings.enabled, `${route}.enabled`),
      navVisible: requiredBoolean(settings.navVisible, `${route}.navVisible`),
      searchVisible: requiredBoolean(settings.searchVisible, `${route}.searchVisible`),
    };
  }
  return result;
}

export function validateConfig(value) {
  rejectPoisonKeys(value);
  const input = requireTopLevel(value);
  return {
    brand: validateBrand(input.brand),
    seo: validateSeo(input.seo),
    site: validateSite(input.site),
    features: validateFeatures(input.features),
    navigation: validateNavigation(input.navigation),
    pageOverrides: validatePageOverrides(input.pageOverrides),
    toolVisibility: validateToolVisibility(input.toolVisibility),
  };
}

function canonicalStringify(value) {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalStringify(item)).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function cloneDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

async function currentConfig(env) {
  const row = await env.DB.prepare(
    "SELECT revision, payload, checksum, updated_by, updated_at FROM configs WHERE id = 'draft'",
  ).first();
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
  if (!timingSafeEqual(checksum, row.checksum)) {
    throw new HttpError(500, "Stored configuration integrity check failed.", "storage_integrity_error");
  }
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
  const previous = await env.DB.prepare(
    "SELECT entry_hash FROM audit_log ORDER BY occurred_at DESC, id DESC LIMIT 1",
  ).first();
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
  const entryHash = await hmacHex(
    requireSecret(env.AUDIT_SECRET, "AUDIT_SECRET"),
    `${previousHash}.${canonicalStringify(record)}`,
  );
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

async function saveConfig(env, auth, requestId, body) {
  const expectedRevision = integerRevision(body.expectedRevision);
  let config;
  try {
    config = validateConfig(body.config);
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : "Configuration was rejected.", "invalid_config");
  }
  const current = await currentConfig(env);
  if (current.revision !== expectedRevision) {
    throw new HttpError(409, "The draft changed in another session. Reload before saving.", "revision_conflict");
  }

  const payload = canonicalStringify(config);
  const checksum = await sha256Hex(payload);
  const revision = expectedRevision + 1;
  const now = new Date().toISOString();
  const backupId = crypto.randomUUID();
  const currentPayload = canonicalStringify(current.config);
  const audit = await auditRecord(env, auth, requestId, "config.update", "draft", {
    fromRevision: current.revision,
    toRevision: revision,
    checksum,
  });

  const results = await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO backups (id, kind, revision, payload, checksum, created_by, created_at) VALUES (?, 'update', ?, ?, ?, ?, ?)",
    ).bind(backupId, current.revision, currentPayload, current.checksum, auth.email, now),
    env.DB.prepare(
      "INSERT INTO configs (id, revision, payload, checksum, updated_by, updated_at) VALUES ('draft', ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET revision = excluded.revision, payload = excluded.payload, checksum = excluded.checksum, updated_by = excluded.updated_by, updated_at = excluded.updated_at WHERE configs.revision = ?",
    ).bind(revision, payload, checksum, auth.email, now, expectedRevision),
    auditStatement(env, audit),
  ]);
  if (databaseChanges(results[1]) !== 1) {
    throw new HttpError(409, "The draft changed in another session. Reload before saving.", "revision_conflict");
  }
  return { revision, config, checksum, updatedBy: auth.email, updatedAt: now };
}

async function listBackups(env) {
  const rows = await env.DB.prepare(
    "SELECT id, kind, revision, checksum, created_by, created_at FROM backups ORDER BY created_at DESC LIMIT ?",
  ).bind(MAX_BACKUP_ROWS).all();
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
  if (current.revision !== expectedRevision) {
    throw new HttpError(409, "The draft changed in another session. Reload before restoring.", "revision_conflict");
  }
  const backup = await env.DB.prepare(
    "SELECT id, revision, payload, checksum FROM backups WHERE id = ?",
  ).bind(backupId).first();
  if (!backup) throw new HttpError(404, "Backup was not found.", "not_found");
  const computed = await sha256Hex(String(backup.payload));
  if (!timingSafeEqual(computed, backup.checksum)) {
    throw new HttpError(409, "Backup integrity verification failed.", "storage_integrity_error");
  }

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
  const safetyBackupId = crypto.randomUUID();
  const audit = await auditRecord(env, auth, requestId, "config.restore", `backup:${backupId}`, {
    fromRevision: current.revision,
    backupRevision: Number(backup.revision),
    toRevision: revision,
    checksum,
  });
  const results = await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO backups (id, kind, revision, payload, checksum, created_by, created_at) VALUES (?, 'restore', ?, ?, ?, ?, ?)",
    ).bind(safetyBackupId, current.revision, canonicalStringify(current.config), current.checksum, auth.email, now),
    env.DB.prepare(
      "UPDATE configs SET revision = ?, payload = ?, checksum = ?, updated_by = ?, updated_at = ? WHERE id = 'draft' AND revision = ?",
    ).bind(revision, payload, checksum, auth.email, now, expectedRevision),
    auditStatement(env, audit),
  ]);
  if (databaseChanges(results[1]) !== 1) {
    throw new HttpError(409, "The draft changed in another session. Reload before restoring.", "revision_conflict");
  }
  return { revision, config, checksum, updatedBy: auth.email, updatedAt: now };
}

async function publishSnapshot(env, auth, requestId, body) {
  const expectedRevision = integerRevision(body.expectedRevision);
  if (!timingSafeEqual(String(body.confirmation || ""), PUBLISH_CONFIRMATION)) {
    throw new HttpError(400, "The publication confirmation phrase is incorrect.", "confirmation_required");
  }
  const current = await currentConfig(env);
  if (current.revision === 0) throw new HttpError(409, "Save a draft before publishing.", "draft_required");
  if (current.revision !== expectedRevision) {
    throw new HttpError(409, "The draft changed in another session. Reload before publishing.", "revision_conflict");
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const payload = canonicalStringify(current.config);
  const audit = await auditRecord(env, auth, requestId, "snapshot.publish", `snapshot:${id}`, {
    revision: current.revision,
    checksum: current.checksum,
    publicIntegration: false,
  });
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO published_snapshots (id, revision, payload, checksum, published_by, published_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(id, current.revision, payload, current.checksum, auth.email, now),
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
  const rows = await env.DB.prepare(
    "SELECT id, occurred_at, actor, action, resource, request_id, metadata, previous_hash, entry_hash FROM audit_log ORDER BY occurred_at DESC, id DESC LIMIT ?",
  ).bind(MAX_AUDIT_ROWS).all();
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

async function rateLimit(request, env, auth, write) {
  if (!env.DB?.prepare) throw new HttpError(503, "Admin database is not configured.", "runtime_not_configured");
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const identityKey = await hmacHex(
    requireSecret(env.AUDIT_SECRET, "AUDIT_SECRET"),
    `rate:v2:${auth.email}:${ip}:${write ? "write" : "read"}`,
  );
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / 60) * 60;
  const limit = write ? 30 : 180;
  await env.DB.prepare(
    "INSERT INTO rate_limits (key, window_start, count, expires_at) VALUES (?, ?, 1, ?) ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1, expires_at = excluded.expires_at",
  ).bind(identityKey, windowStart, windowStart + 180).run();
  const row = await env.DB.prepare(
    "SELECT count FROM rate_limits WHERE key = ? AND window_start = ?",
  ).bind(identityKey, windowStart).first();
  if (Number(row?.count || 0) > limit) {
    throw new HttpError(429, "Too many admin requests. Try again shortly.", "rate_limited", { "Retry-After": "60" });
  }
  if (now % 17 === 0) {
    env.DB.prepare("DELETE FROM rate_limits WHERE expires_at < ?").bind(now).run().catch(() => {});
  }
}

async function handleApi(request, env, auth, requestId, url) {
  const write = !["GET", "HEAD"].includes(request.method);
  await rateLimit(request, env, auth, write);
  if (write) {
    requireJsonWrite(request, env);
    await requireCsrf(request, auth, env);
  }

  if (url.pathname === "/api/session" && request.method === "GET") {
    return jsonResponse({
      email: auth.email,
      csrfToken: await csrfToken(auth, env),
      expiresAt: new Date(auth.expiresAt * 1000).toISOString(),
      accessVerified: true,
      mfaEnforcement: "cloudflare-access-policy",
      publicIntegration: false,
    });
  }
  if (url.pathname === "/api/health" && request.method === "GET") {
    await env.DB.prepare("SELECT 1 AS ok").first();
    return jsonResponse({ ok: true, accessVerified: true, database: "reachable", publicIntegration: false });
  }
  if (url.pathname === "/api/config" && request.method === "GET") {
    return jsonResponse(await currentConfig(env));
  }
  if (url.pathname === "/api/config" && request.method === "PUT") {
    return jsonResponse(await saveConfig(env, auth, requestId, await readJson(request)));
  }
  if (url.pathname === "/api/backups" && request.method === "GET") {
    return jsonResponse({ backups: await listBackups(env) });
  }
  const restoreMatch = url.pathname.match(/^\/api\/backups\/([0-9a-f-]{36})\/restore$/i);
  if (restoreMatch && request.method === "POST") {
    return jsonResponse(await restoreBackup(env, auth, requestId, restoreMatch[1], await readJson(request)));
  }
  if (url.pathname === "/api/publish" && request.method === "POST") {
    return jsonResponse(await publishSnapshot(env, auth, requestId, await readJson(request)), 201);
  }
  if (url.pathname === "/api/audit" && request.method === "GET") {
    return jsonResponse({ entries: await listAudit(env) });
  }
  throw new HttpError(404, "Admin endpoint was not found.", "not_found");
}

async function handleRequest(request, env, requestId) {
  if (request.method === "TRACE" || request.method === "CONNECT") {
    throw new HttpError(405, "Method is not allowed.", "method_not_allowed", { Allow: "GET, HEAD, PUT, POST" });
  }
  const url = new URL(request.url);
  if (url.protocol !== "https:" || !timingSafeEqual(url.origin, exactAdminOrigin(env.ADMIN_ORIGIN))) {
    throw new HttpError(421, "Admin hostname was rejected.", "host_rejected");
  }
  requireDistinctSecrets(env);
  const auth = await authenticate(request, env);
  if (url.pathname.startsWith("/api/")) return handleApi(request, env, auth, requestId, url);
  if (!["GET", "HEAD"].includes(request.method)) {
    throw new HttpError(405, "Method is not allowed.", "method_not_allowed", { Allow: "GET, HEAD" });
  }
  if (!env.ASSETS?.fetch) throw new HttpError(503, "Admin assets are not configured.", "runtime_not_configured");
  return env.ASSETS.fetch(request);
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
      return responseWithSecurity(
        jsonResponse({ error: code, message, requestId }, status, known ? error.headers : {}),
        requestId,
      );
    }
  },
};

export { PUBLISH_CONFIRMATION, validateAccessClaims };
