import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://127.0.0.1:4173';
const outDir = process.argv[3] || '/tmp/phase2a-qa';
fs.mkdirSync(outDir,{recursive:true});
const prefix='print-prep-lab-';
const results=[];
const check=(name,ok,detail='')=>{if(!ok)throw new Error(`${name}${detail?`: ${detail}`:''}`);results.push({name,ok:true,detail});console.log(`PASS ${name}${detail?` — ${detail}`:''}`)};
const qaPass={schema:'print-prep-lab-qa-summary',version:1,total:2,pass:2,review:0,blocker:0,finding:'FAIL appears only in free text'};
const viewport={width:1440,height:1000};

const browser=await chromium.launch({headless:true,channel:'chrome'});
let context=null,page=null,storageState=undefined;
function wire(p){p.on('console',m=>console.log(`BROWSER ${m.type()}: ${m.text()}`));p.on('pageerror',e=>console.log(`BROWSER pageerror: ${e.message}`));}
async function captureAndClose(){
  if(context){storageState=await context.storageState();await context.close();}
  context=null;page=null;
}
async function freshContext(){
  context=await browser.newContext(storageState?{viewport,storageState}:{viewport});
  page=await context.newPage();wire(page);
}
async function seed(data={},lang='en'){
  await captureAndClose();
  storageState=undefined;
  await freshContext();
  const res=await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  if(!res||res.status()!==200)throw new Error(`seed navigation / expected 200, got ${res?.status()}`);
  await page.evaluate(()=>localStorage.clear());
  await page.evaluate(({data,lang,prefix})=>{
    for(const [k,v] of Object.entries(data)) localStorage.setItem(prefix+k,JSON.stringify(v));
    localStorage.setItem(prefix+'language',lang);
    localStorage.setItem('ppl-interface-language',lang);
  },{data,lang,prefix});
  storageState=await context.storageState();
  await context.close();context=null;page=null;
}
async function open(route){
  await captureAndClose();
  await freshContext();
  const res=await page.goto(base+route,{waitUntil:'domcontentloaded'});
  const status=res?.status();
  console.log(`NAV ${route} -> ${status} ${page.url()}`);
  if(!res||status!==200)throw new Error(`navigation ${route} expected 200, got ${status}; url=${page.url()}`);
  await page.waitForTimeout(350);
}
async function text(sel){return (await page.locator(sel).innerText()).trim()}
async function shot(name){await page.screenshot({path:path.join(outDir,name),fullPage:true})}

try{
  await seed({});await open('/digital-twin');
  const firstHealth=await text('#dt-health');
  const runtime=await page.evaluate(()=>({rules:!!window.PPLStatusRules,core:!!window.PPLCore,mode:document.body.dataset.enterpriseMode,scripts:[...document.scripts].map(s=>s.src).filter(Boolean)}));
  console.log('RUNTIME',JSON.stringify(runtime));
  check('clean session is NO DATA',firstHealth==='NO DATA',`actual=${firstHealth}; rules=${runtime.rules}; core=${runtime.core}; mode=${runtime.mode}`);
  check('clean session has zero blockers',(await text('#dt-blockers'))==='0');

  await open('/qa-history');
  check('empty QA History writes zero total',(await text('#q-total'))==='0');
  await open('/digital-twin');
  check('empty QA history is not blocked',(await text('#dt-health'))==='NO DATA');
  check('empty QA history blocker count',(await text('#dt-blockers'))==='0');
  await shot('after-empty-en.png');

  await seed({'qa-summary-v1':qaPass});await open('/digital-twin');
  check('blocker=0 complete QA is clear health, not release approval',(await text('#dt-health'))==='CLEAR');
  check('blocker=0 count',(await text('#dt-blockers'))==='0');

  await seed({'qa-summary-v1':{...qaPass,pass:1,review:1}});await open('/digital-twin');
  check('QA review remains review',(await text('#dt-health'))==='REVIEW');

  await seed({'qa-summary-v1':{total:2,pass:2,blocker:0}});await open('/digital-twin');
  check('invalid QA does not pass',(await text('#dt-health'))==='REVIEW');
  check('invalid QA reason is visible',(await text('#dt-list')).includes('INVALID'));

  await seed({'qa-summary-v1':{...qaPass,finding:'BLOCK FAIL HOLD CRITICAL'}});await open('/digital-twin');
  check('free text does not create blocker',(await text('#dt-health'))==='CLEAR');

  await seed({'qa-summary-v1':qaPass,'stock-last-v1':{state:'SHORT',after:-2}});await open('/digital-twin');
  check('real blocker wins across sources',(await text('#dt-health'))==='BLOCKED');
  check('one explicit blocker is counted',(await text('#dt-blockers'))==='1');
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(300);
  check('status survives reload',(await text('#dt-health'))==='BLOCKED');

  const blockedSet={
    'enterprise-job-core-v1':{name:'Test job',revision:'R1',quantity:10},
    'preflight-last-v1':{state:'ready',blockers:0,warnings:0},
    'approval-summary-v1':{required:2,approved:2,blocking:0},
    'qa-summary-v1':{total:2,pass:1,review:0,blocker:1},
    'supplier-intelligence-last-v1':{providers:[{name:'Supplier A'}],best:{name:'Supplier A'}}
  };
  await seed(blockedSet);await open('/digital-twin');
  check('Digital Twin reflects blocker',(await text('#dt-health'))==='BLOCKED');await shot('after-block-en.png');
  await open('/release-center');
  check('Release Center reflects blocker',(await text('#rc-status'))==='HOLD');
  check('Release Center counts only real blockers',(await text('#rc-blockers'))==='1');
  await open('/enterprise-dashboard');check('Enterprise Dashboard reflects blocker',(await text('#ed-blockers'))==='1');
  await open('/readiness-audit');check('Readiness reflects blocker',(await text('#ra-status'))==='HOLD');

  await seed({'readiness-audit-last-v1':{status:'READY',required:3,unresolved:[]},'qa-summary-v1':qaPass,'stock-last-v1':{state:'SHORT'}});await open('/command-center');
  check('Command Center does not let READY audit erase another blocker',(await text('#pc-next'))==='Resolve blockers');
  check('Command Center exposes blocker',(await text('#pc-list')).includes('BLOCK'));

  await seed({},'ar');await open('/qa-history');
  check('Arabic empty QA History writes zero total',(await text('#q-total'))==='0');
  await open('/digital-twin');
  check('Arabic empty state remains NO DATA',(await text('#dt-health'))==='NO DATA');
  check('Arabic empty reason is readable',/[\u0600-\u06FF]/.test(await text('#dt-list')));await shot('after-empty-ar.png');
  await seed({'qa-summary-v1':{total:1,pass:0,review:0,blocker:1}},'ar');await open('/digital-twin');
  check('Arabic blocker state',(await text('#dt-health'))==='BLOCKED');
  check('Arabic blocker reason is readable',(await text('#dt-list')).includes('عائق'));await shot('after-block-ar.png');

  fs.writeFileSync(path.join(outDir,'phase2a-results.json'),JSON.stringify({generatedAt:new Date().toISOString(),base,results},null,2));
} finally {
  if(context)await context.close();
  await browser.close();
}
