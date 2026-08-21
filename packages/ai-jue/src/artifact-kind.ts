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
  readonly exitCode = 2;

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

/** Config/tools key for a package name or canonical Adapter id. */
export function adapterConfigKey(adapterName: string): string {
  return normalizeAdapterKey(shortAdapterName(adapterName));
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
    plugin: "skill-plugin",
    "skill-plugin": "skill-plugin",
  },
  cursor: {
    project: "project",
    workspace: "project",
    plugin: "plugin",
    bundle: "plugin",
    auto: "project",
  },
};

/** Kinds that may be passed to write() today. */
const IMPLEMENTED: Record<string, string[]> = {
  claude: ["project", "plugin"],
  codex: ["project", "plugin"],
  openclaw: ["workspace", "compatible-bundle"],
  hermes: ["workspace", "skill-plugin"],
  cursor: ["project", "plugin"],
};

export interface ResolveArtifactKindInput {
  /** Full package name or short id. */
  adapterName: string;
  /** CLI --artifact / --artifact-kind, if any. */
  cliArtifact?: string | null;
  /** Merged project config (may include targets). */
  config?: {
    targets?: Record<
      string,
      { artifact?: string; enabled?: boolean; scope?: ArtifactScope } | undefined
    >;
  } | null;
}

export type ArtifactScope = "project" | "local" | "user";
export type TargetSelection = {
  artifact?: string;
  enabled?: boolean;
  scope?: ArtifactScope;
};

/**
 * Resolve target-private selection without moving it into Canonical DSL.
 * The first configured alias is authoritative so `targets` remains one
 * conversion-environment input rather than a second merge layer.
 */
export function resolveTargetSelection(
  config: ResolveArtifactKindInput["config"],
  adapterName: string,
): TargetSelection | undefined {
  const short = shortAdapterName(adapterName);
  const key = normalizeAdapterKey(short);
  const targets = config?.targets;
  if (!targets) return undefined;

  const candidateKeys = [short, key];
  if (key === "claude") candidateKeys.push("claude-code");
  for (const candidate of [...new Set(candidateKeys)]) {
    const selection = targets[candidate];
    if (selection) return selection;
  }
  return undefined;
}

export function isTargetEnabled(
  config: ResolveArtifactKindInput["config"],
  adapterName: string,
): boolean {
  return resolveTargetSelection(config, adapterName)?.enabled !== false;
}

/**
 * Resolve the Artifact kind for one adapter.
 * Order: CLI → targets.<adapter>.artifact → stable Adapter default.
 */
export function resolveArtifactKind(input: ResolveArtifactKindInput): string {
  const short = shortAdapterName(input.adapterName);
  const key = normalizeAdapterKey(short);
  const aliases = ALIASES[key];
  const implemented = IMPLEMENTED[key] ?? ["project"];
  const defaultKind = DEFAULT_KIND[key] ?? "project";

  const fromCli = normalizeRaw(input.cliArtifact);
  const targetSelection = resolveTargetSelection(input.config, input.adapterName);
  const fromTargets = normalizeRaw(targetSelection?.artifact);

  const raw = fromCli ?? fromTargets ?? "auto";
  const resolved =
    aliases?.[raw] ?? (raw === "auto" ? defaultKind : raw);

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

type PluginManifestIdentity = {
  name: string;
  version: string;
  description?: string;
  author?: { name: string; email?: string; url?: string };
  variables?: Record<string, unknown>;
};

const DEFAULT_MANIFEST_AUTHOR = { name: "ai-jue" };

function resolveExplicitAuthor(explicit: Record<string, unknown> | undefined) {
  const author = explicit?.author;
  if (typeof author === "string" && author.trim()) {
    return { name: author.trim() };
  }
  if (author && typeof author === "object" && typeof (author as { name?: unknown }).name === "string") {
    const value = author as { name: string; email?: unknown; url?: unknown };
    const name = value.name.trim();
    if (!name) return undefined;
    return {
      name,
      email: typeof value.email === "string" && value.email.trim() ? value.email.trim() : undefined,
      url: typeof value.url === "string" && value.url.trim() ? value.url.trim() : undefined,
    };
  }
  return undefined;
}

/**
 * Minimal plugin identity for Claude/Codex manifests when tools.* does not
 * supply one. Always includes `author` — `claude plugin validate --strict`
 * (RFC-0002's native confirmation path) reports a missing-author warning as
 * a failure, so a manifest without one can never pass native confirmation.
 */
export function resolvePluginManifest(
  config: Record<string, unknown> | null | undefined,
  adapterShort: string,
): PluginManifestIdentity | undefined {
  const tools = (config?.tools as Record<string, unknown> | undefined)?.[adapterShort] as
    | Record<string, unknown>
    | undefined;
  const explicit = tools?.pluginManifest as Record<string, unknown> | undefined;
  if (explicit && typeof explicit.name === "string" && explicit.name.trim()) {
    const variables =
      explicit.variables && typeof explicit.variables === "object" && !Array.isArray(explicit.variables)
        ? (explicit.variables as Record<string, unknown>)
        : undefined;
    return {
      name: explicit.name.trim(),
      version: typeof explicit.version === "string" && explicit.version.trim() ? explicit.version.trim() : "0.1.0",
      description: typeof explicit.description === "string" ? explicit.description : undefined,
      author: resolveExplicitAuthor(explicit) ?? DEFAULT_MANIFEST_AUTHOR,
      ...(variables ? { variables } : {}),
    };
  }

  const presets = config?.presets;
  const presetName =
    (Array.isArray(presets) && typeof presets[0] === "string" && presets[0]) ||
    (typeof config?.preset === "string" && config.preset) ||
    undefined;
  if (!presetName) {
    if (normalizeAdapterKey(adapterShort) === "codex") {
      return {
        name: "jue-plugin",
        version: "0.1.0",
        description: "Generated by ai-jue",
        author: DEFAULT_MANIFEST_AUTHOR,
      };
    }
    return undefined;
  }

  const name = String(presetName)
    .replace(/^jue-preset-/, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "jue-preset";

  return {
    name,
    version: "0.1.0",
    description: `Generated by ai-jue from preset ${presetName}`,
    author: DEFAULT_MANIFEST_AUTHOR,
  };
}

/**
 * Plugin identity for Artifacts that delegate to a shared writer
 * (`compatible-bundle` runs the Claude/Codex plugin writers, which emit
 * `.claude-plugin/plugin.json` under the same project root). The delegate's
 * own tool keys must win: when Claude and OpenClaw are applied to one
 * directory, both resolve the same manifest — otherwise each run re-writes
 * the other's identity and the Artifact can never be idempotent
 * (RFC-0002 acceptance criterion 6).
 */
export function resolveBundlePluginManifest(
  config: Record<string, unknown> | null | undefined,
  adapterShort: string,
): PluginManifestIdentity | undefined {
  return (
    resolvePluginManifest(config, "claude") ??
    resolvePluginManifest(config, "codex") ??
    resolvePluginManifest(config, adapterShort)
  );
}
