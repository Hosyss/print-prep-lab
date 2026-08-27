"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PrivacySettingsButton } from "@/components/analytics-consent";
import { useLanguage } from "@/components/language-provider";

const copy = {
  en: {
    home: "Home",
    tools: "Tools",
    sizes: "Print sizes",
    guides: "Guides",
    methodology: "Methodology",
    check: "Check an image",
    open: "Open navigation",
    close: "Close navigation",
    nav: "Main navigation",
    language: "Switch to Arabic",
    languageLabel: "العربية",
    tagline: "Clear print math for images, paper, crop, bleed and safe areas.",
    explore: "Explore",
    trust: "Trust",
    company: "Company",
    sources: "Sources",
    privacy: "Privacy",
    about: "About",
    editorial: "Editorial policy",
    contact: "Contact",
    terms: "Terms",
    device: "Your image stays on your device.",
  },
  ar: {
    home: "الرئيسية",
    tools: "الأدوات",
    sizes: "مقاسات الطباعة",
    guides: "الأدلة",
    methodology: "منهجية الحساب",
    check: "فحص صورة",
    open: "فتح قائمة التنقل",
    close: "إغلاق قائمة التنقل",
    nav: "التنقل الرئيسي",
    language: "التبديل إلى الإنجليزية",
    languageLabel: "English",
    tagline: "حسابات طباعة واضحة للصور والورق والقص والنزف ومنطقة الأمان.",
    explore: "استكشف",
    trust: "الثقة",
    company: "الموقع",
    sources: "المصادر",
    privacy: "الخصوصية",
    about: "من نحن",
    editorial: "سياسة التحرير",
    contact: "تواصل معنا",
    terms: "الشروط",
    device: "تظل صورتك على جهازك.",
  },
} as const;

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>;
}

function MenuIcon({ close = false }: { close?: boolean }) {
  return close ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
  );
}

function GlobeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z" /></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" /></svg>;
}

export function SiteHeader() {
  const { language, direction, toggleLanguage } = useLanguage();
  const t = copy[language];
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navItems = [
    { href: "/tools", label: t.tools },
    { href: "/sizes", label: t.sizes },
    { href: "/guides", label: t.guides },
    { href: "/methodology", label: t.methodology },
  ];

  return (
    <header className="site-header dashboard-header" dir={direction}>
      <div className="shell header-inner">
        <div className="header-leading">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label={menuOpen ? t.close : t.open}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon close={menuOpen} />
          </button>
          <Link className="brand" href="/" aria-label="Print Prep Lab home" onClick={() => setMenuOpen(false)}>
            <BrandMark />
            <span>Print Prep Lab</span>
          </Link>
        </div>

        <nav className="main-nav" aria-label={t.nav}>
          {navItems.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>

        <div className="header-actions">
          <button type="button" className="language-switch" onClick={toggleLanguage} aria-label={t.language}>
            <GlobeIcon /><span>{t.languageLabel}</span>
          </button>
          <Link className="header-action" href="/tools/print-readiness-checker">
            <span>{t.check}</span><ArrowIcon />
          </Link>
        </div>
      </div>

      {menuOpen && <button className="mobile-nav-backdrop" aria-label={t.close} onClick={() => setMenuOpen(false)} />}
      <nav id="mobile-navigation" className={`mobile-navigation${menuOpen ? " open" : ""}`} aria-label={t.nav}>
        <Link href="/" onClick={() => setMenuOpen(false)}>{t.home}</Link>
        {navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>)}
        <Link className="mobile-check-link" href="/tools/print-readiness-checker" onClick={() => setMenuOpen(false)}>{t.check}<ArrowIcon /></Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const { language, direction } = useLanguage();
  const t = copy[language];

  return (
    <footer className="site-footer" dir={direction}>
      <div className="shell footer-grid">
        <div>
          <div className="brand footer-brand"><BrandMark /><span>Print Prep Lab</span></div>
          <p>{t.tagline}</p>
        </div>
        <div className="footer-links">
          <div><strong>{t.explore}</strong><Link href="/tools">{t.tools}</Link><Link href="/sizes">{t.sizes}</Link><Link href="/guides">{t.guides}</Link></div>
          <div><strong>{t.trust}</strong><Link href="/methodology">{t.methodology}</Link><Link href="/sources">{t.sources}</Link><Link href="/privacy">{t.privacy}</Link></div>
          <div><strong>{t.company}</strong><Link href="/about">{t.about}</Link><Link href="/editorial-policy">{t.editorial}</Link><Link href="/contact">{t.contact}</Link><Link href="/terms">{t.terms}</Link></div>
        </div>
      </div>
      <div className="shell footer-bottom"><span>© 2026 Print Prep Lab</span><span>{t.device}</span><PrivacySettingsButton /></div>
    </footer>
  );
}
