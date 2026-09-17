"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import {
  PRINT_PRESETS,
  bleedPlan,
  cropRetention,
  effectivePpi,
  formatDecimal,
  pixelsForMm,
  printSizeAtPpi,
  ratioLabel,
  readiness,
} from "@/lib/print-math";

const qualityLevels = [150, 240, 300];
const statusSymbols: Record<string, string> = { ready: "✓", close: "≈", limited: "!", low: "↓" };

type Language = "en" | "ar";
type FileErrorKey = "type" | "dimensions" | "read";

const presetArabic: Record<string, string> = {
  a2: "ورق A2",
  a3: "ورق A3",
  a4: "ورق A4",
  a5: "ورق A5",
  "us-letter": "ورق US Letter",
  "us-legal": "ورق US Legal",
  "4x6-photo": "صورة 4 × 6 بوصة",
  "5x7-photo": "صورة 5 × 7 بوصة",
  "8x10-photo": "صورة 8 × 10 بوصة",
  "11x14-photo": "صورة 11 × 14 بوصة",
  "12x18-photo": "صورة 12 × 18 بوصة",
  "16x20-photo": "صورة 16 × 20 بوصة",
};

const statusArabic: Record<string, { label: string; note: (targetPpi: number) => string }> = {
  ready: { label: "مناسب للهدف", note: (targetPpi) => `عند هدف ${targetPpi} PPI` },
  close: { label: "قريب من الهدف", note: (targetPpi) => `ضمن 20% من هدف ${targetPpi} PPI` },
  limited: { label: "محدود", note: () => "أفضل عند مسافة مشاهدة عادية" },
  low: { label: "أقل من الهدف", note: () => "استخدم مقاس طباعة أصغر أو مصدراً أكبر" },
};

const fileErrorCopy: Record<FileErrorKey, { en: string; ar: string }> = {
  type: { en: "Choose a JPG, PNG, WebP or GIF image.", ar: "اختر صورة بصيغة JPG أو PNG أو WebP أو GIF." },
  dimensions: { en: "This image has no readable pixel dimensions.", ar: "لا تحتوي هذه الصورة على أبعاد بكسل قابلة للقراءة." },
  read: { en: "The browser could not read this image.", ar: "تعذر على المتصفح قراءة هذه الصورة." },
};

export function PrintReadinessLab({ compact = false }: { compact?: boolean }) {
  const [language, setLanguage] = useState<Language>("en");
  const [widthPx, setWidthPx] = useState(3600);
  const [heightPx, setHeightPx] = useState(2400);
  const [presetSlug, setPresetSlug] = useState("4x6-photo");
  const [targetPpi, setTargetPpi] = useState(300);
  const [landscape, setLandscape] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<FileErrorKey | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);

  useEffect(() => {
    const syncLanguage = () => setLanguage(document.documentElement.lang === "ar" ? "ar" : "en");
    const onLanguageChange = (event: Event) => {
      const detail = (event as CustomEvent<{ language?: string }>).detail;
      setLanguage(detail?.language === "ar" ? "ar" : "en");
    };
    syncLanguage();
    window.addEventListener("print-prep:languagechange", onLanguageChange);
    return () => window.removeEventListener("print-prep:languagechange", onLanguageChange);
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const isArabic = language === "ar";
  const t = (en: string, ar: string) => isArabic ? ar : en;
  const preset = PRINT_PRESETS.find((item) => item.slug === presetSlug) ?? PRINT_PRESETS[6];
  const trim = useMemo(() => {
    const short = Math.min(preset.widthMm, preset.heightMm);
    const long = Math.max(preset.widthMm, preset.heightMm);
    return landscape ? { widthMm: long, heightMm: short } : { widthMm: short, heightMm: long };
  }, [preset, landscape]);

  const actualPpi = effectivePpi(widthPx, heightPx, trim.widthMm, trim.heightMm);
  const status = readiness(actualPpi, targetPpi);
  const crop = cropRetention(widthPx, heightPx, trim.widthMm, trim.heightMm);
  const bleed = bleedPlan(trim.widthMm, trim.heightMm, 3, 5, targetPpi);
  const requiredWidthPx = pixelsForMm(trim.widthMm, targetPpi);
  const requiredHeightPx = pixelsForMm(trim.heightMm, targetPpi);
  const maxPrints = qualityLevels.map((ppi) => ({ ppi, ...printSizeAtPpi(widthPx, heightPx, ppi) }));
  const megapixels = (widthPx * heightPx) / 1_000_000;
  const bestMatches = useMemo(() => PRINT_PRESETS.map((item) => {
    const short = Math.min(item.widthMm, item.heightMm);
    const long = Math.max(item.widthMm, item.heightMm);
    const match = cropRetention(widthPx, heightPx, landscape ? long : short, landscape ? short : long);
    return { item, croppedPercent: match.croppedPercent };
  }).sort((a, b) => a.croppedPercent - b.croppedPercent).slice(0, 3), [heightPx, landscape, widthPx]);
  const localizedStatus = isArabic ? statusArabic[status.key] : null;

  function readImage(file?: File) {
    if (!file || !file.type.startsWith("image/")) {
      setFileError("type");
      return;
    }
    setFileError(null);
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        setFileError("dimensions");
        URL.revokeObjectURL(objectUrl);
        return;
      }
      setWidthPx(image.naturalWidth);
      setHeightPx(image.naturalHeight);
      setLandscape(image.naturalWidth >= image.naturalHeight);
      setPreviewUrl(objectUrl);
      setFileName(file.name);
      setPositionX(50);
      setPositionY(50);
    };
    image.onerror = () => {
      setFileError("read");
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    readImage(event.target.files?.[0]);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    readImage(event.dataTransfer.files?.[0]);
  }

  return (
    <section className={`lab-card ${compact ? "lab-card-compact" : ""}`} aria-label={t("Image print readiness checker", "فاحص جاهزية الصورة للطباعة")} data-clarity-mask="true" data-readiness-language={language}>
      <div className="lab-topline">
        <div><span className="live-dot" /> {t("Live print check", "فحص طباعة مباشر")}</div>
        <span>{t("Runs locally in your browser", "يعمل محلياً داخل متصفحك")}</span>
      </div>

      <div className="lab-grid">
        <div className="lab-controls">
          <label
            className={`drop-zone ${isDragging ? "is-dragging" : ""}`}
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <input className="file-input-overlay" aria-label={t("Choose image file", "اختر ملف صورة")} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onFile} />
            <span className="upload-icon" aria-hidden="true">↑</span>
            <span className="drop-copy">
              <strong>{fileName ?? t("Drop an image here", "اسحب صورة إلى هنا")}</strong>
              <small>{fileName ? `${widthPx} × ${heightPx} ${t("pixels", "بكسل")} · ${formatDecimal(megapixels, 1)} MP` : t("or click to choose JPG, PNG, WebP or GIF", "أو اضغط لاختيار JPG أو PNG أو WebP أو GIF")}</small>
            </span>
            <span className="private-pill">{t("Private", "خاص")}</span>
          </label>
          {fileError && <p className="field-error" role="alert">{fileErrorCopy[fileError][language]}</p>}

          <div className="control-block">
            <div className="control-label"><span>1</span><strong className="group-label">{t("Image dimensions", "أبعاد الصورة")}</strong><small>{t("pixels", "بكسل")}</small></div>
            <div className="input-pair">
              <label><span>{t("Width", "العرض")}</span><input aria-label={t("Image width in pixels", "عرض الصورة بالبكسل")} type="number" min="1" step="1" inputMode="numeric" value={widthPx} onChange={(event) => setWidthPx(Math.max(1, Math.round(Number(event.target.value) || 1)))} /></label>
              <b>×</b>
              <label><span>{t("Height", "الارتفاع")}</span><input aria-label={t("Image height in pixels", "ارتفاع الصورة بالبكسل")} type="number" min="1" step="1" inputMode="numeric" value={heightPx} onChange={(event) => setHeightPx(Math.max(1, Math.round(Number(event.target.value) || 1)))} /></label>
            </div>
          </div>

          <div className="control-block">
            <div className="control-label"><span>2</span><label htmlFor="print-size">{t("Target print", "الطباعة المستهدفة")}</label><button type="button" aria-label={t("Switch print orientation", "بدّل اتجاه الطباعة")} onClick={() => setLandscape((value) => !value)}>{landscape ? t("Landscape", "أفقي") : t("Portrait", "رأسي")} ↻</button></div>
            <select id="print-size" aria-label={t("Target print size", "مقاس الطباعة المستهدف")} value={presetSlug} onChange={(event) => setPresetSlug(event.target.value)}>
              {PRINT_PRESETS.map((item) => <option value={item.slug} key={item.slug}>{isArabic ? (presetArabic[item.slug] ?? item.label) : item.label}</option>)}
            </select>
          </div>

          <div className="control-block">
            <div className="control-label"><span>3</span><strong className="group-label">{t("Quality target", "الجودة المطلوبة")}</strong><small>PPI</small></div>
            <fieldset className="segment-control">
              <legend className="visually-hidden">{t("Quality target in PPI", "الجودة المطلوبة بوحدة PPI")}</legend>
              {qualityLevels.map((ppi) => <button type="button" key={ppi} className={targetPpi === ppi ? "active" : ""} aria-label={t(`${ppi} PPI quality target`, `هدف جودة ${ppi} PPI`)} aria-pressed={targetPpi === ppi} onClick={() => setTargetPpi(ppi)}><b>{ppi}</b><small>{ppi === 150 ? t("Poster", "بوستر") : ppi === 240 ? t("Detailed", "تفاصيل جيدة") : t("Fine print", "طباعة دقيقة")}</small></button>)}
            </fieldset>
          </div>
        </div>

        <div className="lab-results" aria-live="polite">
          <div className="result-heading">
            <div><span className={`status-icon ${status.tone}`} aria-hidden="true">{statusSymbols[status.key]}</span><div><small>{t("Print readiness", "جاهزية الطباعة")}</small><h2 data-readiness-status>{localizedStatus?.label ?? status.label}</h2></div></div>
            <span className={`status-chip ${status.tone}`} data-effective-ppi>{Math.round(actualPpi)} {t("effective PPI", "PPI فعلي")}</span>
          </div>

          <div className="print-preview-wrap">
            <div className="print-preview" style={{ aspectRatio: `${trim.widthMm} / ${trim.heightMm}` }}>
              {previewUrl ? (
                // A local object URL cannot be optimized by a remote image loader.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={t("Local crop preview of the selected image", "معاينة قص محلية للصورة المحددة")} style={{ objectPosition: `${positionX}% ${positionY}%` }} />
              ) : <div className="sample-art"><span>{t("YOUR IMAGE", "صورتك")}</span><b>{ratioLabel(widthPx, heightPx)}</b></div>}
              <span className="trim-line"><span>{t("Trim", "حد القص")}</span></span>
              <span className="safe-line"><span>{t("Safe area", "منطقة الأمان")}</span></span>
            </div>
            <div className="preview-scale"><span>{formatDecimal(trim.widthMm / 25.4)} {t("in", "بوصة")}</span><span>{formatDecimal(trim.heightMm / 25.4)} {t("in", "بوصة")}</span></div>
          </div>
          {previewUrl && <div className="preview-position"><label><span>{t("Horizontal crop position", "موضع القص الأفقي")}</span><input aria-label={t("Horizontal crop position", "موضع القص الأفقي")} type="range" min="0" max="100" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} /></label><label><span>{t("Vertical crop position", "موضع القص الرأسي")}</span><input aria-label={t("Vertical crop position", "موضع القص الرأسي")} type="range" min="0" max="100" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} /></label></div>}

          <div className="result-metrics">
            <div><small>{t("Source file", "ملف المصدر")}</small><strong>{widthPx} × {heightPx} px</strong><span>{formatDecimal(megapixels, 1)} MP · {t("ratio", "النسبة")} {ratioLabel(widthPx, heightPx)}</span></div>
            <div><small>{t("Crop needed", "القص المطلوب")}</small><strong data-crop-percent>{formatDecimal(crop.croppedPercent, 1)}%</strong><span>{crop.croppedPercent < 1 ? t("Ratio match", "تطابق في النسبة") : `${formatDecimal(crop.retainedPercent, 1)}% ${t("retained", "متبقي")}`}</span></div>
            <div><small>{t("Pixels needed", "البكسلات المطلوبة")}</small><strong data-required-pixels>{requiredWidthPx} × {requiredHeightPx} px</strong><span>{targetPpi} PPI · {t("selected target", "الهدف المحدد")}</span></div>
            <div><small>{t("With 3 mm bleed", "مع نزف 3 مم")}</small><strong>{formatDecimal(bleed.canvasWidthMm, 1)} × {formatDecimal(bleed.canvasHeightMm, 1)} mm</strong><span>{bleed.canvasWidthPx} × {bleed.canvasHeightPx} px</span></div>
          </div>

          <div className="max-size-panel">
            <div><strong>{t("Maximum print sizes", "أقصى مقاسات الطباعة")}</strong><span>{t("without changing pixel count", "دون تغيير عدد البكسلات")}</span></div>
            <table><thead><tr><th>{t("Target", "الهدف")}</th><th>{t("Inches", "بوصة")}</th><th>{t("Centimetres", "سنتيمتر")}</th></tr></thead><tbody>
              {maxPrints.map((item) => <tr key={item.ppi}><td><b>{item.ppi}</b> PPI</td><td>{formatDecimal(item.widthIn)} × {formatDecimal(item.heightIn)}</td><td>{formatDecimal(item.widthCm, 1)} × {formatDecimal(item.heightCm, 1)}</td></tr>)}
            </tbody></table>
          </div>

          <div className="format-fit-panel"><div><strong>{t("Best aspect-ratio matches", "أفضل المقاسات توافقاً مع نسبة الصورة")}</strong><span>{t("lowest estimated crop", "أقل قص تقديري")}</span></div><nav aria-label={t("Best matching print formats", "أفضل مقاسات الطباعة المطابقة")}>{bestMatches.map(({ item, croppedPercent }) => <Link href={`/sizes/${item.slug}`} key={item.slug}><b>{item.shortLabel}</b><small>{croppedPercent < 0.05 ? t("Ratio match", "تطابق في النسبة") : `${formatDecimal(croppedPercent, 1)}% ${t("crop", "قص")}`}</small></Link>)}</nav></div>

          <p className="result-note"><b>{localizedStatus?.note(targetPpi) ?? status.note}.</b> {t("Final requirements vary by printer, paper and viewing distance—confirm the shop's specification before production.", "تختلف المتطلبات النهائية حسب الطابعة والخامة ومسافة المشاهدة—أكد مواصفات المطبعة قبل الإنتاج.")}</p>
        </div>
      </div>
    </section>
  );
}
