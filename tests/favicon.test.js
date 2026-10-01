import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iconDirectory = path.join(root, "icons");

function getFirstPixelAlpha(png) {
  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const firstScanline = inflateSync(Buffer.concat(chunks));
  assert.ok(firstScanline[0] <= 4, "the first PNG scanline should use a valid filter");
  return firstScanline[4];
}

test("favicon images have the declared dimensions and transparent corners", async () => {
  for (const [file, size] of [["lagma-icon-192.png", 192], ["lagma-icon-512.png", 512]]) {
    const image = await readFile(path.join(iconDirectory, file));
    assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(image.readUInt32BE(16), size);
    assert.equal(image.readUInt32BE(20), size);
    assert.equal(image[25], 6, `${file} should use RGBA for transparency`);
    assert.equal(getFirstPixelAlpha(image), 0, `${file} should have transparent corners`);
  }
});

test("village pages reference both favicon PNG sizes", async () => {
  const rootPages = (await readdir(root)).filter((file) => file.endsWith(".html"));
  const pages = [...rootPages, "kissan-help/index.html", "kissan-help/mausam.html"];
  for (const page of pages) {
    const html = await readFile(path.join(root, page), "utf8");
    assert.match(html, /favicon\.ico\?v=1/, page);
    assert.match(html, /lagma-icon-512\.png\?v=2/, page);
    assert.match(html, /lagma-icon-192\.png\?v=2/, page);
  }
});

test("root favicon.ico contains a valid multi-size icon image", async () => {
  const icon = await readFile(path.join(root, "favicon.ico"));
  assert.equal(icon.readUInt16LE(0), 0);
  assert.equal(icon.readUInt16LE(2), 1);
  const imageCount = icon.readUInt16LE(4);
  assert.ok(imageCount >= 4, "the ICO should include multiple browser icon sizes");
  for (let i = 0; i < imageCount; i++) {
    const entry = 6 + i * 16;
    const width = icon[entry] || 256;
    const height = icon[entry + 1] || 256;
    const bytesInImage = icon.readUInt32LE(entry + 8);
    const imageOffset = icon.readUInt32LE(entry + 12);
    assert.ok(width >= 16 && height >= 16);
    assert.ok(imageOffset >= 6 + imageCount * 16);
    assert.ok(imageOffset + bytesInImage <= icon.length);
  }
});

test("manifest declares the transparent Lagma app icon", async () => {
  const manifest = JSON.parse(await readFile(path.join(root, "manifest.webmanifest"), "utf8"));
  assert.deepEqual(
    manifest.icons.map(({ src, sizes, purpose }) => ({ src, sizes, purpose })),
    [
      { src: "icons/lagma-icon-192.png", sizes: "192x192", purpose: "any" },
      { src: "icons/lagma-icon-512.png", sizes: "512x512", purpose: "any" },
    ],
  );
});
