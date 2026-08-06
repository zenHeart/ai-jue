import path from "path";
import type { CapabilityMapping } from "ai-jue-core";
import { mergedJsonFile } from "ai-jue-core";
import { componentRoot, type CursorArtifactKind } from "./layout";

interface CursorHookCommand {
  command: string;
  matcher?: string;
  async?: boolean;
  timeout?: number;
}

type CursorHooksNative = Record<string, CursorHookCommand[]>;

interface CanonicalHookEntry {
  script?: string;
  matcher?: string;
  type?: string;
  async?: boolean;
  timeout?: number;
}

const EVENT_ALIASES: Record<string, string> = {
  PreToolUse: "preToolUse",
  PostToolUse: "postToolUse",
  PostToolUseFailure: "postToolUseFailure",
  SessionStart: "sessionStart",
  SessionEnd: "sessionEnd",
  PreCompact: "preCompact",
  SubagentStart: "subagentStart",
  SubagentStop: "subagentStop",
  UserPromptSubmit: "beforeSubmitPrompt",
  Stop: "stop",
  beforeShellExecution: "beforeShellExecution",
  afterShellExecution: "afterShellExecution",
  beforeMCPExecution: "beforeMCPExecution",
  afterMCPExecution: "afterMCPExecution",
  beforeReadFile: "beforeReadFile",
  afterFileEdit: "afterFileEdit",
  beforeSubmitPrompt: "beforeSubmitPrompt",
  afterAgentResponse: "afterAgentResponse",
  afterAgentThought: "afterAgentThought",
  workspaceOpen: "workspaceOpen",
};

function toCursorEvent(eventName: string): string {
  return EVENT_ALIASES[eventName] ?? eventName.replace(/^[A-Z]/, (c) => c.toLowerCase());
}

function toCanonicalHooks(
  nativeRoot: { version?: number; hooks?: CursorHooksNative } | CursorHooksNative,
): Record<string, CanonicalHookEntry | CanonicalHookEntry[]> {
  const native =
    "hooks" in nativeRoot && nativeRoot.hooks ? nativeRoot.hooks : (nativeRoot as CursorHooksNative);
  const canonical: Record<string, CanonicalHookEntry | CanonicalHookEntry[]> = {};
  for (const [eventName, commands] of Object.entries(native ?? {})) {
    if (!Array.isArray(commands)) continue;
    const entries = commands
      .filter((cmd) => typeof cmd.command === "string" && cmd.command.trim())
      .map((cmd) => ({
        script: cmd.command,
        ...(cmd.matcher !== undefined ? { matcher: cmd.matcher } : {}),
        ...(cmd.async !== undefined ? { async: cmd.async } : {}),
        ...(cmd.timeout !== undefined ? { timeout: cmd.timeout } : {}),
        type: "command",
      }));
    if (entries.length === 0) continue;
    const canonicalEvent =
      Object.entries(EVENT_ALIASES).find(([, cursorName]) => cursorName === eventName)?.[0] ??
      eventName;
    canonical[canonicalEvent] = entries.length === 1 ? entries[0] : entries;
  }
  return canonical;
}

function buildNativeHooks(canonical: Record<string, unknown>): CursorHooksNative {
  const hooks: CursorHooksNative = {};
  for (const [eventName, value] of Object.entries(canonical)) {
    const cursorEvent = toCursorEvent(eventName);
    const entries: CanonicalHookEntry[] = Array.isArray(value)
      ? (value as CanonicalHookEntry[])
      : typeof value === "string"
        ? [{ script: value }]
        : [value as CanonicalHookEntry];
    const commands = entries
      .filter((entry) => typeof entry.script === "string" && entry.script.trim())
      .map((entry) => ({
        command: entry.script!.trim(),
        ...(entry.matcher !== undefined ? { matcher: entry.matcher } : {}),
        ...(entry.async !== undefined ? { async: entry.async } : {}),
        ...(entry.timeout !== undefined ? { timeout: entry.timeout } : {}),
      }));
    if (commands.length > 0) hooks[cursorEvent] = commands;
  }
  return hooks;
}

function toNativeHooks(
  canonical: Record<string, unknown>,
  artifactKind: CursorArtifactKind,
): { version?: number; hooks: CursorHooksNative } | undefined {
  const hooks = buildNativeHooks(canonical);
  if (Object.keys(hooks).length === 0) return undefined;
  return artifactKind === "project" ? { version: 1, hooks } : { hooks };
}

/** Project: `.cursor/hooks.json`; Plugin: `hooks/hooks.json`. */
export function hooks(artifactKind: CursorArtifactKind): CapabilityMapping<Record<string, unknown>> {
  return mergedJsonFile<Record<string, unknown>>({
    filePath: (root) =>
      artifactKind === "project"
        ? path.join(componentRoot(root, artifactKind), "hooks.json")
        : path.join(componentRoot(root, artifactKind), "hooks", "hooks.json"),
    toCanonical: (native) => toCanonicalHooks(native as { hooks?: CursorHooksNative }),
    toNative: (canonical) => toNativeHooks(canonical, artifactKind),
  });
}
