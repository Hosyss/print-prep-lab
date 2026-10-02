import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

// Exercise the assembled artifact over HTTP through Wrangler Pages, including
// its real ASSETS binding. In-process file mocks cannot validate pretty URLs.
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:4182');
const output = process.argv[3] ?? 'work/editorial-browser-qa';
const source = await readFile(new URL('../worker/index.ts', import.meta.url), 'utf8');
const staticTable = source.match(/const STATIC_PAGE_ROUTES[^=]*=\s*\{([\s\S]*?)\n\};/)?.[1];
assert.ok(staticTable, 'Retained route inventory is available');
const staticRoutes = [...staticTable.matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map((match) => ({path:match[1], file:match[2]}));
assert.ok(staticRoutes.length > 50, 'Audit the complete retained application');
const aliasTable = source.match(/const LEGACY_ROUTE_ALIASES[^=]*=\s*\{([\s\S]*?)\n\};/)?.[1];
const aliases = [...aliasTable.matchAll(/"([^"]+)":\s*\{ target: "([^"]+)", status: (\d+) \}/g)].map((match) => ({path:match[1], target:match[2], status:Number(match[3])}));
const results = [];
const errors = [];
const htmls = new Map();

async function request(path, method = 'GET') {
  return fetch(new URL(path, base), {method, redirect:'manual', signal:AbortSignal.timeout(15000)});
}
async function checked(label, run) {
  try {await run(); results.push({check:label, status:'passed'});}
  catch(error) {errors.push({check:label, message:error.message});}
}
async function batch(items, run) {
  for(let i=0; i<items.length; i+=6) await Promise.all(items.slice(i,i+6).map(run));
}
function canonical(html) {
  const tag = html.match(/<link\b(?=[^>]*\brel="canonical")[^>]*>/i)?.[0];
  return tag?.match(/\bhref="([^"]+)"/)?.[1];
}

const sitemapResponse = await request('/sitemap.xml');
assert.equal(sitemapResponse.status, 200);
const sitemap = await sitemapResponse.text();
const publicPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);
assert.ok(publicPaths.length >= 42, 'All current public pages are represented');
assert.equal(new Set(publicPaths).size, publicPaths.length, 'No duplicate sitemap URLs');
for(const {path} of staticRoutes) assert.ok(!publicPaths.includes(path), path+' application screen is outside the editorial sitemap');

await batch([...publicPaths.map(path => ({path, public:true})), ...staticRoutes.map(item => ({...item, public:item.path==='/glossary'}))], async item => {
  await checked('GET '+item.path, async () => {
    const response = await request(item.path);
    assert.equal(response.status, 200, item.path+' is reachable in Pages');
    assert.match(response.headers.get('content-type') ?? '', /text\/html/i);
    const html = await response.text(); htmls.set(item.path, html);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, item.path+' main heading');
    assert.equal(canonical(html), 'https://printpreplab.pages.dev'+item.path, item.path+' canonical');
    if(item.public) {
      assert.doesNotMatch(response.headers.get('x-robots-tag') ?? '', /noindex/i);
      assert.doesNotMatch(html, /<meta(?=[^>]*\bname="robots")(?=[^>]*\bcontent="[^"]*noindex)[^>]*>/i);
    } else {
      assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/i);
      assert.match(html, /<meta(?=[^>]*\bname="robots")(?=[^>]*\bcontent="[^"]*noindex)[^>]*>/i);
      assert.ok(!html.includes('pagead2.googlesyndication'), item.path+' has no advertising script');
    }
  });
  await checked('HEAD '+item.path, async () => {
    const response = await request(item.path, 'HEAD');
    assert.equal(response.status, 200); assert.equal(await response.text(), '');
    if(!item.public) assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/i);
  });
});

await batch(aliases, alias => checked('ALIAS '+alias.path, async () => {
  const response = await request(alias.path+'?source=crawl-qa');
  assert.equal(response.status, alias.status);
  const location = new URL(response.headers.get('location'), base);
  const expected = new URL(alias.target, base);
  assert.equal(location.origin, base.origin); assert.equal(location.pathname, expected.pathname);
  assert.equal(location.hash, expected.hash); assert.equal(location.searchParams.get('source'), 'crawl-qa');
  const destination = await request(location.pathname+location.search);
  assert.equal(destination.status, 200, alias.path+' destination');
}));

await batch(staticRoutes, item => checked('VARIANTS '+item.path, async () => {
  for(const path of [item.path+'/', item.path+'?source=crawl-qa']) {
    const response = await request(path); assert.equal(response.status, 200, path);
    if(item.path!=='/glossary') assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/i);
  }
  const raw = await request(item.file);
  assert.equal(raw.status, 404, item.file+' does not expose a duplicate document');
  assert.match(raw.headers.get('x-robots-tag') ?? '', /noindex/i);
}));

// Discover navigation links in the retained pages too, not just editorial routes.
const internalLinks = new Set();
for(const html of htmls.values()) for(const match of html.matchAll(/<a\b[^>]*\bhref="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
  if(!match[1].startsWith('//') && !match[1].includes('.')) internalLinks.add(match[1]);
}
await batch([...internalLinks].filter(path => !htmls.has(path)), path => checked('LINK '+path, async () => {
  let response = await request(path);
  if(path==='/admin' || path==='/admin/') {assert.equal(response.status, 302); return;}
  for(let i=0; i<4 && [301,302,307,308].includes(response.status); i++) {
    const target = new URL(response.headers.get('location'), base);
    assert.equal(target.origin, base.origin, 'Internal navigation stays on the site');
    response = await request(target.pathname+target.search);
  }
  assert.equal(response.status, 200, path+' navigation destination');
}));

await checked('404 unknown page', async () => {
  const response = await request('/missing-crawl-qa-page'); assert.equal(response.status, 404);
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/i);
});
await checked('Google verification', async () => {
  const response = await request('/google6d67c58ff3b5201c.html'); assert.equal(response.status, 200);
  assert.equal((await response.text()).trim(), 'google-site-verification: google6d67c58ff3b5201c.html');
});
await mkdir(output, {recursive:true});
const report = {public_pages:publicPaths.length, retained_pages:staticRoutes.length, aliases:aliases.length, internal_links:internalLinks.size, checks:results.length, failures:errors, results};
await writeFile(join(output,'pages-routing-results.json'), JSON.stringify(report,null,2));
console.log(JSON.stringify({...report, results:undefined}));
assert.deepEqual(errors, [], 'Pages routing and crawl audit');
