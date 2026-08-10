import type { Metadata } from "next";
import Link from "next/link";
import { PrintReadinessLab } from "@/components/print-readiness-lab";
import { pageMetadata } from "@/lib/seo";

const homeMetadata = pageMetadata({
  title: "Print Size, Pixel and Image Resolution Tools | Print Prep Lab",
  description: "Check image quality, calculate print dimensions, preview cropping and prepare bleed with free browser-based print tools.",
  path: "/",
});

export const metadata: Metadata = {
  ...homeMetadata,
  title: { absolute: "Print Size, Pixel and Image Resolution Tools | Print Prep Lab" },
};

const taskRoutes = [
  { label: "I have an image", title: "Check print readiness", text: "Read its real pixels and see maximum print sizes, effective PPI and crop.", href: "/tools/print-readiness-checker" },
  { label: "I know the pixels", title: "Find physical size", text: "Convert width and height in pixels to inches or centimetres at any PPI.", href: "/tools/pixels-to-print-size" },
  { label: "I know the paper", title: "Find required pixels", text: "Choose a standard format or enter a custom size and calculate the export dimensions.", href: "/tools/paper-size-pixels-calculator" },
  { label: "I need production setup", title: "Plan crop and bleed", text: "Preview framing, then calculate the full canvas and protected safe area.", href: "/tools/aspect-ratio-crop-preview" },
];

const popularSizes = [
  { name: "A4", measure: "210 × 297 mm", pixels: "2480 × 3508 px", href: "/sizes/a4" },
  { name: "A2", measure: "420 × 594 mm", pixels: "4961 × 7016 px", href: "/sizes/a2" },
  { name: "US Letter", measure: "8.5 × 11 in", pixels: "2550 × 3300 px", href: "/sizes/us-letter" },
  { name: "US Legal", measure: "8.5 × 14 in", pixels: "2550 × 4200 px", href: "/sizes/us-legal" },
  { name: "4 × 6", measure: "2:3 photo", pixels: "1200 × 1800 px", href: "/sizes/4x6-photo" },
  { name: "8 × 10", measure: "4:5 photo", pixels: "2400 × 3000 px", href: "/sizes/8x10-photo" },
];

const tools = [
  { num: "01", title: "Print readiness checker", text: "Use a real image to see effective PPI, crop, bleed and maximum print sizes.", href: "/tools/print-readiness-checker" },
  { num: "02", title: "Pixels to print size", text: "Turn pixel dimensions into inches and centimetres at any PPI target.", href: "/tools/pixels-to-print-size" },
  { num: "03", title: "Print size to pixels", text: "Find the exact pixel dimensions required for a physical print size.", href: "/tools/print-size-to-pixels" },
  { num: "04", title: "Bleed and safe area", text: "Calculate the full canvas, trim and safe zone in physical units and pixels.", href: "/tools/bleed-safe-area-calculator" },
];

export default function Home() {
  return <main>
    <section className="hero shell">
      <div className="eyebrow"><span /> Print decisions, made clear</div>
      <div className="hero-copy">
        <h1>Know If Your Image{" "}<br /><em>Is Ready to Print</em></h1>
        <p>Check real pixels, effective PPI, maximum print size, crop, bleed and safe area before you spend money printing.</p>
        <div className="hero-actions"><a className="button primary" href="#check">Check my image <span>→</span></a><Link className="button secondary" href="/sizes">Browse print sizes</Link></div>
        <div className="trust-row"><span>✓ Local image processing</span><span>✓ No sign-up</span><span>✓ Visible formulas</span></div>
      </div>
      <div className="hero-note"><strong>FROM PIXELS</strong><span className="measure-line" /><strong>TO PAPER</strong><small>Accurate sizes. Honest quality guidance.</small></div>
    </section>

    <div id="check" className="checker-section shell"><PrintReadinessLab /></div>

    <section className="section shell home-route-section">
      <div className="section-kicker">Start with what you know</div>
      <div className="section-heading"><h2>One clear route for<br />each print question.</h2><p>Skip the terminology hunt. Choose the card that describes the information already in front of you.</p></div>
      <div className="home-path-grid">{taskRoutes.map((route) => <Link href={route.href} key={route.label}><span>{route.label}</span><h3>{route.title}</h3><p>{route.text}</p><b>Start here →</b></Link>)}</div>
    </section>

    <section className="section paper-section">
      <div className="shell">
        <div className="section-kicker">Popular references</div>
        <div className="section-heading compact"><h2>Start with the size<br />you need.</h2><Link href="/sizes#size-index">View every size →</Link></div>
        <div className="size-grid">{popularSizes.map((size) => <Link href={size.href} className="size-card" key={size.name}><span className="paper-shape"><i>{size.name}</i></span><div><h3>{size.name}</h3><p>{size.measure}</p><strong>{size.pixels}</strong><small>at 300 PPI</small></div><b>↗</b></Link>)}</div>
      </div>
    </section>

    <section className="section shell">
      <div className="section-kicker">Focused tools</div>
      <div className="section-heading"><h2>Use the right direction<br />for the question.</h2><p>Each calculator has one job, with the formula and units kept visible.</p></div>
      <div className="tools-list">{tools.map((tool) => <Link href={tool.href} key={tool.num}><span>{tool.num}</span><div><h3>{tool.title}</h3><p>{tool.text}</p></div><b>→</b></Link>)}</div>
      <div className="home-index-link"><Link href="/tools">Browse all seven print tools →</Link></div>
    </section>

    <section className="home-guide-section">
      <div className="shell home-guide-grid"><div><span>Flagship guide</span><h2>How large can you print an image without losing quality?</h2><p>Start with real pixel dimensions, choose a defensible PPI target and account for the final crop before calculating inches.</p><Link className="button primary" href="/guides/how-large-can-i-print-my-image">Read the print-size guide <span>→</span></Link></div><aside><strong>6000 × 4000 px</strong><p>20 × 13.33 in at 300 PPI</p><p>25 × 16.67 in at 240 PPI</p><p>40 × 26.67 in at 150 PPI</p><small>Before crop · confirm provider requirements</small></aside></div>
    </section>

    <section className="method-strip">
      <div className="shell method-inner"><div><span>Methodology before marketing</span><h2>Print math you can inspect.</h2></div><p>Paper dimensions come from documented standards. Pixel results state the selected PPI and rounding rule. Quality labels describe a target—not a printer guarantee.</p><Link href="/methodology">Read our methodology →</Link></div>
    </section>
  </main>;
}
