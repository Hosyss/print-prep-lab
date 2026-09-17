#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(sys.argv[1]) if len(sys.argv)>1 else Path('.')

# Tool inputs: keep invalid/blank edits visible instead of silently coercing them,
# while calculations continue using the last valid value until the field is fixed.
p=root/'components/tool-calculators.tsx'
s=p.read_text(encoding='utf-8')
old='''function NumericField({ label, value, onChange, suffix, minimum = 0, integer = false }: { label: string; value: number; onChange: (value: number) => void; suffix?: string; minimum?: number; integer?: boolean }) {\n  return <label className="tool-field"><span data-en={label} data-ar={arabicUi(label)}>{label}</span><div><input type="number" min={minimum} step={integer ? 1 : "any"} inputMode={integer ? "numeric" : "decimal"} value={value} onChange={(event) => {\n    const parsed = Number(event.target.value);\n    const normalized = Number.isFinite(parsed) ? Math.max(minimum, parsed) : minimum;\n    onChange(integer ? Math.round(normalized) : normalized);\n  }} />{suffix && <small>{suffix}</small>}</div></label>;\n}'''
new='''function NumericField({ label, value, onChange, suffix, minimum = 0, integer = false }: { label: string; value: number; onChange: (value: number) => void; suffix?: string; minimum?: number; integer?: boolean }) {\n  const [draft, setDraft] = useState(String(value));\n  useEffect(() => setDraft(String(value)), [value]);\n  const parsed = Number(draft);\n  const invalid = draft.trim() === "" || !Number.isFinite(parsed) || parsed < minimum || (integer && !Number.isInteger(parsed));\n  return <label className="tool-field"><span data-en={label} data-ar={arabicUi(label)}>{label}</span><div><input type="number" min={minimum} step={integer ? 1 : "any"} inputMode={integer ? "numeric" : "decimal"} value={draft} aria-invalid={invalid} onChange={(event) => {\n    const next = event.target.value;\n    setDraft(next);\n    const candidate = Number(next);\n    if (next.trim() !== "" && Number.isFinite(candidate) && candidate >= minimum && (!integer || Number.isInteger(candidate))) onChange(candidate);\n  }} onBlur={() => { if (invalid) setDraft(String(value)); }} />{suffix && <small>{suffix}</small>}</div>{invalid && <small className="field-error" data-en={`Enter ${integer ? "a whole number" : "a number"} of at least ${minimum}.`} data-ar={`أدخل ${integer ? "عددًا صحيحًا" : "رقمًا"} لا يقل عن ${minimum}.`}>Enter {integer ? "a whole number" : "a number"} of at least {minimum}.</small>}</label>;\n}'''
if old not in s: raise SystemExit('NumericField source marker changed')
s=s.replace(old,new)
old2='''function CalculatorFrame({ title, formula, children }: { title: string; formula: string; children: React.ReactNode }) {\n  return <section className="standalone-tool"><div className="standalone-tool-head"><div><span className="live-dot" /><span data-en="Interactive calculator" data-ar="حاسبة تفاعلية">Interactive calculator</span></div><code>{formula}</code></div><div className="standalone-tool-body"><h2 data-en={title} data-ar={arabicUi(title)}>{title}</h2>{children}</div></section>;\n}'''
new2='''function CalculatorFrame({ title, formula, children }: { title: string; formula: string; children: React.ReactNode }) {\n  return <section className="standalone-tool"><div className="standalone-tool-head"><div><span className="live-dot" /><span data-en="Interactive calculator" data-ar="حاسبة تفاعلية">Interactive calculator</span></div><code>{formula}</code></div><div className="standalone-tool-body"><h2 data-en={title} data-ar={arabicUi(title)}>{title}</h2><p className="example-input-note" data-en="Example values are pre-filled. Results always reflect the values currently shown; replace them with your own measurements before using the result." data-ar="القيم الظاهرة أمثلة مبدئية. النتائج تعكس القيم المعروضة حاليًا؛ استبدلها بقياساتك قبل الاعتماد على النتيجة.">Example values are pre-filled. Results always reflect the values currently shown; replace them with your own measurements before using the result.</p>{children}</div></section>;\n}'''
if old2 not in s: raise SystemExit('CalculatorFrame source marker changed')
s=s.replace(old2,new2)
p.write_text(s,encoding='utf-8')

# Mobile: preserve all size-table data with horizontal scrolling, never clipping it.
p=root/'app/globals.css'; css=p.read_text(encoding='utf-8')
marker='/* final-readiness-mobile-guard */'
if marker not in css:
    css+='''\n\n/* final-readiness-mobile-guard */\n.size-detail-grid,.size-detail-grid > *,.standalone-tool,.standalone-tool-body,.comparison-table{min-width:0;max-width:100%}\n.data-table-wrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-inline:contain}\n.tool-field .field-error{display:block;margin-top:5px;color:var(--red);font-size:11px;line-height:1.4}\n.tool-field input[aria-invalid="true"]{border-color:var(--red);box-shadow:0 0 0 2px rgba(169,52,46,.08)}\n.example-input-note{margin:-6px 0 20px;padding:9px 11px;border-left:3px solid var(--cyan);background:var(--cyan-soft);color:var(--ink-2);font-size:12px;line-height:1.55}\n@media(max-width:720px){\n  .size-detail-grid{grid-template-columns:minmax(0,1fr);gap:28px}\n  .data-table{min-width:560px}\n  .standalone-tool-head{align-items:flex-start;gap:10px;flex-direction:column}\n  .standalone-tool-head code{max-width:100%;white-space:normal;overflow-wrap:anywhere}\n  .result-grid,.result-metrics,.result-metrics.three{grid-template-columns:minmax(0,1fr)}\n}\n'''
p.write_text(css,encoding='utf-8')

# Privacy copy must describe local workspace records accurately rather than claiming projects are never saved.
p=root/'app/privacy/page.tsx'; privacy=p.read_text(encoding='utf-8')
old_privacy='The current tools do not create user accounts, save projects or maintain a server-side image library.'
new_privacy='The site does not create user accounts or maintain a server-side image library. Professional workspace features may save job records and settings in this browser’s local storage until you clear or export them.'
if old_privacy not in privacy: raise SystemExit('privacy accuracy marker changed')
privacy=privacy.replace(old_privacy,new_privacy)
p.write_text(privacy,encoding='utf-8')

# Worker fixes: conditional reloads for static-backed routes and explicit runtime
# aliases. Advanced-mode Pages routes requests through the Worker, so _redirects
# alone is not sufficient for these legacy paths.
p=root/'worker/index.ts'; worker=p.read_text(encoding='utf-8')
old_worker='''  const assetRequest = new Request(new URL(target, request.url), { method: request.method, headers: request.headers });\n  const response = await env.ASSETS.fetch(assetRequest);\n  return response.ok ? withSecurityHeaders(response, request) : null;'''
new_worker='''  const headers = new Headers(request.headers);\n  headers.delete("If-None-Match");\n  headers.delete("If-Modified-Since");\n  const assetRequest = new Request(new URL(target, request.url), { method: request.method, headers });\n  const response = await env.ASSETS.fetch(assetRequest);\n  return response.ok ? withSecurityHeaders(response, request) : null;'''
if old_worker not in worker: raise SystemExit('static route asset fetch marker changed')
worker=worker.replace(old_worker,new_worker,1)
legacy_marker='const GOOGLE_VERIFICATION_PATH = "/google6d67c58ff3b5201c.html";'
alias_block='''const LEGACY_ROUTE_ALIASES: Record<string, { target: string; status: 301 | 302 }> = {\n  "/workflow": { target: "/#workflow", status: 301 },\n  "/tools/best-print-size-finder": { target: "/scenarios", status: 301 },\n  "/tools/saddle-stitch-booklet-calculator": { target: "/signature-planner", status: 301 },\n  "/guides/best-file-format-for-printing": { target: "/guides/print-file-preflight-checklist", status: 301 },\n  "/guides/choose-best-photo-print-size": { target: "/scenarios", status: 301 },\n  "/guides/rgb-vs-cmyk-printing": { target: "/prepress-lab", status: 301 },\n  "/guides/saddle-stitch-booklet-page-count": { target: "/signature-planner", status: 301 },\n  "/tools/mat-frame-calculator": { target: "/tools", status: 302 },\n  "/tools/poster-tiling-calculator": { target: "/guides/export-images-for-large-format-printing", status: 302 },\n  "/guides/mat-frame-sizing-guide": { target: "/guides", status: 302 },\n  "/guides/tiled-poster-printing-guide": { target: "/guides/export-images-for-large-format-printing", status: 302 },\n};\n'''
if legacy_marker not in worker: raise SystemExit('legacy alias insertion marker changed')
worker=worker.replace(legacy_marker,alias_block+legacy_marker,1)
func_marker='''function legacyRedirect(url: URL): Response | null {\n  if (!LEGACY_HOSTS.has(url.hostname)) return null;'''
route_func='''function legacyRouteRedirect(url: URL): Response | null {\n  const rule = LEGACY_ROUTE_ALIASES[normalizedPath(url.pathname)];\n  if (!rule) return null;\n  const destination = new URL(rule.target, url.origin);\n  if (url.search) destination.search = url.search;\n  return new Response(null, {\n    status: rule.status,\n    headers: { Location: destination.toString(), "Cache-Control": rule.status === 301 ? "public, max-age=3600" : "no-cache" },\n  });\n}\n\n'''
if func_marker not in worker: raise SystemExit('legacy redirect function marker changed')
worker=worker.replace(func_marker,route_func+func_marker,1)
call_marker='''    const redirectResponse = legacyRedirect(url);\n    if (redirectResponse) return redirectResponse;\n\n    if (url.pathname === "/admin" || url.pathname === "/admin/") {'''
call_replacement='''    const redirectResponse = legacyRedirect(url);\n    if (redirectResponse) return redirectResponse;\n    const routeRedirectResponse = legacyRouteRedirect(url);\n    if (routeRedirectResponse) return routeRedirectResponse;\n\n    if (url.pathname === "/admin" || url.pathname === "/admin/") {'''
if call_marker not in worker: raise SystemExit('legacy route redirect call marker changed')
worker=worker.replace(call_marker,call_replacement,1)
p.write_text(worker,encoding='utf-8')

# Freshness metadata follows the reviewed release rather than the August baseline.
p=root/'lib/seo.ts'; seo=p.read_text(encoding='utf-8')
seo=seo.replace('export const SITE_UPDATED_AT = "2026-08-24";','export const SITE_UPDATED_AT = "2026-09-17";')
p.write_text(seo,encoding='utf-8')
print('Applied final source patch: inputs, examples, mobile overflow, privacy accuracy, reload cache, legacy aliases, SEO freshness')
