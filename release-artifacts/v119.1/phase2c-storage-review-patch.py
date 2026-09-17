#!/usr/bin/env python3
from pathlib import Path
import sys
if len(sys.argv)!=2: raise SystemExit('usage: phase2c-storage-review-patch.py JOBS_JS')
p=Path(sys.argv[1]); s=p.read_text(encoding='utf-8')
old="function selectedId(){return localStorage.getItem(SELECTED_KEY)||''}\n  function selectJob(id){if(id)localStorage.setItem(SELECTED_KEY,id);else localStorage.removeItem(SELECTED_KEY);renderJobs()}"
new="function selectedId(){try{const raw=localStorage.getItem(SELECTED_KEY);return raw?JSON.parse(raw):''}catch{return ''}}\n  function selectJob(id){if(id)localStorage.setItem(SELECTED_KEY,JSON.stringify(id));else localStorage.removeItem(SELECTED_KEY);renderJobs()}"
if old not in s: raise SystemExit('selected job storage marker not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')
print('Phase2c review normalized selected-job storage to PPLCore JSON format')
