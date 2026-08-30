# Print Prep Lab Admin control plane

This is a separate, owner-only Cloudflare Worker. It is not a route inside the
public Print Prep Lab site and the public site does not consume its data yet.

## Safe deployment order

1. Create a dedicated D1 database and apply the tracked `migrations` in order
   (`schema.sql` is retained as a human-readable full-schema reference).
2. Create a separate Worker and bind that D1 as `DB`.
3. Add the protected variables and secrets documented in `SECURITY.md`.
4. Attach a dedicated admin hostname with no `workers.dev` fallback.
5. Put the whole hostname behind Cloudflare Access, deny by default, allow only
   the owner's verified identity, and require MFA.
6. Run the local quality gate with `npm run check`.
7. Verify unauthenticated, wrong-account, missing-CSRF, wrong-origin and
   authorized MFA flows before considering any public-site integration.

Publishing in this control plane creates a protected D1 snapshot only. It does
not deploy or alter the public website.
