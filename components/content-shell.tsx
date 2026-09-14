import Link from "next/link";
import { SITE_URL } from "@/lib/seo";

type BreadcrumbItem = { label: string; href?: string; arLabel?: string };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
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

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><nav className="breadcrumbs" aria-label="Breadcrumb">{items.map((item, index) => <span key={`${item.label}-${index}`}>{index > 0 && <i aria-hidden="true">›</i>}{item.href ? <Link href={item.href} {...(item.arLabel ? { "data-en": item.label, "data-ar": item.arLabel } : {})}>{item.label}</Link> : <b aria-current="page" {...(item.arLabel ? { "data-en": item.label, "data-ar": item.arLabel } : {})}>{item.label}</b>}</span>)}</nav></>;
}

export function PageHero({ eyebrow, title, description, arEyebrow, arTitle, arDescription, children }: { eyebrow: string; title: string; description: string; arEyebrow?: string; arTitle?: string; arDescription?: string; children?: React.ReactNode }) {
  return <section className="inner-hero"><div className="shell"><div className="section-kicker" {...(arEyebrow ? { "data-en": eyebrow, "data-ar": arEyebrow } : {})}>{eyebrow}</div><div className="inner-hero-grid"><div><h1 {...(arTitle ? { "data-en": title, "data-ar": arTitle } : {})}>{title}</h1><p {...(arDescription ? { "data-en": description, "data-ar": arDescription } : {})}>{description}</p></div>{children && <aside>{children}</aside>}</div></div></section>;
}

export function FaqList({ items }: { items: Array<{ question: string; answer: string; questionAr?: string; answerAr?: string }> }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><div className="faq-list">{items.map((item) => <details key={item.question}><summary><span {...(item.questionAr ? { "data-en": item.question, "data-ar": item.questionAr } : {})}>{item.question}</span><span aria-hidden="true">+</span></summary><p {...(item.answerAr ? { "data-en": item.answer, "data-ar": item.answerAr } : {})}>{item.answer}</p></details>)}</div></>;
}

export function PageCta({
  eyebrow = "Check before you print",
  title = "Use the image, not a guess.",
  description = "Run the source pixels against the exact size you plan to order.",
  href = "/tools/print-readiness-checker",
  label = "Check an image",
  arEyebrow = "تحقق قبل الطباعة",
  arTitle = "استخدم الصورة الفعلية لا التخمين.",
  arDescription = "قارن بكسلات المصدر بالمقاس الدقيق الذي تنوي طباعته.",
  arLabel = "افحص صورة",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  href?: string;
  label?: string;
  arEyebrow?: string;
  arTitle?: string;
  arDescription?: string;
  arLabel?: string;
}) {
  return <section className="page-cta"><div><span data-en={eyebrow} data-ar={arEyebrow}>{eyebrow}</span><h2 data-en={title} data-ar={arTitle}>{title}</h2><p data-en={description} data-ar={arDescription}>{description}</p></div><Link className="button primary" href={href}><span data-en={label} data-ar={arLabel}>{label}</span> <span>→</span></Link></section>;
}
