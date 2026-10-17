import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PDFDocument, PDFName } from 'pdf-lib';
import { PDF_SAMPLES } from '../lib/pdf-samples.ts';

test('downloadable teaching PDFs contain the documented page boxes and original raster', async () => {
  const root = new URL('../public/samples/', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
  assert.equal(manifest.samples.length, PDF_SAMPLES.length);
  for (const sample of PDF_SAMPLES) {
    const entry = manifest.samples.find(item => item.id === sample.id);
    assert.ok(entry, sample.id);
    const bytes = await readFile(new URL(entry.file, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, 'asset matches published manifest');
    assert.equal(bytes.length, entry.bytes);
    const doc = await PDFDocument.load(bytes), pages = doc.getPages();
    assert.equal(pages.length, 1);
    const page = pages[0], toMm = n => n * 25.4 / 72;
    assert.equal(page.node.has(PDFName.of('TrimBox')), sample.bleedMm !== null);
    assert.equal(page.node.has(PDFName.of('BleedBox')), sample.bleedMm !== null);
    const trim = page.getTrimBox(), bleed = page.getBleedBox();
    assert.ok(Math.abs(toMm(trim.width) - 210) < .001);
    assert.ok(Math.abs(toMm(trim.height) - 297) < .001);
    if (sample.bleedMm !== null) {
      for (const margin of [trim.x - bleed.x, trim.y - bleed.y, bleed.x + bleed.width - trim.x - trim.width, bleed.y + bleed.height - trim.y - trim.height]) assert.ok(Math.abs(toMm(margin) - sample.bleedMm) < .001);
    }
    const xobjects = page.node.Resources().lookup(PDFName.of('XObject'));
    const images = xobjects.entries().map(([, reference]) => doc.context.lookup(reference)).filter(object => object.dict?.get(PDFName.of('Subtype')) === PDFName.of('Image'));
    assert.equal(images.length, 1, 'one real image, no hidden full-page raster');
    assert.equal(images[0].dict.lookup(PDFName.of('Width')).asNumber(), 600);
    assert.equal(images[0].dict.lookup(PDFName.of('Height')).asNumber(), 300);
    assert.equal(entry.ppi, sample.ppi);
  }
});
