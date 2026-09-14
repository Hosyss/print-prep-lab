import Link from "next/link";
import { PrivacySettingsButton } from "@/components/analytics-consent";

const NAV_ITEMS = [
  { href: "/tools", label: "Tools" },
  { href: "/jobs", label: "Projects" },
  { href: "/guides", label: "Resources" },
  { href: "/sizes", label: "Print sizes" },
  { href: "/troubleshoot", label: "Help center" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="Print Prep Lab home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>Print Prep <b>Lab</b></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <Link className="header-action" href="/tools/print-readiness-checker">Check a file</Link>
        <details className="mobile-nav">
          <summary aria-label="Open navigation">Menu</summary>
          <nav aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
            <Link href="/tools/print-readiness-checker">Check a file</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <div className="brand footer-brand">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
            <span>Print Prep <b>Lab</b></span>
          </div>
          <p>Clear print math for images, paper, crop, bleed and safe areas.</p>
        </div>
        <div className="footer-links">
          <div><strong>Explore</strong><Link href="/tools">Tools</Link><Link href="/sizes">Print sizes</Link><Link href="/guides">Guides</Link></div>
          <div><strong>Trust</strong><Link href="/methodology">Methodology</Link><Link href="/sources">Sources</Link><Link href="/privacy">Privacy</Link></div>
          <div><strong>Company</strong><Link href="/about">About</Link><Link href="/editorial-policy">Editorial policy</Link><Link href="/contact">Contact</Link><Link href="/terms">Terms</Link></div>
        </div>
      </div>
      <div className="shell footer-bottom"><span>© 2026 Print Prep Lab</span><span>Your image stays on your device.</span><PrivacySettingsButton /></div>
    </footer>
  );
}
