import type { CapabilityMapping } from "ai-jue-core";

/**
 * Hermes has no per-workspace `agents/` directory (unlike OpenClaw
 * which uses `.openclaw/agents/<name>/`). The single-agent runtime
 * reads the `agent:` block from the user-home `~/.hermes/config.yaml`
 * (per the real cwr:/d/devuser/.hermes/config.yaml reading). Per the
 * JUE-303 honest-stance principle, the `agents` mapping is a no-op
 * round-trip so the equivalence contract holds vacuously.
 */
export function agents(): CapabilityMapping<Record<string, unknown>> {
  return {
    read: () => undefined,
    write: () => [],
  };
}
