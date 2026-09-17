import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=(process.argv[2]||'http://127.0.0.1:4176').replace(/\/$/,'');
const artifactDir=process.argv[3]||'/tmp/ppl-final';
const outDir=process.argv[4]||'/tmp/final-site-audit';
const canonicalOrigin='https://printpreplab.pages.dev';
fs.mkdirSync(outDir,{recursive:true});
const results=[];
const failures=[];
const add=(name,ok,detail='')=>{results.push({name,ok,detail});console.log(`${ok?'PASS':'FAIL'} ${name}${detail?` — ${detail}`:''}`);if(!ok)failures.push({name,detail})};
const decode=s=>String(s||'').replace(/&amp;/g,'&').replace(/&#x2F;/gi,'/');
const normPath=(u)=>{try{const x=new URL(u,canonicalOrigin);return x.pathname==='/'?'/':x.pathname.replace(/\/$/,'')}catch{return null}};
async function get(route,opts={}){const r=await fetch(base+route,{redirect:opts.redirect||'follow',headers:{'cache-control':'no-cache'}});return r}

// Discover every static HTML route in the actual release artifact.
const htmlFiles=fs.readdirSync(artifactDir).filter(n=>n.endsWith('.html')).sort();
const staticRoutes=new Map();
for(const name of htmlFiles){const route=name==='home-v112.html'?'/':`/${name.slice(0,-5)}`;staticRoutes.set(route,name)}
add('artifact contains static HTML pages',staticRoutes.size>0,`count=${staticRoutes.size}`);

// Read runtime discovery surfaces.
let sitemapText='',robotsText='';
try{const r=await get('/sitemap.xml');sitemapText=await r.text();add('sitemap HTTP 200',r.status===200,`status=${r.status}`)}catch(e){add('sitemap HTTP 200',false,e.message)}
try{const r=await get('/robots.txt');robotsText=await r.text();add('robots HTTP 200',r.status===200,`status=${r.status}`)}catch(e){add('robots HTTP 200',false,e.message)}
const sitemapUrls=[...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decode(m[1]));
const sitemapRoutes=[...new Set(sitemapUrls.map(normPath).filter(Boolean))];
add('sitemap has no duplicate URLs',sitemapRoutes.length===sitemapUrls.length,`unique=${sitemapRoutes.length}; total=${sitemapUrls.length}`);
add('sitemap only uses production canonical origin',sitemapUrls.every(u=>u.startsWith(canonicalOrigin+'/')||u===canonicalOrigin),`count=${sitemapUrls.length}`);
const privatePaths=['/jobs','/job-core','/supplier-intelligence','/release-center','/readiness-audit','/command-center','/enterprise-dashboard','/digital-twin','/vault','/operations','/file-manifest','/production-archive'];
add('private workspace pages are absent from sitemap',privatePaths.every(p=>!sitemapRoutes.includes(p)));
add('robots advertises sitemap',/Sitemap:\s*https:\/\/printpreplab\.pages\.dev\/sitemap\.xml/i.test(robotsText));
add('robots does not block ads.txt',!/Disallow:\s*\/ads\.txt/i.test(robotsText));

// ads.txt must be a crawlable root resource; format check is structural, not an account-state claim.
try{const r=await get('/ads.txt');const t=(await r.text()).trim();add('ads.txt HTTP 200',r.status===200,`status=${r.status}`);add('ads.txt has valid Google seller line',/^google\.com,\s*pub-\d+,\s*DIRECT,\s*f08c47fec0942fa0$/mi.test(t),t.split('\n')[0]||'empty')}catch(e){add('ads.txt available',false,e.message)}

// Check every discovered static or sitemap route. This is the exhaustive route inventory for this artifact.
const discovered=[...new Set([...staticRoutes.keys(),...sitemapRoutes])].sort();
const routeRecords=[];
for(const route of discovered){
  try{
    const r=await get(route);const text=await r.text();const finalPath=normPath(r.url.replace(base,canonicalOrigin));
    const ok=r.status===200;routeRecords.push({route,status:r.status,finalUrl:r.url,source:[staticRoutes.has(route)?'static':null,sitemapRoutes.includes(route)?'sitemap':null].filter(Boolean)});add(`HTTP ${route}`,ok,`status=${r.status}`);
    if(sitemapRoutes.includes(route)){
      const m=text.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)||text.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
      const expected=canonicalOrigin+(route==='/'?'/':route);
      add(`canonical ${route}`,!!m&&new URL(decode(m[1]),canonicalOrigin).toString()===new URL(expected).toString(),m?decode(m[1]):'missing');
    }
  }catch(e){routeRecords.push({route,error:e.message});add(`HTTP ${route}`,false,e.message)}
}
fs.writeFileSync(path.join(outDir,'discovered-routes.json'),JSON.stringify({base,artifactDir,staticCount:staticRoutes.size,sitemapCount:sitemapRoutes.length,discoveredCount:discovered.length,routes:routeRecords},null,2));

// Every private state surface must expose noindex to crawlers rather than relying on sitemap omission alone.
for(const route of privatePaths){
  if(!staticRoutes.has(route)) continue;
  const source=fs.readFileSync(path.join(artifactDir,staticRoutes.get(route)),'utf8');
  add(`noindex ${route}`,/<meta[^>]+name=["']robots["'][^>]+content=["']noindex,follow["']/i.test(source)||/<meta[^>]+content=["']noindex,follow["'][^>]+name=["']robots["']/i.test(source));
}

// Internal-link crawl from every static HTML file. Fragments stay on their base path.
const links=new Set();
for(const name of htmlFiles){const source=fs.readFileSync(path.join(artifactDir,name),'utf8');for(const m of source.matchAll(/href=["']([^"']+)["']/gi)){const href=decode(m[1]);if(!href.startsWith('/')||href.startsWith('//')||href.startsWith('/admin'))continue;const p=href.split('#')[0].split('?')[0]||'/';links.add(p)}}
const linkRecords=[];
for(const route of [...links].sort()){
  try{const r=await get(route);linkRecords.push({route,status:r.status,finalUrl:r.url});add(`internal link ${route}`,r.status===200,`status=${r.status}`)}catch(e){linkRecords.push({route,error:e.message});add(`internal link ${route}`,false,e.message)}
}
fs.writeFileSync(path.join(outDir,'internal-links.json'),JSON.stringify({count:links.size,links:linkRecords},null,2));

// Legacy compatibility aliases should redirect, not masquerade as current search entries.
const aliases=['/workflow','/tools/best-print-size-finder','/tools/mat-frame-calculator','/tools/poster-tiling-calculator','/tools/saddle-stitch-booklet-calculator','/guides/best-file-format-for-printing','/guides/choose-best-photo-print-size','/guides/mat-frame-sizing-guide','/guides/rgb-vs-cmyk-printing','/guides/saddle-stitch-booklet-page-count','/guides/tiled-poster-printing-guide'];
for(const route of aliases){try{const manual=await get(route,{redirect:'manual'});const location=manual.headers.get('location')||'';add(`legacy alias ${route}`,manual.status>=300&&manual.status<400&&!!location,`status=${manual.status}; location=${location}`);if(location){const final=await fetch(new URL(location,base),{redirect:'follow'});add(`legacy alias target ${route}`,final.status===200,`status=${final.status}; final=${final.url}`)}}catch(e){add(`legacy alias ${route}`,false,e.message)}}

// Browser-level UX, mobile and language checks.
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
  let context=await browser.newContext({viewport:{width:390,height:844}});let page=await context.newPage();
  const sizeRoutes=sitemapRoutes.filter(p=>p.startsWith('/sizes/')&&!p.slice(7).includes('/'));
  for(const route of sizeRoutes){await page.goto(base+route,{waitUntil:'domcontentloaded'});await page.waitForTimeout(120);const m=await page.evaluate(()=>({vw:innerWidth,sw:document.documentElement.scrollWidth,wraps:[...document.querySelectorAll('.data-table-wrap')].map(el=>({cw:el.clientWidth,sw:el.scrollWidth,overflow:getComputedStyle(el).overflowX}))}));add(`mobile width ${route}`,m.sw<=m.vw+1,`scrollWidth=${m.sw}; viewport=${m.vw}`);add(`mobile table containment ${route}`,m.wraps.length>0&&m.wraps.every(x=>x.sw<=x.cw+1||['auto','scroll'].includes(x.overflow)),JSON.stringify(m.wraps))}
  await context.close();

  context=await browser.newContext({viewport:{width:1280,height:900}});page=await context.newPage();
  await page.goto(base+'/tools/pixels-to-print-size',{waitUntil:'domcontentloaded'});await page.waitForTimeout(150);
  add('tool labels prefilled values as examples',await page.locator('.example-input-note').count()===1);
  const numeric=page.locator('input[type="number"]').first();await numeric.fill('');await page.waitForTimeout(60);add('blank numeric input is explicitly invalid',await numeric.getAttribute('aria-invalid')==='true');add('invalid numeric input shows guidance',await page.locator('.field-error').first().isVisible());const bodyText=await page.locator('body').innerText();add('invalid input does not render NaN/Infinity',!/\b(?:NaN|Infinity)\b/.test(bodyText));

  // Static-language runtime: same content must remain legible in EN and AR.
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});await page.waitForTimeout(120);const lang=page.locator('[data-lang]').first();if(await lang.count()){await lang.selectOption('ar');await page.waitForTimeout(100);add('home switches to Arabic direction',(await page.locator('html').getAttribute('dir'))==='rtl');add('home Arabic audience copy visible',(await page.locator('body').innerText()).includes('لمن صُمم؟'));await lang.selectOption('en');await page.waitForTimeout(100);add('home switches back to English direction',(await page.locator('html').getAttribute('dir'))==='ltr');add('home English audience copy visible',(await page.locator('body').innerText()).includes('Who is it for?'))}else add('home language control exists',false,'[data-lang] missing');

  // Reload/cache regression: structured blocker remains true after reload; mutable JS must revalidate and identify this build.
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});await page.evaluate(prefix=>{localStorage.clear();localStorage.setItem(prefix+'qa-summary-v1',JSON.stringify({total:1,pass:1,review:0,blocker:0}));localStorage.setItem(prefix+'stock-last-v1',JSON.stringify({state:'SHORT'}))},'print-prep-lab-');await page.goto(base+'/digital-twin',{waitUntil:'domcontentloaded'});await page.waitForTimeout(120);add('real blocker visible before reload',(await page.locator('#dt-health').innerText()).trim()==='BLOCKED');await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(120);add('real blocker survives reload',(await page.locator('#dt-health').innerText()).trim()==='BLOCKED');
}finally{await browser.close()}

try{const r=await get('/enterprise-suite.js');const text=await r.text();const cc=r.headers.get('cache-control')||'';add('enterprise-suite revalidates instead of serving stale long cache',/max-age=0/i.test(cc)&&/must-revalidate/i.test(cc),cc);add('enterprise-suite carries final build marker',text.includes('ppl-final-build-marker:'),text.match(/ppl-final-build-marker:([^*\s]+)/)?.[1]||'missing')}catch(e){add('enterprise-suite cache/build marker',false,e.message)}

fs.writeFileSync(path.join(outDir,'final-site-audit.json'),JSON.stringify({generatedAt:new Date().toISOString(),base,summary:{checks:results.length,passed:results.filter(x=>x.ok).length,failed:failures.length,staticPages:staticRoutes.size,sitemapPages:sitemapRoutes.length,discoveredPages:discovered.length,internalLinks:links.size},failures,results},null,2));
if(failures.length){console.error(`FINAL AUDIT FAILED: ${failures.length} checks`);process.exit(1)}
console.log(`FINAL AUDIT PASS: ${results.length} checks; ${discovered.length} discovered routes; ${links.size} internal targets; ${sitemapRoutes.filter(p=>p.startsWith('/sizes/')).length} size routes.`);
