import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://127.0.0.1:4182').replace(/\/$/, '');
const outDir = process.argv[3] || '/tmp/qa-readiness-locale';
fs.mkdirSync(outDir, { recursive: true });

const route = '/tools/print-readiness-checker';
const results = [];
function check(name, ok, detail = '') {
  if (!ok) throw new Error(`${name}: ${detail}`);
  results.push({ name, detail });
  console.log('PASS', name, detail);
}

const pixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  for (const viewport of [
    { name: 'desktop', width: 1365, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    try {
      const response = await page.goto(base + route, { waitUntil: 'networkidle' });
      check(`${viewport.name} route 200`, response?.status() === 200, String(response?.status()));
      check(`${viewport.name} current app calculator present`, await page.locator('.lab-card').count() === 1);
      check(`${viewport.name} new editorial content preserved`, await page.locator('[data-content-value="worked-calculation"]').count() === 1);

      const locale = page.locator('select[data-source-lang]');
      const calculator = page.locator('.lab-card');
      const numeric = calculator.locator('input[type="number"]');
      const targetSelect = calculator.locator('#print-size');
      const orientation = calculator.locator('.control-label button').first();
      const quality240 = calculator.locator('.segment-control button').filter({ hasText: '240' });
      const quality300 = calculator.locator('.segment-control button').filter({ hasText: '300' });
      const waitForCalculatorLanguage = (lang) => page.waitForFunction((expected) => document.querySelector('.lab-card')?.getAttribute('data-readiness-language') === expected, lang);

      await locale.selectOption('ar');
      await page.waitForFunction(() => document.documentElement.lang === 'ar' && document.documentElement.dir === 'rtl');
      await waitForCalculatorLanguage('ar');
      let calcText = await calculator.innerText();
      check(`${viewport.name} Arabic controls translated`, calcText.includes('أبعاد الصورة') && calcText.includes('العرض') && calcText.includes('الارتفاع') && calcText.includes('الطباعة المستهدفة') && calcText.includes('الجودة المطلوبة'), calcText.slice(0, 500));
      check(`${viewport.name} Arabic action and quality labels translated`, calcText.includes('أفقي') && calcText.includes('بوستر') && calcText.includes('تفاصيل جيدة') && calcText.includes('طباعة دقيقة'));
      check(`${viewport.name} Arabic result labels translated`, calcText.includes('جاهزية الطباعة') && calcText.includes('PPI فعلي') && calcText.includes('ملف المصدر') && calcText.includes('القص المطلوب') && calcText.includes('البكسلات المطلوبة'));
      check(`${viewport.name} Arabic print-size option translated`, (await targetSelect.locator('option:checked').innerText()).includes('صورة 4 × 6'));
      check(`${viewport.name} Arabic explanation remains translated`, (await page.locator('[data-content-value="worked-calculation"]').innerText()).includes('حساب عملي مفصل'));

      await calculator.locator('input[type="file"]').setInputFiles({ name: 'one.png', mimeType: 'image/png', buffer: pixelPng });
      await page.waitForFunction(() => {
        const inputs = document.querySelectorAll('.lab-card input[type="number"]');
        return inputs.length >= 2 && inputs[0].value === '1' && inputs[1].value === '1';
      });
      check(`${viewport.name} local image upload still updates dimensions`, await calculator.locator('.print-preview img').count() === 1, `${await numeric.nth(0).inputValue()}×${await numeric.nth(1).inputValue()}`);

      await numeric.nth(0).fill('600');
      await numeric.nth(1).fill('400');
      await targetSelect.selectOption('8x10-photo');
      await quality240.click();
      await page.waitForFunction(() => document.querySelector('[data-required-pixels]')?.textContent?.includes('2400 × 1920'));
      check(`${viewport.name} Arabic dynamic low status after value changes`, (await calculator.locator('[data-readiness-status]').innerText()).trim() === 'أقل من الهدف', await calculator.locator('[data-readiness-status]').innerText());
      check(`${viewport.name} Arabic dynamic effective PPI after value changes`, (await calculator.locator('[data-effective-ppi]').innerText()).includes('PPI فعلي'), await calculator.locator('[data-effective-ppi]').innerText());
      check(`${viewport.name} required-pixels capability restored`, (await calculator.locator('[data-required-pixels]').innerText()).includes('2400 × 1920'), await calculator.locator('[data-required-pixels]').innerText());
      check(`${viewport.name} crop metric remains dynamic`, Number.parseFloat(await calculator.locator('[data-crop-percent]').innerText()) > 0, await calculator.locator('[data-crop-percent]').innerText());

      await orientation.click();
      check(`${viewport.name} Arabic orientation button updates dynamically`, (await orientation.innerText()).includes('رأسي'), await orientation.innerText());

      await locale.selectOption('en');
      await page.waitForFunction(() => document.documentElement.lang === 'en' && document.documentElement.dir === 'ltr');
      await waitForCalculatorLanguage('en');
      calcText = await calculator.innerText();
      const englishCalcText = calcText.toLowerCase();
      check(`${viewport.name} English controls restored on language toggle`, englishCalcText.includes('image dimensions') && englishCalcText.includes('width') && englishCalcText.includes('height') && englishCalcText.includes('target print') && englishCalcText.includes('quality target'), calcText.slice(0, 500));
      const englishStatus = (await calculator.locator('[data-readiness-status]').innerText()).trim();
      check(`${viewport.name} English dynamic result restored on language toggle`, englishStatus.toLowerCase() === 'below target', englishStatus);
      const englishOrientation = await orientation.innerText();
      check(`${viewport.name} orientation state survives language toggle`, englishOrientation.toLowerCase().includes('portrait'), englishOrientation);
      check(`${viewport.name} numeric state survives language toggle`, (await numeric.nth(0).inputValue()) === '600' && (await numeric.nth(1).inputValue()) === '400', `${await numeric.nth(0).inputValue()}×${await numeric.nth(1).inputValue()}`);

      await numeric.nth(0).fill('4200');
      await numeric.nth(1).fill('2800');
      await quality300.click();
      await orientation.click();
      await locale.selectOption('ar');
      await page.waitForFunction(() => document.documentElement.lang === 'ar' && document.documentElement.dir === 'rtl');
      await waitForCalculatorLanguage('ar');
      check(`${viewport.name} Arabic dynamic ready status after second value change`, (await calculator.locator('[data-readiness-status]').innerText()).trim() === 'مناسب للهدف', await calculator.locator('[data-readiness-status]').innerText());
      check(`${viewport.name} values survive EN to AR round-trip`, (await numeric.nth(0).inputValue()) === '4200' && (await numeric.nth(1).inputValue()) === '2800', `${await numeric.nth(0).inputValue()}×${await numeric.nth(1).inputValue()}`);

      const dims = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
      check(`${viewport.name} Arabic no page overflow`, dims.scrollWidth <= dims.clientWidth + 1, `${dims.scrollWidth}/${dims.clientWidth}`);
      await page.screenshot({ path: path.join(outDir, `${viewport.name}-ar-print-readiness.png`), fullPage: true });
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(outDir, 'print-readiness-locale-results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), base, results }, null, 2));
console.log('PRINT READINESS LOCALE QA PASS: Arabic/English controls, dynamic results, language round-trip, upload parity, required pixels, desktop/mobile screenshots.');
