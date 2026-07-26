import type { CapabilityMapping } from "ai-jue-core";

/**
 * OpenClaw has no per-workspace `commands` directory (verified by
 * reading the real `~/.openclaw/workspace-jue-probe/` and the real
 * `~/.openclaw/openclaw.json` top-level `commands` key — that key
 * configures OpenClaw's NATIVE shell-side commands
 * (`commands.native`, `commands.nativeSkills`, `commands.restart`,
 * `commands.ownerDisplay`), NOT user-authored slash-commands). User-
 * authored slash-commands in OpenClaw are an `EXPERIMENTAL` feature
 * with no first-class directory shape; the JUE-302 honest
 * `degraded` stance applies: the mapping is a no-op so the round-trip
 * contract holds vacuously.
 */
export function commands(): CapabilityMapping<Record<string, unknown>> {
  return {
    read: () => undefined,
    write: () => [],
  };
}
