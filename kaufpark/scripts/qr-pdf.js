const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const QRS_DIR = path.join(__dirname, '..', 'qrs');
const OUT_DIR = path.join(__dirname, '..', 'qrs');
const OUT_FILE = path.join(OUT_DIR, 'kaufpark_qrs_A1-A10.pdf');

function mm(value) { return (value / 25.4) * 72; }

async function main() {
  const spots = Array.from({ length: 10 }, (_, i) => `A-${i + 1}`);
  const images = spots.map(s => ({ spot: s, file: path.join(QRS_DIR, `${s}.png`) })).filter(x => fs.existsSync(x.file));
  if (images.length === 0) throw new Error('No hay PNGs en qrs/. Ejecuta npm run gen:qrs primero.');

  const doc = new PDFDocument({ size: 'A4', margin: mm(10) });
  doc.info.Title = 'Kaufpark QR Codes';
  doc.info.Author = 'Kaufpark';
  const stream = fs.createWriteStream(OUT_FILE);
  doc.pipe(stream);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const cols = 2;
  const gap = mm(6);
  const cellWidth = (pageWidth - gap * (cols - 1)) / cols;
  const cellHeight = mm(90);
  const qrSize = mm(60);

  let x = doc.page.margins.left;
  let y = doc.page.margins.top;
  let col = 0;

  doc.fontSize(18).fillColor('#111').text('Kaufpark - Códigos QR', { align: 'center' });
  y += mm(10);

  for (const { spot, file } of images) {
    if (y + cellHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      x = doc.page.margins.left;
      y = doc.page.margins.top;
      col = 0;
    }

    doc.roundedRect(x, y, cellWidth, cellHeight, mm(4)).stroke('#ccc');
    doc.fontSize(12).fillColor('#000').text(`Plaza ${spot}`, x + mm(6), y + mm(6));

    const imgX = x + (cellWidth - qrSize) / 2;
    const imgY = y + mm(18);
    doc.image(file, imgX, imgY, { width: qrSize, height: qrSize });

    const url = process.env.KAUFPARK_BASE_URL ? `${process.env.KAUFPARK_BASE_URL}/spot/${encodeURIComponent(spot)}` : `http://localhost:3000/spot/${encodeURIComponent(spot)}`;
    doc.fontSize(10).fillColor('#444').text(url, x, y + cellHeight - mm(12), { width: cellWidth, align: 'center' });

    col += 1;
    if (col >= cols) {
      col = 0;
      x = doc.page.margins.left;
      y += cellHeight + gap;
    } else {
      x += cellWidth + gap;
    }
  }

  doc.end();
  await new Promise((resolve) => stream.on('finish', resolve));
  // eslint-disable-next-line no-console
  console.log(`PDF generado: ${OUT_FILE}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

