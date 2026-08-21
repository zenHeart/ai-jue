import { execFileSync } from "child_process";
import type {
  ArtifactResult,
  Confirmation,
  ConfirmContext as CoreConfirmContext,
} from "ai-jue-core";
import type { ArtifactKind } from "./capabilities/layout";

export interface ConfirmContext extends CoreConfirmContext {
  artifactKind?: ArtifactKind;
}

const TARGET = "claude-code";

/**
 * Confirms through Claude Code's own native path. Only a Plugin Artifact has
 * one (`claude plugin validate --strict`) — a project-scope `.claude/`
 * directory has no equivalent official validator (per the JUE-104/105
 * capability discovery), so it reports `unconfirmed` rather than a
 * fabricated pass.
 */
export async function confirm(_results: ArtifactResult[], context: ConfirmContext): Promise<Confirmation> {
  if ((context.artifactKind ?? "project") !== "plugin") {
    return { target: TARGET, status: "unconfirmed" };
  }

  try {
    const output = execFileSync("claude", ["plugin", "validate", context.artifactRoot, "--strict"], {
      encoding: "utf8",
    });
    if (!output.includes("Validation passed")) {
      return { target: TARGET, status: "failed", evidence: output.trim().slice(0, 500) };
    }
    return { target: TARGET, status: "confirmed", evidence: output.trim() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { target: TARGET, status: "failed", evidence: message.slice(0, 500) };
  }
}
