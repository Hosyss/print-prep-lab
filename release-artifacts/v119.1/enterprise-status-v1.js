(()=>{'use strict';
const S={NO_DATA:'NO_DATA',INVALID:'INVALID',REVIEW:'REVIEW',BLOCK:'BLOCK',PASS:'PASS',UNRESOLVED:'UNRESOLVED'};
const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v), finite=v=>typeof v==='number'&&Number.isFinite(v), nonneg=v=>finite(v)&&v>=0;
const lang=()=>document.documentElement.lang==='ar'?'ar':'en';
const tr=(en,ar)=>lang()==='ar'?ar:en;
const result=(state,en,ar,meta={})=>({state,reason:tr(en,ar),...meta});
const invalid=(en='Saved data is incomplete or invalid.',ar='البيانات المحفوظة ناقصة أو غير صالحة.')=>result(S.INVALID,en,ar);
const nodata=(en='No saved evidence is available.',ar='لا توجد أدلة محفوظة.')=>result(S.NO_DATA,en,ar);
const unresolved=(en='The saved evidence does not define a decisive state.',ar='الأدلة المحفوظة لا تحدد حالة حاسمة.')=>result(S.UNRESOLVED,en,ar);
function qa(v){
  if(Array.isArray(v)){
    if(!v.length)return nodata('No QA checkpoints are saved.','لا توجد نقاط فحص QA محفوظة.');
    const allowed=new Set(['pass','review','blocker']);
    if(v.some(x=>!isObj(x)||!allowed.has(String(x.status||'').toLowerCase())))return invalid('QA history contains a checkpoint with a missing or invalid status.','سجل QA يحتوي على نقطة فحص بحالة مفقودة أو غير صالحة.');
    const normalized=v.map(x=>String(x.status||'').toLowerCase());
    const blocker=normalized.filter(x=>x==='blocker').length, review=normalized.filter(x=>x==='review').length, pass=normalized.filter(x=>x==='pass').length;
    if(blocker>0)return result(S.BLOCK,`${blocker} QA blocker${blocker===1?' is':'s are'} recorded.`,`${blocker} عائق QA مسجل.` ,{counts:{total:v.length,pass,review,blocker}});
    if(review>0)return result(S.REVIEW,`${review} QA checkpoint${review===1?' needs':'s need'} review.`,`${review} نقطة QA تحتاج مراجعة.`,{counts:{total:v.length,pass,review,blocker}});
    return result(S.PASS,`All ${v.length} recorded QA checkpoints are marked pass.`,`كل نقاط QA المسجلة وعددها ${v.length} بحالة اجتياز.`,{counts:{total:v.length,pass,review,blocker}});
  }
  if(!isObj(v))return nodata('No QA summary is saved.','لا يوجد ملخص QA محفوظ.');
  const keys=['total','pass','review','blocker'];
  if(keys.some(k=>!nonneg(v[k])||!Number.isInteger(v[k])))return invalid('QA summary counts are missing or invalid.','أعداد ملخص QA مفقودة أو غير صالحة.');
  const {total,pass,review,blocker}=v;
  if(pass+review+blocker>total)return invalid('QA summary counts exceed the recorded total.','أعداد ملخص QA تتجاوز الإجمالي المسجل.');
  if(total===0)return nodata('QA history exists but contains zero checkpoints.','سجل QA موجود لكنه يحتوي على صفر نقاط فحص.');
  if(blocker>0)return result(S.BLOCK,`${blocker} QA blocker${blocker===1?' is':'s are'} recorded.`,`${blocker} عائق QA مسجل.`,{counts:{total,pass,review,blocker}});
  if(review>0)return result(S.REVIEW,`${review} QA checkpoint${review===1?' needs':'s need'} review.`,`${review} نقطة QA تحتاج مراجعة.`,{counts:{total,pass,review,blocker}});
  if(pass===total)return result(S.PASS,`All ${total} recorded QA checkpoints are marked pass.`,`كل نقاط QA المسجلة وعددها ${total} بحالة اجتياز.`,{counts:{total,pass,review,blocker}});
  return unresolved('QA has recorded checkpoints that are not accounted for as pass, review or blocker.','هناك نقاط QA مسجلة غير محسوبة كاجتياز أو مراجعة أو عائق.');
}
function preflight(v){
  if(!isObj(v))return nodata('No preflight result is saved.','لا توجد نتيجة Preflight محفوظة.');
  const state=String(v.state||'').toLowerCase(), blockers=v.blockers, warnings=v.warnings;
  if(blockers!==undefined&&!nonneg(blockers))return invalid('Preflight blocker count is invalid.','عدد عوائق Preflight غير صالح.');
  if(warnings!==undefined&&!nonneg(warnings))return invalid('Preflight warning count is invalid.','عدد تحذيرات Preflight غير صالح.');
  if(blockers>0||state==='blocked')return result(S.BLOCK,`${Number(blockers||0)} preflight blocker${Number(blockers||0)===1?' is':'s are'} recorded.`,`تم تسجيل ${Number(blockers||0)} عائق في Preflight.`);
  if(warnings>0||state==='review')return result(S.REVIEW,'Preflight still has warnings or review items.','ما زالت نتيجة Preflight تحتوي تحذيرات أو عناصر للمراجعة.');
  if(state==='ready'&&(blockers===undefined||blockers===0)&&(warnings===undefined||warnings===0))return result(S.PASS,'Preflight reports Ready with no recorded blocker or warning.','نتيجة Preflight جاهزة ولا يوجد عائق أو تحذير مسجل.');
  return state?invalid('Preflight state is not recognized.','حالة Preflight غير معروفة.'):unresolved('Preflight data exists but has no decisive state.','بيانات Preflight موجودة لكن بدون حالة حاسمة.');
}
function approvals(v){
  if(Array.isArray(v)){
    if(!v.length)return nodata('No approval gates are saved.','لا توجد بوابات اعتماد محفوظة.');
    if(v.some(x=>!isObj(x)||typeof x.required!=='boolean'||!['pending','approved','rejected'].includes(String(x.status||''))))return invalid('Approval data contains a missing or invalid required/status field.','بيانات الاعتماد تحتوي حقل required أو status مفقودًا أو غير صالح.');
    const required=v.filter(x=>x.required), blocking=required.filter(x=>x.status!=='approved').length, approved=required.filter(x=>x.status==='approved').length;
    if(blocking>0)return result(S.BLOCK,`${blocking} required approval gate${blocking===1?' is':'s are'} pending or rejected.`,`${blocking} بوابة اعتماد مطلوبة ما زالت معلقة أو مرفوضة.`);
    return result(S.PASS,required.length?`All ${required.length} required approval gates are approved.`:'The saved approval matrix has no gates marked required.',required.length?`كل بوابات الاعتماد المطلوبة وعددها ${required.length} معتمدة.`:'مصفوفة الاعتماد المحفوظة لا تحتوي بوابات معلّمة كمطلوبة.');
  }
  if(!isObj(v))return nodata('No approval summary is saved.','لا يوجد ملخص اعتماد محفوظ.');
  const {required,approved,blocking}=v;
  if([required,approved,blocking].some(x=>!nonneg(x)||!Number.isInteger(x))||approved>required||blocking>required)return invalid('Approval summary counts are missing or invalid.','أعداد ملخص الاعتماد مفقودة أو غير صالحة.');
  if(blocking>0)return result(S.BLOCK,`${blocking} required approval gate${blocking===1?' is':'s are'} pending or rejected.`,`${blocking} بوابة اعتماد مطلوبة ما زالت معلقة أو مرفوضة.`);
  if(approved===required)return result(S.PASS,required?`All ${required} required approval gates are approved.`:'The saved approval summary has no required gates.',required?`كل بوابات الاعتماد المطلوبة وعددها ${required} معتمدة.`:'ملخص الاعتماد المحفوظ لا يحتوي بوابات مطلوبة.');
  return unresolved('Approval summary does not account for all required gates.','ملخص الاعتماد لا يوضح حالة كل البوابات المطلوبة.');
}
function job(v){
  if(!isObj(v))return nodata('No Job Core record is saved.','لا يوجد سجل Job Core محفوظ.');
  if(!String(v.name||'').trim()||!String(v.revision||'').trim()||!finite(Number(v.quantity))||Number(v.quantity)<=0)return invalid('Job Core is missing a readable name, revision or positive quantity.','سجل Job Core يفتقد اسمًا أو مراجعة أو كمية موجبة قابلة للقراءة.');
  return result(S.PASS,'A readable Job Core record is saved.','يوجد سجل Job Core محفوظ وقابل للقراءة.');
}
function supplier(v){
  if(!isObj(v)||!Array.isArray(v.providers)||v.providers.length===0)return nodata('No supplier evaluation is saved.','لا يوجد تقييم مورد محفوظ.');
  if(v.providers.some(x=>!isObj(x)))return invalid('Supplier evaluation contains invalid provider data.','تقييم المورد يحتوي بيانات مورد غير صالحة.');
  return unresolved('Supplier data exists, but eligibility is intentionally not decided in Phase 2a.','بيانات المورد موجودة، لكن أهلية المورد لم تُحسم عمدًا في المرحلة 2أ.');
}
function risk(v){
  if(Array.isArray(v)){
    if(!v.length)return nodata('No risks are recorded.','لا توجد مخاطر مسجلة.');
    let high=0,review=0;
    for(const x of v){if(!isObj(x)||!finite(Number(x.prob))||!finite(Number(x.impact))||!['open','mitigated'].includes(String(x.state||'')))return invalid('Risk register contains an invalid probability, impact or state.','سجل المخاطر يحتوي احتمالًا أو أثرًا أو حالة غير صالحة.');if(x.state==='open'){const score=Number(x.prob)*Number(x.impact);if(score>=15)high++;else if(score>=8)review++;}}
    if(high>0)return result(S.BLOCK,`${high} open high-scoring risk${high===1?' is':'s are'} recorded.`,`${high} مخاطرة عالية مفتوحة مسجلة.`);
    if(review>0)return result(S.REVIEW,`${review} open medium risk${review===1?' needs':'s need'} review.`,`${review} مخاطرة متوسطة مفتوحة تحتاج مراجعة.`);
    return result(S.PASS,'No open high or medium risk is recorded.','لا توجد مخاطر عالية أو متوسطة مفتوحة.');
  }
  if(!isObj(v))return nodata('No risk summary is saved.','لا يوجد ملخص مخاطر محفوظ.');
  if(['open','high','review'].some(k=>!nonneg(v[k])||!Number.isInteger(v[k])))return invalid('Risk summary counts are missing or invalid.','أعداد ملخص المخاطر مفقودة أو غير صالحة.');
  if(v.high>v.open||v.review>v.open)return invalid('Risk summary counts are inconsistent.','أعداد ملخص المخاطر غير متسقة.');
  if(v.high>0)return result(S.BLOCK,`${v.high} open high-scoring risk${v.high===1?' is':'s are'} recorded.`,`${v.high} مخاطرة عالية مفتوحة مسجلة.`);
  if(v.review>0)return result(S.REVIEW,`${v.review} open medium risk${v.review===1?' needs':'s need'} review.`,`${v.review} مخاطرة متوسطة مفتوحة تحتاج مراجعة.`);
  if(nonneg(v.total)&&v.total===0)return nodata('Risk summary exists but contains zero records.','ملخص المخاطر موجود لكنه يحتوي على صفر سجلات.');
  return result(S.PASS,'No open high or medium risk is recorded.','لا توجد مخاطر عالية أو متوسطة مفتوحة.');
}
function stock(v){
  if(!isObj(v))return nodata('No stock signal is saved.','لا توجد إشارة مخزون محفوظة.');
  const state=String(v.state||'').toUpperCase();
  if(state==='SHORT')return result(S.BLOCK,'Saved stock is short for the entered requirement and safety stock.','المخزون المحفوظ غير كافٍ للكمية المطلوبة ومخزون الأمان.');
  if(state==='REORDER')return result(S.REVIEW,'The job is covered, but the saved position crosses the reorder point.','المهمة مغطاة لكن الوضع المحفوظ يتجاوز نقطة إعادة الطلب.');
  if(state==='COVERED')return result(S.PASS,'Saved stock covers the entered job and safety stock.','المخزون المحفوظ يغطي المهمة ومخزون الأمان.');
  return invalid('Stock state is missing or not recognized.','حالة المخزون مفقودة أو غير معروفة.');
}
const boolGate=(v,key,goodEn,goodAr,badEn,badAr)=>{if(!isObj(v))return nodata();if(typeof v[key]!=='boolean')return invalid();return v[key]?result(S.PASS,goodEn,goodAr):result(S.BLOCK,badEn,badAr)};
function countGate(v,badKey,reviewKey,passEn,passAr,badEn,badAr,reviewEn,reviewAr){if(!isObj(v))return nodata();if(!nonneg(v[badKey])||(reviewKey&&!nonneg(v[reviewKey])))return invalid();if(v[badKey]>0)return result(S.BLOCK,badEn,badAr);if(reviewKey&&v[reviewKey]>0)return result(S.REVIEW,reviewEn,reviewAr);return result(S.PASS,passEn,passAr)}
function stateGate(v,map){if(!isObj(v))return nodata();const state=String(v.state||v.status||'').toUpperCase();if(!state)return invalid();const hit=map[state];return hit?result(hit[0],hit[1],hit[2]):invalid('Saved state is not recognized.','الحالة المحفوظة غير معروفة.');}
function audit(v){
  if(!isObj(v))return nodata('No readiness audit is saved.','لا يوجد تدقيق جاهزية محفوظ.');
  const version=Number(v.version);
  if(v.decisionModel!=='explicit-fields-v2'||(Number.isInteger(version)&&version<2))return unresolved('A legacy readiness audit is saved. Run Readiness Audit again before relying on it.','يوجد تدقيق جاهزية قديم محفوظ. أعد تشغيل تدقيق الجاهزية قبل الاعتماد عليه.');
  const status=String(v.status||'').toUpperCase(), required=v.required, unresolvedItems=v.unresolved, blockers=v.blockers;
  if(!Number.isInteger(version)||version<2||!['READY','REVIEW','HOLD'].includes(status)||!Number.isInteger(required)||required<0||!Array.isArray(unresolvedItems)||!Array.isArray(blockers))return invalid('Readiness audit fields are missing or invalid.','حقول تدقيق الجاهزية مفقودة أو غير صالحة.');
  if(required===0)return unresolved('The saved readiness audit has no selected checks.','تدقيق الجاهزية المحفوظ لا يحتوي فحوصًا محددة.');
  if(status==='READY'&&(unresolvedItems.length>0||blockers.length>0))return invalid('Readiness audit says READY but still records unresolved evidence or blockers.','تدقيق الجاهزية يقول READY لكنه ما زال يسجل أدلة غير محسومة أو عوائق.');
  if(status==='REVIEW'&&blockers.length>0)return invalid('Readiness audit says REVIEW but records a blocker.','تدقيق الجاهزية يقول REVIEW لكنه يسجل عائقًا.');
  if(status==='HOLD'&&blockers.length===0)return invalid('Readiness audit says HOLD without a recorded blocker.','تدقيق الجاهزية يقول HOLD بدون عائق مسجل.');
  if(blockers.length>0)return result(S.BLOCK,'The saved readiness audit records blocking evidence.','تدقيق الجاهزية المحفوظ يسجل أدلة مانعة.');
  if(unresolvedItems.length>0||status==='REVIEW')return result(S.REVIEW,'The saved readiness audit still has unresolved evidence.','تدقيق الجاهزية المحفوظ ما زال يحتوي أدلة غير محسومة.');
  if(status==='READY')return result(S.PASS,'The selected checks in the saved readiness audit passed.','الفحوص المحددة في تدقيق الجاهزية المحفوظ اجتازت.');
  return invalid('Readiness audit state is internally inconsistent.','حالة تدقيق الجاهزية غير متسقة داخليًا.');
}
function evaluate(kind,v){
  switch(kind){
    case 'job':return job(v);case 'preflight':return preflight(v);case 'approvals':return approvals(v);case 'qa':return qa(v);case 'supplier':return supplier(v);case 'risk':return risk(v);case 'stock':return stock(v);case 'audit':return audit(v);
    case 'capacity':return boolGate(v,'feasible','Capacity model is feasible.','نموذج السعة قابل للتنفيذ.','Capacity model is not feasible.','نموذج السعة غير قابل للتنفيذ.');
    case 'timeline':return boolGate(v,'feasible','Timeline window is feasible.','النافذة الزمنية قابلة للتنفيذ.','Timeline model is late.','النموذج الزمني متأخر.');
    case 'queue':if(!isObj(v))return nodata();if(!nonneg(v.total)||!nonneg(v.late))return invalid();if(v.total===0)return nodata('Queue summary exists but contains zero jobs.','ملخص قائمة الإنتاج موجود لكنه يحتوي على صفر مهام.');return v.late>0?result(S.BLOCK,`${v.late} queued job${v.late===1?' is':'s are'} late.`,`${v.late} مهمة في قائمة الإنتاج متأخرة.`):result(S.PASS,'No queued job is late.','لا توجد مهمة متأخرة في قائمة الإنتاج.');
    case 'calibration':return countGate(v,'overdue','review','No active overdue or review condition is recorded.','لا توجد حالة نشطة متأخرة أو تحتاج مراجعة.','At least one active calibration/condition record is overdue.','يوجد سجل معايرة/حالة نشط متأخر على الأقل.','Calibration/condition records need review.','سجلات المعايرة/الحالة تحتاج مراجعة.');
    case 'capa':return countGate(v,'critical','open','No open CAPA record is reported.','لا يوجد سجل CAPA مفتوح.','A critical CAPA record remains open.','يوجد سجل CAPA حرج ما زال مفتوحًا.','CAPA records remain open.','ما زالت سجلات CAPA مفتوحة.');
    case 'procurement':return stateGate(v,{'ORDER NOW':[S.BLOCK,'Procurement signal says ORDER NOW.','إشارة المشتريات تقول اطلب الآن.'],'ORDER SOON':[S.REVIEW,'Procurement signal says ORDER SOON.','إشارة المشتريات تقول اطلب قريبًا.'],'COVERED':[S.PASS,'Procurement cover is adequate.','تغطية المشتريات كافية.']});
    case 'waste':return stateGate(v,{'LOW YIELD':[S.BLOCK,'Saved first-pass yield is below the tool threshold.','العائد المحفوظ أقل من حد الأداة.'],'REVIEW':[S.REVIEW,'Saved yield is in the review band.','العائد المحفوظ في نطاق المراجعة.'],'GOOD':[S.PASS,'Saved yield is in the good band.','العائد المحفوظ في النطاق الجيد.']});
    case 'change':if(!isObj(v))return nodata();if(!nonneg(v.invalidatedCount)||!nonneg(v.changedCount))return invalid();return v.invalidatedCount>0?result(S.BLOCK,'A saved change invalidated downstream evidence.','تغيير محفوظ أبطل صلاحية أدلة لاحقة.'):v.changedCount>0?result(S.REVIEW,'Saved job inputs changed and need review.','مدخلات المهمة المحفوظة تغيرت وتحتاج مراجعة.'):result(S.PASS,'No supported baseline change is recorded.','لا يوجد تغيير مسجل في خط الأساس المدعوم.');
    case 'compliance':return stateGate(v,{'HOLD':[S.BLOCK,'Compliance evidence is on hold.','أدلة الامتثال في حالة إيقاف.'],'REVIEW':[S.REVIEW,'Compliance evidence needs review.','أدلة الامتثال تحتاج مراجعة.'],'READY':[S.PASS,'Recorded compliance requirements passed.','متطلبات الامتثال المسجلة اجتازت.']});
    case 'schedule':if(!isObj(v))return nodata();if(!nonneg(v.late))return invalid();return v.late>0?result(S.BLOCK,`${v.late} scheduled job${v.late===1?' is':'s are'} late.`,`${v.late} مهمة مجدولة متأخرة.`):result(S.PASS,'No scheduled job is late.','لا توجد مهمة مجدولة متأخرة.');
    case 'material':return stateGate(v,{'REORDER':[S.REVIEW,'Material signal crossed the reorder trigger.','إشارة الخامة تجاوزت نقطة إعادة الطلب.'],'COVERED':[S.PASS,'Material signal is covered.','إشارة الخامة مغطاة.']});
    default:return unresolved('This stored category has no explicit Phase 2a decision rule.','هذه الفئة المحفوظة ليس لها قاعدة قرار صريحة في المرحلة 2أ.');
  }
}
function pick(signals,kind,keys){for(const key of keys)if(Object.prototype.hasOwnProperty.call(signals,key))return{kind,key,value:signals[key],result:evaluate(kind,signals[key])};return{kind,key:keys[0],value:null,result:evaluate(kind,null)}}
const GLOBAL_SOURCES=[
 ['job',['enterprise-job-core-v1']],['preflight',['preflight-signal-v1','preflight-last-v1']],['approvals',['approval-summary-v1','approvals-v1']],['qa',['qa-summary-v1','qa-history-v1']],['risk',['risk-summary-v1','risk-register-v1']],['stock',['stock-last-v1']],['supplier',['supplier-intelligence-last-v1']],['capacity',['capacity-last-v1']],['timeline',['timeline-last-v1']],['queue',['queue-summary-v1']],['calibration',['calibration-summary-v1']],['capa',['capa-summary-v1']],['procurement',['procurement-last-v1']],['waste',['waste-last-v1']],['change',['change-impact-last-v1']],['compliance',['compliance-center-last-v1']],['schedule',['schedule-optimizer-last-v1']],['material',['material-intelligence-last-v1']]
];
function global(signals){return GLOBAL_SOURCES.map(([kind,keys])=>pick(signals,kind,keys)).filter(x=>x.value!==null&&x.value!==undefined)}
function aggregate(results,{passState='PASS',emptyState='NO_DATA'}={}){const a=results.map(x=>x.result||x);if(a.some(x=>x.state===S.BLOCK))return S.BLOCK;if(a.some(x=>x.state===S.INVALID))return S.INVALID;if(a.some(x=>x.state===S.REVIEW))return S.REVIEW;if(a.some(x=>x.state===S.UNRESOLVED))return S.UNRESOLVED;if(a.some(x=>x.state===S.NO_DATA))return S.NO_DATA;return a.length?passState:emptyState}
function badge(state){return ({BLOCK:'BLOCK',INVALID:'INVALID',REVIEW:'REVIEW',UNRESOLVED:'UNRESOLVED',NO_DATA:'NO DATA',PASS:'PASS'}[state]||state)}
function cls(state){return state===S.BLOCK||state===S.INVALID?'bad':state===S.PASS?'good':'warn'}
function label(kind){const x={job:['Job Core','Job Core'],preflight:['Preflight','الفحص المسبق'],approvals:['Approvals','الاعتمادات'],qa:['QA','ضبط الجودة'],supplier:['Supplier','المورد'],risk:['Risk','المخاطر'],stock:['Stock','المخزون'],audit:['Readiness audit','تدقيق الجاهزية'],capacity:['Capacity','السعة'],timeline:['Timeline','الجدول الزمني'],queue:['Production queue','قائمة الإنتاج'],calibration:['Calibration / conditions','المعايرة / الحالات'],capa:['CAPA','الإجراءات التصحيحية'],procurement:['Procurement','المشتريات'],waste:['Waste / yield','الهدر / العائد'],change:['Change impact','أثر التغيير'],compliance:['Compliance','الامتثال'],schedule:['Schedule','الجدولة'],material:['Material','الخامة']}[kind]||[kind,kind];return tr(x[0],x[1])}
window.PPLStatusRules={S,evaluate,pick,global,aggregate,badge,cls,label,tr};
})();
