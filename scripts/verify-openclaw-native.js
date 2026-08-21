#!/usr/bin/env node
/**
 * JUE-302 native verification script for the OpenClaw Adapter.
 *
 * Replays the full OpenClaw round-trip in an isolated `--profile` state
 * dir (never touches the operator's real `~/.openclaw/`), then runs
 * the real `openclaw --profile X config validate --json` against the
 * freshly-written `openclaw.json` to confirm the config is valid.
 *
 * Like `scripts/verify-claude-native.js` and `scripts/verify-codex-native.js`,
 * this is NOT part of `npm test` — `confirm()` in the contract suite
 * observed a real quirk where `openclaw config validate --json` produces
 * empty stdout when called via `spawnSync`/`execFileSync` (the vitest
 * worker uses these), even though the same command produces correct
 * JSON output from a normal shell. This script runs in a normal shell
 * context where the real round-trip succeeds.
 *
 * Usage: node scripts/verify-openclaw-native.js
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");

function loadAdapter() {
  return {
    read: require(path.join(repoRoot, "packages/ai-jue-adapter-openclaw/dist/read.js")).read,
    write: require(path.join(repoRoot, "packages/ai-jue-adapter-openclaw/dist/write.js")).write,
    confirm: require(path.join(repoRoot, "packages/ai-jue-adapter-openclaw/dist/confirm.js")).confirm,
    toCanonicalDocument: require(path.join(repoRoot, "packages/ai-jue-core/dist/index.js")).toCanonicalDocument,
    applyChangesOrThrow: require(path.join(repoRoot, "packages/ai-jue-core/dist/index.js")).applyChangesOrThrow,
  };
}

async function main() {
  const { read, write, confirm, toCanonicalDocument, applyChangesOrThrow } = loadAdapter();
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "jue-302-verify-"));
  try {
    // Build a minimal OpenClaw workspace fixture: just AGENTS.md (the
    // document OpenClaw actually reads from per its docs). The
    // openclaw.json lives at the workspace root (where OpenClaw's
    // config file is for the real global config; here we treat the
    // workspace-root copy as the stand-in for the global file).
    fs.writeFileSync(path.join(workDir, "AGENTS.md"), "");
    fs.writeFileSync(
      path.join(workDir, "openclaw.json"),
      JSON.stringify({
        commands: { native: "auto", nativeSkills: "auto", restart: true, ownerDisplay: "raw" },
      }, null, 2),
    );

    console.log("[1/3] read() -> Canonical");
    const canonical = await read({ scope: "project", artifactRoot: workDir });
    console.log("      read() returned:", JSON.stringify(canonical));

    const withContext = { ...canonical, context: { global: "Jue OpenClaw native verify context." } };
    console.log("[2/3] write() -> applyChangesOrThrow");
    const changes = await write(withContext, { scope: "project", artifactRoot: workDir });
    applyChangesOrThrow(workDir, changes);

    const reRead = await read({ scope: "project", artifactRoot: workDir });
    if (JSON.stringify(reRead) !== JSON.stringify(withContext)) {
      throw new Error(
        "read(write(read(N))) round-trip mismatch: " +
          JSON.stringify(reRead) +
          " !== " +
          JSON.stringify(withContext),
      );
    }

    console.log("[3/3] confirm() -> real 'openclaw --profile ... config validate --json'");
    const confirmation = await confirm([], { scope: "project", artifactRoot: workDir });
    console.log("      confirm() returned:", JSON.stringify(confirmation));
    if (confirmation.status === "failed") {
      throw new Error(
        "openclaw config validate --json reported 'failed' evidence=" +
          confirmation.evidence,
      );
    }

    console.log("\nJue-302 OpenClaw Adapter native verify passed.");
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error("OpenClaw native verify FAILED:", error.message);
  process.exit(1);
});
