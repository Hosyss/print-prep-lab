import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {appendFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';

const projectName='printpreplab';
const origin='https://printpreplab.pages.dev';
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const mode=process.argv[2];
const delay=ms=>new Promise(r=>setTimeout(r,ms));

async function getProject(token) {
  const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/pages/projects/${projectName}`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(20000)});
  const data=await response.json();
  if(!response.ok||!data.success)throw Error(`Cloudflare HTTP ${response.status}: ${(data.errors??[]).map(e=>`${e.code} ${e.message}`).join('; ')}`);
  assert.equal(data.result.name,projectName,'Existing Pages project must match');
  assert.equal(data.result.subdomain,'printpreplab.pages.dev','Existing production address must match');
  assert.ok(data.result.production_branch,'Existing production branch is required');
  return data.result;
}

async function existingCredential() {
  assert.ok(account,'CLOUDFLARE_ACCOUNT_ID is missing from existing repository configuration');
  const candidates=[['CF_API_TOKEN',process.env.CF_API_TOKEN],['CLOUDFLARE_API_TOKEN',process.env.CLOUDFLARE_API_TOKEN]].filter(([,value])=>value);
  assert.ok(candidates.length,'No existing Cloudflare API credential is available');
  const tried=new Set(),errors=[];
  for(const [label,token] of candidates){if(tried.has(token))continue;tried.add(token);try{return{token,project:await getProject(token)};}catch(error){errors.push(`${label}: ${error.message}`);}}
  throw Error(`Existing credentials cannot access the Pages project. ${errors.join(' | ')}`);
}

try {
  assert.ok(['preflight','deploy'].includes(mode),'Use preflight or deploy');
  const {token,project}=await existingCredential();
  console.log(JSON.stringify({project:project.name,origin,productionBranch:project.production_branch,access:'verified'}));
  if(mode==='deploy'){
    assert.equal(process.env.GITHUB_REF,'refs/heads/main','Production release must run from main');
    const commit=process.env.GITHUB_SHA;
    assert.match(commit??'',/^[0-9a-f]{40}$/,'Release needs its exact source commit');
    const artifact=resolve(process.argv[3]);await access(resolve(artifact,'_worker.js'));await access(resolve(artifact,'_routes.json'));
    const wrangler=resolve('node_modules/wrangler/bin/wrangler.js');
    const status=await new Promise((done,reject)=>{
      const child=spawn(process.execPath,[wrangler,'pages','deploy',artifact,'--project-name',projectName,'--branch',project.production_branch,'--commit-hash',commit,'--commit-message','Print Prep Lab bilingual PDF preflight and public content release'],{cwd:artifact,env:{...process.env,CLOUDFLARE_API_TOKEN:token,WRANGLER_SEND_METRICS:'false'},stdio:'inherit'});
      child.on('error',reject);child.on('exit',done);
    });
    assert.equal(status,0,'Wrangler production upload must succeed');
    let confirmed;
    for(let attempt=0;attempt<20;attempt++){
      const current=(await getProject(token)).canonical_deployment;
      if(current?.deployment_trigger?.metadata?.commit_hash===commit){
        assert.equal(current.environment,'production');
        if(current.latest_stage?.status==='failure')throw Error('The new Cloudflare deployment failed');
        if(current.latest_stage?.status==='success'){confirmed={deploymentId:current.id,commit,status:'success',origin};break;}
      }
      await delay(3000);
    }
    assert.ok(confirmed,'Cloudflare must confirm the exact commit as the active production deployment');
    console.log(JSON.stringify(confirmed));
    if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`## Print Prep Lab production release\n\n${origin}\n\nCommit: ${commit}\n\nDeployment: ${confirmed.deploymentId}\n\nExisting project, production branch and runtime bindings preserved.\n`);
  }
} catch(error) { console.error(error.message);process.exitCode=1; }
