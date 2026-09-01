import assert from "node:assert/strict";
import test from "node:test";

import { latestPublishedConfig } from "../worker-no-zero-trust.js";

const config = {
  brand: { name: "Print Prep Lab", defaultLocale: "en", secondaryLocale: "ar" },
  seo: { defaultTitle: "Print Prep Lab", defaultDescription: "Practical print preparation tools and guidance." },
  site: { announcement: { enabled: false, text: "" }, maintenanceMode: false },
  features: { job_companion: true },
  navigation: [],
  pageOverrides: {
    "/about": {
      title: "About the lab",
      titleAr: "عن المنصة",
      description: "About Print Prep Lab.",
      descriptionAr: "عن منصة تجهيز الطباعة.",
      h1: "About Print Prep Lab",
      h1Ar: "عن برينت بريب لاب",
      intro: "A controlled content override.",
      introAr: "تعديل محتوى محمي.",
      enabled: true,
      sections: [],
    },
  },
  toolVisibility: {},
};

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function envFor(row) {
  return { DB: { prepare() { return { async first() { return row; } }; } } };
}

test("returns only the latest integrity-checked structured publication", async () => {
  const payload = JSON.stringify(config);
  const published = await latestPublishedConfig(envFor({
    id: "11111111-1111-4111-8111-111111111111",
    revision: 7,
    payload,
    checksum: await sha256(payload),
    published_at: "2026-09-01T12:00:00.000Z",
  }));
  assert.equal(published.revision, 7);
  assert.equal(published.config.pageOverrides["/about"].h1, "About Print Prep Lab");
  assert.equal("published_by" in published, false);
  assert.equal(JSON.stringify(published).includes("secret"), false);
});

test("rejects a tampered published payload", async () => {
  const payload = JSON.stringify(config);
  await assert.rejects(
    () => latestPublishedConfig(envFor({ id: crypto.randomUUID(), revision: 1, payload, checksum: "0".repeat(64), published_at: new Date().toISOString() })),
    /integrity/i,
  );
});

test("returns null before the first protected publication", async () => {
  assert.equal(await latestPublishedConfig(envFor(null)), null);
});
