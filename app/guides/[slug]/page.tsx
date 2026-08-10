import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, FaqList, PageCta, PageHero } from "@/components/content-shell";
import { GUIDE_PAGES } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() { return GUIDE_PAGES.map((guide) => ({ slug: guide.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const guide = GUIDE_PAGES.find((item) => item.slug === slug); return guide ? pageMetadata({ title: guide.title, description: guide.description, path: `/guides/${slug}` }) : {}; }

export default async function GuideDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDE_PAGES.find((item) => item.slug === slug);
  if (!guide) notFound();
  return <main>
    <div className="shell"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: guide.heading }]} /></div>
    <PageHero eyebrow="Print preparation guide" title={guide.heading} description={guide.description}><div className="hero-spec"><span>Key takeaway</span><strong>{guide.takeaway}</strong><small>Reviewed August 2026</small></div></PageHero>

    <section className="quick-answer shell" aria-label="Quick answer"><div><span>Quick answer</span><p>{guide.quickAnswer}</p></div><code>{guide.formula}</code></section>

    <section className="guide-summary-grid shell" aria-label="Guide summary">{guide.summary.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><p>{item.note}</p></article>)}</section>

    <section className="guide-comparison shell" aria-labelledby="guide-comparison-heading"><div className="section-kicker">Decision table</div><h2 id="guide-comparison-heading">{guide.comparison.caption}</h2><div className="data-table-wrap"><table className="data-table"><thead><tr>{guide.comparison.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{guide.comparison.rows.map((row) => <tr key={row.join("|")}>{row.map((cell, index) => <td key={`${index}-${cell}`}><span>{cell}</span></td>)}</tr>)}</tbody></table></div></section>

    {guide.visual === "bleed-boxes" && <section className="guide-bleed-visual shell" aria-label="Bleed, trim and safe area diagram"><div className="bleed-box"><span>Bleed canvas · 216 × 303 mm</span><div className="trim-box"><span>Trim · 210 × 297 mm</span><div className="safe-box"><span>Safe area · 200 × 287 mm</span></div></div></div><p>Example only: A4 trim with 3 mm bleed and a 5 mm safe margin on every edge.</p></section>}

    <article className="article-layout shell"><div className="article-main">{guide.sections.map((section, index) => <section id={`section-${index + 1}`} key={section.heading}><span>{String(index + 1).padStart(2, "0")}</span><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</div><aside><strong>In this guide</strong>{guide.sections.map((section, index) => <a key={section.heading} href={`#section-${index + 1}`}>{index + 1}. {section.heading}</a>)}<Link className="guide-primary-link" href={guide.primaryCta.href}>{guide.primaryCta.label} →</Link></aside></article>

    <section className="guide-action-grid shell"><article><div className="section-kicker">Practical workflow</div><h2>Use this order before you export.</h2><ol>{guide.workflow.map((step) => <li key={step}>{step}</li>)}</ol></article><aside><div className="section-kicker">Common mistakes</div><h2>Avoid these shortcuts.</h2><ul>{guide.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></aside></section>

    <section className="content-section shell two-column-copy guide-faq-section"><article><div className="section-kicker">Sources and method</div><h2>Check the requirement behind the number.</h2><p>These guides explain repeatable calculations and planning ranges. The print provider&apos;s written specification remains the final production requirement.</p><div className="guide-source-links">{guide.sources.map((source) => source.href.startsWith("/") ? <Link href={source.href} key={source.href}>{source.label} <b>→</b></Link> : <a href={source.href} key={source.href} target="_blank" rel="noreferrer">{source.label} <b>↗</b></a>)}</div></article><aside><div className="section-kicker">Questions</div><FaqList items={guide.faq} /></aside></section>

    <section className="related-strip shell"><span>Continue learning</span>{guide.related.map((relatedSlug) => { const item = GUIDE_PAGES.find((candidate) => candidate.slug === relatedSlug); return item ? <Link href={`/guides/${item.slug}`} key={item.slug}>{item.heading} <b>→</b></Link> : null; })}</section>
    <div className="shell"><PageCta /></div>
  </main>;
}
