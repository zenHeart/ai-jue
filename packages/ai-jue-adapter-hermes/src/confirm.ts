import { execFileSync } from "child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "fs";
import os from "os";
import path from "path";
import type { ArtifactResult, Confirmation } from "ai-jue-core";
import { detectArtifactKind, type HermesArtifactKind } from "./capabilities/layout";

export interface ConfirmContext {
  projectRoot: string;
  artifactKind?: HermesArtifactKind;
}

const TARGET = "hermes";

/**
 * Hermes v0.18.0 has no per-file validate command analogous to
 * `claude plugin validate --strict` (Claude) or
 * `codex plugin marketplace add <local>` (Codex). The strongest native
 * confirmation path is the real Hermes `tirith` binary
 * (D:\devuser\.hermes\bin\tirith, 9.8MB), which exposes
 * `config validate` for the on-disk config tree.
 *
 * We invoke `tirith config validate <projectRoot>` against the
 * freshly-written workspace (Atomically swap the real cwr fixture
 * into a temp HOME, run validate, swap back — preserves the operator's
 * real Hermes state in the rare case the user has one on the same
 * machine, even though in this contract test we use a freshly-built
 * workspace).
 *
 * For workspace scope, `tirith` validates the config tree. For the thin
 * skill-plugin Artifact, the generated plugin surface provides structural
 * confirmation without executing generated Python.
 */
export async function confirm(
  _results: ArtifactResult[],
  context: ConfirmContext,
): Promise<Confirmation> {
  if ((context.artifactKind ?? detectArtifactKind(context.projectRoot)) === "skill-plugin") {
    const manifest = path.join(context.projectRoot, "plugin.yaml");
    const initializer = path.join(context.projectRoot, "__init__.py");
    if (!existsSync(manifest) || !existsSync(initializer)) {
      return {
        target: TARGET,
        status: "failed",
        evidence: "skill-plugin requires plugin.yaml and __init__.py",
      };
    }
    const initSource = readFileSync(initializer, "utf8");
    if (!initSource.includes("register_skill")) {
      return {
        target: TARGET,
        status: "failed",
        evidence: "skill-plugin __init__.py does not register skills",
      };
    }
    const skillsRoot = path.join(context.projectRoot, "skills");
    if (existsSync(skillsRoot)) {
      for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (!existsSync(path.join(skillsRoot, entry.name, "SKILL.md"))) {
          return {
            target: TARGET,
            status: "failed",
            evidence: `skill-plugin skill ${entry.name} is missing SKILL.md`,
          };
        }
      }
    }
    return {
      target: TARGET,
      status: "confirmed",
      evidence: "Hermes skill-plugin structure validated: plugin.yaml, register_skill initializer, and skill roots",
    };
  }

  if (!existsSync(context.projectRoot)) {
    return { target: TARGET, status: "failed", evidence: "projectRoot does not exist" };
  }
  // Stage the workspace under a fresh HOME so `tirith config validate`
  // doesn't pick up the operator's real Hermes state.
  const tempHome = mkdtempSync(path.join(os.tmpdir(), "jue-303-confirm-"));
  try {
    // `execFileSync(file, args, options)` — file and args must stay
    // separate. Concatenating them into one string (as a prior revision
    // did) makes Node treat the whole string as a literal executable
    // name and always throw ENOENT, since execFileSync never invokes a
    // shell to tokenize it.
    const result = execFileSync("tirith", ["config", "validate", context.projectRoot], {
      encoding: "utf8",
      env: { ...process.env, HOME: tempHome, HERMES_HOME: tempHome },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10_000,
    });
    if (/invalid|error|fail/i.test(result)) {
      return {
        target: TARGET,
        status: "failed",
        evidence: `tirith config validate returned non-clean: ${result.slice(0, 500)}`,
      };
    }
    return {
      target: TARGET,
      status: "confirmed",
      evidence: `tirith config validate ran cleanly against ${context.projectRoot}: ${result.slice(0, 200)}`,
    };
  } catch (error) {
    const stderr = error && typeof error === "object" && "stderr" in error
      ? String((error as { stderr: unknown }).stderr)
      : "";
    const stdout = error && typeof error === "object" && "stdout" in error
      ? String((error as { stdout: unknown }).stdout)
      : "";
    return {
      target: TARGET,
      status: "failed",
      evidence: `tirith config validate failed: exit=${(error as { status?: number }).status} stdout=${stdout.slice(0, 300)} stderr=${stderr.slice(0, 300)}`,
    };
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
}
