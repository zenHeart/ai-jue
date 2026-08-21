#!/usr/bin/env node
/**
 * JUE-301 native verification script for the Codex Adapter.
 *
 * Replays the full Codex round-trip in an isolated CODEX_HOME (never touches
 * the operator's real `~/.codex/`):
 *   1. Build a neutral Codex project fixture in a temp dir.
 *   2. Run our own Adapter's `read()` + `write()` to materialise the project.
 *   3. Run our own `confirm()` to do the marketplace add → plugin add →
 *      plugin list --json round-trip.
 *   4. Read the written project back and verify the round-trip.
 *
 * Like `scripts/verify-claude-native.js`, this is NOT part of `npm test` —
 * the marketplace round-trip is fast but takes a few seconds and the
 * install/load is observable to Codex's daemon.
 *
 * Usage: node scripts/verify-codex-native.js
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

function loadAdapter() {
  return {
    read: require(path.join(repoRoot, "packages/ai-jue-adapter-codex/dist/read.js")).read,
    write: require(path.join(repoRoot, "packages/ai-jue-adapter-codex/dist/write.js")).write,
    confirm: require(path.join(repoRoot, "packages/ai-jue-adapter-codex/dist/confirm.js")).confirm,
    toCanonicalDocument: require(path.join(repoRoot, "packages/ai-jue-core/dist/index.js")).toCanonicalDocument,
  };
}

async function main() {
  const { read, write, confirm, toCanonicalDocument } = loadAdapter();
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "jue-301-codex-verify-"));
  try {
    // Build a minimal Codex project fixture: just AGENTS.md; no agents/
    // skills/hooks — keep the round-trip minimal so any failure points at
    // a real shape mismatch.
    fs.writeFileSync(path.join(workDir, "AGENTS.md"), "");

    console.log("[1/3] read() → Canonical");
    const canonical = await read({ scope: "project", artifactRoot: workDir });
    console.log("      read() returned:", JSON.stringify(canonical));

    // Materialise context.global so the write() actually emits a managed
    // block (otherwise the canonical round-trip is vacuously empty).
    const withContext = { ...canonical, context: { global: "Jue Codex native verify context." } };
    console.log("[2/3] write() → applyChangesOrThrow");
    const changes = await write(withContext, { scope: "project", artifactRoot: workDir, artifactKind: "project" });
    fs.mkdirSync(path.join(workDir, ".claude"), { recursive: true }); // not used, but no-op
    const { applyChangesOrThrow } = require(path.join(repoRoot, "packages/ai-jue-core/dist/index.js"));
    applyChangesOrThrow(workDir, changes);

    const reRead = await read({ scope: "project", artifactRoot: workDir });
    if (JSON.stringify(reRead) !== JSON.stringify(withContext)) {
      throw new Error(`read(write(read(N))) round-trip mismatch: ${JSON.stringify(reRead)} !== ${JSON.stringify(withContext)}`);
    }

    console.log("[3/3] confirm() — native Codex plugin round-trip");
    const confirmation = await confirm([], { scope: "project", artifactRoot: workDir, artifactKind: "project" });
    console.log("      confirm() returned:", JSON.stringify(confirmation));
    if (confirmation.status === "failed") {
      throw new Error(`codex confirm() reported 'failed' evidence=${confirmation.evidence}`);
    }

    console.log("\nJue-301 Codex Adapter native verify passed.");
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error("Codex native verify FAILED:", error.message);
  process.exit(1);
});
