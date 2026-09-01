import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const SITE_URL = "https://printpreplab.pages.dev";
const LEGACY_URL = "https://print-prep-lab.hosys.chatgpt.site";
const EXPECTED_PATHS = [
  "/", "/tools", "/sizes", "/guides",
  "/tools/print-readiness-checker", "/tools/pixels-to-print-size",
  "/tools/print-size-to-pixels", "/tools/dpi-ppi-calculator",
  "/tools/paper-size-pixels-calculator", "/tools/aspect-ratio-crop-preview",
  "/tools/bleed-safe-area-calculator",
  "/sizes/a2", "/sizes/a3", "/sizes/a4", "/sizes/a5",
  "/sizes/us-letter", "/sizes/us-legal", "/sizes/4x6-photo",
  "/sizes/5x7-photo", "/sizes/8x10-photo", "/sizes/11x14-photo",
  "/sizes/12x18-photo", "/sizes/16x20-photo",
  "/guides/how-large-can-i-print-my-image", "/guides/dpi-vs-ppi",
  "/guides/print-resolution-guide", "/guides/bleed-trim-safe-area",
  "/guides/aspect-ratio-cropping-print", "/guides/print-file-preflight-checklist",
  "/guides/export-images-for-large-format-printing", "/guides/a4-vs-us-letter-printing",
  "/about", "/methodology", "/sources", "/editorial-policy",
  "/privacy", "/terms", "/contact",
];

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}

function workerEnv() {
  return { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
}

function workerContext() {
  return { waitUntil() {}, passThroughOnException() {} };
}

async function requestPath(worker, path, base = SITE_URL) {
  return worker.fetch(
    new Request(`${base}${path}`, { headers: { accept: "text/html" } }),
    workerEnv(),
    workerContext(),
  );
}

async function renderPath(worker, path) {
  const response = await requestPath(worker, path);
  assert.equal(response.status, 200, path);
  return response.text();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("renders production security, publisher, advertising and consent signals", async () => {
  const worker = await loadWorker();
  const response = await requestPath(worker, "/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000; includeSubDomains");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("cache-control"), "public, max-age=0, must-revalidate");
  assert.equal(response.headers.get("cdn-cache-control"), "public, max-age=600, stale-while-revalidate=86400");

  const html = await response.text();
  assert.doesNotMatch(html, developmentPreviewMeta);
  assert.match(html, new RegExp(`<link rel="canonical" href="${escapeRegex(SITE_URL)}/"`));
  assert.match(html, /ca-pub-3369551572403499/);
  assert.match(html, /google-site-verification/);
  assert.match(html, /msvalidate\.01/);
  assert.match(html, /Analytics choices/);
  assert.match(html, /data-clarity-mask="true"/);
  assert.match(html, /<script type="application\/ld\+json">/);
});

test("redirects every legacy hostname path to its canonical Pages URL", async () => {
  const worker = await loadWorker();
  const response = await requestPath(
    worker,
    "/guides/dpi-vs-ppi?source=legacy",
    LEGACY_URL,
  );
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), `${SITE_URL}/guides/dpi-vs-ppi?source=legacy`);
  assert.match(response.headers.get("link") ?? "", new RegExp(`<${escapeRegex(SITE_URL)}/guides/dpi-vs-ppi>; rel="canonical"`));
});

test("serves a clean robots file, a complete sitemap and an authorized ads.txt", async () => {
  const worker = await loadWorker();
  const robotsResponse = await requestPath(worker, "/robots.txt");
  assert.equal(robotsResponse.status, 200);
  const robots = await robotsResponse.text();
  assert.match(robots, /User-Agent: \*/i);
  assert.match(robots, /Allow: \//i);
  assert.match(robots, new RegExp(`Sitemap: ${escapeRegex(SITE_URL)}/sitemap\\.xml`));
  assert.doesNotMatch(robots, /^Host:/im);

  const sitemapResponse = await requestPath(worker, "/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemapResponse.headers.get("content-type") ?? "", /xml/i);
  const sitemap = await sitemapResponse.text();
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(new Set(locations), new Set(EXPECTED_PATHS.map((path) => `${SITE_URL}${path}`)));
  assert.equal(new Set(locations).size, EXPECTED_PATHS.length);
  assert.equal((sitemap.match(/<lastmod>2026-08-24T00:00:00\.000Z<\/lastmod>/g) ?? []).length, EXPECTED_PATHS.length);
  assert.doesNotMatch(sitemap, /<priority>|<changefreq>/);

  const adsText = (await readFile(new URL("../public/ads.txt", import.meta.url), "utf8")).trim();
  assert.equal(adsText, "google.com, pub-3369551572403499, DIRECT, f08c47fec0942fa0");

  const googleVerification = (await readFile(new URL("../public/google6d67c58ff3b5201c.html", import.meta.url), "utf8")).trim();
  assert.equal(googleVerification, "google-site-verification: google6d67c58ff3b5201c.html");

  const googleVerificationResponse = await requestPath(worker, "/google6d67c58ff3b5201c.html");
  assert.equal(googleVerificationResponse.status, 200);
  assert.match(googleVerificationResponse.headers.get("content-type") ?? "", /^text\/plain\b/i);
  assert.equal((await googleVerificationResponse.text()).trim(), googleVerification);

  const indexNowResponse = await requestPath(worker, "/516c1331b746fbca4fb273e523b64e3e.txt");
  assert.equal(indexNowResponse.status, 200);
  assert.equal((await indexNowResponse.text()).trim(), "516c1331b746fbca4fb273e523b64e3e");
});

test("keeps the public Admin entry isolated from the Pages origin", async () => {
  const redirects = (await readFile(new URL("../public/_redirects", import.meta.url), "utf8")).trim();
  assert.equal(
    redirects,
    "/admin https://print-prep-lab-admin.buildtools.workers.dev 302\n" +
      "/admin/ https://print-prep-lab-admin.buildtools.workers.dev 302",
  );
  assert.doesNotMatch(redirects, /200|:splat|\/api\//);

  const worker = await loadWorker();
  for (const path of ["/admin", "/admin/"]) {
    const response = await requestPath(worker, path);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "https://print-prep-lab-admin.buildtools.workers.dev");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
  }
});

test("renders all seven calculators with original use cases, examples, notes and FAQs", async () => {
  const worker = await loadWorker();
  const toolPaths = EXPECTED_PATHS.filter((path) => path.split("/").length === 3 && path.startsWith("/tools/"));
  const bodyFingerprints = new Set();

  for (const path of toolPaths) {
    const html = await renderPath(worker, path);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${path} must have one H1`);
    assert.match(html, /When to use this tool/);
    assert.match(html, /Technical notes/);
    assert.match(html, /Worked example/);
    assert.match(html, /FAQPage/);
    if (path !== "/tools/print-readiness-checker") {
      assert.match(html, /Calculated results/);
      assert.match(html, /class="result-copy"/);
    }
    const context = html.match(/<section class="tool-context-grid[\s\S]*?<\/section>/)?.[0];
    assert.ok(context && context.length > 800, `${path} needs substantial tool-specific context`);
    assert.ok(!bodyFingerprints.has(context), `${path} duplicates another tool context`);
    bodyFingerprints.add(context);
  }
  assert.equal(bodyFingerprints.size, 7);
});

test("renders all twelve size references with format-specific editorial context", async () => {
  const worker = await loadWorker();
  const sizePaths = EXPECTED_PATHS.filter((path) => path.split("/").length === 3 && path.startsWith("/sizes/"));
  const bodyFingerprints = new Set();

  for (const path of sizePaths) {
    const html = await renderPath(worker, path);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${path} must have one H1`);
    assert.match(html, /Quick answer/);
    assert.match(html, /Format-specific context/);
    assert.match(html, /FAQPage/);
    const context = html.match(/<section class="size-use-case[\s\S]*?<\/section>/)?.[0];
    assert.ok(context && context.length > 900, `${path} needs substantial format-specific context`);
    assert.ok(!bodyFingerprints.has(context), `${path} duplicates another size context`);
    bodyFingerprints.add(context);
  }
  assert.equal(bodyFingerprints.size, 12);
});

test("renders eight original guides with authorship, review, sources and practical decisions", async () => {
  const worker = await loadWorker();
  const guidePaths = EXPECTED_PATHS.filter((path) => path.split("/").length === 3 && path.startsWith("/guides/"));
  assert.equal(guidePaths.length, 8);

  const homeHtml = await renderPath(worker, "/");
  assert.match(homeHtml, /Eight original guides/);
  const homeGuideLinks = new Set(
    [...homeHtml.matchAll(/<a\b[^>]*\bhref="(\/guides\/[^"#?]+)"/g)].map((match) => match[1]),
  );
  assert.deepEqual(homeGuideLinks, new Set(guidePaths), "the home page must expose all eight guides");

  for (const path of guidePaths) {
    const html = await renderPath(worker, path);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${path} must have one H1`);
    assert.match(html, /Written and maintained by/);
    assert.match(html, /Hossam Eldeen/);
    assert.match(html, /Reviewed and updated August 24, 2026/);
    assert.match(html, /Decision table/);
    assert.match(html, /Practical workflow/);
    assert.match(html, /Common mistakes/);
    assert.match(html, /Sources and method/);
    assert.match(html, /"@type":"Article"/);
    assert.match(html, /FAQPage/);
  }
});

test("publishes complete identity, editorial, methodology and policy pages", async () => {
  const worker = await loadWorker();
  const expectations = new Map([
    ["/about", ["Hossam Eldeen", "independent educational project", "Public source and change history"]],
    ["/methodology", ["Effective PPI", "Aspect ratio and crop retention", "Verification and correction process"]],
    ["/sources", ["Source hierarchy", "Verification policy", "Corrections and transparency"]],
    ["/editorial-policy", ["Who is responsible", "Advertising and editorial independence", "Corrections"]],
    ["/privacy", ["Google AdSense", "Microsoft Clarity", "Cloudflare", "Your choices"]],
    ["/terms", ["Planning guidance", "Corrections and contact"]],
    ["/contact", ["Hossam Eldeen", "GitHub Issues", "Public source and publisher profile"]],
  ]);

  for (const [path, phrases] of expectations) {
    const html = await renderPath(worker, path);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${path} must have one H1`);
    for (const phrase of phrases) assert.match(html, new RegExp(escapeRegex(phrase), "i"));
  }
});

test("audits every sitemap page for indexability, distinct metadata and valid internal links", async () => {
  const worker = await loadWorker();
  const expectedPathSet = new Set(EXPECTED_PATHS);
  const titles = new Map();
  const descriptions = new Map();

  for (const path of EXPECTED_PATHS) {
    const html = await renderPath(worker, path);
    assert.doesNotMatch(html, developmentPreviewMeta, `${path} exposes preview metadata`);
    assert.doesNotMatch(html, /helpx\.adobe\.com\/photoshop\/using\/image-size-resolution\.html/i, `${path} links to Adobe's retired resolution page`);
    assert.doesNotMatch(html, /helpx\.adobe\.com\/indesign\/using\/printers-marks-bleeds\.html/i, `${path} links to Adobe's retired bleed page`);
    assert.doesNotMatch(html, /<meta[^>]+content="noindex/i, `${path} must be indexable`);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${path} must have exactly one H1`);

    const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
    assert.ok(title && title.length >= 30 && title.length <= 80, `${path} needs a useful title`);
    assert.equal(titles.get(title), undefined, `${path} duplicates the title from ${titles.get(title)}`);
    titles.set(title, path);

    const description = html.match(/<meta name="description" content="([^"]+)"\/?\s*>/)?.[1]?.trim();
    assert.ok(description && description.length >= 70 && description.length <= 180, `${path} needs a useful description`);
    assert.equal(descriptions.get(description), undefined, `${path} duplicates the description from ${descriptions.get(description)}`);
    descriptions.set(description, path);

    const canonical = `${SITE_URL}${path}`;
    assert.match(html, new RegExp(`<link rel="canonical" href="${escapeRegex(canonical)}"`));
    assert.match(html, new RegExp(`<meta property="og:image" content="${escapeRegex(SITE_URL)}/og-image\\.png"`));
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);

    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
      const href = match[1];
      if (!href.startsWith("/")) continue;
      const linkedPath = new URL(href, SITE_URL).pathname;
      assert.ok(expectedPathSet.has(linkedPath), `${path} links to a route missing from the sitemap: ${href}`);
    }
  }
  assert.equal(titles.size, EXPECTED_PATHS.length);
  assert.equal(descriptions.size, EXPECTED_PATHS.length);
});

test("returns a helpful non-indexable 404 and a valid web manifest", async () => {
  const worker = await loadWorker();
  const missingResponse = await requestPath(worker, "/this-page-does-not-exist");
  assert.equal(missingResponse.status, 404);
  const missingHtml = await missingResponse.text();
  assert.match(missingHtml, /That print-preparation page is not here/);
  assert.match(missingHtml, /noindex/);

  const manifestResponse = await requestPath(worker, "/manifest.webmanifest");
  assert.equal(manifestResponse.status, 200);
  assert.match(manifestResponse.headers.get("content-type") ?? "", /application\/manifest\+json/);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.name, "Print Prep Lab");
  assert.equal(manifest.start_url, "/");
});
