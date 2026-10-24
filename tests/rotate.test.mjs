import assert from "node:assert/strict";
import test from "node:test";
import { decodeRotationImage, defaultRotation, drawRotatedImage, normalizeAngle, rotateImage, rotationDimensions } from "../src/lib/image/rotate.ts";

const size = { width: 1200, height: 800 };

test("quarter turns have exact dimensions with no extra blank row or column", () => {
  assert.deepEqual(rotationDimensions(size, 0), size);
  for (const angle of [-90, 90]) assert.deepEqual(rotationDimensions(size, angle), { width: 800, height: 1200 });
  for (const angle of [-180, 180]) assert.deepEqual(rotationDimensions(size, angle), size);
  assert.equal(normalizeAngle(270), -90);
  assert.equal(normalizeAngle(-270), 90);
  assert.equal(normalizeAngle(360), 0);
});

test("arbitrary-angle output encloses all transformed original corners", () => {
  for (const angle of [-179.9, -130, -45, -0.1, 0.1, 37.5, 45, 179.9]) {
    const result = rotationDimensions(size, angle);
    const radians = angle * Math.PI / 180;
    for (const x of [-size.width / 2, size.width / 2]) {
      for (const y of [-size.height / 2, size.height / 2]) {
        assert.ok(Math.abs(x * Math.cos(radians) - y * Math.sin(radians)) <= result.width / 2);
        assert.ok(Math.abs(x * Math.sin(radians) + y * Math.cos(radians)) <= result.height / 2);
      }
    }
  }
});

test("invalid angles and dimensions fail gracefully", () => {
  for (const angle of [NaN, Infinity, -181, 181]) assert.throws(() => rotationDimensions(size, angle), /angle/);
  assert.throws(() => rotationDimensions({ width: 0, height: 20 }, 0), /dimensions/);
});

globalThis.createImageBitmap = async () => { throw new Error("Unexpected decode"); };
globalThis.document = { createElement() { throw new Error("Unexpected canvas"); } };

test("EXIF orientation is explicitly applied once when decoding", async (t) => {
  let decodeOptions;
  t.mock.method(globalThis, "createImageBitmap", async (_, options) => { decodeOptions = options; return size; });
  const result = await decodeRotationImage(new File(["input"], "camera.jpg", { type: "image/jpeg" }));
  assert.equal(result, size);
  assert.deepEqual(decodeOptions, { imageOrientation: "from-image" });
  await assert.rejects(decodeRotationImage(new File(["input"], "image.gif", { type: "image/gif" })), /Unsupported/);
});

function mockCanvas(type = "image/png") {
  const calls = [];
  const context = { fillStyle: "", save() { calls.push(["save"]); }, restore() { calls.push(["restore"]); }, translate(...args) { calls.push(["translate", ...args]); }, rotate(...args) { calls.push(["rotate", ...args]); }, scale(...args) { calls.push(["scale", ...args]); }, drawImage(...args) { calls.push(["drawImage", ...args]); }, fillRect(...args) { calls.push(["fillRect", this.fillStyle, ...args]); } };
  const canvas = { width: 0, height: 0, getContext: () => context, toBlob(callback, mime) { calls.push(["encode", mime]); callback(new Blob(["encoded"], { type })); } };
  return { canvas, calls };
}

test("drawing applies flips in source axes before rotation and centers the expanded result", () => {
  const { canvas, calls } = mockCanvas();
  drawRotatedImage(canvas, size, { ...defaultRotation, angle: 90, flipHorizontal: true, flipVertical: true }, "image/png");
  assert.equal(canvas.width, 800);
  assert.equal(canvas.height, 1200);
  assert.deepEqual(calls, [["save"], ["translate", 400, 600], ["scale", 1, 1], ["rotate", Math.PI / 2], ["scale", -1, -1], ["drawImage", size, -600, -400], ["restore"]]);
});

test("JPEG fills uncovered background; PNG and WebP remain transparent", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"]) {
    const { canvas, calls } = mockCanvas(type);
    drawRotatedImage(canvas, size, { ...defaultRotation, angle: 45, background: "#164d3b" }, type);
    const fills = calls.filter((call) => call[0] === "fillRect");
    assert.equal(fills.length, type === "image/jpeg" ? 1 : 0);
    if (fills.length) assert.deepEqual(fills[0], ["fillRect", "#164d3b", 0, 0, canvas.width, canvas.height]);
  }
});

test("display-scale preview does not encode or modify the source", () => {
  const { canvas, calls } = mockCanvas();
  const result = drawRotatedImage(canvas, size, defaultRotation, "image/png", 0.25);
  assert.deepEqual(result, size);
  assert.equal(canvas.width, 300);
  assert.equal(canvas.height, 200);
  assert.equal(calls.some((call) => call[0] === "encode"), false);
  assert.deepEqual(size, { width: 1200, height: 800 });
});

for (const type of ["image/png", "image/jpeg", "image/webp"]) {
  test(`export preserves ${type} and releases only the temporary buffer`, async (t) => {
    const { canvas, calls } = mockCanvas(type);
    t.mock.method(globalThis.document, "createElement", () => canvas);
    const blob = await rotateImage(size, { ...defaultRotation, angle: 45 }, type);
    assert.equal(blob.type, type);
    assert.deepEqual(calls.at(-1), ["encode", type]);
    assert.equal(canvas.width, 0);
    assert.equal(canvas.height, 0);
    assert.deepEqual(size, { width: 1200, height: 800 });
  });
}

test("encoder fallback is rejected and temporary canvas released", async (t) => {
  const { canvas } = mockCanvas("image/png");
  t.mock.method(globalThis.document, "createElement", () => canvas);
  await assert.rejects(rotateImage(size, defaultRotation, "image/webp"), /requested format/);
  assert.equal(canvas.width, 0);
  assert.throws(() => drawRotatedImage(canvas, size, { ...defaultRotation, background: "invalid" }, "image/jpeg"), /color/);
});
