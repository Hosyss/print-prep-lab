#!/usr/bin/env python3
from pathlib import Path
import sys
if len(sys.argv)!=2: raise SystemExit('usage: jobs-jobcore-legacy-review-patch.py ROOT')
p=Path(sys.argv[1])/'enterprise-suite.js'
s=p.read_text()
old="function active(){let map=legacyIntoMap(cores()),id=selected(),list=jobs();if(!id&&list.length===1)id=list[0].id;if(id){const j=list.find(x=>x.id===id);return map[id]||(j?deriveFromJob(j):null)}return null}"
new="function active(){let map=legacyIntoMap(cores()),id=selected(),list=jobs();if(!id&&list.length===1)id=list[0].id;if(!id){const old=C.read(KEY,null),legacyId=old&&typeof old==='object'?String(old.jobId||old.id||''):'';if(legacyId)id=legacyId}if(id){const j=list.find(x=>x.id===id);return map[id]||(j?deriveFromJob(j):null)}return null}"
if old not in s: raise SystemExit('active() marker not found')
p.write_text(s.replace(old,new,1))
print('Job Core legacy record remains visible when no selected job exists')
