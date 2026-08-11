import type { Metadata } from "next";
import { Breadcrumbs, PageHero } from "@/components/content-shell";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact Print Prep Lab",
  description: "Report a calculation issue, missing print size or site problem to Print Prep Lab.",
  path: "/contact",
});

const issueUrl =
  "https://github.com/Hosyss/print-prep-lab/issues/new?template=calculation-report.md";

export default function ContactPage() {
  return (
    <main>
      <div className="shell">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      </div>

      <PageHero
        eyebrow="Print Prep Lab"
        title="Contact & Calculation Reports"
        description="Found a result that looks wrong, a missing print format or a site problem? Send a reproducible report through our public project tracker."
      />

      <article className="policy-layout shell">
        <section>
          <span>01</span>
          <div>
            <h2>How to contact us</h2>
            <p>
              Print Prep Lab accepts calculation bug reports, missing-size requests and site feedback through the project&apos;s public GitHub Issues tracker.
            </p>
            <p>
              <a href={issueUrl} target="_blank" rel="noreferrer" className="text-link">
                Open a new calculation or site report →
              </a>
            </p>
          </div>
        </section>

        <section>
          <span>02</span>
          <div>
            <h2>What to include</h2>
            <p>
              Include the page used, image pixel width and height, physical print size and unit, target PPI, orientation, bleed or safe-margin values, the result shown and the result you expected.
            </p>
            <p>
              If a printer&apos;s written specification conflicts with a general default on the site, include the relevant requirement or a public link to it.
            </p>
          </div>
        </section>

        <section>
          <span>03</span>
          <div>
            <h2>Protect private information</h2>
            <p>
              Do not post passwords, payment details, private documents or confidential images in a public issue. A written summary of the calculation inputs is enough for most reports.
            </p>
            <p>
              The print-readiness tool processes selected images locally in the browser; you do not need to upload the original image to report a calculation discrepancy.
            </p>
          </div>
        </section>

        <section>
          <span>04</span>
          <div>
            <h2>Report template</h2>
            <div className="report-template">
              <code>
                Page used:{"\n"}
                Image pixels: width × height{"\n"}
                Print size and unit:{"\n"}
                Target PPI:{"\n"}
                Orientation:{"\n"}
                Bleed / safe margin:{"\n"}
                Expected result:{"\n"}
                Displayed result:
              </code>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
