# Print Prep Lab Admin — security model

This package is intentionally a separate control plane. It must never be placed
under `/admin` on the public Pages origin or deployed without Cloudflare Access.

## Mandatory controls

1. Use a dedicated hostname and Worker.
2. Keep `workers_dev = false` so there is no public fallback hostname.
3. Protect the whole hostname with Cloudflare Access, deny by default, allow
   only the owner's verified email, and require MFA.
4. Bind a dedicated D1 database used only by this admin.
5. Store `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, `ADMIN_EMAILS`,
   `ADMIN_ORIGIN`, `CSRF_SECRET`, and `AUDIT_SECRET` as protected runtime
   values. The two secrets must be different and at least 32 random bytes.
6. Do not add wildcard CORS, third-party scripts, analytics, ads, fonts or chat.
7. Keep formulas, executable code, CSP, secrets, Access policies and deployment
   controls outside browser-editable data.

## Defense layers

- Cloudflare Access at the edge, followed by RS256 Access JWT validation in the
  Worker (signature, issuer, audience, lifetime and email allowlist).
- Exact HTTPS origin checks and a session-bound HMAC CSRF token on every write.
- D1-backed rate limiting keyed by an HMAC of identity and IP; raw IPs are not
  stored.
- Strict CSP with no inline script/style, no `unsafe-eval`, no framing and no
  external forms or connections.
- HSTS, `nosniff`, DENY framing, no-referrer, restrictive permissions policy,
  COOP, COEP and CORP.
- `noindex`, `nofollow`, `noarchive` and `no-store` on every response.
- JSON-only writes, a 64 KiB body limit, strict schema validation, plain-data
  rules and prototype-pollution-key rejection.
- Optimistic revisions, a server-side backup before each update/restore,
  SHA-256 backup verification and an append-only HMAC hash-chained audit log.

## Control boundary

The UI edits structured bilingual content, navigation and visibility flags. It
cannot modify JavaScript, formulas, arbitrary HTML, redirects, headers, secrets,
Access policy or deployments. A published snapshot remains isolated until a
future read-only integration is separately reviewed, tested and approved.
