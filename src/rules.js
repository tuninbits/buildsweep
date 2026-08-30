import { readFile } from "node:fs/promises";

// Imported (not read from disk at runtime) so the rule set is statically
// inlined by both Node's native ESM JSON loader and by bundlers (esbuild)
// when building the standalone single-file executables. That's what lets
// the same source work whether it's run via `npm install` or as a bundled
// binary with no files on disk next to it.
import defaultRulesJson from "../rules/default-rules.json" with { type: "json" };

/**
 * Load the default rule set shipped with buildsweep.
 */
export async function loadDefaultRules() {
  // Return a fresh deep clone so callers can't mutate the shared import.
  return JSON.parse(JSON.stringify(defaultRulesJson));
}

/**
 * Load a user-supplied rules file, if it exists. Returns null if not found.
 * User rules are merged on top of the defaults (additive, not a replacement),
 * so a project can add ecosystems/dirs without having to redeclare everything.
 */
export async function loadUserRules(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw new Error(`Failed to read rules file at ${filePath}: ${err.message}`);
  }
}

function mergeEcosystem(base, override) {
  return {
    label: override.label ?? base?.label ?? "Custom",
    risk: override.risk ?? base?.risk ?? "safe",
    dirs: Array.from(
      new Set([...(base?.dirs ?? []), ...(override.dirs ?? [])]),
    ),
    requireSibling: override.requireSibling ?? base?.requireSibling,
    note: override.note ?? base?.note,
  };
}

/**
 * Merge default rules with an optional user rules object.
 */
export function mergeRules(defaultRules, userRules) {
  if (!userRules) return defaultRules;

  const ecosystems = { ...defaultRules.ecosystems };
  for (const [key, value] of Object.entries(userRules.ecosystems ?? {})) {
    ecosystems[key] = mergeEcosystem(defaultRules.ecosystems[key], value);
  }

  return {
    alwaysSkip: Array.from(
      new Set([
        ...(defaultRules.alwaysSkip ?? []),
        ...(userRules.alwaysSkip ?? []),
      ]),
    ),
    ecosystems,
  };
}

/**
 * Flatten rules into a lookup structure the scanner can check cheaply
 * for every directory it visits.
 *
 * Returns:
 *   - dirNameToEcosystems: Map<string, {ecosystem, risk, requireSibling}[]>
 *   - alwaysSkip: Set<string>
 */
export function buildLookup(rules, { includeRisky, only, exclude }) {
  const alwaysSkip = new Set(rules.alwaysSkip ?? []);
  const exactNames = new Map(); // literal dir name -> match entries
  const patternRules = []; // { pattern, ...match entry } for names containing '*'

  for (const [ecoKey, eco] of Object.entries(rules.ecosystems)) {
    if (only && only.length > 0 && !only.includes(ecoKey)) continue;
    if (exclude && exclude.includes(ecoKey)) continue;
    if (eco.risk === "risky" && !includeRisky) continue;

    for (const dirName of eco.dirs) {
      const entry = {
        ecosystem: ecoKey,
        label: eco.label,
        risk: eco.risk,
        requireSibling: eco.requireSibling,
      };

      if (dirName.includes("*")) {
        patternRules.push({ pattern: dirName, ...entry });
      } else {
        const list = exactNames.get(dirName) ?? [];
        list.push(entry);
        exactNames.set(dirName, list);
      }
    }
  }

  return { alwaysSkip, exactNames, patternRules };
}
