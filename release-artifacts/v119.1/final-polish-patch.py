#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
if len(sys.argv)!=2: raise SystemExit('usage: final-polish-patch.py ROOT')
root=Path(sys.argv[1])
redirects={
 '/workflow':'/workspace',
 '/tools/best-print-size-finder':'/scenarios',
 '/tools/saddle-stitch-booklet-calculator':'/signature-planner',
 '/guides/choose-best-photo-print-size':'/scenarios',
 '/guides/saddle-stitch-booklet-page-count':'/signature-planner',
 '/guides/rgb-vs-cmyk-printing':'/prepress-lab',
 '/guides/best-file-format-for-printing':'/guides/print-file-preflight-checklist',
}
removed={
 '/tools/mat-frame-calculator', '/tools/poster-tiling-calculator',
 '/guides/mat-frame-sizing-guide','/guides/tiled-poster-printing-guide'
}
idx=root/'search-index.json'
if idx.exists():
 data=json.loads(idx.read_text())
 items=data.get('items',[]); old=len(items)
 items=[x for x in items if x.get('path') not in set(redirects)|removed]
 data['items']=items; data['count']=len(items)
 idx.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
 print('search index removed legacy ghost entries',old-len(items))
collection_fallback={
 '/tools/mat-frame-calculator':'/tools', '/tools/poster-tiling-calculator':'/tools',
 '/guides/mat-frame-sizing-guide':'/guides','/guides/tiled-poster-printing-guide':'/guides'
}
allmap={**redirects,**collection_fallback}
for p in list(root.glob('*.html'))+list(root.glob('*.js'))+list(root.glob('*.json')):
 try:s=p.read_text()
 except UnicodeDecodeError: continue
 original=s
 for old,new in allmap.items(): s=s.replace(old,new)
 if s!=original:p.write_text(s)
red=root/'_redirects'; existing=red.read_text() if red.exists() else ''
lines=[existing.rstrip()] if existing.strip() else []
for a,b in redirects.items():
 rule=f'{a} {b} 301'
 if rule not in existing:lines.append(rule)
red.write_text('\n'.join(lines).strip()+'\n')
footer='''<footer class="site-footer"><div class="shell footer-grid"><div><a class="brand footer-brand" href="/"><span aria-hidden="true" class="brand-mark"><i></i><i></i><i></i><i></i></span><span>Print Prep <b>Lab</b></span></a><p data-en="Clear print preparation tools, calculations and production guidance." data-ar="أدوات وحسابات وإرشادات واضحة لتجهيز ملفات الطباعة.">Clear print preparation tools, calculations and production guidance.</p></div><div class="footer-links"><div><strong data-en="Explore" data-ar="استكشف">Explore</strong><a href="/tools" data-en="Tools" data-ar="الأدوات">Tools</a><a href="/sizes" data-en="Print sizes" data-ar="مقاسات الطباعة">Print sizes</a><a href="/guides" data-en="Guides" data-ar="الأدلة">Guides</a><a href="/workspace" data-en="Workspace" data-ar="مساحة العمل">Workspace</a></div><div><strong data-en="Trust" data-ar="الموثوقية">Trust</strong><a href="/methodology" data-en="Methodology" data-ar="المنهجية">Methodology</a><a href="/sources" data-en="Sources" data-ar="المصادر">Sources</a><a href="/privacy" data-en="Privacy" data-ar="الخصوصية">Privacy</a></div><div><strong data-en="About" data-ar="عن الموقع">About</strong><a href="/about" data-en="About" data-ar="حول الموقع">About</a><a href="/editorial-policy" data-en="Editorial policy" data-ar="السياسة التحريرية">Editorial policy</a><a href="/contact" data-en="Contact" data-ar="تواصل معنا">Contact</a><a href="/terms" data-en="Terms" data-ar="الشروط">Terms</a></div></div></div><div class="shell footer-bottom"><span>© 2026 Print Prep Lab</span><span data-en="Workspace records stay in this browser unless you export them." data-ar="تبقى سجلات مساحة العمل في هذا المتصفح ما لم تقم بتصديرها.">Workspace records stay in this browser unless you export them.</span></div></footer>'''
for p in root.glob('*.html'):
 s=p.read_text(); original=s
 if '<footer class="site-footer">' in s:
  s=re.sub(r'<footer class="site-footer">.*?</footer>',footer,s,count=1,flags=re.S)
 s=s.replace('<a href="/guides">Guides</a>','<a href="/guides" data-en="Resources" data-ar="الموارد">Resources</a>')
 s=s.replace('<a href="/tools">Tools</a>','<a href="/tools" data-en="Tools" data-ar="الأدوات">Tools</a>')
 s=s.replace('<a href="/sizes">Print sizes</a>','<a href="/sizes" data-en="Print sizes" data-ar="مقاسات الطباعة">Print sizes</a>')
 if s!=original:p.write_text(s)
css=root/'final-readiness.css'
css.write_text('''\nhtml,body{max-width:100%;overflow-x:clip}\n.ppl-global-stage,main,.shell,.ep-shell,.ep-card,.panel,.cell,article,aside{min-width:0}\n.table-wrap,.data-table-wrap,.batch-table-wrap,.ep-table-wrap,.comparison-table{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}\ntable{max-width:100%}\n.ep-card label,.ep-row span,.notice,.footer-grid p{color:#475569}\n@media(max-width:760px){.ep-shell,.shell{width:min(100% - 24px,1180px)}.ep-grid,.grid2,.footer-grid{grid-template-columns:1fr!important}.footer-links{grid-template-columns:1fr 1fr;gap:18px}.footer-links>div:last-child{grid-column:1/-1}.ep-fields,.ep-fields.three{grid-template-columns:1fr}.table-wrap table,.data-table-wrap table,.ep-table-wrap table{min-width:620px}.ppl-global-stage{overflow:visible}}\n''')
for p in root.glob('*.html'):
 s=p.read_text()
 if '/final-readiness.css' not in s:
  s=s.replace('</head>','<link href="/final-readiness.css" rel="stylesheet"/></head>',1); p.write_text(s)
private_routes={'jobs.html','job-core.html','supplier-intelligence.html','release-center.html','readiness-audit.html','command-center.html','enterprise-dashboard.html','digital-twin.html','vault.html'}
for name in private_routes:
 p=root/name
 if not p.exists(): continue
 s=p.read_text()
 if 'name="robots"' not in s:s=s.replace('</title>','</title><meta content="noindex,follow" name="robots"/>',1)
 else:s=re.sub(r'<meta content="[^"]*" name="robots"/>','<meta content="noindex,follow" name="robots"/>',s,count=1)
 p.write_text(s)
print('Applied route reconciliation, footer/navigation consistency, mobile overflow and noindex hardening')
