# BuildSweep Professional Documentation Design

**Date:** 2026-08-31
**Status:** Approved for planning
**Owner:** Tuninbits

## Purpose

Prepare BuildSweep for a professional open-source launch by replacing informal or inaccurate documentation with a complete, trustworthy documentation package. The result must help users install and operate BuildSweep safely, explain the tool's real behavior without overclaiming, and give contributors and maintainers clear project processes.

This work is documentation-focused. It will not change scanner or deletion behavior. A factually incorrect note in the default rules file may be corrected because that note is user-facing documentation embedded in configuration data.

## Audience

The documentation serves three audiences:

1. **Developers reclaiming disk space** who need a safe first command, understandable results, and clear warnings before deletion.
2. **Automation users** who need exact CLI, JSON, exit-code, and platform behavior.
3. **Contributors and maintainers** who need development, rule-authoring, testing, security, issue, pull-request, and release guidance.

## Brand and tone

- Use **BuildSweep** as the product name in prose and headings.
- Use `buildsweep` for the npm package, executable, and command examples.
- Use **Tuninbits** as the organization and copyright owner.
- Keep the tone concise, technical, candid, and safety-conscious.
- Avoid claims such as "every language," guaranteed whole-machine coverage, or guaranteed recoverable space.
- Prefer concrete supported ecosystems and verified platform/runtime information.

## Deliverables

### Primary product documentation

- Rewrite `README.md` as the public product page.
- Repair `LICENSE` as a valid MIT license with Tuninbits copyright.
- Add `CHANGELOG.md` using a Keep a Changelog-style structure with `Unreleased` and `0.1.0` sections.

### Community and maintenance documentation

- Add `CONTRIBUTING.md`.
- Add `SECURITY.md`.
- Add `CODE_OF_CONDUCT.md` based on Contributor Covenant 2.1.
- Add `.github/PULL_REQUEST_TEMPLATE.md`.
- Add `.github/ISSUE_TEMPLATE/bug_report.yml`.
- Add `.github/ISSUE_TEMPLATE/rule_request.yml`.
- Add `.github/ISSUE_TEMPLATE/feature_request.yml`.
- Add `.github/ISSUE_TEMPLATE/config.yml`.

### Embedded documentation correction

- Correct the risky `misc` rule note in `rules/default-rules.json` so it states that miscellaneous patterns require `--risky`; selecting only that group requires both `--only misc` and `--risky`.

## README information architecture

The README will use the following order:

1. Product name and concise value proposition.
2. Minimal verified badges: CI, Node.js requirement, and MIT license. npm and release badges are omitted until those channels are live.
3. Project status indicating that `0.1.0` is early-stage.
4. Safety-first quick start centered on `--dry-run`.
5. Installation paths:
   - npm for Node.js 18.20 or newer.
   - Standalone OS executables for users without Node.js, with availability and signing caveats.
6. Representative terminal output.
7. How scanning works, including discovery pruning and default size traversal.
8. Built-in ecosystem/rule-group table.
9. Full CLI option reference.
10. Safety model and explicit non-guarantees.
11. JSON report format and report-only semantics.
12. Custom rule reference and example.
13. Platform support and binary caveats.
14. Troubleshooting.
15. Development, contribution, security, changelog, and license links.

## Required technical accuracy

### Discovery and performance

The documentation must distinguish discovery from sizing:

- BuildSweep performs one recursive discovery traversal of the selected root.
- When a directory matches, discovery records it and does not descend into it.
- Size calculation is enabled by default and separately traverses each matched directory to estimate its size.
- `--no-size` avoids content sizing and is the fastest mode for large trees.
- No claim may state that default operation avoids traversing matched contents.

### Scope and completeness

- Scanning is best-effort within the user-selected root.
- Unreadable, vanished, or persistently locked paths may be skipped.
- Directory symlinks are not followed.
- `.git`, `.hg`, and `.svn` are always excluded from traversal.
- BuildSweep must not be described as guaranteeing a complete whole-machine inventory.

### Safety model

- Matching is primarily directory-name based.
- BuildSweep does not inspect `.gitignore` or determine whether paths are tracked by Git.
- Generic names such as `dist`, `build`, `out`, `target`, `.cache`, `coverage`, and virtual-environment names can contain intentional content in some projects.
- Users should begin with `--dry-run` and review every path before confirming deletion.
- Deletion is recursive and is not recoverable through BuildSweep.
- Confirmation is required unless `--yes` or `-y` is passed.
- Risky rules are excluded unless `--risky` is supplied.
- Reported sizes and reclaimed-space totals are estimates.

### Rule groups and filtering

- Built-in groups are JavaScript/TypeScript, Rust, Python, Java/Kotlin, .NET, Go, Ruby, and opt-in miscellaneous patterns.
- `--only` and `--exclude` select rule groups; they are not language-detection guarantees.
- Shared directory names can be attributed to the first eligible rule group.
- `--only misc` does not bypass risk controls; use `--only misc --risky`.

### JSON behavior

- `--json` is report-only and never deletes, even when combined with `--yes`.
- The documented response fields are `root`, `dirsVisited`, `totalBytes`, and `matches`.
- Match records include path, name, ecosystem, label, risk, and—when sizing is enabled—`sizeBytes`.
- With `--no-size`, `sizeBytes` is absent and `totalBytes` remains zero.

### Custom rules

- Root-local configuration is read from `.buildsweeprc.json`; `--rules <path>` selects an explicit file.
- Custom ecosystems and directory names are merged additively with defaults.
- Default directories and traversal exclusions cannot be removed through custom configuration.
- Ecosystem metadata such as label, risk, sibling requirements, and notes may replace existing metadata.
- Matching is case-sensitive.
- Patterns support exact names or a single `*`; multiple wildcards are unsupported.

### Platform and distribution claims

- The npm CLI requires Node.js 18.20 or newer.
- CI currently verifies Node.js 18.20, 20, and 22 on Ubuntu, macOS, and Windows GitHub-hosted runners.
- Standalone executables embed Node.js and therefore require no separate Node installation.
- Binary filenames do not encode CPU architecture, so documentation must not claim support for every hardware architecture.
- macOS binaries are ad-hoc signed and may trigger Gatekeeper until proper signing/notarization is configured.
- Standalone binaries do not auto-update.

## Community document contents

### CONTRIBUTING.md

Include:

- Prerequisites and local setup.
- Repository structure.
- `npm install`, `npm test`, CLI smoke checks, and binary-build instructions.
- How to add or change a rule safely.
- Test expectations for shared names, sibling guards, pruning, platforms, and path separators.
- Pull-request expectations and focused change guidance.
- Maintainer release process for npm and tagged binaries, without claiming npm automation that does not exist.

### SECURITY.md

Include:

- Supported version policy: latest released version only until the project reaches stable maturity.
- A private reporting route through GitHub private vulnerability reporting when enabled; otherwise instruct reporters to contact maintainers without posting destructive or security-sensitive details publicly.
- Requested report contents.
- Expected acknowledgement and update windows phrased as goals, not legal guarantees.
- Guidance that ordinary incorrect matches and data-loss-risk bugs should still be treated seriously.

### CODE_OF_CONDUCT.md

Use Contributor Covenant 2.1 with:

- Tuninbits named as project steward.
- A project-controlled enforcement contact or GitHub reporting route, not invented personal contact details.
- Standard scope, enforcement, and attribution sections.

### CHANGELOG.md

- Follow Keep a Changelog headings.
- Use semantic versioning language.
- Record the current `0.1.0` functionality conservatively.
- Maintain an `Unreleased` section for future changes.
- Avoid fabricating release dates or publication channels that are not verified.

### Issue forms

**Bug report:** request OS, architecture, installation method, Node/binary version, command, expected/actual behavior, dry-run output, custom rules, and reproduction steps. Warn users not to paste secrets or sensitive paths without redaction.

**Rule request:** request ecosystem, generated directory names, project-marker files, regeneration command, false-positive risks, and references to official tooling documentation.

**Feature request:** request problem, proposed behavior, alternatives, safety impact, and compatibility considerations.

**Config:** enable discussions or a general support link only if the destination exists; otherwise keep contact links limited to valid repository resources.

### Pull request template

Require:

- Summary and motivation.
- Change type.
- Testing evidence.
- Platform impact.
- Safety/deletion impact.
- Documentation and changelog confirmation.
- Focused checklist without demanding unrelated work.

## Metadata policy

- All repository links must use `https://github.com/tuninbits/buildsweep`.
- Package metadata must continue to use the lowercase npm/CLI name and Tuninbits author identity.
- The README must not display npm-version/download badges until the package is publicly published and verified.
- The README must not display a release badge or promise downloadable executables until at least one tagged release successfully publishes all expected assets.

## Validation plan

1. Search the BuildSweep repository for stale `tuninlabs` references.
2. Search for placeholders such as `TBD`, `TODO`, invented contact addresses, or unverified release claims.
3. Verify every relative documentation link resolves to an existing file.
4. Validate JSON and YAML syntax for rules and GitHub templates/workflows.
5. Run `npm test`.
6. Run `node bin/buildsweep.js --help`.
7. Run a non-destructive dry-run smoke test against a temporary fixture.
8. Run `npm pack --dry-run` and verify intended documentation files are included.
9. Review the final diff for unsupported technical claims and accidental sensitive data.
10. Do not create a commit or push changes unless the user explicitly requests it.

## Out of scope

- Scanner, deletion, sizing, retry, and rule-selection behavior changes.
- A GUI or interactive terminal UI.
- A documentation website.
- npm publication.
- Creating a GitHub release or tag.
- Binary signing/notarization infrastructure.
- New ecosystem rules beyond correcting the existing miscellaneous-rule note.

## Acceptance criteria

The documentation package is complete when:

- All listed deliverable files exist and use consistent BuildSweep/Tuninbits naming.
- The MIT license is valid and uncorrupted.
- The README begins with a safe dry-run workflow and contains no known inaccurate behavior claims.
- CLI flags, JSON behavior, custom-rule behavior, platform support, and safety limitations match the implementation.
- Community documents give contributors and maintainers actionable processes without fabricated contact information or release status.
- Issue and pull-request templates are syntactically valid and collect the information needed to reproduce and assess changes safely.
- Repository tests and documentation validation checks pass.
