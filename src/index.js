/**
 * Public programmatic API for buildsweep.
 *
 * The CLI (bin/buildsweep.js) is the primary interface, but the scanner and
 * rule engine are useful on their own — e.g. to report reclaimable space from
 * a build script without deleting anything. Everything re-exported here is
 * covered by semver; the individual modules under src/ are internal and may
 * move between releases, so import from the package root:
 *
 *   import { loadDefaultRules, buildLookup, scanForMatches } from "buildsweep";
 *
 *   const rules = await loadDefaultRules();
 *   const lookup = buildLookup(rules, { includeRisky: false });
 *   const { matches } = await scanForMatches(process.cwd(), lookup);
 */

export {
  loadDefaultRules,
  loadUserRules,
  mergeRules,
  buildLookup,
} from "./rules.js";

export { scanForMatches, opendirWithRetry } from "./scan.js";

export { formatBytes, color } from "./format.js";

export { matchesPattern, matchesAny } from "./glob.js";

export { run } from "./cli.js";
