import sharp from "sharp";
import { fingerprint, hamming } from "../src/lib/hash/phash";

async function main() {
  // A synthetic "product photo": gradient + shapes, so it has real structure.
  const base = await sharp({
    create: { width: 900, height: 700, channels: 3, background: { r: 235, g: 236, b: 240 } },
  })
    .composite([
      { input: await sharp({ create: { width: 420, height: 260, channels: 3, background: { r: 30, g: 34, b: 44 } } }).png().toBuffer(), top: 210, left: 240 },
      { input: await sharp({ create: { width: 380, height: 30, channels: 3, background: { r: 190, g: 60, b: 40 } } }).png().toBuffer(), top: 120, left: 120 },
      { input: await sharp({ create: { width: 90, height: 400, channels: 3, background: { r: 40, g: 120, b: 90 } } }).png().toBuffer(), top: 150, left: 720 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  // The "clever seller" transforms: resize, recompress hard, brighten, crop a border.
  const resized  = await sharp(base).resize(600).jpeg({ quality: 55 }).toBuffer();
  const bright   = await sharp(base).modulate({ brightness: 1.18 }).jpeg({ quality: 70 }).toBuffer();
  const cropped  = await sharp(base).extract({ left: 20, top: 20, width: 860, height: 660 }).resize(900, 700).jpeg({ quality: 80 }).toBuffer();

  // A genuinely different photo.
  const other = await sharp({ create: { width: 900, height: 700, channels: 3, background: { r: 12, g: 90, b: 140 } } })
    .composite([{ input: await sharp({ create: { width: 500, height: 500, channels: 3, background: { r: 250, g: 240, b: 100 } } }).png().toBuffer(), top: 60, left: 60 }])
    .jpeg().toBuffer();

  const fp = await Promise.all([base, resized, bright, cropped, other].map(fingerprint));
  const [b, r, br, c, o] = fp;

  const rows = [
    ["resized 600px + q55", hamming(b.phash, r.phash),  hamming(b.dhash, r.dhash),  b.sha256 === r.sha256],
    ["brightness +18%",     hamming(b.phash, br.phash), hamming(b.dhash, br.dhash), b.sha256 === br.sha256],
    ["cropped 2% border",   hamming(b.phash, c.phash),  hamming(b.dhash, c.dhash),  b.sha256 === c.sha256],
    ["unrelated image",     hamming(b.phash, o.phash),  hamming(b.dhash, o.dhash),  b.sha256 === o.sha256],
  ];

  console.log("\n transform                pHash-dist  dHash-dist  sha256-match  verdict@threshold6");
  console.log(" " + "-".repeat(76));
  for (const [name, ph, dh, sha] of rows as [string, number, number, boolean][]) {
    const verdict = ph <= 6 ? "DUPLICATE" : ph <= 12 ? "flag for human" : "different";
    console.log(` ${name.padEnd(24)} ${String(ph).padStart(6)}      ${String(dh).padStart(6)}      ${String(sha).padEnd(11)}  ${verdict}`);
  }
  console.log("");
}
main();
