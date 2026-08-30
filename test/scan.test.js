import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadDefaultRules, buildLookup } from "../src/rules.js";
import { scanForMatches } from "../src/scan.js";

async function makeFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "buildsweep-test-"));

  // JS project with node_modules + .next
  await mkdir(path.join(root, "proj-a/node_modules/pkg"), { recursive: true });
  await mkdir(path.join(root, "proj-a/.next"), { recursive: true });
  await writeFile(
    path.join(root, "proj-a/node_modules/pkg/index.js"),
    "x".repeat(1000),
  );
  await writeFile(path.join(root, "proj-a/keep.txt"), "keep me");

  // Rust project
  await mkdir(path.join(root, "proj-b/target/debug"), { recursive: true });
  await mkdir(path.join(root, "proj-b/src"), { recursive: true });
  await writeFile(path.join(root, "proj-b/target/debug/bin"), "x".repeat(500));

  // Python project
  await mkdir(path.join(root, "proj-c/__pycache__"), { recursive: true });
  await mkdir(path.join(root, "proj-c/.venv/lib"), { recursive: true });

  // Ambiguous bin/, no sibling -> should NOT match anything
  await mkdir(path.join(root, "proj-d/bin"), { recursive: true });

  // Go project: bin/ + go.mod sibling -> should match as go
  await mkdir(path.join(root, "proj-e/bin"), { recursive: true });
  await mkdir(path.join(root, "proj-e/obj"), { recursive: true }); // not a go dir name, ignored
  await writeFile(path.join(root, "proj-e/go.mod"), "module example.com/e\n");

  // .NET project: bin/ + obj/ + csproj sibling -> should match as dotnet
  await mkdir(path.join(root, "proj-f/bin"), { recursive: true });
  await mkdir(path.join(root, "proj-f/obj"), { recursive: true });
  await writeFile(path.join(root, "proj-f/app.csproj"), "<Project />");

  // .git must never be descended into
  await mkdir(path.join(root, ".git/objects"), { recursive: true });
  await mkdir(path.join(root, ".git/node_modules_decoy"), { recursive: true });

  return root;
}

async function scanFixture(root, options = {}) {
  const rules = await loadDefaultRules();
  const lookup = buildLookup(rules, {
    includeRisky: true,
    only: null,
    exclude: null,
    ...options,
  });
  return scanForMatches(root, lookup, { computeSizes: true });
}

// Match paths built with path.join(), so use platform-native separators
// when comparing rather than hardcoding "/" (which breaks on Windows).
function relPosix(root, fullPath) {
  return path.relative(root, fullPath).split(path.sep).join("/");
}

test("finds node_modules and .next for a JS project", async () => {
  const root = await makeFixture();
  try {
    const { matches } = await scanFixture(root);
    const names = matches.map((m) => relPosix(root, m.path)).sort();
    assert.ok(names.includes("proj-a/node_modules"));
    assert.ok(names.includes("proj-a/.next"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("computes correct size for node_modules", async () => {
  const root = await makeFixture();
  try {
    const { matches } = await scanFixture(root);
    const nm = matches.find(
      (m) => relPosix(root, m.path) === "proj-a/node_modules",
    );
    assert.ok(nm, "expected proj-a/node_modules to be found");
    assert.equal(nm.sizeBytes, 1000);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("finds Rust target and Python caches", async () => {
  const root = await makeFixture();
  try {
    const { matches } = await scanFixture(root);
    const names = matches.map((m) => relPosix(root, m.path));
    assert.ok(names.includes("proj-b/target"));
    assert.ok(names.includes("proj-c/__pycache__"));
    assert.ok(names.includes("proj-c/.venv"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not match ambiguous bin/ without a sibling project file", async () => {
  const root = await makeFixture();
  try {
    const { matches } = await scanFixture(root);
    const names = matches.map((m) => relPosix(root, m.path));
    assert.ok(!names.includes("proj-d/bin"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("matches bin/ as Go when go.mod is a sibling", async () => {
  const root = await makeFixture();
  try {
    const { matches } = await scanFixture(root);
    const match = matches.find((m) => relPosix(root, m.path) === "proj-e/bin");
    assert.ok(match, "expected proj-e/bin to match");
    assert.equal(match.ecosystem, "go");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("matches bin/ and obj/ as .NET when a csproj is a sibling", async () => {
  const root = await makeFixture();
  try {
    const { matches } = await scanFixture(root);
    const bin = matches.find((m) => relPosix(root, m.path) === "proj-f/bin");
    const obj = matches.find((m) => relPosix(root, m.path) === "proj-f/obj");
    assert.equal(bin?.ecosystem, "dotnet");
    assert.equal(obj?.ecosystem, "dotnet");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("never descends into .git", async () => {
  const root = await makeFixture();
  try {
    const { matches } = await scanFixture(root);
    const insideGit = matches.filter((m) =>
      m.path.includes(`${path.sep}.git${path.sep}`),
    );
    assert.equal(insideGit.length, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("respects --only to scan a single ecosystem", async () => {
  const root = await makeFixture();
  try {
    const { matches } = await scanFixture(root, { only: ["rust"] });
    const ecosystems = new Set(matches.map((m) => m.ecosystem));
    assert.deepEqual(ecosystems, new Set(["rust"]));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("respects --exclude to skip an ecosystem", async () => {
  const root = await makeFixture();
  try {
    const { matches } = await scanFixture(root, { exclude: ["javascript"] });
    const ecosystems = new Set(matches.map((m) => m.ecosystem));
    assert.ok(!ecosystems.has("javascript"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not descend into a matched directory (pruning)", async () => {
  const root = await makeFixture();
  try {
    // Add a nested target/ inside node_modules that should never be visited
    // because node_modules itself is matched and pruned.
    await mkdir(path.join(root, "proj-a/node_modules/pkg/target"), {
      recursive: true,
    });
    const { matches } = await scanFixture(root);
    const nested = matches.filter((m) =>
      relPosix(root, m.path).includes("node_modules/pkg/target"),
    );
    assert.equal(nested.length, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
