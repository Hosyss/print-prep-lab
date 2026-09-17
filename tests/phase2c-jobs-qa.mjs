import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const base=process.argv[2]||'http://127.0.0.1:4175',outDir=process.argv[3]||'/tmp/phase2c-qa',prefix='print-prep-lab-';fs.mkdirSync(outDir,{recursive:true});
const results=[],check=(n,ok,d='')=>{if(!ok)throw new Error(`${n}${d?`: ${d}`:''}`);results.push({name:n,ok:true,detail:d});console.log(`PASS ${n}`)};
const browser=await chromium.launch({headless:true,channel:'chrome'});let context,page;
async function ctx(state){if(context)await context.close();context=await browser.newContext({viewport:{width:1280,height:900},storageState:state});page=await context.newPage()}
async function seed(data={}){await ctx();let r=await page.goto(base+'/',{waitUntil:'domcontentloaded'});if(!r||r.status()!==200)throw new Error('seed failed');await page.evaluate(()=>localStorage.clear());await page.evaluate(({data,prefix})=>{for(const[k,v]of Object.entries(data))localStorage.setItem(prefix+k,JSON.stringify(v))},{data,prefix});const s=await context.storageState();await ctx(s)}
async function open(route){const r=await page.goto(base+route,{waitUntil:'domcontentloaded'});if(!r||r.status()!==200)throw new Error(`${route} ${r?.status()}`);await page.waitForTimeout(250)}
async function read(k){return page.evaluate(({prefix,k})=>{const v=localStorage.getItem(prefix+k);return v?JSON.parse(v):null},{prefix,k})}
const job=(id,name,qty,due)=>({schema:'print-prep-lab-job',version:1,id,name,provider:'',product:'Poster',quantity:qty,due,priority:'Normal',notes:'',stages:{},snapshot:{},createdAt:'2026-09-17T00:00:00Z',updatedAt:'2026-09-17T00:00:00Z'});
try{
 await seed({'jobs-v1':[job('A','Job A',10,'2026-10-01'),job('B','Job B',20,'2026-10-02')]});await open('/jobs');
 check('two jobs render',await page.locator('[data-id]').count()===2);await page.locator('[data-id="A"] [data-select]').click();check('A selected',(await read('selected-job-id-v1'))==='A');
 await open('/job-core');check('A name loaded',(await page.locator('#ec-name').inputValue())==='Job A');check('A quantity loaded',(await page.locator('#ec-qty').inputValue())==='10');await page.locator('#ec-rev').fill('R1');await page.locator('#ec-size').fill('210 × 297 mm');await page.locator('#ec-qty').fill('12');await page.locator('#ec-save').click();await page.waitForTimeout(150);
 let core=await read('enterprise-job-core-v1'),cores=await read('enterprise-job-cores-v2'),jobs=await read('jobs-v1');check('current core linked to A',core.jobId==='A');check('A core persisted',cores.some(x=>x.jobId==='A'&&x.quantity===12&&x.trim==='210 × 297 mm'));check('A shared quantity updated',jobs.find(x=>x.id==='A').quantity===12);check('B untouched',jobs.find(x=>x.id==='B').quantity===20);
 await open('/jobs');await page.locator('[data-id="B"] [data-select]').click();check('B selected',(await read('selected-job-id-v1'))==='B');await open('/job-core');check('B loads its own name',(await page.locator('#ec-name').inputValue())==='Job B');check('B does not inherit A trim',(await page.locator('#ec-size').inputValue())==='');await page.locator('#ec-rev').fill('R1');await page.locator('#ec-size').fill('100 × 150 mm');await page.locator('#ec-save').click();
 await open('/jobs');await page.locator('[data-id="A"] [data-select]').click();await open('/job-core');check('switching back restores A core',(await page.locator('#ec-size').inputValue())==='210 × 297 mm');
 await seed({'jobs-v1':[job('A','Job A',10,'2026-10-01')]});await open('/job-core');check('no selection stays explicit',(await page.locator('#ec-selected-job').innerText()).includes('No job selected'));check('empty core does not show sample job',(await page.locator('#ec-name').inputValue())==='');
 const legacy={schema:'ppl-enterprise-job',version:1,id:'legacy-core',name:'Legacy saved job',revision:'R2',quantity:50,trim:'A4',material:'Paper',deadline:'',note:'',updatedAt:'2026-09-01T00:00:00Z'};await seed({'enterprise-job-core-v1':legacy});await open('/job-core');check('legacy core preserved',(await page.locator('#ec-name').inputValue())==='Legacy saved job');check('legacy remains unlinked',(await read('enterprise-job-core-v1')).jobId===undefined);
 fs.writeFileSync(path.join(outDir,'phase2c-results.json'),JSON.stringify({generatedAt:new Date().toISOString(),base,results},null,2));
}finally{if(context)await context.close();await browser.close()}
