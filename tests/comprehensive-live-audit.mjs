import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {chromium} from 'playwright';

const base=(process.argv[2]||'https://printpreplab.pages.dev').replace(/\/$/,'');
const origin=new URL(base).origin;
const canonicalOrigin='https://printpreplab.pages.dev';
const out=process.argv[3]||'work/comprehensive-audit';
await mkdir(out,{recursive:true});
const checks=[],findings=[],records=[],browserRecords=[],externalLinks=new Map(),internalLinks=new Map();
const check=(name,ok,detail)=>{checks.push({name,ok,detail});if(!ok)findings.push({severity:'error',name,detail});};
const note=(severity,name,detail)=>findings.push({severity,name,detail});
async function batch(items,run,n=6){for(let i=0;i<items.length;i+=n)await Promise.all(items.slice(i,i+n).map(run));}
async function get(path,opts={}){return fetch(new URL(path,base),{redirect:'manual',signal:AbortSignal.timeout(20000),...opts});}
const sitemapResponse=await get('/sitemap.xml');
const sitemap=await sitemapResponse.text();
const publicUrls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const paths=publicUrls.map(u=>new URL(u).pathname);
check('Sitemap HTTP 200',sitemapResponse.status===200);
check('All sitemap URLs use production origin',publicUrls.every(u=>new URL(u).origin===canonicalOrigin));
check('Sitemap URLs are unique',new Set(publicUrls).size===publicUrls.length);
const robotsResponse=await get('/robots.txt');const robots=await robotsResponse.text();
check('robots.txt reachable and declares current sitemap',robotsResponse.status===200&&robots.includes(canonicalOrigin+'/sitemap.xml'),robots);
check('No blanket crawl block',!/^Disallow:\s*\/\s*$/m.test(robots));
const adsResponse=await get('/ads.txt');const ads=await adsResponse.text();
check('ads.txt has the current publisher record',adsResponse.status===200&&/^google\.com,\s*pub-3369551572403499,\s*DIRECT,\s*f08c47fec0942fa0\s*$/m.test(ads),ads.trim());
const worker=await readFile(new URL('../worker/index.ts',import.meta.url),'utf8');
const table=worker.match(/const STATIC_PAGE_ROUTES[^=]*=\s*\{([\s\S]*?)\n\};/)?.[1];
const retained=[...table.matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map(m=>m[1]);
const publicPaths=[...new Set([...paths,'/glossary'])];
await batch([...publicPaths.map(path=>({path,public:true})),...retained.filter(p=>p!=='/glossary').map(path=>({path,public:false}))],async item=>{
  try{
    const start=performance.now(),r=await get(item.path),html=await r.text();
    records.push({...item,status:r.status,headers:Object.fromEntries(r.headers),bytes:Buffer.byteLength(html),requestMs:Math.round(performance.now()-start),html});
    check('HTML reachable '+item.path,r.status===200&&/text\/html/.test(r.headers.get('content-type')||''));
    const noindex=/noindex/i.test(r.headers.get('x-robots-tag')||'')||/<meta(?=[^>]*name="robots")(?=[^>]*content="[^"]*noindex)/i.test(html);
    check('Indexing intent '+item.path,item.public?!noindex:noindex);
    check('Single H1 '+item.path,(html.match(/<h1\b/g)||[]).length===1);
    check('Canonical '+item.path,html.includes('href="'+canonicalOrigin+item.path+'"')&&html.includes('rel="canonical"'));
    if(base.startsWith('https:'))check('Security headers '+item.path,r.headers.get('x-content-type-options')==='nosniff'&&r.headers.get('x-frame-options')==='DENY'&&!!r.headers.get('content-security-policy')&&!!r.headers.get('strict-transport-security'));
    if(!item.public)check('No ads on workspace '+item.path,!html.includes('pagead2.googlesyndication'));
    if(item.public&&item.path!=='/glossary'){
      check('AdSense publisher matches '+item.path,html.includes('adsbygoogle.js?client=ca-pub-3369551572403499'));
      check('Readable source without JavaScript '+item.path,/<main\b/.test(html)&&!/<main[^>]*>\s*<\/main>/.test(html));
      check('No stale preview references '+item.path,!/printprep-review\.nadir-geu|localhost:|127\.0\.0\.1:/.test(html));
    }
  }catch(e){note('error','Request '+item.path,e.message);}
});
await batch(['/audit-not-found-20261002','/guides/audit-not-found-20261002','/tools/audit-not-found-20261002'],async p=>{
  const r=await get(p);check('True 404 '+p,r.status===404&&/noindex/.test(r.headers.get('x-robots-tag')||''));
});
const redirect=await fetch('http://printpreplab.pages.dev/',{redirect:'manual',signal:AbortSignal.timeout(20000)});
check('HTTP redirects to HTTPS',[301,302,307,308].includes(redirect.status)&&redirect.headers.get('location')?.startsWith(canonicalOrigin));
await writeFile(join(out,'http-inventory.json'),JSON.stringify(records.map(({html,...r})=>r),null,2));
await writeFile(join(out,'current-home.html'),records.find(r=>r.path==='/')?.html||'');
const require=createRequire(import.meta.url),axe=await readFile(require.resolve('axe-core/axe.min.js'),'utf8');
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],failedAssets=[],timings=[];
try{
  for(const viewport of [{width:1440,height:1000,lang:'en'},{width:360,height:800,lang:'ar'}]){
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push({path:new URL(page.url()).pathname,viewport:viewport.width,error:e.message}));
    page.on('response',r=>{if(new URL(r.url()).origin===origin&&r.status()>=400)failedAssets.push({page:page.url(),url:r.url(),status:r.status()});});
    for(const path of publicPaths){
      await page.goto(base+path,{waitUntil:'networkidle',timeout:30000});
      const selector=page.locator('select[data-source-lang],select[data-lang]').first();
      if(await selector.count())await selector.selectOption(viewport.lang);
      await page.waitForTimeout(80);
      const data=await page.evaluate(()=>{
        const main=document.querySelector('main')||document.body;
        const visible=el=>!!(el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
        const text=main.innerText;
        const links=[...document.querySelectorAll('a[href]')].map(a=>({url:a.href,label:a.innerText.trim(),target:a.target,rel:a.rel}));
        const headings=[...main.querySelectorAll('h1,h2,h3')].filter(visible).map(el=>({level:Number(el.tagName[1]),text:el.innerText}));
        const forms=[...main.querySelectorAll('input,select,textarea,button')].filter(visible).map(el=>({tag:el.tagName,type:el.type,label:el.getAttribute('aria-label')||el.labels?.[0]?.innerText||el.innerText}));
        const untranslated=[...main.querySelectorAll('[data-en]')].filter(el=>visible(el)&&!el.hasAttribute('data-ar')&&el.innerText.trim()).map(el=>el.innerText.slice(0,160));
        const jsonLd=[...document.querySelectorAll('script[type="application/ld+json"]')].map(el=>{try{return JSON.parse(el.textContent)}catch(e){return {invalid:e.message}}});
        const nav=performance.getEntriesByType('navigation')[0];
        return {title:document.title,description:document.querySelector('meta[name="description"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href,lang:document.documentElement.lang,dir:document.documentElement.dir,width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,text,headings,links,forms,untranslated,jsonLd,navigation:{ttfbMs:Math.round(nav.responseStart),domMs:Math.round(nav.domContentLoadedEventEnd)},images:[...document.images].map(i=>({src:i.src,alt:i.getAttribute('alt'),complete:i.complete,width:i.naturalWidth})),emptyLinks:links.filter(l=>!l.label).map(l=>l.url)};
      });
      check('Correct rendered language '+path+' '+viewport.width,data.lang===viewport.lang&&data.dir===(viewport.lang==='ar'?'rtl':'ltr'));
      check('No horizontal page overflow '+path+' '+viewport.width,data.scrollWidth<=data.width+1,{width:data.width,scrollWidth:data.scrollWidth});
      check('Description exists '+path,!!data.description&&data.description.length>20);
      check('JSON-LD valid '+path,data.jsonLd.every(x=>!x.invalid));
      check('Loaded images '+path+' '+viewport.width,data.images.every(i=>i.complete&&i.width>0),data.images.filter(i=>!i.complete||!i.width));
      if(/Print Prep Lab\s*\|\s*Print Prep Lab/.test(data.title))note('minor','Repeated brand in title '+path,data.title);
      if(viewport.lang==='ar'&&data.untranslated.length)note('review','Incomplete Arabic labels '+path,data.untranslated);
      for(const link of data.links){
        const u=new URL(link.url);if(!/^https?:$/.test(u.protocol))continue;
        if(u.origin===origin){const key=u.pathname+u.hash;if(!internalLinks.has(key))internalLinks.set(key,[]);internalLinks.get(key).push(path);}
        else {u.hash='';if(!externalLinks.has(u.href))externalLinks.set(u.href,[]);externalLinks.get(u.href).push(path);}
      }
      await page.addScriptTag({content:axe});
      const a11y=await page.evaluate(async()=>{
        const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
        return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,help:v.help,helpUrl:v.helpUrl,nodes:v.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.length})),passes:r.passes.length};
      });
      if(a11y.violations.length)note('accessibility','Automated WCAG findings '+path+' '+viewport.width,a11y.violations);
      const words=data.text.trim().split(/\s+/).length;
      browserRecords.push({path,viewport:viewport.width,language:viewport.lang,words,...data,a11y});
      timings.push({path,viewport:viewport.width,...data.navigation});
      if(['/','/tools/pdf-print-preflight','/guides/dpi-vs-ppi','/guides/prepare-pdf-for-print','/contact','/privacy','/sizes/a4'].includes(path))await page.screenshot({path:join(out,`live-${viewport.width}-${path.replaceAll('/','_')||'home'}.png`),fullPage:true});
      console.log(JSON.stringify({page:path,viewport:viewport.width,words,a11yViolations:a11y.violations.map(v=>v.id),overflow:data.scrollWidth>data.width+1}));
    }
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:320,height:780}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage();
  for(const width of [320,768])for(const path of ['/','/tools','/tools/pdf-print-preflight','/tools/bleed-safe-area-calculator','/guides/bleed-trim-safe-area','/sizes/a4']){
    await page.setViewportSize({width,height:900});await page.goto(base+path,{waitUntil:'networkidle'});
    for(const lang of ['ar','en']){
      await page.locator('select[data-source-lang]').selectOption(lang);
      const size=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
      check('Extra viewport '+path+' '+width+' '+lang,size.scroll<=size.width+1,size);
    }
  }
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/',{waitUntil:'networkidle'});
  await page.addStyleTag({content:'html { font-size: 200% !important; }'});
  const enlarged=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  check('200% root text size home containment',enlarged.scroll<=enlarged.width+1,enlarged);
  await page.screenshot({path:join(out,'live-home-root-text-200percent.png'),fullPage:true});
  await context.close();

  const privacyContext=await browser.newContext({viewport:{width:1280,height:900}});
  const requests=[];
  await privacyContext.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){requests.push(route.request().url());return route.abort();}return route.continue();});
  const privacyPage=await privacyContext.newPage();await privacyPage.goto(base+'/',{waitUntil:'networkidle'});
  check('Clarity not requested before consent',!requests.some(u=>u.includes('clarity.ms')));
  await privacyPage.locator('.privacy-choice-actions button').nth(1).click();
  await privacyPage.reload({waitUntil:'networkidle'});
  check('Analytics decline persists',await privacyPage.evaluate(()=>localStorage.getItem('print-prep-analytics-consent'))==='denied'&&!requests.some(u=>u.includes('clarity.ms')));
  await privacyPage.locator('.footer-bottom button').click();await privacyPage.locator('.privacy-choice-actions .allow').click();
  await privacyPage.waitForTimeout(150);
  check('Clarity requested only after Allow',requests.some(u=>u.includes('clarity.ms/tag/')));
  await privacyPage.locator('.footer-bottom button').click();await privacyPage.locator('.privacy-choice-actions button').nth(1).click();
  check('Analytics withdrawal persists',await privacyPage.evaluate(()=>localStorage.getItem('print-prep-analytics-consent'))==='denied');
  await writeFile(join(out,'privacy-consent.json'),JSON.stringify({requests,storage:await privacyPage.evaluate(()=>({...localStorage})),cookies:await privacyContext.cookies()},null,2));
  await privacyContext.close();
}finally{await browser.close();}
check('No uncaught page JavaScript errors',errors.length===0,errors);
check('No failed same-origin assets',failedAssets.length===0,failedAssets);
const linkResults=[];
await batch([...internalLinks],async([target,sources])=>{
  const u=new URL(target,base);let r=await get(u.pathname);let final=u.pathname;
  for(let i=0;i<5&&[301,302,307,308].includes(r.status);i++){
    const destination=new URL(r.headers.get('location'),base);if(destination.origin!==origin){final=destination.href;break;}final=destination.pathname;r=await get(final);
  }
  const html=await r.text();const external=final.startsWith('http');
  const fragment=decodeURIComponent(u.hash.slice(1));
  const validFragment=!fragment||external||new RegExp('(?:id|name)=["\']'+fragment.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'["\']').test(html);
  linkResults.push({target,status:r.status,final,validFragment,sources:[...new Set(sources)]});
  if(!external)check('Internal link '+target,r.status===200,{status:r.status,sources:[...new Set(sources)]});
  if(!validFragment)note('minor','Missing link fragment '+target,[...new Set(sources)]);
});
const externalResults=[];
await batch([...externalLinks],async([url,sources])=>{
  try{
    const r=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(20000),headers:{'User-Agent':'PrintPrepLab-LinkAudit/1.0'}});
    externalResults.push({url,status:r.status,final:r.url,sources:[...new Set(sources)]});
    if([404,410].includes(r.status))note('broken-reference','External reference missing '+url,{status:r.status,sources:[...new Set(sources)]});
    else if(r.status>=400)note('unverified-reference','External reference blocks automated checking '+url,r.status);
    await r.body?.cancel();
  }catch(e){externalResults.push({url,error:e.message,sources:[...new Set(sources)]});note('unverified-reference','External reference could not be checked '+url,e.message);}
},4);
const english=browserRecords.filter(r=>r.language==='en');
const duplicates=new Map();
for(const r of english){const h=createHash('sha256').update(r.text).digest('hex');if(duplicates.has(h))note('error','Exact duplicate visible main text',{a:duplicates.get(h),b:r.path});duplicates.set(h,r.path);}
const summary={generatedAt:new Date().toISOString(),base,publicSitemapPages:paths.length,additionalPublicPages:publicPaths.length-paths.length,retainedPages:retained.length-1,httpPages:records.length,renderedLanguageViews:browserRecords.length,checks:checks.length,failedChecks:checks.filter(c=>!c.ok).length,findingsBySeverity:Object.fromEntries([...new Set(findings.map(f=>f.severity))].map(s=>[s,findings.filter(f=>f.severity===s).length])),internalLinkTargets:linkResults.length,externalReferences:externalResults.length};
await writeFile(join(out,'comprehensive-audit.json'),JSON.stringify({summary,checks,findings,errors,failedAssets,timings,internalLinks:linkResults,externalReferences:externalResults,pages:browserRecords},null,2));
console.log('AUDIT_SUMMARY '+JSON.stringify(summary));
// Preserve all findings for editorial review instead of hiding them behind the
// first assertion. A successful audit execution is not an AdSense approval.

if(process.env.PRINTPREP_AUDIT_GATE==='1' && findings.some(f=>['error','accessibility','review'].includes(f.severity)))process.exitCode=1;
