import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, FaqList, PageCta, PageHero } from "@/components/content-shell";
import { ToolCalculator } from "@/components/tool-calculators";
import { PRINT_PRESETS, formatDecimal, mmToInches, pixelsForMm } from "@/lib/print-math";
import { SIZE_DETAILS } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";

const ppiRows = [72, 96, 150, 240, 300, 600];
type FeaturedSizeContent = {
  seoTitle: string;
  heading: string;
  metaDescription: string;
  quickAnswer: string;
  formulaLine: string;
  insights: Array<{ label: string; heading: string; text: string; href?: string; linkLabel?: string }>;
  extraFaq: { question: string; answer: string };
};

const FEATURED_SIZE_CONTENT: Record<string, FeaturedSizeContent> = {
  a2: {
    seoTitle: "A2 Size in Pixels, Inches, Cm & Mm",
    heading: "A2 Size in Pixels and Print Dimensions",
    metaDescription: "Find A2 dimensions and exact pixel sizes at common resolutions for posters, art prints and large-format layouts.",
    quickAnswer: "A2 measures exactly 420 × 594 mm (42 × 59.4 cm), or approximately 16.54 × 23.39 inches. At 300 PPI, portrait A2 rounds to 4961 × 7016 pixels.",
    formulaLine: "300 PPI: 4961 × 7016 px · ISO 216 trim",
    insights: [
      { label: "Poster planning", heading: "Resolution depends on viewing distance", text: "A2 is 2480 × 3508 px at 150 PPI, 3969 × 5613 px at 240 PPI and 4961 × 7016 px at 300 PPI. Confirm the production target with the print provider.", href: "/tools/print-readiness-checker", linkLabel: "Check an actual image" },
      { label: "A2 vs A3", heading: "A2 has twice the area of A3", text: "Folding A2 in half along its long edge produces A3. Both formats keep the ISO 1:√2 aspect ratio, so layouts scale proportionally.", href: "/sizes/a3", linkLabel: "Compare A3" },
      { label: "Bleed example", heading: "A2 with 3 mm bleed", text: "Adding 3 mm on every edge creates a 426 × 600 mm artwork canvas, which rounds to 5031 × 7087 pixels at 300 PPI.", href: "/tools/bleed-safe-area-calculator", linkLabel: "Calculate another margin" },
    ],
    extraFaq: { question: "How many pixels should an A2 poster have?", answer: "For the 420 × 594 mm trim, A2 needs 2480 × 3508 px at 150 PPI, 3969 × 5613 px at 240 PPI or 4961 × 7016 px at 300 PPI. Add bleed separately when required." },
  },
  a3: {
    seoTitle: "A3 Size in Pixels, Inches, Cm & Mm",
    heading: "A3 Size in Pixels and Print Dimensions",
    metaDescription: "A3 is 297 × 420 mm and 3508 × 4961 px at 300 PPI. See inches, centimetres, multiple resolutions, poster guidance and bleed size.",
    quickAnswer: "A3 measures exactly 297 × 420 mm (29.7 × 42 cm), or approximately 11.69 × 16.54 inches. At 300 PPI, portrait A3 rounds to 3508 × 4961 pixels.",
    formulaLine: "300 PPI: 3508 × 4961 px · ISO 216 trim",
    insights: [
      { label: "Poster planning", heading: "Choose PPI for the real viewing distance", text: "A3 is 1754 × 2480 px at 150 PPI, 2806 × 3969 px at 240 PPI and 3508 × 4961 px at 300 PPI. Confirm the target with the print provider.", href: "/tools/print-readiness-checker", linkLabel: "Check an actual image" },
      { label: "A3 vs A4", heading: "A3 has twice the area of A4", text: "Folding A3 in half along its long edge produces A4. Both formats keep the ISO 1:√2 aspect ratio, so layouts can scale proportionally.", href: "/sizes/a4", linkLabel: "Compare A4" },
      { label: "Bleed example", heading: "A3 with 3 mm bleed", text: "Adding 3 mm on every edge creates a 303 × 426 mm artwork canvas, which rounds to 3579 × 5031 pixels at 300 PPI.", href: "/tools/bleed-safe-area-calculator", linkLabel: "Calculate another margin" },
    ],
    extraFaq: { question: "How many pixels does an A3 poster need?", answer: "For the 297 × 420 mm trim, A3 needs 1754 × 2480 px at 150 PPI, 2806 × 3969 px at 240 PPI or 3508 × 4961 px at 300 PPI. Add bleed separately when required." },
  },
  a4: {
    seoTitle: "A4 Size in Pixels, Inches, Cm & Mm",
    heading: "A4 Size in Pixels and Print Dimensions",
    metaDescription: "A4 is 210 × 297 mm and 2480 × 3508 px at 300 PPI. See inches, centimetres, multiple resolutions, bleed and A4 vs US Letter.",
    quickAnswer: "A4 measures exactly 210 × 297 mm (21 × 29.7 cm), or approximately 8.27 × 11.69 inches. At 300 PPI, portrait A4 rounds to 2480 × 3508 pixels.",
    formulaLine: "300 PPI: 2480 × 3508 px · trim size only",
    insights: [
      { label: "A4 vs Letter", heading: "Similar, not interchangeable", text: "US Letter is 5.9 mm wider and 17.6 mm shorter than A4 in portrait orientation. A full-page layout can reflow or crop when switched between them.", href: "/sizes/us-letter", linkLabel: "Compare US Letter" },
      { label: "Bleed example", heading: "A4 with 3 mm bleed", text: "Adding 3 mm on every edge creates a 216 × 303 mm artwork canvas, which rounds to 2551 × 3579 pixels at 300 PPI.", href: "/tools/bleed-safe-area-calculator", linkLabel: "Calculate another margin" },
      { label: "Common mistake", heading: "Pixels are not the paper standard", text: "ISO 216 defines the physical A4 trim. Pixel dimensions exist only after you choose a PPI, and bleed is a separate production value." },
    ],
    extraFaq: { question: "Is A4 the same as 8.5 × 11 inch Letter paper?", answer: "No. A4 is 210 × 297 mm, while US Letter is 215.9 × 279.4 mm. Letter is slightly wider and noticeably shorter." },
  },
  a5: {
    seoTitle: "A5 Size in Pixels, Inches, Cm & Mm",
    heading: "A5 Size in Pixels and Print Dimensions",
    metaDescription: "A5 is 148 × 210 mm and 1748 × 2480 px at 300 PPI. See inches, centimetres, PPI values, A5 vs A4 and 3 mm bleed.",
    quickAnswer: "A5 measures exactly 148 × 210 mm (14.8 × 21 cm), or approximately 5.83 × 8.27 inches. At 300 PPI, portrait A5 rounds to 1748 × 2480 pixels.",
    formulaLine: "300 PPI: 1748 × 2480 px · ISO 216 trim",
    insights: [
      { label: "Small print", heading: "Useful for flyers and invitations", text: "A5 needs 874 × 1240 px at 150 PPI, 1398 × 1984 px at 240 PPI or 1748 × 2480 px at 300 PPI before bleed.", href: "/tools/paper-size-pixels-calculator", linkLabel: "Try another resolution" },
      { label: "A5 vs A4", heading: "One A4 sheet folds to two A5 pages", text: "A5 has half the area of A4 and keeps the same ISO 1:√2 shape. This makes it practical for booklets, notepads and folded handouts.", href: "/sizes/a4", linkLabel: "Open A4 dimensions" },
      { label: "Bleed example", heading: "A5 with 3 mm bleed", text: "Adding 3 mm on every edge creates a 154 × 216 mm canvas, equal to 1819 × 2551 pixels at 300 PPI after rounding.", href: "/tools/bleed-safe-area-calculator", linkLabel: "Plan bleed and safe area" },
    ],
    extraFaq: { question: "Is A5 exactly half of A4?", answer: "A5 is half the area of A4 and keeps the same 1:√2 aspect ratio. Its standard trim is 148 × 210 mm; the one-millimetre rounding in the ISO series is intentional." },
  },
  "us-letter": {
    seoTitle: "US Letter Size in Pixels, Inches, Cm & Mm",
    heading: "US Letter Size in Pixels and Print Dimensions",
    metaDescription: "US Letter is 8.5 × 11 inches and 2550 × 3300 px at 300 PPI. See other resolutions, millimetres, Letter vs A4 and bleed size.",
    quickAnswer: "US Letter measures exactly 8.5 × 11 inches, or 215.9 × 279.4 mm (21.59 × 27.94 cm). At 300 PPI, portrait Letter is exactly 2550 × 3300 pixels.",
    formulaLine: "300 PPI: 2550 × 3300 px · 8.5 × 11 in trim",
    insights: [
      { label: "Letter vs A4", heading: "Letter is wider and shorter", text: "US Letter is 5.9 mm wider and 17.6 mm shorter than A4 in portrait orientation. Full-page A4 artwork should be checked before printing on Letter.", href: "/sizes/a4", linkLabel: "Compare A4" },
      { label: "Resolution", heading: "Exact pixels from native inches", text: "Letter is 1275 × 1650 px at 150 PPI, 2040 × 2640 px at 240 PPI and 2550 × 3300 px at 300 PPI.", href: "/tools/paper-size-pixels-calculator", linkLabel: "Change the PPI" },
      { label: "Bleed example", heading: "Letter with 0.125 inch bleed", text: "Adding 0.125 inch on every edge creates an 8.75 × 11.25 inch canvas, or 2625 × 3375 pixels at 300 PPI.", href: "/tools/bleed-safe-area-calculator", linkLabel: "Calculate printer margins" },
    ],
    extraFaq: { question: "Is US Letter the same as A4?", answer: "No. Letter is 8.5 × 11 inches (215.9 × 279.4 mm), while A4 is 210 × 297 mm. Letter is wider, but A4 is taller." },
  },
  "us-legal": {
    seoTitle: "US Legal Size in Pixels, Inches, Cm & Mm",
    heading: "US Legal Size in Pixels and Print Dimensions",
    metaDescription: "Find 8.5×14 inch US Legal dimensions and exact pixel sizes at 72, 96, 150, 240 and 300 PPI.",
    quickAnswer: "US Legal measures exactly 8.5 × 14 inches, or 215.9 × 355.6 mm (21.59 × 35.56 cm). At 300 PPI, portrait Legal is exactly 2550 × 4200 pixels.",
    formulaLine: "300 PPI: 2550 × 4200 px · 8.5 × 14 in trim",
    insights: [
      { label: "Legal vs Letter", heading: "The same width, three inches taller", text: "US Legal and US Letter are both 8.5 inches wide. Legal is 3 inches (76.2 mm) taller, so full-page Letter layouts do not simply scale to Legal.", href: "/sizes/us-letter", linkLabel: "Compare US Letter" },
      { label: "Resolution", heading: "Exact pixels from native inches", text: "US Legal is 1275 × 2100 px at 150 PPI, 2040 × 3360 px at 240 PPI and 2550 × 4200 px at 300 PPI.", href: "/tools/paper-size-pixels-calculator", linkLabel: "Change the PPI" },
      { label: "Bleed example", heading: "Legal with 0.125 inch bleed", text: "Adding 0.125 inch on every edge creates an 8.75 × 14.25 inch canvas, or 2625 × 4275 pixels at 300 PPI.", href: "/tools/bleed-safe-area-calculator", linkLabel: "Calculate printer margins" },
    ],
    extraFaq: { question: "What is the difference between Legal and Letter paper?", answer: "Both are 8.5 inches wide, but US Legal is 14 inches tall while US Letter is 11 inches tall. Legal therefore needs 900 more vertical pixels at 300 PPI." },
  },
  "4x6-photo": {
    seoTitle: "4×6 Photo Size in Pixels at 300 PPI",
    heading: "4×6 Photo Size: Pixels, Inches and Aspect Ratio",
    metaDescription: "A 4×6 photo needs 1200 × 1800 pixels at 300 PPI. See other quality levels, its 2:3 aspect ratio, crop guidance and bleed size.",
    quickAnswer: "A 4 × 6 inch photo measures 101.6 × 152.4 mm. It needs 1200 × 1800 pixels at 300 PPI, and its 2:3 aspect ratio matches many camera files.",
    formulaLine: "300 PPI: 1200 × 1800 px · aspect ratio 2:3",
    insights: [
      { label: "Aspect fit", heading: "A natural match for 3:2 cameras", text: "A landscape 3:2 image fills a 6 × 4 print without ratio crop. Portrait uses the same pixel values in reverse order.", href: "/tools/aspect-ratio-crop-preview", linkLabel: "Preview your framing" },
      { label: "Quality range", heading: "Minimum depends on the target", text: "The same 4 × 6 trim is 600 × 900 px at 150 PPI, 960 × 1440 px at 240 PPI and 1200 × 1800 px at 300 PPI.", href: "/tools/print-readiness-checker", linkLabel: "Check an actual image" },
      { label: "Before ordering", heading: "Check lab cropping and borders", text: "A lab may slightly crop for edge-to-edge output. Keep faces and text away from the edge and confirm whether the product includes a border." },
    ],
    extraFaq: { question: "Will a 3:2 camera photo crop at 4 × 6?", answer: "Normally no ratio crop is needed because 4 × 6 simplifies to 2:3, the same shape as a 3:2 image after orientation is matched. A lab may still apply a small production crop." },
  },
  "5x7-photo": {
    seoTitle: "5×7 Photo Size in Pixels at 300 PPI",
    heading: "5×7 Photo Size: Pixels, Inches and Aspect Ratio",
    metaDescription: "A 5×7 photo needs 1500 × 2100 pixels at 300 PPI. See dimensions, other PPI values and the likely crop from a 3:2 camera image.",
    quickAnswer: "A 5 × 7 inch photo measures 127 × 177.8 mm and needs 1500 × 2100 pixels at 300 PPI. Its 5:7 ratio crops about 6.7% of a typical 3:2 camera frame when filled edge to edge.",
    formulaLine: "300 PPI: 1500 × 2100 px · aspect ratio 5:7",
    insights: [
      { label: "Crop warning", heading: "A 3:2 photo loses about 6.7%", text: "A 3:2 image is slightly wider than a 5:7 frame. Filling the print retains about 93.3% of the image area; fitting the whole image may leave borders.", href: "/tools/aspect-ratio-crop-preview", linkLabel: "Preview the 5 × 7 crop" },
      { label: "Quality range", heading: "Three practical pixel targets", text: "A 5 × 7 needs 750 × 1050 px at 150 PPI, 1200 × 1680 px at 240 PPI or 1500 × 2100 px at 300 PPI.", href: "/tools/print-readiness-checker", linkLabel: "Check your file" },
      { label: "Before ordering", heading: "Protect faces and text near the edge", text: "Photo labs can apply a small production crop beyond the ratio calculation. Keep critical details away from the edge and confirm border options." },
    ],
    extraFaq: { question: "Will a 4 × 6 photo crop when printed at 5 × 7?", answer: "Usually yes when printed edge to edge. A 4 × 6 uses a 2:3 ratio, while 5 × 7 uses 5:7, so about 6.7% of a 3:2 image area is removed in a fill crop." },
  },
  "8x10-photo": {
    seoTitle: "8×10 Photo Size in Pixels at 300 PPI",
    heading: "8×10 Photo Size: Pixels, Inches and Crop Ratio",
    metaDescription: "An 8×10 photo needs 2400 × 3000 pixels at 300 PPI. See its 4:5 ratio, other PPI values and the crop from common 3:2 images.",
    quickAnswer: "An 8 × 10 inch photo measures 203.2 × 254 mm and needs 2400 × 3000 pixels at 300 PPI. Its 4:5 aspect ratio is less wide than a common 3:2 camera image.",
    formulaLine: "300 PPI: 2400 × 3000 px · aspect ratio 4:5",
    insights: [
      { label: "Crop warning", heading: "A 3:2 image loses about 16.7%", text: "Filling an 8 × 10 frame with a 3:2 image retains about 83.3% of the image area. Reposition the crop to protect the subject.", href: "/tools/aspect-ratio-crop-preview", linkLabel: "Preview the 8 × 10 crop" },
      { label: "Quality range", heading: "Compare practical pixel targets", text: "An 8 × 10 requires 1200 × 1500 px at 150 PPI, 1920 × 2400 px at 240 PPI or 2400 × 3000 px at 300 PPI.", href: "/tools/print-readiness-checker", linkLabel: "Check your file" },
      { label: "Related format", heading: "16 × 20 uses the same 4:5 shape", text: "Once an image is cropped to 4:5, it also fits a 16 × 20 frame by ratio—but the larger print needs more pixels for the same PPI." , href: "/sizes/16x20-photo", linkLabel: "Open 16 × 20" },
    ],
    extraFaq: { question: "Why does an 8 × 10 crop a 4 × 6 photo?", answer: "A 4 × 6 is 2:3 while an 8 × 10 is 4:5. To fill 8 × 10 without borders, part of the longer dimension must be removed." },
  },
  "11x14-photo": {
    seoTitle: "11×14 Photo Size in Pixels at 300 PPI",
    heading: "11×14 Photo Size: Pixels, Resolution and Crop",
    metaDescription: "An 11×14 print needs 3300×4200 pixels at 300 PPI. See other PPI values and preview how common photos will crop.",
    quickAnswer: "An 11 × 14 inch print measures 279.4 × 355.6 mm and needs 3300 × 4200 pixels at 300 PPI. Its 11:14 ratio crops about 15.2% of a common 3:2 camera image when filled edge to edge.",
    formulaLine: "300 PPI: 3300 × 4200 px · aspect ratio 11:14",
    insights: [
      { label: "Crop warning", heading: "A 3:2 image loses about 15.2%", text: "Filling an 11 × 14 frame with a 3:2 photo retains about 84.8% of the image area. Reposition the crop to keep important details inside the frame.", href: "/tools/aspect-ratio-crop-preview", linkLabel: "Preview the 11 × 14 crop" },
      { label: "Quality range", heading: "Three practical pixel targets", text: "An 11 × 14 needs 1650 × 2100 px at 150 PPI, 2640 × 3360 px at 240 PPI or 3300 × 4200 px at 300 PPI.", href: "/tools/print-readiness-checker", linkLabel: "Check your file" },
      { label: "Related format", heading: "A 4:5 image needs only a small crop", text: "Moving from a 4:5 image to 11:14 removes about 1.8% of the image area, making it a much closer fit than a 3:2 camera frame.", href: "/sizes/8x10-photo", linkLabel: "Compare 8 × 10" },
    ],
    extraFaq: { question: "Is 11 × 14 the same aspect ratio as 8 × 10?", answer: "No. 11 × 14 uses an 11:14 ratio, while 8 × 10 simplifies to 4:5. The shapes are close, but an edge-to-edge print still needs a small crop or border." },
  },
  "12x18-photo": {
    seoTitle: "12×18 Photo Size in Pixels at 300 PPI",
    heading: "12×18 Photo Size: Pixels, Resolution and Ratio",
    metaDescription: "A 12×18 print needs 3600×5400 pixels at 300 PPI and preserves the common 3:2 camera aspect ratio.",
    quickAnswer: "A 12 × 18 inch print measures 304.8 × 457.2 mm and needs 3600 × 5400 pixels at 300 PPI. Its 2:3 aspect ratio matches common 3:2 camera images after orientation is matched.",
    formulaLine: "300 PPI: 3600 × 5400 px · 19.44 megapixels",
    insights: [
      { label: "Aspect fit", heading: "A direct fit for 3:2 camera images", text: "A landscape 3:2 image fills an 18 × 12 print without ratio crop. Portrait uses the same dimensions in the opposite orientation.", href: "/tools/aspect-ratio-crop-preview", linkLabel: "Preview your framing" },
      { label: "Large-print range", heading: "Resolution changes the file requirement", text: "A 12 × 18 needs 1800 × 2700 px at 150 PPI, 2880 × 4320 px at 240 PPI or 3600 × 5400 px at 300 PPI.", href: "/tools/print-readiness-checker", linkLabel: "Check your large-print file" },
      { label: "Related format", heading: "The same shape as a 4 × 6 photo", text: "Both sizes use a 2:3 ratio. At the same PPI, 12 × 18 needs three times as many pixels along each edge as 4 × 6.", href: "/sizes/4x6-photo", linkLabel: "Compare 4 × 6" },
    ],
    extraFaq: { question: "Will a 3:2 camera photo crop at 12 × 18?", answer: "Normally no ratio crop is needed because 12 × 18 simplifies to 2:3, matching a 3:2 image after orientation is aligned. A print lab may still apply a small production crop for edge-to-edge output." },
  },
  "16x20-photo": {
    seoTitle: "16×20 Photo Size in Pixels at 300 PPI",
    heading: "16×20 Photo Size: Pixels, Resolution and Crop",
    metaDescription: "A 16×20 print needs 4800 × 6000 pixels at 300 PPI. Compare practical resolutions, viewing-distance context and its 4:5 crop ratio.",
    quickAnswer: "A 16 × 20 inch print measures 406.4 × 508 mm and needs 4800 × 6000 pixels at 300 PPI. It uses the same 4:5 shape as 8 × 10 and crops about 16.7% of a 3:2 camera image when filled.",
    formulaLine: "300 PPI: 4800 × 6000 px · 28.8 megapixels",
    insights: [
      { label: "Large-print range", heading: "Resolution changes the file requirement", text: "A 16 × 20 needs 2400 × 3000 px at 150 PPI, 3840 × 4800 px at 240 PPI or 4800 × 6000 px at 300 PPI.", href: "/tools/print-readiness-checker", linkLabel: "Check your large-print file" },
      { label: "Crop warning", heading: "A 3:2 frame loses about 16.7%", text: "The 4:5 print is less wide than a 3:2 camera image. Position the crop before judging effective PPI because the removed area also removes pixels.", href: "/tools/aspect-ratio-crop-preview", linkLabel: "Preview the crop" },
      { label: "Related format", heading: "8 × 10 shares the same ratio", text: "An image already composed at 4:5 fits both 8 × 10 and 16 × 20 by shape. The larger print still needs twice as many pixels along each edge for equal PPI.", href: "/sizes/8x10-photo", linkLabel: "Compare 8 × 10" },
    ],
    extraFaq: { question: "Is 150 PPI enough for a 16 × 20 print?", answer: "It can be appropriate for some large prints viewed farther away, but it is not a universal guarantee. Ask the print provider whether 240 or 300 PPI is required for the product and viewing conditions." },
  },
};

export function generateStaticParams() { return PRINT_PRESETS.map((preset) => ({ slug: preset.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const preset = PRINT_PRESETS.find((item) => item.slug === slug);
  const featured = FEATURED_SIZE_CONTENT[slug];
  return preset ? pageMetadata({ title: featured?.seoTitle ?? `${preset.shortLabel} Size in Pixels, Inches, CM & MM`, description: featured?.metaDescription ?? `${preset.label} dimensions and pixel sizes at 72, 96, 150, 240, 300 and 600 PPI, with aspect ratio and print setup guidance.`, path: `/sizes/${slug}` }) : {};
}

export default async function SizeDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const preset = PRINT_PRESETS.find((item) => item.slug === slug);
  if (!preset) notFound();
  const detail = SIZE_DETAILS[preset.slug];
  const featured = FEATURED_SIZE_CONTENT[preset.slug];
  const widthIn = mmToInches(preset.widthMm);
  const heightIn = mmToInches(preset.heightMm);
  const faq = [
    { question: `What is ${preset.shortLabel} at 300 PPI?`, answer: `${preset.shortLabel} in portrait orientation is ${pixelsForMm(preset.widthMm, 300)} × ${pixelsForMm(preset.heightMm, 300)} pixels at 300 PPI. Landscape uses the same two values in reverse order.` },
    { question: `What aspect ratio is ${preset.shortLabel}?`, answer: `${preset.shortLabel} uses a ${detail.ratio} aspect ratio. An image with a different ratio must be cropped, fitted with borders or placed inside the page.` },
    { question: `Does the ${preset.shortLabel} pixel size include bleed?`, answer: "No. The table uses final trim dimensions. Add the exact bleed required by the printer to both sides before calculating the full artwork canvas." },
    ...(featured ? [featured.extraFaq] : []),
  ];
  return <main><div className="shell"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Print sizes", href: "/sizes" }, { label: preset.shortLabel }]} /></div>
    <PageHero eyebrow={`${preset.group} size reference`} title={featured?.heading ?? `${preset.shortLabel} size in pixels, inches, cm & mm`} description={`${preset.label} measures ${formatDecimal(preset.widthMm, 1)} × ${formatDecimal(preset.heightMm, 1)} mm. Its pixel dimensions change with PPI; the physical trim size does not.`}><div className="dimension-card"><span>{preset.shortLabel}</span><strong>{formatDecimal(preset.widthMm, 1)} × {formatDecimal(preset.heightMm, 1)} mm</strong><b>{formatDecimal(widthIn)} × {formatDecimal(heightIn)} in</b><small>Aspect ratio {detail.ratio}</small></div></PageHero>
    {featured && <section className="quick-answer shell" aria-label={`${preset.shortLabel} quick answer`}><div><span>Quick answer</span><p>{featured.quickAnswer}</p></div><code>{featured.formulaLine}</code></section>}
    <section className="content-section shell size-detail-grid"><article><div className="section-kicker">Pixel table</div><h2>{preset.shortLabel} pixels by PPI</h2><p>Portrait values are rounded to the nearest whole pixel after converting the native physical dimensions.</p><div className="data-table-wrap"><table className="data-table"><thead><tr><th>PPI</th><th>Width</th><th>Height</th><th>Use context</th></tr></thead><tbody>{ppiRows.map((ppi) => <tr key={ppi}><td><b>{ppi}</b></td><td>{pixelsForMm(preset.widthMm, ppi)} px</td><td>{pixelsForMm(preset.heightMm, ppi)} px</td><td>{ppi >= 300 ? "Detailed print target" : ppi >= 150 ? "Print / distance dependent" : "Layout or screen reference"}</td></tr>)}</tbody></table></div></article><aside><div className="fact-panel"><span>Common uses</span><p>{detail.uses}.</p><span>Print note</span><p>{detail.note}</p><Link href="/tools/aspect-ratio-crop-preview">Preview a crop →</Link></div></aside></section>
    {featured && <section className="size-insights shell" aria-label={`${preset.shortLabel} planning notes`}>{featured.insights.map((insight) => <article key={insight.heading}><span>{insight.label}</span><h2>{insight.heading}</h2><p>{insight.text}</p>{insight.href && insight.linkLabel && <Link href={insight.href}>{insight.linkLabel} →</Link>}</article>)}</section>}
    <section className="tool-embed shell"><div className="section-kicker">Change the resolution</div><h2>Calculate {preset.shortLabel} at any PPI.</h2><ToolCalculator mode="paper-size-pixels-calculator" initialPreset={preset.slug} /></section>
    <section className="content-section shell two-column-copy"><article><div className="section-kicker">Print setup</div><h2>Trim first. Add production values second.</h2><p>{preset.shortLabel} identifies the final physical format. Bleed expands the artwork beyond that edge; a safe margin moves important content inward. Those extra values depend on the print provider.</p><Link className="text-link" href="/tools/bleed-safe-area-calculator">Calculate bleed and safe area →</Link></article><aside><div className="section-kicker">Questions about {preset.shortLabel}</div><FaqList items={faq} /></aside></section>
    <div className="shell"><PageCta /></div>
  </main>;
}
