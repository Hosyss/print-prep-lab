import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const base=process.argv[2]||'http://127.0.0.1:4175';
const outDir=process.argv[3]||'/tmp/tool-input-qa';
fs.mkdirSync(outDir,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();
const results=[];const check=(name,ok,detail='')=>{if(!ok)throw new Error(`${name}: ${detail}`);results.push({name,detail});console.log('PASS',name,detail)};
async function waitForAttr(locator,name,value,timeout=3000){const end=Date.now()+timeout;while(Date.now()<end){if(await locator.getAttribute(name)===value)return true;await page.waitForTimeout(25)}return false}
async function waitForValue(locator,value,timeout=3000){const end=Date.now()+timeout;while(Date.now()<end){if(await locator.inputValue()===value)return true;await page.waitForTimeout(25)}return false}
try{
 let r=await page.goto(base+'/tools/pixels-to-print-size',{waitUntil:'networkidle'});check('pixels tool route',r?.status()===200,String(r?.status()));
 const inputs=page.locator('input[type="number"]');check('pixels tool has numeric inputs',await inputs.count()>=3,String(await inputs.count()));
 const widthInput=inputs.nth(0),ppiInput=inputs.nth(2),originalWidth=await widthInput.inputValue();
 await widthInput.fill('-25');check('negative pixel width is visibly invalid',await waitForAttr(widthInput,'aria-invalid','true'),await widthInput.inputValue());
 const fieldError=page.locator('.field-error').first();await fieldError.waitFor({state:'visible',timeout:3000});check('invalid field explains minimum',(await fieldError.innerText()).length>0);
 let body=await page.locator('body').innerText();check('invalid entry never renders NaN/Infinity',!/NaN|Infinity/.test(body));
 await widthInput.blur();check('invalid draft reverts on blur',await waitForValue(widthInput,originalWidth),await widthInput.inputValue());
 const originalPpi=await ppiInput.inputValue();await ppiInput.fill('0');check('zero PPI is visibly invalid',await waitForAttr(ppiInput,'aria-invalid','true'),await ppiInput.inputValue());await ppiInput.blur();check('invalid PPI reverts on blur',await waitForValue(ppiInput,originalPpi),await ppiInput.inputValue());
 body=await page.locator('body').innerText();
 const resultSection=page.locator('section.tool-results[aria-label="Calculated results"]');
 check('calculated results are labelled',await resultSection.count()===1&&await resultSection.locator('.tool-results-heading strong').count()===1,await resultSection.getAttribute('aria-label')||'missing');
 const workedExample=page.locator('.tool-learning-grid [data-en^="Worked example"]');
 check('worked example is separately labelled',await workedExample.count()===1,await workedExample.first().getAttribute('data-en')||'missing');
 const exampleNote=page.locator('.example-input-note[data-en^="Example values are pre-filled."]');
 check('prefilled values are disclosed as examples',await exampleNote.count()===1,await exampleNote.first().getAttribute('data-en')||'missing');
 r=await page.goto(base+'/tools/bleed-safe-area-calculator',{waitUntil:'networkidle'});check('bleed tool route',r?.status()===200,String(r?.status()));
 const bleedInput=page.locator('input[type="number"]').nth(0);await bleedInput.fill('-1');check('negative trim is visibly invalid',await waitForAttr(bleedInput,'aria-invalid','true'),await bleedInput.inputValue());const bleedBody=await page.locator('body').innerText();check('negative trim never produces invalid result',!/NaN|Infinity/.test(bleedBody));
 fs.writeFileSync(path.join(outDir,'tool-input-results.json'),JSON.stringify({generatedAt:new Date().toISOString(),base,results},null,2));
} finally {await context.close();await browser.close()}
