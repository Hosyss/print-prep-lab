import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, FaqList, PageCta, PageHero } from "@/components/content-shell";
import { PrintReadinessLab } from "@/components/print-readiness-lab";
import { ToolCalculator } from "@/components/tool-calculators";
import { TOOL_CONTEXT, TOOL_PAGES } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";

const GUIDE_LINKS: Record<string, { href: string; label: string }> = {
  "print-readiness-checker": { href: "/guides/how-large-can-i-print-my-image", label: "How maximum print size works" },
  "pixels-to-print-size": { href: "/guides/print-resolution-guide", label: "Choose a print-resolution target" },
  "print-size-to-pixels": { href: "/guides/print-resolution-guide", label: "Read the print-resolution guide" },
  "dpi-ppi-calculator": { href: "/guides/dpi-vs-ppi", label: "Understand DPI vs PPI" },
  "paper-size-pixels-calculator": { href: "/sizes/a4", label: "Open the A4 size reference" },
  "aspect-ratio-crop-preview": { href: "/guides/aspect-ratio-cropping-print", label: "Why print sizes crop" },
  "bleed-safe-area-calculator": { href: "/guides/bleed-trim-safe-area", label: "Understand bleed, trim and safe area" },
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
  const guideLink = GUIDE_LINKS[tool.slug];
  const context = TOOL_CONTEXT[tool.slug];
  const relatedTools = tool.related.map((relatedSlug) => TOOL_PAGES.find((item) => item.slug === relatedSlug)).filter((item): item is (typeof TOOL_PAGES)[number] => Boolean(item));
  return <main><div className="shell"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Tools", href: "/tools" }, { label: tool.shortTitle }]} /></div>
    <PageHero eyebrow="Interactive browser tool" title={tool.heading} description={tool.description}><div className="hero-spec"><span>Primary question</span><strong>{tool.intent}</strong><small>No account required</small></div></PageHero>
    <section className="quick-answer shell" aria-label="Quick answer"><div><span>Quick answer</span><p>{tool.quickAnswer}</p></div><code>{tool.formula}</code></section>
    <section className="tool-page shell">{tool.mode === "print-readiness-checker" ? <PrintReadinessLab compact /> : <ToolCalculator mode={tool.mode} />}</section>
    {context && <section className="tool-context-grid shell" aria-label={`${tool.shortTitle} use cases and technical notes`}><article><div className="section-kicker">When to use this tool</div><h2>Use it for a specific print decision.</h2><ul>{context.useCases.map((item) => <li key={item}>{item}</li>)}</ul></article><aside><div className="section-kicker">Technical notes</div><h2>What the number does—and does not—mean.</h2><ul>{context.technicalNotes.map((item) => <li key={item}>{item}</li>)}</ul></aside></section>}
    <section className="content-section shell two-column-copy"><article><div className="section-kicker">How to use it</div><h2>A result you can reproduce.</h2><ol>{tool.steps.map((step) => <li key={step}>{step}</li>)}</ol><p className="callout-copy">Every result is calculated in the page from the displayed inputs. Your printer&apos;s written production specification remains the final authority.</p></article><aside><div className="section-kicker">Common questions</div><FaqList items={tool.faq} /></aside></section>
    <section className="content-section shell tool-learning-grid"><article><div className="section-kicker">Worked example</div><h2>See the numbers in context.</h2><p>{tool.example}</p>{guideLink && <Link className="text-link" href={guideLink.href}>{guideLink.label} →</Link>}</article><aside><div className="section-kicker">Avoid these mistakes</div><ul>{tool.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></aside></section>
    <section className="related-strip shell"><span>Related calculations</span>{relatedTools.map((item) => <Link href={`/tools/${item.slug}`} key={item.slug}>{item.shortTitle} <b>→</b></Link>)}</section>
    <div className="shell"><PageCta eyebrow="From calculation to production" title={`Verify the ${tool.shortTitle} result with your real file.`} description={`${tool.quickAnswer} Then compare the result with the print provider's written specification.`} /></div>
  </main>;
}
