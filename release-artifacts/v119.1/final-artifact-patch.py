#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
root=Path(sys.argv[1])
build_marker=sys.argv[2] if len(sys.argv)>2 else 'final-readiness'

home=root/'home-v112.html'; s=home.read_text(encoding='utf-8')
s=s.replace('<section class="home-v119-proof shell">','<section class="home-v119-proof shell" id="workflow">',1)
s=s.replace('One product, from first check to release evidence.','One clear path: check, calculate, review, then save the result.',1)
s=s.replace('منتج واحد، من أول فحص حتى دليل الإصدار.','مسار واضح: افحص، احسب، راجع، ثم احفظ النتيجة.',1)
home.write_text(s,encoding='utf-8')

replacements={
 '/workflow':'/#workflow',
 '/tools/saddle-stitch-booklet-calculator':'/signature-planner',
 '/guides/best-file-format-for-printing':'/guides/print-file-preflight-checklist',
 '/guides/rgb-vs-cmyk-printing':'/guides/print-file-preflight-checklist',
}
for p in root.glob('*.html'):
    s=p.read_text(encoding='utf-8'); orig=s
    for old,new in replacements.items(): s=s.replace(f'href="{old}"',f'href="{new}"')
    s=re.sub(r'<span class="kicker">v\d+(?:\.\d+)?\s*·\s*([^<]+)</span>',r'<span class="kicker">\1</span>',s,flags=re.I)
    if s!=orig:p.write_text(s,encoding='utf-8')

idx=root/'search-index.json'; d=json.loads(idx.read_text(encoding='utf-8'))
ghosts={
 '/workflow','/tools/best-print-size-finder','/tools/mat-frame-calculator','/tools/poster-tiling-calculator','/tools/saddle-stitch-booklet-calculator',
 '/guides/best-file-format-for-printing','/guides/choose-best-photo-print-size','/guides/mat-frame-sizing-guide','/guides/rgb-vs-cmyk-printing','/guides/saddle-stitch-booklet-page-count','/guides/tiled-poster-printing-guide'
}
items=[x for x in d.get('items',[]) if x.get('path') not in ghosts]
for x in items:
    if x.get('path')=='/supplier-intelligence':
        x['description']='Assess supplier eligibility explicitly, then rank only eligible providers using the fixed Phase 2 weights.'
d['items']=items;d['count']=len(items);d['generatedAt']='2026-09-17T00:00:00.000Z'
idx.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')

redirects=(root/'_redirects').read_text(encoding='utf-8').rstrip()+"\n"
aliases={
 '/workflow':'/#workflow',
 '/tools/best-print-size-finder':'/scenarios',
 '/tools/mat-frame-calculator':'/tools',
 '/tools/poster-tiling-calculator':'/guides/export-images-for-large-format-printing',
 '/tools/saddle-stitch-booklet-calculator':'/signature-planner',
 '/guides/best-file-format-for-printing':'/guides/print-file-preflight-checklist',
 '/guides/choose-best-photo-print-size':'/scenarios',
 '/guides/mat-frame-sizing-guide':'/guides',
 '/guides/rgb-vs-cmyk-printing':'/guides/print-file-preflight-checklist',
 '/guides/saddle-stitch-booklet-page-count':'/signature-planner',
 '/guides/tiled-poster-printing-guide':'/guides/export-images-for-large-format-printing',
}
for old,new in aliases.items():
    line=f'{old} {new} 301'
    if line not in redirects: redirects+=line+'\n'
(root/'_redirects').write_text(redirects,encoding='utf-8')

footer='''<footer class="site-footer"><div class="shell footer-grid"><div><a class="brand footer-brand" href="/"><span aria-hidden="true" class="brand-mark"><i></i><i></i><i></i><i></i></span><span>Print Prep <b>Lab</b></span></a><p data-en="Clear print math, file checks and preparation guidance." data-ar="حسابات واضحة وفحوصات للملفات وإرشادات لتجهيز الطباعة.">Clear print math, file checks and preparation guidance.</p></div><div class="footer-links"><div><strong data-en="Explore" data-ar="استكشف">Explore</strong><a href="/tools" data-en="Tools" data-ar="الأدوات">Tools</a><a href="/sizes" data-en="Print sizes" data-ar="مقاسات الطباعة">Print sizes</a><a href="/guides" data-en="Guides" data-ar="الأدلة">Guides</a></div><div><strong data-en="Trust" data-ar="الموثوقية">Trust</strong><a href="/methodology" data-en="Methodology" data-ar="المنهجية">Methodology</a><a href="/sources" data-en="Sources" data-ar="المصادر">Sources</a><a href="/privacy" data-en="Privacy" data-ar="الخصوصية">Privacy</a></div><div><strong data-en="Company" data-ar="عن الموقع">Company</strong><a href="/about" data-en="About" data-ar="حول الموقع">About</a><a href="/editorial-policy" data-en="Editorial policy" data-ar="السياسة التحريرية">Editorial policy</a><a href="/contact" data-en="Contact" data-ar="تواصل معنا">Contact</a><a href="/terms" data-en="Terms" data-ar="الشروط">Terms</a></div></div></div><div class="shell footer-bottom"><span>© 2026 Print Prep Lab</span><span data-en="Local browser workspace." data-ar="مساحة عمل محلية داخل المتصفح.">Local browser workspace.</span></div></footer>'''
footer_count=0
for p in root.glob('*.html'):
    s=p.read_text(encoding='utf-8')
    s2,n=re.subn(r'<footer class="site-footer">.*?</footer>',footer,s,count=1,flags=re.S)
    if n:p.write_text(s2,encoding='utf-8');footer_count+=1

# Static professional pages use a shared containment guard; tables scroll rather than losing columns.
css=root/'final-readiness.css'
css.write_text('''html,body{max-width:100%;overflow-x:clip}\n.ppl-global-stage,main,.shell,.ep-shell,.ep-card,.panel,.cell,article,aside{min-width:0}\n.table-wrap,.data-table-wrap,.batch-table-wrap,.ep-table-wrap,.comparison-table{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}\ntable{max-width:100%}\n.ep-card label,.ep-row span,.notice,.footer-grid p{color:#475569}\n.selected-job{outline:2px solid #087f92;outline-offset:-2px;background:#f0fbfc}\n@media(max-width:760px){.ep-shell,.shell{width:min(100% - 24px,1180px)}.ep-grid,.grid2,.footer-grid{grid-template-columns:1fr!important}.footer-links{grid-template-columns:1fr 1fr;gap:18px}.footer-links>div:last-child{grid-column:1/-1}.ep-fields,.ep-fields.three{grid-template-columns:1fr}.table-wrap table,.data-table-wrap table,.ep-table-wrap table{min-width:620px}.ppl-global-stage{overflow:visible}}\n''',encoding='utf-8')
for p in root.glob('*.html'):
    s=p.read_text(encoding='utf-8')
    if '/final-readiness.css' not in s:
        s=s.replace('</head>','<link href="/final-readiness.css" rel="stylesheet"/></head>',1)
        p.write_text(s,encoding='utf-8')

# User/workspace-state surfaces stay crawlable enough for robots to see noindex, but are not index targets.
private_routes={'jobs.html','job-core.html','supplier-intelligence.html','release-center.html','readiness-audit.html','command-center.html','enterprise-dashboard.html','digital-twin.html','vault.html','operations.html','file-manifest.html','production-archive.html'}
for name in private_routes:
    p=root/name
    if not p.exists(): continue
    s=p.read_text(encoding='utf-8')
    if re.search(r'<meta[^>]+name="robots"[^>]*>',s,re.I):
        s=re.sub(r'<meta[^>]+name="robots"[^>]*>', '<meta name="robots" content="noindex,follow">', s, count=1, flags=re.I)
    else:
        s=s.replace('</title>','</title><meta name="robots" content="noindex,follow">',1)
    p.write_text(s,encoding='utf-8')

h=root/'_headers'; headers=h.read_text(encoding='utf-8').rstrip()+"\n"
for asset in ['/enterprise-core.js','/enterprise-suite.js','/jobs.js','/search.js','/search-index.json']:
    rule=f'{asset}\n  Cache-Control: public, max-age=0, must-revalidate'
    if rule not in headers: headers+='\n'+rule+'\n'
h.write_text(headers,encoding='utf-8')

suite=root/'enterprise-suite.js'; js=suite.read_text(encoding='utf-8')
js+=f"\n/* ppl-final-build-marker:{build_marker} */\n"
suite.write_text(js,encoding='utf-8')
print(f'Final artifact patch: search ghosts removed={112-len(items)}, footers normalized={footer_count}, build={build_marker}')
