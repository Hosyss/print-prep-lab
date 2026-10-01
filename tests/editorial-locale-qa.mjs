import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const base=process.argv[2]??'http://127.0.0.1:4182';
const output=process.argv[3]??'work/editorial-browser-qa';
await mkdir(output,{recursive:true});
const guides=['dpi-vs-ppi','how-large-can-i-print-my-image','print-resolution-guide','bleed-trim-safe-area','aspect-ratio-cropping-print','print-file-preflight-checklist','export-images-for-large-format-printing','a4-vs-us-letter-printing','rgb-vs-cmyk-printing','prepare-pdf-for-print','low-resolution-images-for-print','business-card-bleed-and-safe-area'];
const sizes=['a2','a3','a4','a5','us-letter','us-legal','4x6-photo','5x7-photo','8x10-photo','11x14-photo','12x18-photo','16x20-photo'];
const policyRoutes=['/about','/methodology','/sources','/editorial-policy','/privacy','/terms','/contact'];
const routes=['/',...guides.map(g=>'/guides/'+g),...sizes.map(s=>'/sizes/'+s),...policyRoutes];
const scope='.home-opening,.article-main,.guide-comparison,.guide-summary-grid,.size-use-case,.size-insights,.size-detail-grid,.inner-hero,.breadcrumbs,.policy-layout,.page-cta';
const results=[];
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
  for(const viewport of [{width:1365,height:900},{width:390,height:844}]){
    const context=await browser.newContext({viewport});
    await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
    const page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    try{
      for(const path of routes){
        const response=await page.goto(base+path,{waitUntil:'networkidle'});assert.equal(response.status(),200,path);
        if(policyRoutes.includes(path)){
          const untranslated=await page.locator('.policy-layout h2,.policy-layout p,.policy-layout strong,.policy-layout small,.policy-layout code,.policy-layout a').evaluateAll(elements=>elements.filter(el=>el.childElementCount===0&&el.textContent.trim()&&!el.hasAttribute('data-ar')).map(el=>el.textContent.trim()));
          assert.deepEqual(untranslated,[],path+' policy translation coverage');
        }
        const language=page.locator('select[data-source-lang]');
        for(const lang of ['ar','en']){
          await language.selectOption(lang);
          await page.waitForFunction(expected=>document.documentElement.lang===expected&&document.documentElement.dir===(expected==='ar'?'rtl':'ltr'),lang);
          await page.waitForFunction(({scope,lang})=>[...document.querySelectorAll(scope)].flatMap(root=>[...root.querySelectorAll('[data-en][data-ar]')]).filter(el=>el.childElementCount===0).every(el=>el.textContent.trim()===el.getAttribute('data-'+lang).trim()),{scope,lang});
          const dimensions=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
          assert.ok(dimensions.scroll<=dimensions.width+1,`${path} ${lang} viewport overflow: ${JSON.stringify(dimensions)}`);
          if(path.startsWith('/sizes/'))assert.equal(await page.locator('[data-aspect-ratio]').evaluate(el=>getComputedStyle(el).direction),'ltr',path+' ratio direction');
          if(path==='/contact'){
            const template=await page.locator('.report-template code').evaluate(el=>({font:parseFloat(getComputedStyle(el).fontSize),space:getComputedStyle(el).whiteSpace,width:el.clientWidth,scroll:el.scrollWidth}));
            assert.ok(template.font>=14,'Readable report template');assert.equal(template.space,'pre-wrap','Report template line breaks');assert.ok(template.scroll<=template.width+1,'Report template containment');
          }
          results.push({path,language:lang,viewport:viewport.width,status:'passed'});
        }
        if(['/','/guides/dpi-vs-ppi','/sizes/a4','/methodology','/privacy'].includes(path)){
          await language.selectOption('ar');
          await page.waitForFunction(()=>document.documentElement.dir==='rtl');
          await page.screenshot({path:join(output,`editorial-${viewport.width}-${path.replaceAll('/','_')||'home'}.png`),fullPage:true});
        }
      }
      assert.deepEqual(errors,[],`JavaScript errors at ${viewport.width}px`);
    }finally{await context.close();}
  }
}finally{await browser.close();}
await writeFile(join(output,'editorial-locale-results.json'),JSON.stringify({results},null,2));
console.log(JSON.stringify({checks:results.length,routes:routes.length,languages:2,viewports:2,status:'passed'}));
