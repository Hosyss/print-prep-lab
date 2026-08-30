# Cloudflare deployment gate

Do not connect this control plane to the public site during this release.

## Isolated resources

- Worker: `print-prep-lab-admin`
- D1: `print-prep-lab-admin`
- D1 binding: `DB`
- Assets binding: `ASSETS`
- Dedicated admin hostname: chosen from a Cloudflare-owned zone; never a path
  under the public Pages origin
- `workers.dev`: disabled

## Access policy

Create a self-hosted Access application for the exact admin hostname. Keep the
application deny-by-default, add one Allow policy for the owner's exact verified
email, enable Cloudflare independent MFA, and require MFA on every login. Do not
add `Everyone`, email-domain, country, bypass or service-token access rules.

Record the generated application AUD tag as `CF_ACCESS_AUD` and the Zero Trust
team hostname as `CF_ACCESS_TEAM_DOMAIN`. The Worker validates both again.

## Protected runtime values

- `CF_ACCESS_TEAM_DOMAIN`
- `CF_ACCESS_AUD`
- `ADMIN_EMAILS`
- `ADMIN_ORIGIN`
- `CSRF_SECRET` (at least 32 random bytes)
- `AUDIT_SECRET` (different, at least 32 random bytes)

No value belongs in Git, browser storage or the public site.

## Required pre-link tests

1. Confirm the public Print Prep Lab deployment did not change.
2. Confirm the Worker has no active `workers.dev` URL.
3. Confirm an unauthenticated request is intercepted by Access.
4. Confirm a non-owner identity is denied.
5. Confirm the owner must complete MFA and can then open the dashboard.
6. Confirm the Worker reports a verified Access session and reachable D1.
7. Confirm a missing/invalid CSRF token and a wrong Origin are rejected.
8. Confirm response CSP, HSTS, `no-store`, `noindex` and DENY framing headers.
9. Save one harmless draft, verify its backup and audit entry, then create an
   isolated snapshot and confirm `publicIntegration` remains `false`.
10. Do not enable any public-site read path until a separate reviewed release.
