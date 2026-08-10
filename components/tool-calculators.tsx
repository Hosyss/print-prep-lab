"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  PRINT_PRESETS,
  bleedPlan,
  cropRetention,
  effectivePpiDetails,
  formatDecimal,
  mmToInches,
  physicalSizeToMm,
  pixelsForMm,
  printSizeAtPpi,
  ratioLabel,
  readiness,
} from "@/lib/print-math";
import type { PhysicalUnit } from "@/lib/print-math";
import type { ToolMode } from "@/lib/site-content";

const COMMON_PPI = [150, 240, 300];

function NumericField({ label, value, onChange, suffix, minimum = 0, integer = false }: { label: string; value: number; onChange: (value: number) => void; suffix?: string; minimum?: number; integer?: boolean }) {
  return <label className="tool-field"><span>{label}</span><div><input type="number" min={minimum} step={integer ? 1 : "any"} inputMode={integer ? "numeric" : "decimal"} value={value} onChange={(event) => {
    const parsed = Number(event.target.value);
    const normalized = Number.isFinite(parsed) ? Math.max(minimum, parsed) : minimum;
    onChange(integer ? Math.round(normalized) : normalized);
  }} />{suffix && <small>{suffix}</small>}</div></label>;
}

function UnitPicker({ unit, onChange }: { unit: PhysicalUnit; onChange: (unit: PhysicalUnit) => void }) {
  return <div className="unit-picker" role="group" aria-label="Physical unit">{(["in", "cm", "mm"] as PhysicalUnit[]).map((item) => <button type="button" key={item} aria-pressed={unit === item} className={unit === item ? "active" : ""} onClick={() => onChange(item)}>{item}</button>)}</div>;
}

function PpiPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <div className="ppi-shortcuts" role="group" aria-label="Common PPI targets"><span>Quick targets</span>{COMMON_PPI.map((item) => <button type="button" key={item} className={value === item ? "active" : ""} aria-pressed={value === item} onClick={() => onChange(item)}>{item} PPI</button>)}</div>;
}

function ComparisonTable({ title, headings, rows }: { title: string; headings: string[]; rows: string[][] }) {
  return <div className="comparison-table"><strong>{title}</strong><div className="data-table-wrap"><table className="data-table"><thead><tr>{headings.map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.join("-")}>{row.map((cell, index) => <td key={`${cell}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div></div>;
}

function mmInUnit(mm: number, unit: PhysicalUnit) {
  return unit === "in" ? mm / 25.4 : unit === "cm" ? mm / 10 : mm;
}

export function ToolCalculator({ mode, initialPreset = "a4" }: { mode: ToolMode; initialPreset?: string }) {
  const startsAsCropPreview = mode === "aspect-ratio-crop-preview";
  const [widthPx, setWidthPx] = useState(3000);
  const [heightPx, setHeightPx] = useState(2000);
  const [width, setWidth] = useState(8);
  const [height, setHeight] = useState(10);
  const [ppi, setPpi] = useState(300);
  const [unit, setUnit] = useState<PhysicalUnit>("in");
  const [presetSlug, setPresetSlug] = useState(startsAsCropPreview && initialPreset === "a4" ? "8x10-photo" : initialPreset);
  const [landscape, setLandscape] = useState(startsAsCropPreview);
  const [bleed, setBleed] = useState(3);
  const [safe, setSafe] = useState(5);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<"fill" | "fit">("fill");
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const preset = PRINT_PRESETS.find((item) => item.slug === presetSlug) ?? PRINT_PRESETS[2];
  const oriented = useMemo(() => {
    const short = Math.min(preset.widthMm, preset.heightMm);
    const long = Math.max(preset.widthMm, preset.heightMm);
    return landscape ? { widthMm: long, heightMm: short } : { widthMm: short, heightMm: long };
  }, [preset, landscape]);

  const physicalWidthMm = physicalSizeToMm(width, unit);
  const physicalHeightMm = physicalSizeToMm(height, unit);

  function readLocalImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setWidthPx(image.naturalWidth);
      setHeightPx(image.naturalHeight);
      setLandscape(image.naturalWidth >= image.naturalHeight);
      setFileName(file.name);
      setPreviewUrl(objectUrl);
    };
    image.onerror = () => URL.revokeObjectURL(objectUrl);
    image.src = objectUrl;
  }

  if (mode === "pixels-to-print-size") {
    const result = printSizeAtPpi(widthPx, heightPx, ppi);
    return <CalculatorFrame title="Pixels → physical print size" formula="print inches = pixels ÷ PPI">
      <div className="tool-form-grid"><NumericField label="Pixel width" value={widthPx} onChange={setWidthPx} suffix="px" minimum={1} integer /><NumericField label="Pixel height" value={heightPx} onChange={setHeightPx} suffix="px" minimum={1} integer /><NumericField label="Target PPI" value={ppi} onChange={setPpi} suffix="PPI" minimum={1} /></div>
      <PpiPicker value={ppi} onChange={setPpi} />
      <ResultGrid items={[{ label: "Print size in inches", value: `${formatDecimal(result.widthIn)} × ${formatDecimal(result.heightIn)} in`, featured: true }, { label: "Print size in centimetres", value: `${formatDecimal(result.widthCm, 1)} × ${formatDecimal(result.heightCm, 1)} cm` }, { label: "Image aspect ratio", value: ratioLabel(widthPx, heightPx) }]} />
      <ComparisonTable title="Same pixels at common print targets" headings={["Target", "Inches", "Centimetres"]} rows={COMMON_PPI.map((target) => { const size = printSizeAtPpi(widthPx, heightPx, target); return [`${target} PPI`, `${formatDecimal(size.widthIn)} × ${formatDecimal(size.heightIn)}`, `${formatDecimal(size.widthCm, 1)} × ${formatDecimal(size.heightCm, 1)}`]; })} />
    </CalculatorFrame>;
  }

  if (mode === "print-size-to-pixels") {
    const requiredWidth = pixelsForMm(physicalWidthMm, ppi);
    const requiredHeight = pixelsForMm(physicalHeightMm, ppi);
    return <CalculatorFrame title="Physical print size → pixels" formula="pixels = inches × PPI">
      <UnitPicker unit={unit} onChange={setUnit} />
      <div className="tool-form-grid"><NumericField label="Print width" value={width} onChange={setWidth} suffix={unit} minimum={0.01} /><NumericField label="Print height" value={height} onChange={setHeight} suffix={unit} minimum={0.01} /><NumericField label="Target PPI" value={ppi} onChange={setPpi} suffix="PPI" minimum={1} /></div>
      <PpiPicker value={ppi} onChange={setPpi} />
      <ResultGrid items={[{ label: "Required pixel dimensions", value: `${requiredWidth} × ${requiredHeight} px`, featured: true }, { label: "Physical size in millimetres", value: `${formatDecimal(physicalWidthMm, 2)} × ${formatDecimal(physicalHeightMm, 2)} mm` }, { label: "Required megapixels", value: `${formatDecimal((requiredWidth * requiredHeight) / 1_000_000, 2)} MP` }]} />
      <ComparisonTable title="Pixels required at common targets" headings={["Target", "Pixel dimensions", "Megapixels"]} rows={COMMON_PPI.map((target) => { const targetWidth = pixelsForMm(physicalWidthMm, target); const targetHeight = pixelsForMm(physicalHeightMm, target); return [`${target} PPI`, `${targetWidth} × ${targetHeight} px`, `${formatDecimal((targetWidth * targetHeight) / 1_000_000, 2)} MP`]; })} />
    </CalculatorFrame>;
  }

  if (mode === "dpi-ppi-calculator") {
    const ppiDetails = effectivePpiDetails(widthPx, heightPx, physicalWidthMm, physicalHeightMm);
    const status = readiness(ppiDetails.effectivePpi, ppi);
    const crop = cropRetention(widthPx, heightPx, physicalWidthMm, physicalHeightMm);
    return <CalculatorFrame title="Effective PPI at final print size" formula="effective PPI = lower of width PPI and height PPI">
      <UnitPicker unit={unit} onChange={setUnit} />
      <div className="tool-form-grid five"><NumericField label="Pixel width" value={widthPx} onChange={setWidthPx} suffix="px" minimum={1} integer /><NumericField label="Pixel height" value={heightPx} onChange={setHeightPx} suffix="px" minimum={1} integer /><NumericField label="Print width" value={width} onChange={setWidth} suffix={unit} minimum={0.01} /><NumericField label="Print height" value={height} onChange={setHeight} suffix={unit} minimum={0.01} /><NumericField label="Quality target" value={ppi} onChange={setPpi} suffix="PPI" minimum={1} /></div>
      <PpiPicker value={ppi} onChange={setPpi} />
      <div className={`verdict-bar ${status.tone}`}><span>{status.label}</span><strong>{Math.round(ppiDetails.effectivePpi)} effective PPI</strong><small>Compared with the selected {formatDecimal(ppi)} PPI target</small></div>
      <ResultGrid items={[{ label: "Width density", value: `${Math.round(ppiDetails.widthPpi)} PPI` }, { label: "Height density", value: `${Math.round(ppiDetails.heightPpi)} PPI` }, { label: "Crop needed to fill", value: `${formatDecimal(crop.croppedPercent, 1)}%` }]} />
    </CalculatorFrame>;
  }

  if (mode === "paper-size-pixels-calculator") {
    return <CalculatorFrame title="Paper preset → pixel dimensions" formula="pixels = millimetres ÷ 25.4 × PPI">
      <PresetControls presetSlug={presetSlug} setPresetSlug={setPresetSlug} landscape={landscape} setLandscape={setLandscape} />
      <div className="tool-form-grid one"><NumericField label="Target PPI" value={ppi} onChange={setPpi} suffix="PPI" minimum={1} /></div>
      <PpiPicker value={ppi} onChange={setPpi} />
      <ResultGrid items={[{ label: `${preset.shortLabel} pixel dimensions`, value: `${pixelsForMm(oriented.widthMm, ppi)} × ${pixelsForMm(oriented.heightMm, ppi)} px`, featured: true }, { label: "Trim size", value: `${formatDecimal(oriented.widthMm, 1)} × ${formatDecimal(oriented.heightMm, 1)} mm` }, { label: "Trim size in inches", value: `${formatDecimal(mmToInches(oriented.widthMm))} × ${formatDecimal(mmToInches(oriented.heightMm))} in` }]} />
      <ComparisonTable title={`${preset.shortLabel} at common targets`} headings={["Target", "Width", "Height"]} rows={COMMON_PPI.map((target) => [`${target} PPI`, `${pixelsForMm(oriented.widthMm, target)} px`, `${pixelsForMm(oriented.heightMm, target)} px`])} />
    </CalculatorFrame>;
  }

  if (mode === "aspect-ratio-crop-preview") {
    const crop = cropRetention(widthPx, heightPx, oriented.widthMm, oriented.heightMm);
    return <CalculatorFrame title="Image ratio → print crop" formula="retained area = smaller ratio ÷ larger ratio">
      <label className="crop-upload"><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={readLocalImage} /><span>Choose a local image</span><strong>{fileName ?? "No image selected"}</strong><small>{fileName ? `${widthPx} × ${heightPx} px` : "The file stays in your browser"}</small></label>
      <div className="tool-form-grid"><NumericField label="Pixel width" value={widthPx} onChange={setWidthPx} suffix="px" minimum={1} integer /><NumericField label="Pixel height" value={heightPx} onChange={setHeightPx} suffix="px" minimum={1} integer /></div>
      <PresetControls presetSlug={presetSlug} setPresetSlug={setPresetSlug} landscape={landscape} setLandscape={setLandscape} />
      <div className="crop-mode-row" role="group" aria-label="Crop preview mode"><span>Preview mode</span><button type="button" className={cropMode === "fill" ? "active" : ""} aria-pressed={cropMode === "fill"} onClick={() => setCropMode("fill")}>Fill & crop</button><button type="button" className={cropMode === "fit" ? "active" : ""} aria-pressed={cropMode === "fit"} onClick={() => setCropMode("fit")}>Fit full image</button></div>
      <div className="crop-preview-grid">
        <div className={`crop-stage ${cropMode}`} style={{ aspectRatio: `${oriented.widthMm} / ${oriented.heightMm}` }}>
          {previewUrl ? (
            // A local object URL cannot be optimized by a remote image loader.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Local preview of the selected crop" style={{ objectFit: cropMode === "fill" ? "cover" : "contain", objectPosition: `${positionX}% ${positionY}%` }} />
          ) : <div className="crop-placeholder"><span>Image {ratioLabel(widthPx, heightPx)}</span><b>→</b><strong>{preset.shortLabel} · {SIZE_RATIO[presetSlug] ?? formatDecimal(oriented.widthMm / oriented.heightMm, 2)}</strong></div>}
          <i aria-hidden="true" />
        </div>
        <div className="crop-position-controls"><label><span>Horizontal position</span><input type="range" min="0" max="100" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} /></label><label><span>Vertical position</span><input type="range" min="0" max="100" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} /></label><small>Position changes what is removed, not the crop percentage.</small></div>
      </div>
      <ResultGrid items={[{ label: cropMode === "fill" ? "Estimated area retained" : "Full image retained", value: `${formatDecimal(cropMode === "fill" ? crop.retainedPercent : 100, 1)}%`, featured: true }, { label: cropMode === "fill" ? "Estimated crop" : "Possible border space", value: cropMode === "fill" ? `${formatDecimal(crop.croppedPercent, 1)}%` : "Shown in preview" }, { label: "Target format", value: `${preset.shortLabel} · ${landscape ? "landscape" : "portrait"}` }]} />
    </CalculatorFrame>;
  }

  const plan = bleedPlan(physicalWidthMm, physicalHeightMm, bleed, safe, ppi);
  return <CalculatorFrame title="Trim → bleed canvas and safe area" formula="full canvas = trim + bleed on both edges">
    <UnitPicker unit={unit} onChange={setUnit} />
    <div className="tool-form-grid five"><NumericField label="Trim width" value={width} onChange={setWidth} suffix={unit} minimum={0.01} /><NumericField label="Trim height" value={height} onChange={setHeight} suffix={unit} minimum={0.01} /><NumericField label="Bleed each edge" value={bleed} onChange={setBleed} suffix="mm" /><NumericField label="Safe margin" value={safe} onChange={setSafe} suffix="mm" /><NumericField label="Target PPI" value={ppi} onChange={setPpi} suffix="PPI" minimum={1} /></div>
    <div className="margin-presets"><span>Common starting points</span><button type="button" onClick={() => setBleed(3)}>3 mm bleed</button><button type="button" onClick={() => setBleed(3.175)}>0.125 in bleed</button><small>Use the printer&apos;s specification when it differs.</small></div>
    <PpiPicker value={ppi} onChange={setPpi} />
    <div className="bleed-visual"><span>Bleed canvas<strong>Trim<i>Safe area</i></strong></span></div>
    <ResultGrid items={[{ label: `Full canvas in ${unit}`, value: `${formatDecimal(mmInUnit(plan.canvasWidthMm, unit), 3)} × ${formatDecimal(mmInUnit(plan.canvasHeightMm, unit), 3)} ${unit}`, featured: true }, { label: "Full canvas in millimetres", value: `${formatDecimal(plan.canvasWidthMm, 2)} × ${formatDecimal(plan.canvasHeightMm, 2)} mm` }, { label: `Canvas at ${ppi} PPI`, value: `${plan.canvasWidthPx} × ${plan.canvasHeightPx} px` }, { label: `Safe area in ${unit}`, value: `${formatDecimal(mmInUnit(plan.safeWidthMm, unit), 3)} × ${formatDecimal(mmInUnit(plan.safeHeightMm, unit), 3)} ${unit}` }]} />
  </CalculatorFrame>;
}

const SIZE_RATIO: Record<string, string> = { a2: "1:√2", a3: "1:√2", a4: "1:√2", a5: "1:√2", "us-letter": "17:22", "us-legal": "17:28", "4x6-photo": "2:3", "5x7-photo": "5:7", "8x10-photo": "4:5", "11x14-photo": "11:14", "12x18-photo": "2:3", "16x20-photo": "4:5" };

function PresetControls({ presetSlug, setPresetSlug, landscape, setLandscape }: { presetSlug: string; setPresetSlug: (value: string) => void; landscape: boolean; setLandscape: (value: boolean) => void }) {
  return <div className="preset-row"><label><span>Print preset</span><select value={presetSlug} onChange={(event) => setPresetSlug(event.target.value)}>{PRINT_PRESETS.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></label><button type="button" onClick={() => setLandscape(!landscape)}>{landscape ? "Landscape" : "Portrait"} ↻</button></div>;
}

function CalculatorFrame({ title, formula, children }: { title: string; formula: string; children: React.ReactNode }) {
  return <section className="standalone-tool"><div className="standalone-tool-head"><div><span className="live-dot" />Interactive calculator</div><code>{formula}</code></div><div className="standalone-tool-body"><h2>{title}</h2>{children}</div></section>;
}

function ResultGrid({ items }: { items: Array<{ label: string; value: string; featured?: boolean }> }) {
  return <div className="tool-result-grid">{items.map((item) => <div className={item.featured ? "featured" : ""} key={item.label}><small>{item.label}</small><strong>{item.value}</strong></div>)}</div>;
}
