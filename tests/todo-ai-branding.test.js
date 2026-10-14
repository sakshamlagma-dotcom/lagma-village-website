import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const todoAi = path.join(root, "todo-ai");
const icons = path.join(todoAi, "assets", "icons");

test("TODO AI pages reference existing favicon and Apple touch icon assets", async () => {
  const pages = (await readdir(todoAi)).filter((file) => file.endsWith(".html"));
  assert.ok(pages.length > 0);

  for (const page of pages) {
    const html = await readFile(path.join(todoAi, page), "utf8");
    assert.match(html, /assets\/icons\/logo\.svg/, page);
    assert.match(html, /assets\/icons\/favicon\.ico/, page);
    assert.match(html, /assets\/icons\/logo-192\.png/, page);
    for (const asset of ["logo.svg", "favicon.ico", "logo-192.png"]) {
      await readFile(path.join(icons, asset));
    }
  }
});

test("TODO AI PWA manifest icon files exist and declare their actual sizes", async () => {
  const manifest = JSON.parse(await readFile(path.join(todoAi, "manifest.webmanifest"), "utf8"));
  assert.deepEqual(
    manifest.icons.map(({ src, sizes }) => ({ src, sizes })),
    [
      { src: "assets/icons/logo-192.png", sizes: "192x192" },
      { src: "assets/icons/logo-512.png", sizes: "512x512" },
      { src: "assets/icons/logo.svg", sizes: "512x512" },
    ],
  );

  for (const { src, sizes } of manifest.icons) {
    const file = await readFile(path.join(todoAi, src));
    if (src.endsWith(".png")) {
      assert.equal(file.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
      const expectedSize = Number(sizes.split("x")[0]);
      assert.equal(file.readUInt32BE(16), expectedSize);
      assert.equal(file.readUInt32BE(20), expectedSize);
    } else {
      assert.match(file.toString("utf8"), /<svg\b/);
    }
  }
});

test("TODO AI favicon contains 16px, 32px, and 48px icon images", async () => {
  const favicon = await readFile(path.join(icons, "favicon.ico"));
  assert.equal(favicon.readUInt16LE(0), 0);
  assert.equal(favicon.readUInt16LE(2), 1);
  const count = favicon.readUInt16LE(4);
  const dimensions = [];

  for (let index = 0; index < count; index++) {
    const entry = 6 + index * 16;
    dimensions.push([favicon[entry] || 256, favicon[entry + 1] || 256]);
    const length = favicon.readUInt32LE(entry + 8);
    const offset = favicon.readUInt32LE(entry + 12);
    assert.ok(offset + length <= favicon.length);
  }

  assert.deepEqual(dimensions.sort((a, b) => a[0] - b[0]), [[16, 16], [32, 32], [48, 48]]);
});

test("TODO AI interface logo image paths resolve from the app page", async () => {
  for (const script of ["js/app.js", "js/chat-experience.js"]) {
    const source = await readFile(path.join(todoAi, script), "utf8");
    const paths = [...source.matchAll(/src=["'](assets\/icons\/[^"']+)["']/g)].map((match) => match[1]);
    assert.ok(paths.length > 0, `${script} should include TODO AI logo paths`);
    for (const asset of paths) {
      await readFile(path.join(todoAi, asset));
    }
  }
});
