export const MM_PER_INCH = 25.4;

export type PhysicalUnit = "in" | "cm" | "mm";

export type PrintPreset = {
  slug: string;
  label: string;
  shortLabel: string;
  widthMm: number;
  heightMm: number;
  group: "ISO" | "US" | "Photo";
};

export const PRINT_PRESETS: PrintPreset[] = [
  { slug: "a2", label: "A2 paper", shortLabel: "A2", widthMm: 420, heightMm: 594, group: "ISO" },
  { slug: "a3", label: "A3 paper", shortLabel: "A3", widthMm: 297, heightMm: 420, group: "ISO" },
  { slug: "a4", label: "A4 paper", shortLabel: "A4", widthMm: 210, heightMm: 297, group: "ISO" },
  { slug: "a5", label: "A5 paper", shortLabel: "A5", widthMm: 148, heightMm: 210, group: "ISO" },
  { slug: "us-letter", label: "US Letter", shortLabel: "Letter", widthMm: 215.9, heightMm: 279.4, group: "US" },
  { slug: "us-legal", label: "US Legal", shortLabel: "Legal", widthMm: 215.9, heightMm: 355.6, group: "US" },
  { slug: "4x6-photo", label: "4 × 6 photo", shortLabel: "4 × 6", widthMm: 101.6, heightMm: 152.4, group: "Photo" },
  { slug: "5x7-photo", label: "5 × 7 photo", shortLabel: "5 × 7", widthMm: 127, heightMm: 177.8, group: "Photo" },
  { slug: "8x10-photo", label: "8 × 10 photo", shortLabel: "8 × 10", widthMm: 203.2, heightMm: 254, group: "Photo" },
  { slug: "11x14-photo", label: "11 × 14 photo", shortLabel: "11 × 14", widthMm: 279.4, heightMm: 355.6, group: "Photo" },
  { slug: "12x18-photo", label: "12 × 18 photo", shortLabel: "12 × 18", widthMm: 304.8, heightMm: 457.2, group: "Photo" },
  { slug: "16x20-photo", label: "16 × 20 photo", shortLabel: "16 × 20", widthMm: 406.4, heightMm: 508, group: "Photo" },
];

function isPositiveFinite(value: number) {
  return Number.isFinite(value) && value > 0;
}

function nonNegativeFinite(value: number) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function mmToInches(mm: number) {
  return Number.isFinite(mm) ? mm / MM_PER_INCH : 0;
}

export function inchesToMm(inches: number) {
  return Number.isFinite(inches) ? inches * MM_PER_INCH : 0;
}

export function physicalSizeToMm(value: number, unit: PhysicalUnit) {
  if (!isPositiveFinite(value)) return 0;
  const millimetres = unit === "in" ? inchesToMm(value) : unit === "cm" ? value * 10 : value;
  return Number.isFinite(millimetres) ? millimetres : 0;
}

export function pixelsForMm(mm: number, ppi: number) {
  if (!isPositiveFinite(mm) || !isPositiveFinite(ppi)) return 0;
  const pixels = mmToInches(mm) * ppi;
  return Number.isFinite(pixels) && pixels <= Number.MAX_SAFE_INTEGER ? Math.round(pixels) : 0;
}

export function printSizeAtPpi(widthPx: number, heightPx: number, ppi: number) {
  if (!isPositiveFinite(ppi)) return { widthIn: 0, heightIn: 0, widthCm: 0, heightCm: 0 };
  const widthIn = nonNegativeFinite(widthPx) / ppi;
  const heightIn = nonNegativeFinite(heightPx) / ppi;
  return {
    widthIn: Number.isFinite(widthIn) ? widthIn : 0,
    heightIn: Number.isFinite(heightIn) ? heightIn : 0,
    widthCm: Number.isFinite(widthIn * 2.54) ? widthIn * 2.54 : 0,
    heightCm: Number.isFinite(heightIn * 2.54) ? heightIn * 2.54 : 0,
  };
}

export function effectivePpiDetails(
  widthPx: number,
  heightPx: number,
  printWidthMm: number,
  printHeightMm: number,
) {
  if (![widthPx, heightPx, printWidthMm, printHeightMm].every(isPositiveFinite)) {
    return { widthPpi: 0, heightPpi: 0, effectivePpi: 0 };
  }
  const widthPpi = widthPx / mmToInches(printWidthMm);
  const heightPpi = heightPx / mmToInches(printHeightMm);
  if (!Number.isFinite(widthPpi) || !Number.isFinite(heightPpi)) {
    return { widthPpi: 0, heightPpi: 0, effectivePpi: 0 };
  }
  return { widthPpi, heightPpi, effectivePpi: Math.min(widthPpi, heightPpi) };
}

export function effectivePpi(
  widthPx: number,
  heightPx: number,
  printWidthMm: number,
  printHeightMm: number,
) {
  return effectivePpiDetails(widthPx, heightPx, printWidthMm, printHeightMm).effectivePpi;
}

export function cropRetention(
  widthPx: number,
  heightPx: number,
  printWidthMm: number,
  printHeightMm: number,
) {
  if (![widthPx, heightPx, printWidthMm, printHeightMm].every(isPositiveFinite)) {
    return { retainedPercent: 0, croppedPercent: 0 };
  }
  const sourceRatio = widthPx / heightPx;
  const targetRatio = printWidthMm / printHeightMm;
  if (!isPositiveFinite(sourceRatio) || !isPositiveFinite(targetRatio)) {
    return { retainedPercent: 0, croppedPercent: 0 };
  }
  const rawRetained = Math.max(0, Math.min(1, sourceRatio / targetRatio, targetRatio / sourceRatio));
  const retained = Math.abs(1 - rawRetained) < 1e-12 ? 1 : rawRetained;
  return {
    retainedPercent: retained * 100,
    croppedPercent: (1 - retained) * 100,
  };
}

export function bleedPlan(
  trimWidthMm: number,
  trimHeightMm: number,
  bleedMm: number,
  safeMm: number,
  ppi: number,
) {
  if (!isPositiveFinite(trimWidthMm) || !isPositiveFinite(trimHeightMm)) {
    return { canvasWidthMm: 0, canvasHeightMm: 0, safeWidthMm: 0, safeHeightMm: 0, canvasWidthPx: 0, canvasHeightPx: 0 };
  }
  const validBleedMm = nonNegativeFinite(bleedMm);
  const validSafeMm = nonNegativeFinite(safeMm);
  const rawCanvasWidthMm = trimWidthMm + validBleedMm * 2;
  const rawCanvasHeightMm = trimHeightMm + validBleedMm * 2;
  const canvasWidthMm = Number.isFinite(rawCanvasWidthMm) ? rawCanvasWidthMm : 0;
  const canvasHeightMm = Number.isFinite(rawCanvasHeightMm) ? rawCanvasHeightMm : 0;
  const safeWidthMm = Math.max(0, trimWidthMm - validSafeMm * 2);
  const safeHeightMm = Math.max(0, trimHeightMm - validSafeMm * 2);
  return {
    canvasWidthMm,
    canvasHeightMm,
    safeWidthMm,
    safeHeightMm,
    canvasWidthPx: pixelsForMm(canvasWidthMm, ppi),
    canvasHeightPx: pixelsForMm(canvasHeightMm, ppi),
  };
}

export function readiness(actualPpi: number, targetPpi: number) {
  const ratio = isPositiveFinite(actualPpi) && isPositiveFinite(targetPpi) ? actualPpi / targetPpi : 0;
  // Standard physical sizes rarely convert to a whole pixel count. A tolerance
  // of 0.1% prevents an A4 file rounded to 2480 × 3508 px from being mislabeled.
  if (ratio >= 0.999) return { key: "ready", label: "Meets target", note: `At the ${targetPpi} PPI target`, tone: "good" };
  if (ratio >= 0.8) return { key: "close", label: "Close to target", note: `Within 20% of ${targetPpi} PPI`, tone: "near" };
  if (ratio >= 0.5) return { key: "limited", label: "Limited", note: "Better at normal viewing distance", tone: "warn" };
  return { key: "low", label: "Below target", note: "Use a smaller print or larger source", tone: "bad" };
}

export function gcd(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  let left = Math.abs(Math.round(a));
  let right = Math.abs(Math.round(b));
  while (right !== 0) [left, right] = [right, left % right];
  return left;
}

export function ratioLabel(width: number, height: number) {
  if (!isPositiveFinite(width) || !isPositiveFinite(height)) return "—";
  const wholeWidth = Math.round(width);
  const wholeHeight = Math.round(height);
  const divisor = gcd(wholeWidth, wholeHeight);
  if (divisor === 0) return "—";
  const simpleWidth = wholeWidth / divisor;
  const simpleHeight = wholeHeight / divisor;
  if (simpleWidth <= 100 && simpleHeight <= 100) return `${simpleWidth}:${simpleHeight}`;
  return `${(wholeWidth / wholeHeight).toFixed(2)}:1`;
}

export function formatDecimal(value: number, maximumFractionDigits = 2) {
  if (!Number.isFinite(value)) return "—";
  const precision = Math.max(0, Math.min(20, Math.round(maximumFractionDigits)));
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: precision }).format(value);
}
