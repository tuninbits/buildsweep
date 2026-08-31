# Contributing to BuildSweep

Thank you for helping improve BuildSweep. This project is an early-stage, cross-platform CLI that finds and removes dependency directories, build outputs, and caches. Because deletion is recursive and is not recoverable through BuildSweep, contributions must preserve its safety-first behavior and avoid presenting directory-name matches as a guarantee that content is disposable.

## Ways to contribute

Useful contributions include:

- reporting reproducible bugs and false-positive cleanup-rule matches;
- adding tests for supported platforms, filesystems, and cleanup rules;
- improving scanner reliability, CLI clarity, and safety messaging;
- correcting documentation and examples; and
- proposing narrowly scoped features before investing in a large implementation.

For vulnerabilities or paths that could cause unintended data loss, follow [SECURITY.md](SECURITY.md) instead of opening a public issue with destructive details. Community participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Development setup

BuildSweep requires Node.js 18.20.0 or newer. Clone the repository, enter its root, and install the pinned project dependencies:

```bash
npm install
```

No global BuildSweep installation is required for development.

## Repository structure

- `bin/buildsweep.js` is the CLI entry point.
- `src/` contains argument handling, scanning, cleanup-rule loading, formatting, prompting, and deletion behavior.
- `rules/default-rules.json` defines built-in ecosystem groups, directory patterns, risk metadata, sibling guards, and always-skipped names.
- `test/` contains the Node.js test suites.
- `scripts/build-binary.js` builds a standalone executable for the current operating system.
- `.github/workflows/` contains cross-platform CI and tagged-release automation.

## Running tests

Run the complete test suite before submitting a pull request:

```bash
npm test
```

CI runs the suite on Ubuntu, macOS, and Windows with Node.js 18.20.0, 20.x, and 22.x. This matrix is automated coverage, not a guarantee for every architecture or filesystem.

## Testing the CLI

Check that the help output renders and that a report-only scan completes:

```bash
node bin/buildsweep.js --help
node bin/buildsweep.js . --dry-run --no-size
```

Use a narrow, controlled selected root for additional manual tests. Start with `--dry-run`, review every match, and keep source control or backups for anything that cannot be regenerated. Do not use `--yes` against valuable test data. Remember that scanning is best-effort and directory-name based; a reported match is not proof that deletion is safe.

## Building a standalone executable

Build the executable for the current operating system:

```bash
npm run build:binary
```

The build does not cross-compile. It produces `dist/buildsweep-linux`, `dist/buildsweep-macos`, or `dist/buildsweep-windows.exe`, depending on the current platform. The executable embeds Node.js and is therefore larger than the npm package. macOS output is ad-hoc signed and may still trigger Gatekeeper.

## Adding or changing cleanup rules

Treat every cleanup-rule change as safety-sensitive. Rules primarily match case-sensitive directory basenames, and conventional artifact names can contain intentional content. The `safe` classification is metadata, not a deletion guarantee.

A rule change must include:

- positive-match tests for each new or changed pattern;
- false-positive cases proving unrelated paths are not selected;
- sibling-guard coverage where directory names are ambiguous, including both matching and non-matching sibling layouts;
- platform-safe `path` handling rather than hard-coded path separators; and
- corresponding README and changelog updates.

Preserve risky-rule opt-in behavior and conservative classifications. Test custom and built-in rule behavior with `--dry-run`, including relevant `--only`, `--exclude`, and `--risky` combinations. If a change can alter which paths are recursively deleted, explain the safety impact in the pull request.

## Documentation changes

Keep product claims aligned with implemented behavior. In particular, describe scans as best-effort within the selected root, sizes as estimates, `--json` as report-only, and standalone assets as available only from successful tagged releases. Use **BuildSweep** for the product and `buildsweep` for the package, executable, and command.

Update [CHANGELOG.md](CHANGELOG.md) under `[Unreleased]` for user-visible changes. Check local links, commands, option names, filenames, version requirements, and platform claims against the repository rather than assumptions.

## Pull request expectations

Before requesting review:

- keep the change focused and explain its user-visible and safety impact;
- add or update tests for changed behavior;
- run `npm test` and the relevant CLI smoke checks;
- update the README and changelog when behavior or guidance changes;
- avoid unrelated formatting, generated artifacts, or dependency changes; and
- confirm that no secrets, private reports, or personal data are included.

Pull requests should be reviewable in small, coherent commits. Maintainers may ask for additional cross-platform or false-positive coverage when scanner, path, rule, or deletion behavior changes.

## Maintainer release checklist

Before publishing a version:

- confirm the version and changelog entries are accurate and do not claim unverified distribution availability;
- verify `npm install`, `npm test`, the CLI help output, and a dry-run smoke test on a clean checkout;
- confirm documentation, package metadata, and expected standalone filenames agree;
- review cleanup-rule changes for positive matches, false positives, sibling guards, platform-safe paths, and risky-rule opt-in behavior;
- verify the configured CI matrix passes;
- push a `v*` release tag only for the intended commit; and
- confirm every operating-system build succeeds before treating the attached standalone assets as available.
