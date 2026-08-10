"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import {
  PRINT_PRESETS,
  bleedPlan,
  cropRetention,
  effectivePpi,
  formatDecimal,
  printSizeAtPpi,
  ratioLabel,
  readiness,
} from "@/lib/print-math";

const qualityLevels = [150, 240, 300];
const statusSymbols: Record<string, string> = { ready: "✓", close: "≈", limited: "!", low: "↓" };

export function PrintReadinessLab({ compact = false }: { compact?: boolean }) {
  const [widthPx, setWidthPx] = useState(3600);
  const [heightPx, setHeightPx] = useState(2400);
  const [presetSlug, setPresetSlug] = useState("4x6-photo");
  const [targetPpi, setTargetPpi] = useState(300);
  const [landscape, setLandscape] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

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
  const maxPrints = qualityLevels.map((ppi) => ({ ppi, ...printSizeAtPpi(widthPx, heightPx, ppi) }));
  const megapixels = (widthPx * heightPx) / 1_000_000;
  const bestMatches = useMemo(() => PRINT_PRESETS.map((item) => {
    const short = Math.min(item.widthMm, item.heightMm);
    const long = Math.max(item.widthMm, item.heightMm);
    const match = cropRetention(widthPx, heightPx, landscape ? long : short, landscape ? short : long);
    return { item, croppedPercent: match.croppedPercent };
  }).sort((a, b) => a.croppedPercent - b.croppedPercent).slice(0, 3), [heightPx, landscape, widthPx]);

  function readImage(file?: File) {
    if (!file || !file.type.startsWith("image/")) {
      setFileError("Choose a JPG, PNG, WebP or GIF image.");
      return;
    }
    setFileError(null);
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        setFileError("This image has no readable pixel dimensions.");
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
      setFileError("The browser could not read this image.");
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
    <section className={`lab-card ${compact ? "lab-card-compact" : ""}`} aria-label="Image print readiness checker">
      <div className="lab-topline">
        <div><span className="live-dot" /> Live print check</div>
        <span>Runs locally in your browser</span>
      </div>

      <div className="lab-grid">
        <div className="lab-controls">
          <label
            className={`drop-zone ${isDragging ? "is-dragging" : ""}`}
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <input className="file-input-overlay" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onFile} />
            <span className="upload-icon" aria-hidden="true">↑</span>
            <span className="drop-copy"><strong>{fileName ?? "Drop an image here"}</strong><small>{fileName ? `${widthPx} × ${heightPx} pixels · ${formatDecimal(megapixels, 1)} MP` : "or click to choose JPG, PNG, WebP or GIF"}</small></span>
            <span className="private-pill">Private</span>
          </label>
          {fileError && <p className="field-error" role="alert">{fileError}</p>}

          <div className="control-block">
            <div className="control-label"><span>1</span><strong className="group-label">Image dimensions</strong><small>pixels</small></div>
            <div className="input-pair">
              <label><span>Width</span><input aria-label="Image width in pixels" type="number" min="1" step="1" inputMode="numeric" value={widthPx} onChange={(event) => setWidthPx(Math.max(1, Math.round(Number(event.target.value) || 1)))} /></label>
              <b>×</b>
              <label><span>Height</span><input aria-label="Image height in pixels" type="number" min="1" step="1" inputMode="numeric" value={heightPx} onChange={(event) => setHeightPx(Math.max(1, Math.round(Number(event.target.value) || 1)))} /></label>
            </div>
          </div>

          <div className="control-block">
            <div className="control-label"><span>2</span><label htmlFor="print-size">Target print</label><button type="button" onClick={() => setLandscape((value) => !value)}>{landscape ? "Landscape" : "Portrait"} ↻</button></div>
            <select id="print-size" value={presetSlug} onChange={(event) => setPresetSlug(event.target.value)}>
              {PRINT_PRESETS.map((item) => <option value={item.slug} key={item.slug}>{item.label}</option>)}
            </select>
          </div>

          <div className="control-block">
            <div className="control-label"><span>3</span><strong className="group-label">Quality target</strong><small>PPI</small></div>
            <fieldset className="segment-control">
              <legend className="visually-hidden">Quality target in PPI</legend>
              {qualityLevels.map((ppi) => <button type="button" key={ppi} className={targetPpi === ppi ? "active" : ""} aria-pressed={targetPpi === ppi} onClick={() => setTargetPpi(ppi)}><b>{ppi}</b><small>{ppi === 150 ? "Poster" : ppi === 240 ? "Detailed" : "Fine print"}</small></button>)}
            </fieldset>
          </div>
        </div>

        <div className="lab-results" aria-live="polite">
          <div className="result-heading">
            <div><span className={`status-icon ${status.tone}`} aria-hidden="true">{statusSymbols[status.key]}</span><div><small>Print readiness</small><h2>{status.label}</h2></div></div>
            <span className={`status-chip ${status.tone}`}>{Math.round(actualPpi)} effective PPI</span>
          </div>

          <div className="print-preview-wrap">
            <div className="print-preview" style={{ aspectRatio: `${trim.widthMm} / ${trim.heightMm}` }}>
              {previewUrl ? (
                // A local object URL cannot be optimized by a remote image loader.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Local crop preview of the selected image" style={{ objectPosition: `${positionX}% ${positionY}%` }} />
              ) : <div className="sample-art"><span>YOUR IMAGE</span><b>{ratioLabel(widthPx, heightPx)}</b></div>}
              <span className="trim-line"><span>Trim</span></span>
              <span className="safe-line"><span>Safe area</span></span>
            </div>
            <div className="preview-scale"><span>{formatDecimal(trim.widthMm / 25.4)} in</span><span>{formatDecimal(trim.heightMm / 25.4)} in</span></div>
          </div>
          {previewUrl && <div className="preview-position"><label><span>Horizontal crop position</span><input type="range" min="0" max="100" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} /></label><label><span>Vertical crop position</span><input type="range" min="0" max="100" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} /></label></div>}

          <div className="result-metrics three">
            <div><small>Source file</small><strong>{widthPx} × {heightPx} px</strong><span>{formatDecimal(megapixels, 1)} MP · ratio {ratioLabel(widthPx, heightPx)}</span></div>
            <div><small>Crop needed</small><strong>{formatDecimal(crop.croppedPercent, 1)}%</strong><span>{crop.croppedPercent < 1 ? "Ratio match" : `${formatDecimal(crop.retainedPercent, 1)}% retained`}</span></div>
            <div><small>With 3 mm bleed</small><strong>{formatDecimal(bleed.canvasWidthMm, 1)} × {formatDecimal(bleed.canvasHeightMm, 1)} mm</strong><span>{bleed.canvasWidthPx} × {bleed.canvasHeightPx} px</span></div>
          </div>

          <div className="max-size-panel">
            <div><strong>Maximum print sizes</strong><span>without changing pixel count</span></div>
            <table><thead><tr><th>Target</th><th>Inches</th><th>Centimetres</th></tr></thead><tbody>
              {maxPrints.map((item) => <tr key={item.ppi}><td><b>{item.ppi}</b> PPI</td><td>{formatDecimal(item.widthIn)} × {formatDecimal(item.heightIn)}</td><td>{formatDecimal(item.widthCm, 1)} × {formatDecimal(item.heightCm, 1)}</td></tr>)}
            </tbody></table>
          </div>

          <div className="format-fit-panel"><div><strong>Best aspect-ratio matches</strong><span>lowest estimated crop</span></div><nav aria-label="Best matching print formats">{bestMatches.map(({ item, croppedPercent }) => <Link href={`/sizes/${item.slug}`} key={item.slug}><b>{item.shortLabel}</b><small>{croppedPercent < 0.05 ? "Ratio match" : `${formatDecimal(croppedPercent, 1)}% crop`}</small></Link>)}</nav></div>

          <p className="result-note"><b>{status.note}.</b> Final requirements vary by printer, paper and viewing distance—confirm the shop&apos;s specification before production.</p>
        </div>
      </div>
    </section>
  );
}
