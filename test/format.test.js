import { test } from "node:test";
import assert from "node:assert/strict";
import { formatBytes } from "../src/format.js";

test("formatBytes handles zero and small values", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(512), "512 B");
});

test("formatBytes scales to KB/MB/GB", () => {
  assert.equal(formatBytes(1024), "1.0 KB");
  assert.equal(formatBytes(1024 * 1024), "1.0 MB");
  assert.equal(formatBytes(1024 * 1024 * 1024), "1.0 GB");
});

test("formatBytes handles invalid input gracefully", () => {
  assert.equal(formatBytes(-5), "0 B");
  assert.equal(formatBytes(NaN), "0 B");
});
