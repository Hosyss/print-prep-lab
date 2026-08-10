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
  { key: "ISO", title: "ISO A-series paper", text: "International paper formats with the consistent 1:√2 proportion." },
  { key: "US", title: "US paper sizes", text: "Letter and Legal office formats defined in inches." },
  { key: "Photo", title: "Photo print sizes", text: "Common lab and frame formats, each with its own crop ratio." },
] as const;

const ppiNotes = [
  { ppi: "150 PPI", label: "Distance dependent", text: "A practical planning level for some larger prints viewed farther away." },
  { ppi: "240 PPI", label: "Detailed print", text: "A strong intermediate target when the source file cannot reach 300 PPI." },
  { ppi: "300 PPI", label: "Common high-detail target", text: "Often requested for detailed prints viewed closely; confirm with the provider." },
];

export default function SizesIndex() {
  return <main>
    <div className="shell"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Print sizes" }]} /></div>
    <PageHero eyebrow="12 physical-size references" title="Paper and Photo Size Reference" description="Browse exact trim dimensions, compare aspect ratios and see the pixels needed at 300 PPI. Every reference also includes a calculator for other resolutions.">
      <div className="hero-spec"><span>Most used reference</span><strong>A4 is 210 × 297 mm.</strong><small>2480 × 3508 px at 300 PPI · trim only</small><Link className="text-link" href="/sizes/a4">Open A4 dimensions →</Link></div>
    </PageHero>

    <section className="content-section shell hub-definition-grid">
      <article><span>Paper formats</span><h2>Fixed physical standards.</h2><p>ISO and US paper names define a trim size, not one fixed pixel size. Pixels appear only after a PPI target is chosen.</p><Link href="/tools/paper-size-pixels-calculator">Calculate a paper size →</Link></article>
      <article><span>Photo formats</span><h2>Fixed sizes with crop decisions.</h2><p>A 4 × 6, 5 × 7 or 8 × 10 print also has a physical size, but their different aspect ratios can remove part of a camera image.</p><Link href="/tools/aspect-ratio-crop-preview">Preview a photo crop →</Link></article>
    </section>

    <section id="size-index" className="content-section shell size-library-groups">
      <div className="section-kicker">Browse by category</div>
      {groups.map((group) => <section key={group.key} aria-labelledby={`size-group-${group.key}`}>
        <div className="size-group-heading"><div><h2 id={`size-group-${group.key}`}>{group.title}</h2><p>{group.text}</p></div><span>{PRINT_PRESETS.filter((preset) => preset.group === group.key).length} references</span></div>
        <div className="size-index-grid">{PRINT_PRESETS.filter((preset) => preset.group === group.key).map((preset) => { const detail = SIZE_DETAILS[preset.slug]; return <Link href={`/sizes/${preset.slug}`} className="size-index-card" key={preset.slug}><span className={`paper-mini ${preset.group.toLowerCase()}`}>{preset.shortLabel}</span><div><small>{preset.group}</small><h3>{preset.label}</h3><p>{preset.widthMm} × {preset.heightMm} mm · {detail.ratio}</p><strong>{pixelsForMm(preset.widthMm, 300)} × {pixelsForMm(preset.heightMm, 300)} px <i>at 300 PPI</i></strong></div><b>↗</b></Link>; })}</div>
      </section>)}
    </section>

    <section className="content-section paper-section">
      <div className="shell"><div className="section-kicker">Pixels are a choice</div><div className="hub-section-title"><h2>The same paper needs different pixels at different PPI.</h2><p>Use these values as planning targets, not universal printer guarantees.</p></div><div className="ppi-guide-grid">{ppiNotes.map((item) => <article key={item.ppi}><span>{item.label}</span><h3>{item.ppi}</h3><p>{item.text}</p></article>)}</div></div>
    </section>

    <div className="shell"><PageCta /></div>
  </main>;
}
