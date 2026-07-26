import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import type { ArtifactResult, Confirmation } from "ai-jue-core";

export interface ConfirmContext {
  projectRoot: string;
  /**
   * Isolated OpenClaw profile name (defaults to a per-process unique
   * value so concurrent test runs never collide). The profile state
   * lives at `~/.openclaw-<name>/openclaw.json` per OpenClaw's
   * `--profile` semantics — this is always an isolated dir we control,
   * never the operator's real `~/.openclaw/`.
   */
  profile?: string;
}

const TARGET = "openclaw";

/**
 * OpenClaw 2026.5.5's strongest native confirmation without starting
 * the gateway is `openclaw config validate --json`. With `--profile
 * <name>`, openclaw reads its config from `~/.openclaw-<name>/openclaw.json`
 * (NOT from `OPENCLAW_CONFIG_PATH` — that env var is silently ignored
 * when `--profile` is given, which we just confirmed empirically). So we
 * copy the fixture's `openclaw.json` into the profile dir before invoking
 * the validator, and clean up afterwards. The operator's real
 * `~/.openclaw/openclaw.json` is never touched.
 */
export async function confirm(
  _results: ArtifactResult[],
  context: ConfirmContext,
): Promise<Confirmation> {
  const fixtureConfig = path.join(context.projectRoot, "openclaw.json");
  if (!fs.existsSync(fixtureConfig)) {
    return {
      target: TARGET,
      status: "unconfirmed",
      evidence: "no openclaw.json in fixture root (workspace has no MCP to confirm)",
    };
  }

  const profile = context.profile ?? `jue-302-verify-${process.pid}-${Date.now()}`;
  const profileDir = path.join(os.homedir(), `.openclaw-${profile}`);
  fs.mkdirSync(profileDir, { recursive: true });
  const profileConfig = path.join(profileDir, "openclaw.json");
  fs.copyFileSync(fixtureConfig, profileConfig);

  let out: string;
  let exitStatus: number | null = 0;
  try {
    // `openclaw config validate --json` requires stdin to be a closed
    // pipe (not a TTY and not EOF) for the JSON result to be emitted;
    // when stdin is a TTY (e.g. in an interactive shell), openclaw stays
    // silent. Confirmed empirically against openclaw 2026.5.5.
    out = execFileSync(
      "openclaw",
      ["--profile", profile, "config", "validate", "--json"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  } catch (error) {
    exitStatus = (error as { status?: number | null }).status ?? null;
    out = ((error as { stdout?: string | Buffer }).stdout?.toString() ?? "");
    const stderr =
      error && typeof error === "object" && "stderr" in error
        ? String((error as { stderr: unknown }).stderr)
        : "";
    const message = error instanceof Error ? error.message : String(error);
    return {
      target: TARGET,
      status: "failed",
      evidence: `exit=${exitStatus} message=${message.slice(0, 200)} stdout=${out.slice(0, 300)} stderr=${stderr.slice(0, 300)}`,
    };
  } finally {
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  let parsed: { valid?: boolean; issues?: unknown };
  try {
    parsed = JSON.parse(out) as { valid?: boolean; issues?: unknown };
  } catch {
    return {
      target: TARGET,
      status: "failed",
      evidence: `openclaw config validate --json returned non-JSON: stdout=${out.slice(0, 500)}`,
    };
  }
  if (parsed.valid === true) {
    return {
      target: TARGET,
      status: "confirmed",
      evidence: `openclaw --profile ${profile} config validate --json reported valid=true against ${profileConfig}`,
    };
  }
  return {
    target: TARGET,
      status: "failed",
      evidence: `openclaw config validate --json reported valid=false: ${JSON.stringify(parsed.issues ?? parsed).slice(0, 500)}`,
  };
}
