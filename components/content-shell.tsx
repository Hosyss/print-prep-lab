import Link from "next/link";
import { SITE_URL } from "@/lib/seo";

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: new URL(item.href, SITE_URL).toString() } : {}),
    })),
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><nav className="breadcrumbs" aria-label="Breadcrumb">{items.map((item, index) => <span key={`${item.label}-${index}`}>{index > 0 && <i aria-hidden="true">›</i>}{item.href ? <Link href={item.href}>{item.label}</Link> : <b aria-current="page">{item.label}</b>}</span>)}</nav></>;
}

export function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return <section className="inner-hero"><div className="shell"><div className="section-kicker">{eyebrow}</div><div className="inner-hero-grid"><div><h1>{title}</h1><p>{description}</p></div>{children && <aside>{children}</aside>}</div></div></section>;
}

export function FaqList({ items }: { items: Array<{ question: string; answer: string }> }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><div className="faq-list">{items.map((item) => <details key={item.question}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}</div></>;
}

export function PageCta({
  eyebrow = "Check before you print",
  title = "Use the image, not a guess.",
  description = "Run the source pixels against the exact size you plan to order.",
  href = "/tools/print-readiness-checker",
  label = "Check an image",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return <section className="page-cta"><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div><Link className="button primary" href={href}>{label} <span>→</span></Link></section>;
}
