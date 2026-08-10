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
  { label: "Image quality", title: "How many pixels are enough?", text: "Choose a realistic PPI target and calculate the maximum physical size from real source pixels.", href: "/guides/how-large-can-i-print-my-image" },
  { label: "Crop and ratio", title: "Why does the lab remove part of my photo?", text: "Compare the source and print shapes before ordering an edge-to-edge print.", href: "/guides/aspect-ratio-cropping-print" },
  { label: "Document setup", title: "Where do bleed, trim and safe area go?", text: "Separate the final cut edge from the extra image and the protected content zone.", href: "/guides/bleed-trim-safe-area" },
];

const toolHandoffs = [
  { title: "Check a real image", text: "See maximum sizes, effective PPI, crop loss and bleed from the actual file.", href: "/tools/print-readiness-checker" },
  { title: "Calculate effective PPI", text: "Use known pixels and a final physical print size to measure density.", href: "/tools/dpi-ppi-calculator" },
  { title: "Preview the crop", text: "Compare a source ratio with a standard or custom target print.", href: "/tools/aspect-ratio-crop-preview" },
];

export default function GuidesIndex() {
  return <main>
    <div className="shell"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Guides" }]} /></div>
    <PageHero eyebrow="Plain-English production decisions" title="Print Preparation Guides" description="Understand image resolution, PPI, cropping and document margins before changing a file. Each guide shows the decision, the formula and the tool to use next.">
      <div className="hero-spec"><span>Featured guide</span><strong>How large can you print an image?</strong><small>Start with real pixels, then account for PPI and crop.</small><Link className="text-link" href="/guides/how-large-can-i-print-my-image">Read the guide →</Link></div>
    </PageHero>

    <section className="content-section shell">
      <div className="section-kicker">Choose the decision</div>
      <div className="hub-section-title"><h2>What are you trying to solve?</h2><p>Start with the production question rather than a technical acronym.</p></div>
      <div className="guide-topic-grid">{topics.map((topic) => <Link href={topic.href} key={topic.title}><span>{topic.label}</span><h3>{topic.title}</h3><p>{topic.text}</p><b>Learn the decision →</b></Link>)}</div>
    </section>

    <section className="guide-feature shell" aria-labelledby="guide-feature-title">
      <div><span>Flagship guide</span><h2 id="guide-feature-title">Turn source pixels into a defensible maximum print size.</h2><p>A 6000 × 4000 pixel image is 20 × 13.33 inches at 300 PPI before crop, 25 × 16.67 inches at 240 PPI and 40 × 26.67 inches at 150 PPI. The useful answer depends on viewing distance, print process and the final ratio.</p><Link className="button primary" href="/guides/how-large-can-i-print-my-image">See the full method <span>→</span></Link></div>
      <aside><span>Core formula</span><code>print inches = pixels ÷ PPI</code><small>Apply the final crop before trusting the available pixel count.</small></aside>
    </section>

    <section className="content-section shell">
      <div className="section-kicker">All guides</div>
      <div className="guide-index">{GUIDE_PAGES.map((guide, index) => <Link href={`/guides/${guide.slug}`} key={guide.slug}><span>{String(index + 1).padStart(2, "0")}</span><div><small>Guide</small><h2>{guide.title}</h2><p>{guide.description}</p></div><b>Read guide →</b></Link>)}</div>
    </section>

    <section className="content-section paper-section">
      <div className="shell"><div className="section-kicker">From explanation to answer</div><div className="hub-section-title"><h2>Use the calculator that matches the guide.</h2><p>No account, image upload or server processing is required.</p></div><div className="tool-handoff-grid">{toolHandoffs.map((item) => <Link href={item.href} key={item.title}><h3>{item.title}</h3><p>{item.text}</p><b>Open tool →</b></Link>)}</div><p className="method-note">Want to audit the assumptions? <Link href="/methodology">Read our methodology and rounding rules →</Link></p></div>
    </section>

    <div className="shell"><PageCta /></div>
  </main>;
}
