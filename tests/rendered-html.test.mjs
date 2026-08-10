import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}

async function renderPath(worker, path) {
  const response = await worker.fetch(
    new Request(`https://print-prep-lab.hosys.chatgpt.site${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200, path);
  return response.text();
}

test("renders production SEO, accessibility and security signals", async () => {
  const worker = await loadWorker();

  const response = await worker.fetch(
    new Request("https://print-prep-lab.hosys.chatgpt.site/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000; includeSubDomains");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");

  const html = await response.text();
  assert.doesNotMatch(html, developmentPreviewMeta);
  assert.match(html, /<link rel="canonical" href="https:\/\/print-prep-lab\.hosys\.chatgpt\.site\/"\/>/);
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<script type="application\/ld\+json">/);
  assert.match(html, /<label class="drop-zone/);
  assert.doesNotMatch(html, /role="button"/);

  const robotsResponse = await worker.fetch(
    new Request("https://print-prep-lab.hosys.chatgpt.site/robots.txt"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(robotsResponse.status, 200);
  assert.match(await robotsResponse.text(), /Sitemap: https:\/\/print-prep-lab\.hosys\.chatgpt\.site\/sitemap\.xml/);

  const sitemapResponse = await worker.fetch(
    new Request("https://print-prep-lab.hosys.chatgpt.site/sitemap.xml"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  assert.match(sitemap, /https:\/\/print-prep-lab\.hosys\.chatgpt\.site\/sizes\/a4</);
  assert.doesNotMatch(sitemap, /\/sizes\/a4\//);
});

test("renders every P0 tool with distinct intent and strengthened content", async () => {
  const worker = await loadWorker();
  const expectations = [
    ["/tools/print-readiness-checker", "Is Your Image Ready to Print?", "Best aspect-ratio matches"],
    ["/tools/pixels-to-print-size", "Convert Pixels to Print Size", "Same pixels at common print targets"],
    ["/tools/print-size-to-pixels", "Convert Print Size to Pixels", "Pixels required at common targets"],
    ["/tools/dpi-ppi-calculator", "Calculate Image PPI for Printing", "Width density"],
    ["/tools/paper-size-pixels-calculator", "Calculate Any Paper Size in Pixels", "A4 at common targets"],
    ["/tools/aspect-ratio-crop-preview", "Preview How Your Photo Will Crop", "Fit full image"],
    ["/tools/bleed-safe-area-calculator", "Calculate Bleed, Trim and Safe Area", "Common starting points"],
  ];

  for (const [path, heading, proof] of expectations) {
    const html = await renderPath(worker, path);
    assert.match(html, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(proof.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, /Quick answer/);
    assert.match(html, /FAQPage/);
  }
});

test("renders the three P0 size pages with exact quick answers and unique planning notes", async () => {
  const worker = await loadWorker();
  const expectations = [
    ["/sizes/a4", "2480 × 3508 pixels", "A4 vs Letter"],
    ["/sizes/4x6-photo", "1200 × 1800 pixels", "A natural match for 3:2 cameras"],
    ["/sizes/8x10-photo", "2400 × 3000 pixels", "A 3:2 image loses about 16.7%"],
  ];

  for (const [path, answer, insight] of expectations) {
    const html = await renderPath(worker, path);
    assert.match(html, new RegExp(answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(insight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, /Quick answer/);
    assert.match(html, /FAQPage/);
  }
});

test("renders the five P1 size pages with exact facts and distinct print decisions", async () => {
  const worker = await loadWorker();
  const expectations = [
    ["/sizes/a3", "A3 Size in Pixels and Print Dimensions", "3508 × 4961 pixels", "A3 has twice the area of A4"],
    ["/sizes/a5", "A5 Size in Pixels and Print Dimensions", "1748 × 2480 pixels", "One A4 sheet folds to two A5 pages"],
    ["/sizes/us-letter", "US Letter Size in Pixels and Print Dimensions", "2550 × 3300 pixels", "Letter is wider and shorter"],
    ["/sizes/5x7-photo", "5×7 Photo Size: Pixels, Inches and Aspect Ratio", "1500 × 2100 pixels", "A 3:2 photo loses about 6.7%"],
    ["/sizes/16x20-photo", "16×20 Photo Size: Pixels, Resolution and Crop", "4800 × 6000 pixels", "28.8 megapixels"],
  ];

  for (const [path, heading, answer, insight] of expectations) {
    const html = await renderPath(worker, path);
    for (const value of [heading, answer, insight]) {
      assert.match(html, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.match(html, /Quick answer/);
    assert.match(html, /FAQPage/);
  }
});

test("renders the four P2 size pages with exact facts, crop guidance and one H1", async () => {
  const worker = await loadWorker();
  const expectations = [
    ["/sizes/a2", "A2 Size in Pixels and Print Dimensions", "4961 × 7016 pixels", "A2 has twice the area of A3"],
    ["/sizes/us-legal", "US Legal Size in Pixels and Print Dimensions", "2550 × 4200 pixels", "The same width, three inches taller"],
    ["/sizes/11x14-photo", "11×14 Photo Size: Pixels, Resolution and Crop", "3300 × 4200 pixels", "A 3:2 image loses about 15.2%"],
    ["/sizes/12x18-photo", "12×18 Photo Size: Pixels, Resolution and Ratio", "3600 × 5400 pixels", "A direct fit for 3:2 camera images"],
  ];

  for (const [path, heading, answer, insight] of expectations) {
    const html = await renderPath(worker, path);
    for (const value of [heading, answer, insight]) {
      assert.match(html, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${path} must have one H1`);
    assert.match(html, /Quick answer/);
    assert.match(html, /FAQPage/);
  }
});

test("renders the P2 home and hub pages as distinct task routes", async () => {
  const worker = await loadWorker();
  const expectations = [
    ["/", "Know If Your Image", "Start with what you know", "How large can you print an image without losing quality?"],
    ["/tools", "Free Print Preparation Tools", "What do you have right now?", "One local check from pixels to paper."],
    ["/sizes", "Paper and Photo Size Reference", "ISO A-series paper", "The same paper needs different pixels at different PPI."],
    ["/guides", "Print Preparation Guides", "What are you trying to solve?", "Turn source pixels into a defensible maximum print size."],
  ];

  for (const [path, heading, route, proof] of expectations) {
    const html = await renderPath(worker, path);
    for (const value of [heading, route, proof]) {
      assert.match(html, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${path} must have one H1`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://print-prep-lab\\.hosys\\.chatgpt\\.site${path === "/" ? "/" : path}"/>`));
  }

  const sitemapResponse = await worker.fetch(
    new Request("https://print-prep-lab.hosys.chatgpt.site/sitemap.xml"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  const sitemap = await sitemapResponse.text();
  for (const path of ["/sizes/a2", "/sizes/us-legal", "/sizes/11x14-photo", "/sizes/12x18-photo"]) {
    assert.match(sitemap, new RegExp(`https://print-prep-lab\\.hosys\\.chatgpt\\.site${path}`));
  }
});

test("renders every P1 guide as a decision page with sources, FAQs and a tool handoff", async () => {
  const worker = await loadWorker();
  const expectations = [
    ["/guides/how-large-can-i-print-my-image", "How Large Can You Print an Image Without Losing Quality?", "Maximum size for a 6000 × 4000 px image before crop", "Check your image now"],
    ["/guides/dpi-vs-ppi", "DPI vs PPI Explained for Print", "PPI, DPI and the resolution tag solve different questions", "Calculate effective PPI"],
    ["/guides/print-resolution-guide", "What Resolution Do You Need for Printing?", "Pixel requirements for an 8 × 10 inch print", "Convert pixels to print size"],
    ["/guides/bleed-trim-safe-area", "Bleed, Trim and Safe Area Explained", "Bleed canvas · 216 × 303 mm", "Calculate your document boxes"],
    ["/guides/aspect-ratio-cropping-print", "Why Photos Crop at Different Print Sizes", "How a 3:2 camera image fits common edge-to-edge prints", "Preview your crop"],
  ];

  for (const [path, heading, proof, cta] of expectations) {
    const html = await renderPath(worker, path);
    for (const value of [heading, proof, cta]) {
      assert.match(html, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.match(html, /Decision table/);
    assert.match(html, /Common mistakes/);
    assert.match(html, /Sources and method/);
    assert.match(html, /FAQPage/);
  }
});

test("audits every public URL for indexable, distinct metadata and valid internal links", async () => {
  const worker = await loadWorker();
  const sitemapResponse = await worker.fetch(
    new Request("https://print-prep-lab.hosys.chatgpt.site/sitemap.xml"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(sitemapResponse.status, 200);

  const sitemap = await sitemapResponse.text();
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(locations.length, 34, "the launch sitemap must contain exactly 34 focused URLs");
  assert.equal(new Set(locations).size, locations.length, "sitemap URLs must be unique");
  assert.equal((sitemap.match(/<lastmod>2026-08-09T00:00:00\.000Z<\/lastmod>/g) ?? []).length, 34);

  const expectedPaths = new Set(locations.map((location) => new URL(location).pathname));
  const seenTitles = new Map();
  const seenDescriptions = new Map();

  for (const location of locations) {
    const url = new URL(location);
    const html = await renderPath(worker, url.pathname);
    assert.doesNotMatch(html, developmentPreviewMeta, `${url.pathname} must not expose preview metadata`);
    assert.doesNotMatch(html, /<meta[^>]+content="noindex/i, `${url.pathname} must be indexable`);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${url.pathname} must have exactly one H1`);

    const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
    assert.ok(title && title.length >= 30 && title.length <= 80, `${url.pathname} must have a useful title`);
    assert.equal(seenTitles.get(title), undefined, `${url.pathname} duplicates the title from ${seenTitles.get(title)}`);
    seenTitles.set(title, url.pathname);

    const description = html.match(/<meta name="description" content="([^"]+)"\/>/)?.[1]?.trim();
    assert.ok(description && description.length >= 70 && description.length <= 180, `${url.pathname} must have a useful description`);
    assert.equal(
      seenDescriptions.get(description),
      undefined,
      `${url.pathname} duplicates the description from ${seenDescriptions.get(description)}`,
    );
    seenDescriptions.set(description, url.pathname);

    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="${location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"/>`),
      `${url.pathname} must self-canonicalize`,
    );
    assert.match(html, /<meta property="og:image" content="https:\/\/print-prep-lab\.hosys\.chatgpt\.site\/og-image\.png"\/>/);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"\/>/);

    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
      const href = match[1];
      if (!href.startsWith("/")) continue;
      const linkedPath = new URL(href, location).pathname;
      assert.ok(expectedPaths.has(linkedPath), `${url.pathname} links to a route missing from the sitemap: ${href}`);
    }
  }

  const manifestResponse = await worker.fetch(
    new Request("https://print-prep-lab.hosys.chatgpt.site/manifest.webmanifest"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(manifestResponse.status, 200);
  assert.match(manifestResponse.headers.get("content-type") ?? "", /application\/manifest\+json/);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.name, "Print Prep Lab");
  assert.equal(manifest.start_url, "/");
});
