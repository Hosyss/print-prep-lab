import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, PageCta, PageHero } from "@/components/content-shell";
import { TRUST_PAGES } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";

const TRUST_SEO_TITLES: Record<string, string> = {
  about: "About Our Print Preparation Tools",
  methodology: "Print Calculation Methodology",
  sources: "Standards and Reference Sources",
  privacy: "Privacy Policy for Local Image Tools",
  terms: "Terms of Use for Print Prep Lab",
  contact: "Contact and Calculation Feedback",
};

export function generateStaticParams() { return Object.keys(TRUST_PAGES).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const page = TRUST_PAGES[slug]; return page ? pageMetadata({ title: TRUST_SEO_TITLES[slug] ?? page.title, description: page.description, path: `/${slug}` }) : {}; }

export default async function TrustPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = TRUST_PAGES[slug];
  if (!page) notFound();
  return <main><div className="shell"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: page.title }]} /></div><PageHero eyebrow="Print Prep Lab" title={page.title} description={page.description} />
    <article className="policy-layout shell">{page.sections.map((section, index) => <section key={section.heading}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>)}
      {slug === "sources" && <div className="source-links"><a href="https://www.iso.org/standard/36631.html" target="_blank" rel="noreferrer">ISO 216:2007 <b>↗</b></a><a href="https://www.nist.gov/pml/owm/si-units-length" target="_blank" rel="noreferrer">NIST inch conversion <b>↗</b></a><a href="https://helpx.adobe.com/photoshop/desktop/crop-resize-transform/resize-adjust-resolution/resolution-specs-for-printing-images.html" target="_blank" rel="noreferrer">Adobe print resolution guidance <b>↗</b></a></div>}
      {slug === "contact" && <div className="report-template"><strong>Calculation report template</strong><code>Page used:<br />Image pixels: width × height<br />Print size and unit:<br />Target PPI:<br />Orientation:<br />Bleed / safe margin:<br />Expected result:<br />Displayed result:</code><p>Copy these fields into the project feedback channel. Do not attach the private image unless you intentionally choose to share it.</p></div>}
    </article><div className="shell">{slug !== "terms" && <PageCta />}</div>
  </main>;
}
