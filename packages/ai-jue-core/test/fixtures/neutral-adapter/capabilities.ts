import path from "path";
import { mergedJsonFile } from "../../../src/capability-mapping";
import type { CapabilityMapping } from "../../../src/capability-mapping";
import { assertNoLiteralCredentials } from "../../../src/security";

/**
 * JUE-204's synthetic, test-only native shape: unlike Claude Code (a small
 * file/directory per Capability item), this fictional Agent stores each
 * Capability *type* as the entire content of its own small JSON file. Each
 * mapping targets a distinct path, so `writeCapabilities()`'s per-mapping
 * concatenation is safe — no two mappings ever compute a change for the
 * same file (a shared single file across all six mappings was tried and
 * rejected: each `mergedJsonFile` mapping reads the pre-write disk snapshot
 * independently, so concatenated changes for the same path would clobber
 * each other when Core applies them in sequence).
 */
function wholeFileJson<T>(fileName: string): CapabilityMapping<T> {
  return mergedJsonFile<T>({ filePath: (root) => path.join(root, fileName) });
}

export const context = () => wholeFileJson<Record<string, unknown>>("context.json");
export const rules = () => wholeFileJson<Record<string, unknown>>("rules.json");
export const commands = () => wholeFileJson<Record<string, unknown>>("commands.json");
export const agents = () => wholeFileJson<Record<string, unknown>>("agents.json");
export const skills = () => wholeFileJson<Record<string, unknown>>("skills.json");
export const hooks = () => wholeFileJson<Record<string, unknown>>("hooks.json");

interface NativeMcp {
  mcpServers?: Record<string, unknown>;
}
interface CanonicalMcp {
  servers?: Record<string, unknown>;
}

/**
 * The one deliberate shape difference (proving `toCanonical`/`toNative`
 * translation, not just passthrough, also generalizes): the native file
 * calls the key `mcpServers`, Canonical calls it `servers`.
 */
export const mcp = (): CapabilityMapping<CanonicalMcp> =>
  mergedJsonFile<CanonicalMcp>({
    filePath: (root) => path.join(root, "mcp.json"),
    toCanonical: (native: NativeMcp) => {
      const servers = native.mcpServers ?? {};
      for (const [name, server] of Object.entries(servers)) {
        assertNoLiteralCredentials(server, `neutral-agent MCP server "${name}"`);
      }
      return { servers };
    },
    toNative: (canonical) => (canonical?.servers ? { mcpServers: canonical.servers } : undefined),
  });
