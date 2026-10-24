import assert from "node:assert/strict";
import test from "node:test";
import { resizeImage } from "../src/lib/image/resize.ts";

function mockCanvas(t, resultType, returnsNull = false) {
  let closed = false;
  let requestedType;
  const bitmap = { width: 100, height: 80, close() { closed = true; } };
  const context = { drawImage() {} };
  t.mock.method(globalThis, "createImageBitmap", async () => bitmap);
  t.mock.method(globalThis.document, "createElement", () => ({
    width: 0, height: 0,
    getContext: () => context,
    toBlob(callback, mimeType) {
      requestedType = mimeType;
      callback(returnsNull ? null : new Blob(["encoded image"], { type: resultType }));
    },
  }));
  return { get closed() { return closed; }, get requestedType() { return requestedType; } };
}

// Node has no browser canvas; these tests exercise encoder selection and failure handling.
globalThis.createImageBitmap = async () => { throw new Error("Unexpected decode"); };
globalThis.document = { createElement() { throw new Error("Unexpected canvas"); } };

for (const [type, filename] of [["image/png", "My Photo.PNG"], ["image/jpeg", "My Photo.JpEg"], ["image/webp", "My Photo.webp"]]) {
  test(`requests and accepts the original ${type} encoding`, async (t) => {
    const state = mockCanvas(t, type);
    const file = new File(["input"], filename, { type });
    const result = await resizeImage(file, { width: 50, height: 40 });
    assert.equal(state.requestedType, type);
    assert.equal(result.type, type);
    assert.equal(state.closed, true);
  });
}

test("rejects silent PNG fallback for a WebP input and closes the bitmap", async (t) => {
  const state = mockCanvas(t, "image/png");
  await assert.rejects(resizeImage(new File(["input"], "photo.webp", { type: "image/webp" }), { width: 50, height: 40 }), /requested format/);
  assert.equal(state.closed, true);
});

test("rejects unsupported or missing MIME types before decoding", async () => {
  for (const type of ["image/gif", "image/svg+xml", "", "application/octet-stream"]) {
    await assert.rejects(resizeImage(new File(["input"], "photo.png", { type }), { width: 50, height: 40 }), /Unsupported or unknown/);
  }
});

test("handles encoder failure and closes the bitmap", async (t) => {
  const state = mockCanvas(t, "image/jpeg", true);
  await assert.rejects(resizeImage(new File(["input"], "photo.jpg", { type: "image/jpeg" }), { width: 50, height: 40 }), /encoding failed/);
  assert.equal(state.closed, true);
});
