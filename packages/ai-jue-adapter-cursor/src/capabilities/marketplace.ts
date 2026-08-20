import fs from "fs";
import path from "path";
import {
  assertNoLiteralCredentials,
  hashArtifactContent,
  type ArtifactChange,
} from "ai-jue-core";

export interface CursorMarketplaceOwner {
  name: string;
  email?: string;
  [key: string]: unknown;
}

export interface CursorMarketplaceMetadata {
  description?: string;
  version?: string;
  pluginRoot?: string;
  [key: string]: unknown;
}

export interface CursorMarketplacePlugin {
  name: string;
  source: string;
  description?: string;
  version?: string;
  author?: CursorMarketplaceOwner;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  logo?: string;
  category?: string;
  tags?: string[];
  skills?: string | string[];
  rules?: string | string[];
  agents?: string | string[];
  commands?: string | string[];
  hooks?: string | Record<string, unknown>;
  mcpServers?: string | Record<string, unknown>;
  variables?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CursorMarketplaceManifest {
  name: string;
  owner: CursorMarketplaceOwner;
  metadata?: CursorMarketplaceMetadata;
  plugins: CursorMarketplacePlugin[];
  [key: string]: unknown;
}

const MARKETPLACE_NAME = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const PLUGIN_NAME = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const WINDOWS_RESERVED_SEGMENT = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const SENSITIVE_KEY = /(?:authorization|proxy-authorization|api[-_]?key|private[-_]?key|token|secret|password|credential|cookie|auth)$/i;
const CREDENTIAL_PLACEHOLDER = /^(?:(?:Bearer|Basic)\s+)?\$\{[A-Z_][A-Z0-9_]*\}$/;
const SENSITIVE_FLAG_NAME = "(?:api[-_]?key|access[-_]?token|token|client[-_]?secret|secret|password|credential|authorization|auth)";
const SENSITIVE_FLAG_ONLY = new RegExp(`^--${SENSITIVE_FLAG_NAME}$`, "i");
const SENSITIVE_FLAG_VALUE = new RegExp(`--${SENSITIVE_FLAG_NAME}(?:=|\\s+)(?:\"([^\"]+)\"|'([^']+)'|([^\\s]+))`, "gi");
const SENSITIVE_ASSIGNMENT = /\b(?:[A-Z0-9_]*(?:API_?KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTHORIZATION))\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s;&]+))/gi;
const SENSITIVE_HEADER = /(?:authorization|proxy-authorization|x-api-key)\s*:\s*([^\r\n,;]+)/gi;
const MARKETPLACE_PATH = ".cursor-plugin/marketplace.json";

function marketplaceFilePath(root: string): string {
  return path.join(root, ...MARKETPLACE_PATH.split("/"));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function snapshotJson(value: unknown): unknown {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new Error("undefined JSON");
    return JSON.parse(serialized);
  } catch {
    throw new Error("Cursor marketplace manifest must contain JSON data");
  }
}

function portableRelativePath(value: unknown, label: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    /[\x00-\x1F\x7F]/.test(value) ||
    /[<>"|?*]/.test(value) ||
    value.includes(":") ||
    value.includes("\\") ||
    value.split("/").includes("..") ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value) ||
    /^[A-Za-z]:/.test(value)
  ) {
    throw new Error(`Cursor marketplace ${label} must be a portable relative path`);
  }
  if (
    value.split("/").some((segment) =>
      segment !== "" &&
      segment !== "." &&
      (WINDOWS_RESERVED_SEGMENT.test(segment) || /[. ]$/.test(segment)),
    )
  ) {
    throw new Error(`Cursor marketplace ${label} must be a portable relative path`);
  }
  const normalized = path.posix.normalize(value);
  if (normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`Cursor marketplace ${label} must be a portable relative path`);
  }
  return normalized.replace(/^\.\//, "");
}

function assertMarketplaceCredentialSafety(value: unknown): void {
  const reject = (): never => {
    throw new Error("Cursor marketplace manifest contains a literal credential");
  };
  const assertCoreSafety = (current: unknown): void => {
    try {
      assertNoLiteralCredentials(current, "Cursor marketplace manifest");
    } catch {
      reject();
    }
  };
  const assertPlaceholderValue = (current: unknown): void => {
    const values = Array.isArray(current) ? current : [current];
    if (values.some((item) => typeof item !== "string" || !CREDENTIAL_PLACEHOLDER.test(item))) {
      reject();
    }
  };
  const assertSensitiveString = (current: string): void => {
    for (const match of current.matchAll(SENSITIVE_FLAG_VALUE)) {
      assertPlaceholderValue(match[1] ?? match[2] ?? match[3]);
    }
    for (const match of current.matchAll(SENSITIVE_ASSIGNMENT)) {
      assertPlaceholderValue(match[1] ?? match[2] ?? match[3]);
    }
    for (const match of current.matchAll(SENSITIVE_HEADER)) {
      assertPlaceholderValue(match[1].trim());
    }
  };
  const assertSensitiveArguments = (current: unknown[]): void => {
    for (let index = 0; index < current.length; index += 1) {
      const argument = current[index];
      if (typeof argument === "string" && SENSITIVE_FLAG_ONLY.test(argument)) {
        assertPlaceholderValue(current[index + 1]);
      }
    }
  };

  assertCoreSafety(value);
  const visited = new WeakSet<object>();

  function visit(current: unknown): void {
    if (typeof current === "string") {
      assertSensitiveString(current);
      return;
    }
    if (!current || typeof current !== "object") return;
    if (visited.has(current)) {
      throw new Error("Cursor marketplace manifest must contain JSON data");
    }
    visited.add(current);
    if (Array.isArray(current)) assertSensitiveArguments(current);

    if (isPlainRecord(current) && Object.prototype.hasOwnProperty.call(current, "env")) {
      if (!isPlainRecord(current.env)) {
        throw new Error("Cursor marketplace env must be a JSON object");
      }
      assertCoreSafety(current);
    }
    if (isPlainRecord(current)) {
      for (const [key, child] of Object.entries(current)) {
        if (SENSITIVE_KEY.test(key)) {
          if (typeof child === "string" || Array.isArray(child)) {
            assertPlaceholderValue(child);
          } else if (isPlainRecord(child)) {
            for (const schemaField of ["default", "const", "enum"] as const) {
              if (child[schemaField] !== undefined) {
                assertPlaceholderValue(child[schemaField]);
              }
            }
          } else if (child !== undefined && child !== null) {
            reject();
          }
        }
      }
    }
    for (const child of Array.isArray(current) ? current : Object.values(current)) {
      visit(child);
    }
    visited.delete(current);
  }

  visit(value);
}

function assertOptionalStringFields(
  entry: Record<string, unknown>,
  fields: readonly string[],
): void {
  for (const field of fields) {
    if (entry[field] !== undefined && typeof entry[field] !== "string") {
      throw new Error(`Cursor marketplace plugin ${field} must be a string`);
    }
  }
}

function assertStringArray(value: unknown, field: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Cursor marketplace plugin ${field} must be an array of strings`);
  }
}

function assertPortablePathList(value: unknown, field: string): void {
  const values = Array.isArray(value) ? value : [value];
  if (values.some((item) => typeof item !== "string")) {
    throw new Error(`Cursor marketplace plugin ${field} must be a string or array of strings`);
  }
  for (const item of values) portableRelativePath(item, `plugin ${field}`);
}

function assertLogo(value: unknown): void {
  if (value === undefined) return;
  if (typeof value !== "string") {
    throw new Error("Cursor marketplace plugin logo must be a string");
  }
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
      return;
    } catch {
      throw new Error("Cursor marketplace plugin logo must be an HTTP URL or portable relative path");
    }
  }
  portableRelativePath(value, "plugin logo");
}

function validatePluginEntryFields(entry: Record<string, unknown>): void {
  assertOptionalStringFields(entry, [
    "description",
    "version",
    "homepage",
    "repository",
    "license",
    "category",
  ]);
  assertLogo(entry.logo);
  if (typeof entry.version === "string" && !SEMVER.test(entry.version)) {
    throw new Error("Cursor marketplace plugin version must be semantic version text");
  }
  if (entry.author !== undefined) {
    if (
      !isPlainRecord(entry.author) ||
      typeof entry.author.name !== "string" ||
      entry.author.name.trim().length === 0 ||
      (entry.author.email !== undefined && typeof entry.author.email !== "string")
    ) {
      throw new Error("Cursor marketplace plugin author must contain a name and optional email");
    }
  }
  for (const field of ["keywords", "tags"] as const) {
    if (entry[field] !== undefined) assertStringArray(entry[field], field);
  }
  for (const field of ["skills", "rules", "agents", "commands"] as const) {
    if (entry[field] !== undefined) assertPortablePathList(entry[field], field);
  }
  for (const field of ["hooks", "mcpServers"] as const) {
    const value = entry[field];
    if (value !== undefined && typeof value !== "string" && !isPlainRecord(value)) {
      throw new Error(`Cursor marketplace plugin ${field} must be a string or JSON object`);
    }
    if (typeof value === "string") portableRelativePath(value, `plugin ${field}`);
  }
  if (entry.variables !== undefined && !isPlainRecord(entry.variables)) {
    throw new Error("Cursor marketplace plugin variables must be a JSON object");
  }
}

function lstatIfPresent(filePath: string): fs.Stats | undefined {
  try {
    return fs.lstatSync(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

function assertMarketplaceContainer(root: string): void {
  const markerDir = path.join(root, ".cursor-plugin");
  const stat = lstatIfPresent(markerDir);
  if (!stat) return;
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error("Cursor marketplace marker must be a regular directory");
  }
}

function resolveSource(pluginRoot: unknown, source: unknown): string {
  const normalizedSource = portableRelativePath(source, "plugin source");
  if (pluginRoot === undefined) return normalizedSource;
  const normalizedRoot = portableRelativePath(pluginRoot, "metadata.pluginRoot").replace(/\/$/, "");
  if (
    normalizedSource === normalizedRoot ||
    normalizedSource.startsWith(`${normalizedRoot}/`)
  ) {
    return normalizedSource;
  }
  return path.posix.join(normalizedRoot, normalizedSource);
}

function assertDirectory(root: string, relativePath: string): string {
  let current = root;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) {
      throw new Error("Cursor marketplace plugin source directory does not exist");
    }
    const stat = fs.lstatSync(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error("Cursor marketplace plugin source must be a regular directory");
    }
  }
  return current;
}

function readChildManifest(pluginDir: string): Record<string, unknown> {
  const markerDir = path.join(pluginDir, ".cursor-plugin");
  if (!fs.existsSync(markerDir)) {
    throw new Error("Cursor marketplace plugin source requires a Plugin manifest");
  }
  const markerDirStat = fs.lstatSync(markerDir);
  if (!markerDirStat.isDirectory() || markerDirStat.isSymbolicLink()) {
    throw new Error("Cursor marketplace Plugin marker must be a regular directory");
  }
  const manifestPath = path.join(markerDir, "plugin.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("Cursor marketplace plugin source requires a Plugin manifest");
  }
  const manifestStat = fs.lstatSync(manifestPath);
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink()) {
    throw new Error("Cursor marketplace Plugin manifest must be a regular file");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    throw new Error("Cursor marketplace Plugin manifest contains invalid JSON");
  }
  if (!isPlainRecord(parsed)) {
    throw new Error("Cursor marketplace Plugin manifest must be a JSON object");
  }
  return parsed;
}

/**
 * Validate the official multi-plugin index fields and each local Cursor
 * Plugin source. Child Plugin capabilities remain separate Artifacts; this
 * function establishes only the index-to-manifest relationship.
 */
export function validateMarketplaceIndex(
  root: string,
  value: unknown,
): CursorMarketplaceManifest {
  value = snapshotJson(value);
  if (!isPlainRecord(value)) {
    throw new Error("Cursor marketplace manifest must be a JSON object");
  }
  if (typeof value.name !== "string" || !MARKETPLACE_NAME.test(value.name)) {
    throw new Error("Cursor marketplace name must be lowercase kebab-case");
  }
  if (
    !isPlainRecord(value.owner) ||
    typeof value.owner.name !== "string" ||
    value.owner.name.trim().length === 0
  ) {
    throw new Error("Cursor marketplace owner.name is required");
  }
  if (value.owner.email !== undefined && typeof value.owner.email !== "string") {
    throw new Error("Cursor marketplace owner.email must be a string");
  }
  if (value.metadata !== undefined && !isPlainRecord(value.metadata)) {
    throw new Error("Cursor marketplace metadata must be a JSON object");
  }
  const metadata = value.metadata as Record<string, unknown> | undefined;
  for (const field of ["description", "version"] as const) {
    if (metadata?.[field] !== undefined && typeof metadata[field] !== "string") {
      throw new Error(`Cursor marketplace metadata.${field} must be a string`);
    }
  }
  if (typeof metadata?.version === "string" && !SEMVER.test(metadata.version)) {
    throw new Error("Cursor marketplace metadata.version must be semantic version text");
  }
  if (!Array.isArray(value.plugins) || value.plugins.length === 0) {
    throw new Error("Cursor marketplace plugins must be a non-empty array");
  }
  if (value.plugins.length > 500) {
    throw new Error("Cursor marketplace plugins must contain at most 500 entries");
  }

  assertMarketplaceCredentialSafety(value);

  const seen = new Set<string>();
  for (const entry of value.plugins) {
    if (!isPlainRecord(entry)) {
      throw new Error("Cursor marketplace plugin entries must be JSON objects");
    }
    if (typeof entry.name !== "string" || !PLUGIN_NAME.test(entry.name)) {
      throw new Error("Cursor marketplace plugin name has an invalid format");
    }
    if (seen.has(entry.name)) {
      throw new Error("Cursor marketplace requires unique plugin names");
    }
    seen.add(entry.name);
    if (entry.description !== undefined && typeof entry.description !== "string") {
      throw new Error("Cursor marketplace plugin description must be a string");
    }
    validatePluginEntryFields(entry);
    const source = resolveSource(metadata?.pluginRoot, entry.source);
    const pluginDir = assertDirectory(root, source);
    const childManifest = readChildManifest(pluginDir);
    if (childManifest.name !== entry.name) {
      throw new Error("Cursor marketplace Plugin manifest name must match its index entry");
    }
  }
  return value as unknown as CursorMarketplaceManifest;
}

/** Read and validate an index without selecting or merging child Plugins. */
export function readMarketplaceIndex(root: string): CursorMarketplaceManifest | undefined {
  assertMarketplaceContainer(root);
  const filePath = marketplaceFilePath(root);
  const stat = lstatIfPresent(filePath);
  if (!stat) return undefined;
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error("Cursor marketplace manifest must be a regular file");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    throw new Error("Cursor marketplace manifest contains invalid JSON");
  }
  return validateMarketplaceIndex(root, parsed);
}

export function writeMarketplaceIndex(
  root: string,
  target: string,
  value: unknown,
): ArtifactChange[] {
  const manifest = validateMarketplaceIndex(root, value);
  assertMarketplaceContainer(root);
  const filePath = marketplaceFilePath(root);
  const stat = lstatIfPresent(filePath);
  const exists = stat !== undefined;
  if (stat) {
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error("Cursor marketplace manifest must be a regular file");
    }
  }
  const before = exists ? fs.readFileSync(filePath, "utf8") : undefined;
  const content = `${JSON.stringify(manifest, null, 2)}\n`;
  if (before === content) return [];
  return [{
    target,
    kind: exists ? "update" : "create",
    ownership: "full",
    scope: "project",
    path: MARKETPLACE_PATH,
    beforeHash: before === undefined ? null : hashArtifactContent(before),
    afterHash: hashArtifactContent(content),
    content,
    risk: "low",
    requiresApproval: false,
    atomicState: "planned",
  }];
}
