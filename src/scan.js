import { opendir, stat } from "node:fs/promises";
import path from "node:path";
import { matchesAny } from "./glob.js";

// Windows (and occasionally other OSes) can transiently lock a directory
// right after it's created — antivirus/indexer scanning is the common
// cause — which surfaces as EBUSY/EPERM/EMFILE from opendir() even though
// the directory is perfectly readable a moment later. Retrying briefly
// avoids silently treating those directories as "doesn't exist" and
// dropping real matches. Errors outside this set (ENOENT, EACCES) are not
// retried since they represent a real, stable condition.
const TRANSIENT_ERROR_CODES = new Set(["EBUSY", "EPERM", "EMFILE", "ENFILE"]);

// `open` is injectable so tests can simulate transient failures without
// needing to reproduce real OS-level file locks.
export async function opendirWithRetry(
  dirPath,
  { retries = 4, delayMs = 25, open = opendir } = {},
) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await open(dirPath);
    } catch (err) {
      lastErr = err;
      if (!TRANSIENT_ERROR_CODES.has(err.code) || attempt === retries) {
        throw err;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, delayMs * (attempt + 1)),
      );
    }
  }
  throw lastErr;
}

/**
 * Recursively check whether any file in `dir` matches one of the given
 * glob patterns. Used for requireSibling checks (e.g. "is there a *.csproj
 * next to this bin/ folder?"). Only looks at the immediate directory,
 * non-recursive, so it stays cheap.
 */
async function hasSiblingMatch(dir, patterns) {
  try {
    const entries = await opendirWithRetry(dir);
    // Do not call entries.close() while the `for await` loop is still
    // active — it owns the handle's lifecycle and closes it via the
    // iterator's implicit return() as soon as we break/return here.
    for await (const entry of entries) {
      if (entry.isFile() && matchesAny(entry.name, patterns)) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

async function getDirSizeBytes(dirPath) {
  let total = 0;
  async function walk(current) {
    let entries;
    try {
      entries = await opendirWithRetry(current);
    } catch {
      return;
    }
    for await (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        try {
          const s = await stat(full);
          total += s.size;
        } catch {
          // file vanished mid-scan, ignore
        }
      }
    }
  }
  await walk(dirPath);
  return total;
}

/**
 * Walk `root` in a single pass, finding directories that match the rule
 * lookup. Matched directories are pruned (never descended into), so a
 * matched node_modules never gets walked twice and its contents never
 * show up as false positives for nested rules.
 *
 * onProgress(update) is called periodically so callers can render a live
 * "still scanning, N dirs checked, M matches so far" status instead of a
 * silent hang on large trees.
 */
export async function scanForMatches(root, lookup, options = {}) {
  const { onProgress, progressIntervalMs = 150, computeSizes = true } = options;
  const matches = [];
  let dirsVisited = 0;
  let lastReport = Date.now();

  function maybeReport(currentPath) {
    dirsVisited += 1;
    const now = Date.now();
    if (onProgress && now - lastReport >= progressIntervalMs) {
      lastReport = now;
      onProgress({ dirsVisited, matchesFound: matches.length, currentPath });
    }
  }

  async function walk(dir) {
    let entries;
    try {
      entries = await opendirWithRetry(dir);
    } catch {
      return; // permission denied / vanished / still locked after retries — skip
    }

    const subDirs = [];
    for await (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;

      const name = entry.name;
      if (lookup.alwaysSkip.has(name)) continue;

      const fullPath = path.join(dir, name);
      maybeReport(fullPath);

      const matchEntries = [
        ...(lookup.exactNames.get(name) ?? []),
        ...lookup.patternRules.filter((r) => matchesAny(name, [r.pattern])),
      ];

      if (matchEntries.length > 0) {
        // Multiple ecosystems can claim the same directory name (e.g. "bin"
        // for both Go and .NET). Try each candidate and take the first one
        // whose sibling requirement (if any) is actually satisfied here.
        let matched = null;
        for (const candidate of matchEntries) {
          if (!candidate.requireSibling) {
            matched = candidate;
            break;
          }
          const siblingOk = await hasSiblingMatch(
            dir,
            candidate.requireSibling,
          );
          if (siblingOk) {
            matched = candidate;
            break;
          }
        }

        if (matched) {
          matches.push({
            path: fullPath,
            name,
            ecosystem: matched.ecosystem,
            label: matched.label,
            risk: matched.risk,
          });
          // Pruned: do not descend into a matched directory.
          continue;
        }

        // None of the candidates' sibling conditions were met — not a
        // build dir here, keep descending in case it holds real content.
        subDirs.push(fullPath);
        continue;
      }

      subDirs.push(fullPath);
    }

    for (const sub of subDirs) {
      await walk(sub);
    }
  }

  await walk(root);

  if (computeSizes) {
    for (const match of matches) {
      match.sizeBytes = await getDirSizeBytes(match.path);
      if (onProgress) {
        onProgress({
          dirsVisited,
          matchesFound: matches.length,
          sizing: match.path,
        });
      }
    }
  }

  return { matches, dirsVisited };
}
