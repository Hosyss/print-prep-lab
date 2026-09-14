import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageCta, PageHero } from "@/components/content-shell";
import { PRINT_PRESETS, pixelsForMm } from "@/lib/print-math";
import { SIZE_DETAILS } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Paper and Photo Print Sizes in Pixels",
  description: "Browse ISO paper, US paper and photo print sizes with dimensions, aspect ratios and pixel requirements at common PPI values.",
  path: "/sizes",
});

const groups = [
  { key: "ISO", title: "ISO A-series paper", arTitle: "ورق سلسلة A بنظام ISO", text: "International paper formats with the consistent 1:√2 proportion.", arText: "مقاسات ورق دولية بنسبة أبعاد ثابتة 1:√2." },
  { key: "US", title: "US paper sizes", arTitle: "مقاسات الورق الأمريكية", text: "Letter and Legal office formats defined in inches.", arText: "مقاسات مكتبية مثل Letter وLegal محددة بالبوصة." },
  { key: "Photo", title: "Photo print sizes", arTitle: "مقاسات طباعة الصور", text: "Common lab and frame formats, each with its own crop ratio.", arText: "مقاسات شائعة للمعامل والإطارات، ولكل منها نسبة قص مختلفة." },
] as const;

const ppiNotes = [
  { ppi: "150 PPI", label: "Distance dependent", arLabel: "يعتمد على مسافة المشاهدة", text: "A practical planning level for some larger prints viewed farther away.", arText: "قيمة عملية للتخطيط لبعض المطبوعات الكبيرة التي تُشاهد من مسافة أبعد." },
  { ppi: "240 PPI", label: "Detailed print", arLabel: "طباعة بتفاصيل جيدة", text: "A strong intermediate target when the source file cannot reach 300 PPI.", arText: "هدف متوسط قوي عندما لا يستطيع ملف المصدر الوصول إلى 300 PPI." },
  { ppi: "300 PPI", label: "Common high-detail target", arLabel: "هدف شائع للتفاصيل العالية", text: "Often requested for detailed prints viewed closely; confirm with the provider.", arText: "يُطلب كثيرًا للمطبوعات الدقيقة التي تُشاهد عن قرب؛ أكد المتطلبات مع مزود الطباعة." },
];

export default function SizesIndex() {
  return <main>
    <div className="shell"><Breadcrumbs items={[{ label: "Home", arLabel: "الرئيسية", href: "/" }, { label: "Print sizes", arLabel: "مقاسات الطباعة" }]} /></div>
    <PageHero eyebrow="12 physical-size references" arEyebrow="12 مرجعًا للمقاسات الفعلية" title="Paper and Photo Size Reference" arTitle="مرجع مقاسات الورق والصور" description="Browse exact trim dimensions, compare aspect ratios and see the pixels needed at 300 PPI. Every reference also includes a calculator for other resolutions." arDescription="تصفح أبعاد التشذيب الدقيقة وقارن نسب الأبعاد وشاهد عدد البكسلات المطلوبة عند 300 PPI. يتضمن كل مرجع أيضًا حاسبة لدقات أخرى.">
      <div className="hero-spec"><span data-en="Most used reference" data-ar="المرجع الأكثر استخدامًا">Most used reference</span><strong data-en="A4 is 210 × 297 mm." data-ar="مقاس A4 هو 210 × 297 مم.">A4 is 210 × 297 mm.</strong><small data-en="2480 × 3508 px at 300 PPI · trim only" data-ar="2480 × 3508 بكسل عند 300 PPI · مقاس التشذيب فقط">2480 × 3508 px at 300 PPI · trim only</small><Link className="text-link" href="/sizes/a4" data-en="Open A4 dimensions →" data-ar="افتح أبعاد A4 ←">Open A4 dimensions →</Link></div>
    </PageHero>

    <section className="content-section shell hub-definition-grid">
      <article><span data-en="Paper formats" data-ar="مقاسات الورق">Paper formats</span><h2 data-en="Fixed physical standards." data-ar="معايير فعلية ثابتة.">Fixed physical standards.</h2><p data-en="ISO and US paper names define a trim size, not one fixed pixel size. Pixels appear only after a PPI target is chosen." data-ar="تحدد أسماء مقاسات ISO والورق الأمريكي مقاس التشذيب الفعلي، وليس عددًا ثابتًا من البكسلات. يظهر عدد البكسلات فقط بعد اختيار قيمة PPI.">ISO and US paper names define a trim size, not one fixed pixel size. Pixels appear only after a PPI target is chosen.</p><Link href="/tools/paper-size-pixels-calculator" data-en="Calculate a paper size →" data-ar="احسب مقاس ورق ←">Calculate a paper size →</Link></article>
      <article><span data-en="Photo formats" data-ar="مقاسات الصور">Photo formats</span><h2 data-en="Fixed sizes with crop decisions." data-ar="مقاسات ثابتة مع قرارات قص.">Fixed sizes with crop decisions.</h2><p data-en="A 4 × 6, 5 × 7 or 8 × 10 print also has a physical size, but their different aspect ratios can remove part of a camera image." data-ar="مقاسات 4 × 6 و5 × 7 و8 × 10 لها أبعاد فعلية ثابتة أيضًا، لكن اختلاف نسب الأبعاد قد يزيل جزءًا من صورة الكاميرا.">A 4 × 6, 5 × 7 or 8 × 10 print also has a physical size, but their different aspect ratios can remove part of a camera image.</p><Link href="/tools/aspect-ratio-crop-preview" data-en="Preview a photo crop →" data-ar="عاين قص الصورة ←">Preview a photo crop →</Link></article>
    </section>

    <section id="size-index" className="content-section shell size-library-groups">
      <div className="section-kicker" data-en="Browse by category" data-ar="تصفح حسب الفئة">Browse by category</div>
      {groups.map((group) => <section key={group.key} aria-labelledby={`size-group-${group.key}`}>
        <div className="size-group-heading"><div><h2 id={`size-group-${group.key}`} data-en={group.title} data-ar={group.arTitle}>{group.title}</h2><p data-en={group.text} data-ar={group.arText}>{group.text}</p></div><span data-en={`${PRINT_PRESETS.filter((preset) => preset.group === group.key).length} references`} data-ar={`${PRINT_PRESETS.filter((preset) => preset.group === group.key).length} مراجع`}>{PRINT_PRESETS.filter((preset) => preset.group === group.key).length} references</span></div>
        <div className="size-index-grid">{PRINT_PRESETS.filter((preset) => preset.group === group.key).map((preset) => { const detail = SIZE_DETAILS[preset.slug]; return <Link href={`/sizes/${preset.slug}`} className="size-index-card" key={preset.slug}><span className={`paper-mini ${preset.group.toLowerCase()}`}>{preset.shortLabel}</span><div><small>{preset.group}</small><h3>{preset.label}</h3><p>{preset.widthMm} × {preset.heightMm} mm · {detail.ratio}</p><strong>{pixelsForMm(preset.widthMm, 300)} × {pixelsForMm(preset.heightMm, 300)} px <i data-en="at 300 PPI" data-ar="عند 300 PPI">at 300 PPI</i></strong></div><b>↗</b></Link>; })}</div>
      </section>)}
    </section>

    <section className="content-section paper-section">
      <div className="shell"><div className="section-kicker" data-en="Pixels are a choice" data-ar="عدد البكسلات يعتمد على اختيارك">Pixels are a choice</div><div className="hub-section-title"><h2 data-en="The same paper needs different pixels at different PPI." data-ar="نفس الورق يحتاج عددًا مختلفًا من البكسلات عند قيم PPI مختلفة.">The same paper needs different pixels at different PPI.</h2><p data-en="Use these values as planning targets, not universal printer guarantees." data-ar="استخدم هذه القيم كأهداف للتخطيط، وليست ضمانات عامة لكل أجهزة الطباعة.">Use these values as planning targets, not universal printer guarantees.</p></div><div className="ppi-guide-grid">{ppiNotes.map((item) => <article key={item.ppi}><span data-en={item.label} data-ar={item.arLabel}>{item.label}</span><h3>{item.ppi}</h3><p data-en={item.text} data-ar={item.arText}>{item.text}</p></article>)}</div></div>
    </section>

    <div className="shell"><PageCta /></div>
  </main>;
}
