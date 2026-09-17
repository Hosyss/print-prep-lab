import { TOOL_EDITORIAL, type ToolEditorialSection } from "@/lib/tool-editorial-content";

const PRINT_READINESS_CORRECTION: ToolEditorialSection = {
  workedCalculation: {
    inputs: ["Image: 4200 × 2800 px", "Target print: 14 × 10 in", "Planning targets: 300 PPI and 240 PPI"],
    steps: [
      "The source ratio is 4200:2800 = 3:2, while 14:10 = 7:5. A fill crop is therefore required before effective PPI is judged.",
      "Keeping the full 2800 px height, a 7:5 crop needs 2800 × 1.4 = 3920 px of width. The post-crop image is 3920 × 2800 px.",
      "The crop removes 4200 − 3920 = 280 px from the long direction, which is 280 ÷ 4200 = 6.67% of the source width (and source area).",
      "Effective density after the crop is 3920 ÷ 14 = 280 PPI horizontally and 2800 ÷ 10 = 280 PPI vertically.",
      "A true 300 PPI 14 × 10 in raster would require 4200 × 3000 px. A 240 PPI raster requires 3360 × 2400 px.",
    ],
    result: "Without upscaling, this exact 14 × 10 in fill crop prints at 280 PPI. It does not meet a 300 PPI requirement, but it exceeds a 240 PPI requirement.",
    interpretation: "Treat 280 PPI as the actual post-crop density, not as an estimate derived from the untrimmed file. If the provider requires 300 PPI, use a smaller print, a higher-resolution source, or an explicitly accepted resampling workflow. If the provider accepts 240 PPI for the product and viewing distance, the cropped source already clears that threshold without inventing pixels.",
  },
  assumptions: [
    "The entered 4200 × 2800 px dimensions are the final source dimensions before the print-ratio crop.",
    "The image fills the 14 × 10 in print with no borders, and the crop is centered only for the arithmetic example; crop placement can shift in production.",
    "No resampling or AI upscaling is applied before the effective-PPI calculation.",
    "300 PPI and 240 PPI are planning requirements supplied by a workflow or print provider, not universal quality grades.",
  ],
  limits: [
    "The checker cannot measure focus, motion blur, JPEG damage, sharpening, color accuracy, paper texture or printer calibration.",
    "A print lab can apply extra overscan or trimming beyond the geometric 7:5 crop used in this example.",
    "Changing only embedded DPI/PPI metadata does not create pixels and does not change the 280 PPI post-crop result.",
  ],
  nextStep: { label: "Read how maximum print size is calculated", href: "/guides/how-large-can-i-print-my-image" },
  ar: {
    workedCalculation: {
      inputs: ["الصورة: 4200 × 2800 بكسل", "مقاس الطباعة: 14 × 10 بوصات", "أهداف التخطيط: 300 PPI و240 PPI"],
      steps: [
        "نسبة المصدر 4200:2800 = 3:2، بينما 14:10 = 7:5، لذلك يجب حساب قص الملء قبل الحكم على PPI الفعلي.",
        "مع الاحتفاظ بارتفاع 2800 بكسل كاملًا يحتاج قص 7:5 إلى عرض 2800 × 1.4 = 3920 بكسل. تصبح الصورة بعد القص 3920 × 2800 بكسل.",
        "يزيل القص 4200 − 3920 = 280 بكسل من الاتجاه الأطول، أي 280 ÷ 4200 = 6.67% من عرض المصدر ومن مساحته.",
        "بعد القص تصبح الكثافة 3920 ÷ 14 = 280 PPI أفقيًا و2800 ÷ 10 = 280 PPI رأسيًا.",
        "لتحقيق 300 PPI فعليًا عند 14 × 10 يلزم 4200 × 3000 بكسل، بينما 240 PPI يحتاج 3360 × 2400 بكسل.",
      ],
      result: "من دون تكبير، قص الملء لهذا المقاس يطبع فعليًا عند 280 PPI. لا يحقق شرط 300 PPI، لكنه يتجاوز شرط 240 PPI.",
      interpretation: "اعتبر 280 PPI هي الدقة الفعلية بعد القص، وليس رقمًا مأخوذًا من الملف قبل التشذيب. إذا اشترط مزود الطباعة 300 PPI فاستخدم مقاسًا أصغر أو مصدرًا أعلى دقة أو مسار تكبير يقبله صراحة. وإذا كان يقبل 240 PPI للمنتج ومسافة المشاهدة فالمصدر بعد القص يتجاوز هذا الحد دون إنشاء بكسلات جديدة.",
    },
    assumptions: [
      "أبعاد 4200 × 2800 هي أبعاد المصدر النهائية قبل قص نسبة الطباعة.",
      "الصورة تملأ مقاس 14 × 10 من دون حدود، والقص متمركز في المثال الحسابي فقط؛ يمكن تغيير موضع القص إنتاجيًا.",
      "لا يحدث أي resampling أو تكبير بالذكاء الاصطناعي قبل حساب PPI الفعلي.",
      "300 PPI و240 PPI متطلبات تخطيط يحددها مسار العمل أو مزود الطباعة وليسا درجات جودة عالمية.",
    ],
    limits: [
      "لا يقيس الفاحص الحدة أو اهتزاز الصورة أو تلف JPEG أو المعالجة الحادة أو دقة الألوان أو ملمس الورق أو معايرة الطابعة.",
      "قد تطبق المطبعة overscan أو تشذيبًا إضافيًا يتجاوز قص 7:5 الهندسي المستخدم في المثال.",
      "تغيير بيانات DPI/PPI الوصفية وحدها لا ينشئ بكسلات ولا يغيّر نتيجة 280 PPI بعد القص.",
    ],
    nextStep: { label: "اقرأ كيف يُحسب أقصى مقاس للطباعة", href: "/guides/how-large-can-i-print-my-image" },
  },
};

export function getToolEditorial(slug: string): ToolEditorialSection | undefined {
  if (slug === "print-readiness-checker") return PRINT_READINESS_CORRECTION;
  return TOOL_EDITORIAL[slug];
}
