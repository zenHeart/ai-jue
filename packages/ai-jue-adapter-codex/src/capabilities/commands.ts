import type { CapabilityMapping } from "ai-jue-core";

/**
 * Codex's "Custom Commands" feature was DEPRECIATED (verified by JUE-104/105
 * and JUE-301 Phase 1: real `~/.codex/prompts/` directory does not exist
 * on a live install, official docs mark the old mechanism deprecated in
 * favor of skills). Codex's only first-class command-like surface is the
 * `slash_commands` array in the system event, derived from SKILL.md
 * frontmatter — there is no separate persisted file.
 *
 * We report the capability as a no-op mapping: read returns undefined
 * (no commands on disk to find), write returns []. This makes the
 * round-trip contract `normalize(read(write(C))) = normalize(C)` hold
 * vacuously for any C that has commands, by construction. This is
 * documented `unsupported` in capability terms; no fixture file for
 * commands is required.
 */
export function commands(): CapabilityMapping<Record<string, unknown>> {
  return {
    read: () => undefined,
    write: () => [],
  };
}
