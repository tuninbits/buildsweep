/**
 * Minimal glob matcher for the small vocabulary our rules need:
 * exact names ("node_modules"), a leading wildcard ("*.egg-info"),
 * or a trailing wildcard ("cache-*"). Deliberately not a full glob
 * implementation — the rule files only ever need this much, and a
 * tiny matcher is easy to audit.
 */
export function matchesPattern(name, pattern) {
  if (!pattern.includes("*")) return name === pattern;

  const starIndex = pattern.indexOf("*");
  const prefix = pattern.slice(0, starIndex);
  const suffix = pattern.slice(starIndex + 1);

  if (suffix.includes("*")) {
    throw new Error(`Unsupported glob pattern (only one '*' is allowed): ${pattern}`);
  }

  return name.startsWith(prefix) && name.endsWith(suffix) && name.length >= prefix.length + suffix.length;
}

/**
 * True if `name` matches any pattern in `patterns`.
 */
export function matchesAny(name, patterns) {
  return patterns.some((pattern) => matchesPattern(name, pattern));
}
