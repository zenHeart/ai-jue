import type { CapabilityMapping } from "ai-jue-core";

/**
 * OpenClaw has no per-workspace `agents/` directory — the
 * `openclaw agents add/list/delete` CLI manages isolated agent
 * workspaces under the global `~/.openclaw/agents/<name>/`, not as
 * per-project files. There IS a top-level `agents` key in
 * `openclaw.json` but it configures the global default agent
 * identity, not user-authored per-workspace agents. The JUE-302
 * honest `degraded` stance applies: the mapping is a no-op so the
 * round-trip contract holds vacuously.
 */
export function agents(): CapabilityMapping<Record<string, unknown>> {
  return {
    read: () => undefined,
    write: () => [],
  };
}
