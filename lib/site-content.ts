export type ToolMode =
  | "pixels-to-print-size"
  | "print-size-to-pixels"
  | "dpi-ppi-calculator"
  | "paper-size-pixels-calculator"
  | "aspect-ratio-crop-preview"
  | "bleed-safe-area-calculator";

export type ToolPage = {
  slug: string;
  title: string;
  seoTitle: string;
  heading: string;
  shortTitle: string;
  description: string;
  intent: string;
  mode: ToolMode | "print-readiness-checker";
  quickAnswer: string;
  formula: string;
  example: string;
  mistakes: string[];
  related: string[];
  steps: string[];
  faq: Array<{ question: string; answer: string }>;
};

export const TOOL_PAGES: ToolPage[] = [
  {
    slug: "print-readiness-checker",
    title: "Print Readiness Checker",
    seoTitle: "Print Readiness Checker – Check Image Quality for Printing",
    heading: "Is Your Image Ready to Print?",
    shortTitle: "Print readiness checker",
    description: "Upload an image and check effective PPI, maximum print sizes, crop loss, bleed canvas and safe area without sending the file anywhere.",
    intent: "Is my image large enough to print?",
    mode: "print-readiness-checker",
    quickAnswer: "A print-ready image has enough real pixels for the final physical size, after any crop. This checker reads those pixels locally, calculates effective PPI and shows realistic maximum sizes at 150, 240 and 300 PPI.",
    formula: "effective PPI = remaining pixels ÷ final printed inches",
    example: "A 3600 × 2400 px image can print 12 × 8 inches at 300 PPI, 15 × 10 inches at 240 PPI or 24 × 16 inches at 150 PPI before cropping.",
    mistakes: ["Trusting a stored DPI tag instead of the real pixel dimensions", "Checking PPI before deciding the final crop", "Treating a numerical target as a printer guarantee"],
    related: ["aspect-ratio-crop-preview", "pixels-to-print-size", "dpi-ppi-calculator"],
    steps: ["Choose the final image file or enter its pixel dimensions.", "Select the physical print size and orientation.", "Compare effective PPI, crop and bleed results with your printer's specification."],
    faq: [
      { question: "Does this upload my image?", answer: "No. The browser reads the image dimensions locally and uses a temporary local preview. The image is not sent to Print Prep Lab." },
      { question: "Why is effective PPI more useful than the DPI label?", answer: "Effective PPI uses the real pixel count and final physical print size. A metadata label can say 300 while the file still has too few pixels for a large print." },
      { question: "Does a green result guarantee the final print?", answer: "No calculator can guarantee a specific printer, paper or process. A green result means the file meets the selected pixel-density target; confirm production requirements with the print provider." },
    ],
  },
  {
    slug: "pixels-to-print-size",
    title: "Pixels to Print Size Calculator",
    seoTitle: "Pixels to Print Size Calculator (Inches, Cm & PPI)",
    heading: "Convert Pixels to Print Size",
    shortTitle: "Pixels to print size",
    description: "Convert image dimensions in pixels into physical print dimensions in inches and centimetres at 150, 240, 300 or any custom PPI.",
    intent: "How large will these pixels print?",
    mode: "pixels-to-print-size",
    quickAnswer: "Divide each pixel dimension by the chosen PPI. The calculator shows inches and centimetres instantly, plus a side-by-side comparison at the common 150, 240 and 300 PPI planning targets.",
    formula: "print inches = pixels ÷ PPI",
    example: "A 3000 × 2400 px file is 10 × 8 inches at 300 PPI, 12.5 × 10 inches at 240 PPI and 20 × 16 inches at 150 PPI.",
    mistakes: ["Using file size in MB as a resolution measure", "Changing only the metadata DPI field", "Ignoring pixels removed by the final crop"],
    related: ["print-readiness-checker", "print-size-to-pixels", "dpi-ppi-calculator"],
    steps: ["Enter the image width and height in pixels.", "Choose the intended pixels per inch.", "Read the corresponding physical print dimensions."],
    faq: [
      { question: "What is the pixels-to-inches formula?", answer: "Divide the pixel dimension by the selected PPI. A 3000-pixel edge at 300 PPI prints 10 inches long." },
      { question: "Should I use 150, 240 or 300 PPI?", answer: "Use the requirement supplied by the printer. 300 PPI is a common target for detailed work viewed closely; lower targets may suit larger prints viewed farther away." },
      { question: "Does the calculation resize my image?", answer: "No. It divides the existing pixel dimensions by a target PPI. It does not add pixels, resample the file or change image quality." },
    ],
  },
  {
    slug: "print-size-to-pixels",
    title: "Print Size to Pixels Calculator",
    seoTitle: "Print Size to Pixels Calculator – 150, 240 & 300 PPI",
    heading: "Convert Print Size to Pixels",
    shortTitle: "Print size to pixels",
    description: "Find the pixel dimensions needed for a print measured in inches, centimetres or millimetres at your chosen PPI.",
    intent: "How many pixels do I need for this print?",
    mode: "print-size-to-pixels",
    quickAnswer: "Multiply each physical dimension in inches by the target PPI. Use the rounded whole-pixel result as the minimum export dimensions for the chosen target.",
    formula: "required pixels = print inches × PPI",
    example: "An 8 × 10 inch print needs 1200 × 1500 px at 150 PPI, 1920 × 2400 px at 240 PPI or 2400 × 3000 px at 300 PPI.",
    mistakes: ["Adding bleed after exporting instead of calculating the full canvas", "Mixing centimetres with an inches-based formula", "Rounding the physical size before unit conversion"],
    related: ["pixels-to-print-size", "paper-size-pixels-calculator", "bleed-safe-area-calculator"],
    steps: ["Enter the final trim width and height.", "Choose the physical unit and target PPI.", "Use the rounded whole-pixel dimensions for the source or export file."],
    faq: [
      { question: "Why are pixel results rounded?", answer: "Pixels are whole units. Print Prep Lab calculates from the exact physical measurement, then rounds each final dimension to the nearest whole pixel." },
      { question: "Does the result include bleed?", answer: "No. This calculator uses final trim size. Use the bleed and safe-area calculator when the artwork extends beyond the cut edge." },
      { question: "Can the result include decimal pixels?", answer: "No. A raster image uses whole pixels, so each final dimension is rounded only after the full unit conversion and multiplication." },
    ],
  },
  {
    slug: "dpi-ppi-calculator",
    title: "DPI & PPI Calculator for Printing",
    seoTitle: "DPI & PPI Calculator for Print Resolution",
    heading: "Calculate Image PPI for Printing",
    shortTitle: "DPI / PPI calculator",
    description: "Calculate the effective pixels per inch of an image at a specific physical print size and see which dimension limits quality.",
    intent: "What PPI will my image have when printed?",
    mode: "dpi-ppi-calculator",
    quickAnswer: "Effective image PPI is the number of source pixels assigned to each printed inch. Width and height are calculated separately; the lower value is the limiting result when the image fills the print.",
    formula: "effective PPI = lower of width PPI and height PPI",
    example: "A 3000 × 2400 px file printed at 10 × 8 inches has 300 PPI on both axes. At 20 × 16 inches it has 150 PPI.",
    mistakes: ["Calling image PPI the printer's hardware DPI", "Using only one axis when ratios differ", "Assuming the embedded resolution tag changes the pixel count"],
    related: ["print-readiness-checker", "pixels-to-print-size", "print-size-to-pixels"],
    steps: ["Enter the image's true pixel width and height.", "Enter the final print dimensions and unit.", "Use the lower of the horizontal and vertical PPI values for a fill-to-size print."],
    faq: [
      { question: "Are DPI and PPI the same?", answer: "No. PPI describes image pixels per printed inch; DPI describes printer dots. The terms are often mixed in everyday searches, so this tool labels the image calculation clearly as effective PPI." },
      { question: "Why are there two PPI values?", answer: "Width and height can produce different values when the image and paper aspect ratios do not match. Filling the paper requires cropping, and the lower value is the limiting density." },
      { question: "Does a higher printer DPI require the same image PPI?", answer: "No. A printer can use multiple ink or toner dots to reproduce one image pixel. Follow the provider's requested image PPI rather than matching the printer's advertised DPI." },
    ],
  },
  {
    slug: "paper-size-pixels-calculator",
    title: "Paper Size in Pixels Calculator",
    seoTitle: "Paper Size in Pixels Calculator – A Series & US Sizes",
    heading: "Calculate Any Paper Size in Pixels",
    shortTitle: "Paper size in pixels",
    description: "Choose an ISO, US or photo format and calculate its pixel dimensions at any PPI, in portrait or landscape orientation.",
    intent: "What is this paper size in pixels?",
    mode: "paper-size-pixels-calculator",
    quickAnswer: "Choose the physical preset, orientation and PPI. The calculator converts the stored ISO, US or photo dimensions from millimetres to inches, multiplies by PPI and rounds the final pixel count once.",
    formula: "pixels = millimetres ÷ 25.4 × PPI",
    example: "A4 is 210 × 297 mm, which rounds to 2480 × 3508 px at 300 PPI and 1240 × 1754 px at 150 PPI.",
    mistakes: ["Treating a paper format as having one fixed pixel size", "Confusing portrait and landscape ordering", "Including bleed in a trim-size reference without saying so"],
    related: ["print-size-to-pixels", "bleed-safe-area-calculator", "print-readiness-checker"],
    steps: ["Choose a physical paper or photo preset.", "Set portrait or landscape orientation.", "Choose a PPI and copy the required pixel dimensions."],
    faq: [
      { question: "Does A4 have one fixed pixel size?", answer: "No. A4 has a fixed physical trim size of 210 × 297 mm. Its pixel dimensions depend on the selected PPI." },
      { question: "Why is A4 2480 × 3508 pixels at 300 PPI?", answer: "Each millimetre value is divided by 25.4 to convert it to inches, multiplied by 300, then rounded to the nearest whole pixel." },
      { question: "Are the listed dimensions trim size or bleed size?", answer: "They are final trim dimensions. Bleed is printer-specific and must be added separately to the artwork canvas." },
    ],
  },
  {
    slug: "aspect-ratio-crop-preview",
    title: "Aspect Ratio Crop Preview",
    seoTitle: "Aspect Ratio Crop Preview for Photo Prints",
    heading: "Preview How Your Photo Will Crop",
    shortTitle: "Aspect ratio & crop",
    description: "Compare an image ratio with common photo and paper formats, estimate crop loss and choose the orientation that preserves more of the image.",
    intent: "How much of my photo will be cropped?",
    mode: "aspect-ratio-crop-preview",
    quickAnswer: "A full-bleed print crops whenever the image and paper have different aspect ratios. Upload a local image or enter its pixels, choose a print preset and compare fill versus fit before ordering.",
    formula: "retained area = smaller aspect ratio ÷ larger aspect ratio",
    example: "A 3:2 camera image retains about 83.3% of its area when it fills an 8 × 10 (4:5) print, so about 16.7% is cropped from the long direction.",
    mistakes: ["Checking only dimensions instead of shape", "Cropping important content without repositioning the frame", "Calculating PPI before the final crop"],
    related: ["print-readiness-checker", "pixels-to-print-size", "paper-size-pixels-calculator"],
    steps: ["Enter the image dimensions to establish its aspect ratio.", "Choose the intended paper or photo size.", "Compare the retained and cropped percentages before editing the composition."],
    faq: [
      { question: "Why does an 8 × 10 crop a 4 × 6 photo?", answer: "A 4 × 6 photo has a 2:3 ratio, while an 8 × 10 print has a 4:5 ratio. Filling the 8 × 10 frame therefore removes part of the longer edge." },
      { question: "Can I avoid cropping?", answer: "Yes—choose a print with the same ratio, add borders, or fit the full image inside the paper instead of filling it edge to edge." },
      { question: "Does the uploaded image leave my browser?", answer: "No. The preview uses a temporary local browser URL. Print Prep Lab does not upload or store the selected image." },
    ],
  },
  {
    slug: "bleed-safe-area-calculator",
    title: "Bleed & Safe Area Calculator",
    seoTitle: "Bleed & Safe Area Calculator for Print",
    heading: "Calculate Bleed, Trim and Safe Area",
    shortTitle: "Bleed & safe area",
    description: "Calculate full artwork size, trim size and safe area in millimetres and pixels using editable bleed, margin and PPI values.",
    intent: "What canvas size includes print bleed?",
    mode: "bleed-safe-area-calculator",
    quickAnswer: "Bleed expands the artwork outside the final trim; the safe margin moves important content inward. Enter the provider's exact values for each edge to calculate all three boxes.",
    formula: "full canvas = trim + (2 × bleed)",
    example: "A4 trim at 210 × 297 mm with 3 mm bleed becomes a 216 × 303 mm artwork canvas. A 5 mm safe margin leaves a 200 × 287 mm safe area.",
    mistakes: ["Adding bleed only once instead of to both edges", "Putting text inside the bleed rather than the safe area", "Assuming every printer uses the same margin"],
    related: ["print-size-to-pixels", "paper-size-pixels-calculator", "print-readiness-checker"],
    steps: ["Enter the final trimmed width and height.", "Enter the bleed and safe margin required on each edge.", "Use the full canvas dimensions for the artwork and keep critical content inside the safe result."],
    faq: [
      { question: "Is 3 mm bleed always correct?", answer: "No. Three millimetres is a common starting point, not a universal rule. Always use the value supplied by the printer." },
      { question: "Is the safe area part of the bleed?", answer: "No. Bleed extends outside the final trim. The safe area sits inside the trim and protects text, logos and important details from cutting variation." },
      { question: "Should the pixel result be based on trim or bleed size?", answer: "For edge-to-edge artwork, export the full bleed canvas at the requested PPI. The finished physical product is still measured at the trim size." },
    ],
  },
];

export const SIZE_DETAILS: Record<string, { ratio: string; uses: string; note: string }> = {
  a2: { ratio: "1:√2", uses: "posters, diagrams and presentation boards", note: "A2 is four times the area of A4 and is commonly prepared at lower PPI only when viewing distance allows it." },
  a3: { ratio: "1:√2", uses: "small posters, menus and folded A4 spreads", note: "A3 folds exactly to A4 in the ISO series, which makes it useful for spreads and larger office output." },
  a4: { ratio: "1:√2", uses: "documents, worksheets, flyers and home printing", note: "A4 has a fixed trim size of 210 × 297 mm; it has no single fixed pixel size without a PPI value." },
  a5: { ratio: "1:√2", uses: "booklets, invitations, notepads and small flyers", note: "A5 is half the area of A4 and keeps the same ISO aspect ratio." },
  "us-letter": { ratio: "17:22", uses: "North American documents, resumes and office printing", note: "US Letter is wider and shorter than A4, so adapting a full-page A4 layout can change line breaks or crop edges." },
  "us-legal": { ratio: "17:28", uses: "contracts, legal documents and long forms", note: "US Legal shares the 8.5-inch width of Letter but extends the long edge to 14 inches." },
  "4x6-photo": { ratio: "2:3", uses: "standard photo-lab prints and postcards", note: "The 2:3 ratio matches many camera files, so this format often needs little or no crop." },
  "5x7-photo": { ratio: "5:7", uses: "greeting cards, portraits and small frames", note: "A 2:3 camera image must lose a small portion of its long edge to fill 5 × 7." },
  "8x10-photo": { ratio: "4:5", uses: "portraits, certificates and framed wall photos", note: "The 4:5 shape is noticeably less wide than a 2:3 camera frame, so crop placement matters." },
  "11x14-photo": { ratio: "11:14", uses: "portraits, art prints and medium frames", note: "11 × 14 does not exactly match 4:5 or 2:3, so preview the crop rather than relying on a nearby ratio." },
  "12x18-photo": { ratio: "2:3", uses: "camera-ratio enlargements and wall art", note: "The 2:3 ratio matches 4 × 6 and many camera sensors, reducing the need to crop." },
  "16x20-photo": { ratio: "4:5", uses: "large portraits, art prints and gallery frames", note: "At this physical size, verify both effective PPI and intended viewing distance before ordering." },
};

export type GuidePage = {
  slug: string;
  title: string;
  heading: string;
  description: string;
  takeaway: string;
  quickAnswer: string;
  formula: string;
  summary: Array<{ label: string; value: string; note: string }>;
  comparison: { caption: string; headers: string[]; rows: string[][] };
  visual?: "bleed-boxes";
  sections: Array<{ heading: string; paragraphs: string[] }>;
  workflow: string[];
  mistakes: string[];
  faq: Array<{ question: string; answer: string }>;
  related: string[];
  primaryCta: { label: string; href: string };
  sources: Array<{ label: string; href: string }>;
};

export const GUIDE_PAGES: GuidePage[] = [
  {
    slug: "dpi-vs-ppi",
    title: "DPI vs PPI: What Matters for Printing?",
    heading: "DPI vs PPI Explained for Print",
    description: "Learn the practical difference between image PPI and printer DPI, and which number to use when preparing a file for print.",
    takeaway: "For an image-size decision, use effective PPI: image pixels divided by the final printed inches.",
    quickAnswer: "PPI describes how image pixels are distributed across the physical print. DPI describes the printer's output dots. When checking whether an image has enough resolution, calculate effective PPI from its real pixel dimensions and final print size.",
    formula: "effective PPI = usable image pixels ÷ printed inches",
    summary: [
      { label: "Image", value: "PPI", note: "Pixels assigned to each printed inch" },
      { label: "Printer", value: "DPI", note: "Output dots placed by the print device" },
      { label: "File tag", value: "Metadata", note: "An intended scale, not extra image detail" },
    ],
    comparison: {
      caption: "PPI, DPI and the resolution tag solve different questions",
      headers: ["Term", "What it measures", "Use it for", "Do not assume"],
      rows: [
        ["PPI", "Image pixels per printed inch", "Image resolution and maximum print size", "A stored number proves the file is large enough"],
        ["DPI", "Printer output dots per inch", "Printer and screening specifications", "One printer dot equals one image pixel"],
        ["Resolution tag", "Suggested physical scale in file metadata", "Opening size in compatible software", "Changing the tag adds captured detail"],
      ],
    },
    sections: [
      { heading: "PPI belongs to the image-to-paper relationship", paragraphs: ["PPI means pixels per inch. It describes how many image pixels are assigned to each inch of the final print. The same 3000-pixel edge is 300 PPI at 10 inches, 240 PPI at 12.5 inches and 150 PPI at 20 inches.", "For a two-dimensional print, calculate both directions. The lower value is the limiting effective PPI, especially after cropping or fitting to a different aspect ratio."] },
      { heading: "DPI describes printer output", paragraphs: ["DPI means dots per inch and describes marks a printer can place. A printer can use several ink or toner dots to reproduce one image pixel, so its advertised DPI is not a substitute for the image's PPI.", "Printer drivers, screening, paper, ink spread and the production process affect how those dots reproduce the supplied image. Use the print provider's specification rather than converting printer DPI directly into image pixels."] },
      { heading: "The metadata number does not create detail", paragraphs: ["A file can store a resolution tag such as 72 or 300 PPI. Editing that number without resampling changes the suggested physical size, not the pixel dimensions.", "Resampling is different: software creates or removes pixels. Upsampling may help a workflow, but it cannot recover detail that the camera or original artwork never captured."] },
      { heading: "Calculate the number that answers the job", paragraphs: ["If the question is whether a 3600-pixel edge can print 12 inches, divide 3600 by 12: the result is 300 PPI. If the question is which printer mode or paper profile to select, follow the print provider's DPI and production instructions."] },
      { heading: "Keep the terms separate in a print workflow", paragraphs: ["Decide the trim size and crop first, calculate effective PPI from the remaining pixels, then compare that value with the provider's image-resolution requirement. Treat printer DPI as a separate device setting unless the provider explicitly connects the two."] },
    ],
    workflow: ["Confirm the final trim size and orientation.", "Apply the intended crop and note the remaining pixel dimensions.", "Calculate horizontal and vertical PPI; use the lower result.", "Compare that PPI with the printer's written file requirement."],
    mistakes: ["Calling every image-resolution number DPI", "Trusting a 300 PPI metadata tag without checking pixel dimensions", "Dividing printer DPI by a guessed factor to invent an image requirement"],
    faq: [
      { question: "Should an image be 300 DPI or 300 PPI?", answer: "For the raster image itself, 300 PPI is the accurate term: 300 image pixels are assigned to each printed inch. A printer may output at a much higher DPI because it uses multiple dots to reproduce those pixels." },
      { question: "Does changing 72 DPI to 300 DPI improve image quality?", answer: "Not if you only change the metadata value. The real pixel dimensions stay the same. If software resamples the image, it creates new pixels but does not restore missing captured detail." },
      { question: "Why do print shops still ask for 300 DPI files?", answer: "DPI is often used informally in customer instructions to mean image resolution. Ask whether the requirement means 300 image pixels per printed inch at the final trim size." },
    ],
    related: ["print-resolution-guide", "how-large-can-i-print-my-image", "aspect-ratio-cropping-print"],
    primaryCta: { label: "Calculate effective PPI", href: "/tools/dpi-ppi-calculator" },
    sources: [
      { label: "Adobe Photoshop — Image size and resolution", href: "https://helpx.adobe.com/photoshop/using/image-size-resolution.html" },
      { label: "Print Prep Lab calculation methodology", href: "/methodology" },
    ],
  },
  {
    slug: "how-large-can-i-print-my-image",
    title: "How Large Can I Print My Image? A Pixel-Based Guide",
    heading: "How Large Can You Print an Image Without Losing Quality?",
    description: "Use pixel dimensions and PPI to estimate a photo's maximum print size, then check the file at 150, 240 and 300 PPI.",
    takeaway: "Divide the usable post-crop pixel dimensions by the selected PPI target.",
    quickAnswer: "Divide image width and height in pixels by the target PPI. A 6000 × 4000 px image is 20 × 13.33 inches at 300 PPI, 25 × 16.67 inches at 240 PPI or 40 × 26.67 inches at 150 PPI before cropping.",
    formula: "maximum print inches = usable pixels ÷ target PPI",
    summary: [
      { label: "Close detail", value: "300 PPI", note: "6000 × 4000 px → 20 × 13.33 in" },
      { label: "Practical middle", value: "240 PPI", note: "6000 × 4000 px → 25 × 16.67 in" },
      { label: "Longer viewing", value: "150 PPI", note: "6000 × 4000 px → 40 × 26.67 in" },
    ],
    comparison: {
      caption: "Maximum size for a 6000 × 4000 px image before crop",
      headers: ["Target", "Maximum size", "Approx. centimetres", "Planning context"],
      rows: [
        ["300 PPI", "20 × 13.33 in", "50.8 × 33.9 cm", "Detailed, close-viewed print target"],
        ["240 PPI", "25 × 16.67 in", "63.5 × 42.3 cm", "Practical high-quality option when accepted"],
        ["150 PPI", "40 × 26.67 in", "101.6 × 67.7 cm", "Larger or more distant viewing; provider dependent"],
      ],
    },
    sections: [
      { heading: "Start with the real pixel dimensions", paragraphs: ["Find the width and height in pixels—not the file size in megabytes and not only the embedded DPI label. Those dimensions define the raster detail available for the final print.", "Megabytes change with compression, format, layers and metadata. Two files can have very different file sizes while containing the same number of printable pixels."] },
      { heading: "Choose a target for the actual product", paragraphs: ["Detailed prints viewed closely often target 300 PPI. A provider may accept 240 PPI for photographic work, while a larger display viewed farther away may use 150 PPI or another specified target.", "These are planning bands, not guarantees. Paper, sharpening, source quality, print process and viewing distance all affect the visible result."] },
      { heading: "Crop before calculating the final size", paragraphs: ["A 6000 × 4000 image has a 3:2 ratio. Filling a 4:5 print keeps 5000 × 4000 pixels and removes about 16.7% of the image area. At 300 PPI, the cropped image is therefore about 16.67 × 13.33 inches—not the uncropped 20 × 13.33 inches."] },
      { heading: "Resampling changes pixels, not the original capture", paragraphs: ["Downsampling removes pixels. Upsampling creates estimated pixels between existing ones. Good software can make enlargement artifacts less obvious, but entering a larger number does not reveal detail that was never recorded.", "Keep the original file, apply the final crop once, and export according to the provider's format, color and sharpening instructions."] },
      { heading: "Use the smaller limiting dimension", paragraphs: ["Calculate width and height separately. If a target frame or crop makes one direction fall below the intended PPI, that lower direction limits the whole print. This is why a full two-dimensional check is safer than dividing only the longest edge."] },
    ],
    workflow: ["Read the image's width and height in pixels.", "Choose the final print ratio and position the crop.", "Select the PPI target required for the product.", "Divide each remaining pixel dimension by that PPI and verify with the printer."],
    mistakes: ["Using file size in MB as a print-resolution measure", "Calculating before applying the final crop", "Treating 300 PPI as mandatory for every size and viewing distance"],
    faq: [
      { question: "Is 300 PPI always required for a good print?", answer: "No. It is a common detailed-print target, but larger prints viewed farther away may use a lower requirement. The print provider's specification should decide the target." },
      { question: "Does changing the DPI number make an image print larger?", answer: "Changing only the metadata changes the suggested physical size, not the available pixels. The image can be assigned a larger size, but its effective PPI falls." },
      { question: "Should maximum print size be calculated before or after cropping?", answer: "After cropping. Cropping removes pixels, so the final usable dimensions give the accurate effective PPI and maximum print size." },
      { question: "Can AI upscaling guarantee a larger high-quality print?", answer: "No. Upscaling can improve appearance in some files, but it estimates new pixels and cannot guarantee recovered original detail or a printer-specific result." },
    ],
    related: ["print-resolution-guide", "aspect-ratio-cropping-print", "dpi-vs-ppi"],
    primaryCta: { label: "Check your image now", href: "/tools/print-readiness-checker" },
    sources: [
      { label: "Adobe Photoshop — Image size and resolution", href: "https://helpx.adobe.com/photoshop/using/image-size-resolution.html" },
      { label: "Print Prep Lab calculation methodology", href: "/methodology" },
    ],
  },
  {
    slug: "print-resolution-guide",
    title: "Print Resolution Guide: 150 vs 240 vs 300 PPI",
    heading: "What Resolution Do You Need for Printing?",
    description: "Compare 150, 240 and 300 PPI for different print sizes and viewing distances, with formulas and practical examples.",
    takeaway: "300 PPI is a common high-detail target; print process and viewing distance can justify a different requirement.",
    quickAnswer: "Use the PPI requested by the print provider. As a planning guide, 300 PPI suits detailed work viewed closely, 240 PPI can be a practical photographic middle ground, and 150 PPI may suit larger work viewed farther away.",
    formula: "required pixels = print inches × target PPI",
    summary: [
      { label: "Detailed", value: "300 PPI", note: "8 × 10 in → 2400 × 3000 px" },
      { label: "Middle", value: "240 PPI", note: "8 × 10 in → 1920 × 2400 px" },
      { label: "Distance", value: "150 PPI", note: "8 × 10 in → 1200 × 1500 px" },
    ],
    comparison: {
      caption: "Pixel requirements for an 8 × 10 inch print",
      headers: ["Target", "Required pixels", "Approx. megapixels", "Use context"],
      rows: [
        ["300 PPI", "2400 × 3000", "7.2 MP", "Detailed photos and material viewed closely"],
        ["240 PPI", "1920 × 2400", "4.6 MP", "Strong photographic detail when the provider accepts it"],
        ["150 PPI", "1200 × 1500", "1.8 MP", "Larger or more distant viewing; fine detail is less forgiving"],
      ],
    },
    sections: [
      { heading: "300 PPI for detailed, close-viewed work", paragraphs: ["Three hundred PPI is a common target for photographs, brochures, books and other material viewed at arm's length. It gives fine image detail a dense source without implying that the printer itself outputs only 300 dots per inch.", "It is still a target, not proof of quality. Focus, compression, sharpening, paper and production settings matter too."] },
      { heading: "240 PPI as a practical middle ground", paragraphs: ["Many photographs can reproduce with strong detail at 240 PPI. It is useful when a file narrowly misses 300 PPI or when a larger print is needed without aggressive upsampling.", "Acceptance is product specific. A print lab may allow it for photos but require more for small type, line art or a different process."] },
      { heading: "150 PPI for larger or more distant viewing", paragraphs: ["Posters and display graphics viewed from farther away may use 150 PPI or another lower requirement. The viewing distance reduces how easily a person can resolve individual image pixels.", "Small typography, QR codes and fine line work are less forgiving than broad photographic detail. Keep vector elements vector when the production workflow supports them."] },
      { heading: "Viewing distance changes the decision", paragraphs: ["A small print invites close inspection, while a large wall piece is often viewed from several feet away. That does not make every low-resolution enlargement acceptable; it explains why one target cannot describe every print product."] },
      { heading: "The printer's requirement is the final gate", paragraphs: ["Ask for the final trim size, bleed, preferred file format, color profile and minimum or recommended image PPI. Calculate from the post-crop pixels and avoid promising a result based on a generic threshold alone."] },
    ],
    workflow: ["Choose the final physical trim size.", "Confirm the provider's minimum and recommended PPI.", "Multiply each printed inch by the target PPI.", "Compare the required dimensions with the usable pixels after crop."],
    mistakes: ["Using 72 or 96 PPI screen conventions as a print-quality rule", "Assuming 300 PPI guarantees sharp focus or clean compression", "Ignoring viewing distance, print process and fine non-photographic detail"],
    faq: [
      { question: "What PPI should I use for photo printing?", answer: "Use the lab's requirement. Three hundred PPI is a common detailed-photo target; 240 PPI may be accepted for many products, and lower targets can suit larger viewing distances." },
      { question: "Is 150 PPI too low for printing?", answer: "Not automatically. It may work for larger pieces viewed farther away, but it is less forgiving for close viewing, text and fine line detail. Confirm it with the provider." },
      { question: "Does more than 300 PPI always improve a print?", answer: "No. Extra pixels may be ignored or resampled by the workflow, and the visible result is limited by the source detail, printer, paper and viewing conditions." },
    ],
    related: ["how-large-can-i-print-my-image", "dpi-vs-ppi", "aspect-ratio-cropping-print"],
    primaryCta: { label: "Convert pixels to print size", href: "/tools/pixels-to-print-size" },
    sources: [
      { label: "Adobe Photoshop — Image size and resolution", href: "https://helpx.adobe.com/photoshop/using/image-size-resolution.html" },
      { label: "Adobe — Understanding image resolution", href: "https://www.adobe.com/creativecloud/photography/discover/image-resolution.html" },
    ],
  },
  {
    slug: "bleed-trim-safe-area",
    title: "Bleed, Trim and Safe Area: A Practical Print Guide",
    heading: "Bleed, Trim and Safe Area Explained",
    description: "Understand bleed, trim size and safe area, including common margins and a step-by-step setup workflow for print files.",
    takeaway: "Bleed sits outside the final cut; the safe area sits inside it. Both values come from the printer.",
    quickAnswer: "Trim is the finished cut size. Bleed extends backgrounds beyond that cut. The safe area keeps text, logos and faces inside the trim. Add bleed to both edges of each dimension and use the exact values supplied by the printer.",
    formula: "full canvas = trim + (2 × bleed)",
    summary: [
      { label: "Outside cut", value: "Bleed", note: "Background extension beyond trim" },
      { label: "Finished edge", value: "Trim", note: "The intended final product size" },
      { label: "Inside cut", value: "Safe area", note: "Protected zone for important content" },
    ],
    comparison: {
      caption: "A4 example using 3 mm bleed and a 5 mm safe margin",
      headers: ["Box", "Dimensions", "Position", "Purpose"],
      rows: [
        ["Bleed canvas", "216 × 303 mm", "3 mm outside every trim edge", "Avoid unwanted white edges after cutting"],
        ["Trim", "210 × 297 mm", "Final cut line", "Define the finished A4 size"],
        ["Safe area", "200 × 287 mm", "5 mm inside every trim edge", "Protect text, logos and critical details"],
      ],
    },
    visual: "bleed-boxes",
    sections: [
      { heading: "Trim is the finished size", paragraphs: ["Trim is the line where the printed piece is intended to be cut. An A4 finished piece is 210 × 297 mm at trim, even though the exported artwork may be larger because it includes bleed.", "Do not describe the bleed canvas as the finished product size. Keep both values clearly named in the document and order specifications."] },
      { heading: "Bleed protects edge-to-edge backgrounds", paragraphs: ["Cutting is a physical process with tolerance. Extending photos, colors and backgrounds past the trim prevents a thin white edge when the cut shifts slightly.", "If bleed is 3 mm on every edge, add 6 mm to both total dimensions. A4 therefore becomes a 216 × 303 mm artwork canvas before export."] },
      { heading: "Safe area protects important content", paragraphs: ["Move text, logos, faces and other critical details inward from the trim by the provider's safe-margin value. A 5 mm margin on A4 leaves a 200 × 287 mm safe box.", "Safe area is not a substitute for bleed: one sits inside the trim and the other extends outside it."] },
      { heading: "Margins differ by product and provider", paragraphs: ["Three millimetres and 0.125 inch are common examples, not universal standards. Bound books, folded pieces, banners and special finishing can require asymmetric or much larger allowances.", "Use the downloadable template or written specification for the exact product whenever one is available."] },
      { heading: "Export and inspect the final file", paragraphs: ["Extend every edge-to-edge element to the bleed boundary, keep important content inside the safe area, and export the full bleed canvas at the requested resolution. Inspect the PDF or image at high zoom before sending it."] },
    ],
    workflow: ["Set the final trim width and height.", "Enter the required bleed for every edge.", "Extend backgrounds and images to the bleed boundary.", "Keep important content inside the specified safe margin.", "Export the full canvas and verify marks/settings with the provider."],
    mistakes: ["Adding bleed only once instead of to both opposite edges", "Stopping backgrounds at the trim line", "Placing text inside the bleed or assuming every printer uses 3 mm"],
    faq: [
      { question: "Is 3 mm bleed always enough?", answer: "No. It is a common example for some print products, but the printer's template or written specification must decide the real value." },
      { question: "Does bleed increase the finished paper size?", answer: "No. Bleed increases the artwork canvas before cutting. The trimmed product remains at the ordered final size." },
      { question: "Should crop marks be inside the bleed?", answer: "Usually crop marks sit outside the bleed and are created by the export workflow. Follow the provider's PDF preset or instructions rather than drawing marks manually." },
      { question: "Is safe area the same as a design margin?", answer: "They can overlap, but the safe area is a production protection zone. A design may use a larger visual margin for composition and readability." },
    ],
    related: ["print-resolution-guide", "aspect-ratio-cropping-print", "how-large-can-i-print-my-image"],
    primaryCta: { label: "Calculate your document boxes", href: "/tools/bleed-safe-area-calculator" },
    sources: [
      { label: "Adobe — Print bleed explained", href: "https://www.adobe.com/creativecloud/design/discover/print-bleed.html" },
      { label: "Print Prep Lab calculation methodology", href: "/methodology" },
    ],
  },
  {
    slug: "aspect-ratio-cropping-print",
    title: "Photo Print Aspect Ratios and Cropping Explained",
    heading: "Why Photos Crop at Different Print Sizes",
    description: "Compare common camera and print aspect ratios, see which sizes fit, and learn when to crop, add borders or choose another print.",
    takeaway: "A print fills without cropping only when the image and paper share the same aspect ratio.",
    quickAnswer: "Match the source and print aspect ratios to avoid cropping. A common 3:2 photo fits 4 × 6 and 12 × 18, loses about 6.7% at 5 × 7, and loses about 16.7% at 8 × 10 or 16 × 20 when the print is filled edge to edge.",
    formula: "crop % = 100 × (1 − retained aspect fraction)",
    summary: [
      { label: "Exact 3:2 fit", value: "4 × 6", note: "No ratio crop after orientation is matched" },
      { label: "Small crop", value: "5 × 7", note: "About 6.7% removed from a 3:2 image" },
      { label: "4:5 crop", value: "8 × 10", note: "About 16.7% removed from a 3:2 image" },
    ],
    comparison: {
      caption: "How a 3:2 camera image fits common edge-to-edge prints",
      headers: ["Print size", "Print ratio", "Image retained", "Likely decision"],
      rows: [
        ["4 × 6", "2:3", "100%", "Direct fit after orientation is matched"],
        ["5 × 7", "5:7", "About 93.3%", "Small crop or narrow borders"],
        ["8 × 10", "4:5", "About 83.3%", "Reposition the 16.7% crop carefully"],
        ["11 × 14", "11:14", "About 84.8%", "Preview the non-standard crop"],
        ["12 × 18", "2:3", "100%", "Direct 3:2 enlargement"],
        ["16 × 20", "4:5", "About 83.3%", "Same shape and crop as 8 × 10"],
      ],
    },
    sections: [
      { heading: "Aspect ratio describes shape, not size", paragraphs: ["A 4 × 6 and a 12 × 18 have the same 2:3 ratio even though one is much larger. An 8 × 10 and a 16 × 20 both use 4:5, so they share a shape but require different pixel counts.", "Orientation does not change the ratio match. A 3:2 landscape becomes 2:3 in portrait while keeping the same proportions."] },
      { heading: "Fill, fit or add a border", paragraphs: ["Fill covers the paper and crops image content that falls outside the target ratio. Fit shows the complete image and can leave borders on two sides. Expanding the canvas creates a deliberate border while preserving the source composition.", "None is automatically correct. The subject placement, frame, lab product and intended design decide the best option."] },
      { heading: "Crop position protects the subject", paragraphs: ["A centered crop is only a mathematical default. Faces, text, horizons and important objects may need the crop shifted horizontally or vertically.", "Preview the exact print ratio, then inspect the edges at the final size. Labs can also apply a small production crop for borderless output."] },
      { heading: "Cropping changes effective PPI", paragraphs: ["Cropping removes pixels. A 6000 × 4000 px 3:2 image cropped to 4:5 retains approximately 5000 × 4000 px. Calculate print resolution from those remaining dimensions, not from the original file."] },
      { heading: "Choose a ratio-friendly size when composition matters", paragraphs: ["If an edge-to-edge crop damages the image, choose a print that matches the camera ratio, add a border, or extend the canvas intentionally. A 3:2 source naturally fits 4 × 6, 12 × 18 and other 2:3 sizes."] },
    ],
    workflow: ["Identify the source image ratio.", "Select the exact print size and orientation.", "Compare fill and fit, then position the subject-safe crop.", "Calculate effective PPI from the pixels that remain."],
    mistakes: ["Assuming every common photo size uses the same ratio", "Checking resolution before applying the crop", "Letting an automatic center crop remove faces or text"],
    faq: [
      { question: "Why does an 8 × 10 crop a 4 × 6 photo?", answer: "A 4 × 6 uses a 2:3 ratio, while 8 × 10 uses 4:5. Filling the 4:5 print removes about 16.7% of a 3:2 image area." },
      { question: "Which print sizes fit a 3:2 camera image?", answer: "Sizes such as 4 × 6 and 12 × 18 share the 2:3 shape. Other products may still apply a small production crop for borderless output." },
      { question: "Can I avoid cropping by adding borders?", answer: "Yes. Fit the whole image inside the print ratio and leave or design the remaining border area. Confirm how the lab handles borders before ordering." },
      { question: "Does moving the crop change the cropped percentage?", answer: "No. Position changes which content is removed, while the ratio determines how much area is removed for a fill crop." },
    ],
    related: ["how-large-can-i-print-my-image", "print-resolution-guide", "bleed-trim-safe-area"],
    primaryCta: { label: "Preview your crop", href: "/tools/aspect-ratio-crop-preview" },
    sources: [
      { label: "Print Prep Lab crop calculation methodology", href: "/methodology" },
      { label: "Interactive aspect-ratio crop preview", href: "/tools/aspect-ratio-crop-preview" },
    ],
  },
];

export const TRUST_PAGES: Record<string, { title: string; description: string; sections: Array<{ heading: string; paragraphs: string[] }> }> = {
  about: {
    title: "About Print Prep Lab",
    description: "A focused set of tools for turning image dimensions into clear, inspectable print decisions.",
    sections: [
      { heading: "Why this site exists", paragraphs: ["Print questions often mix pixels, DPI, PPI, paper size and crop into one confusing answer. Print Prep Lab separates those decisions and shows the inputs behind every result.", "The initial audience is students, photographers, artists, Canva users and print customers who need a reliable plan before placing an order."] },
      { heading: "What this site does not promise", paragraphs: ["A browser calculator cannot inspect a printer, ink, paper profile, sharpening method or production tolerance. Results are planning guidance and should be checked against the provider's specification."] },
    ],
  },
  methodology: {
    title: "Calculation Methodology",
    description: "The formulas, rounding rules and quality labels used throughout Print Prep Lab.",
    sections: [
      { heading: "Core conversions", paragraphs: ["One inch equals exactly 25.4 millimetres. Pixels required equals physical inches multiplied by the selected PPI. Physical print inches equals pixels divided by PPI.", "All displayed pixel dimensions are rounded to the nearest whole pixel only after calculation from the stored physical measurement. Pixel inputs are restricted to positive whole numbers; physical sizes and PPI must also be positive."] },
      { heading: "Effective PPI for a filled print", paragraphs: ["Horizontal PPI equals pixel width divided by printed width in inches. Vertical PPI uses height. For a fill-to-size result, the lower value is reported because it is the limiting dimension."] },
      { heading: "Quality labels", paragraphs: ["Meets target allows a 0.1% tolerance for unavoidable whole-pixel rounding. Close to target means at least 80% of the chosen target; Limited means at least 50%. These labels compare numbers and do not certify a print process."] },
      { heading: "Crop percentage", paragraphs: ["The crop estimate compares source and target aspect ratios. It reports the image-area fraction retained by a centered fill crop. Manual crop position changes which content is removed, not the calculated area fraction."] },
    ],
  },
  sources: {
    title: "Sources & Reference Policy",
    description: "Primary references used for physical standards, image resolution concepts and print setup guidance.",
    sections: [
      { heading: "Physical dimensions", paragraphs: ["ISO A-series trim dimensions are based on ISO 216:2007. North American and photo dimensions are stored in their native inches and converted using the NIST-defined exact relationship of 25.4 millimetres per inch."] },
      { heading: "Resolution terminology", paragraphs: ["Adobe Photoshop documentation is used as a reference for pixel dimensions, PPI, physical print size and resampling concepts. Printer-specific bleed and resolution requirements always take precedence over generic guidance."] },
      { heading: "Verification policy", paragraphs: ["Calculation rules, standard presets, unit conversions, rounding boundaries and invalid-input behavior are covered by deterministic tests. Source-dependent guidance is dated and should be rechecked when documentation or industry practice changes."] },
    ],
  },
  privacy: {
    title: "Privacy",
    description: "How Print Prep Lab handles images, calculator inputs and browser data.",
    sections: [
      { heading: "Image processing", paragraphs: ["The print-readiness checker reads image dimensions and generates the crop preview in your browser. The selected image is not uploaded to a Print Prep Lab server.", "Closing or replacing the image releases its temporary browser preview. The current version does not create an account or store an image library."] },
      { heading: "Calculator inputs", paragraphs: ["Pixel counts, physical sizes, PPI, bleed and safe-margin values are used in the page session to calculate results. Do not enter confidential information because none is required."] },
      { heading: "Future advertising or analytics", paragraphs: ["If analytics, advertising or consent-managed cookies are introduced, this policy and the interface must be updated before those services are enabled."] },
    ],
  },
  terms: {
    title: "Terms of Use",
    description: "Important limits for using print calculations and reference information from this site.",
    sections: [
      { heading: "Planning guidance", paragraphs: ["Results are provided for general planning and education. They are not a production guarantee, printer certification or substitute for a proof supplied by a professional print provider."] },
      { heading: "Your production responsibility", paragraphs: ["Confirm final size, bleed, safe area, color mode, profile, file format and resolution with the company producing the work. Save an editable source file before resizing or cropping."] },
      { heading: "Reasonable use", paragraphs: ["You may use the calculators for personal, educational and commercial print planning. Do not present the site's guidance as a guarantee from a third-party printer."] },
    ],
  },
  contact: {
    title: "Contact & Calculation Reports",
    description: "Prepare a useful issue report when a result appears wrong or a print format is missing.",
    sections: [
      { heading: "Report the inputs, not the image", paragraphs: ["A useful calculation report includes the page used, pixel width and height, physical width and height, unit, PPI, orientation, bleed and the result you expected.", "You never need to send the private image itself to explain a dimension calculation."] },
      { heading: "Before reporting a discrepancy", paragraphs: ["Check that width and height were not reversed, confirm portrait or landscape, and distinguish trim size from the full bleed canvas. Include the printer's written requirement when it conflicts with a general default."] },
      { heading: "Contact channel", paragraphs: ["A verified public contact address will be connected before the independent-domain launch. Until then, keep the generated input summary with the project feedback channel where you received this site."] },
    ],
  },
};
