import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, FaqList, PageCta, PageHero } from "@/components/content-shell";
import { GUIDE_ARABIC } from "@/lib/source-arabic-guides";
import { GUIDE_PAGES } from "@/lib/site-content";
import { AUTHOR_NAME, SITE_LAUNCHED_AT, SITE_UPDATED_AT, SITE_URL, pageMetadata } from "@/lib/seo";

export function generateStaticParams() { return GUIDE_PAGES.map((guide) => ({ slug: guide.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const guide = GUIDE_PAGES.find((item) => item.slug === slug); return guide ? pageMetadata({ title: guide.title, description: guide.description, path: `/guides/${slug}` }) : {}; }

export default async function GuideDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDE_PAGES.find((item) => item.slug === slug);
  if (!guide) notFound();
  const ar = GUIDE_ARABIC[guide.slug];
  const localizedFaq = guide.faq.map((item, index) => ({ ...item, questionAr: ar?.faq[index]?.question, answerAr: ar?.faq[index]?.answer }));
  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.heading,
    description: guide.description,
    mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
    datePublished: SITE_LAUNCHED_AT,
    dateModified: SITE_UPDATED_AT,
    inLanguage: "en",
    author: { "@type": "Person", name: AUTHOR_NAME, url: `${SITE_URL}/about` },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData).replace(/</g, "\\u003c") }} />
    <div className="shell"><Breadcrumbs items={[{ label: "Home", arLabel: "الرئيسية", href: "/" }, { label: "Guides", arLabel: "الأدلة", href: "/guides" }, { label: guide.heading, arLabel: ar?.heading }]} /></div>
    <PageHero eyebrow="Print preparation guide" arEyebrow="دليل تجهيز الطباعة" title={guide.heading} arTitle={ar?.heading} description={guide.description} arDescription={ar?.description}><div className="hero-spec"><span data-en="Key takeaway" data-ar="الخلاصة الأساسية">Key takeaway</span><strong data-en={guide.takeaway} data-ar={ar?.takeaway}>{guide.takeaway}</strong><small data-en="Reviewed and updated August 24, 2026" data-ar="تمت المراجعة والتحديث في 24 أغسطس 2026">Reviewed and updated August 24, 2026</small></div></PageHero>

    <section className="guide-byline shell" aria-label="Guide authorship and review details"><div><span data-en="Written and maintained by" data-ar="الكتابة والصيانة">Written and maintained by</span><Link href="/about">{AUTHOR_NAME}</Link></div><div><span data-en="Calculation review" data-ar="مراجعة الحسابات">Calculation review</span><Link href="/methodology" data-en="Documented formulas and automated tests" data-ar="معادلات موثقة واختبارات آلية">Documented formulas and automated tests</Link></div><div><span data-en="Editorial standard" data-ar="المعيار التحريري">Editorial standard</span><Link href="/editorial-policy" data-en="Sources, corrections and independence" data-ar="المصادر والتصحيحات والاستقلالية">Sources, corrections and independence</Link></div></section>

    <section className="quick-answer shell" aria-label="Quick answer"><div><span data-en="Quick answer" data-ar="إجابة سريعة">Quick answer</span><p data-en={guide.quickAnswer} data-ar={ar?.quickAnswer}>{guide.quickAnswer}</p></div><code>{guide.formula}</code></section>

    <section className="guide-summary-grid shell" aria-label="Guide summary">{guide.summary.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><p>{item.note}</p></article>)}</section>

    <section className="guide-comparison shell" aria-labelledby="guide-comparison-heading"><div className="section-kicker" data-en="Decision table" data-ar="جدول القرار">Decision table</div><h2 id="guide-comparison-heading">{guide.comparison.caption}</h2><div className="data-table-wrap"><table className="data-table"><thead><tr>{guide.comparison.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{guide.comparison.rows.map((row) => <tr key={row.join("|")}>{row.map((cell, index) => <td key={`${index}-${cell}`}><span>{cell}</span></td>)}</tr>)}</tbody></table></div></section>

    {guide.visual === "bleed-boxes" && <section className="guide-bleed-visual shell" aria-label="Bleed, trim and safe area diagram"><div className="bleed-box"><span data-en="Bleed canvas · 216 × 303 mm" data-ar="لوحة النزف · 216 × 303 مم">Bleed canvas · 216 × 303 mm</span><div className="trim-box"><span data-en="Trim · 210 × 297 mm" data-ar="التشذيب · 210 × 297 مم">Trim · 210 × 297 mm</span><div className="safe-box"><span data-en="Safe area · 200 × 287 mm" data-ar="منطقة الأمان · 200 × 287 مم">Safe area · 200 × 287 mm</span></div></div></div><p data-en="Example only: A4 trim with 3 mm bleed and a 5 mm safe margin on every edge." data-ar="مثال فقط: تشذيب A4 مع نزف 3 مم وهامش أمان 5 مم على كل حافة.">Example only: A4 trim with 3 mm bleed and a 5 mm safe margin on every edge.</p></section>}

    <article className="article-layout shell"><div className="article-main">{guide.sections.map((section, index) => <section id={`section-${index + 1}`} key={section.heading}><span>{String(index + 1).padStart(2, "0")}</span><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</div><aside><strong data-en="In this guide" data-ar="في هذا الدليل">In this guide</strong>{guide.sections.map((section, index) => <a key={section.heading} href={`#section-${index + 1}`}>{index + 1}. {section.heading}</a>)}<Link className="guide-primary-link" href={guide.primaryCta.href} data-en={`${guide.primaryCta.label} →`} data-ar={`${ar?.primaryCta ?? guide.primaryCta.label} ←`}>{guide.primaryCta.label} →</Link></aside></article>

    <section className="guide-action-grid shell"><article><div className="section-kicker" data-en="Practical workflow" data-ar="خطوات عملية">Practical workflow</div><h2 data-en="Use this order before you export." data-ar="اتبع هذا الترتيب قبل التصدير.">Use this order before you export.</h2><ol>{guide.workflow.map((step, index) => <li key={step} data-en={step} data-ar={ar?.workflow[index]}>{step}</li>)}</ol></article><aside><div className="section-kicker" data-en="Common mistakes" data-ar="أخطاء شائعة">Common mistakes</div><h2 data-en="Avoid these shortcuts." data-ar="تجنب هذه الاختصارات الخاطئة.">Avoid these shortcuts.</h2><ul>{guide.mistakes.map((mistake, index) => <li key={mistake} data-en={mistake} data-ar={ar?.mistakes[index]}>{mistake}</li>)}</ul></aside></section>

    <section className="content-section shell two-column-copy guide-faq-section"><article><div className="section-kicker" data-en="Sources and method" data-ar="المصادر والمنهج">Sources and method</div><h2 data-en="Check the requirement behind the number." data-ar="تحقق من المتطلب وراء الرقم.">Check the requirement behind the number.</h2><p data-en="These guides explain repeatable calculations and planning ranges. The print provider's written specification remains the final production requirement." data-ar="تشرح هذه الأدلة حسابات قابلة للتكرار ونطاقات للتخطيط. وتظل المواصفات المكتوبة من مزود الطباعة هي متطلب الإنتاج النهائي.">These guides explain repeatable calculations and planning ranges. The print provider&apos;s written specification remains the final production requirement.</p><div className="guide-source-links">{guide.sources.map((source) => source.href.startsWith("/") ? <Link href={source.href} key={source.href}>{source.label} <b>→</b></Link> : <a href={source.href} key={source.href} target="_blank" rel="noreferrer">{source.label} <b>↗</b></a>)}</div></article><aside><div className="section-kicker" data-en="Questions" data-ar="أسئلة">Questions</div><FaqList items={localizedFaq} /></aside></section>

    <section className="related-strip shell"><span data-en="Continue learning" data-ar="تابع التعلّم">Continue learning</span>{guide.related.map((relatedSlug) => { const item = GUIDE_PAGES.find((candidate) => candidate.slug === relatedSlug); return item ? <Link href={`/guides/${item.slug}`} key={item.slug}>{item.heading} <b>→</b></Link> : null; })}</section>
    <div className="shell"><PageCta eyebrow="Put the guide into practice" arEyebrow="طبّق الدليل عمليًا" title={guide.takeaway} arTitle={ar?.takeaway} description="Use the linked calculator with your own dimensions, then verify the result against the provider's production requirement." arDescription="استخدم الحاسبة المرتبطة بأبعادك الفعلية، ثم تحقق من النتيجة وفق متطلبات الإنتاج الخاصة بالمزود." href={guide.primaryCta.href} label={guide.primaryCta.label} arLabel={ar?.primaryCta} /></div>
  </main>;
}
