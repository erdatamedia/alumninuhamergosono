// Generator ikon PWA sederhana (solid color + inisial "NH") tanpa dependency image library.
// Cukup untuk memenuhi syarat installability; ganti dengan desain resmi kapan saja.
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      let cc = n;
      for (let k = 0; k < 8; k++) cc = cc & 1 ? 0xedb88320 ^ (cc >>> 1) : cc >>> 1;
      t[n] = cc;
    }
    return t;
  })());
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Gambar lingkaran sederhana warna hijau tua di atas latar putih, dengan huruf "NH" blok kasar.
function drawIcon(size) {
  const bg = [255, 255, 255];
  const fg = [21, 128, 61]; // green-700
  const px = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const inCircle = dx * dx + dy * dy <= r * r;
      const idx = (y * size + x) * 4;
      const color = inCircle ? fg : bg;
      px[idx] = color[0];
      px[idx + 1] = color[1];
      px[idx + 2] = color[2];
      px[idx + 3] = 255;
    }
  }

  // Huruf "NH" kasar, digambar sebagai blok putih di tengah lingkaran.
  const barW = Math.max(2, Math.round(size * 0.06));
  const letterTop = Math.round(size * 0.3);
  const letterBottom = Math.round(size * 0.7);
  const nLeft = Math.round(size * 0.28);
  const nRight = Math.round(size * 0.48);
  const hLeft = Math.round(size * 0.52);
  const hRight = Math.round(size * 0.72);

  function setWhite(x, y) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    px[idx] = 255;
    px[idx + 1] = 255;
    px[idx + 2] = 255;
  }

  for (let y = letterTop; y < letterBottom; y++) {
    // N: dua garis vertikal
    for (let w = 0; w < barW; w++) {
      setWhite(nLeft + w, y);
      setWhite(nRight - w, y);
    }
    // H: dua garis vertikal
    for (let w = 0; w < barW; w++) {
      setWhite(hLeft + w, y);
      setWhite(hRight - w, y);
    }
  }
  // diagonal N
  const diagLen = letterBottom - letterTop;
  for (let i = 0; i < diagLen; i++) {
    const t = i / diagLen;
    const x = Math.round(nLeft + t * (nRight - nLeft));
    const y = letterTop + i;
    for (let w = 0; w < barW; w++) setWhite(x + w, y);
  }
  // palang H
  const hMidY = Math.round((letterTop + letterBottom) / 2);
  for (let w = 0; w < barW; w++) {
    for (let x = hLeft; x <= hRight; x++) setWhite(x, hMidY + w - Math.floor(barW / 2));
  }

  return px;
}

function encodePNG(size) {
  const px = drawIcon(size);
  const rowBytes = size * 4;
  const raw = Buffer.alloc((rowBytes + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (rowBytes + 1)] = 0; // filter type: none
    Buffer.from(px.buffer, y * rowBytes, rowBytes).copy(raw, y * (rowBytes + 1) + 1);
  }
  const idat = zlib.deflateSync(raw);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const buf = encodePNG(size);
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), buf);
  console.log(`Dibuat icon-${size}.png`);
}

console.log("Selesai generate ikon.");
