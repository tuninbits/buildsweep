import path from "node:path";
import readline from "node:readline";
import { rm } from "node:fs/promises";
import { loadDefaultRules, loadUserRules, mergeRules, buildLookup } from "./rules.js";
import { scanForMatches } from "./scan.js";
import { formatBytes, color } from "./format.js";

const HELP = `
${color.bold("buildsweep")} — find and delete build artifacts, caches, and dependency
folders (node_modules, target, __pycache__, bin/obj, and more) in one fast pass.

${color.bold("Usage")}
  buildsweep [directory] [options]

${color.bold("Options")}
  --dry-run           Scan and report only, delete nothing (default: prompts before deleting)
  --yes, -y            Skip the confirmation prompt and delete immediately
  --only <ecosystems>  Comma-separated list of ecosystems to scan for (e.g. "rust,python")
  --exclude <list>     Comma-separated list of ecosystems to skip
  --risky              Also include ambiguous/risky patterns (tmp, vendor, .vercel)
  --rules <path>       Path to a JSON file with additional/override rules
  --no-size            Skip computing directory sizes (faster on huge trees)
  --json               Print machine-readable JSON instead of the interactive report
  -h, --help            Show this help text

${color.bold("Ecosystems")}
  javascript, rust, python, java, dotnet, go, ruby, misc (risky)

${color.bold("Examples")}
  buildsweep                       Scan and clean the current directory
  buildsweep ~/code --dry-run      See what would be deleted, change nothing
  buildsweep . --only rust,python  Only look for Rust and Python artifacts
`;

function parseArgs(argv) {
  const args = { root: ".", dryRun: false, yes: false, only: null, exclude: null, risky: false, rules: null, computeSizes: true, json: false, help: false };
  const rest = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--yes":
      case "-y":
        args.yes = true;
        break;
      case "--risky":
        args.risky = true;
        break;
      case "--no-size":
        args.computeSizes = false;
        break;
      case "--json":
        args.json = true;
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
      case "--only":
        args.only = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "--exclude":
        args.exclude = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "--rules":
        args.rules = argv[++i];
        break;
      default:
        if (arg.startsWith("-")) {
          throw new Error(`Unknown option: ${arg}`);
        }
        rest.push(arg);
    }
  }

  if (rest.length > 0) args.root = rest[0];
  return args;
}

function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${color.yellow("?")} ${question} `, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

function renderProgress(update) {
  if (!process.stdout.isTTY) return;
  const line = update.sizing
    ? `  ${color.dim("sizing")} ${update.sizing.replace(process.cwd() + path.sep, "")}`
    : `  ${color.dim(`scanned ${update.dirsVisited} directories, ${update.matchesFound} matches so far...`)} ${update.currentPath ?? ""}`;
  process.stdout.write(`\r\u001b[K${line.slice(0, process.stdout.columns ?? 120)}`);
}

function clearProgressLine() {
  if (process.stdout.isTTY) process.stdout.write("\r\u001b[K");
}

export async function run(argv) {
  const args = parseArgs(argv);

  if (args.help) {
    console.log(HELP);
    return 0;
  }

  const root = path.resolve(args.root);
  const defaultRules = await loadDefaultRules();
  const userRules = args.rules ? await loadUserRules(path.resolve(args.rules)) : await loadUserRules(path.join(root, ".buildsweeprc.json"));
  const rules = mergeRules(defaultRules, userRules);
  const lookup = buildLookup(rules, { includeRisky: args.risky, only: args.only, exclude: args.exclude });

  if (!args.json) {
    console.log(`${color.bold(color.cyan("buildsweep"))} — scanning ${color.bold(root)}`);
  }

  const { matches, dirsVisited } = await scanForMatches(root, lookup, {
    onProgress: args.json ? null : renderProgress,
    computeSizes: args.computeSizes,
  });
  clearProgressLine();

  matches.sort((a, b) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0));
  const totalBytes = matches.reduce((sum, m) => sum + (m.sizeBytes ?? 0), 0);

  if (args.json) {
    console.log(JSON.stringify({ root, dirsVisited, totalBytes, matches }, null, 2));
    return 0;
  }

  if (matches.length === 0) {
    console.log(color.green(`Nothing to clean. Scanned ${dirsVisited} directories.`));
    return 0;
  }

  console.log(`\n${color.bold("Found " + matches.length + " match(es)")} across ${dirsVisited} directories scanned:\n`);
  for (const match of matches) {
    const relative = path.relative(root, match.path) || match.path;
    const size = args.computeSizes ? color.dim(` (${formatBytes(match.sizeBytes ?? 0)})`) : "";
    const tag = match.risk === "risky" ? color.yellow(" [risky]") : "";
    console.log(`  ${color.red("-")} ${relative}${size} ${color.dim(`[${match.label}]`)}${tag}`);
  }

  if (args.computeSizes) {
    console.log(`\n${color.bold("Total reclaimable:")} ${color.bold(formatBytes(totalBytes))}`);
  }

  if (args.dryRun) {
    console.log(color.yellow("\nDry run — nothing was deleted."));
    return 0;
  }

  let proceed = args.yes;
  if (!proceed) {
    proceed = await confirm(`\nDelete all ${matches.length} directories listed above?`);
  }

  if (!proceed) {
    console.log(color.yellow("Aborted. Nothing was deleted."));
    return 0;
  }

  let deleted = 0;
  let failed = 0;
  for (const match of matches) {
    try {
      await rm(match.path, { recursive: true, force: true });
      const relative = path.relative(root, match.path) || match.path;
      console.log(`  ${color.green("✓")} deleted ${relative}`);
      deleted += 1;
    } catch (err) {
      console.log(`  ${color.red("✗")} failed to delete ${match.path}: ${err.message}`);
      failed += 1;
    }
  }

  console.log(`\n${color.green(color.bold("Done."))} Deleted ${deleted}${failed ? `, failed ${failed}` : ""}. Freed ~${formatBytes(totalBytes)}.`);
  return failed > 0 ? 1 : 0;
}
