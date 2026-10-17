import Link from "next/link";
import { PDF_SAMPLES, pdfSamplePath } from "@/lib/pdf-samples";

function Copy({ en, ar }: { en: string; ar: string }) {
  // Keep arithmetic and width × height in reading order inside Arabic prose.
  const arabic = ar.replace(/A4|PDF(?:\/X)?|TrimBox|BleedBox|MediaBox|RGB|ICC|\(?\d+(?:\.\d+)?(?:\s*[×÷−=+]\s*\(?\d+(?:\.\d+)?\)?)*\)?(?:\s*PPI)?/g, value => `\u2066${value}\u2069`);
  return <span data-en={en} data-ar={arabic}>{en}</span>;
}

export function PdfExampleLibrary() {
  return <section id="pdf-examples" className="pdf-example-library shell" aria-labelledby="pdf-examples-title" data-content-value="original-pdf-cases">
    <span className="section-kicker"><Copy en="DOWNLOAD / INSPECT / COMPARE" ar="نزّل / افحص / قارن" /></span>
    <h2 id="pdf-examples-title"><Copy en="Three real PDFs. Three different decisions." ar="ثلاثة ملفات PDF حقيقية، وثلاثة قرارات مختلفة." /></h2>
    <p><Copy en="These original, one-page teaching files were created by Print Prep Lab. Inspect them against the same example specification: A4 trim 210 × 297 mm, 3 mm bleed and 300 PPI. Open a file in the tool to load those targets automatically, or download it and check it in your own PDF application. No account is needed." ar="أنشأ Print Prep Lab ملفات التدريب الأصلية هذه، وكل منها صفحة واحدة. افحصها بالمواصفات نفسها: تشذيب A4 مقاسه 210 × 297 مم، ونزف 3 مم، ودقة 300 PPI. افتح الملف داخل الأداة لتحميل هذه الأهداف تلقائيًا، أو نزّله وافحصه في برنامج PDF لديك. لا تحتاج إلى حساب." /></p>
    <div className="pdf-example-cards">{PDF_SAMPLES.map((sample, index) => <article key={sample.id} id={sample.id}>
      <div className="pdf-example-heading"><span aria-hidden="true">0{index + 1}</span><h3><Copy en={sample.title[0]} ar={sample.title[1]} /></h3></div>
      <p><Copy en={sample.summary[0]} ar={sample.summary[1]} /></p>
      <dl className="pdf-example-facts">
        <div><dt><Copy en="Page size" ar="مقاس الصفحة" /></dt><dd><bdi>210 × 297 mm</bdi></dd></div>
        <div><dt><Copy en="Explicit bleed" ar="النزف الصريح" /></dt><dd>{sample.bleedMm === null ? <Copy en="Not specified" ar="غير محدد" /> : <bdi>{sample.bleedMm} mm</bdi>}</dd></div>
        <div><dt><Copy en="Image density" ar="كثافة الصورة" /></dt><dd><bdi>{sample.ppi} PPI</bdi></dd></div>
      </dl>
      <h4><Copy en="What you should find" ar="النتيجة المتوقعة" /></h4><p><Copy en={sample.explanation[0]} ar={sample.explanation[1]} /></p>
      <h4><Copy en="The next decision" ar="القرار التالي" /></h4><p><Copy en={sample.correction[0]} ar={sample.correction[1]} /></p>
      <div className="pdf-example-actions"><Link className="button" href={`/tools/pdf-print-preflight?sample=${sample.id}#pdf-inspection`} data-example-inspect={sample.id}><Copy en="Inspect this example" ar="افحص هذا المثال" /></Link><a className="text-link" href={pdfSamplePath(sample)} download data-example-download={sample.id}><Copy en="Download PDF" ar="نزّل PDF" /></a></div>
    </article>)}</div>
    <aside className="pdf-example-note"><h3><Copy en="A matching result is a measurement, not a press approval." ar="النتيجة المطابقة قياس وليست اعتمادًا للطباعة." /></h3><p><Copy en="The examples deliberately isolate page geometry and image placement. They do not certify fonts, ICC profiles, PDF/X, overprint, transparency, visual sharpness or actual background coverage in bleed. The 3 mm and 300 PPI values belong to this exercise; use your provider’s written requirements for a real job." ar="تعزل الأمثلة هندسة الصفحات ومواضع الصور عمدًا. لا تعتمد الخطوط أو ملفات ICC أو PDF/X أو الطباعة الفوقية أو الشفافية أو الحدة المرئية أو امتداد الخلفية داخل النزف. قيمتا 3 مم و300 PPI تخصان التمرين؛ استخدم مواصفات المطبعة المكتوبة للعمل الحقيقي." /></p>
      <p><Copy en="Technical references:" ar="المراجع التقنية:" /> <a href="https://helpx.adobe.com/acrobat/using/printer-marks-hairlines-acrobat-pro.html" target="_blank" rel="noreferrer"><Copy en="Adobe: page boxes" ar="Adobe: إطارات الصفحات" /></a> · <a href="https://www.adobe.com/learn/indesign/web/set-print-bleed" target="_blank" rel="noreferrer"><Copy en="Adobe: extending artwork into bleed" ar="Adobe: مد التصميم إلى النزف" /></a>. <Copy en="The downloadable cases, arithmetic and interpretations above are Print Prep Lab’s own examples." ar="ملفات الأمثلة وحساباتها وتفسير نتائجها أعلاه عمل أصلي من Print Prep Lab." /></p>
    </aside>
  </section>;
}
