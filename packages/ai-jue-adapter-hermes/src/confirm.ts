import { execFileSync } from "child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from "fs";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";
import * as yaml from "js-yaml";
import type { ArtifactResult, Confirmation, ConfirmContext as CoreConfirmContext } from "ai-jue-core";
import { detectArtifactKind, MANAGED_INIT_SOURCE, type HermesArtifactKind } from "./capabilities/layout";

export interface ConfirmContext extends CoreConfirmContext {
  artifactKind?: HermesArtifactKind;
}

const TARGET = "hermes";
const SAFE_IDENTITY = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function minimalEnvironment(home: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { HOME: home, USERPROFILE: home, HERMES_HOME: home };
  for (const key of ["PATH", "SystemRoot", "ComSpec", "PATHEXT", "TEMP", "TMP"]) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return env;
}

function isRegularContained(root: string, candidate: string): boolean {
  try {
    if (!lstatSync(candidate).isFile()) return false;
    const realRoot = realpathSync(root);
    const realCandidate = realpathSync(candidate);
    const relative = path.relative(realRoot, realCandidate);
    return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
  } catch {
    return false;
  }
}

/**
 * Hermes v0.18.0 has no per-file validate command analogous to
 * `claude plugin validate --strict` (Claude) or
 * `codex plugin marketplace add <local>` (Codex). The strongest native
 * confirmation path is the Hermes `tirith` binary on PATH, which
 * exposes `config validate` for the on-disk config tree.
 *
 * Live Agent consumption is verified out of band over SSH against an
 * isolated HOME and is not committed. In-repo confirmation uses
 * structural fixtures only.
 *
 * For workspace scope, `tirith` validates the config tree. For the thin
 * skill-plugin Artifact, the generated plugin surface provides structural
 * confirmation without executing generated Python.
 */
export async function confirm(
  _results: ArtifactResult[],
  context: ConfirmContext,
): Promise<Confirmation> {
  if ((context.artifactKind ?? detectArtifactKind(context.artifactRoot)) === "skill-plugin") {
    const manifest = path.join(context.artifactRoot, "plugin.yaml");
    const initializer = path.join(context.artifactRoot, "__init__.py");
    if (
      !isRegularContained(context.artifactRoot, manifest) ||
      !isRegularContained(context.artifactRoot, initializer)
    ) {
      return {
        target: TARGET,
        status: "failed",
        evidence: "skill-plugin requires contained regular plugin.yaml and __init__.py files",
      };
    }
    const initSource = readFileSync(initializer, "utf8");
    if (initSource !== MANAGED_INIT_SOURCE) {
      return {
        target: TARGET,
        status: "failed",
        evidence: "skill-plugin __init__.py does not match the managed initializer",
      };
    }
    let manifestIdentity = "";
    try {
      const parsed = yaml.load(readFileSync(manifest, "utf8")) as { name?: unknown; version?: unknown };
      if (
        typeof parsed?.name !== "string" ||
        !SAFE_IDENTITY.test(parsed.name) ||
        typeof parsed.version !== "string" ||
        !parsed.version.trim()
      ) {
        throw new Error("invalid identity");
      }
      manifestIdentity = parsed.name;
    } catch {
      return { target: TARGET, status: "failed", evidence: "skill-plugin manifest identity is invalid" };
    }
    const skillsRoot = path.join(context.artifactRoot, "skills");
    if (existsSync(skillsRoot)) {
      if (lstatSync(skillsRoot).isSymbolicLink() || !lstatSync(skillsRoot).isDirectory()) {
        return { target: TARGET, status: "failed", evidence: "skill-plugin skills root must be a regular directory" };
      }
      for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (!isRegularContained(context.artifactRoot, path.join(skillsRoot, entry.name, "SKILL.md"))) {
          return {
            target: TARGET,
            status: "failed",
            evidence: `skill-plugin skill ${entry.name} is missing SKILL.md`,
          };
        }
      }
    }
    const tempHome = mkdtempSync(path.join(os.tmpdir(), "jue-hermes-plugin-confirm-"));
    try {
      const sourceRepo = path.join(tempHome, "source");
      mkdirSync(sourceRepo);
      cpSync(context.artifactRoot, sourceRepo, { recursive: true });
      const env = minimalEnvironment(tempHome);
      execFileSync("git", ["init", "--quiet"], { cwd: sourceRepo, env, stdio: "ignore" });
      execFileSync("git", ["add", "."], { cwd: sourceRepo, env, stdio: "ignore" });
      execFileSync(
        "git",
        ["-c", "user.name=ai-jue", "-c", "user.email=ai-jue", "commit", "--quiet", "-m", "verify"],
        { cwd: sourceRepo, env, stdio: "ignore" },
      );
      execFileSync("hermes", ["plugins", "install", pathToFileURL(sourceRepo).href, "--no-enable"], {
        encoding: "utf8",
        env,
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 20_000,
      });
      const listOutput = execFileSync("hermes", ["plugins", "list", "--user", "--json"], {
        encoding: "utf8",
        env,
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 10_000,
      });
      const inventory = JSON.parse(listOutput);
      if (!JSON.stringify(inventory).includes(manifestIdentity)) {
        return { target: TARGET, status: "failed", evidence: "Hermes plugin inventory is missing the installed identity" };
      }
      return { target: TARGET, status: "confirmed", evidence: "Hermes isolated install and inventory confirmed the skill-plugin" };
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
        return { target: TARGET, status: "unconfirmed", evidence: "Hermes CLI is unavailable; native install was not run" };
      }
      return { target: TARGET, status: "failed", evidence: "Hermes isolated plugin install or inventory confirmation failed" };
    } finally {
      rmSync(tempHome, { recursive: true, force: true });
    }
  }

  if (!existsSync(context.artifactRoot)) {
    return { target: TARGET, status: "failed", evidence: "artifactRoot does not exist" };
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
    const result = execFileSync("tirith", ["config", "validate", context.artifactRoot], {
      encoding: "utf8",
      env: minimalEnvironment(tempHome),
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10_000,
    });
    if (/invalid|error|fail/i.test(result)) {
      return {
        target: TARGET,
        status: "failed",
        evidence: "tirith config validate returned a non-clean result",
      };
    }
    return {
      target: TARGET,
      status: "confirmed",
      evidence: "tirith config validate completed cleanly in an isolated home",
    };
  } catch (error) {
    if (error && typeof error === "object" && (error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        target: TARGET,
        status: "unconfirmed",
        evidence: "tirith is not available on PATH; workspace validation was not run",
      };
    }
    return {
      target: TARGET,
      status: "failed",
      evidence: `tirith config validate failed with exit=${(error as { status?: number }).status ?? "unknown"}`,
    };
  } finally {
    rmSync(tempHome, { recursive: true, force: true });
  }
}
