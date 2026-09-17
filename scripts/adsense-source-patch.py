#!/usr/bin/env python3
from pathlib import Path
root=Path('.')
privacy=root/'app/privacy/page.tsx'
s=privacy.read_text()
old='The current tools do not create user accounts, save projects or maintain a server-side image library.'
new='The site does not create user accounts or maintain a server-side image library. Professional workspace features may save job records and settings in this browser’s local storage until you clear or export them.'
if old not in s: raise SystemExit('privacy claim marker not found')
s=s.replace(old,new)
privacy.write_text(s)
css=root/'app/globals.css'; s=css.read_text(); marker='/* adsense-readiness-mobile-table-fix */'
if marker not in s:
 s += '''\n\n/* adsense-readiness-mobile-table-fix */\nhtml,body{max-width:100%;overflow-x:clip}\nmain,.shell,.content-section,.size-detail-grid,.tool-embed,.comparison-table{min-width:0}\n.data-table-wrap,.table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}\n@media(max-width:760px){.data-table-wrap .data-table{min-width:620px}.data-table-wrap{margin-inline:0}.size-detail-grid{grid-template-columns:1fr!important}}\n'''
css.write_text(s)
print('Patched source privacy accuracy and mobile table overflow')
