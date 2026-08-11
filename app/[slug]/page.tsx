import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, PageCta, PageHero } from "@/components/content-shell";
import { TRUST_PAGES } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";

const TRUST_SEO_TITLES: Record<string, string> = {
  about: "About Our Print Preparation Tools",
  methodology: "Print Calculation Methodology",
  sources: "Standards and Reference Sources",
};

const DEDICATED_TRUST_ROUTES = new Set(["privacy", "terms", "contact"]);

export function generateStaticParams() {
  return Object.keys(TRUST_PAGES)
    .filter((slug) => !DEDICATED_TRUST_ROUTES.has(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (DEDICATED_TRUST_ROUTES.has(slug)) return {};
  const page = TRUST_PAGES[slug];
  return page
    ? pageMetadata({
        title: TRUST_SEO_TITLES[slug] ?? page.title,
        description: page.description,
        path: `/${slug}`,
      })
    : {};
}

export default async function TrustPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (DEDICATED_TRUST_ROUTES.has(slug)) notFound();

  const page = TRUST_PAGES[slug];
  if (!page) notFound();

  return (
    <main>
      <div className="shell">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: page.title }]} />
      </div>
      <PageHero eyebrow="Print Prep Lab" title={page.title} description={page.description} />
      <article className="policy-layout shell">
        {page.sections.map((section, index) => (
          <section key={section.heading}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        {slug === "sources" && (
          <div className="source-links">
            <a href="https://www.iso.org/standard/36631.html" target="_blank" rel="noreferrer">
              ISO 216:2007 <b>↗</b>
            </a>
            <a href="https://www.nist.gov/pml/owm/si-units-length" target="_blank" rel="noreferrer">
              NIST inch conversion <b>↗</b>
            </a>
            <a
              href="https://helpx.adobe.com/photoshop/desktop/crop-resize-transform/resize-adjust-resolution/resolution-specs-for-printing-images.html"
              target="_blank"
              rel="noreferrer"
            >
              Adobe print resolution guidance <b>↗</b>
            </a>
          </div>
        )}
      </article>
      <div className="shell">
        <PageCta />
      </div>
    </main>
  );
}
