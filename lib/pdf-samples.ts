type Copy = readonly [string, string];
export type PdfSample = {
  id: string;
  title: Copy;
  summary: Copy;
  explanation: Copy;
  correction: Copy;
  bleedMm: number | null;
  ppi: number;
  placementMm: readonly [number, number];
};

// These are teaching specifications, not universal printer requirements.
export const PDF_SAMPLE_TARGETS = { width: 210, height: 297, bleed: 3, ppi: 300 };
export const PDF_SAMPLES: readonly PdfSample[] = [
  {
    id: "a4-matched-geometry",
    title: ["A4 with matching geometry", "A4 بأبعاد مطابقة"],
    summary: ["Explicit trim and bleed boxes; a 600 × 300 px image placed at 50.8 × 25.4 mm.", "إطارا تشذيب ونزف صريحان، وصورة 600 × 300 بكسل موضوعة بمقاس 50.8 × 25.4 مم."],
    explanation: ["The TrimBox is 210 × 297 mm, centred inside a 216 × 303 mm BleedBox. Each margin is (216 − 210) ÷ 2 = 3 mm. The image is 2 × 1 inches, so both axes are 300 PPI. Size, geometric bleed and measured image PPI should meet this exercise’s targets. That result describes three measurements, not a production approval.", "TrimBox مقاسه 210 × 297 مم ومتمركز داخل BleedBox مقاسه 216 × 303 مم. كل هامش = (216 − 210) ÷ 2 = 3 مم. الصورة تشغل 2 × 1 بوصة، وبالتالي يحقق المحوران 300 PPI. يفترض أن تحقق فحوص المقاس والنزف الهندسي وكثافة الصورة أهداف التمرين. هذه نتيجة لثلاثة قياسات وليست اعتمادًا للإنتاج."],
    correction: ["No geometric correction is needed for the stated targets. Still inspect the background at every trim edge, the lettering, fonts and color workflow. This RGB teaching file uses standard PDF fonts and is not supplied as a PDF/X production template.", "لا يحتاج الملف تصحيحًا هندسيًا للأهداف المحددة. راجع رغم ذلك الخلفية عند كل حافة تشذيب، والنصوص والخطوط ومسار الألوان. هذا ملف تدريب RGB يستخدم خطوط PDF القياسية، وليس قالب إنتاج PDF/X."],
    bleedMm: 3, ppi: 300, placementMm: [50.8, 25.4],
  },
  {
    id: "a4-short-bleed-low-ppi",
    title: ["A4 with two independent problems", "A4 بمشكلتين مستقلتين"],
    summary: ["Only 1 mm of bleed; the same 600 × 300 px image is placed twice as wide and tall.", "نزف 1 مم فقط، والصورة نفسها 600 × 300 بكسل موضوعة بضعف العرض والارتفاع."],
    explanation: ["The finished A4 size still matches. The 212 × 299 mm BleedBox leaves (212 − 210) ÷ 2 = 1 mm on each edge, below the 3 mm target. The image occupies 101.6 × 50.8 mm, or 4 × 2 inches: 600 ÷ 4 = 300 ÷ 2 = 150 PPI. Expect a matching size with two warnings. Raising a resolution tag cannot supply the missing image detail or missing artwork outside trim.", "المقاس النهائي A4 ما زال مطابقًا. BleedBox مقاسه 212 × 299 مم يترك (212 − 210) ÷ 2 = 1 مم لكل حافة، أقل من هدف 3 مم. الصورة تشغل 101.6 × 50.8 مم، أي 4 × 2 بوصة: 600 ÷ 4 = 300 ÷ 2 = 150 PPI. توقع مقاسًا مطابقًا وتحذيرين. تغيير قيمة الدقة المخزنة لا يضيف تفاصيل للصورة ولا تصميمًا خارج التشذيب."],
    correction: ["In the editable source, extend the real background to a 216 × 303 mm bleed canvas while keeping 210 × 297 mm trim. For this image placement, obtain at least 1200 × 600 original pixels for 300 PPI, or reduce its placed size to 50.8 × 25.4 mm. Export again and inspect the new PDF. Enlarging the old page would also change the finished size.", "في المصدر القابل للتعديل، مد الخلفية الحقيقية إلى لوحة نزف 216 × 303 مم مع إبقاء التشذيب 210 × 297 مم. لهذا الموضع، استخدم أصلًا لا يقل عن 1200 × 600 بكسل لتحقيق 300 PPI، أو صغّر موضع الصورة إلى 50.8 × 25.4 مم. صدّر وافحص PDF الجديد. تكبير الصفحة القديمة سيغيّر المقاس النهائي أيضًا."],
    bleedMm: 1, ppi: 150, placementMm: [101.6, 50.8],
  },
  {
    id: "a4-unspecified-boxes",
    title: ["A4 appearance, unspecified boxes", "شكل A4 وإطارات غير محددة"],
    summary: ["An A4 MediaBox and a 300 PPI image, with no explicit TrimBox or BleedBox.", "MediaBox بمقاس A4 وصورة 300 PPI، دون TrimBox أو BleedBox صريحين."],
    explanation: ["The page measures 210 × 297 mm, so its displayed size matches. The image also meets 300 PPI. However, the parser must fall back to the page’s default boxes: it has no explicit trim or bleed specification. The bleed check should say ‘Needs review’, not pass or certify zero bleed. A page looking like A4 on screen does not establish the intended cutting boundary.", "الصفحة تقاس 210 × 297 مم فيطابق مقاسها الظاهر الهدف، والصورة تحقق 300 PPI. لكن المحلل يرجع للإطارات الافتراضية؛ لا يوجد تحديد صريح للتشذيب أو النزف. يجب أن يقول فحص النزف «تحتاج مراجعة»، دون اجتياز أو اعتماد أن النزف صفر. ظهور الصفحة كـA4 على الشاشة لا يحدد حد القطع المقصود."],
    correction: ["Confirm whether the provider wants an edge-to-edge product or an intentionally unbled document. For this exercise’s 3 mm requirement, export from the source with explicit 210 × 297 mm trim, a 216 × 303 mm bleed area and artwork extended into it. Merely adding box metadata cannot restore missing background artwork.", "أكّد هل يريد المزود منتجًا ممتدًا للحواف أم مستندًا بلا نزف عمدًا. لمتطلب التمرين البالغ 3 مم، صدّر من المصدر بتشذيب صريح 210 × 297 مم ونزف 216 × 303 مم وتصميم ممتد داخله. إضافة بيانات الإطارات وحدها لا تستعيد خلفية مفقودة."],
    bleedMm: null, ppi: 300, placementMm: [50.8, 25.4],
  },
];
export const pdfSamplePath = (sample: PdfSample) => `/samples/${sample.id}.pdf`;
