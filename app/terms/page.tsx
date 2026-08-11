import type { Metadata } from "next";
import { Breadcrumbs, PageHero } from "@/components/content-shell";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use | Print Prep Lab",
  description: "Terms covering Print Prep Lab calculators, print guidance, external services and advertising.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <main>
      <div className="shell">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Terms of Use" }]} />
      </div>

      <PageHero
        eyebrow="Last updated August 11, 2026"
        title="Terms of Use"
        description="Important limits and responsibilities when using Print Prep Lab calculators, references and external services."
      />

      <article className="policy-layout shell">
        <section>
          <span>01</span>
          <div>
            <h2>Planning guidance</h2>
            <p>
              Print Prep Lab provides calculation tools and educational references for print planning. Results are not a production guarantee, printer certification or substitute for a physical proof supplied by a print provider.
            </p>
          </div>
        </section>

        <section>
          <span>02</span>
          <div>
            <h2>Your production responsibility</h2>
            <p>
              Confirm final dimensions, bleed, safe area, color mode, profile, file format and resolution with the company producing the work. Provider-specific requirements take priority over general examples shown on this site.
            </p>
          </div>
        </section>

        <section>
          <span>03</span>
          <div>
            <h2>Reasonable use</h2>
            <p>
              You may use the calculators for personal, educational and commercial print planning. Do not present the site&apos;s guidance as a guarantee issued by a third-party printer or standards body.
            </p>
          </div>
        </section>

        <section>
          <span>04</span>
          <div>
            <h2>Advertising and external services</h2>
            <p>
              The site may display third-party advertising and link to external resources. Advertising, analytics, hosting and linked third-party services are responsible for their own content, availability, terms and privacy practices.
            </p>
          </div>
        </section>

        <section>
          <span>05</span>
          <div>
            <h2>Changes and availability</h2>
            <p>
              Features, calculations and reference material may be corrected or updated when standards, provider guidance or site functionality changes. Print Prep Lab does not guarantee uninterrupted availability of every tool or external service.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
