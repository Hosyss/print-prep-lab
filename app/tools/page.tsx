import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, FaqList, PageCta, PageHero } from "@/components/content-shell";
import { TOOL_PAGES } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Printing Calculators for Image Size, PPI, Crop and Bleed",
  description: "Check image quality, convert pixels and print sizes, calculate PPI, preview cropping and add bleed—all in your browser.",
  path: "/tools",
});

const taskRoutes = [
  { label: "Check", arLabel: "تحقق", title: "I have an image", arTitle: "لدي صورة", text: "Read its real pixels, maximum print sizes, crop and effective PPI.", arText: "اقرأ أبعادها الحقيقية بالبكسل وأقصى مقاسات الطباعة والقص وكثافة PPI الفعلية.", href: "/tools/print-readiness-checker" },
  { label: "Convert", arLabel: "تحويل", title: "I know the pixels", arTitle: "أعرف أبعاد البكسل", text: "Turn pixel dimensions into inches or centimetres at a chosen PPI.", arText: "حوّل أبعاد البكسل إلى بوصات أو سنتيمترات عند قيمة PPI تختارها.", href: "/tools/pixels-to-print-size" },
  { label: "Plan", arLabel: "تخطيط", title: "I know the print size", arTitle: "أعرف مقاس الطباعة", text: "Calculate the exact source pixels needed for the final physical dimensions.", arText: "احسب عدد بكسلات المصدر المطلوبة بدقة للمقاس النهائي.", href: "/tools/print-size-to-pixels" },
  { label: "Prepare", arLabel: "تجهيز", title: "I need crop or bleed", arTitle: "أحتاج قصًا أو نزفًا", text: "Preview framing or calculate trim, bleed and the safe content area.", arText: "عاين إطار القص أو احسب حد التشذيب والنزف ومنطقة المحتوى الآمنة.", href: "/tools/aspect-ratio-crop-preview" },
];

const toolArabic: Record<string, { title: string; description: string; intent: string }> = {
  "print-readiness-checker": { title: "فحص جاهزية الطباعة", description: "افحص PPI الفعلي وأقصى مقاس للطباعة والقص والنزف ومنطقة الأمان باستخدام الملف الحقيقي.", intent: "هل صورتي مناسبة للطباعة؟" },
  "pixels-to-print-size": { title: "تحويل البكسل إلى مقاس طباعة", description: "حوّل أبعاد الصورة بالبكسل إلى مقاس فعلي بالبوصة أو السنتيمتر عند قيمة PPI محددة.", intent: "ما المقاس الذي يمكنني طباعته؟" },
  "print-size-to-pixels": { title: "تحويل مقاس الطباعة إلى بكسل", description: "اعرف أبعاد البكسل اللازمة لمقاس مطبوع محدد عند قيمة PPI تختارها.", intent: "كم بكسل أحتاج؟" },
  "dpi-ppi-calculator": { title: "حاسبة DPI وPPI", description: "احسب كثافة البكسل الفعلية للصورة عند مقاس طباعة معين وحدد البعد الذي يقيّد الجودة.", intent: "ما قيمة PPI عند الطباعة؟" },
  "paper-size-pixels-calculator": { title: "مقاسات الورق بالبكسل", description: "اختر مقاس ورق أو صورة واحسب أبعاده بالبكسل عند أي قيمة PPI.", intent: "كم يساوي هذا المقاس بالبكسل؟" },
  "aspect-ratio-crop-preview": { title: "معاينة نسبة الأبعاد والقص", description: "قارن نسبة الصورة بمقاسات الطباعة وقدّر الجزء الذي سيُقص قبل الطلب.", intent: "كم سيُقص من الصورة؟" },
  "bleed-safe-area-calculator": { title: "حاسبة النزف ومنطقة الأمان", description: "احسب مقاس العمل الكامل وحد التشذيب ومنطقة الأمان بالملليمتر والبكسل.", intent: "ما مقاس اللوحة مع النزف؟" },
};

const toolFaq = [
  { question: "Which printing calculator should I use first?", questionAr: "أي حاسبة طباعة أستخدم أولًا؟", answer: "If you already have the image, start with the print readiness checker. If you only know pixels or physical dimensions, choose the converter that starts with the value you already have.", answerAr: "إذا كانت الصورة لديك بالفعل فابدأ بفحص جاهزية الطباعة. وإذا كنت تعرف فقط أبعاد البكسل أو المقاس الفعلي فاختر الأداة التي تبدأ بالمعلومة المتاحة لديك." },
  { question: "Do these tools upload my image?", questionAr: "هل ترفع هذه الأدوات صورتي؟", answer: "No. Image dimensions and previews are processed locally in your browser. Print Prep Lab does not receive the image file.", answerAr: "لا. تتم قراءة الأبعاد والمعاينات محليًا داخل متصفحك، ولا يستقبل Print Prep Lab ملف الصورة." },
  { question: "Are DPI and PPI interchangeable?", questionAr: "هل DPI وPPI شيء واحد؟", answer: "No. PPI describes image pixels placed into each printed inch; printer DPI describes output dots. Our image calculations use effective PPI and label it clearly.", answerAr: "لا. يشير PPI إلى بكسلات الصورة في كل بوصة مطبوعة، بينما يشير DPI إلى نقاط جهاز الطباعة. تستخدم أدواتنا قيمة PPI الفعلية وتوضحها صراحة." },
];

export default function ToolsIndex() {
  return <main className="source-hub source-tools-hub">
    <div className="shell"><Breadcrumbs items={[{ label: "Home", arLabel: "الرئيسية", href: "/" }, { label: "Tools", arLabel: "الأدوات" }]} /></div>
    <PageHero eyebrow={`${TOOL_PAGES.length} focused calculators`} arEyebrow={`${TOOL_PAGES.length} حاسبات مركزة`} title="Print preparation tools for real production decisions." arTitle="أدوات تجهيز الطباعة لقرارات إنتاج حقيقية." description="Start with what you know: the image, pixel dimensions, final print size, crop or bleed. Each calculator shows the assumption and the result instead of hiding the print math." arDescription="ابدأ بما تعرفه: الصورة أو أبعاد البكسل أو مقاس الطباعة النهائي أو القص أو النزف. كل حاسبة تعرض الافتراض والنتيجة بوضوح بدل إخفاء حسابات الطباعة.">
      <div className="hero-spec"><span data-en="Recommended first check" data-ar="الفحص المقترح أولًا">Recommended first check</span><strong data-en="Is this image actually ready to print?" data-ar="هل هذه الصورة جاهزة فعلًا للطباعة؟">Is this image actually ready to print?</strong><small data-en="Pixels · effective PPI · crop · bleed · maximum sizes" data-ar="البكسل · PPI الفعلي · القص · النزف · أقصى المقاسات">Pixels · effective PPI · crop · bleed · maximum sizes</small><Link className="text-link" href="/tools/print-readiness-checker" data-en="Open the readiness checker →" data-ar="افتح فحص الجاهزية ←">Open the readiness checker →</Link></div>
    </PageHero>

    <section className="content-section shell hub-task-section">
      <div className="section-kicker" data-en="Choose by starting point" data-ar="اختر حسب نقطة البداية">Choose by starting point</div>
      <div className="hub-section-title"><h2 data-en="What do you have right now?" data-ar="ما الذي لديك الآن؟">What do you have right now?</h2><p data-en="Pick the question in front of you. You do not need to translate it into technical terminology first." data-ar="ابدأ بالسؤال الذي أمامك مباشرة، ولا تحتاج أولًا إلى تحويله إلى مصطلحات تقنية.">Pick the question in front of you. You do not need to translate it into technical terminology first.</p></div>
      <div className="hub-task-grid">{taskRoutes.map((task) => <Link href={task.href} key={task.title}><span data-en={task.label} data-ar={task.arLabel}>{task.label}</span><h3 data-en={task.title} data-ar={task.arTitle}>{task.title}</h3><p data-en={task.text} data-ar={task.arText}>{task.text}</p><b data-en="Use this route →" data-ar="استخدم هذا المسار ←">Use this route →</b></Link>)}</div>
    </section>

    <section className="hub-feature shell" aria-labelledby="featured-checker-title">
      <div><span data-en="Featured workflow" data-ar="مسار مميز">Featured workflow</span><h2 id="featured-checker-title" data-en="One local check from source pixels to paper." data-ar="فحص محلي واحد من بكسلات المصدر حتى الورق.">One local check from source pixels to paper.</h2><p data-en="Choose an image and a target print. The checker reads the source dimensions locally, then reports effective PPI, maximum sizes at 150, 240 and 300 PPI, crop loss, bleed canvas and safe area." data-ar="اختر صورة ومقاس طباعة مستهدفًا. يقرأ الفاحص أبعاد المصدر محليًا ثم يعرض PPI الفعلي وأقصى المقاسات عند 150 و240 و300 PPI وفقد القص ولوحة النزف ومنطقة الأمان.">Choose an image and a target print. The checker reads the source dimensions locally, then reports effective PPI, maximum sizes at 150, 240 and 300 PPI, crop loss, bleed canvas and safe area.</p><div className="trust-row"><span data-en="✓ No upload" data-ar="✓ بدون رفع">✓ No upload</span><span data-en="✓ No account" data-ar="✓ بدون حساب">✓ No account</span><span data-en="✓ Visible calculations" data-ar="✓ حسابات واضحة">✓ Visible calculations</span></div></div>
      <aside><strong data-en="Use the real file" data-ar="استخدم الملف الحقيقي">Use the real file</strong><p data-en="A DPI metadata tag cannot create detail. Start with the image's actual width and height in pixels." data-ar="قيمة DPI داخل البيانات الوصفية لا تضيف تفاصيل للصورة. ابدأ بالعرض والارتفاع الحقيقيين بالبكسل.">A DPI metadata tag cannot create detail. Start with the image&apos;s actual width and height in pixels.</p><Link className="button primary" href="/tools/print-readiness-checker"><span data-en="Check my image" data-ar="افحص صورتي">Check my image</span> <span>→</span></Link></aside>
    </section>

    <section className="content-section shell">
      <div className="section-kicker" data-en="All calculators" data-ar="كل الحاسبات">All calculators</div>
      <div className="hub-section-title"><h2 data-en="One tool for each print decision." data-ar="أداة لكل قرار طباعة.">One tool for each print decision.</h2><p data-en="Clear inputs, visible units and a direct handoff to the next related task." data-ar="مدخلات واضحة ووحدات ظاهرة وانتقال مباشر إلى المهمة التالية ذات الصلة.">Clear inputs, visible units and a direct handoff to the next related task.</p></div>
      <div className="index-grid">{TOOL_PAGES.map((tool, index) => { const ar = toolArabic[tool.slug]; return <Link className="index-card" href={`/tools/${tool.slug}`} key={tool.slug}><span>{String(index + 1).padStart(2, "0")}</span><h2 data-en={tool.shortTitle} data-ar={ar?.title}>{tool.shortTitle}</h2><p data-en={tool.description} data-ar={ar?.description}>{tool.description}</p><strong data-en={`${tool.intent} →`} data-ar={ar ? `${ar.intent} ←` : undefined}>{tool.intent} →</strong></Link>; })}</div>
    </section>

    <section className="content-section shell hub-learning-grid">
      <article><div className="section-kicker" data-en="Need the reasoning?" data-ar="تحتاج إلى التفسير؟">Need the reasoning?</div><h2 data-en="Understand the decision before export." data-ar="افهم القرار قبل التصدير.">Understand the decision before export.</h2><div className="hub-link-list"><Link href="/guides/how-large-can-i-print-my-image" data-en="How large can I print my image? →" data-ar="ما أكبر مقاس يمكنني طباعة صورتي به؟ ←">How large can I print my image? <span>→</span></Link><Link href="/guides/dpi-vs-ppi" data-en="DPI vs PPI explained →" data-ar="شرح الفرق بين DPI وPPI ←">DPI vs PPI explained <span>→</span></Link><Link href="/guides/aspect-ratio-cropping-print" data-en="Why photos crop at print sizes →" data-ar="لماذا تُقص الصور عند مقاسات الطباعة؟ ←">Why photos crop at print sizes <span>→</span></Link></div></article>
      <aside><div className="section-kicker" data-en="Tool questions" data-ar="أسئلة الأدوات">Tool questions</div><FaqList items={toolFaq} /></aside>
    </section>
    <div className="shell"><PageCta /></div>
  </main>;
}
