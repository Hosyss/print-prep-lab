#!/usr/bin/env python3
from pathlib import Path
import re,sys
if len(sys.argv)!=2: raise SystemExit('usage: final-artifact-review-patch.py ROOT')
root=Path(sys.argv[1])
# Reconcile legacy aliases: permanent only where a real replacement exists.
permanent={
 '/workflow':'/#workflow',
 '/tools/best-print-size-finder':'/scenarios',
 '/tools/saddle-stitch-booklet-calculator':'/signature-planner',
 '/guides/best-file-format-for-printing':'/guides/print-file-preflight-checklist',
 '/guides/choose-best-photo-print-size':'/scenarios',
 '/guides/saddle-stitch-booklet-page-count':'/signature-planner',
}
fallback={
 '/tools/mat-frame-calculator':'/tools',
 '/tools/poster-tiling-calculator':'/guides/export-images-for-large-format-printing',
 '/guides/mat-frame-sizing-guide':'/guides',
 '/guides/tiled-poster-printing-guide':'/guides/export-images-for-large-format-printing',
}
p=root/'_redirects'; lines=[]
for line in p.read_text(encoding='utf-8').splitlines():
    src=line.split(maxsplit=1)[0] if line.strip() else ''
    if src in permanent or src in fallback: continue
    lines.append(line)
for a,b in permanent.items(): lines.append(f'{a} {b} 301')
for a,b in fallback.items(): lines.append(f'{a} {b} 302')
p.write_text('\n'.join(lines).rstrip()+'\n',encoding='utf-8')

# Workspace and legacy utility pages are retained for visitors but do not belong
# in the public editorial index. The glossary remains a reading reference.
operational={page.stem for page in root.glob('*.html') if page.name != 'glossary.html' and not page.name.startswith('google')}
count=0
for stem in operational:
    page=root/f'{stem}.html'
    if not page.exists(): continue
    s=page.read_text(encoding='utf-8')
    # Ads are restricted to the current public content routes, not local-state
    # application screens or compatibility HTML files.
    s=re.sub(r'<script\b[^>]*src=["\'][^"\']*pagead2\.googlesyndication\.com[^"\']*["\'][^>]*>.*?</script>', '', s, flags=re.I|re.S)
    tag='<meta name="robots" content="noindex,follow">'
    if re.search(r'<meta[^>]+name=["\']robots["\'][^>]*>',s,re.I):
        s=re.sub(r'<meta[^>]+name=["\']robots["\'][^>]*>',tag,s,count=1,flags=re.I)
    else:s=s.replace('</title>',f'</title>{tag}',1)
    page.write_text(s,encoding='utf-8');count+=1
print(f'Final artifact review: redirects reconciled, noindex embedded on {count} operational pages')
