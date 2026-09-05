/**
 * Compile-only check for the published type declarations. Never executed —
 * `npm run typecheck` compiles it with `noEmit` to verify the declarations in
 * src/index.d.ts are valid, resolvable through the package "exports" map, and
 * usable the way the README documents them.
 */

import {
  buildLookup,
  color,
  formatBytes,
  loadDefaultRules,
  loadUserRules,
  matchesAny,
  matchesPattern,
  mergeRules,
  opendirWithRetry,
  run,
  scanForMatches,
  type Lookup,
  type Match,
  type RuleSet,
  type ScanProgress,
} from "buildsweep";

async function main(): Promise<void> {
  const defaults: RuleSet = await loadDefaultRules();
  const userRules: RuleSet | null = await loadUserRules(".buildsweeprc.json");
  const rules: RuleSet = mergeRules(defaults, userRules);

  const lookup: Lookup = buildLookup(rules, {
    includeRisky: false,
    only: ["rust", "python"],
    exclude: null,
  });

  const { matches, dirsVisited } = await scanForMatches(process.cwd(), lookup, {
    computeSizes: true,
    progressIntervalMs: 200,
    onProgress: (update: ScanProgress) => {
      console.log(update.dirsVisited, update.matchesFound, update.currentPath);
    },
  });

  const total: number = matches.reduce(
    (sum: number, match: Match) => sum + (match.sizeBytes ?? 0),
    0,
  );

  console.log(
    color.bold(`${matches.length} matches in ${dirsVisited} dirs`),
    formatBytes(total),
  );

  console.log(matchesPattern("foo.egg-info", "*.egg-info"));
  console.log(matchesAny("node_modules", ["node_modules", "target"]));

  const dir = await opendirWithRetry(process.cwd(), { retries: 2, delayMs: 10 });
  await dir.close();

  const exitCode: number = await run(["--dry-run", "--json"]);
  console.log(exitCode);
}

void main;
