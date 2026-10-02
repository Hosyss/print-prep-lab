export type PdfBox = { x: number; y: number; width: number; height: number };
export type Matrix = [number, number, number, number, number, number];
export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
export const pointsToMm = (value: number, userUnit = 1) => value * userUnit * 25.4 / 72;
export function multiply(a: Matrix, b: Matrix): Matrix {
  return [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3], a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]];
}
export function imageDensity(width: number, height: number, matrix: Matrix, userUnit = 1) {
  const inchesX = Math.hypot(matrix[0], matrix[1]) * userUnit / 72;
  const inchesY = Math.hypot(matrix[2], matrix[3]) * userUnit / 72;
  if (width <= 0 || height <= 0 || inchesX <= 0 || inchesY <= 0) return null;
  const x = width / inchesX, y = height / inchesY;
  return { width, height, x, y, minimum: Math.min(x, y) };
}
export function displayedSize(box: PdfBox, rotation: number, userUnit = 1) {
  const swapped = Math.abs(rotation % 180) === 90;
  return { width: pointsToMm(swapped ? box.height : box.width, userUnit), height: pointsToMm(swapped ? box.width : box.height, userUnit) };
}
export function bleedMargins(trim: PdfBox, bleed: PdfBox, media: PdfBox, userUnit = 1) {
  // Bleed outside the physical MediaBox cannot be output. Preserve negative
  // margins: a malformed box must not appear to pass a zero-bleed target.
  const outer = { x: Math.max(bleed.x, media.x), y: Math.max(bleed.y, media.y), right: Math.min(bleed.x+bleed.width, media.x+media.width), top: Math.min(bleed.y+bleed.height, media.y+media.height) };
  return [trim.x-outer.x, trim.y-outer.y, outer.right-trim.x-trim.width, outer.top-trim.y-trim.height].map(n => pointsToMm(n, userUnit));
}
export function containsBox(outer: PdfBox, inner: PdfBox) {
  return inner.width > 0 && inner.height > 0 && inner.x >= outer.x-0.01 && inner.y >= outer.y-0.01 && inner.x+inner.width <= outer.x+outer.width+0.01 && inner.y+inner.height <= outer.y+outer.height+0.01;
}
