# Cloudflare deployment gate

Do not connect this control plane to the public site during this release.

## Isolated resources

- Worker: `print-prep-lab-admin`
- D1: `print-prep-lab-admin`
- D1 binding: `DB`
- Assets binding: `ASSETS`
- Current Admin origin: `https://print-prep-lab-admin.buildtools.workers.dev`
- Preview URLs: disabled
- Cloudflare Zero Trust / Access: not used

`buildtools` is the account Workers subdomain. The Admin Worker is still a
separate resource from the public Print Prep Lab Pages deployment.

## Protected runtime values

- `ADMIN_EMAILS`: exact owner email allowlist
- `ADMIN_PASSWORD`: strong Admin-only password, 20–256 characters
- `ADMIN_ORIGIN`: exact HTTPS origin, without a trailing slash
- `CSRF_SECRET`: at least 32 bytes of protected random material
- `AUDIT_SECRET`: distinct, at least 32 bytes
- `SESSION_SECRET`: distinct, at least 32 bytes

No secret value belongs in Git, browser storage or the public site.

## Authentication gate

The Worker enforces its own authentication boundary:

1. Exact allowlisted email + `ADMIN_PASSWORD`.
2. First login creates a short-lived TOTP setup session.
3. The owner enrolls the generated secret in an authenticator and confirms a
   current 6-digit code.
4. Later logins require password + TOTP.
5. A successful login creates a signed, Secure, HttpOnly, SameSite=Strict
   session cookie with a 30-minute lifetime.
6. Writes additionally require exact Origin and a valid session-bound CSRF
   token.

Do not expose a Worker before its required secrets are installed. Keep Preview
URLs disabled. If `SESSION_SECRET` is intentionally rotated, reset and re-enroll
TOTP because the stored enrollment is encrypted with a key derived from that
secret.

## Required pre-link tests

1. Confirm `main` and the public Print Prep Lab Pages deployment did not change.
2. Confirm exactly one dedicated Admin Worker and one dedicated Admin D1 exist.
3. Confirm the login root returns HTTP 200 with the expected security headers.
4. Confirm `/login` cannot bypass the session boundary.
5. Confirm unauthenticated `/api/session` returns HTTP 401.
6. Confirm wrong password/TOTP attempts fail and login rate limiting is active.
7. Confirm missing/invalid CSRF and wrong Origin requests are rejected.
8. Confirm CSP, HSTS, `no-store`, `noindex` and DENY framing protections.
9. Confirm save creates a backup, stale revisions are rejected, restore verifies
   integrity, protected snapshot creation works, and the audit hash chain is
   populated.
10. Confirm logout is POST-only, CSRF-protected and clears the host session.
11. Confirm all 113 managed routes are sourced from the pinned recovery package
   and/or current Production sitemap and are reachable read-only.
12. Confirm `publicIntegration` remains `false`.

A protected snapshot is an Admin-D1 record only. Do not enable any public-site
read path until a separate read-only integration has been reviewed and approved.
