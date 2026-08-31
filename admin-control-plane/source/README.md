# Print Prep Lab Admin control plane

This package is a separate, owner-only Cloudflare Worker. It is not a route
inside the public Print Prep Lab Pages origin, and the public site does not
consume Admin data yet.

## Current architecture

- Worker: `print-prep-lab-admin`
- Dedicated D1: `print-prep-lab-admin`, bound as `DB`
- Static assets bound as `ASSETS`
- Current isolated hostname: `https://print-prep-lab-admin.buildtools.workers.dev`
- Authentication: owner email allowlist + strong password + TOTP authenticator
- Session: signed `__Host-ppl_admin_session` cookie; Secure, HttpOnly,
  SameSite=Strict and 30-minute lifetime
- Preview URLs are disabled
- Cloudflare Zero Trust / Access is **not** used by this deployment

## Safe deployment order

1. Create or reuse the dedicated Admin D1 and apply the tracked migrations in
   order. `schema.sql` remains the human-readable full-schema reference.
2. Create or reuse the separate `print-prep-lab-admin` Worker and bind the
   dedicated D1 as `DB`.
3. Install the protected runtime values documented in `SECURITY.md`.
4. Deploy initially without exposing an unconfigured authentication surface;
   only enable the final `workers.dev` entry point after secrets and migrations
   are ready.
5. Keep Preview URLs disabled and enforce the exact HTTPS Admin origin.
6. Run the full isolated test suite before each redeploy.
7. Verify the live boundary: login root is reachable, unauthenticated Admin API
   requests are rejected, security headers are present, and alternate login
   aliases do not bypass the session boundary.
8. Keep `main`, Pages Production and public-site integration unchanged until a
   separate read-only integration has been reviewed and approved.

## Content coverage

The current Admin catalog manages the union of:

- 66 route-stable pages from the pinned v118.6 recovery artifact; and
- 79 routes from the current Production sitemap.

The overlap produces **113 unique managed routes**. The Google ownership
verification HTML file is intentionally excluded from browser editing.

Publishing in this control plane creates a protected D1 snapshot only. It does
not deploy or alter the public website.
