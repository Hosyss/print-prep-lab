import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PRINT_PRESETS,
  bleedPlan,
  cropRetention,
  effectivePpiDetails,
  pixelsForMm,
  printSizeAtPpi,
} from '../lib/print-math.ts';

const closeTo = (actual, expected, tolerance = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} ≈ ${expected}`);
};

test('all seven editorial worked examples agree with calculator math', () => {
  // Print Readiness: 4200×2800 (3:2) filling 14×10 (7:5).
  const readinessCrop = cropRetention(4200, 2800, 14 * 25.4, 10 * 25.4);
  closeTo(readinessCrop.croppedPercent, 6.666666666666665);
  const croppedWidth = 2800 * (14 / 10);
  assert.equal(croppedWidth, 3920);
  const readinessPpi = effectivePpiDetails(croppedWidth, 2800, 14 * 25.4, 10 * 25.4);
  assert.deepEqual(readinessPpi, { widthPpi: 280, heightPpi: 280, effectivePpi: 280 });
  assert.deepEqual([14 * 300, 10 * 300], [4200, 3000]);
  assert.deepEqual([14 * 240, 10 * 240], [3360, 2400]);

  // Pixels → Print Size.
  const pixelPrint = printSizeAtPpi(4032, 3024, 300);
  assert.equal(pixelPrint.widthIn, 13.44);
  assert.equal(pixelPrint.heightIn, 10.08);
  closeTo(pixelPrint.widthCm, 34.1376);
  closeTo(pixelPrint.heightCm, 25.6032);

  // Print Size → Pixels: A4 trim and 3 mm bleed canvas.
  const a4 = PRINT_PRESETS.find((item) => item.slug === 'a4');
  assert.ok(a4);
  assert.deepEqual([pixelsForMm(a4.widthMm, 300), pixelsForMm(a4.heightMm, 300)], [2480, 3508]);
  const a4Bleed = bleedPlan(a4.widthMm, a4.heightMm, 3, 0, 300);
  assert.deepEqual([a4Bleed.canvasWidthMm, a4Bleed.canvasHeightMm], [216, 303]);

  // DPI/PPI: 6000×4000 on 20×16.
  const dpiPpi = effectivePpiDetails(6000, 4000, 20 * 25.4, 16 * 25.4);
  assert.deepEqual(dpiPpi, { widthPpi: 300, heightPpi: 250, effectivePpi: 250 });

  // Paper Size → Pixels: A3 at 240 PPI.
  const a3 = PRINT_PRESETS.find((item) => item.slug === 'a3');
  assert.ok(a3);
  assert.deepEqual([pixelsForMm(a3.widthMm, 240), pixelsForMm(a3.heightMm, 240)], [2806, 3969]);

  // Aspect-ratio crop: 3:2 source to 4:5 print.
  const crop = cropRetention(6000, 4000, 10 * 25.4, 8 * 25.4);
  closeTo(crop.retainedPercent, 83.33333333333334);
  closeTo(crop.croppedPercent, 16.666666666666664);

  // Bleed/Safe Area: A5, 3 mm bleed, 5 mm safe margin.
  const a5Plan = bleedPlan(148, 210, 3, 5, 300);
  assert.deepEqual(
    [a5Plan.canvasWidthMm, a5Plan.canvasHeightMm, a5Plan.safeWidthMm, a5Plan.safeHeightMm],
    [154, 216, 138, 200],
  );
});
