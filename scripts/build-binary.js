#!/usr/bin/env node
// Builds a standalone single-executable binary for the current OS using
// Node's built-in Single Executable Applications (SEA) support.
//
// This does NOT need Node installed on the *end user's* machine — only on
// the machine doing the build (this script, or CI). The resulting binary
// embeds the whole Node runtime, so it's large (~90-120MB) but fully
// self-contained.
//
// Usage: node scripts/build-binary.js [outputName]
//
// Cross-compiling is not supported: run this on macOS to build the macOS
// binary, on Linux for Linux, on Windows for Windows. CI runs this on a
// matrix of OSes to produce all three per release.

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, existsSync, chmodSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const distDir = path.join(root, "dist");

const platformNames = { darwin: "macos", linux: "linux", win32: "windows" };
const platformName = platformNames[process.platform] ?? process.platform;
const ext = process.platform === "win32" ? ".exe" : "";
const outputName = process.argv[2] ?? `buildsweep-${platformName}${ext}`;
const outputPath = path.join(distDir, outputName);

function run(cmd, args) {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { cwd: root, stdio: "inherit" });
}

mkdirSync(distDir, { recursive: true });

// 1. Bundle everything (source + JSON rules) into a single CJS file.
//    SEA requires a single entry file with no runtime `import`/`require`
//    of files that won't exist once embedded in the binary.
run("npx", [
  "esbuild",
  "bin/buildsweep.js",
  "--bundle",
  "--platform=node",
  "--format=cjs",
  "--outfile=dist/buildsweep-bundle.cjs",
]);

// 2. Generate the SEA preparation blob from that bundle.
run("node", ["--experimental-sea-config", "sea-config.json"]);

// 3. Copy the current node binary as the base for injection.
copyFileSync(process.execPath, outputPath);

// 4. macOS requires removing the existing code signature before injection.
if (process.platform === "darwin") {
  try {
    run("codesign", ["--remove-signature", outputPath]);
  } catch {
    // no signature present, fine
  }
}

// 5. Inject the blob into the binary copy.
run("npx", [
  "postject",
  outputPath,
  "NODE_SEA_BLOB",
  "dist/sea-prep.blob",
  "--sentinel-fuse",
  "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
  ...(process.platform === "darwin" ? ["--macho-segment-name", "NODE_SEA"] : []),
]);

// 6. Re-sign on macOS (ad-hoc signature, sufficient for local execution;
//    distributing outside your own machine may still trigger Gatekeeper
//    warnings unless properly notarized).
if (process.platform === "darwin") {
  run("codesign", ["--sign", "-", outputPath]);
}

if (process.platform !== "win32") {
  chmodSync(outputPath, 0o755);
}

console.log(`\nBuilt: ${outputPath}`);
if (!existsSync(outputPath)) {
  throw new Error("Build reported success but output file is missing.");
}
