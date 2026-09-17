import type { Metadata } from "next";
import { Breadcrumbs, PageHero } from "@/components/content-shell";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact Print Prep Lab",
  description: "Report a calculation issue, missing print size, source conflict or site problem to Print Prep Lab through a reproducible public workflow.",
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
        description="Found a result that looks wrong, a missing print format, a source conflict or a site problem? Send a reproducible report through the public project tracker."
      />

      <article className="policy-layout shell">
        <section>
          <span>01</span>
          <div>
            <h2>How to contact the project</h2>
            <p>
              Print Prep Lab is published and maintained by Hossam Eldeen. Calculation bug reports, missing-size requests, source corrections and site feedback are accepted through the project&apos;s public GitHub Issues tracker so the report and any correction can be inspected later.
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
              Include the page used, image pixel width and height, physical print size and unit, target PPI, orientation, bleed or safe-margin values, the result shown and the result you expected. Those inputs are normally enough to reproduce the arithmetic without the original image.
            </p>
            <p>
              If a printer&apos;s written specification conflicts with a general planning value on the site, include the exact requirement and, when possible, a public link to the provider&apos;s specification. Provider-specific rules are not silently treated as universal standards.
            </p>
          </div>
        </section>

        <section>
          <span>03</span>
          <div>
            <h2>Protect private information</h2>
            <p>
              Do not post passwords, payment details, private documents, customer records or confidential images in a public issue. A written summary of the numerical inputs is enough for most calculation reports.
            </p>
            <p>
              The print-readiness tool processes selected images locally in the browser; you do not need to upload the original image to report a calculation discrepancy.
            </p>
          </div>
        </section>

        <section>
          <span>04</span>
          <div>
            <h2>Reproducible report template</h2>
            <div className="report-template">
              <code>
                Page used:{"\n"}
                Image pixels: width × height{"\n"}
                Print size and unit:{"\n"}
                Target PPI:{"\n"}
                Orientation:{"\n"}
                Bleed / safe margin:{"\n"}
                Expected result:{"\n"}
                Displayed result:{"\n"}
                Provider specification link (if relevant):
              </code>
            </div>
          </div>
        </section>

        <section data-content-value="correction-process">
          <span>05</span>
          <div>
            <h2>What happens when a calculation report is valid</h2>
            <p>
              The reported inputs are reproduced against the shared calculation functions. If the arithmetic is wrong, the defect should first be represented by a failing deterministic test; the shared function is then corrected so every page using that calculation receives the same fix rather than patching one displayed example.
            </p>
            <p>
              If the arithmetic is correct but the explanation is misleading, the wording, assumptions or example is corrected instead. A substantive change should update the affected review metadata rather than presenting an old page as newly checked without evidence.
            </p>
          </div>
        </section>

        <section data-content-value="verifiable-contact-records">
          <span>06</span>
          <div>
            <h2>Public source and publisher profile</h2>
            <p>
              The repository contains the report template, shared calculation module and regression tests used by the project. These records make the contact route useful for verifiable corrections rather than a generic feedback form.
            </p>
            <div className="source-links">
              <a href="https://github.com/Hosyss/print-prep-lab/blob/main/.github/ISSUE_TEMPLATE/calculation-report.md" target="_blank" rel="noreferrer"><strong>Calculation report template</strong><small>See the exact fields requested for a reproducible report.</small><b>↗</b></a>
              <a href="https://github.com/Hosyss/print-prep-lab/blob/main/lib/print-math.ts" target="_blank" rel="noreferrer"><strong>Shared calculation implementation</strong><small>Inspect the unit conversion, PPI, crop and bleed functions.</small><b>↗</b></a>
              <a href="https://github.com/Hosyss/print-prep-lab/blob/main/tests/print-math.test.mjs" target="_blank" rel="noreferrer"><strong>Math regression tests</strong><small>Inspect known examples, boundaries and invalid-input checks.</small><b>↗</b></a>
              <a href="https://github.com/Hosyss" target="_blank" rel="noreferrer"><strong>Publisher profile</strong><small>Public account responsible for the repository and project history.</small><b>↗</b></a>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}