import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=process.argv[2]||'http://127.0.0.1:4175';
const outDir=process.argv[3]||'/tmp/final-readiness-qa';
fs.mkdirSync(outDir,{recursive:true});
const prefix='print-prep-lab-';
const results=[];
const check=(name,ok,detail='')=>{if(!ok)throw new Error(`${name}${detail?`: ${detail}`:''}`);results.push({name,ok:true,detail});console.log(`PASS ${name}${detail?` — ${detail}`:''}`)};
const browser=await chromium.launch({headless:true,channel:'chrome'});
let context,page,storageState;
const viewport={width:1440,height:1000};
function wire(p){p.on('pageerror',e=>console.log('BROWSER pageerror:',e.message));}
async function resetContext(vp=viewport){if(context)await context.close();context=await browser.newContext({viewport:vp,storageState});page=await context.newPage();wire(page)}
async function seed(data={},raw={},lang='en',vp=viewport){storageState=undefined;await resetContext(vp);let res=await page.goto(base+'/',{waitUntil:'domcontentloaded'});if(!res||res.status()!==200)throw new Error(`seed / -> ${res?.status()}`);await page.evaluate(({data,raw,prefix,lang})=>{localStorage.clear();for(const [k,v] of Object.entries(data))localStorage.setItem(prefix+k,JSON.stringify(v));for(const [k,v] of Object.entries(raw))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));localStorage.setItem('print-prep-lab-language',lang);localStorage.setItem('ppl-interface-language',lang);},{data,raw,prefix,lang});storageState=await context.storageState();await resetContext(vp)}
async function open(route){const res=await page.goto(base+route,{waitUntil:'domcontentloaded'});console.log(`NAV ${route} -> ${res?.status()} ${page.url()}`);if(!res||res.status()!==200)throw new Error(`${route} -> ${res?.status()}`);await page.waitForTimeout(400)}
async function readLocal(key){return page.evaluate(key=>{const v=localStorage.getItem(key);return v?JSON.parse(v):null},key)}
async function pRead(key){return readLocal(prefix+key)}
async function shot(name){await page.screenshot({path:path.join(outDir,name),fullPage:true})}
const provider=(id,name,eligibility,score)=>({id,name,cap:score,quality:score,lead:score,price:score,risk:100-score,...(eligibility?{eligibility}:{})});
const job=(id,name,qty)=>({schema:'print-prep-lab-job',version:1,id,name,provider:'',product:'Poster',quantity:qty,due:'',priority:'Normal',notes:'',stages:{brief:false,specs:false,files:false,preflight:false,quote:false,signoff:false},createdAt:'2026-09-17T00:00:00Z',updatedAt:'2026-09-17T00:00:00Z'});
try{
  await seed({'enterprise-suppliers-v1':[provider('bad','High score but ineligible','ineligible',100),provider('good','Eligible lower score','eligible',70)]});
  await open('/supplier-intelligence');
  let summary=await pRead('supplier-intelligence-last-v1');
  check('supplier ranks only eligible providers',summary?.best?.name==='Eligible lower score',`best=${summary?.best?.name}`);
  check('supplier fixed weights are explicit',JSON.stringify(summary?.weights)===JSON.stringify({capability:35,quality:25,leadTime:15,price:15,risk:10}));
  check('supplier page does not claim editable weights',!(await page.locator('body').innerText()).toLowerCase().includes('user-controlled weights'));
  await seed({'enterprise-suppliers-v1':[provider('x','Only ineligible','ineligible',95)]});await open('/supplier-intelligence');
  check('no eligible supplier means no best',(await pRead('supplier-intelligence-last-v1'))?.best===null);
  check('all ineligible is a real blocker',await page.evaluate(()=>window.PPLStatusRules.evaluate('supplier',JSON.parse(localStorage.getItem('print-prep-lab-supplier-intelligence-last-v1'))).state)==='BLOCK');
  const legacyProviders=[{id:'legacy',name:'Legacy supplier',cap:90,quality:90,lead:90,price:90,risk:10}];
  await seed({'enterprise-suppliers-v1':legacyProviders});await open('/supplier-intelligence');
  check('legacy supplier source is not rewritten',!Object.prototype.hasOwnProperty.call((await pRead('enterprise-suppliers-v1'))[0],'eligibility'));
  check('legacy supplier remains unresolved',await page.evaluate(()=>window.PPLStatusRules.evaluate('supplier',JSON.parse(localStorage.getItem('print-prep-lab-supplier-intelligence-last-v1'))).state)==='UNRESOLVED');

  const jobs=[job('job-a','Job A',10),job('job-b','Job B',20)];
  await seed({}, {'print-prep-lab-jobs-v1':jobs});await open('/jobs');
  check('two jobs rendered',await page.locator('#jc-jobs [data-id]').count()===2);
  await page.locator('[data-id="job-b"] [data-select]').click();
  check('job B selection stored',(await readLocal('print-prep-lab-selected-job-id-v1'))==='job-b');
  storageState=await context.storageState();await resetContext();await open('/job-core');
  check('selected job B populates Job Core',(await page.locator('#ec-name').inputValue())==='Job B');
  await page.locator('#ec-size').fill('420 × 594 mm');await page.locator('#ec-save').click();await page.waitForTimeout(200);
  let coreMap=await pRead('enterprise-job-cores-v2');
  check('job B core saved by jobId',coreMap?.['job-b']?.jobId==='job-b'&&coreMap['job-b'].trim==='420 × 594 mm');
  storageState=await context.storageState();await resetContext();await open('/jobs');await page.locator('[data-id="job-a"] [data-select]').click();storageState=await context.storageState();await resetContext();await open('/job-core');
  check('switching to job A changes Job Core',(await page.locator('#ec-name').inputValue())==='Job A');
  await page.locator('#ec-material').fill('Uncoated stock');await page.locator('#ec-save').click();await page.waitForTimeout(200);
  coreMap=await pRead('enterprise-job-cores-v2');check('job A core saved separately',coreMap?.['job-a']?.material==='Uncoated stock');
  storageState=await context.storageState();await resetContext();await open('/jobs');await page.locator('[data-id="job-b"] [data-select]').click();storageState=await context.storageState();await resetContext();await open('/job-core');
  check('job B update survives switching',(await page.locator('#ec-size').inputValue())==='420 × 594 mm');
  await seed({});await open('/job-core');
  check('empty Job Core does not show sample user data',(await page.locator('#ec-name').inputValue())===''&&!(await page.locator('body').innerText()).includes('Sample print job'));
  const legacyCore={schema:'ppl-enterprise-job',version:1,id:'legacy-core',name:'Legacy Core Job',revision:'R3',quantity:33,trim:'A3',material:'Legacy stock',deadline:'',note:'kept',updatedAt:'2026-09-01T00:00:00Z'};
  await seed({'enterprise-job-core-v1':legacyCore});await open('/job-core');
  check('legacy Job Core remains visible',(await page.locator('#ec-name').inputValue())==='Legacy Core Job');
  check('legacy Job Core is unchanged on read',JSON.stringify(await pRead('enterprise-job-core-v1'))===JSON.stringify(legacyCore));

  const sizes=['a2','a3','a4','a5','us-letter','us-legal','4x6-photo','5x7-photo','8x10-photo','11x14-photo','12x18-photo','16x20-photo'];
  await seed({}, {}, 'en', {width:390,height:844});
  for(const s of sizes){await open('/sizes/'+s);const m=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,wrap:[...document.querySelectorAll('.data-table-wrap')].every(x=>x.scrollWidth>=x.clientWidth)}));check(`mobile ${s} has no page overflow`,m.sw<=m.cw+1,`${m.sw}/${m.cw}`);check(`mobile ${s} keeps table data scrollable`,m.wrap)}

  await seed({}, {}, 'ar');
  for(const route of ['/','/tools/print-readiness-checker','/jobs','/job-core','/supplier-intelligence']){await open(route);const d=await page.evaluate(()=>({lang:document.documentElement.lang,dir:document.documentElement.dir,arabic:/[\u0600-\u06ff]/.test(document.body.innerText)}));check(`Arabic ${route} uses RTL`,d.lang==='ar'&&d.dir==='rtl');check(`Arabic ${route} exposes Arabic UI`,d.arabic)}
  await shot('final-arabic-critical-flow.png');
  fs.writeFileSync(path.join(outDir,'final-results.json'),JSON.stringify({generatedAt:new Date().toISOString(),base,results},null,2));
} finally {if(context)await context.close();await browser.close()}
