import fs from 'node:fs';
import path from 'node:path';
import { chromium, request as playwrightRequest } from 'playwright';

const base=(process.argv[2]||'http://127.0.0.1:4175').replace(/\/$/,'');
const root=process.argv[3]||'/tmp/ppl-final';
const outDir=process.argv[4]||'/tmp/final-crawl';
fs.mkdirSync(outDir,{recursive:true});
const failures=[]; const checked=[];
const operational=new Set(['/jobs','/qa-history','/operations','/change-impact','/risk-register','/queue-planner','/waste-ledger','/approval-matrix','/release-packet','/revision-diff','/calibration-registry','/capa','/audit-log','/job-core','/digital-twin','/supplier-intelligence','/release-center','/automation-lab','/production-analytics','/schedule-optimizer','/material-intelligence','/customer-handoff','/vendor-handoff','/production-archive','/compliance-center','/knowledge-base','/enterprise-dashboard','/readiness-audit','/command-center','/search','/vault','/file-manifest','/job-brief','/workspace']);
const api=await playwrightRequest.newContext({ignoreHTTPSErrors:true});
const norm=(u)=>{try{const x=new URL(u,base);return x.origin===new URL(base).origin?(x.pathname.replace(/\/$/,'')||'/'):null}catch{return null}};
function fail(route,msg){failures.push({route,msg});console.error('FAIL',route,msg)}
function pass(route,msg){checked.push({route,msg});console.log('PASS',route,msg)}

const routes=new Set(['/','/tools','/sizes','/guides','/privacy','/terms','/contact','/about','/methodology','/sources','/editorial-policy']);
const idxPath=path.join(root,'search-index.json');
if(fs.existsSync(idxPath)){const idx=JSON.parse(fs.readFileSync(idxPath,'utf8'));for(const item of idx.items||[])if(item.path)routes.add(item.path)}
for(const file of fs.readdirSync(root).filter(x=>x.endsWith('.html'))){const stem=file.slice(0,-5);if(stem==='home-v112')routes.add('/');else if(stem==='print-readiness-v111')routes.add('/tools/print-readiness-checker');else if(!stem.startsWith('google'))routes.add('/'+stem)}

const robots=await api.get(base+'/robots.txt'); if(robots.status()!==200)fail('/robots.txt','status '+robots.status()); else pass('/robots.txt','200');
const sitemap=await api.get(base+'/sitemap.xml');
if(sitemap.status()!==200)fail('/sitemap.xml','status '+sitemap.status()); else {pass('/sitemap.xml','200');const xml=await sitemap.text();for(const m of xml.matchAll(/<loc>(.*?)<\/loc>/g)){const r=norm(m[1]);if(r)routes.add(r)}}

const internalLinks=new Set();
for(const route of [...routes].sort()){
 const res=await api.get(base+route,{maxRedirects:5});const status=res.status();
 if(status!==200){fail(route,'HTTP '+status);continue}
 const headers=res.headers();const body=await res.text();pass(route,'200');
 const noindex=/noindex/i.test(headers['x-robots-tag']||'')||/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(body)||/<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(body);
 if(operational.has(route)&&!noindex)fail(route,'operational/user-data page is indexable');
 if(!operational.has(route)&&route!=='/search'){
   const canonicalHeader=/rel="?canonical"?/i.test(headers.link||'');
   const canonicalHtml=/<link[^>]+rel=["']canonical["']/i.test(body);
   if(!canonicalHeader&&!canonicalHtml)fail(route,'missing canonical signal');
 }
 for(const m of body.matchAll(/href=["']([^"'#?]+(?:\?[^"']*)?)["']/gi)){const r=norm(m[1]);if(r)internalLinks.add(r)}
}
for(const route of [...internalLinks].sort()){
 if(/^\/(?:admin)$/.test(route))continue;
 const res=await api.get(base+route,{maxRedirects:5});
 if(res.status()>=400)fail(route,'internal link HTTP '+res.status());
}

// Genuine legacy replacements must redirect; non-equivalent ghosts must not remain discoverable.
const genuine={'/workflow':'/workspace','/tools/best-print-size-finder':'/scenarios','/tools/saddle-stitch-booklet-calculator':'/signature-planner','/guides/choose-best-photo-print-size':'/scenarios','/guides/saddle-stitch-booklet-page-count':'/signature-planner','/guides/rgb-vs-cmyk-printing':'/prepress-lab','/guides/best-file-format-for-printing':'/guides/print-file-preflight-checklist'};
for(const [from,to] of Object.entries(genuine)){const r=await api.get(base+from,{maxRedirects:0});if(![301,302,307,308].includes(r.status()))fail(from,'expected redirect, got '+r.status());else {const loc=norm(r.headers().location||'');if(loc!==to)fail(from,`redirected to ${loc}, expected ${to}`);else pass(from,'redirect '+to)}}

await api.dispose();
fs.writeFileSync(path.join(outDir,'crawl-results.json'),JSON.stringify({generatedAt:new Date().toISOString(),base,routeCount:routes.size,internalLinkCount:internalLinks.size,checked,failures},null,2));
if(failures.length)throw new Error(`${failures.length} crawl/SEO failures; see ${path.join(outDir,'crawl-results.json')}`);
console.log(`All ${routes.size} discovered routes and ${internalLinks.size} internal links passed.`);
