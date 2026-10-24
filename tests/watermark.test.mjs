import assert from "node:assert/strict";
import test from "node:test";
import { defaultWatermark, decodeWatermarkImage, measureWatermark, positionWatermark, renderWatermark, rotatedMarkSize, validateWatermark, watermarkImage } from "../src/lib/image/watermark.ts";
const source = { width: 1000, height: 800 };
const logo = { width: 200, height: 100 };
function makeCanvas(type = "image/png") {
 const calls = [];
 const context = { globalAlpha: 1, font: "", save() { calls.push(["save"]); }, restore() { calls.push(["restore"]); }, scale(...args) { calls.push(["scale", ...args]); }, translate(...args) { calls.push(["translate", ...args]); }, rotate(...args) { calls.push(["rotate", ...args]); }, measureText(text) { return { width: text.length * 10, actualBoundingBoxLeft: 0, actualBoundingBoxRight: text.length * 10 }; }, drawImage(...args) { calls.push(["drawImage", ...args, this.globalAlpha]); }, fillText(...args) { calls.push(["fillText", ...args, this.globalAlpha]); }, fillRect(...args) { calls.push(["fillRect", ...args]); }, createPattern(tile, repeat) { calls.push(["pattern", tile.width, tile.height, repeat]); return { setTransform() { calls.push(["patternTransform"]); } }; } };
 return { canvas: { width: 0, height: 0, getContext: () => context, toBlob(callback, mime) { calls.push(["encode", mime]); callback(new Blob(["result"], { type })); } }, context, calls };
}
globalThis.document = { createElement() { throw new Error("Unexpected canvas"); } };
globalThis.createImageBitmap = async () => { throw new Error("Unexpected decode"); };
globalThis.DOMMatrix = class { translate() { return this; } scale() { return this; } };

test("text and logo geometry share original-pixel coordinates", () => {
 const { context } = makeCanvas();
 const settings = defaultWatermark(source);
 assert.equal(settings.x, 500); assert.equal(settings.y, 400);
 const text = measureWatermark(context, settings);
 assert.ok(text.width > 0 && text.height > 0);
 assert.deepEqual(measureWatermark(context, { ...settings, kind: "image", logoWidth: 300 }, logo), { width: 300, height: 150 });
 const multiline = measureWatermark(context, { ...settings, text: "one\ntwo" });
 assert.equal(multiline.height, text.height * 2);
});

test("nine presets respect rotated watermark bounds and margins", () => {
 const mark = { width: 100, height: 50 };
 const bounds = rotatedMarkSize(mark, 45);
 for (let row = 0; row < 3; row++) for (let column = 0; column < 3; column++) {
  const position = positionWatermark(source, mark, 45, column, row);
  assert.ok(position.x - bounds.width / 2 >= 0);
  assert.ok(position.y - bounds.height / 2 >= 0);
  assert.ok(position.x + bounds.width / 2 <= source.width);
  assert.ok(position.y + bounds.height / 2 <= source.height);
  if (column === 1) assert.equal(position.x, 500);
  if (row === 1) assert.equal(position.y, 400);
 }
 assert.deepEqual(positionWatermark(source, { width: 2000, height: 2000 }, 0, 0, 0), { x: 500, y: 400 });
});

test("invalid text, missing logos, ranges, and unsupported fonts are rejected", () => {
 const settings = defaultWatermark(source);
 for (const invalid of [{ text: " " }, { kind: "image" }, { opacity: -1 }, { opacity: 2 }, { fontSize: 0 }, { logoWidth: 0 }, { x: NaN }, { angle: 181 }, { color: "red" }, { fontFamily: "unknown" }]) assert.throws(() => validateWatermark({ ...settings, ...invalid }));
 assert.doesNotThrow(() => validateWatermark({ ...settings, text: "", enabled: false }));
});

test("preview and export use the same text transforms, scaled once", () => {
 const options = { ...defaultWatermark(source), angle: 30, x: 120, y: 300, opacity: 0.4 };
 for (const scale of [1, 0.25]) {
  const { canvas, calls } = makeCanvas();
  renderWatermark(canvas, source, options, undefined, scale);
  assert.equal(canvas.width, source.width * scale); assert.equal(canvas.height, source.height * scale);
  assert.deepEqual(calls.find((call) => call[0] === "translate"), ["translate", 120, 300]);
  assert.deepEqual(calls.find((call) => call[0] === "rotate"), ["rotate", Math.PI / 6]);
  assert.equal(calls.find((call) => call[0] === "fillText").at(-1), 0.4);
  assert.equal(calls.some((call) => call[0] === "encode"), false);
 }
});

test("logo rendering preserves logo ratio and opacity", () => {
 const { canvas, calls } = makeCanvas();
 renderWatermark(canvas, source, { ...defaultWatermark(source), kind: "image", logoWidth: 300, opacity: 0.5 }, logo);
 const draws = calls.filter((call) => call[0] === "drawImage");
 assert.deepEqual(draws[1], ["drawImage", logo, -150, -75, 300, 150, 0.5]);
});

test("removed watermarks draw only the original and preserve transparency", () => {
 const { canvas, calls } = makeCanvas();
 renderWatermark(canvas, source, { ...defaultWatermark(source), enabled: false });
 assert.equal(calls.filter((call) => call[0] === "drawImage").length, 1);
 assert.equal(calls.some((call) => call[0] === "fillText" || call[0] === "fillRect"), false);
});

test("tiling uses a repeat pattern instead of an unbounded watermark loop", (t) => {
 const tile = makeCanvas(); t.mock.method(document, "createElement", () => tile.canvas);
 const { canvas, calls } = makeCanvas();
 renderWatermark(canvas, source, { ...defaultWatermark(source), tiled: true });
 assert.equal(calls.filter((call) => call[0] === "pattern").length, 1);
 assert.ok(calls.some((call) => call[0] === "patternTransform"));
 assert.deepEqual(calls.find((call) => call[0] === "fillRect"), ["fillRect", 0, 0, 1000, 800]);
 assert.equal(tile.canvas.width, 0);
});

for (const type of ["image/png", "image/jpeg", "image/webp"]) test(`full-size export retains ${type}`, async (t) => {
 const { canvas, calls } = makeCanvas(type); t.mock.method(document, "createElement", () => canvas);
 const blob = await watermarkImage(source, defaultWatermark(source), type);
 assert.equal(blob.type, type); assert.deepEqual(calls.at(-1), ["encode", type]);
 assert.equal(canvas.width, 0); assert.equal(canvas.height, 0);
 assert.deepEqual(source, { width: 1000, height: 800 });
});

test("MIME fallback is rejected and source is decoded with EXIF applied", async (t) => {
 const { canvas } = makeCanvas("image/png"); t.mock.method(document, "createElement", () => canvas);
 await assert.rejects(watermarkImage(source, defaultWatermark(source), "image/webp"), /requested format/);
 await assert.rejects(watermarkImage(source, defaultWatermark(source), "image/gif"), /Unsupported/);
 let opts; t.mock.method(globalThis, "createImageBitmap", async (_, options) => { opts = options; return source; });
 await decodeWatermarkImage(new File(["image"], "photo.jpg", { type: "image/jpeg" }));
 assert.deepEqual(opts, { imageOrientation: "from-image" });
});
