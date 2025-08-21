const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const BASE_URL = process.env.KAUFPARK_BASE_URL || 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, '..', 'qrs');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function spotUrl(spot) {
  return `${BASE_URL}/spot/${encodeURIComponent(spot)}`;
}

async function main() {
  const spots = Array.from({ length: 10 }, (_, i) => `A-${i + 1}`);
  for (const spot of spots) {
    const url = spotUrl(spot);
    const file = path.join(OUT_DIR, `${spot}.png`);
    await QRCode.toFile(file, url, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 512,
      color: {
        dark: '#000000',
        light: '#FFFFFFFF'
      }
    });
    // eslint-disable-next-line no-console
    console.log(`QR generado: ${file} -> ${url}`);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

