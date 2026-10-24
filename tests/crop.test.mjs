import assert from "node:assert/strict";
import test from "node:test";
import { centeredCrop, constrainCrop, fromPercentCrop, isValidCrop, toPercentCrop } from "../src/lib/image/crop-geometry.ts";
import { cropImage } from "../src/lib/image/crop.ts";
import { downloadImage } from "../src/lib/image/download.ts";

const image = { width: 1200, height: 800 };

test("initial crop is positive, centered, and in original pixels", () => {
  assert.deepEqual(centeredCrop(image), { x: 120, y: 80, width: 960, height: 640 });
  assert.equal(isValidCrop(centeredCrop({ width: 1, height: 1 }), { width: 1, height: 1 }), true);
});

test("all ratio presets fit landscape and portrait images, including tiny images", () => {
  for (const size of [image, { width: 301, height: 701 }, { width: 1, height: 2 }]) {
    for (const ratio of [1, 4 / 3, 16 / 9, 4 / 5]) {
      const crop = centeredCrop(size, ratio);
      assert.equal(isValidCrop(crop, size), true);
      assert.ok(Math.abs(crop.height - crop.width / ratio) <= 1);
    }
  }
});

test("numeric changes and movement remain inside the image", () => {
  assert.deepEqual(constrainCrop({ x: -50, y: 1000, width: 4000, height: 200 }, image), { x: 0, y: 600, width: 1200, height: 200 });
  assert.deepEqual(constrainCrop({ x: 1200, y: 800, width: 0, height: 0 }, image), { x: 1199, y: 799, width: 1, height: 1 });
  const portrait = constrainCrop({ x: 1100, y: 700, width: 100, height: 200 }, image, 4 / 5, "height");
  assert.deepEqual(portrait, { x: 1040, y: 600, width: 160, height: 200 });
});

test("percent conversion maps scaled desktop and mobile previews to identical original pixels", () => {
  const originalCrop = { x: 300, y: 200, width: 600, height: 400 };
  const percent = toPercentCrop(originalCrop, image);
  assert.deepEqual(fromPercentCrop(percent, image), originalCrop);
  for (const previewWidth of [600, 300, 173.25]) {
    const previewHeight = previewWidth * image.height / image.width;
    const preview = { x: previewWidth / 4, y: previewHeight / 4, width: previewWidth / 2, height: previewHeight / 2 };
    const relative = { x: preview.x / previewWidth * 100, y: preview.y / previewHeight * 100, width: preview.width / previewWidth * 100, height: preview.height / previewHeight * 100 };
    assert.deepEqual(fromPercentCrop(relative, image), originalCrop);
  }
});

test("rejects invalid, fractional, and out-of-bounds export regions", () => {
  for (const crop of [
    { x: -1, y: 0, width: 100, height: 100 },
    { x: 1200, y: 0, width: 1, height: 1 },
    { x: 0, y: 0, width: 0, height: 100 },
    { x: 0, y: 0, width: 1201, height: 100 },
    { x: 0.5, y: 0, width: 100, height: 100 },
    { x: NaN, y: 0, width: 100, height: 100 },
  ]) assert.equal(isValidCrop(crop, image), false);
});

globalThis.createImageBitmap = async () => { throw new Error("Unexpected decode"); };
globalThis.document = { createElement() { throw new Error("Unexpected canvas"); }, body: { appendChild() {} } };

for (const type of ["image/png", "image/jpeg", "image/webp"]) {
  test(`exports only the selected region in ${type}`, async (t) => {
    let closed = false;
    let drawArguments;
    let requestedType;
    const bitmap = { ...image, close() { closed = true; } };
    t.mock.method(globalThis, "createImageBitmap", async () => bitmap);
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage(...args) { drawArguments = args; } }), toBlob(cb, mime) { requestedType = mime; cb(new Blob(["encoded crop"], { type })); } };
    t.mock.method(globalThis.document, "createElement", () => canvas);
    const blob = await cropImage(new File(["input"], "Original.Photo.JpEg", { type }), { x: 20, y: 30, width: 200, height: 100 });
    assert.deepEqual(drawArguments, [bitmap, 20, 30, 200, 100, 0, 0, 200, 100]);
    assert.equal(canvas.width, 200);
    assert.equal(canvas.height, 100);
    assert.equal(requestedType, type);
    assert.equal(blob.type, type);
    assert.equal(closed, true);
  });
}

test("rejects encoder fallback and invalid crop and always closes bitmap", async (t) => {
  let closed = 0;
  t.mock.method(globalThis, "createImageBitmap", async () => ({ ...image, close() { closed++; } }));
  t.mock.method(globalThis.document, "createElement", () => ({ width: 0, height: 0, getContext: () => ({ drawImage() {} }), toBlob(cb) { cb(new Blob(["fallback"], { type: "image/png" })); } }));
  const file = new File(["input"], "photo.webp", { type: "image/webp" });
  await assert.rejects(cropImage(file, { x: 0, y: 0, width: 100, height: 100 }), /requested format/);
  await assert.rejects(cropImage(file, { x: 0, y: 0, width: 0, height: 100 }), /boundaries/);
  assert.equal(closed, 2);
  await assert.rejects(cropImage(new File(["input"], "photo.gif", { type: "image/gif" }), { x: 0, y: 0, width: 10, height: 10 }), /Unsupported/);
});

test("download preserves the exact filename and cleans up its object URL", (t) => {
  let clicked = false;
  let removed = false;
  let revoked;
  const link = { href: "", download: "", click() { clicked = true; }, remove() { removed = true; } };
  t.mock.method(globalThis.document, "createElement", () => link);
  t.mock.method(URL, "createObjectURL", () => "blob:test");
  t.mock.method(URL, "revokeObjectURL", (url) => { revoked = url; });
  t.mock.method(globalThis, "setTimeout", (callback) => { callback(); return 0; });
  downloadImage(new Blob(["output"]), "My Original.photo.JpEg");
  assert.equal(link.download, "My Original.photo.JpEg");
  assert.equal(clicked, true);
  assert.equal(removed, true);
  assert.equal(revoked, "blob:test");
});
