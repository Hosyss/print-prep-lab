import test from "node:test";
import assert from "node:assert/strict";
import { signSession, verifySessionToken } from "../worker-no-zero-trust.js";

const baseEnv = {
  ADMIN_EMAILS: "owner@example.com",
  ADMIN_PASSWORD: "First-very-long-admin-password-2026!",
  CSRF_SECRET: "csrf-" + "c".repeat(40),
  AUDIT_SECRET: "audit-" + "a".repeat(40),
  SESSION_SECRET: "session-" + "s".repeat(40),
};

test("rotating ADMIN_PASSWORD invalidates every previously issued admin session without rotating SESSION_SECRET", async () => {
  const now = 2_000_000_000;
  const token = await signSession("owner@example.com", "admin", baseEnv, now);
  const accepted = await verifySessionToken(token, baseEnv, "admin", now + 10);
  assert.equal(accepted.email, "owner@example.com");

  const rotated = { ...baseEnv, ADMIN_PASSWORD: "Second-very-long-admin-password-2026!" };
  await assert.rejects(
    () => verifySessionToken(token, rotated, "admin", now + 10),
    (error) => error?.status === 401 && error?.code === "invalid_session",
  );

  const replacement = await signSession("owner@example.com", "admin", rotated, now + 20);
  const replacementAccepted = await verifySessionToken(replacement, rotated, "admin", now + 21);
  assert.equal(replacementAccepted.email, "owner@example.com");
});

test("TOTP setup sessions remain bounded to the shorter setup lifetime", async () => {
  const now = 2_000_000_000;
  const token = await signSession("owner@example.com", "totp-setup", baseEnv, now);
  await verifySessionToken(token, baseEnv, "totp-setup", now + 599);
  await assert.rejects(
    () => verifySessionToken(token, baseEnv, "totp-setup", now + 601),
    (error) => error?.status === 401 && error?.code === "invalid_session",
  );
});
