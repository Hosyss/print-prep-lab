#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: phase2b-supplier-patch.py ENTERPRISE_SUITE SUPPLIER_HTML')

suite_path=Path(sys.argv[1]); html_path=Path(sys.argv[2])
js=suite_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')

def replace_block(text,start,end,new):
    a=text.find(start)
    if a < 0: raise SystemExit(f'missing start marker: {start}')
    b=text.find(end,a)
    if b < 0: raise SystemExit(f'missing end marker: {end}')
    return text[:a]+new+text[b:]

status_supplier=r'''function supplier(v){
  if(!isObj(v)||!Array.isArray(v.providers)||v.providers.length===0)return nodata('No supplier evaluation is saved.','لا يوجد تقييم مورد محفوظ.');
  if(v.providers.some(x=>!isObj(x)))return invalid('Supplier evaluation contains invalid provider data.','تقييم المورد يحتوي بيانات مورد غير صالحة.');
  const scoreKeys=['cap','quality','lead','price','risk'];
  if(v.providers.some(x=>scoreKeys.some(k=>!finite(Number(x[k]))||Number(x[k])<0||Number(x[k])>100)))return invalid('Supplier evaluation contains a score outside the supported 0–100 range.','تقييم المورد يحتوي درجة خارج النطاق المدعوم من 0 إلى 100.');
  const states=v.providers.map(x=>String(x.eligibility||'unassessed').toLowerCase());
  if(states.some(x=>!['eligible','ineligible','unassessed'].includes(x)))return invalid('Supplier eligibility contains an invalid explicit state.','أهلية المورد تحتوي حالة صريحة غير صالحة.');
  const eligibleProviders=v.providers.filter((x,i)=>states[i]==='eligible'),unassessed=states.filter(x=>x==='unassessed').length;
  if(eligibleProviders.length>0){
    const bestId=isObj(v.best)?String(v.best.id||''):'';
    const matched=eligibleProviders.find(x=>String(x.id||'')===bestId);
    if(!matched||String(v.best.eligibility||'').toLowerCase()!=='eligible')return invalid('Eligible suppliers exist, but the saved best supplier is not one of the explicitly eligible providers.','يوجد موردون مؤهلون لكن المورد الأفضل المحفوظ ليس واحدًا من الموردين المؤهلين صراحة.');
    return result(S.PASS,`${eligibleProviders.length} explicitly eligible supplier${eligibleProviders.length===1?' is':'s are'} available; ranking is limited to eligible suppliers.`,`${eligibleProviders.length} مورد مؤهل صراحة متاح، والترتيب مقتصر على الموردين المؤهلين.`);
  }
  if(unassessed>0)return unresolved('No eligible supplier is selected yet; at least one supplier still has eligibility Not assessed.','لم يتم تحديد مورد مؤهل بعد، وما زال هناك مورد واحد على الأقل لم تُقيّم أهليته.');
  return result(S.BLOCK,'All saved suppliers are explicitly ineligible; no eligible supplier is available.','كل الموردين المحفوظين غير مؤهلين صراحة؛ لا يوجد مورد مؤهل متاح.');
}'''
js=replace_block(js,'function supplier(v){','\nfunction risk(v){',status_supplier)

ui_supplier=r'''function supplier(){const KEY='enterprise-suppliers-v1',W={cap:.35,quality:.25,lead:.15,price:.15,risk:.10},scoreInput=id=>Math.min(100,Math.max(0,n(id)));
function normalized(r){const raw=String(r.eligibility||'unassessed').toLowerCase(),eligibility=['eligible','ineligible'].includes(raw)?raw:'unassessed';return {...r,eligibility,score:Math.round(Number(r.cap||0)*W.cap+Number(r.quality||0)*W.quality+Number(r.lead||0)*W.lead+Number(r.price||0)*W.price+(100-Number(r.risk||0))*W.risk)}}
function render(){const saved=C.read(KEY,[]),arr=saved.map(normalized),eligible=arr.filter(r=>r.eligibility==='eligible').sort((a,b)=>b.score-a.score),unassessed=arr.filter(r=>r.eligibility==='unassessed').sort((a,b)=>b.score-a.score),ineligible=arr.filter(r=>r.eligibility==='ineligible').sort((a,b)=>b.score-a.score),best=eligible[0]||null,ordered=[...eligible,...unassessed,...ineligible];let rows=[];if(!eligible.length&&ordered.length)rows.push(row('No eligible supplier selected',unassessed.length?'Assess eligibility explicitly before choosing a best supplier.':'All assessed suppliers are ineligible.','NONE',unassessed.length?'warn':'bad'));rows.push(...ordered.map((r)=>{const note=r.eligibilityNote?` · ${r.eligibilityNote}`:'';if(r.eligibility==='eligible'){const rank=eligible.findIndex(x=>x.id===r.id)+1;return row(r.name,`Capability ${r.cap} · quality ${r.quality} · lead ${r.lead} · price ${r.price} · risk ${r.risk}${note}`,`RANK #${rank} · ${r.score}/100`,rank===1?'good':'warn')}if(r.eligibility==='ineligible')return row(r.name,`Score ${r.score}/100 is not ranked${note}`,'INELIGIBLE','bad');return row(r.name,`Score ${r.score}/100 is not ranked${note}`,'NOT ASSESSED','warn')}));$('si-list').innerHTML=rows.join('')||row('No providers scored','Add a provider using only evidence you control.','EMPTY','warn');C.write('supplier-intelligence-last-v1',{schema:'ppl-supplier-intelligence',version:2,decisionModel:'explicit-eligibility-v1',updatedAt:C.now(),weights:{capability:35,quality:25,leadTime:15,price:15,risk:10},providers:ordered,eligibleCount:eligible.length,unassessedCount:unassessed.length,ineligibleCount:ineligible.length,best})}
$('si-add').onclick=()=>{const a=C.read(KEY,[]),name=$('si-name').value.trim();a.push({id:C.id(),name:name||'Provider',cap:scoreInput('si-cap'),quality:scoreInput('si-quality'),lead:scoreInput('si-lead'),price:scoreInput('si-price'),risk:scoreInput('si-risk'),eligibility:$('si-eligibility').value,eligibilityNote:$('si-eligibility-note').value.trim()});C.write(KEY,a);render()};render()}'''
js=replace_block(js,'function supplier(){','\nfunction releaseCenter(){',ui_supplier)

repls=[
('<h1>Compare providers against the job, not a generic score.</h1><p>Score capability, quality, lead time, price and risk with user-controlled weights and explicit gaps.</p>','<h1>Compare providers against the job, not a generic score.</h1><p>Assess eligibility explicitly first, then rank only eligible providers with fixed Phase 2 weights.</p>'),
('<span class="ep-pill">✓ Capability gates</span>','<span class="ep-pill">✓ Explicit eligibility</span>'),
('Score capability, quality, lead time, price and risk with user-controlled weights and explicit gaps.','Score providers with fixed Phase 2 weights after eligibility is explicitly assessed from your own evidence.'),
('<label>Risk (0–100)<input id="si-risk" max="100" min="0" type="number" value="15"/></label>','<label>Risk (0–100)<input id="si-risk" max="100" min="0" type="number" value="15"/></label><label>Eligibility<select id="si-eligibility"><option value="unassessed">Not assessed</option><option value="eligible">Eligible</option><option value="ineligible">Ineligible</option></select></label><label>Eligibility evidence / note<input id="si-eligibility-note" placeholder="e.g. written process/spec confirmation"/></label>'),
('<h3>Example</h3><p>Start by treating hard capability as a gate. Maximum sheet size, supported file format, finishing process or minimum resolution can make a provider unsuitable regardless of how attractive its price is. Record those facts first, then use quality, lead-time, price and risk scores to compare the providers that remain plausible.</p>','<h3>Example</h3><p>Decide eligibility first from job-specific evidence such as supported size, file format or finishing process. This phase does not infer a numeric eligibility threshold. Only providers you explicitly mark Eligible enter the ranking.</p>'),
('<h3>Interpretation</h3><p>The default weighting favors capability and quality because a cheap quote is not useful when the provider cannot reproduce the job. Change the entered scores only when you have evidence such as a written specification, measured delivery performance or documented quality history.</p>','<h3>Interpretation</h3><p>Phase 2 uses fixed weights: capability 35%, quality 25%, lead time 15%, price 15% and risk 10%. A weight editor is deferred; change provider scores only when you have evidence such as a written specification, measured delivery performance or documented quality history.</p>'),
('<h3>Capability is a gate, not a bonus</h3><p>A low-cost provider that cannot meet size, format or process requirements should not win merely because its weighted price score is high.</p>','<h3>Eligibility is a gate, not a bonus</h3><p>An Ineligible or Not assessed provider never becomes the automatic best supplier, even when its weighted score is higher.</p>'),
('<h3>Weights are visible</h3><p>Quality, lead time and price weights stay editable so the ranking reflects the job rather than an opaque algorithm.</p>','<h3>Weights are fixed in Phase 2</h3><p>The current ranking uses capability 35%, quality 25%, lead time 15%, price 15% and risk 10%. Weight editing is intentionally deferred.</p>')
]
for old,new in repls:
    if old not in html: raise SystemExit(f'missing html fragment: {old[:70]}')
    html=html.replace(old,new)

suite_path.write_text(js,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
print('Phase2b patched supplier eligibility, ranking and claims')
