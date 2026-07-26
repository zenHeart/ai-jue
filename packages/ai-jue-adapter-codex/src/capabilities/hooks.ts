import path from "path";
import { mergedJsonFile } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";

/**
 * Codex hooks live at `.codex/hooks.json` (project) — per JUE-104/105 and
 * JUE-301 Phase 1, the schema is byte-for-byte identical to Claude's:
 * `{"hooks": {"<Event>": [{"matcher"?, "hooks": [{"type":"command",
 * "command":"..."}]}]}}`. We use the shared `mergedJsonFile` factory with
 * the `hooks` wrapper key, matching Claude's `capabilities/hooks.ts` pattern,
 * including the proper `toCanonical`/`toNative` translation that flattens
 * the per-matcher inner `hooks[]` into a flat array of HookObjects (the
 * shape `HookSchema` accepts).
 *
 * Verified Codex event names (per official docs): `PreToolUse,
 * PermissionRequest, PostToolUse, PreCompact, PostCompact, SessionStart,
 * SubagentStart, SubagentStop, UserPromptSubmit, Stop`. We do not
 * enumerate here — read/write are pure pass-through of whatever the file
 * contains.
 */

interface NativeHookEntry {
  matcher?: string;
  hooks?: Array<{ type?: string; command?: string; async?: boolean; timeout?: number }>;
}

interface CanonicalHookEntry {
  script?: string;
  matcher?: string;
  type?: string;
  async?: boolean;
  timeout?: number;
}

function toCanonicalHooks(native: Record<string, NativeHookEntry[]>): Record<string, CanonicalHookEntry | CanonicalHookEntry[]> {
  const canonical: Record<string, CanonicalHookEntry | CanonicalHookEntry[]> = {};
  for (const [eventName, matchers] of Object.entries(native)) {
    if (!Array.isArray(matchers)) continue;
    const entries = matchers.flatMap((matcher) =>
      (matcher.hooks ?? []).map((inner) => {
        const entry: CanonicalHookEntry = { script: inner.command };
        if (matcher.matcher !== undefined) entry.matcher = matcher.matcher;
        if (inner.type !== undefined) entry.type = inner.type;
        if (inner.async !== undefined) entry.async = inner.async;
        if (inner.timeout !== undefined) entry.timeout = inner.timeout;
        return entry;
      }),
    );
    if (entries.length === 0) continue;
    canonical[eventName] = entries.length === 1 ? entries[0] : entries;
  }
  return canonical;
}

function toNativeHooks(canonical: Record<string, any>): Record<string, NativeHookEntry[]> {
  const native: Record<string, NativeHookEntry[]> = {};
  for (const [eventName, value] of Object.entries(canonical)) {
    const entries: CanonicalHookEntry[] = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? [{ script: value }]
        : [value];
    native[eventName] = entries.map((entry) => ({
      ...(entry.matcher !== undefined ? { matcher: entry.matcher } : {}),
      hooks: [
        {
          type: entry.type ?? "command",
          command: entry.script,
          ...(entry.async !== undefined ? { async: entry.async } : {}),
          ...(entry.timeout !== undefined ? { timeout: entry.timeout } : {}),
        },
      ],
    }));
  }
  return native;
}

export function hooks(): CapabilityMapping<Record<string, any>> {
  return mergedJsonFile<Record<string, any>>({
    filePath: (root) => path.join(root, ".codex", "hooks.json"),
    key: "hooks",
    toCanonical: toCanonicalHooks,
    toNative: toNativeHooks,
  });
}
