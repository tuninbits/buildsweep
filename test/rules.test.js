import { test } from "node:test";
import assert from "node:assert/strict";
import { loadDefaultRules, mergeRules, buildLookup } from "../src/rules.js";

test("default rules load and parse", async () => {
  const rules = await loadDefaultRules();
  assert.ok(rules.ecosystems.javascript);
  assert.ok(rules.ecosystems.rust);
  assert.ok(rules.ecosystems.python);
  assert.ok(rules.alwaysSkip.includes(".git"));
});

test("mergeRules adds a brand new ecosystem", async () => {
  const defaults = await loadDefaultRules();
  const merged = mergeRules(defaults, {
    ecosystems: { elixir: { label: "Elixir", risk: "safe", dirs: ["_build", "deps"] } },
  });
  assert.ok(merged.ecosystems.elixir);
  assert.deepEqual(merged.ecosystems.elixir.dirs, ["_build", "deps"]);
  // defaults are preserved
  assert.ok(merged.ecosystems.rust);
});

test("mergeRules extends an existing ecosystem's dirs without dropping defaults", async () => {
  const defaults = await loadDefaultRules();
  const merged = mergeRules(defaults, {
    ecosystems: { rust: { dirs: ["custom-target"] } },
  });
  assert.ok(merged.ecosystems.rust.dirs.includes("target"));
  assert.ok(merged.ecosystems.rust.dirs.includes("custom-target"));
});

test("buildLookup honors risky opt-in", async () => {
  const rules = await loadDefaultRules();
  const withoutRisky = buildLookup(rules, { includeRisky: false, only: null, exclude: null });
  const withRisky = buildLookup(rules, { includeRisky: true, only: null, exclude: null });
  assert.equal(withoutRisky.exactNames.has("vendor"), false);
  assert.equal(withRisky.exactNames.has("vendor"), true);
});

test("buildLookup honors only/exclude filters", async () => {
  const rules = await loadDefaultRules();
  const onlyRust = buildLookup(rules, { includeRisky: false, only: ["rust"], exclude: null });
  assert.equal(onlyRust.exactNames.has("node_modules"), false);
  assert.equal(onlyRust.exactNames.has("target"), true);

  const excludeJs = buildLookup(rules, { includeRisky: false, only: null, exclude: ["javascript"] });
  assert.equal(excludeJs.exactNames.has("node_modules"), false);
  assert.equal(excludeJs.exactNames.has("target"), true);
});
