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
        eyebrow="Last updated August 24, 2026"
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
            <p>
              The site stores an analytics consent preference in local browser storage so it can remember whether Microsoft Clarity may load. The current tools do not create user accounts, save projects or maintain a server-side image library.
            </p>
          </div>
        </section>

        <section>
          <span>03</span>
          <div>
            <h2>Analytics and diagnostics</h2>
            <p>
              Print Prep Lab uses Microsoft Clarity only after a visitor allows analytics through the on-page privacy choice. Clarity may process browser, device, approximate location and masked interaction data according to Microsoft&apos;s privacy terms.
            </p>
            <p>
              Analytics data is used to identify broken interactions and understand which tools and explanations are useful. Selected image previews and calculator text fields are not intentionally sent to Clarity, and sensitive page content is configured to be masked where the service supports it.
            </p>
          </div>
        </section>

        <section>
          <span>04</span>
          <div>
            <h2>Google AdSense and advertising cookies</h2>
            <p>
              Print Prep Lab uses the Google AdSense site code for publisher verification and may use it to display advertising after approval. Third-party vendors, including Google, may use cookies or similar technologies to serve and measure ads based on a visitor&apos;s activity on this website or other websites.
            </p>
            <p>
              Google&apos;s use of advertising cookies enables Google and its partners to serve ads based on visits to Print Prep Lab and/or other sites on the Internet. Visitors can manage or opt out of personalized advertising through Google Ads Settings.
            </p>
            <p>
              <a href="https://adssettings.google.com/" target="_blank" rel="noreferrer" className="text-link">
                Manage Google ad settings →
              </a>
            </p>
            <p>
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer" className="text-link">
                How Google uses information from partner sites →
              </a>
            </p>
          </div>
        </section>

        <section>
          <span>05</span>
          <div>
            <h2>Consent where required</h2>
            <p>
              Where applicable law or Google policy requires consent for advertising cookies, local storage or personalized advertising, the site will use the relevant Google consent controls or another compliant consent mechanism before those purposes are enabled.
            </p>
            <p>
              Visitors in regions with additional privacy requirements may be shown consent or privacy controls provided through Google or another compliant consent management platform.
            </p>
          </div>
        </section>

        <section>
          <span>06</span>
          <div>
            <h2>Hosting, security and request logs</h2>
            <p>
              Cloudflare hosts and secures the site. Like most web hosts, it may process request information such as IP address, browser, requested URL, timestamps and security signals to deliver pages, prevent abuse and diagnose failures under its own privacy terms.
            </p>
            <p>
              Advertising, analytics, security and hosting providers operate under their own privacy policies. Print Prep Lab does not sell selected images or calculator inputs, and the image-analysis tools are designed to keep selected image files on the visitor&apos;s device.
            </p>
          </div>
        </section>

        <section>
          <span>07</span>
          <div>
            <h2>External links</h2>
            <p>
              Guides link to standards bodies, software documentation and the public project tracker. Following an external link sends a request to that provider, whose privacy policy governs its site. Print Prep Lab does not control external content or retention.
            </p>
          </div>
        </section>

        <section>
          <span>08</span>
          <div>
            <h2>Your choices</h2>
            <p>
              Use the Analytics choices link in the footer to allow, decline or withdraw Clarity consent. Browser settings can clear local storage and manage cookies. Google ad-personalization controls are available through the links above and through any consent message shown for the visitor&apos;s region.
            </p>
          </div>
        </section>

        <section>
          <span>09</span>
          <div>
            <h2>Contact and policy updates</h2>
            <p>
              Privacy or site questions can be sent through the public channel described on the Contact page; do not place private information in a public issue. This policy may be updated when site features, analytics, advertising providers or legal requirements change. Material revisions receive a new last-updated date.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
