import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://127.0.0.1:4173';
const outDir = process.argv[3] || '/tmp/phase2a-qa';
fs.mkdirSync(outDir,{recursive:true});
const prefix='print-prep-lab-';
const results=[];
const check=(name,ok,detail='')=>{if(!ok)throw new Error(`${name}${detail?`: ${detail}`:''}`);results.push({name,ok:true,detail});console.log(`PASS ${name}${detail?` — ${detail}`:''}`)};
async function seed(page,data={},lang='en'){
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.clear());
  await page.evaluate(({data,lang,prefix})=>{
    for(const [k,v] of Object.entries(data)) localStorage.setItem(prefix+k,JSON.stringify(v));
    localStorage.setItem(prefix+'language',lang);
    localStorage.setItem('ppl-interface-language',lang);
  },{data,lang,prefix});
}
async function open(page,route){
  await page.goto(base+route,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(350);
}
async function text(page,sel){return (await page.locator(sel).innerText()).trim()}
async function shot(page,name){await page.screenshot({path:path.join(outDir,name),fullPage:true})}
const qaPass={schema:'print-prep-lab-qa-summary',version:1,total:2,pass:2,review:0,blocker:0,finding:'FAIL appears only in free text'};
const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
page.on('console',m=>console.log(`BROWSER ${m.type()}: ${m.text()}`));
page.on('pageerror',e=>console.log(`BROWSER pageerror: ${e.message}`));
try{
  await seed(page,{});await open(page,'/digital-twin');
  const firstHealth=await text(page,'#dt-health');
  const runtime=await page.evaluate(()=>({rules:!!window.PPLStatusRules,core:!!window.PPLCore,mode:document.body.dataset.enterpriseMode,scripts:[...document.scripts].map(s=>s.src).filter(Boolean)}));
  console.log('RUNTIME',JSON.stringify(runtime));
  check('clean session is NO DATA',firstHealth==='NO DATA',`actual=${firstHealth}; rules=${runtime.rules}; core=${runtime.core}; mode=${runtime.mode}`);check('clean session has zero blockers',(await text(page,'#dt-blockers'))==='0');

  await open(page,'/qa-history');await open(page,'/digital-twin');check('empty QA history is not blocked',(await text(page,'#dt-health'))==='NO DATA');check('empty QA history blocker count',(await text(page,'#dt-blockers'))==='0');await shot(page,'after-empty-en.png');

  await seed(page,{'qa-summary-v1':qaPass});await open(page,'/digital-twin');check('blocker=0 complete QA is clear health, not release approval',(await text(page,'#dt-health'))==='CLEAR');check('blocker=0 count',(await text(page,'#dt-blockers'))==='0');

  await seed(page,{'qa-summary-v1':{...qaPass,pass:1,review:1}});await open(page,'/digital-twin');check('QA review remains review',(await text(page,'#dt-health'))==='REVIEW');

  await seed(page,{'qa-summary-v1':{total:2,pass:2,blocker:0}});await open(page,'/digital-twin');check('invalid QA does not pass',(await text(page,'#dt-health'))==='REVIEW');check('invalid QA reason is visible',(await text(page,'#dt-list')).includes('INVALID'));

  await seed(page,{'qa-summary-v1':{...qaPass,finding:'BLOCK FAIL HOLD CRITICAL'}});await open(page,'/digital-twin');check('free text does not create blocker',(await text(page,'#dt-health'))==='CLEAR');

  await seed(page,{'qa-summary-v1':qaPass,'stock-last-v1':{state:'SHORT',after:-2}});await open(page,'/digital-twin');check('real blocker wins across sources',(await text(page,'#dt-health'))==='BLOCKED');check('one explicit blocker is counted',(await text(page,'#dt-blockers'))==='1');await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(300);check('status survives reload',(await text(page,'#dt-health'))==='BLOCKED');

  const blockedSet={
    'enterprise-job-core-v1':{name:'Test job',revision:'R1',quantity:10},
    'preflight-last-v1':{state:'ready',blockers:0,warnings:0},
    'approval-summary-v1':{required:2,approved:2,blocking:0},
    'qa-summary-v1':{total:2,pass:1,review:0,blocker:1},
    'supplier-intelligence-last-v1':{providers:[{name:'Supplier A'}],best:{name:'Supplier A'}}
  };
  await seed(page,blockedSet);await open(page,'/digital-twin');check('Digital Twin reflects blocker',(await text(page,'#dt-health'))==='BLOCKED');await shot(page,'after-block-en.png');
  await open(page,'/release-center');check('Release Center reflects blocker',(await text(page,'#rc-status'))==='HOLD');check('Release Center counts only real blockers',(await text(page,'#rc-blockers'))==='1');
  await open(page,'/enterprise-dashboard');check('Enterprise Dashboard reflects blocker',(await text(page,'#ed-blockers'))==='1');
  await open(page,'/readiness-audit');check('Readiness reflects blocker',(await text(page,'#ra-status'))==='HOLD');

  await seed(page,{'readiness-audit-last-v1':{status:'READY',required:3,unresolved:[]},'qa-summary-v1':qaPass,'stock-last-v1':{state:'SHORT'}});await open(page,'/command-center');check('Command Center does not let READY audit erase another blocker',(await text(page,'#pc-next'))==='Resolve blockers');check('Command Center exposes blocker',(await text(page,'#pc-list')).includes('BLOCK'));

  await seed(page,{},'ar');await open(page,'/qa-history');await open(page,'/digital-twin');check('Arabic empty state remains NO DATA',(await text(page,'#dt-health'))==='NO DATA');check('Arabic empty reason is readable',/[\u0600-\u06FF]/.test(await text(page,'#dt-list')));await shot(page,'after-empty-ar.png');
  await seed(page,{'qa-summary-v1':{total:1,pass:0,review:0,blocker:1}},'ar');await open(page,'/digital-twin');check('Arabic blocker state',(await text(page,'#dt-health'))==='BLOCKED');check('Arabic blocker reason is readable',(await text(page,'#dt-list')).includes('عائق'));await shot(page,'after-block-ar.png');

  fs.writeFileSync(path.join(outDir,'phase2a-results.json'),JSON.stringify({generatedAt:new Date().toISOString(),base,results},null,2));
} finally {await browser.close();}
