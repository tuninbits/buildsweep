## Summary

<!-- What does this pull request change? Keep the change focused. -->

## Motivation

<!-- What problem does this solve, and why is this change needed? Do not include private vulnerability or incident details. -->

## Change type

- [ ] Bug fix
- [ ] Feature
- [ ] Cleanup rule
- [ ] Documentation
- [ ] Test or maintenance

## Testing evidence

<!-- List the exact checks run and their results. Include npm test and relevant buildsweep CLI smoke checks, or explain why a check is not applicable. For rule changes, include positive matches, false-positive cases, sibling guards, and relevant --dry-run combinations. -->

```text
npm test
node bin/buildsweep.js --help
node bin/buildsweep.js . --dry-run --no-size
```

## Platforms

<!-- Select every platform tested and describe any relevant architecture or filesystem details. -->

- [ ] Ubuntu/Linux
- [ ] macOS
- [ ] Windows
- [ ] Other or not platform-specific (explain below)

Platform details:

## Safety impact

<!-- Explain any user-visible or safety impact. Call out changes to scanning, paths, cleanup rules, prompting, or recursive deletion. A directory-name match and the `safe` classification are not guarantees that content is disposable. Write "None" only after considering these cases. -->

## Submission checklist

- [ ] I added or updated tests for changed behavior and recorded the results above, or explained why tests are not applicable.
- [ ] I updated documentation when behavior or guidance changed, or explained why no documentation update is needed.
- [ ] I updated `CHANGELOG.md` under `[Unreleased]` for user-visible changes, or explained why no changelog entry is needed.
- [ ] I confirmed that this pull request and its testing output contain no secrets, private reports, personal data, or unredacted sensitive information.
