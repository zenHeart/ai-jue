#!/usr/bin/env node
/**
 * JUE-303 native verification script for the Hermes Adapter.
 *
 * Replays the Hermes round-trip against `tirith` on PATH. Stages the
 * fixture workspace at a fresh temp HOME so the operator's real Hermes
 * state is not touched. Live SSH Agent consumption is out of band and
 * not committed.
 *
 * Not part of `npm test`: per JUE-302's empirical quirk, calling
 * `tirith config validate` via `execFileSync` from inside the vitest
 * worker process produces empty stdout (works fine from a normal shell).
 * This script runs in a normal shell context where the round-trip
 * succeeds.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

function loadAdapter() {
  return {
    read: require(path.join(repoRoot, "packages/ai-jue-adapter-hermes/dist/read.js")).read,
    write: require(path.join(repoRoot, "packages/ai-jue-adapter-hermes/dist/write.js")).write,
    confirm: require(path.join(repoRoot, "packages/ai-jue-adapter-hermes/dist/confirm.js")).confirm,
    toCanonicalDocument: require(path.join(repoRoot, "packages/ai-jue-core/dist/index.js")).toCanonicalDocument,
    applyChangesOrThrow: require(path.join(repoRoot, "packages/ai-jue-core/dist/index.js")).applyChangesOrThrow,
  };
}

async function main() {
  const { read, write, confirm, toCanonicalDocument, applyChangesOrThrow } = loadAdapter();
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "jue-303-verify-"));
  try {
    // Start from the real fixture (already redacted: env values are
    // ${...} placeholders, no real secrets).
    const src = path.join(repoRoot, "packages/ai-jue-adapter-hermes/fixtures/project");
    fs.cpSync(src, workDir, { recursive: true });

    console.log("[1/3] read() -> Canonical");
    const canonical = await read({ scope: "project", artifactRoot: workDir });
    console.log("      read() returned:", JSON.stringify(canonical, null, 2).slice(0, 600));

    const withContext = { ...canonical, context: { global: "Jue Hermes native verify context." } };
    console.log("[2/3] write() -> applyChangesOrThrow");
    const changes = await write(withContext, { scope: "project", artifactRoot: workDir });
    applyChangesOrThrow(workDir, changes);

    const reRead = await read({ scope: "project", artifactRoot: workDir });
    if (JSON.stringify(reRead) !== JSON.stringify(withContext)) {
      throw new Error("read(write(read(N))) round-trip mismatch");
    }

    console.log("[3/3] confirm() -> real 'tirith config validate'");
    const confirmation = await confirm([], { scope: "project", artifactRoot: workDir });
    console.log("      confirm() returned:", JSON.stringify(confirmation));
    if (confirmation.status !== "confirmed") {
      throw new Error("Hermes native confirmation did not return confirmed");
    }

    console.log("\nJue-303 Hermes Adapter native verify passed.");
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error("Hermes native verify FAILED:", error.message);
  process.exit(1);
});
