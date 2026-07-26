import path from "path";
import { mergedJsonFile } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";
import { componentRoot, type ArtifactKind } from "./layout";

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

/** Claude's `{"<Event>": [{matcher, hooks: [{type, command}]}]}` → Canonical's `hooks` (`string | HookEntry | HookEntry[]` per event). */
function toCanonicalHooks(native: Record<string, NativeHookEntry[]>): Record<string, any> {
  const canonical: Record<string, any> = {};
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

/** Inverse of `toCanonicalHooks`. */
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

/** Project reads/writes the `hooks` key of `settings.json`; a Plugin uses its own `hooks/hooks.json`. Both share the same inner shape. */
export function hooks(artifactKind: ArtifactKind): CapabilityMapping<Record<string, any>> {
  const base = (root: string) => componentRoot(root, artifactKind);
  return mergedJsonFile({
    filePath: (root) =>
      artifactKind === "project"
        ? path.join(base(root), "settings.json")
        : path.join(base(root), "hooks", "hooks.json"),
    key: "hooks",
    toCanonical: toCanonicalHooks,
    toNative: toNativeHooks,
  });
}
