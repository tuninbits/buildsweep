# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0]

First stable release. The CLI flags, JSON output shape, and rules file format are now covered by semantic versioning.

### Added

- Bundled TypeScript declarations (`src/index.d.ts`), so the package is typed out of the box with no `@types/buildsweep` needed.
- A documented programmatic API exported from the package root, covering the scanner, rule loading/merging, glob matching, and byte formatting.
- A `typecheck` script and CI job that compile the declarations against a usage sample, so the published types cannot drift from the implementation.

### Changed

- The package now declares an `exports` map. Only the package root is importable; deep imports such as `buildsweep/src/scan.js` are no longer resolvable. Import from `"buildsweep"` instead.
- Documented the `xattr -d com.apple.quarantine` workaround for the macOS Gatekeeper "cannot verify" prompt on standalone binaries.

## [0.1.1]

### Fixed

- Windows release builds no longer fail with `spawnSync npx ENOENT`; `npx` is now invoked through a shell on Windows.
- The release build matrix no longer cancels other platforms when one fails (`fail-fast: false`).
- Linux and macOS standalone binaries are now packaged as `.tar.gz` archives so extracting them preserves the executable permission bit, removing the need for a manual `chmod +x` after download.

### Changed

- Reworked project documentation and community contribution guidance.

## [0.1.0]

### Added

- Cross-platform recursive discovery of build artifacts, dependency directories, and caches.
- Built-in rules for JavaScript/TypeScript, Rust, Python, Java/Kotlin, .NET, Go, and Ruby.
- Dry-run, confirmation, ecosystem filters, risky-rule opt-in, JSON reporting, custom rules, and no-size scanning.
- Standalone executable build and tagged release workflows.
- Cross-platform CI on supported Node.js lines.
