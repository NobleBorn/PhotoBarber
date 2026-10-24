import assert from "node:assert/strict";
import test from "node:test";
import { matchingReduction, parseDimension, proportionalInputs, readDimensions, reducedDimensions, toPixelInputs } from "../src/lib/image/resize-dimensions.ts";

const original = { width: 1200, height: 800 };

test("percentage presets reduce original dimensions, without compounding", () => {
  assert.deepEqual(reducedDimensions(original, 25), { width: 900, height: 600 });
  assert.deepEqual(reducedDimensions(original, 50), { width: 600, height: 400 });
  assert.deepEqual(reducedDimensions(original, 75), { width: 300, height: 200 });
});

test("aspect ratio can follow either width or height", () => {
  assert.deepEqual(proportionalInputs({ width: "600", height: "800" }, "width", original), { width: "600", height: "400" });
  assert.deepEqual(proportionalInputs({ width: "1200", height: "200" }, "height", original), { width: "300", height: "200" });
});

test("restoring ratio keeps the last-edited dimension", () => {
  const unlocked = { width: "480", height: "640" };
  assert.deepEqual(proportionalInputs(unlocked, "height", original), { width: "960", height: "640" });
  assert.deepEqual(proportionalInputs(unlocked, "width", original), { width: "480", height: "320" });
});

test("switching modes recognizes presets without mutating custom pixel sizes", () => {
  const custom = { width: "1000", height: "300" };
  assert.equal(matchingReduction(custom, original), null);
  assert.deepEqual(custom, { width: "1000", height: "300" });
  for (const reduction of [25, 50, 75]) {
    const pixels = toPixelInputs(reducedDimensions(original, reduction));
    assert.equal(matchingReduction(pixels, original), reduction);
    assert.deepEqual(readDimensions(pixels), reducedDimensions(original, reduction));
  }
});

test("invalid or unsafe inputs cannot become output dimensions", () => {
  for (const value of ["", " ", "0", "-1", "1.5", "Infinity", "NaN", "9007199254740992"]) {
    assert.equal(parseDimension(value), null);
    assert.equal(readDimensions({ width: value, height: "20" }), null);
    assert.equal(readDimensions({ width: "20", height: value }), null);
  }
  const invalid = { width: "", height: "640" };
  assert.deepEqual(proportionalInputs(invalid, "width", original), invalid);
});

test("odd and tiny images round to supported positive integer pixels", () => {
  assert.deepEqual(reducedDimensions({ width: 101, height: 51 }, 50), { width: 51, height: 26 });
  assert.deepEqual(reducedDimensions({ width: 1, height: 2 }, 75), { width: 1, height: 1 });
});
