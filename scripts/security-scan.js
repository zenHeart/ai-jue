#!/usr/bin/env node
/**
 * Pre-commit security gate: blocks a commit that contains literal secrets,
 * private-network addresses, or locally-declared sensitive identifiers, and
 * runs `npm audit` when a manifest/lockfile is part of the commit.
 *
 * Reads staged blob content (`git show :<path>`), not the working-tree file,
 * so it checks exactly what would be committed.
 */
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();

// Some adapters ship deliberately fake-looking secrets as negative-test
// fixtures (proving `assertNoLiteralCredentials`-style rejection works). A
// line carrying one of these well-known "this is not real" markers is
// exempted from every rule below — real leaks don't self-label this way.
const SYNTHETIC_MARKER = /not.a.real|literal[-_]value|literal[-_]example|example\.(com|org|net)|dummy|changeme|placeholder/i;

const SECRET_RULES = [
  { name: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: "Slack token", pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: "Private key block", pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { name: "Credential embedded in URL", pattern: /:\/\/[^/\s:@"']+:[^/\s:@"']+@/ },
  {
    name: "Literal token/secret/password assignment",
    pattern:
      /(["']?(?:[A-Z0-9_]*_)?(?:API_?KEY|TOKEN|SECRET|PASSWORD)["']?\s*[:=]\s*)["']([^"'\s]{8,})["']/,
    isPlaceholder: (value) =>
      /^\$\{[A-Za-z_][A-Za-z0-9_.]*\}$/.test(value) ||
      /^<?(REDACTED|redacted|placeholder|xxx+|\*+)>?$/i.test(value) ||
      value === "",
  },
  {
    name: "Private/internal IPv4 address",
    pattern: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/,
  },
];

function loadLocalBlocklist() {
  const blocklistPath = path.join(REPO_ROOT, ".security", "blocklist.local.txt");
  if (!fs.existsSync(blocklistPath)) return [];
  return fs
    .readFileSync(blocklistPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function getStagedFiles() {
  const output = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACM"], {
    encoding: "utf8",
  });
  return output.split("\n").filter(Boolean);
}

function readStagedContent(filePath) {
  try {
    return execFileSync("git", ["show", `:${filePath}`], { encoding: "utf8" });
  } catch {
    return null; // binary or unreadable as utf8 — skip rather than crash the hook
  }
}

function scanFile(filePath, content, blocklistTerms) {
  const findings = [];
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    if (SYNTHETIC_MARKER.test(line)) return;
    for (const rule of SECRET_RULES) {
      const match = line.match(rule.pattern);
      if (!match) continue;
      if (rule.isPlaceholder && rule.isPlaceholder(match[2] ?? "")) continue;
      findings.push({ file: filePath, line: index + 1, rule: rule.name, snippet: line.trim().slice(0, 120) });
    }
    for (const term of blocklistTerms) {
      if (line.toLowerCase().includes(term.toLowerCase())) {
        findings.push({
          file: filePath,
          line: index + 1,
          rule: `Blocklisted identifier "${term}"`,
          snippet: line.trim().slice(0, 120),
        });
      }
    }
  });
  return findings;
}

function runNpmAuditIfNeeded(stagedFiles) {
  const manifestChanged = stagedFiles.some((f) => f.endsWith("package.json") || f.endsWith("package-lock.json"));
  if (!manifestChanged) return true;

  // devDependencies (e.g. vitepress's transitive esbuild) often carry
  // moderate/high advisories with no upstream fix yet; blocking every commit
  // on those would make the gate impossible to satisfy. Production
  // dependencies are what ships to users, so only those are hard-blocking —
  // dev-only findings are surfaced as a warning instead.
  try {
    execFileSync("npm", ["audit", "--omit=dev", "--audit-level=high"], { cwd: REPO_ROOT, stdio: "inherit" });
  } catch {
    console.error(
      '\n[security-scan] "npm audit --omit=dev --audit-level=high" found high/critical vulnerabilities in a ' +
        "production dependency you are committing. Fix or explicitly accept them before committing.\n",
    );
    return false;
  }

  try {
    execFileSync("npm", ["audit", "--audit-level=high"], { cwd: REPO_ROOT, stdio: "inherit" });
  } catch {
    console.warn(
      "\n[security-scan] warning: npm audit found high/critical advisories in devDependencies. " +
        "Not blocking this commit, but consider addressing them.\n",
    );
  }
  return true;
}

function main() {
  const stagedFiles = getStagedFiles();
  const blocklistTerms = loadLocalBlocklist();

  const allFindings = [];
  for (const filePath of stagedFiles) {
    const content = readStagedContent(filePath);
    if (content === null) continue;
    allFindings.push(...scanFile(filePath, content, blocklistTerms));
  }

  if (allFindings.length > 0) {
    console.error("\n[security-scan] Blocked commit — possible secret or private-network/identifier leak:\n");
    for (const f of allFindings) {
      console.error(`  ${f.file}:${f.line}  [${f.rule}]\n    ${f.snippet}`);
    }
    console.error(
      "\nRedact the value, or if this is a verified false positive, adjust scripts/security-scan.js's " +
        "rules rather than bypassing the hook.\n",
    );
    process.exit(1);
  }

  if (!runNpmAuditIfNeeded(stagedFiles)) {
    process.exit(1);
  }
}

main();
