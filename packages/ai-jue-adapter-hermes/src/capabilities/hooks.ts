import type { CapabilityMapping } from "ai-jue-core";

/**
 * Hermes has no per-workspace `hooks/` directory — the
 * `hooks_auto_accept` block in the real `config.yaml` (verified
 * against cwr:/d/devuser/.hermes/config.yaml) configures the
 * session-level hooks-acceptance policy, and the
 * `~/.hermes/hooks/` directory exists but is **empty** on the real
 * installation. Per the JUE-303 honest-stance principle, the `hooks`
 * mapping is a no-op round-trip; if/when Hermes grows a per-workspace
 * hook directory convention, this mapping will be reimplemented.
 */
export function hooks(): CapabilityMapping<Record<string, unknown>> {
  return {
    read: () => undefined,
    write: () => [],
  };
}
