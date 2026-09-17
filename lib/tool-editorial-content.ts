export type ToolEditorialSection = {
  workedCalculation: {
    inputs: string[];
    steps: string[];
    result: string;
    interpretation: string;
  };
  assumptions: string[];
  limits: string[];
  nextStep: { label: string; href: string };
  ar: {
    workedCalculation: {
      inputs: string[];
      steps: string[];
      result: string;
      interpretation: string;
    };
    assumptions: string[];
    limits: string[];
    nextStep: { label: string; href: string };
  };
};

export const TOOL_EDITORIAL: Record<string, ToolEditorialSection> = {
  "print-readiness-checker": {
    workedCalculation: {
      inputs: ["Image: 4200 × 2800 px", "Target print: 14 × 10 in", "Target density: 300 PPI"],
      steps: [
        "The 3:2 image and 7:5 print do not have the same aspect ratio, so a fill crop is required before resolution is judged.",
        "Filling 14 × 10 in keeps about 93.3% of the source area and removes pixels from the long direction.",
        "After that crop, the limiting effective density is about 280 PPI rather than the uncropped 300 PPI-looking headline number.",
      ],
      result: "At this exact crop and size, the file falls below a 300 PPI target but remains above a 240 PPI target.",
      interpretation: "The useful decision is not simply ‘good’ or ‘bad’. If the printer requires 300 PPI, reduce the print size, choose a crop that preserves more usable pixels, or supply a higher-resolution source. If the provider accepts 240 PPI for this product and viewing distance, the same file may be suitable without resampling.",
    },
    assumptions: [
      "The entered pixel dimensions are the final post-edit source dimensions.",
      "The image is intended to fill the print rather than fit inside it with borders.",
      "The selected PPI is a planning target supplied by the user or printer, not a universal quality threshold.",
    ],
    limits: [
      "The checker cannot measure focus, motion blur, JPEG damage, sharpening, color accuracy, paper texture or printer calibration.",
      "A print lab can apply extra overscan or trimming beyond the geometric crop shown here.",
      "Changing only a file's embedded DPI/PPI metadata does not create more pixels and does not improve this result.",
    ],
    nextStep: { label: "Read how maximum print size is calculated", href: "/guides/how-large-can-i-print-my-image" },
    ar: {
      workedCalculation: {
        inputs: ["الصورة: 4200 × 2800 بكسل", "مقاس الطباعة: 14 × 10 بوصات", "الهدف: 300 PPI"],
        steps: [
          "نسبة الصورة 3:2 لا تطابق نسبة الطباعة 7:5، لذلك يجب حساب القص أولًا قبل الحكم على الدقة.",
          "ملء مقاس 14 × 10 يحتفظ بنحو 93.3% من مساحة المصدر ويزيل جزءًا من الاتجاه الأطول.",
          "بعد القص تصبح الكثافة الفعلية المقيدة نحو 280 PPI بدل الاعتماد على رقم غير محسوب بعد القص.",
        ],
        result: "بهذا المقاس والقص لا يحقق الملف هدف 300 PPI، لكنه يتجاوز 240 PPI.",
        interpretation: "القرار ليس مجرد جيد أو سيئ. إذا اشترطت المطبعة 300 PPI فقلل المقاس أو غيّر القص أو استخدم مصدرًا أعلى دقة. وإذا كانت تقبل 240 PPI لهذا المنتج ومسافة المشاهدة فقد يكون الملف مناسبًا دون إعادة تحجيم.",
      },
      assumptions: ["الأبعاد المدخلة هي أبعاد الملف النهائي بعد التحرير.", "المطلوب هو ملء الورق لا وضع الصورة كاملة داخل حدود مع فراغات.", "قيمة PPI هدف يختاره المستخدم أو مزود الطباعة وليست حدًا عالميًا للجودة."],
      limits: ["لا يقيس الفاحص الحدة أو اهتزاز الصورة أو ضغط JPEG أو الألوان أو الورق أو معايرة الطابعة.", "قد تطبق المطبعة قصًا إنتاجيًا إضافيًا لا يظهر في الحساب الهندسي.", "تغيير قيمة DPI/PPI في البيانات الوصفية وحدها لا يضيف بكسلات."],
      nextStep: { label: "اقرأ كيف يُحسب أقصى مقاس للطباعة", href: "/guides/how-large-can-i-print-my-image" },
    },
  },
  "pixels-to-print-size": {
    workedCalculation: {
      inputs: ["Image: 4032 × 3024 px", "Planning target: 300 PPI"],
      steps: ["4032 ÷ 300 = 13.44 in", "3024 ÷ 300 = 10.08 in", "Convert inches to centimetres by multiplying each edge by 2.54."],
      result: "The uncropped file corresponds to about 13.44 × 10.08 in, or 34.14 × 25.60 cm, at 300 PPI.",
      interpretation: "That is a mathematical size at the selected density, not an order recommendation. A 12 × 9 in print would leave extra pixel density; an 8 × 10 print changes the aspect ratio and therefore requires crop or borders before the final PPI is known.",
    },
    assumptions: ["The source pixel dimensions are known and no later crop will remove pixels.", "PPI is applied equally in both directions.", "The calculation does not resample or invent pixels."],
    limits: ["File size in MB, camera megapixel marketing and metadata DPI are not substitutes for actual pixel width and height.", "The tool cannot predict whether a lower density will look acceptable at a particular viewing distance.", "A mismatched print ratio must be resolved before treating the displayed size as a final production size."],
    nextStep: { label: "Compare the result with the print-resolution guide", href: "/guides/print-resolution-guide" },
    ar: {
      workedCalculation: {
        inputs: ["الصورة: 4032 × 3024 بكسل", "الهدف التخطيطي: 300 PPI"],
        steps: ["4032 ÷ 300 = 13.44 بوصة", "3024 ÷ 300 = 10.08 بوصة", "للتحويل إلى السنتيمتر اضرب كل بُعد في 2.54."],
        result: "يعادل الملف قبل القص نحو 13.44 × 10.08 بوصة، أو 34.14 × 25.60 سم، عند 300 PPI.",
        interpretation: "هذه نتيجة رياضية عند الكثافة المختارة وليست توصية شراء. مقاس 12 × 9 سيحتفظ بكثافة أعلى، بينما 8 × 10 يغيّر النسبة ويحتاج قصًا أو حدودًا قبل معرفة PPI النهائي.",
      },
      assumptions: ["أبعاد البكسل معروفة ولن يزيل قص لاحق جزءًا منها.", "تطبق قيمة PPI بالتساوي على المحورين.", "الحساب لا يعيد أخذ عينات ولا ينشئ بكسلات جديدة."],
      limits: ["حجم الملف بالميجابايت وعدد الميجابكسل التسويقي وقيمة DPI الوصفية لا تحل محل أبعاد البكسل الفعلية.", "لا تتنبأ الأداة بما إذا كانت كثافة أقل ستبدو مناسبة من مسافة مشاهدة معينة.", "اختلاف نسبة الصورة عن الورق يجب حسمه قبل اعتماد المقاس كقرار إنتاج نهائي."],
      nextStep: { label: "قارن النتيجة بدليل دقة الطباعة", href: "/guides/print-resolution-guide" },
    },
  },
  "print-size-to-pixels": {
    workedCalculation: {
      inputs: ["Trim size: 210 × 297 mm (A4)", "Target: 300 PPI", "No bleed included"],
      steps: ["210 ÷ 25.4 = 8.2677 in and 297 ÷ 25.4 = 11.6929 in.", "8.2677 × 300 = 2480.31 px and 11.6929 × 300 = 3507.87 px.", "Round only the final raster dimensions to whole pixels."],
      result: "A4 trim needs 2480 × 3508 px at 300 PPI before bleed.",
      interpretation: "Use this as the minimum raster canvas for the stated trim target. If the product requires 3 mm bleed, the artwork canvas must be calculated from 216 × 303 mm instead; simply adding a few pixels after export is not equivalent.",
    },
    assumptions: ["The physical dimensions describe the intended final trim unless the user deliberately enters the full bleed canvas.", "The target PPI applies to raster content at final physical size.", "Rounding occurs only after unit conversion and multiplication."],
    limits: ["Meeting the pixel count does not prove the source image is sharp or free of compression artifacts.", "Vector artwork does not need to be rasterised to this exact pixel count unless the export workflow requires it.", "Printer-specific bleed, oversize and RIP requirements can change the export dimensions."],
    nextStep: { label: "Add bleed and safe margins correctly", href: "/tools/bleed-safe-area-calculator" },
    ar: {
      workedCalculation: {
        inputs: ["مقاس التشذيب: 210 × 297 مم (A4)", "الهدف: 300 PPI", "من دون نزف"],
        steps: ["210 ÷ 25.4 = 8.2677 بوصة و297 ÷ 25.4 = 11.6929 بوصة.", "8.2677 × 300 = 2480.31 بكسل و11.6929 × 300 = 3507.87 بكسل.", "يتم التقريب إلى بكسلات كاملة في النتيجة النهائية فقط."],
        result: "مقاس A4 النهائي يحتاج 2480 × 3508 بكسل عند 300 PPI قبل إضافة النزف.",
        interpretation: "استخدم الرقم كحد أدنى للوحة النقطية عند هذا المقاس. إذا طلب المنتج نزف 3 مم فيجب حساب اللوحة من 216 × 303 مم؛ إضافة عدة بكسلات بعد التصدير ليست بديلًا صحيحًا.",
      },
      assumptions: ["الأبعاد الفعلية تمثل التشذيب النهائي ما لم يُدخل المستخدم مقاس لوحة النزف كاملة.", "قيمة PPI تطبق على المحتوى النقطي عند المقاس النهائي.", "التقريب يحدث بعد التحويل والضرب فقط."],
      limits: ["تحقيق عدد البكسلات لا يثبت حدة الصورة أو خلوها من آثار الضغط.", "الرسومات المتجهة لا تحتاج التحويل إلى هذا العدد من البكسلات إلا إذا فرض مسار التصدير ذلك.", "متطلبات النزف والتكبير وبرنامج RIP لدى المطبعة قد تغيّر أبعاد التصدير."],
      nextStep: { label: "احسب النزف ومنطقة الأمان", href: "/tools/bleed-safe-area-calculator" },
    },
  },
  "dpi-ppi-calculator": {
    workedCalculation: {
      inputs: ["Image: 6000 × 4000 px", "Print: 20 × 16 in"],
      steps: ["Horizontal density: 6000 ÷ 20 = 300 PPI.", "Vertical density: 4000 ÷ 16 = 250 PPI.", "For a fill-to-size decision, the lower axis is the limiting density."],
      result: "The limiting effective density is 250 PPI, not 300 PPI.",
      interpretation: "The unequal axis values reveal a ratio mismatch. A crop or border decision is still required. Reporting only the 300 PPI horizontal number would overstate the usable density for a filled 20 × 16 print.",
    },
    assumptions: ["Printed width and height describe the final occupied image area.", "The image is not resampled between the entered pixel dimensions and printing.", "The lower axis is used as the conservative fill-to-size value."],
    limits: ["PPI describes image sampling; it does not equal the printer's advertised hardware DPI.", "The calculator does not judge interpolation quality if you enlarge the image elsewhere.", "Different crop placement can change how many source pixels remain on the limiting axis."],
    nextStep: { label: "Read the DPI vs PPI explanation", href: "/guides/dpi-vs-ppi" },
    ar: {
      workedCalculation: {
        inputs: ["الصورة: 6000 × 4000 بكسل", "الطباعة: 20 × 16 بوصة"],
        steps: ["الكثافة الأفقية: 6000 ÷ 20 = 300 PPI.", "الكثافة الرأسية: 4000 ÷ 16 = 250 PPI.", "عند ملء المقاس تكون القيمة الأقل هي القيد العملي."],
        result: "الكثافة الفعلية المقيدة هي 250 PPI وليست 300 PPI.",
        interpretation: "اختلاف المحورين يكشف عدم تطابق النسبة. ما زال يلزم قرار قص أو حدود، والاكتفاء برقم 300 الأفقي سيعطي انطباعًا مبالغًا فيه عن الدقة المتاحة عند ملء 20 × 16.",
      },
      assumptions: ["العرض والارتفاع يمثلان مساحة الصورة النهائية المطبوعة.", "لا تتم إعادة أخذ عينات بعد أبعاد البكسل المدخلة.", "يُستخدم المحور الأقل كقيمة محافظة عند ملء المقاس."],
      limits: ["PPI يصف كثافة بكسلات الصورة ولا يساوي DPI المعلن للطابعة.", "لا تقيم الحاسبة جودة الاستيفاء إذا كبّرت الصورة في برنامج آخر.", "موضع القص قد يغيّر عدد البكسلات المتبقية على المحور المقيد."],
      nextStep: { label: "اقرأ شرح الفرق بين DPI وPPI", href: "/guides/dpi-vs-ppi" },
    },
  },
  "paper-size-pixels-calculator": {
    workedCalculation: {
      inputs: ["Paper: A3", "Physical size: 297 × 420 mm", "Target: 240 PPI"],
      steps: ["297 ÷ 25.4 × 240 = 2806.30 px.", "420 ÷ 25.4 × 240 = 3968.50 px.", "Round the final dimensions to 2806 × 3969 px."],
      result: "An A3 trim canvas at 240 PPI is 2806 × 3969 px in portrait orientation.",
      interpretation: "The result is tied to the selected PPI. A3 itself does not have one fixed pixel size. If the printer asks for bleed, calculate the larger physical canvas first rather than treating this trim result as the final export size.",
    },
    assumptions: ["The preset dimensions represent physical trim size.", "Orientation changes edge order but not the format itself.", "Metric conversion uses 25.4 mm per inch before multiplying by PPI."],
    limits: ["Paper names do not define a universal pixel count.", "Desktop printers may have non-printable margins even when the document canvas matches the paper size.", "Commercial bleed and finishing requirements are product-specific and are not embedded in the paper preset."],
    nextStep: { label: "Open the A4 reference to see a full size workflow", href: "/sizes/a4" },
    ar: {
      workedCalculation: {
        inputs: ["الورق: A3", "المقاس: 297 × 420 مم", "الهدف: 240 PPI"],
        steps: ["297 ÷ 25.4 × 240 = 2806.30 بكسل.", "420 ÷ 25.4 × 240 = 3968.50 بكسل.", "تُقرب النتيجة النهائية إلى 2806 × 3969 بكسل."],
        result: "لوحة A3 عند 240 PPI تساوي 2806 × 3969 بكسل في الاتجاه الرأسي.",
        interpretation: "النتيجة مرتبطة بقيمة PPI المختارة؛ لا يوجد لـA3 عدد بكسلات ثابت. وإذا طلبت المطبعة نزفًا فاحسب المقاس الفعلي الأكبر أولًا بدل اعتماد مقاس التشذيب كتصدير نهائي.",
      },
      assumptions: ["المقاسات المخزنة تمثل التشذيب الفعلي.", "تغيير الاتجاه يبدل ترتيب الحواف ولا يغيّر صيغة الورق.", "يتم استخدام 25.4 مم لكل بوصة قبل الضرب في PPI."],
      limits: ["اسم الورق لا يحدد عدد بكسلات عالميًا.", "قد تكون للطابعات المكتبية حواف غير قابلة للطباعة رغم تطابق مقاس المستند.", "النزف والتشطيب متطلبات خاصة بالمنتج وليست جزءًا من إعداد الورق."],
      nextStep: { label: "افتح مرجع A4 لرؤية مسار كامل", href: "/sizes/a4" },
    },
  },
  "aspect-ratio-crop-preview": {
    workedCalculation: {
      inputs: ["Source ratio: 3:2", "Target print: 8 × 10 in (4:5)", "Mode: fill"],
      steps: ["Source ratio = 1.5 and target ratio = 1.25.", "Retained fraction = 1.25 ÷ 1.5 = 0.8333.", "Cropped fraction = 1 − 0.8333 = 0.1667, or about 16.7%."],
      result: "A 3:2 image loses about 16.7% of its area when it fills an 8 × 10 print.",
      interpretation: "The percentage tells you how much area must be removed, not which subject matter will be lost. Move the crop around faces, text and important edges; if no placement is acceptable, use a border or choose a print with a closer ratio.",
    },
    assumptions: ["The calculation models a centred geometric fill crop and compares aspect ratios only.", "Orientation is aligned before the ratios are compared.", "The retained-area estimate assumes rectangular source and target frames."],
    limits: ["The tool cannot know whether the cropped pixels contain important subject matter.", "Labs may add borderless overscan beyond the ideal ratio crop.", "Panoramas, irregular masks and custom die cuts require a more specific production template."],
    nextStep: { label: "Read the crop-planning guide", href: "/guides/aspect-ratio-cropping-print" },
    ar: {
      workedCalculation: {
        inputs: ["نسبة المصدر: 3:2", "الطباعة: 8 × 10 بوصات (4:5)", "الوضع: ملء"],
        steps: ["نسبة المصدر = 1.5 ونسبة الهدف = 1.25.", "الجزء المحتفظ به = 1.25 ÷ 1.5 = 0.8333.", "الجزء المقصوص = 1 − 0.8333 = 0.1667، أي نحو 16.7%."],
        result: "تفقد صورة 3:2 نحو 16.7% من مساحتها عند ملء طباعة 8 × 10.",
        interpretation: "النسبة تخبرك بكمية المساحة التي ستزال لا بالمحتوى الذي سيختفي. حرّك إطار القص حول الوجوه والنصوص والحواف المهمة؛ وإذا لم يوجد موضع مناسب فاستخدم حدودًا أو اختر مقاسًا أقرب للنسبة الأصلية.",
      },
      assumptions: ["الحساب يمثل قصًا هندسيًا مستطيلاً ويقارن النسب فقط.", "يتم توحيد الاتجاه قبل مقارنة النسب.", "تقدير المساحة يفترض إطار مصدر وهدف مستطيلين."],
      limits: ["لا تعرف الأداة ما إذا كانت البكسلات المقصوصة تحتوي عنصرًا مهمًا.", "قد تضيف المعامل قصًا زائدًا للطباعة بلا حدود.", "البانوراما والأقنعة غير المنتظمة والقص بالقالب تحتاج قالب إنتاج خاصًا."],
      nextStep: { label: "اقرأ دليل تخطيط القص", href: "/guides/aspect-ratio-cropping-print" },
    },
  },
  "bleed-safe-area-calculator": {
    workedCalculation: {
      inputs: ["Trim: 148 × 210 mm (A5)", "Bleed: 3 mm each edge", "Safe margin: 5 mm each edge"],
      steps: ["Artwork width = 148 + 3 + 3 = 154 mm; height = 210 + 3 + 3 = 216 mm.", "Safe width = 148 − 5 − 5 = 138 mm; height = 210 − 5 − 5 = 200 mm.", "Trim remains 148 × 210 mm; bleed and safe area solve different risks."],
      result: "Prepare a 154 × 216 mm full artwork canvas and keep critical content inside roughly 138 × 200 mm, using these example requirements.",
      interpretation: "Bleed protects against small cutting variation by extending background artwork outside trim. Safe margin protects text and important elements by moving them inward. Neither value should be copied to a real job until the printer confirms its requirement.",
    },
    assumptions: ["The same bleed and safe margin are applied to all four edges.", "The entered trim size is the finished product size.", "The printer expects conventional rectangular trim rather than a custom dieline."],
    limits: ["Three millimetres and five millimetres are examples, not universal standards.", "Book binding, folds, perforations and die cuts can require asymmetric safe zones.", "The calculator does not create printer marks, PDF boxes or a production-ready PDF."],
    nextStep: { label: "Read the bleed, trim and safe-area guide", href: "/guides/bleed-trim-safe-area" },
    ar: {
      workedCalculation: {
        inputs: ["التشذيب: 148 × 210 مم (A5)", "النزف: 3 مم لكل حافة", "هامش الأمان: 5 مم لكل حافة"],
        steps: ["عرض اللوحة = 148 + 3 + 3 = 154 مم، والارتفاع = 210 + 3 + 3 = 216 مم.", "عرض المنطقة الآمنة = 148 − 5 − 5 = 138 مم، والارتفاع = 210 − 5 − 5 = 200 مم.", "يبقى التشذيب 148 × 210 مم؛ النزف ومنطقة الأمان يعالجان خطرين مختلفين."],
        result: "بهذه القيم التجريبية جهز لوحة 154 × 216 مم وأبقِ المحتوى المهم داخل نحو 138 × 200 مم.",
        interpretation: "يمتد النزف خارج خط القطع لحماية الخلفيات من اختلاف القص البسيط، بينما يحرك هامش الأمان النص والعناصر المهمة إلى الداخل. لا تعتمد أي قيمة في عمل حقيقي قبل تأكيد متطلبات المطبعة.",
      },
      assumptions: ["يطبق نفس النزف وهامش الأمان على الحواف الأربع.", "المقاس المدخل هو المقاس النهائي للمنتج.", "المطلوب تشذيب مستطيل تقليدي لا قالب قص مخصص."],
      limits: ["3 مم و5 مم أمثلة وليست قواعد عالمية.", "التجليد والطيات والتثقيب والقص بالقالب قد تحتاج مناطق أمان غير متماثلة.", "الحاسبة لا تنشئ علامات الطباعة أو PDF boxes أو ملف PDF جاهزًا للإنتاج."],
      nextStep: { label: "اقرأ دليل النزف والتشذيب ومنطقة الأمان", href: "/guides/bleed-trim-safe-area" },
    },
  },
};
