import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://127.0.0.1:4182').replace(/\/$/, '');
const outDir = process.argv[3] || '/tmp/tool-content-runtime-qa';
fs.mkdirSync(outDir, { recursive: true });

const tools = [
  { slug: 'print-readiness-checker', signature: ['3920 × 2800', '6.67%', '280 PPI', '4200 × 3000', '3360 × 2400'] },
  { slug: 'pixels-to-print-size', signature: ['13.44 × 10.08', '34.14 × 25.60'] },
  { slug: 'print-size-to-pixels', signature: ['2480 × 3508', '216 × 303'] },
  { slug: 'dpi-ppi-calculator', signature: ['250 PPI', '300 PPI'] },
  { slug: 'paper-size-pixels-calculator', signature: ['2806 × 3969', '240 PPI'] },
  { slug: 'aspect-ratio-crop-preview', signature: ['16.7%', '0.8333'] },
  { slug: 'bleed-safe-area-calculator', signature: ['154 × 216', '138 × 200'] },
];

const results = [];
function check(name, ok, detail = '') {
  if (!ok) throw new Error(`${name}: ${detail}`);
  results.push({ name, detail });
  console.log('PASS', name, detail);
}

for (const tool of tools) {
  const route = `/tools/${tool.slug}`;
  const res = await fetch(base + route, { redirect: 'manual' });
  const html = await res.text();
  check(`${tool.slug} response 200`, res.status === 200, String(res.status));
  check(`${tool.slug} response is current app content`, html.includes('data-content-value="worked-calculation"') && html.includes('Worked calculation'), `bytes=${html.length}`);
  check(`${tool.slug} response carries Arabic editorial`, html.includes('حساب عملي مفصل') && html.includes('كيف تفسر النتيجة'), 'Arabic data present in response HTML');
  check(`${tool.slug} response carries assumptions and limits`, html.includes('data-content-value="assumptions-and-limits"') && html.includes('Limits and provider checks'));
  for (const value of tool.signature) check(`${tool.slug} response example ${value}`, html.includes(value), value);
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  for (const viewport of [
    { name: 'desktop', width: 1365, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    try {
      for (const tool of tools) {
        const route = `/tools/${tool.slug}`;
        const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
        check(`${tool.slug} ${viewport.name} browser 200`, response?.status() === 200, String(response?.status()));
        const worked = page.locator('[data-content-value="worked-calculation"]');
        const limits = page.locator('[data-content-value="assumptions-and-limits"]');
        const localeSelect = page.locator('select[data-source-lang]');
        await worked.waitFor({ state: 'visible', timeout: 5000 });
        await limits.waitFor({ state: 'visible', timeout: 5000 });
        await localeSelect.waitFor({ state: 'visible', timeout: 5000 });

        for (const lang of ['en', 'ar']) {
          await localeSelect.selectOption(lang);
          await page.waitForFunction((expected) => document.documentElement.lang === expected && document.documentElement.dir === (expected === 'ar' ? 'rtl' : 'ltr'), lang);

          const dir = await page.locator('html').getAttribute('dir');
          const htmlLang = await page.locator('html').getAttribute('lang');
          check(`${tool.slug} ${viewport.name} ${lang} locale state`, dir === (lang === 'ar' ? 'rtl' : 'ltr') && htmlLang === lang, `${htmlLang}/${dir}`);

          const workedLabel = page.locator('[data-content-value="worked-calculation"] [data-en="Worked calculation"][data-ar="حساب عملي مفصل"]').first();
          const interpretLabel = page.locator('[data-content-value="worked-calculation"] [data-en="How to interpret the result"][data-ar="كيف تفسر النتيجة"]').first();
          await workedLabel.waitFor({ state: 'visible', timeout: 5000 });
          await interpretLabel.waitFor({ state: 'visible', timeout: 5000 });
          const workedLabelText = (await workedLabel.innerText()).trim();
          const interpretLabelText = (await interpretLabel.innerText()).trim();
          if (lang === 'ar') {
            check(`${tool.slug} ${viewport.name} Arabic labels visible`, workedLabelText === 'حساب عملي مفصل' && interpretLabelText === 'كيف تفسر النتيجة', `${workedLabelText} | ${interpretLabelText}`);
          } else {
            check(
              `${tool.slug} ${viewport.name} English labels visible`,
              workedLabelText.toLowerCase() === 'worked calculation' && interpretLabelText.toLowerCase() === 'how to interpret the result',
              `${workedLabelText} | ${interpretLabelText}`,
            );
          }

          const bodyText = await page.locator('body').innerText();
          for (const value of tool.signature) check(`${tool.slug} ${viewport.name} ${lang} example ${value}`, bodyText.includes(value), value);

          const ordering = await page.evaluate(() => {
            const toolElement = document.querySelector('.tool-page');
            const editorial = document.querySelector('[data-content-value="worked-calculation"]');
            return Boolean(toolElement && editorial && (toolElement.compareDocumentPosition(editorial) & Node.DOCUMENT_POSITION_FOLLOWING));
          });
          check(`${tool.slug} ${viewport.name} ${lang} calculator before long-form explanation`, ordering);

          const nextHref = await page.locator('[data-content-value="worked-calculation"] a.text-link').getAttribute('href');
          check(`${tool.slug} ${viewport.name} ${lang} related next-step link`, Boolean(nextHref && nextHref.startsWith('/')), String(nextHref));

          const dims = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
          check(`${tool.slug} ${viewport.name} ${lang} no page overflow`, dims.scrollWidth <= dims.clientWidth + 1, `${dims.scrollWidth}/${dims.clientWidth}`);
          await page.screenshot({ path: path.join(outDir, `${viewport.name}-${lang}-${tool.slug}.png`), fullPage: true });
        }
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(outDir, 'tool-content-runtime-results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), base, results }, null, 2));
console.log(`TOOL CONTENT RUNTIME QA PASS: ${tools.length} tools; response HTML + desktop/mobile EN/AR browser checks via the real locale selector.`);
