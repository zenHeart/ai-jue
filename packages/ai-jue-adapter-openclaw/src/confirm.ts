import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import type { ArtifactResult, Confirmation, ConfirmContext as CoreConfirmContext } from "ai-jue-core";
import {
  detectArtifactKind,
  isCompatibleBundleLayout,
  type OpenClawArtifactKind,
} from "./capabilities/layout";

export interface ConfirmContext extends CoreConfirmContext {
  artifactKind?: OpenClawArtifactKind;
  /**
   * Isolated OpenClaw profile name (defaults to a per-process unique
   * value so concurrent test runs never collide). The profile state
   * lives at `~/.openclaw-<name>/openclaw.json` per OpenClaw's
   * `--profile` semantics — this is always an isolated dir we control,
   * never the operator's real `~/.openclaw/`.
   */
  profile?: string;
  /** Optional isolated home supplied by a caller; defaults to a temporary directory. */
  verificationHome?: string;
}

const TARGET = "openclaw";
const SAFE_PROFILE = /^[A-Za-z0-9._-]+$/;

function profileName(context: ConfirmContext): string {
  const value = context.profile ?? `jue-302-verify-${process.pid}-${Date.now()}`;
  if (!SAFE_PROFILE.test(value)) {
    throw new Error(`OpenClaw confirmation profile must be a safe name: ${value}`);
  }
  return value;
}

function verificationEnvironment(context: ConfirmContext): {
  root: string;
  owned: boolean;
  env: NodeJS.ProcessEnv;
} {
  const owned = context.verificationHome === undefined;
  const root = owned
    ? fs.mkdtempSync(path.join(os.tmpdir(), "jue-openclaw-confirm-home-"))
    : path.resolve(context.verificationHome!);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new Error(`OpenClaw verification home must be an existing directory: ${root}`);
  }
  const env: NodeJS.ProcessEnv = { ...process.env, HOME: root, USERPROFILE: root };
  delete env.OPENCLAW_CONFIG_PATH;
  return { root, owned, env };
}

function cleanupVerificationHome(root: string, owned: boolean): void {
  if (owned) fs.rmSync(root, { recursive: true, force: true });
}

function bundleMarker(root: string): { format: string; manifest: string } | undefined {
  const candidates = [
    ["claude", path.join(root, ".claude-plugin", "plugin.json")],
    ["codex", path.join(root, ".codex-plugin", "plugin.json")],
    ["cursor", path.join(root, ".cursor-plugin", "plugin.json")],
  ] as const;
  const found = candidates.find(([, marker]) => fs.existsSync(marker));
  if (!found) return undefined;
  return { format: found[0], manifest: found[1] };
}

function validateBundleStructure(root: string): string {
  const marker = bundleMarker(root);
  if (!marker || !isCompatibleBundleLayout(root)) {
    throw new Error(
      "OpenClaw compatible-bundle requires a Claude, Codex, or Cursor plugin marker.",
    );
  }

  const hookRoot = path.join(root, "hooks");
  if (fs.existsSync(hookRoot)) {
    for (const entry of fs.readdirSync(hookRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const hookDir = path.join(hookRoot, entry.name);
      for (const fileName of ["HOOK.md", "handler.js"]) {
        if (!fs.existsSync(path.join(hookDir, fileName))) {
          throw new Error(`OpenClaw hook ${entry.name} is missing ${fileName}.`);
        }
      }
    }
  }
  return `${marker.format} marker ${path.relative(root, marker.manifest).split(path.sep).join("/")}`;
}

function pluginIdFromList(value: unknown, manifestName: string, root: string): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = pluginIdFromList(item, manifestName, root);
      if (found) return found;
    }
    return undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const serialized = JSON.stringify(record);
  const matchesName =
    record.name === manifestName ||
    record.id === manifestName ||
    serialized.includes(root);
  if (matchesName && typeof record.id === "string") return record.id;
  for (const child of Object.values(record)) {
    const found = pluginIdFromList(child, manifestName, root);
    if (found) return found;
  }
  return undefined;
}

async function confirmCompatibleBundle(context: ConfirmContext): Promise<Confirmation> {
  let structure: string;
  try {
    structure = validateBundleStructure(context.artifactRoot);
  } catch (error) {
    return {
      target: TARGET,
      status: "failed",
      evidence: error instanceof Error ? error.message : String(error),
    };
  }

  const marker = bundleMarker(context.artifactRoot)!;
  let manifestName = "";
  try {
    const manifest = JSON.parse(fs.readFileSync(marker.manifest, "utf8")) as { name?: unknown };
    manifestName = typeof manifest.name === "string" ? manifest.name : "";
  } catch {
    return { target: TARGET, status: "failed", evidence: `invalid JSON in ${marker.manifest}` };
  }
  if (!manifestName.trim()) {
    return {
      target: TARGET,
      status: "failed",
      evidence: `bundle manifest ${marker.manifest} must contain a non-empty name`,
    };
  }

  let profile: string;
  try {
    profile = profileName(context);
  } catch (error) {
    return {
      target: TARGET,
      status: "failed",
      evidence: error instanceof Error ? error.message : String(error),
    };
  }
  let verification: ReturnType<typeof verificationEnvironment>;
  try {
    verification = verificationEnvironment(context);
  } catch (error) {
    return {
      target: TARGET,
      status: "failed",
      evidence: error instanceof Error ? error.message : String(error),
    };
  }
  const profileDir = path.join(verification.root, `.openclaw-${profile}`);
  let createdProfile = false;
  try {
    if (fs.existsSync(profileDir)) {
      return {
        target: TARGET,
        status: "failed",
        evidence: `refusing to reuse or remove existing OpenClaw profile ${profileDir}`,
      };
    }
    fs.mkdirSync(profileDir);
    createdProfile = true;
    const installOutput = execFileSync(
      "openclaw",
      ["--profile", profile, "plugins", "install", context.artifactRoot],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: verification.env },
    );
    const listOutput = execFileSync(
      "openclaw",
      ["--profile", profile, "plugins", "list", "--json"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: verification.env },
    );
    let listJson: unknown;
    try {
      listJson = JSON.parse(listOutput);
    } catch {
      return {
        target: TARGET,
        status: "failed",
        evidence: `openclaw plugins list --json returned non-JSON: ${listOutput.slice(0, 500)}`,
      };
    }
    const pluginId = pluginIdFromList(listJson, manifestName, context.artifactRoot) ?? manifestName;
    const inspectOutput = execFileSync(
      "openclaw",
      ["--profile", profile, "plugins", "inspect", pluginId],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: verification.env },
    );
    const evidence = `${installOutput}\n${listOutput}\n${inspectOutput}`;
    if (
      !/["']?format["']?\s*[:=]\s*["']?bundle/i.test(evidence) ||
      !/["']?bundle\s*format["']?\s*[:=]\s*["']?(claude|codex|cursor)/i.test(evidence)
    ) {
      return {
        target: TARGET,
        status: "failed",
        evidence: `OpenClaw installed the bundle but inspect did not report Format: bundle and its bundle format: ${evidence.slice(0, 500)}`,
      };
    }
    return {
      target: TARGET,
      status: "confirmed",
      evidence: `openclaw plugins install → list --json → inspect confirmed Format: bundle (${structure}) in isolated profile`,
    };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
    if (code === "ENOENT") {
      return {
        target: TARGET,
        status: "unconfirmed",
        evidence: `${structure}; OpenClaw CLI is unavailable, so native install/inspect was not run`,
      };
    }
    const stderr = error && typeof error === "object" && "stderr" in error
      ? String((error as { stderr: unknown }).stderr)
      : "";
    return {
      target: TARGET,
      status: "failed",
      evidence: `OpenClaw bundle install/inspect failed: ${stderr.slice(0, 500) || String(error).slice(0, 500)}`,
    };
  } finally {
    if (createdProfile) fs.rmSync(profileDir, { recursive: true, force: true });
    cleanupVerificationHome(verification.root, verification.owned);
  }
}

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
  if ((context.artifactKind ?? detectArtifactKind(context.artifactRoot)) === "compatible-bundle") {
    return confirmCompatibleBundle(context);
  }

  const fixtureConfig = path.join(context.artifactRoot, "openclaw.json");
  if (!fs.existsSync(fixtureConfig)) {
    return {
      target: TARGET,
      status: "unconfirmed",
      evidence: "no openclaw.json in fixture root (workspace has no MCP to confirm)",
    };
  }

  let profile: string;
  try {
    profile = profileName(context);
  } catch (error) {
    return {
      target: TARGET,
      status: "failed",
      evidence: error instanceof Error ? error.message : String(error),
    };
  }
  let verification: ReturnType<typeof verificationEnvironment>;
  try {
    verification = verificationEnvironment(context);
  } catch (error) {
    return {
      target: TARGET,
      status: "failed",
      evidence: error instanceof Error ? error.message : String(error),
    };
  }
  const profileDir = path.join(verification.root, `.openclaw-${profile}`);
  let createdProfile = false;
  const profileConfig = path.join(profileDir, "openclaw.json");

  let out: string;
  let exitStatus: number | null = 0;
  try {
    if (fs.existsSync(profileDir)) {
      return {
        target: TARGET,
        status: "failed",
        evidence: `refusing to reuse or remove existing OpenClaw profile ${profileDir}`,
      };
    }
    fs.mkdirSync(profileDir);
    createdProfile = true;
    fs.copyFileSync(fixtureConfig, profileConfig);
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
        env: verification.env,
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
    if (createdProfile) {
      try {
        fs.rmSync(profileDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
    cleanupVerificationHome(verification.root, verification.owned);
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
