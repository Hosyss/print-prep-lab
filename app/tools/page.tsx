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
  { label: "Check", title: "I have an image", text: "Read its real pixels, maximum print sizes, crop and effective PPI.", href: "/tools/print-readiness-checker" },
  { label: "Convert", title: "I know the pixels", text: "Turn pixel dimensions into inches or centimetres at a chosen PPI.", href: "/tools/pixels-to-print-size" },
  { label: "Plan", title: "I know the print size", text: "Calculate the exact source pixels needed for the final physical dimensions.", href: "/tools/print-size-to-pixels" },
  { label: "Prepare", title: "I need crop or bleed", text: "Preview framing or calculate trim, bleed and the safe content area.", href: "/tools/aspect-ratio-crop-preview" },
];

const toolFaq = [
  { question: "Which printing calculator should I use first?", answer: "If you already have the image, start with the print readiness checker. If you only know pixels or physical dimensions, choose the converter that starts with the value you already have." },
  { question: "Do these tools upload my image?", answer: "No. Image dimensions and previews are processed locally in your browser. Print Prep Lab does not receive the image file." },
  { question: "Are DPI and PPI interchangeable?", answer: "No. PPI describes image pixels placed into each printed inch; printer DPI describes output dots. Our image calculations use effective PPI and label it clearly." },
];

export default function ToolsIndex() {
  return <main>
    <div className="shell"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Tools" }]} /></div>
    <PageHero eyebrow="Seven focused calculators" title="Free Print Preparation Tools" description="Choose the task that matches what you know. Every calculator explains the formula, shows a practical result and keeps image processing on your device.">
      <div className="hero-spec"><span>Start here</span><strong>Check if an image is actually ready to print.</strong><small>Pixels · effective PPI · crop · bleed · maximum sizes</small><Link className="text-link" href="/tools/print-readiness-checker">Open the checker →</Link></div>
    </PageHero>

    <section className="content-section shell hub-task-section">
      <div className="section-kicker">Choose by starting point</div>
      <div className="hub-section-title"><h2>What do you have right now?</h2><p>You do not need to translate your question into technical terminology first.</p></div>
      <div className="hub-task-grid">{taskRoutes.map((task) => <Link href={task.href} key={task.title}><span>{task.label}</span><h3>{task.title}</h3><p>{task.text}</p><b>Use this route →</b></Link>)}</div>
    </section>

    <section className="hub-feature shell" aria-labelledby="featured-checker-title">
      <div><span>Featured tool</span><h2 id="featured-checker-title">One local check from pixels to paper.</h2><p>Choose an image and a target print. The checker reads the source dimensions locally, then reports effective PPI, maximum sizes at 150, 240 and 300 PPI, crop loss, bleed canvas and safe area.</p><div className="trust-row"><span>✓ No upload</span><span>✓ No account</span><span>✓ No hidden quality score</span></div></div>
      <aside><strong>Use the real file</strong><p>A DPI metadata tag cannot create detail. The checker starts with the image&apos;s actual width and height in pixels.</p><Link className="button primary" href="/tools/print-readiness-checker">Check my image <span>→</span></Link></aside>
    </section>

    <section className="content-section shell">
      <div className="section-kicker">All calculators</div>
      <div className="hub-section-title"><h2>One tool for each print decision.</h2><p>Clear inputs, visible units and a direct handoff to the next related task.</p></div>
      <div className="index-grid">{TOOL_PAGES.map((tool, index) => <Link className="index-card" href={`/tools/${tool.slug}`} key={tool.slug}><span>{String(index + 1).padStart(2, "0")}</span><h2>{tool.shortTitle}</h2><p>{tool.description}</p><strong>{tool.intent} →</strong></Link>)}</div>
    </section>

    <section className="content-section shell hub-learning-grid">
      <article><div className="section-kicker">Need the reasoning?</div><h2>Learn before you export.</h2><div className="hub-link-list"><Link href="/guides/how-large-can-i-print-my-image">How large can I print my image? <span>→</span></Link><Link href="/guides/dpi-vs-ppi">DPI vs PPI explained <span>→</span></Link><Link href="/guides/aspect-ratio-cropping-print">Why photos crop at print sizes <span>→</span></Link></div></article>
      <aside><div className="section-kicker">Tool questions</div><FaqList items={toolFaq} /></aside>
    </section>
    <div className="shell"><PageCta /></div>
  </main>;
}
