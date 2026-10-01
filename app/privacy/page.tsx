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
        <Breadcrumbs items={[{ label: "Home", arLabel: "الرئيسية", href: "/" }, { label: "Privacy Policy", arLabel: "سياسة الخصوصية" }]} />
      </div>

      <PageHero
        eyebrow="Last updated August 24, 2026"
        arEyebrow="آخر تحديث: 24 أغسطس 2026"
        title="Privacy Policy"
        arTitle="سياسة الخصوصية"
        description="How Print Prep Lab handles images, calculator inputs, analytics, cookies and advertising services."
        arDescription="كيف يتعامل Print Prep Lab مع الصور ومدخلات الحاسبات والتحليلات وملفات تعريف الارتباط وخدمات الإعلانات."
      />

      <article className="policy-layout shell">
        <section>
          <span>01</span>
          <div>
            <h2 data-en="Image processing" data-ar="معالجة الصور">Image processing</h2>
            <p data-en="The print-readiness checker reads image dimensions and generates its preview locally in your browser. The selected image is not intentionally uploaded to a Print Prep Lab server." data-ar="يقرأ فاحص جاهزية الطباعة أبعاد الصورة وينشئ معاينتها محليًا في متصفحك. لا تُرفع الصورة المختارة عمدًا إلى خادم Print Prep Lab.">
              The print-readiness checker reads image dimensions and generates its preview locally in your browser. The selected image is not intentionally uploaded to a Print Prep Lab server.
            </p>
            <p data-en="Closing or replacing the image releases its temporary browser preview. Print Prep Lab does not provide an account-based image library." data-ar="يؤدي إغلاق الصورة أو استبدالها إلى تحرير معاينتها المؤقتة في المتصفح. لا يوفر Print Prep Lab مكتبة صور مرتبطة بحساب مستخدم.">
              Closing or replacing the image releases its temporary browser preview. Print Prep Lab does not provide an account-based image library.
            </p>
          </div>
        </section>

        <section>
          <span>02</span>
          <div>
            <h2 data-en="Calculator inputs" data-ar="مدخلات الحاسبات">Calculator inputs</h2>
            <p data-en="Pixel counts, physical sizes, PPI, orientation, bleed and safe-margin values are used in the browser session to calculate results. No confidential information is required to use the calculators." data-ar="تُستخدم أعداد البكسلات والمقاسات الفعلية وPPI والاتجاه والنزف وهوامش الأمان في جلسة المتصفح لحساب النتائج. لا تحتاج إلى معلومات سرية لاستخدام الحاسبات.">
              Pixel counts, physical sizes, PPI, orientation, bleed and safe-margin values are used in the browser session to calculate results. No confidential information is required to use the calculators.
            </p>
            <p data-en="The site stores an analytics consent preference in local browser storage so it can remember whether Microsoft Clarity may load. The site does not create user accounts or maintain a server-side image library. Professional workspace features may save job records and settings in this browser’s local storage until you clear or export them." data-ar="يحفظ الموقع تفضيل الموافقة على التحليلات في تخزين المتصفح المحلي لتذكر ما إذا كان مسموحًا بتحميل Microsoft Clarity. لا ينشئ الموقع حسابات مستخدمين أو مكتبة صور على الخادم. وقد تحفظ ميزات مساحة العمل المهنية سجلات المهام والإعدادات في التخزين المحلي لهذا المتصفح حتى تمسحها أو تصدرها.">
              The site stores an analytics consent preference in local browser storage so it can remember whether Microsoft Clarity may load. The site does not create user accounts or maintain a server-side image library. Professional workspace features may save job records and settings in this browser’s local storage until you clear or export them.
            </p>
          </div>
        </section>

        <section>
          <span>03</span>
          <div>
            <h2 data-en="Analytics and diagnostics" data-ar="التحليلات وتشخيص المشكلات">Analytics and diagnostics</h2>
            <p data-en="Print Prep Lab uses Microsoft Clarity only after a visitor allows analytics through the on-page privacy choice. Clarity may process browser, device, approximate location and masked interaction data according to Microsoft&#x27;s privacy terms." data-ar="يستخدم Print Prep Lab خدمة Microsoft Clarity فقط بعد سماح الزائر بالتحليلات عبر خيار الخصوصية في الصفحة. قد تعالج Clarity بيانات المتصفح والجهاز والموقع التقريبي والتفاعلات المحجوبة وفق شروط خصوصية Microsoft.">
              Print Prep Lab uses Microsoft Clarity only after a visitor allows analytics through the on-page privacy choice. Clarity may process browser, device, approximate location and masked interaction data according to Microsoft&apos;s privacy terms.
            </p>
            <p data-en="Analytics data is used to identify broken interactions and understand which tools and explanations are useful. Selected image previews and calculator text fields are not intentionally sent to Clarity, and sensitive page content is configured to be masked where the service supports it." data-ar="تُستخدم بيانات التحليلات لتحديد التفاعلات المعطلة وفهم الأدوات والشروح المفيدة. لا تُرسل معاينات الصور المختارة وحقول نص الحاسبات عمدًا إلى Clarity، ويُضبط المحتوى الحساس لإخفائه حيث تدعم الخدمة ذلك.">
              Analytics data is used to identify broken interactions and understand which tools and explanations are useful. Selected image previews and calculator text fields are not intentionally sent to Clarity, and sensitive page content is configured to be masked where the service supports it.
            </p>
          </div>
        </section>

        <section>
          <span>04</span>
          <div>
            <h2 data-en="Google AdSense and advertising cookies" data-ar="Google AdSense وملفات تعريف الارتباط الإعلانية">Google AdSense and advertising cookies</h2>
            <p data-en="Print Prep Lab uses the Google AdSense site code for publisher verification and may use it to display advertising after approval. Third-party vendors, including Google, may use cookies or similar technologies to serve and measure ads based on a visitor&#x27;s activity on this website or other websites." data-ar="يستخدم Print Prep Lab شفرة Google AdSense للتحقق من الناشر، وقد يستخدمها لعرض الإعلانات بعد الموافقة. قد يستخدم مزودون خارجيون، منهم Google، ملفات تعريف الارتباط أو تقنيات مماثلة لعرض الإعلانات وقياسها بناءً على نشاط الزائر في هذا الموقع أو مواقع أخرى.">
              Print Prep Lab uses the Google AdSense site code for publisher verification and may use it to display advertising after approval. Third-party vendors, including Google, may use cookies or similar technologies to serve and measure ads based on a visitor&apos;s activity on this website or other websites.
            </p>
            <p data-en="Google&#x27;s use of advertising cookies enables Google and its partners to serve ads based on visits to Print Prep Lab and/or other sites on the Internet. Visitors can manage or opt out of personalized advertising through Google Ads Settings." data-ar="يتيح استخدام Google لملفات تعريف الارتباط الإعلانية لها ولشركائها عرض إعلانات بناءً على زيارات Print Prep Lab أو مواقع أخرى على الإنترنت. يمكن للزائر إدارة الإعلانات المخصصة أو إيقافها عبر إعدادات إعلانات Google.">
              Google&apos;s use of advertising cookies enables Google and its partners to serve ads based on visits to Print Prep Lab and/or other sites on the Internet. Visitors can manage or opt out of personalized advertising through Google Ads Settings.
            </p>
            <p>
              <a href="https://adssettings.google.com/" target="_blank" rel="noreferrer" className="text-link" data-en="Manage Google ad settings →" data-ar="إدارة إعدادات إعلانات Google">
                Manage Google ad settings →
              </a>
            </p>
            <p>
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer" className="text-link" data-en="How Google uses information from partner sites →" data-ar="كيف تستخدم Google معلومات المواقع الشريكة">
                How Google uses information from partner sites →
              </a>
            </p>
          </div>
        </section>

        <section>
          <span>05</span>
          <div>
            <h2 data-en="Consent where required" data-ar="الموافقة حيث تُطلب">Consent where required</h2>
            <p data-en="Where applicable law or Google policy requires consent for advertising cookies, local storage or personalized advertising, the site will use the relevant Google consent controls or another compliant consent mechanism before those purposes are enabled." data-ar="حيث يشترط القانون المعمول به أو سياسة Google الموافقة على ملفات تعريف الارتباط الإعلانية أو التخزين المحلي أو الإعلانات المخصصة، سيستخدم الموقع أدوات الموافقة المناسبة من Google أو آلية موافقة أخرى متوافقة قبل تفعيل هذه الأغراض.">
              Where applicable law or Google policy requires consent for advertising cookies, local storage or personalized advertising, the site will use the relevant Google consent controls or another compliant consent mechanism before those purposes are enabled.
            </p>
            <p data-en="Visitors in regions with additional privacy requirements may be shown consent or privacy controls provided through Google or another compliant consent management platform." data-ar="قد تظهر للزائر في المناطق ذات متطلبات الخصوصية الإضافية أدوات موافقة أو خصوصية تقدمها Google أو منصة أخرى متوافقة لإدارة الموافقة.">
              Visitors in regions with additional privacy requirements may be shown consent or privacy controls provided through Google or another compliant consent management platform.
            </p>
          </div>
        </section>

        <section>
          <span>06</span>
          <div>
            <h2 data-en="Hosting, security and request logs" data-ar="الاستضافة والأمان وسجلات الطلبات">Hosting, security and request logs</h2>
            <p data-en="Cloudflare hosts and secures the site. Like most web hosts, it may process request information such as IP address, browser, requested URL, timestamps and security signals to deliver pages, prevent abuse and diagnose failures under its own privacy terms." data-ar="تستضيف Cloudflare الموقع وتؤمّنه. وكمعظم مزودي الاستضافة، قد تعالج معلومات الطلبات مثل عنوان IP والمتصفح والرابط المطلوب والتوقيت وإشارات الأمان لتقديم الصفحات ومنع إساءة الاستخدام وتشخيص الأعطال وفق شروط خصوصيتها.">
              Cloudflare hosts and secures the site. Like most web hosts, it may process request information such as IP address, browser, requested URL, timestamps and security signals to deliver pages, prevent abuse and diagnose failures under its own privacy terms.
            </p>
            <p data-en="Advertising, analytics, security and hosting providers operate under their own privacy policies. Print Prep Lab does not sell selected images or calculator inputs, and the image-analysis tools are designed to keep selected image files on the visitor&#x27;s device." data-ar="يعمل مزودو الإعلانات والتحليلات والأمان والاستضافة وفق سياسات الخصوصية الخاصة بهم. لا يبيع Print Prep Lab الصور المختارة أو مدخلات الحاسبات، وصُممت أدوات تحليل الصور لإبقاء الملفات المختارة على جهاز الزائر.">
              Advertising, analytics, security and hosting providers operate under their own privacy policies. Print Prep Lab does not sell selected images or calculator inputs, and the image-analysis tools are designed to keep selected image files on the visitor&apos;s device.
            </p>
          </div>
        </section>

        <section>
          <span>07</span>
          <div>
            <h2 data-en="External links" data-ar="الروابط الخارجية">External links</h2>
            <p data-en="Guides link to standards bodies, software documentation and the public project tracker. Following an external link sends a request to that provider, whose privacy policy governs its site. Print Prep Lab does not control external content or retention." data-ar="تربط الأدلة بجهات المعايير وتوثيق البرمجيات وسجل المشروع العام. يؤدي فتح رابط خارجي إلى إرسال طلب لذلك المزود، وتطبق سياسة خصوصيته على موقعه. لا يتحكم Print Prep Lab في المحتوى الخارجي أو مدة الاحتفاظ بالبيانات هناك.">
              Guides link to standards bodies, software documentation and the public project tracker. Following an external link sends a request to that provider, whose privacy policy governs its site. Print Prep Lab does not control external content or retention.
            </p>
          </div>
        </section>

        <section>
          <span>08</span>
          <div>
            <h2 data-en="Your choices" data-ar="خياراتك">Your choices</h2>
            <p data-en="Use the Analytics choices link in the footer to allow, decline or withdraw Clarity consent. Browser settings can clear local storage and manage cookies. Google ad-personalization controls are available through the links above and through any consent message shown for the visitor&#x27;s region." data-ar="استخدم رابط «خيارات التحليلات» في التذييل للسماح بموافقة Clarity أو رفضها أو سحبها. تستطيع إعدادات المتصفح مسح التخزين المحلي وإدارة ملفات تعريف الارتباط. تتاح أدوات تخصيص إعلانات Google عبر الروابط أعلاه وعبر أي رسالة موافقة تظهر لمنطقة الزائر.">
              Use the Analytics choices link in the footer to allow, decline or withdraw Clarity consent. Browser settings can clear local storage and manage cookies. Google ad-personalization controls are available through the links above and through any consent message shown for the visitor&apos;s region.
            </p>
          </div>
        </section>

        <section>
          <span>09</span>
          <div>
            <h2 data-en="Contact and policy updates" data-ar="التواصل وتحديث السياسة">Contact and policy updates</h2>
            <p data-en="Privacy or site questions can be sent through the public channel described on the Contact page; do not place private information in a public issue. This policy may be updated when site features, analytics, advertising providers or legal requirements change. Material revisions receive a new last-updated date." data-ar="يمكن إرسال أسئلة الخصوصية أو الموقع عبر القناة العامة الموضحة في صفحة التواصل؛ لا تضع معلومات خاصة في بلاغ عام. قد تُحدّث هذه السياسة عند تغير ميزات الموقع أو التحليلات أو مزودي الإعلانات أو المتطلبات القانونية. تحصل المراجعات الجوهرية على تاريخ آخر تحديث جديد.">
              Privacy or site questions can be sent through the public channel described on the Contact page; do not place private information in a public issue. This policy may be updated when site features, analytics, advertising providers or legal requirements change. Material revisions receive a new last-updated date.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
