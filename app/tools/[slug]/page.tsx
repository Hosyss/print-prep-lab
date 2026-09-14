import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, FaqList, PageCta, PageHero } from "@/components/content-shell";
import { PrintReadinessLab } from "@/components/print-readiness-lab";
import { ToolCalculator } from "@/components/tool-calculators";
import { TOOL_ARABIC } from "@/lib/source-arabic";
import { TOOL_CONTEXT, TOOL_PAGES } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";

const GUIDE_LINKS: Record<string, { href: string; label: string; arLabel: string }> = {
  "print-readiness-checker": { href: "/guides/how-large-can-i-print-my-image", label: "How maximum print size works", arLabel: "كيف يعمل حساب أقصى مقاس للطباعة" },
  "pixels-to-print-size": { href: "/guides/print-resolution-guide", label: "Choose a print-resolution target", arLabel: "كيف تختار دقة الطباعة المناسبة" },
  "print-size-to-pixels": { href: "/guides/print-resolution-guide", label: "Read the print-resolution guide", arLabel: "اقرأ دليل دقة الطباعة" },
  "dpi-ppi-calculator": { href: "/guides/dpi-vs-ppi", label: "Understand DPI vs PPI", arLabel: "افهم الفرق بين DPI وPPI" },
  "paper-size-pixels-calculator": { href: "/sizes/a4", label: "Open the A4 size reference", arLabel: "افتح مرجع مقاس A4" },
  "aspect-ratio-crop-preview": { href: "/guides/aspect-ratio-cropping-print", label: "Why print sizes crop", arLabel: "لماذا تسبب مقاسات الطباعة قص الصورة" },
  "bleed-safe-area-calculator": { href: "/guides/bleed-trim-safe-area", label: "Understand bleed, trim and safe area", arLabel: "افهم النزف والتشذيب ومنطقة الأمان" },
};

export function generateStaticParams() { return TOOL_PAGES.map((tool) => ({ slug: tool.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOL_PAGES.find((item) => item.slug === slug);
  return tool ? pageMetadata({ title: tool.seoTitle, description: tool.description, path: `/tools/${slug}` }) : {};
}

export default async function ToolDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = TOOL_PAGES.find((item) => item.slug === slug);
  if (!tool) notFound();
  const ar = TOOL_ARABIC[tool.slug];
  const guideLink = GUIDE_LINKS[tool.slug];
  const context = TOOL_CONTEXT[tool.slug];
  const relatedTools = tool.related.map((relatedSlug) => TOOL_PAGES.find((item) => item.slug === relatedSlug)).filter((item): item is (typeof TOOL_PAGES)[number] => Boolean(item));
  const localizedFaq = tool.faq.map((item, index) => ({ ...item, questionAr: ar?.faq[index]?.question, answerAr: ar?.faq[index]?.answer }));

  return <main><div className="shell"><Breadcrumbs items={[{ label: "Home", arLabel: "الرئيسية", href: "/" }, { label: "Tools", arLabel: "الأدوات", href: "/tools" }, { label: tool.shortTitle, arLabel: ar?.shortTitle }]} /></div>
    <PageHero eyebrow="Interactive browser tool" arEyebrow="أداة تفاعلية في المتصفح" title={tool.heading} arTitle={ar?.heading} description={tool.description} arDescription={ar?.description}><div className="hero-spec"><span data-en="Primary question" data-ar="السؤال الأساسي">Primary question</span><strong data-en={tool.intent} data-ar={ar?.intent}>{tool.intent}</strong><small data-en="No account required" data-ar="لا تحتاج إلى حساب">No account required</small></div></PageHero>
    <section className="quick-answer shell" aria-label="Quick answer"><div><span data-en="Quick answer" data-ar="إجابة سريعة">Quick answer</span><p data-en={tool.quickAnswer} data-ar={ar?.quickAnswer}>{tool.quickAnswer}</p></div><code>{tool.formula}</code></section>
    <section className="tool-page shell">{tool.mode === "print-readiness-checker" ? <PrintReadinessLab compact /> : <ToolCalculator mode={tool.mode} />}</section>
    {context && <section className="tool-context-grid shell" aria-label={`${tool.shortTitle} use cases and technical notes`}><article><div className="section-kicker" data-en="When to use this tool" data-ar="متى تستخدم هذه الأداة">When to use this tool</div><h2 data-en="Use it for a specific print decision." data-ar="استخدمها لقرار طباعة محدد.">Use it for a specific print decision.</h2><ul>{context.useCases.map((item, index) => <li key={item} data-en={item} data-ar={ar?.useCases[index]}>{item}</li>)}</ul></article><aside><div className="section-kicker" data-en="Technical notes" data-ar="ملاحظات تقنية">Technical notes</div><h2 data-en="What the number does—and does not—mean." data-ar="ما الذي يعنيه الرقم وما الذي لا يعنيه.">What the number does—and does not—mean.</h2><ul>{context.technicalNotes.map((item, index) => <li key={item} data-en={item} data-ar={ar?.technicalNotes[index]}>{item}</li>)}</ul></aside></section>}
    <section className="content-section shell two-column-copy"><article><div className="section-kicker" data-en="How to use it" data-ar="طريقة الاستخدام">How to use it</div><h2 data-en="A result you can reproduce." data-ar="نتيجة يمكنك إعادة حسابها.">A result you can reproduce.</h2><ol>{tool.steps.map((step, index) => <li key={step} data-en={step} data-ar={ar?.steps[index]}>{step}</li>)}</ol><p className="callout-copy" data-en="Every result is calculated in the page from the displayed inputs. Your printer's written production specification remains the final authority." data-ar="تُحسب كل نتيجة داخل الصفحة من المدخلات الظاهرة. وتظل مواصفات الإنتاج المكتوبة من مزود الطباعة هي المرجع النهائي.">Every result is calculated in the page from the displayed inputs. Your printer&apos;s written production specification remains the final authority.</p></article><aside><div className="section-kicker" data-en="Common questions" data-ar="أسئلة شائعة">Common questions</div><FaqList items={localizedFaq} /></aside></section>
    <section className="content-section shell tool-learning-grid"><article><div className="section-kicker" data-en="Worked example" data-ar="مثال عملي">Worked example</div><h2 data-en="See the numbers in context." data-ar="شاهد الأرقام في سياق عملي.">See the numbers in context.</h2><p data-en={tool.example} data-ar={ar?.example}>{tool.example}</p>{guideLink && <Link className="text-link" href={guideLink.href} data-en={`${guideLink.label} →`} data-ar={`${guideLink.arLabel} ←`}>{guideLink.label} →</Link>}</article><aside><div className="section-kicker" data-en="Avoid these mistakes" data-ar="تجنب هذه الأخطاء">Avoid these mistakes</div><ul>{tool.mistakes.map((mistake, index) => <li key={mistake} data-en={mistake} data-ar={ar?.mistakes[index]}>{mistake}</li>)}</ul></aside></section>
    <section className="related-strip shell"><span data-en="Related calculations" data-ar="حسابات مرتبطة">Related calculations</span>{relatedTools.map((item) => { const relatedAr = TOOL_ARABIC[item.slug]; return <Link href={`/tools/${item.slug}`} key={item.slug}><span data-en={item.shortTitle} data-ar={relatedAr?.shortTitle}>{item.shortTitle}</span> <b>→</b></Link>; })}</section>
    <div className="shell"><PageCta eyebrow="From calculation to production" arEyebrow="من الحساب إلى الإنتاج" title={`Verify the ${tool.shortTitle} result with your real file.`} arTitle={`تحقق من نتيجة ${ar?.shortTitle ?? "الحاسبة"} باستخدام ملفك الحقيقي.`} description={`${tool.quickAnswer} Then compare the result with the print provider's written specification.`} arDescription={`${ar?.quickAnswer ?? "راجع النتيجة."} ثم قارنها بمواصفات مزود الطباعة المكتوبة.`} /></div>
  </main>;
}
