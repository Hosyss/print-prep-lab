import assert from "node:assert/strict";
import test from "node:test";
import {
  MM_PER_INCH,
  PRINT_PRESETS,
  bleedPlan,
  cropRetention,
  effectivePpi,
  effectivePpiDetails,
  formatDecimal,
  gcd,
  inchesToMm,
  mmToInches,
  physicalSizeToMm,
  pixelsForMm,
  printSizeAtPpi,
  ratioLabel,
  readiness,
} from "../lib/print-math.ts";

const closeTo = (actual, expected, tolerance = 1e-10) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
};

test("the exact inch definition converts in both directions", () => {
  assert.equal(MM_PER_INCH, 25.4);
  assert.equal(mmToInches(25.4), 1);
  assert.equal(inchesToMm(1), 25.4);
  closeTo(mmToInches(inchesToMm(13.75)), 13.75);
});

test("physical input units normalize to millimetres", () => {
  closeTo(physicalSizeToMm(8.5, "in"), 215.9);
  assert.equal(physicalSizeToMm(21, "cm"), 210);
  assert.equal(physicalSizeToMm(297, "mm"), 297);
});

const expectedPresets = {
  a2: [420, 594],
  a3: [297, 420],
  a4: [210, 297],
  a5: [148, 210],
  "us-letter": [215.9, 279.4],
  "us-legal": [215.9, 355.6],
  "4x6-photo": [101.6, 152.4],
  "5x7-photo": [127, 177.8],
  "8x10-photo": [203.2, 254],
  "11x14-photo": [279.4, 355.6],
  "12x18-photo": [304.8, 457.2],
  "16x20-photo": [406.4, 508],
};

test("all stored paper and photo presets retain their standard trim dimensions", () => {
  assert.equal(PRINT_PRESETS.length, Object.keys(expectedPresets).length);
  for (const preset of PRINT_PRESETS) {
    assert.deepEqual([preset.widthMm, preset.heightMm], expectedPresets[preset.slug]);
  }
});

const ppiTargets = [72, 96, 150, 240, 300, 600];
for (const preset of PRINT_PRESETS) {
  for (const ppi of ppiTargets) {
    test(`${preset.shortLabel} converts consistently at ${ppi} PPI`, () => {
      const expectedWidth = Math.round((preset.widthMm / 25.4) * ppi);
      const expectedHeight = Math.round((preset.heightMm / 25.4) * ppi);
      assert.equal(pixelsForMm(preset.widthMm, ppi), expectedWidth);
      assert.equal(pixelsForMm(preset.heightMm, ppi), expectedHeight);

      const roundTrip = printSizeAtPpi(expectedWidth, expectedHeight, ppi);
      const halfPixelInMm = (25.4 / ppi) / 2 + 1e-10;
      assert.ok(Math.abs(inchesToMm(roundTrip.widthIn) - preset.widthMm) <= halfPixelInMm);
      assert.ok(Math.abs(inchesToMm(roundTrip.heightIn) - preset.heightMm) <= halfPixelInMm);
    });
  }
}

test("common 300 PPI exports match established whole-pixel values", () => {
  const expected = {
    a2: [4961, 7016],
    a3: [3508, 4961],
    a4: [2480, 3508],
    a5: [1748, 2480],
    "us-letter": [2550, 3300],
    "us-legal": [2550, 4200],
    "4x6-photo": [1200, 1800],
    "5x7-photo": [1500, 2100],
    "8x10-photo": [2400, 3000],
    "11x14-photo": [3300, 4200],
    "12x18-photo": [3600, 5400],
    "16x20-photo": [4800, 6000],
  };
  for (const preset of PRINT_PRESETS) {
    assert.deepEqual([pixelsForMm(preset.widthMm, 300), pixelsForMm(preset.heightMm, 300)], expected[preset.slug]);
  }
});

test("pixel dimensions convert to physical print size without changing pixel count", () => {
  const result = printSizeAtPpi(3000, 2400, 300);
  assert.deepEqual(result, { widthIn: 10, heightIn: 8, widthCm: 25.4, heightCm: 20.32 });

  const poster = printSizeAtPpi(6000, 4000, 150);
  assert.equal(poster.widthIn, 40);
  closeTo(poster.heightIn, 26.666666666666668);
});

test("effective PPI exposes both axes and reports the limiting axis", () => {
  const details = effectivePpiDetails(3000, 2400, 254, 203.2);
  assert.deepEqual(details, { widthPpi: 300, heightPpi: 300, effectivePpi: 300 });

  const mismatched = effectivePpiDetails(6000, 4000, 254, 254);
  assert.equal(mismatched.widthPpi, 600);
  assert.equal(mismatched.heightPpi, 400);
  assert.equal(mismatched.effectivePpi, 400);
  assert.equal(effectivePpi(6000, 4000, 254, 254), 400);
});

test("crop math is exact for matching and mismatched aspect ratios", () => {
  assert.deepEqual(cropRetention(6000, 4000, 152.4, 101.6), { retainedPercent: 100, croppedPercent: 0 });

  const fourByFive = cropRetention(6000, 4000, 254, 203.2);
  closeTo(fourByFive.retainedPercent, 83.33333333333334);
  closeTo(fourByFive.croppedPercent, 16.666666666666664);

  const transposed = cropRetention(4000, 6000, 203.2, 254);
  closeTo(transposed.retainedPercent, fourByFive.retainedPercent);
  closeTo(transposed.croppedPercent, fourByFive.croppedPercent);
});

test("crop outputs remain bounded and sum to 100 percent", () => {
  const cases = [
    [4000, 3000, 210, 297],
    [7952, 5304, 279.4, 355.6],
    [1200, 1800, 203.2, 254],
    [1, 10_000, 304.8, 457.2],
    [10_000, 1, 101.6, 152.4],
  ];
  for (const values of cases) {
    const crop = cropRetention(...values);
    assert.ok(crop.retainedPercent >= 0 && crop.retainedPercent <= 100);
    assert.ok(crop.croppedPercent >= 0 && crop.croppedPercent <= 100);
    closeTo(crop.retainedPercent + crop.croppedPercent, 100);
  }
});

test("bleed and safe-area calculations use margins on both edges", () => {
  const a4 = bleedPlan(210, 297, 3, 5, 300);
  assert.deepEqual(a4, {
    canvasWidthMm: 216,
    canvasHeightMm: 303,
    safeWidthMm: 200,
    safeHeightMm: 287,
    canvasWidthPx: 2551,
    canvasHeightPx: 3579,
  });

  const noMargins = bleedPlan(101.6, 152.4, 0, 0, 300);
  assert.equal(noMargins.canvasWidthPx, 1200);
  assert.equal(noMargins.canvasHeightPx, 1800);
  assert.equal(noMargins.safeWidthMm, 101.6);
  assert.equal(noMargins.safeHeightMm, 152.4);
});

test("safe area cannot become negative", () => {
  const result = bleedPlan(20, 10, 3, 8, 300);
  assert.equal(result.safeWidthMm, 4);
  assert.equal(result.safeHeightMm, 0);
});

test("readiness boundaries are explicit relative to the selected target", () => {
  assert.equal(readiness(300, 300).key, "ready");
  assert.equal(readiness(299.7, 300).key, "ready");
  assert.equal(readiness(299.699, 300).key, "close");
  assert.equal(readiness(240, 300).key, "close");
  assert.equal(readiness(239.999, 300).key, "limited");
  assert.equal(readiness(150, 300).key, "limited");
  assert.equal(readiness(149.999, 300).key, "low");
  assert.equal(readiness(effectivePpi(2480, 3508, 210, 297), 300).key, "ready");
});

test("ratio labels reduce common whole-pixel dimensions", () => {
  assert.equal(gcd(6000, 4000), 2000);
  assert.equal(ratioLabel(6000, 4000), "3:2");
  assert.equal(ratioLabel(2400, 3000), "4:5");
  assert.equal(ratioLabel(2480, 3508), "0.71:1");
});

test("invalid and non-finite conversion inputs fail safely", () => {
  for (const invalid of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(pixelsForMm(invalid, 300), 0);
    assert.equal(pixelsForMm(210, invalid), 0);
    assert.equal(physicalSizeToMm(invalid, "in"), 0);
    assert.equal(effectivePpi(invalid, 2000, 210, 297), 0);
    assert.deepEqual(cropRetention(invalid, 2000, 210, 297), { retainedPercent: 0, croppedPercent: 0 });
    assert.equal(readiness(invalid, 300).key, "low");
  }

  assert.deepEqual(printSizeAtPpi(3000, 2000, 0), { widthIn: 0, heightIn: 0, widthCm: 0, heightCm: 0 });
  assert.equal(printSizeAtPpi(-3000, 2000, 300).widthIn, 0);
  assert.deepEqual(bleedPlan(0, 297, 3, 5, 300), { canvasWidthMm: 0, canvasHeightMm: 0, safeWidthMm: 0, safeHeightMm: 0, canvasWidthPx: 0, canvasHeightPx: 0 });
  assert.equal(pixelsForMm(Number.MAX_VALUE, 300), 0);
  assert.equal(ratioLabel(Number.NaN, 100), "—");
  assert.equal(formatDecimal(Number.POSITIVE_INFINITY), "—");
});

test("negative optional margins are treated as zero and invalid PPI does not corrupt physical results", () => {
  const result = bleedPlan(100, 80, -3, -5, 0);
  assert.equal(result.canvasWidthMm, 100);
  assert.equal(result.canvasHeightMm, 80);
  assert.equal(result.safeWidthMm, 100);
  assert.equal(result.safeHeightMm, 80);
  assert.equal(result.canvasWidthPx, 0);
  assert.equal(result.canvasHeightPx, 0);
});

test("display formatting remains finite and precision-bounded", () => {
  assert.equal(formatDecimal(1234.567, 2), "1,234.57");
  assert.equal(formatDecimal(1.234567, -4), "1");
  assert.equal(formatDecimal(1.234567, 99), "1.234567");
});
