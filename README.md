# buildsweep

Find and delete build artifacts, dependency folders, and caches across your
whole machine (or a single repo) in one fast pass — `node_modules`, Rust's
`target`, Python's `__pycache__`/`.venv`, .NET's `bin`/`obj`, and more.

Most of these directories are already git-ignored, fully regenerable, and
quietly eat tens of gigabytes across old projects. buildsweep finds them,
shows you what's there, and deletes only what you approve.

## Why not just `find . -name node_modules -exec rm -rf {} \;`?

- One command covers every ecosystem you work in, not just one directory name.
- It's a single-pass walk. Running separate `find` commands per pattern
  re-scans the entire tree once per pattern — slow, and easy to forget
  `-prune`, which makes it walk _into_ the very directories you're deleting.
- Matched directories are pruned (never descended into), so a 200k-file
  `node_modules` is recognized and skipped in one stat call instead of being
  traversed file by file.
- Ambiguous names (`bin`, `obj`) are only treated as build output when a
  matching project file (`.csproj`, `go.mod`, etc.) sits next to them, so it
  won't eat a hand-rolled `bin/` script directory.
- `.git` is never descended into.
- Always asks before deleting, unless you pass `--yes`.

## Install

There are two ways to get buildsweep, pick whichever fits your machine.

**Already have Node.js 18.20+ installed?** Use npm — it's the smallest
download and always gets you the latest version:

```bash
npm install -g buildsweep
```

Or run it without installing anything globally:

```bash
npx buildsweep
```

**Don't have Node installed, don't have space for it, or just don't want
to install anything?** Download the standalone binary for your OS from the
[latest release](https://github.com/tuninbits/buildsweep/releases/latest) —
it's a single file with the JavaScript runtime built in, no Node required:

| OS      | File                     |
| ------- | ------------------------ |
| macOS   | `buildsweep-macos`       |
| Linux   | `buildsweep-linux`       |
| Windows | `buildsweep-windows.exe` |

```bash
# macOS / Linux — make it executable once, then run it
chmod +x buildsweep-macos
./buildsweep-macos --help
```

```powershell
# Windows
.\buildsweep-windows.exe --help
```

The binary is larger (~100MB, since it embeds the whole Node runtime) and
won't auto-update, but it works with nothing else installed on the machine.

## Usage

```bash
buildsweep                       # scan and clean the current directory
buildsweep ~/code                # scan a specific directory (e.g. all your projects)
buildsweep . --dry-run           # see what would be deleted, delete nothing
buildsweep . --only rust,python  # only look for Rust and Python artifacts
buildsweep . --json              # machine-readable output, for scripting
```

### Options

| Flag               | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `--dry-run`        | Scan and report only, delete nothing                         |
| `--yes`, `-y`      | Skip the confirmation prompt                                 |
| `--only <list>`    | Comma-separated ecosystems to scan for                       |
| `--exclude <list>` | Comma-separated ecosystems to skip                           |
| `--risky`          | Also include ambiguous patterns (`tmp`, `vendor`, `.vercel`) |
| `--rules <path>`   | Path to a JSON file with additional/override rules           |
| `--no-size`        | Skip computing directory sizes (faster on huge trees)        |
| `--json`           | Machine-readable output                                      |

## Default rule set

buildsweep ships with rules for:

- **JavaScript / TypeScript** — `node_modules`, `.next`, `.nuxt`, `.turbo`, `.cache`, `dist`, `build`, `out`, `.output`, `.parcel-cache`, `.svelte-kit`, `coverage`, `.nyc_output`, `storybook-static`
- **Rust** — `target`
- **Python** — `__pycache__`, `.venv`, `venv`, `.pytest_cache`, `.mypy_cache`, `.ruff_cache`, `.tox`, `.eggs`, `*.egg-info`
- **Java / Kotlin** — `target`, `build`, `.gradle`
- **.NET** — `bin`, `obj` (only when a `.csproj`/`.sln`/`.fsproj`/`.vbproj` sits next to them)
- **Go** — `bin` (only when `go.mod` sits next to it)
- **Ruby** — `.bundle`
- **Misc (opt-in via `--risky`)** — `tmp`, `vendor`, `.vercel`

`.git`, `.hg`, and `.svn` are always skipped and never descended into.

## Custom rules

Drop a `.buildsweeprc.json` in the directory you're scanning, or pass
`--rules path/to/file.json`. Custom rules are merged additively on top of the
defaults — you don't have to redeclare the whole rule set:

```json
{
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

## Building the standalone binary yourself

Binaries are built with Node's built-in [Single Executable Applications](https://nodejs.org/api/single-executable-applications.html)
support. Cross-compiling isn't possible — build on the OS you want a binary
for (or let CI do it, see `.github/workflows/release.yml`, which builds all
three on every tagged release):

```bash
npm install
npm run build:binary
# -> dist/buildsweep-macos | dist/buildsweep-linux | dist/buildsweep-windows.exe
```

## Why no GUI (yet)

buildsweep is built to be scriptable and fast: one command, works over SSH,
composable in CI or a pre-commit hook. An interactive terminal UI (arrow-key
select, live scan) is a natural next step; a full desktop GUI is not planned
since it doesn't fit how this tool gets used day to day.

## Safety

- Nothing is deleted without a confirmation prompt, unless you pass `--yes`.
- `--dry-run` never touches the filesystem.
- Ambiguous directory names require a matching sibling project file before
  they're considered a match.
- `--risky` is opt-in for patterns that are sometimes intentionally committed.

buildsweep deletes directories recursively. Review the list it prints before
confirming, especially the first time you run it against a new directory.

## Contributing

Issues and PRs welcome, especially rules for ecosystems not covered yet
(Elixir, PHP/Composer, Swift, C/C++ build systems, etc.). Run `npm test`
before submitting.

## License

MIT
