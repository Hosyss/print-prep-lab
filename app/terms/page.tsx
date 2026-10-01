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
        <Breadcrumbs items={[{ label: "Home", arLabel: "الرئيسية", href: "/" }, { label: "Terms of Use", arLabel: "شروط الاستخدام" }]} />
      </div>

      <PageHero
        eyebrow="Last updated August 24, 2026"
        arEyebrow="آخر تحديث: 24 أغسطس 2026"
        title="Terms of Use"
        arTitle="شروط الاستخدام"
        description="Important limits and responsibilities when using Print Prep Lab calculators, references and external services."
        arDescription="الحدود والمسؤوليات المهمة عند استخدام حاسبات Print Prep Lab ومراجعه والخدمات الخارجية."
      />

      <article className="policy-layout shell">
        <section>
          <span>01</span>
          <div>
            <h2 data-en="Planning guidance" data-ar="إرشادات التخطيط">Planning guidance</h2>
            <p data-en="Print Prep Lab provides calculation tools and educational references for print planning. Results are not a production guarantee, printer certification or substitute for a physical proof supplied by a print provider." data-ar="يوفر Print Prep Lab أدوات حساب ومراجع تعليمية لتخطيط الطباعة. لا تمثل النتائج ضمانًا للإنتاج أو شهادة من طابعة أو بديلًا عن بروفة فعلية تقدمها جهة الطباعة.">
              Print Prep Lab provides calculation tools and educational references for print planning. Results are not a production guarantee, printer certification or substitute for a physical proof supplied by a print provider.
            </p>
          </div>
        </section>

        <section>
          <span>02</span>
          <div>
            <h2 data-en="Your production responsibility" data-ar="مسؤوليتك عن الإنتاج">Your production responsibility</h2>
            <p data-en="Confirm final dimensions, bleed, safe area, color mode, profile, file format and resolution with the company producing the work. Provider-specific requirements take priority over general examples shown on this site." data-ar="أكد الأبعاد النهائية والنزف ومنطقة الأمان ونمط الألوان وملف التعريف وصيغة الملف والدقة مع الشركة المنفذة. تكون الأولوية لمتطلبات تلك الجهة على الأمثلة العامة المعروضة في الموقع.">
              Confirm final dimensions, bleed, safe area, color mode, profile, file format and resolution with the company producing the work. Provider-specific requirements take priority over general examples shown on this site.
            </p>
          </div>
        </section>

        <section>
          <span>03</span>
          <div>
            <h2 data-en="Reasonable use" data-ar="الاستخدام المعقول">Reasonable use</h2>
            <p data-en="You may use the calculators for personal, educational and commercial print planning. Do not present the site&#x27;s guidance as a guarantee issued by a third-party printer or standards body." data-ar="يمكنك استخدام الحاسبات للتخطيط الشخصي والتعليمي والتجاري للطباعة. لا تقدم إرشادات الموقع بوصفها ضمانًا صادرًا عن مطبعة خارجية أو جهة معايير.">
              You may use the calculators for personal, educational and commercial print planning. Do not present the site&apos;s guidance as a guarantee issued by a third-party printer or standards body.
            </p>
          </div>
        </section>

        <section>
          <span>04</span>
          <div>
            <h2 data-en="Advertising and external services" data-ar="الإعلانات والخدمات الخارجية">Advertising and external services</h2>
            <p data-en="The site may display third-party advertising and link to external resources. Advertising, analytics, hosting and linked third-party services are responsible for their own content, availability, terms and privacy practices." data-ar="قد يعرض الموقع إعلانات خارجية ويربط بمصادر خارجية. تكون خدمات الإعلانات والتحليلات والاستضافة والخدمات الخارجية المرتبطة مسؤولة عن محتواها وتوافرها وشروطها وممارسات الخصوصية الخاصة بها.">
              The site may display third-party advertising and link to external resources. Advertising, analytics, hosting and linked third-party services are responsible for their own content, availability, terms and privacy practices.
            </p>
          </div>
        </section>

        <section>
          <span>05</span>
          <div>
            <h2 data-en="Changes and availability" data-ar="التغييرات والتوافر">Changes and availability</h2>
            <p data-en="Features, calculations and reference material may be corrected or updated when standards, provider guidance or site functionality changes. Print Prep Lab does not guarantee uninterrupted availability of every tool or external service." data-ar="قد تُصحح الميزات والحسابات والمواد المرجعية أو تُحدّث عند تغير المعايير أو إرشادات جهات الطباعة أو وظائف الموقع. لا يضمن Print Prep Lab توافر كل أداة أو خدمة خارجية دون انقطاع.">
              Features, calculations and reference material may be corrected or updated when standards, provider guidance or site functionality changes. Print Prep Lab does not guarantee uninterrupted availability of every tool or external service.
            </p>
          </div>
        </section>
        <section>
          <span>06</span>
          <div>
            <h2 data-en="Corrections and contact" data-ar="التصحيحات والتواصل">Corrections and contact</h2>
            <p data-en="Reproducible calculation errors and missing formats can be reported through the Contact page. A confirmed defect may be corrected across the calculator, related examples and reference pages; the public change history records the updated source." data-ar="يمكن الإبلاغ عن أخطاء الحساب القابلة للتكرار والمقاسات الناقصة عبر صفحة التواصل. قد يُصحح العيب المؤكد في الحاسبة والأمثلة ذات الصلة والصفحات المرجعية؛ ويسجل سجل التغييرات العام الشفرة المحدّثة.">
              Reproducible calculation errors and missing formats can be reported through the Contact page. A confirmed defect may be corrected across the calculator, related examples and reference pages; the public change history records the updated source.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
