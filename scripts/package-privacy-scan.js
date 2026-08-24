#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const PACKAGES_ROOT = path.join(REPO_ROOT, "packages");

const PRIVACY_RULES = [
  ["AWS access key", /AKIA[0-9A-Z]{16}/],
  ["GitHub token", /(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}/],
  ["GitLab token", /glpat-[A-Za-z0-9_-]{10,}/],
  ["Slack token", /xox[baprs]-[A-Za-z0-9-]{10,}/],
  ["Private key block", /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/],
  ["Credential embedded in URL", /:\/\/[^/\s:@"']+:[^/\s:@"']+@/],
  [
    "Literal credential assignment",
    /(?:API_?KEY|TOKEN|SECRET|PASSWORD)["']?\s*[:=]\s*["'][^"'\s]{8,}["']/i,
  ],
  [
    "Private/internal IPv4 address",
    /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/,
  ],
  ["macOS home path", /\/Users\/[A-Za-z0-9._-]+/],
  ["Linux home path", /\/home\/[A-Za-z0-9._-]+/],
  ["Windows user profile", /[A-Za-z]:\\Users\\[^\\\s]+/],
  ["Email address", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
];

function scanText(content) {
  const findings = [];
  content.split("\n").forEach((line, index) => {
    for (const [rule, pattern] of PRIVACY_RULES) {
      if (pattern.test(line)) findings.push({ line: index + 1, rule });
    }
  });
  return findings;
}

function loadPackageMap() {
  const packages = new Map();
  for (const entry of fs.readdirSync(PACKAGES_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const packageJsonPath = path.join(PACKAGES_ROOT, entry.name, "package.json");
    if (!fs.existsSync(packageJsonPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packages.set(manifest.name, { dir: entry.name, manifest });
  }
  return packages;
}

function parseReleaseItems(content) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .map((value) => {
      const separator = value.lastIndexOf("@v");
      if (separator <= 0) return null;
      return { name: value.slice(0, separator), version: value.slice(separator + 2) };
    })
    .filter(Boolean);
}

function dryRunPack(packageDir) {
  const output = execFileSync(
    "npm",
    ["pack", "--dry-run", "--ignore-scripts", "--json"],
    { cwd: packageDir, encoding: "utf8" },
  );
  const parsed = JSON.parse(output);
  if (!Array.isArray(parsed) || parsed.length !== 1) {
    throw new Error(`npm pack returned an invalid manifest for ${packageDir}`);
  }
  return parsed[0];
}

function scanPackage(packageDir, packManifest) {
  const findings = [];
  for (const entry of packManifest.files) {
    const absolutePath = path.join(packageDir, entry.path);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) continue;
    const bytes = fs.readFileSync(absolutePath);
    if (bytes.includes(0)) continue;
    for (const finding of scanText(bytes.toString("utf8"))) {
      findings.push({ file: entry.path, ...finding });
    }
  }
  return findings;
}

function main() {
  const releaseNotePath = path.join(REPO_ROOT, "release-note.md");
  const items = parseReleaseItems(fs.readFileSync(releaseNotePath, "utf8"));
  if (items.length === 0) throw new Error("release-note.md contains no publish items");

  const packages = loadPackageMap();
  const findings = [];
  for (const item of items) {
    const found = packages.get(item.name);
    if (!found) throw new Error(`release package not found: ${item.name}`);
    if (found.manifest.version !== item.version) {
      throw new Error(
        `release version mismatch for ${item.name}: note=${item.version}, package=${found.manifest.version}`,
      );
    }
    const packageDir = path.join(PACKAGES_ROOT, found.dir);
    const packManifest = dryRunPack(packageDir);
    for (const finding of scanPackage(packageDir, packManifest)) {
      findings.push({ package: item.name, ...finding });
    }
  }

  if (findings.length > 0) {
    process.stderr.write("Release package privacy scan failed:\n");
    for (const finding of findings) {
      process.stderr.write(
        `  ${finding.package}/${finding.file}:${finding.line} [${finding.rule}]\n`,
      );
    }
    process.exit(1);
  }

  process.stdout.write(`Release package privacy scan passed (${items.length} packages).\n`);
}

if (require.main === module) main();

module.exports = { parseReleaseItems, scanPackage, scanText };
