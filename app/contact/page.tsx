import type { Metadata } from "next";
import { Breadcrumbs, PageHero } from "@/components/content-shell";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Report a calculation issue, missing print size, source conflict or site problem to Print Prep Lab through a reproducible public workflow.",
  path: "/contact",
});

const issueUrl =
  "https://github.com/Hosyss/print-prep-lab/issues/new?template=calculation-report.md";

export default function ContactPage() {
  return (
    <main>
      <div className="shell">
        <Breadcrumbs items={[{ label: "Home", arLabel: "الرئيسية", href: "/" }, { label: "Contact", arLabel: "التواصل" }]} />
      </div>

      <PageHero
        eyebrow="Print Prep Lab"
        title="Contact & Calculation Reports"
        arTitle="التواصل وبلاغات الحساب"
        description="Found a result that looks wrong, a missing print format, a source conflict or a site problem? Send a reproducible report through the public project tracker."
        arDescription="هل وجدت نتيجة تبدو خاطئة أو مقاس طباعة ناقصًا أو تعارضًا في المصادر أو مشكلة بالموقع؟ أرسل بلاغًا يمكن إعادة إنتاجه عبر سجل المشروع العام."
      />

      <article className="policy-layout shell">
        <section>
          <span>01</span>
          <div>
            <h2 data-en="How to contact the project" data-ar="كيفية التواصل مع المشروع">How to contact the project</h2>
            <p data-en="Print Prep Lab is published and maintained by Hossam Eldeen. Calculation bug reports, missing-size requests, source corrections and site feedback are accepted through the project&#x27;s public GitHub Issues tracker so the report and any correction can be inspected later." data-ar="ينشر حسام الدين Print Prep Lab ويديره. تُستقبل بلاغات الأخطاء الحسابية وطلبات المقاسات الناقصة وتصحيحات المصادر وملاحظات الموقع عبر سجل GitHub Issues العام للمشروع، حتى يمكن فحص البلاغ وأي تصحيح لاحقًا.">
              Print Prep Lab is published and maintained by Hossam Eldeen. Calculation bug reports, missing-size requests, source corrections and site feedback are accepted through the project&apos;s public GitHub Issues tracker so the report and any correction can be inspected later.
            </p>
            <p>
              <a href={issueUrl} target="_blank" rel="noreferrer" className="text-link" data-en="Open a new calculation or site report →" data-ar="افتح بلاغًا جديدًا عن حساب أو مشكلة بالموقع">
                Open a new calculation or site report →
              </a>
            </p>
          </div>
        </section>

        <section>
          <span>02</span>
          <div>
            <h2 data-en="What to include" data-ar="ما الذي يتضمنه البلاغ">What to include</h2>
            <p data-en="Include the page used, image pixel width and height, physical print size and unit, target PPI, orientation, bleed or safe-margin values, the result shown and the result you expected. Those inputs are normally enough to reproduce the arithmetic without the original image." data-ar="اذكر الصفحة المستخدمة وعرض الصورة وارتفاعها بالبكسل ومقاس الطباعة الفعلي ووحدته وPPI المستهدف والاتجاه وقيم النزف أو هامش الأمان والنتيجة المعروضة والمتوقعة. تكفي هذه المدخلات عادة لتكرار الحساب دون الصورة الأصلية.">
              Include the page used, image pixel width and height, physical print size and unit, target PPI, orientation, bleed or safe-margin values, the result shown and the result you expected. Those inputs are normally enough to reproduce the arithmetic without the original image.
            </p>
            <p data-en="If a printer&#x27;s written specification conflicts with a general planning value on the site, include the exact requirement and, when possible, a public link to the provider&#x27;s specification. Provider-specific rules are not silently treated as universal standards." data-ar="إذا تعارضت مواصفات المطبعة المكتوبة مع قيمة تخطيط عامة في الموقع، أرفق المتطلب الدقيق ورابطًا عامًا للمواصفات إن أمكن. لا تُعامل قواعد جهة طباعة معينة بوصفها معايير عامة دون توضيح.">
              If a printer&apos;s written specification conflicts with a general planning value on the site, include the exact requirement and, when possible, a public link to the provider&apos;s specification. Provider-specific rules are not silently treated as universal standards.
            </p>
          </div>
        </section>

        <section>
          <span>03</span>
          <div>
            <h2 data-en="Protect private information" data-ar="حماية المعلومات الخاصة">Protect private information</h2>
            <p data-en="Do not post passwords, payment details, private documents, customer records or confidential images in a public issue. A written summary of the numerical inputs is enough for most calculation reports." data-ar="لا تنشر كلمات مرور أو بيانات دفع أو مستندات خاصة أو سجلات عملاء أو صورًا سرية في بلاغ عام. يكفي ملخص مكتوب للمدخلات الرقمية في معظم بلاغات الحساب.">
              Do not post passwords, payment details, private documents, customer records or confidential images in a public issue. A written summary of the numerical inputs is enough for most calculation reports.
            </p>
            <p data-en="The print-readiness tool processes selected images locally in the browser; you do not need to upload the original image to report a calculation discrepancy." data-ar="تعالج أداة جاهزية الطباعة الصور المختارة محليًا في المتصفح؛ ولا تحتاج إلى رفع الصورة الأصلية للإبلاغ عن اختلاف حسابي.">
              The print-readiness tool processes selected images locally in the browser; you do not need to upload the original image to report a calculation discrepancy.
            </p>
          </div>
        </section>

        <section>
          <span>04</span>
          <div>
            <h2 data-en="Reproducible report template" data-ar="نموذج بلاغ يمكن إعادة إنتاجه">Reproducible report template</h2>
            <div className="report-template">
              <code data-en={"Page used:\nImage pixels: width × height\nPrint size and unit:\nTarget PPI:\nOrientation:\nBleed / safe margin:\nExpected result:\nDisplayed result:\nProvider specification link (if relevant):"} data-ar={"الصفحة المستخدمة:\nأبعاد الصورة بالبكسل: العرض × الارتفاع\nمقاس الطباعة والوحدة:\nPPI المستهدف:\nالاتجاه:\nالنزف / هامش الأمان:\nالنتيجة المتوقعة:\nالنتيجة المعروضة:\nرابط مواصفات جهة الطباعة (إن وجد):"}>
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
            <h2 data-en="What happens when a calculation report is valid" data-ar="ما يحدث عند تأكيد بلاغ حسابي">What happens when a calculation report is valid</h2>
            <p data-en="The reported inputs are reproduced against the shared calculation functions. If the arithmetic is wrong, the defect should first be represented by a failing deterministic test; the shared function is then corrected so every page using that calculation receives the same fix rather than patching one displayed example." data-ar="تُعاد المدخلات الواردة في البلاغ باستخدام دوال الحساب المشتركة. إذا كان الحساب خاطئًا، ينبغي إثبات العيب أولًا باختبار حتمي يفشل، ثم تصحيح الدالة المشتركة حتى تحصل كل صفحة تستخدمها على الإصلاح نفسه بدل تصحيح مثال واحد فقط.">
              The reported inputs are reproduced against the shared calculation functions. If the arithmetic is wrong, the defect should first be represented by a failing deterministic test; the shared function is then corrected so every page using that calculation receives the same fix rather than patching one displayed example.
            </p>
            <p data-en="If the arithmetic is correct but the explanation is misleading, the wording, assumptions or example is corrected instead. A substantive change should update the affected review metadata rather than presenting an old page as newly checked without evidence." data-ar="إذا كان الحساب صحيحًا لكن الشرح مضللًا، تُصحح الصياغة أو الافتراضات أو المثال. ينبغي أن يحدّث التغيير الجوهري بيانات المراجعة المتأثرة، بدل عرض صفحة قديمة بوصفها فُحصت حديثًا دون دليل.">
              If the arithmetic is correct but the explanation is misleading, the wording, assumptions or example is corrected instead. A substantive change should update the affected review metadata rather than presenting an old page as newly checked without evidence.
            </p>
          </div>
        </section>

        <section data-content-value="verifiable-contact-records">
          <span>06</span>
          <div>
            <h2 data-en="Public source and publisher profile" data-ar="الشفرة العامة وحساب الناشر">Public source and publisher profile</h2>
            <p data-en="The repository contains the report template, shared calculation module and regression tests used by the project. These records make the contact route useful for verifiable corrections rather than a generic feedback form." data-ar="يضم المستودع نموذج البلاغ ووحدة الحساب المشتركة واختبارات عدم التراجع المستخدمة في المشروع. تجعل هذه السجلات قناة التواصل مفيدة لتصحيحات يمكن التحقق منها بدل نموذج ملاحظات عام.">
              The repository contains the report template, shared calculation module and regression tests used by the project. These records make the contact route useful for verifiable corrections rather than a generic feedback form.
            </p>
            <div className="source-links">
              <a href="https://github.com/Hosyss/print-prep-lab/blob/main/.github/ISSUE_TEMPLATE/calculation-report.md" target="_blank" rel="noreferrer"><strong data-en="Calculation report template" data-ar="نموذج البلاغ الحسابي">Calculation report template</strong><small data-en="See the exact fields requested for a reproducible report." data-ar="اطلع على الحقول المطلوبة لبلاغ يمكن إعادة إنتاجه.">See the exact fields requested for a reproducible report.</small><b>↗</b></a>
              <a href="https://github.com/Hosyss/print-prep-lab/blob/main/lib/print-math.ts" target="_blank" rel="noreferrer"><strong data-en="Shared calculation implementation" data-ar="تنفيذ الحسابات المشتركة">Shared calculation implementation</strong><small data-en="Inspect the unit conversion, PPI, crop and bleed functions." data-ar="افحص دوال تحويل الوحدات وPPI والقص والنزف.">Inspect the unit conversion, PPI, crop and bleed functions.</small><b>↗</b></a>
              <a href="https://github.com/Hosyss/print-prep-lab/blob/main/tests/print-math.test.mjs" target="_blank" rel="noreferrer"><strong data-en="Math regression tests" data-ar="اختبارات عدم تراجع الحسابات">Math regression tests</strong><small data-en="Inspect known examples, boundaries and invalid-input checks." data-ar="افحص الأمثلة المعروفة والحالات الحدودية والمدخلات غير الصالحة.">Inspect known examples, boundaries and invalid-input checks.</small><b>↗</b></a>
              <a href="https://github.com/Hosyss" target="_blank" rel="noreferrer"><strong data-en="Publisher profile" data-ar="حساب الناشر">Publisher profile</strong><small data-en="Public account responsible for the repository and project history." data-ar="الحساب العام المسؤول عن المستودع وسجل المشروع.">Public account responsible for the repository and project history.</small><b>↗</b></a>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
