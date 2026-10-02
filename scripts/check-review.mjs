import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {build} from 'esbuild';
const contentBundle=await build({stdin:{contents:`export {GUIDE_PAGES,SIZE_USE_CASES,TRUST_PAGES} from './lib/site-content'; export {TRUST_EVIDENCE} from './lib/trust-evidence'; export {TRUST_ARABIC,TRUST_EVIDENCE_ARABIC} from './lib/trust-arabic'; export {SIZE_ARABIC} from './lib/size-arabic'; export {FEATURED_SIZE_CONTENT} from './lib/size-editorial-content'; export {EDITORIAL_GUIDES} from './lib/editorial-guides'; export {CORE_GUIDE_ARABIC_DETAILS} from './lib/core-guide-arabic-details';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {GUIDE_PAGES,EDITORIAL_GUIDES,CORE_GUIDE_ARABIC_DETAILS,SIZE_USE_CASES,SIZE_ARABIC,FEATURED_SIZE_CONTENT,TRUST_PAGES,TRUST_EVIDENCE,TRUST_ARABIC,TRUST_EVIDENCE_ARABIC}=await import('data:text/javascript;base64,'+Buffer.from(contentBundle.outputFiles[0].text).toString('base64'));
let translatedParagraphs=0;
for(const guide of GUIDE_PAGES){
  const ar=EDITORIAL_GUIDES.find(g=>g.slug===guide.slug)?.ar??CORE_GUIDE_ARABIC_DETAILS[guide.slug];
  assert.ok(ar,guide.slug+' Arabic body');
  assert.equal(ar.summary.length,guide.summary.length,guide.slug+' summary coverage');
  assert.equal(ar.comparison.headers.length,guide.comparison.headers.length,guide.slug+' table header coverage');
  assert.equal(ar.comparison.rows.length,guide.comparison.rows.length,guide.slug+' table row coverage');
  guide.comparison.rows.forEach((row,i)=>assert.equal(ar.comparison.rows[i].length,row.length,guide.slug+' table cells'));
  assert.equal(ar.sections.length,guide.sections.length,guide.slug+' section coverage');
  guide.sections.forEach((section,i)=>{assert.equal(ar.sections[i].paragraphs.length,section.paragraphs.length,guide.slug+' paragraph coverage');assert.match(ar.sections[i].heading,/[\u0600-\u06ff]/);for(const paragraph of ar.sections[i].paragraphs){assert.match(paragraph,/[\u0600-\u06ff]/);translatedParagraphs++;}});
}
const worker=(await import('../dist/server/index.js')).default;
const root=resolve(process.env.PRINTPREP_ASSET_DIR ?? 'dist/client');
// Match Pages HTML routing instead of treating the ASSETS binding as a raw file reader.
const env={ASSETS:{async fetch(request){const path=new URL(request.url).pathname;
  if(path.endsWith('.html'))return new Response(null,{status:308,headers:{location:path.slice(0,-5)}});
  const assetPath=extname(path)?path:path.replace(/\/$/,'')+'.html';
  try {const data=await readFile(resolve(root,'.'+assetPath));return new Response(request.method==='HEAD'?null:data,{headers:{'content-type':extname(assetPath)==='.html'?'text/html; charset=utf-8':'application/octet-stream'}})}catch{return new Response('Not found',{status:404})}}}};
const ctx={waitUntil(){},passThroughOnException(){}};
const guides=['dpi-vs-ppi','how-large-can-i-print-my-image','print-resolution-guide','bleed-trim-safe-area','aspect-ratio-cropping-print','print-file-preflight-checklist','export-images-for-large-format-printing','a4-vs-us-letter-printing','rgb-vs-cmyk-printing','prepare-pdf-for-print','low-resolution-images-for-print','business-card-bleed-and-safe-area'];
const tools=['pdf-print-preflight','print-readiness-checker','pixels-to-print-size','print-size-to-pixels','dpi-ppi-calculator','paper-size-pixels-calculator','aspect-ratio-crop-preview','bleed-safe-area-calculator'];
const sizes=['a2','a3','a4','a5','us-letter','us-legal','4x6-photo','5x7-photo','8x10-photo','11x14-photo','12x18-photo','16x20-photo'];
const routes=new Set(['/', '/tools','/guides','/sizes','/about','/methodology','/sources','/editorial-policy','/privacy','/terms','/contact','/glossary','/workspace','/jobs','/vault','/command-center','/operations','/job-costing','/supplier-intelligence','/release-center','/production-analytics',...guides.map(s=>'/guides/'+s),...tools.map(s=>'/tools/'+s),...sizes.map(s=>'/sizes/'+s)]);
const htmls=new Map();
async function get(path){const r=await worker.fetch(new Request('https://printprep-review.example'+path,{headers:{accept:'text/html'}}),env,ctx);assert.equal(r.status,200,path);return {r,html:await r.text()};}
for(const path of routes){const {r,html}=await get(path);assert.ok(html.includes('<h1'),path+' heading');if(r.headers.get('x-robots-tag')?.includes('noindex'))assert.ok(!html.includes('pagead2.googlesyndication'),path+' operational page has no ads');if(['/workspace','/jobs','/vault','/command-center','/operations','/job-costing','/supplier-intelligence','/release-center','/production-analytics'].includes(path))assert.match(r.headers.get('x-robots-tag')??'',/noindex/,path);htmls.set(path,html);}
for(const path of ['/',...guides.map(s=>'/guides/'+s),...tools.map(s=>'/tools/'+s),...sizes.map(s=>'/sizes/'+s)]){
  const response=await worker.fetch(new Request('https://printprep-review.example'+path),env,ctx);
  assert.doesNotMatch(response.headers.get('x-robots-tag')??'',/noindex/i,path+' public indexing header');
}
const home=htmls.get('/');assert.match(home,/Better print decisions/);assert.match(home,/500 PPI/);assert.match(home,/أمثلة محسوبة/);assert.ok(!home.includes('home-v112.html'));
for(const slug of guides){const html=htmls.get('/guides/'+slug);assert.ok(html.includes(slug),slug);if(guides.indexOf(slug)<8)assert.match(html,/WORKED EXAMPLE/);else{assert.match(html,/data-ar=/);assert.ok(html.includes('Updated October 2, 2026'));}const ar=EDITORIAL_GUIDES.find(g=>g.slug===slug)?.ar??CORE_GUIDE_ARABIC_DETAILS[slug];for(const section of ar.sections){assert.ok(html.includes(section.heading),slug+' translated heading rendered');for(const paragraph of section.paragraphs)assert.ok(html.includes(paragraph.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')),slug+' translated paragraph rendered');}}
let translatedSizeParagraphs=0;
const attributeText = s => s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll("'",'&#x27;');
let translatedTrustParagraphs=0;
for(const [slug,page] of Object.entries(TRUST_PAGES)){
  const ar=TRUST_ARABIC[slug];const html=htmls.get('/'+slug);assert.ok(ar,slug+' Arabic policy');
  assert.equal(ar.sections.length,page.sections.length,slug+' policy section coverage');
  const translations=[ar.title,ar.description];
  page.sections.forEach((section,index)=>{
    const translated=ar.sections[index];assert.equal(translated.paragraphs.length,section.paragraphs.length,slug+' policy paragraph coverage');
    translations.push(translated.heading,...translated.paragraphs);translatedTrustParagraphs+=translated.paragraphs.length;
  });
  const evidence=TRUST_EVIDENCE[slug];
  if(evidence){const translated=TRUST_EVIDENCE_ARABIC[slug];assert.equal(translated.links.length,evidence.links.length,slug+' evidence links');translations.push(translated.heading,translated.intro,...translated.links.flatMap(link=>[link.label,link.description]));}
  for(const translated of translations){assert.match(translated,/[\u0600-\u06ff]/);assert.ok(html.includes('data-ar="'+attributeText(translated)+'"'),slug+' translated policy text rendered');}
}
for(const slug of sizes){
  const html=htmls.get('/sizes/'+slug);assert.match(html,/WORKED PRINT SETUP/);
  const ar=SIZE_ARABIC[slug];const featured=FEATURED_SIZE_CONTENT[slug];assert.ok(ar,slug+' Arabic size');
  assert.equal(ar.useCase.paragraphs.length,SIZE_USE_CASES[slug].paragraphs.length,slug+' use-case coverage');
  assert.equal(ar.insights.length,featured.insights.length,slug+' insight coverage');
  const translations=[ar.label,ar.uses+'.',ar.note,ar.useCase.heading,...ar.useCase.paragraphs,ar.extraFaq.question,ar.extraFaq.answer,...ar.insights.flatMap(i=>[i.label,i.heading,i.text,...(i.linkLabel?[i.linkLabel]:[])])];
  for(const translated of translations){assert.match(translated,/[\u0600-\u06ff]/);assert.ok(html.includes('data-ar="'+attributeText(translated)+'"'),slug+' Arabic text rendered: '+translated.slice(0,25));}
  translatedSizeParagraphs+=ar.useCase.paragraphs.length+ar.insights.length;
  for(const phrase of ['العرض','الارتفاع','سياق الاستخدام','منطقة الأمان'])assert.ok(html.includes(phrase),slug+' localized table/setup');
}
const links=new Set();for(const html of htmls.values())for(const m of html.matchAll(/href="(\/[^"#?]*)(?:[?#][^"]*)?"/g)){const p=m[1];if(p&&!p.includes('.')&&!p.startsWith('/_'))links.add(p.replace(/\/$/,'')||'/');}
for(const path of links){if(htmls.has(path))continue;let r=await worker.fetch(new Request('https://printprep-review.example'+path),env,ctx);if(path==='/admin'){assert.equal(r.status,302);continue;}for(let i=0;i<4 && [301,302,307,308].includes(r.status);i++){const location=r.headers.get('location');assert.ok(location.startsWith('https://printprep-review.example/'),'Same-origin redirect '+path);r=await worker.fetch(new Request(location),env,ctx);}assert.equal(r.status,200,'Internal link '+path);}
const sitemap=await worker.fetch(new Request('https://printprep-review.example/sitemap.xml'),env,ctx);const xml=await sitemap.text();for(const g of guides)assert.ok(xml.includes('/guides/'+g),g+' sitemap');for(const path of ['/jobs','/vault','/workspace','/operations'])assert.ok(!xml.includes('https://printpreplab.pages.dev'+path+'<'),path+' excluded from sitemap');
console.log(JSON.stringify({pages:routes.size,internal_links:links.size,guides:guides.length,translated_paragraphs:translatedParagraphs,translated_size_paragraphs:translatedSizeParagraphs,translated_trust_paragraphs:translatedTrustParagraphs,tools:tools.length,sizes:sizes.length,noindex:'operational pages verified',status:'passed'}));
