import path from "path";
import type { ApplyScope } from "ai-jue-core";

const APPLY_SCOPES = new Set<ApplyScope>(["project", "user"]);

export class UnsupportedApplyScopeError extends Error {
  readonly exitCode = 2;

  constructor(
    readonly adapterName: string,
    readonly requestedScope: ApplyScope,
    readonly supportedScopes: readonly ApplyScope[],
  ) {
    super(
      `Adapter "${adapterName}" does not support apply scope "${requestedScope}". ` +
        `Supported: ${supportedScopes.join(", ")}.`,
    );
    this.name = "UnsupportedApplyScopeError";
  }
}

function normalizeScope(value: unknown): ApplyScope | undefined {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!APPLY_SCOPES.has(normalized as ApplyScope)) {
    throw new Error(`Apply scope must be one of: project, user. Received: ${value}`);
  }
  return normalized as ApplyScope;
}

/** Resolves one Adapter's apply scope: CLI override, target config, then project. */
export function resolveApplyScope(
  cliScope: unknown,
  configuredScope: unknown,
): ApplyScope {
  return normalizeScope(cliScope) ?? normalizeScope(configuredScope) ?? "project";
}

/** Resolves the Core-authorized root without changing config discovery. */
export function resolveArtifactRoot(
  scope: ApplyScope,
  projectDirectory: string,
  userHome: string,
): string {
  return path.resolve(scope === "user" ? userHome : projectDirectory);
}

/** Core owns the project-only baseline; Adapters declare only broader support. */
export function assertAdapterSupportsScope(
  adapterName: string,
  supportedScopes: readonly ApplyScope[] | undefined,
  requestedScope: ApplyScope,
): void {
  const supported = supportedScopes ?? ["project"];
  if (!supported.includes(requestedScope)) {
    throw new UnsupportedApplyScopeError(adapterName, requestedScope, supported);
  }
}
