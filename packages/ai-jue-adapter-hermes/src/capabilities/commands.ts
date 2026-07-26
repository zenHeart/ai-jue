import type { CapabilityMapping } from "ai-jue-core";

/**
 * Hermes has no per-workspace `commands/` directory — the
 * `commands` block in the real `config.yaml` configures top-level
 * Hermes runtime behavior (e.g. `commands.restart: true`,
 * `commands.ownerDisplay: 'raw'`), not user-authored slash-commands.
 * Per the JUE-303 honest-stance principle, the `commands` mapping
 * is a no-op round-trip so the equivalence contract holds vacuously.
 */
export function commands(): CapabilityMapping<Record<string, unknown>> {
  return {
    read: () => undefined,
    write: () => [],
  };
}
