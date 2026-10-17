// Reproducible, first-party training assets. Run with Node 22 --experimental-strip-types.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PDF_SAMPLES } from '../lib/pdf-samples.ts';

const out = fileURLToPath(new URL('../public/samples/', import.meta.url));
const mm = value => value * 72 / 25.4;
function patternPng() {
  function crc(bytes) { let n = 0xffffffff; for (const b of bytes) { n ^= b; for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; } return (n ^ 0xffffffff) >>> 0; }
  function chunk(name, data) { const tag = Buffer.from(name), length = Buffer.alloc(4), checksum = Buffer.alloc(4); length.writeUInt32BE(data.length); checksum.writeUInt32BE(crc(Buffer.concat([tag, data]))); return Buffer.concat([length, tag, data, checksum]); }
  const width = 600, height = 300, header = Buffer.alloc(13), raw = Buffer.alloc((width * 3 + 1) * height);
  header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const o = y * (width * 3 + 1) + 1 + x * 3;
    const line = x % 30 < 2 || y % 30 < 2;
    const stripe = x > 300 && ((x + y) % 12 < 6);
    const color = line ? [232, 240, 243] : stripe ? [25, 64, 83] : [43, 112, 127];
    raw[o] = color[0]; raw[o + 1] = color[1]; raw[o + 2] = color[2];
  }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
await mkdir(out, { recursive: true });
const manifest = [];
for (const [index, sample] of PDF_SAMPLES.entries()) {
  const doc = await PDFDocument.create();
  const date = new Date('2026-10-17T00:00:00Z');
  doc.setTitle(`Print Prep Lab - ${sample.title[0]}`); doc.setAuthor('Print Prep Lab'); doc.setSubject('Original PDF geometry and effective image PPI exercise'); doc.setCreator('Print Prep Lab sample generator'); doc.setProducer('Print Prep Lab / pdf-lib'); doc.setCreationDate(date); doc.setModificationDate(date);
  const bleed = sample.bleedMm ?? 0, width = 210 + 2 * bleed, height = 297 + 2 * bleed;
  const page = doc.addPage([mm(width), mm(height)]);
  if (sample.bleedMm !== null) { page.setTrimBox(mm(bleed), mm(bleed), mm(210), mm(297)); page.setBleedBox(0, 0, mm(width), mm(height)); }
  const regular = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(.08, .20, .25), accent = rgb(.17, .44, .50);
  page.drawRectangle({ x: 0, y: 0, width: mm(width), height: mm(height), color: rgb(.95, .97, .96) });
  page.drawRectangle({ x: 0, y: mm(height - 13), width: mm(width), height: mm(13), color: accent });
  function text(value, x, y, size = 12, font = regular) { page.drawText(value, { x: mm(x), y: mm(y), size, font, color: ink }); }
  function paragraph(value, y, size = 12) {
    const max = mm(width - 32); let line = '';
    for (const word of value.split(' ')) { const next = line ? line + ' ' + word : word; if (regular.widthOfTextAtSize(next, size) > max && line) { text(line, 16, y, size); y -= 6; line = word; } else line = next; }
    if (line) text(line, 16, y, size); return y - 11;
  }
  text('PRINT PREP LAB / LEARNING FILE 0' + (index + 1), 16, height - 27, 11, bold);
  text('A4 / ' + (index === 0 ? 'matched geometry' : index === 1 ? 'two problems' : 'unspecified boxes'), 16, height - 44, 25, bold);
  paragraph('Compare with: 210 x 297 mm trim / 3 mm bleed / 300 PPI.', height - 56);
  text(sample.bleedMm === null ? 'No explicit TrimBox or BleedBox.' : `TrimBox: 210 x 297 mm / BleedBox: ${width} x ${height} mm.`, 16, 215);
  text(sample.bleedMm === null ? 'Displayed page size: 210 x 297 mm (fallback).' : `Geometric bleed: ${bleed} mm per edge.`, 16, 206);
  const image = await doc.embedPng(patternPng());
  page.drawImage(image, { x: mm(16), y: mm(140), width: mm(sample.placementMm[0]), height: mm(sample.placementMm[1]) });
  text('Original raster: 600 x 300 pixels. One image placement.', 16, 128);
  text(`Placed size: ${sample.placementMm[0]} x ${sample.placementMm[1]} mm / ${sample.ppi} PPI.`, 16, 119);
  text('EXPECTED FINDING', 16, 99, 11, bold);
  const finding = index === 0 ? 'Size, geometric bleed and image PPI meet the exercise targets.' : index === 1 ? 'A4 size matches. Bleed and image PPI do not meet the targets.' : 'Displayed A4 size and image PPI match. Bleed needs review.';
  const bottom = paragraph(finding, 89);
  paragraph('Teaching file only. Not a print-ready or PDF/X template. Standard PDF fonts and RGB artwork are used. Check fonts, color and actual bleed coverage separately.', bottom, 11);
  text('Read the worked analysis: printpreplab.pages.dev/guides/prepare-pdf-for-print', 16, 18, 9);
  const bytes = await doc.save(); const file = sample.id + '.pdf'; await writeFile(out + file, bytes);
  manifest.push({ id: sample.id, file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), trimMm: [210, 297], bleedMm: sample.bleedMm, imagePixels: [600, 300], placementMm: sample.placementMm, ppi: sample.ppi });
}
await writeFile(out + 'manifest.json', JSON.stringify({ version: 1, generated: '2026-10-17', samples: manifest }, null, 2) + '\n');
console.log(`Generated ${manifest.length} original PDF examples.`);
