import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesPattern, matchesAny } from "../src/glob.js";

test("exact match with no wildcard", () => {
  assert.equal(matchesPattern("node_modules", "node_modules"), true);
  assert.equal(matchesPattern("node_modules2", "node_modules"), false);
});

test("leading wildcard suffix match", () => {
  assert.equal(matchesPattern("foo.egg-info", "*.egg-info"), true);
  assert.equal(matchesPattern("foo.egg-infoo", "*.egg-info"), false);
});

test("trailing wildcard prefix match", () => {
  assert.equal(matchesPattern("cache-123", "cache-*"), true);
  assert.equal(matchesPattern("nocache-123", "cache-*"), false);
});

test("rejects patterns with more than one wildcard", () => {
  assert.throws(() => matchesPattern("a.b.c", "*.b.*"));
});

test("matchesAny checks all candidate patterns", () => {
  assert.equal(matchesAny("app.csproj", ["*.sln", "*.csproj"]), true);
  assert.equal(matchesAny("app.txt", ["*.sln", "*.csproj"]), false);
});
