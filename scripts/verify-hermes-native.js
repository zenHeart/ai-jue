#!/usr/bin/env node
/**
 * JUE-303 native verification script for the Hermes Adapter.
 *
 * Replays the full Hermes round-trip against the real `tirith` binary
 * (D:\devuser\.hermes\bin\tirith, 9.8MB on the user's cwr machine; on
 * this local machine it must be on PATH or a manual symlink). Stages the
 * fixture workspace at a fresh temp HOME so we don't touch the
 * operator's real Hermes state.
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
    const canonical = await read({ projectRoot: workDir });
    console.log("      read() returned:", JSON.stringify(canonical, null, 2).slice(0, 600));

    const withContext = { ...canonical, context: { global: "Jue Hermes native verify context." } };
    console.log("[2/3] write() -> applyChangesOrThrow");
    const changes = await write(withContext, { projectRoot: workDir });
    applyChangesOrThrow(workDir, changes);

    const reRead = await read({ projectRoot: workDir });
    if (JSON.stringify(reRead) !== JSON.stringify(withContext)) {
      throw new Error("read(write(read(N))) round-trip mismatch");
    }

    console.log("[3/3] confirm() -> real 'tirith config validate'");
    const confirmation = await confirm([], { projectRoot: workDir });
    console.log("      confirm() returned:", JSON.stringify(confirmation));
    if (confirmation.status === "failed") {
      throw new Error("tirith config validate reported 'failed' evidence=" + confirmation.evidence);
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
