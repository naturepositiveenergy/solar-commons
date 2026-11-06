// Solar Commons: draws the app icon and saves it in the icons/ folder.
//
// The icon is a small solar park in the style of the start screen: a sun over a row of
// wide-spaced solar panels, with meadow and a pond below, on hedge green.
// It is drawn from the shapes below, so changing a colour or a position here and running
// the tool again renews all icon files. No downloads or extra programs are needed:
//
//     node tools/make-icons.js
//
// Files made (sizes in pixels):
//   icons/icon.svg               the browser-tab icon (a drawing that stays sharp at every size)
//   icons/icon-192.png, -512.png the app icon with rounded corners (computers, app lists)
//   icons/icon-maskable-512.png  for Android, which cuts icons into its own shape (circle, rounded
//                                square...); the picture is a bit smaller so nothing is cut off
//   icons/apple-touch-icon.png   180, for iPhone and iPad home screens (iOS rounds the corners)

'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'icons');

// Colours from css/style.css
const C = {
  hedge: '#3F7F33', panel: '#2C3E5C', meadow: '#B5CF7E', pond: '#5B9BC4', sun: '#E5BE57'
};

// The picture on a 512 × 512 grid. rect: x, y, width, height, corner radius
// (one number, or four: top-left, top-right, bottom-right, bottom-left).
const TILE = 100, GAP = 16, LEFT = 90, ROW1 = 236, ROW2 = ROW1 + TILE + GAP, R = 14;
const PICTURE = [
  { circle: [256, 134, 66], fill: C.sun },
  // top row: wide-spaced panels (panel above, meadow below, as on the map)
  ...[0, 1, 2].flatMap(i => [
    { rect: [LEFT + i * (TILE + GAP), ROW1, TILE, TILE, R], fill: C.meadow },
    { rect: [LEFT + i * (TILE + GAP), ROW1, TILE, TILE * 0.56, [R, R, 0, 0]], fill: C.panel }
  ]),
  // bottom row: meadow, pond, meadow
  { rect: [LEFT, ROW2, TILE, TILE, R], fill: C.meadow },
  { rect: [LEFT + TILE + GAP, ROW2, TILE, TILE, 36], fill: C.pond },
  { rect: [LEFT + 2 * (TILE + GAP), ROW2, TILE, TILE, R], fill: C.meadow }
];

// The variants: background corner radius (0 = square to the edge) and picture size
const VARIANTS = {
  any: { corner: 112, scale: 1 },
  maskable: { corner: 0, scale: 0.8 },
  apple: { corner: 0, scale: 0.9 }
};

function shapesFor(variant) {
  const { corner, scale } = VARIANTS[variant];
  const move = v => 256 + (v - 256) * scale;
  const picture = PICTURE.map(s => s.circle
    ? { circle: [move(s.circle[0]), move(s.circle[1]), s.circle[2] * scale], fill: s.fill }
    : { rect: [move(s.rect[0]), move(s.rect[1]), s.rect[2] * scale, s.rect[3] * scale,
        [].concat(s.rect[4]).map(r => r * scale)], fill: s.fill });
  return [{ rect: [0, 0, 512, 512, corner], fill: C.hedge }, ...picture];
}

// ----- Drawing pixels -----
const radii = r => { const a = [].concat(r); return a.length === 1 ? [a[0], a[0], a[0], a[0]] : a; };
function inside(s, x, y) {
  if (s.circle) {
    const [cx, cy, r] = s.circle;
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  }
  const [rx, ry, w, h, r] = s.rect;
  if (x < rx || y < ry || x > rx + w || y > ry + h) return false;
  const [tl, tr, br, bl] = radii(r);
  const corner = (cx, cy, rad) => (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad;
  if (x < rx + tl && y < ry + tl) return corner(rx + tl, ry + tl, tl);
  if (x > rx + w - tr && y < ry + tr) return corner(rx + w - tr, ry + tr, tr);
  if (x > rx + w - br && y > ry + h - br) return corner(rx + w - br, ry + h - br, br);
  if (x < rx + bl && y > ry + h - bl) return corner(rx + bl, ry + h - bl, bl);
  return true;
}
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

function drawPixels(variant, size) {
  const shapes = shapesFor(variant).map(s => ({ ...s, color: rgb(s.fill) })).reverse();   // topmost first
  const N = 4;   // 4 × 4 samples per pixel give smooth edges
  const out = Buffer.alloc(size * size * 4);
  const unit = 512 / size;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < N; sy++) {
        for (let sx = 0; sx < N; sx++) {
          const x = (px + (sx + 0.5) / N) * unit, y = (py + (sy + 0.5) / N) * unit;
          const hit = shapes.find(s => inside(s, x, y));
          if (hit) { r += hit.color[0]; g += hit.color[1]; b += hit.color[2]; a++; }
        }
      }
      const i = (py * size + px) * 4;
      if (a) { out[i] = Math.round(r / a); out[i + 1] = Math.round(g / a); out[i + 2] = Math.round(b / a); }
      out[i + 3] = Math.round(a / (N * N) * 255);
    }
  }
  return out;
}

// ----- PNG file format -----
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const byte of buf) c = CRC[(c ^ byte) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const head = Buffer.alloc(4); head.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const tail = Buffer.alloc(4); tail.writeUInt32BE(crc32(body));
  return Buffer.concat([head, body, tail]);
}
function png(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;   // 8 bits per channel, red-green-blue-alpha
  const rows = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) pixels.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}

// ----- SVG drawing -----
const num = n => +n.toFixed(2);
function svgShape(s) {
  if (s.circle) return `<circle cx="${num(s.circle[0])}" cy="${num(s.circle[1])}" r="${num(s.circle[2])}" fill="${s.fill}"/>`;
  const [x, y, w, h, r] = s.rect;
  const [tl, tr, br, bl] = radii(r).map(num);
  if (tl === tr && tr === br && br === bl) {
    return `<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}"${tl ? ` rx="${tl}"` : ''} fill="${s.fill}"/>`;
  }
  const d = `M${num(x + tl)} ${num(y)}H${num(x + w - tr)}${tr ? `A${tr} ${tr} 0 0 1 ${num(x + w)} ${num(y + tr)}` : ''}` +
    `V${num(y + h - br)}${br ? `A${br} ${br} 0 0 1 ${num(x + w - br)} ${num(y + h)}` : ''}` +
    `H${num(x + bl)}${bl ? `A${bl} ${bl} 0 0 1 ${num(x)} ${num(y + h - bl)}` : ''}` +
    `V${num(y + tl)}${tl ? `A${tl} ${tl} 0 0 1 ${num(x + tl)} ${num(y)}` : ''}Z`;
  return `<path d="${d}" fill="${s.fill}"/>`;
}
function svg(variant) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n` +
    shapesFor(variant).map(s => '  ' + svgShape(s)).join('\n') + '\n</svg>\n';
}

// ----- Save -----
fs.mkdirSync(OUT, { recursive: true });
const files = [
  ['icon.svg', () => svg('any')],
  ['icon-192.png', () => png(192, drawPixels('any', 192))],
  ['icon-512.png', () => png(512, drawPixels('any', 512))],
  ['icon-maskable-512.png', () => png(512, drawPixels('maskable', 512))],
  ['apple-touch-icon.png', () => png(180, drawPixels('apple', 180))]
];
for (const [name, make] of files) {
  const data = make();
  fs.writeFileSync(path.join(OUT, name), data);
  console.log(`  icons/${name}  ${Math.round(Buffer.byteLength(data) / 1024 * 10) / 10} KB`);
}
console.log('Done.');
