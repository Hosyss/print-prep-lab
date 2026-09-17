import fs from 'node:fs';
import path from 'node:path';

const base = (process.argv[2] || 'http://127.0.0.1:4176').replace(/\/$/, '');
const outDir = process.argv[3] || '/tmp/content-value-audit';
const mode = process.argv[4] || 'remediated';
fs.mkdirSync(outDir, { recursive: true });

const decode = (s) => s
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>');

function mainText(html) {
  const match = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  let body = match?.[1] ?? html;
  body = body
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return decode(body).replace(/\s+/g, ' ').trim();
}

function tokens(text) {
  return text.toLowerCase().match(/[a-z0-9]+(?:[.'’-][a-z0-9]+)*/g) || [];
}

function shingles(text, n = 5) {
  const words = tokens(text);
  const out = new Set();
  for (let i = 0; i <= words.length - n; i++) out.add(words.slice(i, i + n).join(' '));
  return out;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

function kind(route) {
  if (route.startsWith('/tools/')) return 'tool';
  if (route.startsWith('/sizes/')) return 'size';
  if (route.startsWith('/guides/')) return 'guide';
  if (['/about', '/methodology', '/sources', '/editorial-policy', '/contact'].includes(route)) return 'trust';
  if (['/privacy', '/terms'].includes(route)) return 'policy';
  return 'hub';
}

const minimumWords = { tool: 520, size: 500, guide: 650, trust: 400, policy: 250, hub: 220 };

const sitemapRes = await fetch(base + '/sitemap.xml');
if (sitemapRes.status !== 200) throw new Error(`sitemap.xml -> ${sitemapRes.status}`);
const sitemap = await sitemapRes.text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
const routes = urls.map((url) => new URL(url).pathname);
if (!routes.length) throw new Error('No sitemap routes discovered');

const pages = [];
for (const route of routes) {
  const res = await fetch(base + route);
  if (res.status !== 200) throw new Error(`${route} -> ${res.status}`);
  const html = await res.text();
  const text = mainText(html);
  const pageKind = kind(route);
  const wordCount = tokens(text).length;
  const headings = [...html.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/gi)].map((m) => mainText(m[1]));
  pages.push({ route, kind: pageKind, wordCount, headings, text, shingleSet: shingles(text), html });
}

const pairs = [];
for (let i = 0; i < pages.length; i++) {
  for (let j = i + 1; j < pages.length; j++) {
    const a = pages[i], b = pages[j];
    const similarity = jaccard(a.shingleSet, b.shingleSet);
    if (similarity >= 0.18) pairs.push({ a: a.route, b: b.route, similarity });
    if (a.text === b.text) throw new Error(`Exact duplicate main content: ${a.route} and ${b.route}`);
    if (similarity >= 0.78 && ['tool', 'size', 'guide', 'trust'].includes(a.kind) && a.kind === b.kind) {
      throw new Error(`High same-type content similarity ${similarity.toFixed(3)}: ${a.route} and ${b.route}`);
    }
  }
}
pairs.sort((a, b) => b.similarity - a.similarity);

const weak = pages.filter((p) => p.wordCount < minimumWords[p.kind]);

if (mode !== 'baseline') {
  const toolPages = pages.filter((p) => p.kind === 'tool');
  for (const page of toolPages) {
    for (const marker of ['data-content-value="worked-calculation"', 'data-content-value="assumptions-and-limits"', 'How to interpret the result']) {
      if (!page.html.includes(marker)) throw new Error(`${page.route}: missing tool value marker ${marker}`);
    }
  }
  for (const route of ['/about', '/methodology', '/sources']) {
    const page = pages.find((p) => p.route === route);
    if (!page?.html.includes('data-content-value="verifiable-evidence"')) throw new Error(`${route}: missing verifiable evidence section`);
  }
  const contact = pages.find((p) => p.route === '/contact');
  if (!contact?.html.includes('data-content-value="correction-process"') || !contact.html.includes('data-content-value="verifiable-contact-records"')) {
    throw new Error('/contact: missing correction workflow evidence');
  }
}

const excluded = {
  '/jobs': 'Browser-local production job data; operational workspace rather than standalone public editorial content.',
  '/job-core': 'Browser-local job record editor; useful inside the workflow but not a search landing page.',
  '/supplier-intelligence': 'Browser-local supplier decision workspace with user-entered records.',
  '/release-center': 'Operational release state derived from local workflow data.',
  '/readiness-audit': 'Operational audit view whose value depends on local project state.',
  '/command-center': 'Workspace command view rather than an independent public reference.',
  '/enterprise-dashboard': 'Operational dashboard assembled from local workflow signals.',
  '/digital-twin': 'Local workflow status view, not a standalone explanatory article.',
  '/vault': 'Local file/workflow index; not independent editorial content.',
  '/operations': 'Operations board driven by local workflow state.',
  '/file-manifest': 'Local manifest utility rather than a public reference page.',
  '/production-archive': 'Local archive utility whose content is user-generated.',
};
const noindex = [];
for (const [route, reason] of Object.entries(excluded)) {
  const res = await fetch(base + route, { redirect: 'manual' });
  const header = res.headers.get('x-robots-tag') || '';
  const html = await res.text();
  const metaNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  if (!/noindex/i.test(header) && !metaNoindex) throw new Error(`${route}: expected noindex`);
  noindex.push({ route, reason, via: /noindex/i.test(header) ? 'X-Robots-Tag' : 'meta robots' });
}

const inventory = pages.map(({ route, kind, wordCount, headings }) => ({
  route, kind, wordCount, headings: headings.slice(0, 12), status: wordCount >= minimumWords[kind] ? 'strong-enough-for-manual-review' : 'review',
}));

const report = {
  generatedAt: new Date().toISOString(),
  base,
  mode,
  sitemapPages: pages.length,
  inventory,
  belowEditorialThreshold: weak.map(({ route, kind, wordCount }) => ({ route, kind, wordCount, minimum: minimumWords[kind] })),
  highestSimilarities: pairs.slice(0, 25).map((p) => ({ ...p, similarity: Number(p.similarity.toFixed(4)) })),
  exactDuplicateMainContentPairs: 0,
  noindex,
};
fs.writeFileSync(path.join(outDir, 'content-value-audit.json'), JSON.stringify(report, null, 2));

const md = [];
md.push('# Content value audit');
md.push('');
md.push(`- Mode: ${mode}`);
md.push(`- Base: ${base}`);
md.push(`- Sitemap pages checked: ${pages.length}`);
md.push(`- Exact duplicate main-content pairs: 0`);
md.push(`- Pages below editorial word threshold: ${weak.length}`);
md.push('');
md.push('## Public inventory');
md.push('');
md.push('| Route | Type | Main words | Audit status |');
md.push('|---|---:|---:|---|');
for (const row of inventory) md.push(`| ${row.route} | ${row.kind} | ${row.wordCount} | ${row.status} |`);
md.push('');
md.push('## Highest five-word-shingle similarities');
md.push('');
md.push('| Page A | Page B | Similarity |');
md.push('|---|---|---:|');
for (const p of pairs.slice(0, 25)) md.push(`| ${p.a} | ${p.b} | ${p.similarity.toFixed(3)} |`);
md.push('');
md.push('## Pages intentionally kept noindex');
md.push('');
md.push('| Route | Why it stays noindex |');
md.push('|---|---|');
for (const item of noindex) md.push(`| ${item.route} | ${item.reason} |`);
fs.writeFileSync(path.join(outDir, 'content-value-audit.md'), md.join('\n') + '\n');

console.log(`CONTENT VALUE AUDIT (${mode}): ${pages.length} sitemap pages, ${weak.length} below threshold, 0 exact duplicate main-content pairs.`);
if (pairs[0]) console.log(`Highest observed similarity: ${pairs[0].similarity.toFixed(3)} ${pairs[0].a} <> ${pairs[0].b}`);
for (const item of weak) console.log(`REVIEW ${item.route}: ${item.wordCount} words < ${minimumWords[item.kind]} (${item.kind})`);
