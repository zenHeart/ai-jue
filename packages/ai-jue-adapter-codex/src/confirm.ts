import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import type { ArtifactResult, Confirmation, ConfirmContext as CoreConfirmContext } from "ai-jue-core";

export interface ConfirmContext extends CoreConfirmContext {
  artifactKind?: "project" | "plugin";
}

const TARGET = "codex";

/**
 * Codex 0.145.0 has no `codex plugin validate` subcommand (verified —
 * `codex plugin --help` shows only `add`/`list`/`marketplace`/`remove`).
 * For Plugin Artifacts we therefore use the real round-trip
 * `codex plugin marketplace add <local>` + `codex plugin add <name>` and
 * assert the Plugin appears in `codex plugin list --json` with
 * `installed: true, enabled: true` — the strongest native confirmation
 * Codex currently offers. For project scope there is no equivalent
 * validator (no validate command, no headless inventory command for the
 * in-tree project config), so we honestly report `unconfirmed`, matching
 * the same precedent Claude's Adapter follows for its own project scope
 * (JUE-203).
 */
export async function confirm(
  _results: ArtifactResult[],
  context: ConfirmContext,
): Promise<Confirmation> {
  if ((context.artifactKind ?? "project") !== "plugin") {
    return { target: TARGET, status: "unconfirmed" };
  }

  if (!fs.existsSync(path.join(context.artifactRoot, ".codex-plugin", "plugin.json"))) {
    return { target: TARGET, status: "failed", evidence: "no .codex-plugin/plugin.json in fixture root" };
  }

  // Build a throwaway marketplace whose only entry points at the generated
  // Plugin directory, install both into an isolated CODEX_HOME, and assert
  // the install shows up in `codex plugin list --json`. This is the closest
  // thing Codex 0.145.0 has to `claude plugin validate --strict`, and it
  // also exercises the marketplace-add path that is Codex's real
  // install/load mechanism — i.e. not just an in-process test of our
  // outputs, but a real round-trip through codex's own install pipeline.
  const scratchHome = fs.mkdtempSync(path.join(os.tmpdir(), "jue-301-confirm-"));
  try {
    const marketplaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jue-301-mkt-"));
    fs.mkdirSync(path.join(marketplaceRoot, ".agents", "plugins"), { recursive: true });
    fs.writeFileSync(
      path.join(marketplaceRoot, ".agents", "plugins", "marketplace.json"),
      JSON.stringify({
        name: "jue-301-confirm",
        interface: { displayName: "JUE-301 confirm" },
        plugins: [
          {
            name: "jue-301-confirm",
            description: "JUE-301 native confirmation probe",
            version: "0.1.0",
            source: { source: "local", path: "." },
            policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
          },
        ],
      }),
    );

    const env = { ...process.env, CODEX_HOME: scratchHome };
    execFileSync("codex", ["plugin", "marketplace", "add", marketplaceRoot], {
      env,
      stdio: "pipe",
    });
    execFileSync(
      "codex",
      ["plugin", "add", "jue-301-confirm", "--marketplace", "jue-301-confirm"],
      { env, stdio: "pipe" },
    );
    const out = execFileSync("codex", ["plugin", "list", "--json"], {
      env,
      stdio: ["pipe", "pipe", "ignore"],
    }).toString();
    const parsed = JSON.parse(out) as {
      installed: Array<{ name: string; installed: boolean; enabled: boolean; version: string }>;
    };
    const found = parsed.installed.find((p) => p.name === "jue-301-confirm");
    if (!found) {
      return { target: TARGET, status: "failed", evidence: `codex plugin list did not include the freshly installed Plugin: ${out}` };
    }
    if (!found.installed || !found.enabled) {
      return { target: TARGET, status: "failed", evidence: `installed=${found.installed} enabled=${found.enabled}` };
    }
    return {
      target: TARGET,
      status: "confirmed",
      evidence: `codex ${found.version} installed+enabled via isolated CODEX_HOME marketplace add → plugin add → plugin list --json`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { target: TARGET, status: "failed", evidence: message.slice(0, 500) };
  } finally {
    fs.rmSync(scratchHome, { recursive: true, force: true });
  }
}
