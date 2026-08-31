# Security Policy

## Supported versions

Until a broader support policy is announced, the latest released version of BuildSweep is the supported version. This policy does not imply that a package, tag, or release asset exists at any particular time; verify availability through the repository's release channels.

## Reporting a vulnerability

Use GitHub private vulnerability reporting for this repository when it is available. If private vulnerability reporting is unavailable, contact the repository maintainers through a non-public channel. Do not disclose destructive details, sensitive paths, exploit instructions, or private data in a public issue.

A useful report includes:

- the affected BuildSweep version or commit;
- operating system and platform details;
- installation method, such as a source checkout, npm package, or standalone executable;
- minimal reproduction steps using disposable data where possible;
- the observed and expected behavior;
- the potential impact; and
- any suggested mitigation.

Please avoid testing against data you cannot afford to lose. BuildSweep performs recursive deletion, and deletion is not recoverable through BuildSweep.

## Response goals

Maintainers aim to acknowledge a report within **5 business days** and provide status updates at least every **10 business days** while it remains active. These timeframes are goals, not guarantees. Investigation, remediation, release, and disclosure timing depend on the report's complexity and the maintainers' availability.

## Cleanup safety reports

Incorrect cleanup-rule matches, scanner behavior, or resolved paths that could cause unintended recursive deletion or data loss are security/safety-sensitive. Report them cautiously through the same private routes, even when they do not expose data or enable code execution.

Include the smallest safe reproduction you can provide: the selected root layout, relevant directory names and sibling files, CLI options, rule configuration, and report-only output. Prefer `--dry-run` or `--json`; do not reproduce a suspected deletion issue on valuable content. Remember that rules are primarily directory-name based, scanning is best-effort, and the `safe` classification is metadata rather than a deletion guarantee.
