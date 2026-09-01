# Print Prep Lab Admin — security model

This package is intentionally a separate control plane. It must not be placed
under `/admin` on the public Pages origin. The deployed no-Zero-Trust variant
uses self-hosted owner authentication inside the dedicated Worker and does not
depend on Cloudflare Access.

## Mandatory controls

1. Use the dedicated `print-prep-lab-admin` Worker and dedicated Admin D1.
2. Keep the Admin on its exact HTTPS origin; do not add wildcard hosts or CORS.
3. Keep Preview URLs disabled.
4. Allow only exact emails listed in `ADMIN_EMAILS`.
5. Require `ADMIN_PASSWORD` to be 20–256 characters and never reuse another
   runtime secret.
6. Require TOTP after password verification. The first successful password
   login enrolls the authenticator; later logins require password + TOTP.
7. Keep `CSRF_SECRET`, `AUDIT_SECRET` and `SESSION_SECRET` distinct and at least
   32 bytes of protected secret material.
8. Do not add third-party scripts, analytics, ads, fonts or chat to the Admin.
9. Keep formulas, executable code, CSP, secrets, authentication policy and
   deployment controls outside browser-editable data.

## Protected runtime values

- `ADMIN_EMAILS`
- `ADMIN_PASSWORD`
- `ADMIN_ORIGIN`
- `CSRF_SECRET`
- `AUDIT_SECRET`
- `SESSION_SECRET`

No secret value belongs in Git, browser storage or the public site.

## Authentication and session boundary

- Login is rate-limited to 5 attempts per 10 minutes per HMAC-keyed IP bucket.
- The Admin session is a purpose-bound, HMAC-signed token stored only in the
  `__Host-ppl_admin_session` cookie.
- The cookie uses `Secure`, `HttpOnly`, `SameSite=Strict`, `Priority=High` and
  `Path=/`; the normal Admin session lifetime is 30 minutes.
- TOTP enrollment uses a temporary 10-minute setup session.
- TOTP is standard 6-digit, 30-second time-based authentication with a narrow
  verification window.
- The raw TOTP secret is returned only during enrollment. Its stored copy is
  encrypted in the dedicated D1 with AES-GCM using a key derived from
  `SESSION_SECRET`.
- Rotating `SESSION_SECRET` invalidates existing signed sessions and prevents
  decryption of the stored TOTP secret. Treat such a rotation as a deliberate
  TOTP reset and re-enrollment event.
- Logout is POST-only, requires the authenticated CSRF boundary, and clears the
  host-only session cookie.

## Request and browser defenses

- Exact HTTPS Admin-origin checks plus a session-bound HMAC CSRF token on every
  write.
- D1-backed request/login rate limiting; raw IP addresses are not stored.
- Strict CSP with self-hosted scripts only, no inline execution, no
  `unsafe-eval`, no framing and no external form or connection targets.
- HSTS, `nosniff`, DENY framing, no-referrer, restrictive permissions policy,
  COOP/COEP/CORP and `no-store`.
- `noindex`, `nofollow`, `noarchive`, `nosnippet` and `noimageindex` on the
  Admin surface.
- JSON-only writes, a 64 KiB body limit, strict schema validation, plain-data
  rules and recursive prototype-pollution-key rejection.
- No authentication data in `localStorage` or `sessionStorage`.

## Data integrity and recovery

- Optimistic revision checks reject stale writes.
- A server-side backup is created before configuration changes and restores.
- Backups are SHA-256 integrity-checked before restore.
- Administrative writes are recorded in an append-only HMAC hash-chained audit
  log.
- Protected publish creates an immutable Admin-D1 snapshot only.
- The browser cannot edit JavaScript, formulas, arbitrary HTML, redirects,
  headers, secrets, authentication policy or deployments.

## Public-site boundary

`publicIntegration` is `true`. The public site reads only the latest checksum-verified
published snapshot through `/api/public-config`; it cannot write to Admin. The catalog covers 113 live
and recovery-backed routes, but Admin snapshots do not change Print Prep Lab.
Any future public integration must be read-only from the public site's point of
view, separately reviewed, tested, and explicitly approved before activation.
