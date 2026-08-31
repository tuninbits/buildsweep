# BuildSweep Professional Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a complete, accurate, and professional open-source documentation package for BuildSweep and commit the finished changes locally.

**Architecture:** Treat `README.md` as the user-facing product page, dedicated root documents as contributor/governance references, and `.github` forms/templates as structured project intake. Keep all technical claims grounded in the current CLI, scanner, rules, CI, and release implementation; make no functional scanner changes.

**Tech Stack:** Markdown, GitHub issue-form YAML, JSON rule metadata, Node.js 18.20+, npm, GitHub Actions.

## Global Constraints

- Use **BuildSweep** in prose/headings and `buildsweep` for the npm package, binary, and command.
- Use **Tuninbits** as organization and copyright owner.
- Node.js support starts at exactly `18.20.0`.
- Describe scanning as best-effort within a selected root; do not claim guaranteed whole-machine coverage.
- Distinguish one-pass discovery/pruning from default recursive size calculation.
- State that matching is name-based and does not inspect `.gitignore` or Git tracking.
- State that `--json` is report-only and that `--only misc` also requires `--risky`.
- Custom rules are additive, case-sensitive, and permit exact names or one `*` only.
- Do not add npm or release badges until those publication channels are verified live.
- Do not change scanner, deletion, sizing, retry, or rule-selection behavior.
- Do not publish, tag, release, or push; create local commits only as explicitly authorized by the user.

---

## File Structure

### Files to modify

- `README.md` — primary user/product documentation.
- `LICENSE` — valid MIT license text and Tuninbits copyright.
- `rules/default-rules.json` — correct only the inaccurate user-facing `misc.note` text.

### Files to create

- `CHANGELOG.md` — release history and unreleased changes.
- `CONTRIBUTING.md` — contributor setup, rules, testing, PR, and release guidance.
- `SECURITY.md` — vulnerability reporting and supported-version policy.
- `CODE_OF_CONDUCT.md` — Contributor Covenant 2.1 and enforcement route.
- `.github/PULL_REQUEST_TEMPLATE.md` — structured PR checklist.
- `.github/ISSUE_TEMPLATE/bug_report.yml` — reproducible bug intake.
- `.github/ISSUE_TEMPLATE/rule_request.yml` — ecosystem rule proposal intake.
- `.github/ISSUE_TEMPLATE/feature_request.yml` — product feature intake.
- `.github/ISSUE_TEMPLATE/config.yml` — issue-template configuration.
- `docs/superpowers/specs/2026-08-31-professional-documentation-design.md` — approved design record (already written).
- `docs/superpowers/plans/2026-08-31-professional-documentation.md` — this implementation plan.

---

### Task 1: Repair legal and embedded rule documentation

**Files:**
- Modify: `LICENSE`
- Modify: `rules/default-rules.json`
- Include: `docs/superpowers/specs/2026-08-31-professional-documentation-design.md`
- Include: `docs/superpowers/plans/2026-08-31-professional-documentation.md`

**Interfaces:**
- Consumes: Current MIT package declaration and the existing `misc` rule behavior.
- Produces: Valid legal text and accurate risky-rule guidance used by later README/community documents.

- [ ] **Step 1: Repair the license text**

Replace the malformed first line with exactly:

```text
MIT License
```

Keep the existing standard MIT terms and this copyright line:

```text
Copyright (c) 2026 Tuninbits
```

- [ ] **Step 2: Correct the miscellaneous rule note**

Set `rules/default-rules.json` → `ecosystems.misc.note` to exactly:

```json
"These names are also used for intentionally committed content in some projects. Enable with --risky; to scan only this group, use --only misc --risky."
```

Do not change `risk`, `dirs`, or any other matching metadata.

- [ ] **Step 3: Validate legal/rule files**

Run:

```bash
node -e "JSON.parse(require('node:fs').readFileSync('rules/default-rules.json', 'utf8')); console.log('rules JSON valid')"
head -n 3 LICENSE
```

Expected:

```text
rules JSON valid
MIT License

Copyright (c) 2026 Tuninbits
```

- [ ] **Step 4: Commit the legal/rule/spec foundation**

```bash
git add LICENSE rules/default-rules.json docs/superpowers/specs/2026-08-31-professional-documentation-design.md docs/superpowers/plans/2026-08-31-professional-documentation.md
git commit -m "docs: define professional documentation standards"
```

### Task 2: Rewrite the README as a professional product page

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: CLI flags from `src/cli.js`, behavior from `src/scan.js`, built-in patterns from `rules/default-rules.json`, Node floor from `package.json`, CI matrix, and release workflow.
- Produces: Canonical user-facing installation, operation, safety, configuration, platform, and troubleshooting documentation.

- [ ] **Step 1: Replace the introduction and badges**

Use this content structure:

```markdown
# BuildSweep

[![CI](https://github.com/tuninbits/buildsweep/actions/workflows/ci.yml/badge.svg)](https://github.com/tuninbits/buildsweep/actions/workflows/ci.yml)
[![Node.js 18.20+](https://img.shields.io/badge/Node.js-18.20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A cross-platform CLI for finding and removing dependency directories, build outputs, and caches across multiple development ecosystems.

> [!IMPORTANT]
> BuildSweep is early-stage software. Start with `--dry-run`, review every match, and keep source control or backups for anything you cannot regenerate.
```

Do not add npm version/download or release badges.

- [ ] **Step 2: Add safety-first quick start and installation**

Document these exact user paths:

```bash
npx buildsweep . --dry-run
buildsweep . --dry-run
```

Explain:

- Node users need Node.js 18.20+ and can use `npm install -g buildsweep` or `npx buildsweep` once the package is published.
- Standalone binaries require no separate Node installation but are available only from successful tagged GitHub releases.
- Expected filenames are `buildsweep-linux`, `buildsweep-macos`, and `buildsweep-windows.exe`.
- Binaries embed Node, are larger, do not auto-update, do not encode architecture in filenames, and macOS builds may trigger Gatekeeper because they are only ad-hoc signed.

- [ ] **Step 3: Add representative output and scan model**

Include a concise terminal example that labels matches, estimated sizes, and dry-run behavior. Explain exactly:

- Discovery walks the selected root once.
- Matching directories are recorded and pruned from discovery.
- Default sizing separately walks matched contents.
- `--no-size` skips sizing and is faster on large trees.
- Symlinked directories and `.git`/`.hg`/`.svn` are not traversed.
- Unreadable, vanished, or persistently locked paths may be skipped.

- [ ] **Step 4: Document ecosystems and CLI flags**

Include all built-in groups and all implemented flags:

```text
--dry-run
--yes, -y
--only <ecosystems>
--exclude <list>
--risky
--rules <path>
--no-size
--json
-h, --help
```

Clarify that `--only`/`--exclude` select rule groups rather than performing language detection and that shared names can be attributed to the first eligible group.

- [ ] **Step 5: Document safety and JSON semantics**

State explicitly:

- Rules are primarily directory-name based.
- BuildSweep does not inspect `.gitignore` or Git tracking.
- Conventional artifact names can still contain intentional content.
- Deletion is recursive and not recoverable through BuildSweep.
- `--json` is always report-only, even with `--yes`.

Show this JSON shape:

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

Explain that `sizeBytes` is absent and `totalBytes` is zero with `--no-size`.

- [ ] **Step 6: Document custom rules and troubleshooting**

Document `.buildsweeprc.json` and `--rules <path>`, additive directory merging, metadata replacement, case sensitivity, one-`*` limitation, and inability to remove defaults. Include troubleshooting for permissions/skipped paths, large scans/`--no-size`, macOS Gatekeeper, Windows locks, and missing release assets.

- [ ] **Step 7: Add project links and verify README claims**

Link to:

```markdown
[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md) · [Code of Conduct](CODE_OF_CONDUCT.md) · [MIT License](LICENSE)
```

Run:

```bash
node bin/buildsweep.js --help
rg -n "every language|one stat call|fully regenerable|whole machine|latest release" README.md
```

Expected: CLI help succeeds; the claim scan has no unsupported statements.

- [ ] **Step 8: Commit the README rewrite**

```bash
git add README.md
git commit -m "docs: rewrite README for a safe professional launch"
```

### Task 3: Add contributor, security, conduct, and changelog documents

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `CHANGELOG.md`

**Interfaces:**
- Consumes: The README's product/safety terminology, current npm scripts, CI matrix, binary build script, and release workflow.
- Produces: Stable policies linked from README and referenced by issue/PR templates.

- [ ] **Step 1: Write CONTRIBUTING.md**

Include these sections:

```markdown
# Contributing to BuildSweep
## Ways to contribute
## Development setup
## Repository structure
## Running tests
## Testing the CLI
## Building a standalone executable
## Adding or changing cleanup rules
## Documentation changes
## Pull request expectations
## Maintainer release checklist
```

Use these verified commands:

```bash
npm install
npm test
node bin/buildsweep.js --help
node bin/buildsweep.js . --dry-run --no-size
npm run build:binary
```

For rule changes, require positive matches, false-positive cases, sibling-guard coverage where names are ambiguous, platform-safe `path` handling, and README/changelog updates.

- [ ] **Step 2: Write SECURITY.md**

Include:

- Latest released version is supported until a broader policy is announced.
- Use GitHub private vulnerability reporting when available.
- If private reporting is unavailable, contact repository maintainers through a non-public channel and do not disclose destructive details in a public issue.
- Reports should include affected version, platform, installation method, reproduction, impact, and suggested mitigation.
- Target acknowledgement within 5 business days and status updates at least every 10 business days, explicitly phrased as goals.
- Incorrect deletion matches or paths that risk data loss are security/safety-sensitive and should be reported cautiously.

Do not invent an email address.

- [ ] **Step 3: Write CODE_OF_CONDUCT.md**

Use the complete Contributor Covenant version 2.1 text, name Tuninbits as project steward, and set enforcement contact to GitHub's private maintainer/contact mechanisms without fabricating personal contact information. Preserve the official attribution link to `https://www.contributor-covenant.org/version/2/1/code_of_conduct.html`.

- [ ] **Step 4: Write CHANGELOG.md**

Use:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Reworked project documentation and community contribution guidance.

## [0.1.0]

### Added
- Cross-platform recursive discovery of build artifacts, dependency directories, and caches.
- Built-in rules for JavaScript/TypeScript, Rust, Python, Java/Kotlin, .NET, Go, and Ruby.
- Dry-run, confirmation, ecosystem filters, risky-rule opt-in, JSON reporting, custom rules, and no-size scanning.
- Standalone executable build and tagged release workflows.
- Cross-platform CI on supported Node.js lines.
```

Do not add a release date unless a verified tag/release exists.

- [ ] **Step 5: Validate and commit community documents**

Run:

```bash
rg -n "TBD|TODO|FIXME|example@example|@example" CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md CHANGELOG.md
```

Expected: no unresolved placeholders or invented contacts.

```bash
git add CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md CHANGELOG.md
git commit -m "docs: add open source community guidelines"
```

### Task 4: Add GitHub issue forms and pull request template

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/rule_request.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

**Interfaces:**
- Consumes: Security and contribution policies from Task 3.
- Produces: Structured GitHub contributor intake with no invalid external links.

- [ ] **Step 1: Create bug_report.yml**

Use a GitHub issue form with:

```yaml
name: Bug report
description: Report incorrect behavior, missed matches, or unsafe matches.
title: "[Bug]: "
labels: ["bug", "triage"]
body:
  - type: markdown
    attributes:
      value: "Before submitting, run BuildSweep with --dry-run and redact sensitive paths, usernames, tokens, and project names."
```

Add required fields for description, reproduction steps, expected behavior, actual behavior, command, OS, architecture, installation method, version, dry-run output, and custom rules. Add a required acknowledgement checkbox that no secrets are included.

- [ ] **Step 2: Create rule_request.yml**

Request ecosystem/tool name, generated directory names, sibling/project marker files, official regeneration command, false-positive risks, official documentation links, and sample project layout. Require acknowledgement that the proposed paths are disposable outputs rather than source.

- [ ] **Step 3: Create feature_request.yml**

Request problem statement, proposed behavior, alternatives, safety/deletion impact, platform impact, and additional context. Avoid solution-only requests by making the underlying problem required.

- [ ] **Step 4: Create config.yml and PR template**

Use:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Security vulnerability
    url: https://github.com/tuninbits/buildsweep/security/advisories/new
    about: Report vulnerabilities privately. Do not open a public issue.
```

The PR template must include summary, motivation, change type, testing evidence, platforms, safety impact, and checkboxes for tests, docs, changelog, and secret-free output.

- [ ] **Step 5: Validate YAML and commit templates**

Run:

```bash
ruby -e "require 'yaml'; Dir['.github/ISSUE_TEMPLATE/*.yml'].each { |f| YAML.load_file(f); puts \"valid: #{f}\" }"
```

Expected: one `valid:` line for each of the four YAML files.

```bash
git add .github/ISSUE_TEMPLATE .github/PULL_REQUEST_TEMPLATE.md
git commit -m "docs: add GitHub issue and pull request templates"
```

### Task 5: Final validation, package audit, and integration commit

**Files:**
- Verify: all documentation and metadata files.
- Modify only if validation exposes a documentation defect.

**Interfaces:**
- Consumes: All prior tasks.
- Produces: A validated local branch ready for user review or an explicitly requested push.

- [ ] **Step 1: Verify naming and stale references**

Run:

```bash
rg -n "Tuninlabs|tuninlabs|WdHishMIT|every language|one stat call" . --glob '!node_modules/**' --glob '!dist/**' --glob '!.git/**'
```

Expected: no stale naming, malformed license, or unsupported claims.

- [ ] **Step 2: Verify document links and required files**

Run:

```bash
for file in README.md LICENSE CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md CHANGELOG.md .github/PULL_REQUEST_TEMPLATE.md .github/ISSUE_TEMPLATE/bug_report.yml .github/ISSUE_TEMPLATE/rule_request.yml .github/ISSUE_TEMPLATE/feature_request.yml .github/ISSUE_TEMPLATE/config.yml; do test -f "$file" || exit 1; done
```

Expected: exit code 0.

Manually verify every relative Markdown link in `README.md` points to one of those files or an existing repository path.

- [ ] **Step 3: Run tests and CLI smoke checks**

Run:

```bash
npm test
node bin/buildsweep.js --help
fixture="$(mktemp -d)"
mkdir -p "$fixture/project/node_modules/pkg" "$fixture/project/target/debug"
touch "$fixture/project/node_modules/pkg/index.js"
node bin/buildsweep.js "$fixture" --dry-run --no-size
rm -rf "$fixture"
```

Expected: 27 tests pass; help exits 0; dry-run reports both matches and deletes nothing.

- [ ] **Step 4: Audit npm package contents**

Run:

```bash
npm pack --dry-run
```

Expected: package includes `bin/`, `src/`, `rules/`, `README.md`, `LICENSE`, and package metadata; development-only community/process files may remain repository-only because the existing `files` allowlist is intentionally minimal.

- [ ] **Step 5: Validate Git diff and status**

Run:

```bash
git diff --check
git status --short
git log --oneline -5
```

Expected: no whitespace errors; only intended documentation changes are present; prior task commits are visible.

- [ ] **Step 6: Create a final integration commit only if validation required fixes**

If validation caused edits not already committed:

```bash
git add README.md LICENSE CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md CHANGELOG.md rules/default-rules.json .github docs/superpowers
git commit -m "docs: finalize professional open source documentation"
```

If the working tree is clean, do not create an empty commit.

- [ ] **Step 7: Report completion without pushing**

Report the local commit hashes, validation evidence, and any unverified external condition (npm publication, tagged releases, private vulnerability reporting availability, signing/notarization). Do not push unless the user separately requests it.
