import type { Metadata } from "next";
import { Breadcrumbs, PageHero } from "@/components/content-shell";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy | Print Prep Lab",
  description: "How Print Prep Lab handles images, calculator inputs, analytics, cookies and advertising services.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main>
      <div className="shell">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />
      </div>

      <PageHero
        eyebrow="Last updated August 11, 2026"
        title="Privacy Policy"
        description="How Print Prep Lab handles images, calculator inputs, analytics, cookies and advertising services."
      />

      <article className="policy-layout shell">
        <section>
          <span>01</span>
          <div>
            <h2>Image processing</h2>
            <p>
              The print-readiness checker reads image dimensions and generates its preview locally in your browser. The selected image is not intentionally uploaded to a Print Prep Lab server.
            </p>
            <p>
              Closing or replacing the image releases its temporary browser preview. Print Prep Lab does not provide an account-based image library.
            </p>
          </div>
        </section>

        <section>
          <span>02</span>
          <div>
            <h2>Calculator inputs</h2>
            <p>
              Pixel counts, physical sizes, PPI, orientation, bleed and safe-margin values are used in the browser session to calculate results. No confidential information is required to use the calculators.
            </p>
          </div>
        </section>

        <section>
          <span>03</span>
          <div>
            <h2>Analytics and diagnostics</h2>
            <p>
              Print Prep Lab may use analytics and diagnostic services, including Microsoft Clarity, to understand page usage, navigation, technical problems and interaction patterns. These services may process browser, device, approximate location and interaction data according to their own privacy terms and applicable consent requirements.
            </p>
            <p>
              Analytics data is used to improve the site, identify broken interactions and understand which tools are useful to visitors.
            </p>
          </div>
        </section>

        <section>
          <span>04</span>
          <div>
            <h2>Google AdSense and advertising cookies</h2>
            <p>
              Print Prep Lab may use Google AdSense to display advertising. Third-party vendors, including Google, may use cookies to serve ads based on a visitor&apos;s prior visits to this website or other websites.
            </p>
            <p>
              Google&apos;s use of advertising cookies enables Google and its partners to serve ads based on visits to Print Prep Lab and/or other sites on the Internet. Visitors can manage or opt out of personalized advertising through Google Ads Settings.
            </p>
            <p>
              <a href="https://adssettings.google.com/" target="_blank" rel="noreferrer" className="text-link">
                Manage Google ad settings →
              </a>
            </p>
          </div>
        </section>

        <section>
          <span>05</span>
          <div>
            <h2>Consent where required</h2>
            <p>
              Where applicable law or Google policy requires consent for cookies, local storage or personalized advertising, the site will use an appropriate consent mechanism before those purposes are enabled.
            </p>
            <p>
              Visitors in regions with additional privacy requirements may be shown consent or privacy controls provided through Google or another compliant consent management platform.
            </p>
          </div>
        </section>

        <section>
          <span>06</span>
          <div>
            <h2>Third-party services</h2>
            <p>
              Advertising, analytics, security and hosting providers operate under their own privacy policies. Print Prep Lab does not sell uploaded images or calculator inputs, and the image-analysis tool is designed to keep selected image files on the visitor&apos;s device.
            </p>
            <p>
              For more information about Google&apos;s data practices, see Google&apos;s Privacy &amp; Terms pages. For Microsoft Clarity, see Microsoft&apos;s privacy documentation.
            </p>
          </div>
        </section>

        <section>
          <span>07</span>
          <div>
            <h2>Contact and policy updates</h2>
            <p>
              Privacy or site questions can be reported through the Contact page. This policy may be updated when site features, analytics, advertising providers or legal requirements change.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
