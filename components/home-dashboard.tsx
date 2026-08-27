"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

const content = {
  en: {
    sidebarLabel: "Workspace",
    sidebar: [
      ["Home", "/"],
      ["All tools", "/tools"],
      ["Check an image", "/tools/print-readiness-checker"],
      ["Pixels & print size", "/tools/pixels-to-print-size"],
      ["Crop & aspect ratio", "/tools/aspect-ratio-crop-preview"],
      ["Bleed & safe area", "/tools/bleed-safe-area-calculator"],
      ["Size library", "/sizes"],
      ["Print guides", "/guides"],
      ["Methodology", "/methodology"],
    ],
    sidebarPrivacy: "Private by design",
    sidebarPrivacyText: "Images are processed in your browser and are never uploaded.",
    eyebrow: "Your print workspace",
    title: "Print Prep Lab",
    heroText: "Check if an image is actually ready to print—before you pay for ink, paper or production.",
    primary: "Check an image",
    secondary: "Explore all tools",
    local: "Local processing",
    noSignup: "No sign-up",
    popular: "Popular tools",
    popularIntro: "Four fast routes for the print questions people ask most.",
    allTools: "View all 7 tools",
    openTool: "Open tool",
    tools: [
      {
        title: "Print readiness checker",
        text: "Check real pixels, effective PPI, crop and maximum print size.",
        href: "/tools/print-readiness-checker",
        icon: "scan",
        tone: "blue",
      },
      {
        title: "Pixels to print size",
        text: "Convert pixel dimensions to inches or centimetres at any PPI.",
        href: "/tools/pixels-to-print-size",
        icon: "calculator",
        tone: "green",
      },
      {
        title: "Required pixels",
        text: "Calculate exact export dimensions for a physical paper size.",
        href: "/tools/print-size-to-pixels",
        icon: "grid",
        tone: "purple",
      },
      {
        title: "Bleed & safe area",
        text: "Build the correct trim, bleed and protected content area.",
        href: "/tools/bleed-safe-area-calculator",
        icon: "box",
        tone: "orange",
      },
    ],
    facts: [
      ["7", "Focused print tools"],
      ["34", "Useful site pages"],
      ["Local", "Image processing"],
      ["Visible", "Formulas and units"],
    ],
    startLabel: "Start with what you know",
    startTitle: "One clear route for every print question.",
    startText: "Choose the information already in front of you. We will take you to the right calculation without making you learn the terminology first.",
    routes: [
      {
        label: "I have an image",
        title: "Check print readiness",
        text: "Read its real pixels and see maximum print sizes, effective PPI and crop.",
        href: "/tools/print-readiness-checker",
      },
      {
        label: "I know the pixels",
        title: "Find physical size",
        text: "Convert width and height in pixels to inches or centimetres at any PPI.",
        href: "/tools/pixels-to-print-size",
      },
      {
        label: "I know the paper",
        title: "Find required pixels",
        text: "Choose a standard format or enter a custom size and calculate export dimensions.",
        href: "/tools/paper-size-pixels-calculator",
      },
      {
        label: "I need production setup",
        title: "Plan crop and bleed",
        text: "Preview framing, then calculate the full canvas and protected safe area.",
        href: "/tools/aspect-ratio-crop-preview",
      },
    ],
    start: "Start here",
    referenceLabel: "Popular references",
    referenceTitle: "Start with the size you need.",
    referenceText: "Quick, exact dimensions for common ISO, North American and photo formats.",
    viewSizes: "View every size",
    sizes: [
      ["A4", "210 × 297 mm", "2480 × 3508 px", "/sizes/a4"],
      ["A2", "420 × 594 mm", "4961 × 7016 px", "/sizes/a2"],
      ["US Letter", "8.5 × 11 in", "2550 × 3300 px", "/sizes/us-letter"],
      ["US Legal", "8.5 × 14 in", "2550 × 4200 px", "/sizes/us-legal"],
      ["4 × 6", "2:3 photo", "1200 × 1800 px", "/sizes/4x6-photo"],
      ["8 × 10", "4:5 photo", "2400 × 3000 px", "/sizes/8x10-photo"],
    ],
    atPpi: "at 300 PPI",
    guideLabel: "Flagship guide",
    guideTitle: "How large can you print an image without losing quality?",
    guideText: "Start with real pixel dimensions, choose a defensible PPI target and account for the final crop before calculating inches.",
    readGuide: "Read the print-size guide",
    beforeCrop: "Before crop · confirm provider requirements",
    methodLabel: "Methodology before marketing",
    methodTitle: "Print math you can inspect.",
    methodText: "Paper dimensions come from documented standards. Every pixel result states the selected PPI and rounding rule.",
    readMethod: "Read our methodology",
  },
  ar: {
    sidebarLabel: "مساحة العمل",
    sidebar: [
      ["الرئيسية", "/"],
      ["كل الأدوات", "/tools"],
      ["فحص صورة", "/tools/print-readiness-checker"],
      ["البكسل ومقاس الطباعة", "/tools/pixels-to-print-size"],
      ["القص ونسبة الأبعاد", "/tools/aspect-ratio-crop-preview"],
      ["النزف ومنطقة الأمان", "/tools/bleed-safe-area-calculator"],
      ["مكتبة المقاسات", "/sizes"],
      ["أدلة الطباعة", "/guides"],
      ["منهجية الحساب", "/methodology"],
    ],
    sidebarPrivacy: "خصوصية من الأساس",
    sidebarPrivacyText: "تتم معالجة الصور داخل متصفحك ولا ترفع إلى أي خادم.",
    eyebrow: "مساحة تجهيز الطباعة",
    title: "Print Prep Lab",
    heroText: "تأكد أن صورتك جاهزة فعلا للطباعة قبل أن تدفع تكلفة الحبر أو الورق أو الإنتاج.",
    primary: "فحص صورة",
    secondary: "استكشف كل الأدوات",
    local: "معالجة محلية",
    noSignup: "بدون تسجيل",
    popular: "أدوات شائعة",
    popularIntro: "أربع طرق سريعة لأكثر أسئلة الطباعة شيوعا.",
    allTools: "عرض الأدوات السبعة",
    openTool: "فتح الأداة",
    tools: [
      {
        title: "فحص جاهزية الصورة",
        text: "تحقق من البكسلات الفعلية ودقة PPI والقص وأقصى مقاس للطباعة.",
        href: "/tools/print-readiness-checker",
        icon: "scan",
        tone: "blue",
      },
      {
        title: "من البكسل إلى مقاس الطباعة",
        text: "حول أبعاد البكسل إلى بوصة أو سنتيمتر عند أي دقة PPI.",
        href: "/tools/pixels-to-print-size",
        icon: "calculator",
        tone: "green",
      },
      {
        title: "البكسلات المطلوبة",
        text: "احسب أبعاد التصدير الدقيقة لأي مقاس ورق فعلي.",
        href: "/tools/print-size-to-pixels",
        icon: "grid",
        tone: "purple",
      },
      {
        title: "النزف ومنطقة الأمان",
        text: "أنشئ أبعاد القص والنزف ومنطقة المحتوى المحمية بشكل صحيح.",
        href: "/tools/bleed-safe-area-calculator",
        icon: "box",
        tone: "orange",
      },
    ],
    facts: [
      ["7", "أدوات طباعة متخصصة"],
      ["34", "صفحة مفيدة"],
      ["محلية", "معالجة الصور"],
      ["واضحة", "المعادلات والوحدات"],
    ],
    startLabel: "ابدأ بما تعرفه",
    startTitle: "مسار واضح لكل سؤال عن الطباعة.",
    startText: "اختر المعلومات الموجودة أمامك وسنوصلك إلى الحساب الصحيح بدون أن تضطر لتعلم المصطلحات أولا.",
    routes: [
      {
        label: "لدي صورة",
        title: "فحص جاهزية الطباعة",
        text: "اقرأ البكسلات الفعلية واعرف أقصى مقاس للطباعة ودقة PPI والقص.",
        href: "/tools/print-readiness-checker",
      },
      {
        label: "أعرف أبعاد البكسل",
        title: "معرفة المقاس الفعلي",
        text: "حول العرض والارتفاع بالبكسل إلى بوصة أو سنتيمتر عند أي دقة.",
        href: "/tools/pixels-to-print-size",
      },
      {
        label: "أعرف مقاس الورق",
        title: "معرفة البكسلات المطلوبة",
        text: "اختر مقاسا قياسيا أو أدخل مقاسا مخصصا واحسب أبعاد التصدير.",
        href: "/tools/paper-size-pixels-calculator",
      },
      {
        label: "أحتاج تجهيز الإنتاج",
        title: "تخطيط القص والنزف",
        text: "عاين الإطار ثم احسب مساحة العمل الكاملة ومنطقة الأمان.",
        href: "/tools/aspect-ratio-crop-preview",
      },
    ],
    start: "ابدأ هنا",
    referenceLabel: "مقاسات شائعة",
    referenceTitle: "ابدأ بالمقاس الذي تحتاجه.",
    referenceText: "أبعاد دقيقة وسريعة لمقاسات ISO وأمريكا الشمالية والصور الشائعة.",
    viewSizes: "عرض كل المقاسات",
    sizes: [
      ["A4", "210 × 297 mm", "2480 × 3508 px", "/sizes/a4"],
      ["A2", "420 × 594 mm", "4961 × 7016 px", "/sizes/a2"],
      ["US Letter", "8.5 × 11 in", "2550 × 3300 px", "/sizes/us-letter"],
      ["US Legal", "8.5 × 14 in", "2550 × 4200 px", "/sizes/us-legal"],
      ["4 × 6", "صورة 2:3", "1200 × 1800 px", "/sizes/4x6-photo"],
      ["8 × 10", "صورة 4:5", "2400 × 3000 px", "/sizes/8x10-photo"],
    ],
    atPpi: "عند 300 PPI",
    guideLabel: "الدليل الرئيسي",
    guideTitle: "ما أكبر مقاس يمكنك طباعة الصورة به دون فقدان الجودة؟",
    guideText: "ابدأ بأبعاد البكسل الفعلية واختر دقة PPI مناسبة واحسب القص النهائي قبل تحويل المقاس إلى بوصة.",
    readGuide: "قراءة دليل مقاس الطباعة",
    beforeCrop: "قبل القص · راجع متطلبات مزود الطباعة",
    methodLabel: "المنهجية قبل التسويق",
    methodTitle: "حسابات طباعة يمكنك مراجعتها.",
    methodText: "تعتمد مقاسات الورق على معايير موثقة، وتوضح كل نتيجة دقة PPI المختارة وطريقة التقريب.",
    readMethod: "قراءة منهجية الحساب",
  },
} as const;

type ToolIconName = "scan" | "calculator" | "grid" | "box";

function ToolIcon({ name }: { name: ToolIconName }) {
  if (name === "scan") {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 11V6h5M21 6h5v5M26 21v5h-5M11 26H6v-5" /><path d="M10 12h12v9H10zM13 16h6M13 19h4" /></svg>;
  }
  if (name === "calculator") {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="4" width="18" height="24" rx="2" /><path d="M11 8h10v5H11zM11 17h2M16 17h2M21 17h1M11 21h2M16 21h2M21 21h1M11 25h2M16 25h6" /></svg>;
  }
  if (name === "grid") {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1" /><rect x="18" y="5" width="9" height="9" rx="1" /><rect x="5" y="18" width="9" height="9" rx="1" /><rect x="18" y="18" width="9" height="9" rx="1" /></svg>;
  }
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="m16 4 11 6-11 6L5 10l11-6Z" /><path d="m5 10 11 6 11-6v12l-11 6-11-6V10Z" /><path d="M16 16v12" /></svg>;
}

function NavIcon({ index }: { index: number }) {
  const paths = [
    <path key="home" d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4v-8.5Z" />,
    <path key="apps" d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z" />,
    <path key="scan" d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4M9 10h6v5H9z" />,
    <path key="ruler" d="m6 17 11-11 3 3-11 11-3-3ZM11 12l2 2M14 9l2 2" />,
    <path key="crop" d="M7 4v13a2 2 0 0 0 2 2h11M4 7h13a2 2 0 0 1 2 2v11" />,
    <path key="safe" d="M5 5h14v14H5zM9 9h6v6H9z" />,
    <path key="folder" d="M4 8h6l2 2h8v9H4V8Z" />,
    <path key="guide" d="M5 6h6a3 3 0 0 1 3 3v10a3 3 0 0 0-3-3H5V6Zm14 0h-2a3 3 0 0 0-3 3v10a3 3 0 0 1 3-3h2V6Z" />,
    <path key="method" d="M6 18h12M7 14l3-3 3 2 4-5M17 8h-3" />,
  ];
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[index]}</svg>;
}

function Arrow() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" /></svg>;
}

function BlueprintArt() {
  return (
    <svg className="blueprint-art" viewBox="0 0 560 360" aria-hidden="true">
      <defs>
        <linearGradient id="sheetFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2078db" stopOpacity=".34" />
          <stop offset="1" stopColor="#42c8ee" stopOpacity=".05" />
        </linearGradient>
      </defs>
      <g fill="url(#sheetFill)" stroke="currentColor">
        <path d="m114 177 240-92 104 163-240 84-104-155Z" opacity=".34" />
        <path d="m92 150 240-92 104 163-240 84L92 150Z" opacity=".62" />
        <path d="m70 123 240-92 104 163-240 84L70 123Z" />
      </g>
      <path d="m100 132 199-74 84 128-199 72-84-126Z" fill="none" stroke="currentColor" strokeDasharray="8 8" opacity=".72" />
      <path d="m133 145 149-55M153 177l149-55M174 210l149-55" fill="none" stroke="currentColor" opacity=".35" />
      <path d="M98 108v25H73M305 20v27h26M421 191h-26v25M181 287v-25h-26" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="246" cy="157" r="34" fill="none" stroke="currentColor" opacity=".46" />
      <path d="M246 116v82M205 157h82" fill="none" stroke="currentColor" opacity=".3" />
    </svg>
  );
}

export function HomeDashboard() {
  const { language, direction } = useLanguage();
  const t = content[language];

  return (
    <main className="dashboard-page" dir={direction}>
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar" aria-label={t.sidebarLabel}>
          <div className="sidebar-label">{t.sidebarLabel}</div>
          <nav>
            {t.sidebar.map(([label, href], index) => (
              <Link className={index === 0 ? "active" : ""} href={href} key={href}>
                <NavIcon index={index} /><span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="sidebar-privacy">
            <span aria-hidden="true">✓</span>
            <div><strong>{t.sidebarPrivacy}</strong><p>{t.sidebarPrivacyText}</p></div>
          </div>
        </aside>

        <div className="dashboard-main">
          <section className="dashboard-hero">
            <div className="dashboard-hero-copy">
              <span className="dashboard-eyebrow">{t.eyebrow}</span>
              <h1>{t.title}</h1>
              <p>{t.heroText}</p>
              <div className="dashboard-hero-actions">
                <Link className="dashboard-button primary" href="/tools/print-readiness-checker">{t.primary}<Arrow /></Link>
                <Link className="dashboard-button secondary" href="/tools">{t.secondary}<ToolIcon name="grid" /></Link>
              </div>
              <div className="dashboard-trust"><span>✓ {t.local}</span><span>✓ {t.noSignup}</span></div>
            </div>
            <div className="dashboard-hero-art"><BlueprintArt /></div>
          </section>

          <section className="dashboard-panel popular-panel">
            <div className="dashboard-section-heading">
              <div><span>{t.popular}</span><p>{t.popularIntro}</p></div>
              <Link href="/tools">{t.allTools}<Arrow /></Link>
            </div>
            <div className="popular-tool-grid">
              {t.tools.map((tool) => (
                <Link className={`popular-tool-card ${tool.tone}`} href={tool.href} key={tool.href}>
                  <span className="popular-tool-icon"><ToolIcon name={tool.icon} /></span>
                  <div><h2>{tool.title}</h2><p>{tool.text}</p></div>
                  <strong>{t.openTool}<Arrow /></strong>
                </Link>
              ))}
            </div>
            <div className="dashboard-facts">
              {t.facts.map(([value, label], index) => (
                <div key={label}><span className={`fact-icon fact-icon-${index + 1}`} aria-hidden="true"><ToolIcon name={index === 0 ? "grid" : index === 1 ? "box" : index === 2 ? "scan" : "calculator"} /></span><strong>{value}</strong><small>{label}</small></div>
              ))}
            </div>
          </section>

          <section className="dashboard-content-section">
            <div className="dashboard-content-heading">
              <div><span>{t.startLabel}</span><h2>{t.startTitle}</h2></div>
              <p>{t.startText}</p>
            </div>
            <div className="dashboard-route-grid">
              {t.routes.map((route, index) => (
                <Link href={route.href} key={route.href}>
                  <span>0{index + 1}</span><small>{route.label}</small><h3>{route.title}</h3><p>{route.text}</p><strong>{t.start}<Arrow /></strong>
                </Link>
              ))}
            </div>
          </section>

          <section className="dashboard-content-section dashboard-sizes-section">
            <div className="dashboard-content-heading">
              <div><span>{t.referenceLabel}</span><h2>{t.referenceTitle}</h2></div>
              <div className="heading-side"><p>{t.referenceText}</p><Link href="/sizes">{t.viewSizes}<Arrow /></Link></div>
            </div>
            <div className="dashboard-size-grid">
              {t.sizes.map(([name, measure, pixels, href]) => (
                <Link href={href} key={href}>
                  <span className="dashboard-paper"><b>{name}</b></span>
                  <div><h3>{name}</h3><p>{measure}</p><strong>{pixels}</strong><small>{t.atPpi}</small></div>
                  <Arrow />
                </Link>
              ))}
            </div>
          </section>

          <section className="dashboard-guide">
            <div>
              <span>{t.guideLabel}</span>
              <h2>{t.guideTitle}</h2>
              <p>{t.guideText}</p>
              <Link className="dashboard-button primary" href="/guides/how-large-can-i-print-my-image">{t.readGuide}<Arrow /></Link>
            </div>
            <aside>
              <strong>6000 × 4000 px</strong>
              <p>20 × 13.33 in <span>@ 300 PPI</span></p>
              <p>25 × 16.67 in <span>@ 240 PPI</span></p>
              <p>40 × 26.67 in <span>@ 150 PPI</span></p>
              <small>{t.beforeCrop}</small>
            </aside>
          </section>

          <section className="dashboard-method">
            <div><span>{t.methodLabel}</span><h2>{t.methodTitle}</h2></div>
            <p>{t.methodText}</p>
            <Link href="/methodology">{t.readMethod}<Arrow /></Link>
          </section>
        </div>
      </div>
    </main>
  );
}
