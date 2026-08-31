# BuildSweep

[![CI](https://github.com/tuninbits/buildsweep/actions/workflows/ci.yml/badge.svg)](https://github.com/tuninbits/buildsweep/actions/workflows/ci.yml)
[![Node.js 18.20+](https://img.shields.io/badge/Node.js-18.20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A cross-platform CLI for finding and removing dependency directories, build outputs, and caches across multiple development ecosystems.

> [!IMPORTANT]
> BuildSweep is early-stage software. Start with `--dry-run`, review every match, and keep source control or backups for anything you cannot regenerate.

## Quick start

Preview matches under the current directory without deleting anything:

```bash
npx buildsweep . --dry-run
```

After a global installation, the equivalent command is:

```bash
buildsweep . --dry-run
```

When you are satisfied with the report, omit `--dry-run`. BuildSweep then asks once before recursively deleting all listed directories. Pass `--yes` only when you intend to skip that confirmation.

## Installation

### Node.js

Node users need Node.js 18.20.0 or newer. Once the package is published, either install it globally or let `npx` download and run it:

```bash
npm install -g buildsweep
buildsweep . --dry-run
```

```bash
npx buildsweep . --dry-run
```

### Standalone binaries

Standalone binaries embed Node.js, so they require no separate Node installation. They are available only as assets from successful tagged [GitHub releases](https://github.com/tuninbits/buildsweep/releases):

| Platform | Expected filename         | Extract with                        |
| -------- | ------------------------- | ----------------------------------- |
| Linux    | `buildsweep-linux.tar.gz` | `tar -xzf buildsweep-linux.tar.gz`  |
| macOS    | `buildsweep-macos.tar.gz` | `tar -xzf buildsweep-macos.tar.gz`  |
| Windows  | `buildsweep-windows.exe`  | Run directly, no extraction needed. |

The Linux and macOS binaries are distributed inside a `.tar.gz` archive because a bare downloaded file loses its executable permission bit. Extracting with `tar` (via Archive Utility, Finder, or the `tar` command) restores that permission automatically, so no `chmod +x` step is needed. The extracted binary can then be run directly, for example by double-clicking it in a file manager that allows executing downloaded files, or from a terminal with `./buildsweep-macos`.

These binaries are larger than the npm package because they include the runtime, and they do not auto-update. Their filenames identify the operating system but not the CPU architecture. macOS binaries are only ad-hoc signed and may still trigger a Gatekeeper prompt on first run; Linux desktop environments may still require enabling "allow executing file as program" in the file's properties before double-click works.

Project CI tests Node.js 18.20.0, 20.x, and 22.x on Ubuntu, macOS, and Windows. This matrix describes automated test coverage, not a guarantee for every architecture or filesystem.

## What a scan looks like

A dry run labels each match by ecosystem and, unless `--no-size` is used, shows an estimated logical size:

```text
$ buildsweep ~/projects --dry-run
buildsweep — scanning /home/user/projects

Found 2 match(es) across 42 directories scanned:

  - web/node_modules (768 MB) [JavaScript / TypeScript]
  - api/target (256 MB) [Rust]

Total reclaimable: 1.0 GB

Dry run — nothing was deleted.
```

Sizes are estimates based on readable regular files; they are not exact filesystem-allocation or guaranteed reclaimed-space measurements.

## How scanning works

1. Discovery walks the selected root once.
2. Matching directories are recorded and pruned from discovery, so their contents are not searched for nested matches.
3. By default, sizing separately walks each matched directory to estimate its contents.
4. `--no-size` skips that sizing phase and is faster on large trees.

Symlinked directories are not traversed. BuildSweep also never traverses directories named `.git`, `.hg`, or `.svn`. Scanning is best-effort: unreadable or vanished paths, and paths that remain locked after retries, may be skipped.

## Built-in ecosystems

Rules match directory basenames. BuildSweep ships with these groups:

| Group        | Label                          | Directory names                                                                                                                                                        |
| ------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `javascript` | JavaScript / TypeScript        | `node_modules`, `.next`, `.nuxt`, `.turbo`, `.cache`, `dist`, `build`, `out`, `.output`, `.parcel-cache`, `.svelte-kit`, `coverage`, `.nyc_output`, `storybook-static` |
| `rust`       | Rust                           | `target`                                                                                                                                                               |
| `python`     | Python                         | `__pycache__`, `.venv`, `venv`, `.pytest_cache`, `.mypy_cache`, `.ruff_cache`, `.tox`, `.eggs`, `*.egg-info`                                                           |
| `java`       | Java / Kotlin                  | `target`, `build`, `.gradle`                                                                                                                                           |
| `dotnet`     | .NET                           | `bin`, `obj`, only when an immediate sibling is a `*.csproj`, `*.sln`, `*.fsproj`, or `*.vbproj` file                                                                  |
| `go`         | Go                             | `bin`, only when `go.mod` is an immediate sibling                                                                                                                      |
| `ruby`       | Ruby                           | `.bundle`                                                                                                                                                              |
| `misc`       | Misc (ambiguous names, opt-in) | `tmp`, `vendor`, `.vercel`; requires `--risky`                                                                                                                         |

The `--only` and `--exclude` options select rule groups; they do not detect project languages. Some names belong to multiple groups, such as `target`, `build`, and `bin`. A match is attributed to the first eligible group in rule order, after filters and sibling requirements are applied.

The miscellaneous group remains disabled unless `--risky` is present. To scan only that group, use `--only misc --risky`.

## CLI reference

```text
buildsweep [directory] [options]
```

The directory defaults to `.` and is resolved to an absolute path.

| Flag                  | Behavior                                                                     |
| --------------------- | ---------------------------------------------------------------------------- |
| `--dry-run`           | Scan and report without prompting or deleting.                               |
| `--yes`, `-y`         | Skip the all-or-nothing confirmation prompt and delete all reported matches. |
| `--only <ecosystems>` | Use only the comma-separated rule-group keys.                                |
| `--exclude <list>`    | Exclude the comma-separated rule-group keys; exclusion wins over inclusion.  |
| `--risky`             | Include groups classified as risky.                                          |
| `--rules <path>`      | Load a JSON rules file from the given path and merge it over the defaults.   |
| `--no-size`           | Skip size calculation for a faster report on large trees.                    |
| `--json`              | Print a machine-readable report and never delete.                            |
| `-h`, `--help`        | Show CLI help.                                                               |

Examples:

```bash
buildsweep ~/code --dry-run
buildsweep . --only rust,python --dry-run
buildsweep . --exclude javascript --no-size --dry-run
buildsweep . --only misc --risky --dry-run
buildsweep . --json
```

## Safety model

BuildSweep is designed to make destructive work visible, not to decide whether your data is disposable:

- Rules are primarily directory-name based.
- BuildSweep does not inspect `.gitignore` or Git tracking.
- Conventional artifact names can still contain intentional content.
- The `safe` rule classification is metadata, not a guarantee that deletion is safe for a particular directory.
- `--dry-run` reports without deleting, while normal mode uses one confirmation for all matches unless `--yes` is supplied.
- Deletion is recursive and is not recoverable through BuildSweep.
- `--json` is always report-only, even when combined with `--yes`.

Keep source control or backups for content you cannot regenerate, and review every path before approving deletion.

## JSON output

Use `--json` for a report that can be consumed by other tools:

```json
{
  "root": "/path/to/projects",
  "dirsVisited": 42,
  "totalBytes": 1048576,
  "matches": [
    {
      "path": "/path/to/projects/app/node_modules",
      "name": "node_modules",
      "ecosystem": "javascript",
      "label": "JavaScript / TypeScript",
      "risk": "safe",
      "sizeBytes": 1048576
    }
  ]
}
```

`--json` performs no deletion or confirmation. With `--no-size`, `sizeBytes` is absent from each match and `totalBytes` is zero.

## Custom rules

Place `.buildsweeprc.json` in the selected scan root, or pass `--rules <path>` to select a rules file explicitly. A relative `--rules` path is resolved from the current working directory. An explicit path is used instead of the root-local file, but its contents are still merged over the built-in defaults.

```json
{
  "alwaysSkip": ["third_party"],
  "ecosystems": {
    "elixir": {
      "label": "Elixir",
      "risk": "safe",
      "dirs": ["_build", "deps"]
    },
    "rust": {
      "dirs": ["target-wasm"]
    }
  }
}
```

Merging follows these rules:

- Directory patterns are additive and exact duplicates are removed. `alwaysSkip` names are additive too.
- Built-in directories and always-skip names cannot be removed by custom configuration.
- For an existing group, supplied `label`, `risk`, `requireSibling`, and `note` metadata replaces the built-in value for that field.
- New groups default to the label `Custom` and risk `safe` when those fields are omitted.
- Directory names, group keys, selectors, skip names, and sibling patterns are case-sensitive.
- Patterns match a directory basename and may contain at most one `*`, which acts as a case-sensitive prefix-and-suffix wildcard. Other glob syntax and path matching are not supported.

Because custom `safe` rules participate in unattended deletion with `--yes`, classify and test them conservatively with `--dry-run` first.

## Troubleshooting

### Permissions or skipped paths

BuildSweep skips paths it cannot read rather than treating the scan as a complete inventory. Check permissions and rerun from the narrowest useful root. A vanished path can also be skipped if another process changes the tree during scanning.

### Large scans

Size estimation is a separate recursive walk of every match. Use `--no-size` when you need faster discovery and do not need per-match estimates.

### macOS Gatekeeper

Release binaries are ad-hoc signed rather than Developer ID signed and notarized, so Gatekeeper may warn. Confirm the download source before following any local security prompt; use the Node.js installation path if you prefer not to run an ad-hoc-signed binary.

### Windows locks

BuildSweep briefly retries common transient directory-lock failures. Close programs, terminals, antivirus scans, or indexers holding a path and rerun if a directory remains locked or deletion fails.

### Missing release assets

Standalone assets are attached only after every operating-system build succeeds for a pushed version tag. A tag or filename mention does not guarantee that an asset exists. Check the release's assets and workflow status; the expected names do not identify CPU architecture.

## Project

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md) · [Code of Conduct](CODE_OF_CONDUCT.md) · [MIT License](LICENSE)
