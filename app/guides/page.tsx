import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageCta, PageHero } from "@/components/content-shell";
import { GUIDE_PAGES } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Image Resolution and Print Preparation Guides",
  description: "Learn print resolution, DPI versus PPI, maximum image size, bleed, safe area, aspect ratio and cropping.",
  path: "/guides",
});

const topics = [
  { label: "Image quality", arLabel: "جودة الصورة", title: "How many pixels are enough?", arTitle: "كم بكسل يكفي؟", text: "Choose a realistic PPI target and calculate the maximum physical size from real source pixels.", arText: "اختر قيمة PPI واقعية واحسب أكبر مقاس فعلي من بكسلات المصدر الحقيقية.", href: "/guides/how-large-can-i-print-my-image" },
  { label: "Crop and ratio", arLabel: "القص والنسبة", title: "Why does the lab remove part of my photo?", arTitle: "لماذا يزيل المعمل جزءًا من صورتي؟", text: "Compare the source and print shapes before ordering an edge-to-edge print.", arText: "قارن شكل المصدر بمقاس الطباعة قبل طلب طباعة ممتدة حتى الحواف.", href: "/guides/aspect-ratio-cropping-print" },
  { label: "Document setup", arLabel: "إعداد الملف", title: "Where do bleed, trim and safe area go?", arTitle: "أين يكون النزف والتشذيب ومنطقة الأمان؟", text: "Separate the final cut edge from the extra image and the protected content zone.", arText: "افصل حد القطع النهائي عن مساحة الصورة الزائدة ومنطقة المحتوى المحمية.", href: "/guides/bleed-trim-safe-area" },
  { label: "Final export", arLabel: "التصدير النهائي", title: "What should I check before sending the file?", arTitle: "ماذا أراجع قبل إرسال الملف؟", text: "Use a twelve-point preflight from product specification through proof approval.", arText: "استخدم قائمة فحص من اثنتي عشرة نقطة تبدأ بمواصفات المنتج وتنتهي باعتماد البروفة.", href: "/guides/print-file-preflight-checklist" },
];

const toolHandoffs = [
  { title: "Check a real image", arTitle: "افحص صورة حقيقية", text: "See maximum sizes, effective PPI, crop loss and bleed from the actual file.", arText: "شاهد أقصى المقاسات وPPI الفعلي وفقد القص والنزف من الملف الحقيقي.", href: "/tools/print-readiness-checker" },
  { title: "Calculate effective PPI", arTitle: "احسب PPI الفعلي", text: "Use known pixels and a final physical print size to measure density.", arText: "استخدم أبعاد بكسل معروفة ومقاس طباعة نهائيًا لقياس الكثافة.", href: "/tools/dpi-ppi-calculator" },
  { title: "Preview the crop", arTitle: "عاين القص", text: "Compare a source ratio with a standard or custom target print.", arText: "قارن نسبة المصدر بمقاس طباعة قياسي أو مخصص.", href: "/tools/aspect-ratio-crop-preview" },
];

export default function GuidesIndex() {
  return <main className="source-hub source-guides-hub">
    <div className="shell"><Breadcrumbs items={[{ label: "Home", arLabel: "الرئيسية", href: "/" }, { label: "Guides", arLabel: "الأدلة" }]} /></div>
    <PageHero eyebrow={`${GUIDE_PAGES.length} production guides`} arEyebrow={`${GUIDE_PAGES.length} أدلة للإنتاج`} title="Print preparation guidance you can use on the job." arTitle="إرشادات لتجهيز الطباعة يمكنك استخدامها أثناء العمل." description="Understand the decision before changing the file. Each guide connects the production question to the calculation, the risk and the tool you can use next." arDescription="افهم القرار قبل تعديل الملف. يربط كل دليل سؤال الإنتاج بالحساب والمخاطر والأداة المناسبة للخطوة التالية.">
      <div className="hero-spec"><span data-en="Recommended starting guide" data-ar="الدليل المقترح للبدء">Recommended starting guide</span><strong data-en="How large can you print an image?" data-ar="ما أكبر مقاس يمكن طباعة الصورة به؟">How large can you print an image?</strong><small data-en="Start with real pixels, then account for PPI and final crop." data-ar="ابدأ بالبكسلات الحقيقية ثم احسب PPI والقص النهائي.">Start with real pixels, then account for PPI and final crop.</small><Link className="text-link" href="/guides/how-large-can-i-print-my-image" data-en="Read the guide →" data-ar="اقرأ الدليل ←">Read the guide →</Link></div>
    </PageHero>

    <section className="content-section shell">
      <div className="section-kicker" data-en="Choose the decision" data-ar="اختر القرار">Choose the decision</div>
      <div className="hub-section-title"><h2 data-en="What are you trying to solve?" data-ar="ما المشكلة التي تحاول حلها؟">What are you trying to solve?</h2><p data-en="Start with the production question rather than a technical acronym." data-ar="ابدأ بسؤال الإنتاج نفسه بدل البدء باختصار تقني.">Start with the production question rather than a technical acronym.</p></div>
      <div className="guide-topic-grid">{topics.map((topic) => <Link href={topic.href} key={topic.title}><span data-en={topic.label} data-ar={topic.arLabel}>{topic.label}</span><h3 data-en={topic.title} data-ar={topic.arTitle}>{topic.title}</h3><p data-en={topic.text} data-ar={topic.arText}>{topic.text}</p><b data-en="Learn the decision →" data-ar="افهم القرار ←">Learn the decision →</b></Link>)}</div>
    </section>

    <section className="guide-feature shell" aria-labelledby="guide-feature-title">
      <div><span data-en="Core method" data-ar="الطريقة الأساسية">Core method</span><h2 id="guide-feature-title" data-en="Turn source pixels into a defensible maximum print size." data-ar="حوّل بكسلات المصدر إلى أكبر مقاس طباعة يمكن تبريره.">Turn source pixels into a defensible maximum print size.</h2><p data-en="A 6000 × 4000 pixel image is 20 × 13.33 inches at 300 PPI before crop, 25 × 16.67 inches at 240 PPI and 40 × 26.67 inches at 150 PPI. The useful answer depends on viewing distance, print process and the final ratio." data-ar="صورة 6000 × 4000 بكسل تساوي 20 × 13.33 بوصة عند 300 PPI قبل القص، و25 × 16.67 عند 240 PPI، و40 × 26.67 عند 150 PPI. تعتمد الإجابة المفيدة على مسافة المشاهدة وطريقة الطباعة والنسبة النهائية.">A 6000 × 4000 pixel image is 20 × 13.33 inches at 300 PPI before crop, 25 × 16.67 inches at 240 PPI and 40 × 26.67 inches at 150 PPI. The useful answer depends on viewing distance, print process and the final ratio.</p><Link className="button primary" href="/guides/how-large-can-i-print-my-image"><span data-en="See the full method" data-ar="شاهد الطريقة كاملة">See the full method</span> <span>→</span></Link></div>
      <aside><span data-en="Core formula" data-ar="المعادلة الأساسية">Core formula</span><code>print inches = pixels ÷ PPI</code><small data-en="Apply the final crop before trusting the available pixel count." data-ar="طبّق القص النهائي قبل الاعتماد على عدد البكسلات المتاح.">Apply the final crop before trusting the available pixel count.</small></aside>
    </section>

    <section className="content-section shell">
      <div className="section-kicker" data-en="All guides" data-ar="كل الأدلة">All guides</div>
      <div className="guide-index">{GUIDE_PAGES.map((guide, index) => <Link href={`/guides/${guide.slug}`} key={guide.slug}><span>{String(index + 1).padStart(2, "0")}</span><div><small data-en="Guide" data-ar="دليل">Guide</small><h2>{guide.title}</h2><p>{guide.description}</p></div><b data-en="Read guide →" data-ar="اقرأ الدليل ←">Read guide →</b></Link>)}</div>
    </section>

    <section className="content-section paper-section">
      <div className="shell"><div className="section-kicker" data-en="From explanation to answer" data-ar="من الشرح إلى الإجابة">From explanation to answer</div><div className="hub-section-title"><h2 data-en="Use the calculator that matches the guide." data-ar="استخدم الحاسبة التي تناسب الدليل.">Use the calculator that matches the guide.</h2><p data-en="No account, image upload or server processing is required." data-ar="لا تحتاج إلى حساب أو رفع صورة أو معالجة على الخادم.">No account, image upload or server processing is required.</p></div><div className="tool-handoff-grid">{toolHandoffs.map((item) => <Link href={item.href} key={item.title}><h3 data-en={item.title} data-ar={item.arTitle}>{item.title}</h3><p data-en={item.text} data-ar={item.arText}>{item.text}</p><b data-en="Open tool →" data-ar="افتح الأداة ←">Open tool →</b></Link>)}</div><p className="method-note"><span data-en="Want to audit the assumptions?" data-ar="تريد مراجعة الافتراضات؟">Want to audit the assumptions?</span> <Link href="/methodology" data-en="Read our methodology and rounding rules →" data-ar="اقرأ منهجيتنا وقواعد التقريب ←">Read our methodology and rounding rules →</Link></p></div>
    </section>

    <div className="shell"><PageCta /></div>
  </main>;
}
