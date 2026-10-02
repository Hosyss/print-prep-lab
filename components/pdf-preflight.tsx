"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { inspectPdf, PDF_MAX_BYTES, type PdfInspection, type PdfPageResult } from "@/lib/pdf-preflight-engine";
import { pointsToMm } from "@/lib/pdf-preflight-math";

const fmt = (n: number) => n.toFixed(2).replace(/\.00$/, "");
function useLanguage() {
  const [language,setLanguage]=useState("en");
  useEffect(()=>{const update=()=>setLanguage(document.documentElement.lang==="ar"?"ar":"en");update();window.addEventListener("print-prep:languagechange",update);return()=>window.removeEventListener("print-prep:languagechange",update);},[]);
  return language;
}
type Targets={bleed:number;ppi:number;width:number;height:number};
function checks(page:PdfPageResult, targets:Targets) {
  return {
    size: !targets.width && !targets.height ? null : Math.abs(page.size.width-targets.width)<=0.5 && Math.abs(page.size.height-targets.height)<=0.5,
    bleed: !page.explicitTrim || !page.explicitBleed ? null : page.boxesValid && Math.min(...page.margins)+0.05>=targets.bleed,
    images: page.unassessedImages ? null : page.images.length ? page.images.every(image=>image.minimum+0.05>=targets.ppi) : null,
  };
}
function PdfPreview({document:pdf,pageNumber,boxes,t}:{document:PDFDocumentProxy;pageNumber:number;boxes:PdfPageResult;t:(en:string,ar:string)=>string}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const [overlay,setOverlay]=useState<{width:number;height:number;trim:number[];bleed:number[]}|null>(null);
  const [error,setError]=useState(false);
  useEffect(()=>{
    let cancelled=false; let renderTask:ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>|undefined;
    setOverlay(null);setError(false);
    void (async()=>{
      const page=await pdf.getPage(pageNumber);if(cancelled||!canvas.current)return;
      const base=page.getViewport({scale:1}), viewport=page.getViewport({scale:Math.min(760/base.width,950/base.height)});
      const element=canvas.current; element.width=Math.ceil(viewport.width);element.height=Math.ceil(viewport.height);
      const context=element.getContext("2d");if(!context)throw new Error("canvas");
      renderTask=page.render({canvas:element,canvasContext:context,viewport});await renderTask.promise;if(cancelled)return;
      const rect=(box:typeof boxes.trim)=>{const [a,b,c,d,e,f]=viewport.transform;const point=(x:number,y:number)=>[a*x+c*y+e,b*x+d*y+f];return [...point(box.x,box.y),...point(box.x+box.width,box.y+box.height)];};
      setOverlay({width:viewport.width,height:viewport.height,trim:rect(boxes.trim),bleed:rect(boxes.bleed)});
    })().catch(()=>{if(!cancelled)setError(true);});
    return()=>{cancelled=true;renderTask?.cancel();};
  },[pdf,pageNumber,boxes]);
  function rectangle(r:number[]) {return {x:Math.min(r[0],r[2]),y:Math.min(r[1],r[3]),width:Math.abs(r[2]-r[0]),height:Math.abs(r[3]-r[1])};}
  return <figure className="pdf-preview"><div className="pdf-preview-paper"><canvas ref={canvas} aria-label={t("PDF page preview","معاينة صفحة PDF")} data-pdf-preview={overlay?"ready":"loading"}/>{overlay&&<svg viewBox={`0 0 ${overlay.width} ${overlay.height}`} aria-hidden="true">{boxes.explicitBleed&&<rect {...rectangle(overlay.bleed)} className="pdf-bleed-line"/>}{boxes.explicitTrim&&<rect {...rectangle(overlay.trim)} className="pdf-trim-line"/>}</svg>}</div><figcaption>{error?t("Preview could not render. The measured results remain below.","تعذر رسم المعاينة. نتائج القياس موجودة بالأسفل."):t("Preview uses the PDF CropBox. Dashed blue: trim. Solid orange: bleed. Edges outside the CropBox are clipped in this preview.","تستخدم المعاينة إطار CropBox. الأزرق المتقطع: التشذيب. البرتقالي المتصل: النزف. ما يقع خارج CropBox لا يظهر في المعاينة.")}</figcaption></figure>;
}

export function PdfPreflight() {
  const language=useLanguage(),t=(en:string,ar:string)=>language==="ar"?ar:en;
  const [inspection,setInspection]=useState<PdfInspection|null>(null),[fileName,setFileName]=useState("");
  const [busy,setBusy]=useState(false),[progress,setProgress]=useState(""),[error,setError]=useState("");
  const [selected,setSelected]=useState(0),[targets,setTargets]=useState<Targets>({bleed:3,ppi:300,width:0,height:0});
  const generation=useRef(0),current=useRef<PdfInspection|null>(null),input=useRef<HTMLInputElement>(null);
  useEffect(()=>()=>{generation.current++;void current.current?.document.loadingTask.destroy();},[]);
  async function choose(file:File) {
    const id=++generation.current;
    setBusy(true);setError("");setProgress("");setInspection(null);setSelected(0);setFileName(file.name);
    await current.current?.document.loadingTask.destroy();current.current=null;
    try {
      if(file.size>PDF_MAX_BYTES)throw new Error("size");
      const bytes=new Uint8Array(await file.arrayBuffer());
      // The parser validates the file content; filename and MIME are not proof.
      const result=await inspectPdf(bytes,(page,total)=>{if(generation.current===id)setProgress(`${page} / ${total}`);},()=>generation.current!==id);
      if(generation.current!==id){await result.document.loadingTask.destroy();return;}
      current.current=result;setInspection(result);
    } catch(error) {if(generation.current===id)setError(error instanceof Error && ["size","pages"].includes(error.message)?error.message:"invalid");}
    finally {if(generation.current===id)setBusy(false);}
  }
  function clear() {generation.current++;void current.current?.document.loadingTask.destroy();current.current=null;setInspection(null);setBusy(false);setError("");setFileName("");if(input.current)input.current.value="";}
  function download() {
    if(!inspection)return;
    const lines=[t("Print Prep Lab - PDF inspection report","Print Prep Lab - تقرير فحص PDF"),fileName,new Date().toISOString(),`${t("Pages","الصفحات")}: ${inspection.pages.length}`,`${t("Targets","القيم المطلوبة")}: ${targets.bleed} mm bleed / ${targets.ppi} PPI / ${targets.width&&targets.height?`${targets.width} × ${targets.height} mm`:t("No trim-size target","لم يُحدد مقاس نهائي")}`,""];
    const state=(v:boolean|null)=>v===null?t("Unverified","غير مؤكد"):v?t("Meets target","يحقق الهدف"):t("Below target / mismatch","أقل من الهدف / غير مطابق");
    for(const page of inspection.pages){const c=checks(page,targets);lines.push(`${t("Page","صفحة")} ${page.number}: ${fmt(page.size.width)} × ${fmt(page.size.height)} mm`,`${t("Explicit TrimBox / BleedBox","TrimBox / BleedBox صريحان")}: ${page.explicitTrim} / ${page.explicitBleed}`,`${t("Bleed: left, bottom, right, top (PDF coordinates)","النزف: يسار، أسفل، يمين، أعلى (إحداثيات PDF)")}: ${page.margins.map(fmt).join(" / ")} mm`,`${t("Checks: size / bleed / image PPI","الفحوص: المقاس / النزف / PPI الصور")}: ${state(c.size)} / ${state(c.bleed)} / ${state(c.images)}`,`${t("Measured image placements / unassessed","مواضع الصور المقاسة / غير المقاسة")}: ${page.images.length} / ${page.unassessedImages}`,...page.images.map((image,i)=>`${i+1}: ${image.width} × ${image.height} px; ${fmt(image.x)} × ${fmt(image.y)} PPI`),"");}
    lines.push(t("Scope: geometry and supported raster image placements only. Unverified: actual artwork coverage in bleed, fonts, color profiles, spot colors, overprint, transparency, PDF/X and print quality. Confirm these with the print provider.","النطاق: هندسة الصفحات ومواضع الصور النقطية المدعومة فقط. لم يتم التحقق من امتداد التصميم داخل النزف أو الخطوط أو ملفات اللون أو الألوان الخاصة أو الطباعة الفوقية أو الشفافية أو PDF/X أو جودة الطباعة. راجعها مع المطبعة."));
    const url=URL.createObjectURL(new Blob(["\ufeff"+lines.join("\n")],{type:"text/plain;charset=utf-8"}));const anchor=document.createElement("a");anchor.href=url;anchor.download=fileName.replace(/\.pdf$/i,"")+"-print-report.txt";anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const page=inspection?.pages[selected],result=page?checks(page,targets):null;
  const status=(value:boolean|null)=>value===null?t("Needs review","تحتاج مراجعة"):value?t("Meets target","يحقق الهدف"):t("Check required","يلزم التحقق");
  function targetInput(key:keyof Targets,en:string,ar:string) {return <label>{t(en,ar)}<input type="number" min={key==="ppi"?1:0} max={key==="ppi"?2400:2000} step={key==="ppi"?1:0.1} value={targets[key]||""} onChange={event=>{const n=Number(event.target.value);setTargets(v=>({...v,[key]:Math.max(key==="ppi"?1:0,Math.min(key==="ppi"?2400:2000,Number.isFinite(n)?n:0))}));}} data-pdf-target={key} dir="ltr"/></label>;}
  return <div className="pdf-lab" data-pdf-language={language}>
    <div className="pdf-upload"><div><span className="section-kicker">{t("FILE INSPECTION","فحص الملف")}</span><h2>{t("Check the PDF you will send to print.","افحص PDF الذي سترسله للطباعة.")}</h2><p>{t("Choose a PDF to inspect its real pages and image placements. Everything stays in this browser.","اختر PDF لفحص صفحاته الحقيقية ومواضع الصور بداخله. يبقى الملف داخل هذا المتصفح.")}</p><small>{t("PDF · up to 40 MB · up to 100 pages · no password-protected files","PDF · حتى 40 ميجابايت · حتى 100 صفحة · بدون ملفات محمية بكلمة مرور")}</small></div><label className="pdf-file-button"><span>{t("Choose PDF","اختر PDF")}</span><input ref={input} type="file" accept="application/pdf,.pdf" aria-label={t("Choose PDF","اختر PDF")} onChange={event=>{const file=event.target.files?.[0];if(file)void choose(file);event.target.value="";}}/></label></div>
    {(fileName||busy||error)&&<div className="pdf-file-state"><bdi>{fileName}</bdi><span role="status" aria-live="polite">{busy?`${t("Inspecting page","فحص الصفحة")} ${progress}`:""}</span><button type="button" className="button secondary" onClick={clear}>{busy?t("Cancel","إلغاء"):t("Clear file","إزالة الملف")}</button></div>}
    {error&&<p role="alert" className="pdf-error">{error==="size"?t("This file is larger than 40 MB. Export a smaller copy and try again.","الملف أكبر من 40 ميجابايت. صدّر نسخة أصغر وأعد المحاولة."):error==="pages"?t("This PDF has more than 100 pages. Split it into smaller documents.","الملف يحتوي على أكثر من 100 صفحة. قسّمه إلى ملفات أصغر."):t("This PDF could not be inspected. It may be damaged or password-protected. Export an unlocked PDF and try again.","تعذر فحص PDF. قد يكون تالفًا أو محميًا بكلمة مرور. صدّر PDF غير محمي وأعد المحاولة.")}</p>}
    {inspection&&page&&result&&<>
      <div className="pdf-results-header"><div><span>{t("PAGES INSPECTED","الصفحات المفحوصة")}</span><strong data-pdf-count>{inspection.pages.length}</strong></div><p>{t("These checks compare your PDF with the targets below. Meeting them does not certify a print-ready file.","تقارن هذه الفحوص PDF بالقيم المطلوبة أدناه. تحقيقها لا يُعد اعتمادًا لجاهزية الطباعة.")}</p><button type="button" className="button primary" onClick={download} data-pdf-download>{t("Download report","تنزيل التقرير")}</button></div>
      <fieldset className="pdf-targets"><legend>{t("Printer requirements","متطلبات المطبعة")}</legend>{targetInput("bleed","Bleed per edge (mm)","النزف لكل حافة (مم)")}{targetInput("ppi","Minimum image PPI","أقل PPI للصور")}{targetInput("width","Trim width (mm, optional)","عرض التشذيب (مم، اختياري)")}{targetInput("height","Trim height (mm, optional)","ارتفاع التشذيب (مم، اختياري)")}<p>{t("Enter both trim dimensions to check size (±0.5 mm). Dimensions follow the page rotation. The PPI check uses the lower axis for each measured image placement.","أدخل بُعدَي التشذيب للتحقق من المقاس (بسماحية ±0.5 مم). يتبع المقاس دوران الصفحة. يستخدم فحص PPI المحور الأقل لكل موضع صورة مقاس.")}</p></fieldset>
      <div className="pdf-page-control"><label>{t("Page","الصفحة")} <select value={selected} onChange={e=>setSelected(Number(e.target.value))}>{inspection.pages.map((p,i)=><option key={p.number} value={i}>{p.number} · {fmt(p.size.width)} × {fmt(p.size.height)} mm</option>)}</select></label><span dir="ltr">{page.rotation}° · UserUnit {page.userUnit}</span></div>
      <div className="pdf-workbench"><PdfPreview document={inspection.document} pageNumber={page.number} boxes={page} t={t}/><div className="pdf-page-results">
        <h3>{t("Finished page size","المقاس النهائي للصفحة")}</h3><strong className="pdf-size" dir="ltr" data-pdf-size>{fmt(page.size.width)} × {fmt(page.size.height)} mm</strong><p>{page.explicitTrim?t("Read from the explicit TrimBox, after rotation.","مقروء من TrimBox الصريح بعد الدوران."):t("No explicit TrimBox. The PDF fallback uses CropBox; the intended finished size needs confirmation.","لا يوجد TrimBox صريح. يستخدم PDF إطار CropBox بديلًا؛ يجب تأكيد المقاس النهائي المقصود.")}</p>
        <dl className="pdf-checks"><div data-check="size" data-state={String(result.size)}><dt>{t("Trim size","مقاس التشذيب")}</dt><dd>{status(result.size)}</dd></div><div data-check="bleed" data-state={String(result.bleed)}><dt>{t("Bleed geometry","هندسة النزف")}</dt><dd>{status(result.bleed)}</dd></div><div data-check="images" data-state={String(result.images)}><dt>{t("Image PPI","PPI الصور")}</dt><dd>{status(result.images)}</dd></div></dl>
        <p>{page.explicitTrim&&page.explicitBleed?`${t("Bleed margins: left / bottom / right / top","هوامش النزف: يسار / أسفل / يمين / أعلى")}: ${page.margins.map(fmt).join(" / ")} mm`:t("Explicit TrimBox and BleedBox are needed to verify bleed. Default boxes are not evidence of intentional bleed.","يلزم TrimBox وBleedBox صريحان للتحقق من النزف. الإطارات الافتراضية لا تثبت وجود نزف مقصود.")}</p>{!page.boxesValid&&<p className="pdf-error">{t("The page boxes overlap incorrectly or extend beyond MediaBox. Check the PDF export.","تتداخل إطارات الصفحة بصورة غير صحيحة أو تتجاوز MediaBox. راجع تصدير PDF.")}</p>}
        <h3>{t("Image placements","مواضع الصور")}</h3><p data-pdf-images>{page.images.length?`${page.images.length} · ${t("lowest measured","أقل قيمة مقاسة")}: ${fmt(Math.min(...page.images.map(i=>i.minimum)))} PPI`:t("No supported raster image placements measured. Vector artwork and text do not have an image PPI.","لم تُقَس مواضع صور نقطية مدعومة. الرسومات المتجهة والنصوص ليس لها PPI للصور.")}</p>{page.unassessedImages>0&&<p>{`${page.unassessedImages} · `}{t("image/mask placements unassessed. Transparency groups, masks or decoding limits need separate review.","مواضع صور أو أقنعة لم يتم قياسها. مجموعات الشفافية والأقنعة وحدود فك الترميز تحتاج مراجعة منفصلة.")}</p>}
      </div></div>
      <details className="pdf-details"><summary>{t("Page box measurements and image details","قياسات إطارات الصفحة وتفاصيل الصور")}</summary><div className="pdf-table-scroll"><table><thead><tr><th>{t("Box","الإطار")}</th><th>{t("Width × height (mm)","العرض × الارتفاع (مم)")}</th><th>{t("Source","المصدر")}</th></tr></thead><tbody>{(["media","crop","trim","bleed"] as const).map(key=><tr key={key}><td>{key}Box</td><td dir="ltr">{fmt(pointsToMm(page[key].width,page.userUnit))} × {fmt(pointsToMm(page[key].height,page.userUnit))}</td><td>{key==="trim"&&!page.explicitTrim||key==="bleed"&&!page.explicitBleed?t("CropBox fallback","بديل CropBox"):t("PDF page box","إطار صفحة PDF")}</td></tr>)}</tbody></table>{page.images.length>0&&<table><thead><tr><th>#</th><th>{t("Pixels","البكسل")}</th><th>PPI (X × Y)</th></tr></thead><tbody>{page.images.map((image,i)=><tr key={i}><td>{i+1}</td><td dir="ltr">{image.width} × {image.height}</td><td dir="ltr">{fmt(image.x)} × {fmt(image.y)}</td></tr>)}</tbody></table>}</div></details>
      <details className="pdf-details"><summary>{t("All pages: checks and measurements","كل الصفحات: الفحوص والقياسات")}</summary><div className="pdf-table-scroll"><table><thead><tr><th>{t("Page","الصفحة")}</th><th>mm</th><th>{t("Size","المقاس")}</th><th>{t("Bleed","النزف")}</th><th>PPI</th></tr></thead><tbody>{inspection.pages.map(p=>{const c=checks(p,targets);return <tr key={p.number}><td><button type="button" onClick={()=>setSelected(p.number-1)}>{p.number}</button></td><td dir="ltr">{fmt(p.size.width)} × {fmt(p.size.height)}</td><td>{status(c.size)}</td><td>{status(c.bleed)}</td><td>{status(c.images)}</td></tr>;})}</tbody></table></div></details>
    </>}
    <aside className="pdf-limits"><h3>{t("What this inspection covers","ما الذي يغطيه الفحص")}</h3><p>{t("Page dimensions, explicit page boxes and supported raster image placements at their encoded sizes. The report covers all inspected pages. Files are held in memory until cleared or this page is closed.","أبعاد الصفحات وإطاراتها الصريحة ومواضع الصور النقطية المدعومة بمقاساتها داخل الملف. يشمل التقرير كل الصفحات المفحوصة. يبقى الملف في الذاكرة حتى إزالته أو إغلاق الصفحة.")}</p><p>{t("Bleed geometry does not prove that artwork fills the bleed. Fonts, ICC profiles, spot colors, overprint, transparency, PDF/X compliance and visual sharpness need separate checks with your printer.","هندسة النزف لا تثبت أن التصميم يملأ منطقة النزف. الخطوط وملفات ICC والألوان الخاصة والطباعة الفوقية والشفافية وتوافق PDF/X والحدة البصرية تحتاج فحوصًا منفصلة مع المطبعة.")}</p></aside>
  </div>;
}
