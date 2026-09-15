from pathlib import Path
import sys

p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
old="C.write('readiness-audit-last-v1',{schema:'ppl-readiness-audit',version:2,updatedAt:C.now(),status,required:decisions.length,unresolved:open.map(x=>R.label(x.kind)),decisions:decisions.map(x=>({kind:x.kind,key:x.key,state:x.result.state,reason:x.result.reason}))})"
new="C.write('readiness-audit-last-v1',{schema:'ppl-readiness-audit',version:2,decisionModel:'explicit-fields-v2',updatedAt:C.now(),status,required:decisions.length,unresolved:open.filter(x=>x.result.state!==R.S.BLOCK).map(x=>R.label(x.kind)),blockers:blocked.map(x=>R.label(x.kind)),decisions:decisions.map(x=>({kind:x.kind,key:x.key,state:x.result.state,reason:x.result.reason}))})"
if old not in s:
    raise SystemExit('Phase2a review patch: readiness writer did not match expected Phase2a output')
s=s.replace(old,new,1)
if "decisionModel:'explicit-fields-v2'" not in s or 'blockers:blocked.map' not in s:
    raise SystemExit('Phase2a review patch: readiness metadata was not applied')
p.write_text(s,encoding='utf-8')
print('Phase2a review patched readiness audit metadata')
