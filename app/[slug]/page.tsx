import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, PageCta, PageHero } from "@/components/content-shell";
import { TRUST_PAGES } from "@/lib/site-content";
import { TRUST_EVIDENCE } from "@/lib/trust-evidence";
import { TRUST_ARABIC, TRUST_EVIDENCE_ARABIC } from "@/lib/trust-arabic";
import { AUTHOR_NAME, SITE_URL, pageMetadata } from "@/lib/seo";

const TRUST_SEO_TITLES: Record<string, string> = {
  about: "About Our Print Preparation Tools",
  methodology: "Print Calculation Methodology",
  sources: "Standards and Reference Sources",
  "editorial-policy": "Editorial Policy and Review Process",
};

export function generateStaticParams() {
  return Object.keys(TRUST_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
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
  const page = TRUST_PAGES[slug];
  if (!page) notFound();
  const evidence = TRUST_EVIDENCE[slug];
  const ar = TRUST_ARABIC[slug];
  const arEvidence = TRUST_EVIDENCE_ARABIC[slug];

  const profileStructuredData = slug === "about" ? {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: AUTHOR_NAME,
      url: `${SITE_URL}/about`,
      sameAs: ["https://github.com/Hosyss"],
      jobTitle: "Publisher and maintainer of Print Prep Lab",
    },
  } : null;

  return (
    <main>
      {profileStructuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileStructuredData).replace(/</g, "\\u003c") }} />}
      <div className="shell">
        <Breadcrumbs items={[{ label: "Home", arLabel: "الرئيسية", href: "/" }, { label: page.title, arLabel: ar.title }]} />
      </div>
      <PageHero eyebrow="Print Prep Lab" title={page.title} arTitle={ar.title} description={page.description} arDescription={ar.description} />
      <article className="policy-layout shell">
        {page.sections.map((section, index) => (
          <section key={section.heading}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2 data-en={section.heading} data-ar={ar.sections[index].heading}>{section.heading}</h2>
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraph} data-en={paragraph} data-ar={ar.sections[index].paragraphs[paragraphIndex]}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        {evidence && (
          <section data-content-value="verifiable-evidence">
            <span>{String(page.sections.length + 1).padStart(2, "0")}</span>
            <div>
              <h2 data-en={evidence.heading} data-ar={arEvidence.heading}>{evidence.heading}</h2>
              <p data-en={evidence.intro} data-ar={arEvidence.intro}>{evidence.intro}</p>
              <div className="source-links">
                {evidence.links.map((item, index) => {
                  const external = item.href.startsWith("http");
                  return <a key={item.href} href={item.href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
                    <strong data-en={item.label} data-ar={arEvidence.links[index].label}>{item.label}</strong>
                    <small data-en={item.description} data-ar={arEvidence.links[index].description}>{item.description}</small>
                    <b>{external ? "↗" : "→"}</b>
                  </a>;
                })}
              </div>
            </div>
          </section>
        )}
      </article>
      <div className="shell">
        <PageCta eyebrow="Transparent print planning" arEyebrow="تخطيط طباعة واضح" title={slug === "about" ? "Try the tools this project is built to explain." : "Apply this guidance to a real print."} arTitle={slug === "about" ? "جرّب الأدوات التي يشرحها هذا المشروع." : "طبّق هذه الإرشادات على طباعة فعلية."} description="Use a calculator with visible inputs and formulas, then compare the result with the production provider's specification." arDescription="استخدم حاسبة بمدخلات ومعادلات واضحة، ثم قارن النتيجة بمواصفات جهة الطباعة." />
      </div>
    </main>
  );
}
