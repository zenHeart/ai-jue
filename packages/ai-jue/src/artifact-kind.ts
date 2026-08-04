/**
 * Resolve Artifact kind for `jue apply` with low cognitive load:
 * - Defaults match today's project/workspace behavior (zero surprise).
 * - Friendly aliases: `plugin` works across Claude/Codex/OpenClaw;
 *   `project`/`workspace` are interchangeable where unambiguous.
 * - Unsupported kinds fail before write with an actionable message.
 *
 * Contract: RFC-0002.
 */

export class UnsupportedArtifactKindError extends Error {
  readonly adapter: string;
  readonly requested: string;
  readonly supported: string[];

  constructor(adapter: string, requested: string, supported: string[], detail?: string) {
    const supportedList = supported.join(", ");
    super(
      detail ??
        `Adapter "${adapter}" does not support artifact kind "${requested}". Supported: ${supportedList}.`,
    );
    this.name = "UnsupportedArtifactKindError";
    this.adapter = adapter;
    this.requested = requested;
    this.supported = supported;
  }
}

/** Short adapter id used in CLI / targets / tools keys. */
export function shortAdapterName(adapterName: string): string {
  return adapterName.startsWith("ai-jue-adapter-")
    ? adapterName.slice("ai-jue-adapter-".length)
    : adapterName;
}

/** Normalize aliases like claude-code → claude for tables below. */
function normalizeAdapterKey(shortName: string): string {
  if (shortName === "claude-code" || shortName === "claude") return "claude";
  return shortName;
}

const DEFAULT_KIND: Record<string, string> = {
  claude: "project",
  codex: "project",
  openclaw: "workspace",
  hermes: "workspace",
  cursor: "project",
};

/** User-facing aliases → canonical kind per adapter. */
const ALIASES: Record<string, Record<string, string>> = {
  claude: {
    project: "project",
    workspace: "project",
    plugin: "plugin",
    bundle: "plugin",
    "compatible-bundle": "plugin",
    auto: "project",
  },
  codex: {
    project: "project",
    workspace: "project",
    plugin: "plugin",
    bundle: "plugin",
    "compatible-bundle": "plugin",
    auto: "project",
  },
  openclaw: {
    workspace: "workspace",
    project: "workspace",
    // Minimum cognitive load: users say "plugin"; OpenClaw installs Claude/Codex bundles.
    plugin: "compatible-bundle",
    bundle: "compatible-bundle",
    "compatible-bundle": "compatible-bundle",
    auto: "workspace",
  },
  hermes: {
    workspace: "workspace",
    project: "workspace",
    auto: "workspace",
    // Accepted names that are not implemented yet — rejected with a guided message.
    plugin: "skill-plugin",
    "skill-plugin": "skill-plugin",
    "compatible-bundle": "skill-plugin",
    bundle: "skill-plugin",
  },
};

/** Kinds that may be passed to write() today. */
const IMPLEMENTED: Record<string, string[]> = {
  claude: ["project", "plugin"],
  codex: ["project", "plugin"],
  openclaw: ["workspace", "compatible-bundle"],
  hermes: ["workspace"],
  cursor: ["project"],
};

const HERMES_SKILL_PLUGIN_HINT =
  'Hermes "plugin" is a Python runtime (plugin.yaml + register()). ' +
  "Canonical capability packs use workspace apply today. " +
  "Thin skill-plugin export is planned (RFC-0002 Phase B). " +
  "Use --artifact workspace (default) or omit --artifact.";

export interface ResolveArtifactKindInput {
  /** Full package name or short id. */
  adapterName: string;
  /** CLI --artifact / --artifact-kind, if any. */
  cliArtifact?: string | null;
  /** Merged project config (may include targets). */
  config?: {
    targets?: Record<string, { artifact?: string; enabled?: boolean } | undefined>;
  } | null;
}

/**
 * Resolve the Artifact kind for one adapter.
 * Order: CLI → targets.<adapter>.artifact → adapter default.
 */
export function resolveArtifactKind(input: ResolveArtifactKindInput): string {
  const short = shortAdapterName(input.adapterName);
  const key = normalizeAdapterKey(short);
  const aliases = ALIASES[key];
  const implemented = IMPLEMENTED[key] ?? ["project"];
  const defaultKind = DEFAULT_KIND[key] ?? "project";

  const fromCli = normalizeRaw(input.cliArtifact);
  const fromTargets = normalizeRaw(input.config?.targets?.[short]?.artifact)
    ?? normalizeRaw(input.config?.targets?.[key]?.artifact)
    // claude-code key in targets
    ?? (key === "claude"
      ? normalizeRaw(input.config?.targets?.["claude-code"]?.artifact)
      : undefined);

  const raw = fromCli ?? fromTargets ?? "auto";
  const resolved = aliases?.[raw] ?? (raw === "auto" ? defaultKind : raw);

  if (key === "hermes" && resolved === "skill-plugin") {
    throw new UnsupportedArtifactKindError(short, raw, implemented, HERMES_SKILL_PLUGIN_HINT);
  }

  if (!implemented.includes(resolved)) {
    throw new UnsupportedArtifactKindError(short, raw, implemented);
  }

  return resolved;
}

function normalizeRaw(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Minimal plugin identity for Claude/Codex manifests when tools.* does not supply one. */
export function resolvePluginManifest(
  config: Record<string, unknown> | null | undefined,
  adapterShort: string,
): { name: string; version: string; description?: string } | undefined {
  const tools = (config?.tools as Record<string, unknown> | undefined)?.[adapterShort] as
    | Record<string, unknown>
    | undefined;
  const explicit = tools?.pluginManifest as { name?: string; version?: string; description?: string } | undefined;
  if (explicit && typeof explicit.name === "string" && explicit.name.trim()) {
    return {
      name: explicit.name.trim(),
      version: typeof explicit.version === "string" && explicit.version.trim() ? explicit.version.trim() : "0.1.0",
      description: typeof explicit.description === "string" ? explicit.description : undefined,
    };
  }

  const presets = config?.presets;
  const presetName =
    (Array.isArray(presets) && typeof presets[0] === "string" && presets[0]) ||
    (typeof config?.preset === "string" && config.preset) ||
    undefined;
  if (!presetName) return undefined;

  const name = String(presetName)
    .replace(/^jue-preset-/, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "jue-preset";

  return {
    name,
    version: "0.1.0",
    description: `Generated by ai-jue from preset ${presetName}`,
  };
}

/** Choose OpenClaw bundle base (claude vs codex) with auto heuristic. */
export function resolveOpenClawBundleFormat(
  toolsOpenclaw: Record<string, unknown> | undefined,
  canonical: { hooks?: Record<string, unknown> },
): "claude" | "codex" {
  const raw = typeof toolsOpenclaw?.bundleFormat === "string"
    ? toolsOpenclaw.bundleFormat.trim().toLowerCase()
    : "auto";
  if (raw === "claude" || raw === "codex") return raw;
  const hooks = canonical.hooks ?? {};
  return Object.keys(hooks).length > 0 ? "codex" : "claude";
}
