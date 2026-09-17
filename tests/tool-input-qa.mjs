import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const base=process.argv[2]||'http://127.0.0.1:4175';
const outDir=process.argv[3]||'/tmp/tool-input-qa';
fs.mkdirSync(outDir,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();
const results=[];const check=(name,ok,detail='')=>{if(!ok)throw new Error(`${name}: ${detail}`);results.push({name,detail});console.log('PASS',name,detail)};
try{
 let r=await page.goto(base+'/tools/pixels-to-print-size',{waitUntil:'domcontentloaded'});check('pixels tool route',r?.status()===200,String(r?.status()));
 const inputs=page.locator('input[type="number"]');check('pixels tool has numeric inputs',await inputs.count()>=3,String(await inputs.count()));
 const originalWidth=await inputs.nth(0).inputValue();
 await inputs.nth(0).fill('-25');await page.waitForTimeout(100);check('negative pixel width is visibly invalid',(await inputs.nth(0).getAttribute('aria-invalid'))==='true',await inputs.nth(0).inputValue());
 check('invalid field explains minimum',(await page.locator('.field-error').first().innerText()).length>0);
 let body=await page.locator('body').innerText();check('invalid entry never renders NaN/Infinity',!/NaN|Infinity/.test(body));
 await inputs.nth(0).blur();await page.waitForTimeout(50);check('invalid draft reverts on blur',(await inputs.nth(0).inputValue())===originalWidth,await inputs.nth(0).inputValue());
 const originalPpi=await inputs.nth(2).inputValue();await inputs.nth(2).fill('0');await page.waitForTimeout(50);check('zero PPI is visibly invalid',(await inputs.nth(2).getAttribute('aria-invalid'))==='true',await inputs.nth(2).inputValue());await inputs.nth(2).blur();check('invalid PPI reverts on blur',(await inputs.nth(2).inputValue())===originalPpi,await inputs.nth(2).inputValue());
 body=await page.locator('body').innerText();check('calculated results are labelled',body.includes('Calculated results'));check('worked example is separately labelled',body.includes('Worked example'));check('prefilled values are disclosed as examples',body.includes('Example values are pre-filled.'));
 r=await page.goto(base+'/tools/bleed-safe-area-calculator',{waitUntil:'domcontentloaded'});check('bleed tool route',r?.status()===200,String(r?.status()));
 const bleedInputs=page.locator('input[type="number"]');await bleedInputs.nth(0).fill('-1');await page.waitForTimeout(100);check('negative trim is visibly invalid',(await bleedInputs.nth(0).getAttribute('aria-invalid'))==='true');const bleedBody=await page.locator('body').innerText();check('negative trim never produces invalid result',!/NaN|Infinity/.test(bleedBody));
 fs.writeFileSync(path.join(outDir,'tool-input-results.json'),JSON.stringify({generatedAt:new Date().toISOString(),base,results},null,2));
} finally {await context.close();await browser.close()}
