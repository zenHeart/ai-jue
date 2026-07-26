import type { ArtifactResult, Confirmation } from "../../../src/artifact-change";

export interface ConfirmContext {
  projectRoot: string;
}

/**
 * There is no official CLI, validator, or runtime for this fictional Agent
 * — confirmation can never be more than "the files exist," which the
 * Extension API contract explicitly rejects as evidence. So this honestly
 * reports `unconfirmed` always, the same answer Claude Code's own Adapter
 * gives for its project scope (which likewise has no native validator).
 */
export async function confirm(_results: ArtifactResult[], _context: ConfirmContext): Promise<Confirmation> {
  return { target: "neutral-agent", status: "unconfirmed" };
}
