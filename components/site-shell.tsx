import Link from "next/link";
import { PrivacySettingsButton } from "@/components/analytics-consent";
import { SourceLocaleSelect } from "@/components/source-locale";

const NAV_ITEMS = [
  { href: "/tools", label: "Tools", ar: "الأدوات" },
  { href: "/jobs", label: "Projects", ar: "المشاريع" },
  { href: "/guides", label: "Resources", ar: "الموارد" },
  { href: "/sizes", label: "Print sizes", ar: "مقاسات الطباعة" },
  { href: "/troubleshoot", label: "Help center", ar: "مركز المساعدة" },
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
          {NAV_ITEMS.map((item) => <Link href={item.href} key={item.href} data-en={item.label} data-ar={item.ar}>{item.label}</Link>)}
        </nav>
        <SourceLocaleSelect />
        <Link className="header-action" href="/tools/print-readiness-checker" data-en="Check a file" data-ar="افحص ملفًا">Check a file</Link>
        <details className="mobile-nav">
          <summary aria-label="Open navigation" data-en="Menu" data-ar="القائمة">Menu</summary>
          <nav aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => <Link href={item.href} key={item.href} data-en={item.label} data-ar={item.ar}>{item.label}</Link>)}
            <Link href="/tools/print-readiness-checker" data-en="Check a file" data-ar="افحص ملفًا">Check a file</Link>
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
          <p data-en="Clear print math for images, paper, crop, bleed and safe areas." data-ar="حسابات واضحة للصور والورق والقص والنزف ومنطقة الأمان.">Clear print math for images, paper, crop, bleed and safe areas.</p>
        </div>
        <div className="footer-links">
          <div><strong data-en="Explore" data-ar="استكشف">Explore</strong><Link href="/tools" data-en="Tools" data-ar="الأدوات">Tools</Link><Link href="/sizes" data-en="Print sizes" data-ar="مقاسات الطباعة">Print sizes</Link><Link href="/guides" data-en="Guides" data-ar="الأدلة">Guides</Link></div>
          <div><strong data-en="Trust" data-ar="الموثوقية">Trust</strong><Link href="/methodology" data-en="Methodology" data-ar="المنهجية">Methodology</Link><Link href="/sources" data-en="Sources" data-ar="المصادر">Sources</Link><Link href="/privacy" data-en="Privacy" data-ar="الخصوصية">Privacy</Link></div>
          <div><strong data-en="Company" data-ar="الشركة">Company</strong><Link href="/about" data-en="About" data-ar="حول الموقع">About</Link><Link href="/editorial-policy" data-en="Editorial policy" data-ar="السياسة التحريرية">Editorial policy</Link><Link href="/contact" data-en="Contact" data-ar="تواصل معنا">Contact</Link><Link href="/terms" data-en="Terms" data-ar="الشروط">Terms</Link></div>
        </div>
      </div>
      <div className="shell footer-bottom"><span>© 2026 Print Prep Lab</span><span data-en="Your image stays on your device." data-ar="صورتك تبقى على جهازك.">Your image stays on your device.</span><PrivacySettingsButton /></div>
    </footer>
  );
}
