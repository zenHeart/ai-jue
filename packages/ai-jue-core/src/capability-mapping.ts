import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { computeManagedMarkdown, computeMergedJson } from './merge-strategies';
import { splitFrontmatter } from './frontmatter';
import { hashArtifactContent, type ArtifactChange } from './artifact-change';
import { resolveSupportFilePath } from './file-io';

/**
 * One Canonical Capability's native shape, read and write symmetric by
 * construction: both directions are derived from the same declared shape
 * instead of being two hand-maintained functions that merely happen to be
 * inverses. This is Adapter-internal composition tooling, not a new public
 * concept — Adapters declare a `Record<capabilityKey, CapabilityMapping>`
 * table and drive it through `readCapabilities`/`writeCapabilities`.
 */
export interface CapabilityMapping<T = unknown> {
  read(root: string): T | undefined;
  write(root: string, value: T, target: string): ArtifactChange[];
}

/** Runs every mapping's `read` and assembles the non-empty results into one object. */
export function readCapabilities(
  mappings: Record<string, CapabilityMapping>,
  root: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, mapping] of Object.entries(mappings)) {
    const value = mapping.read(root);
    if (value !== undefined) result[key] = value;
  }
  return result;
}

/** Runs every mapping's `write` for the Capability keys present on `canonical` and concatenates the changes. */
export function writeCapabilities(
  mappings: Record<string, CapabilityMapping>,
  canonical: Record<string, unknown>,
  root: string,
  target: string,
): ArtifactChange[] {
  const changes: ArtifactChange[] = [];
  for (const [key, mapping] of Object.entries(mappings)) {
    if (canonical[key] === undefined) continue;
    changes.push(...mapping.write(root, canonical[key], target));
  }
  return changes;
}

function relativePortablePath(root: string, absolutePath: string): string {
  return path.relative(root, absolutePath).split(path.sep).join('/');
}

function buildFullOwnershipTextChange(
  target: string,
  root: string,
  absolutePath: string,
  newContent: string,
): ArtifactChange | null {
  const exists = fs.existsSync(absolutePath);
  const existingContent = exists ? fs.readFileSync(absolutePath, 'utf8') : undefined;
  if (existingContent === newContent) return null;
  return {
    target,
    kind: exists ? 'update' : 'create',
    ownership: 'full',
    scope: 'project',
    path: relativePortablePath(root, absolutePath),
    beforeHash: exists ? hashArtifactContent(existingContent!) : null,
    afterHash: hashArtifactContent(newContent),
    content: newContent,
    risk: 'low',
    requiresApproval: false,
    atomicState: 'planned',
  };
}

function buildFullOwnershipBinaryChange(
  target: string,
  root: string,
  absolutePath: string,
  newContent: Buffer,
): ArtifactChange | null {
  const exists = fs.existsSync(absolutePath);
  const existingContent = exists ? fs.readFileSync(absolutePath) : undefined;
  if (existingContent && existingContent.equals(newContent)) return null;
  return {
    target,
    kind: exists ? 'update' : 'create',
    ownership: 'full',
    scope: 'project',
    path: relativePortablePath(root, absolutePath),
    beforeHash: exists ? hashArtifactContent(existingContent!) : null,
    afterHash: hashArtifactContent(newContent),
    content: { content: newContent.toString('base64'), encoding: 'base64' },
    risk: 'low',
    requiresApproval: false,
    atomicState: 'planned',
  };
}

function buildManagedMarkdownArtifactChange(
  target: string,
  root: string,
  absolutePath: string,
  content: string,
): ArtifactChange | null {
  const exists = fs.existsSync(absolutePath);
  const existingContent = exists ? fs.readFileSync(absolutePath, 'utf8') : undefined;
  const finalContent = computeManagedMarkdown(existingContent, content);
  if (existingContent !== undefined && existingContent.trim() === finalContent.trim()) return null;
  return {
    target,
    kind: exists ? 'update' : 'create',
    ownership: 'managed-block',
    scope: 'project',
    path: relativePortablePath(root, absolutePath),
    beforeHash: exists ? hashArtifactContent(existingContent!) : null,
    afterHash: hashArtifactContent(finalContent),
    content: finalContent,
    risk: 'low',
    requiresApproval: false,
    atomicState: 'planned',
  };
}

function buildMergedJsonArtifactChange(
  target: string,
  root: string,
  absolutePath: string,
  content: unknown,
): ArtifactChange | null {
  const exists = fs.existsSync(absolutePath);
  let existingRaw: string | undefined;
  let existingParsed: unknown;
  if (exists) {
    existingRaw = fs.readFileSync(absolutePath, 'utf8');
    try {
      existingParsed = JSON.parse(existingRaw);
    } catch {
      existingParsed = undefined;
    }
  }
  const finalContent = computeMergedJson(existingParsed, content);
  const finalRaw = JSON.stringify(finalContent, null, 2);
  if (existingRaw !== undefined && existingRaw.trim() === finalRaw.trim()) return null;
  return {
    target,
    kind: exists ? 'update' : 'create',
    ownership: 'merged-keys',
    scope: 'project',
    path: relativePortablePath(root, absolutePath),
    beforeHash: existingRaw !== undefined ? hashArtifactContent(existingRaw) : null,
    afterHash: hashArtifactContent(finalRaw),
    content: finalRaw,
    risk: 'low',
    requiresApproval: false,
    atomicState: 'planned',
  };
}

interface FrontmatterAsset {
  content: string;
  attributes: Record<string, any>;
}

function parseFrontmatterFile(filePath: string): FrontmatterAsset {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { frontmatterText, body } = splitFrontmatter(raw);
  const attributes = frontmatterText ? (yaml.load(frontmatterText) as Record<string, any>) || {} : {};
  return { content: body.trim(), attributes };
}

function renderFrontmatterFile(attributes: Record<string, any>, body: string): string {
  if (Object.keys(attributes).length === 0) return body;
  const frontmatterText = yaml.dump(attributes, { lineWidth: -1, noRefs: true }).trim();
  return `---\n${frontmatterText}\n---\n\n${body.trim()}`;
}

function renameKeys(
  entry: Record<string, any>,
  renames: Record<string, string>,
  direction: 'toCanonical' | 'toNative',
): Record<string, any> {
  const result = { ...entry };
  for (const [canonicalKey, nativeKey] of Object.entries(renames)) {
    const [from, to] = direction === 'toCanonical' ? [nativeKey, canonicalKey] : [canonicalKey, nativeKey];
    if (from in result) {
      result[to] = result[from];
      if (from !== to) delete result[from];
    }
  }
  return result;
}

function sortedDirEntries(dirPath: string): fs.Dirent[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * One flat `<name>.md` file per item (frontmatter + body), e.g. Claude
 * Code's `rules/`, `commands/`, `agents/`. `fieldRenames` maps a Canonical
 * field name to its native frontmatter key (e.g. `{ globs: 'paths' }`);
 * applied in both directions so read and write stay each other's inverse.
 */
export function flatMarkdownDirectory(options: {
  dirPath: (root: string) => string;
  fieldRenames?: Record<string, string>;
}): CapabilityMapping<Record<string, any>> {
  return {
    read(root) {
      const dirPath = options.dirPath(root);
      const result: Record<string, any> = {};
      for (const entry of sortedDirEntries(dirPath)) {
        if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
        const name = entry.name.slice(0, -3);
        const { content, attributes } = parseFrontmatterFile(path.join(dirPath, entry.name));
        const canonicalAttributes = options.fieldRenames
          ? renameKeys(attributes, options.fieldRenames, 'toCanonical')
          : attributes;
        result[name] = { ...canonicalAttributes, content, prompt: content };
      }
      return Object.keys(result).length > 0 ? result : undefined;
    },
    write(root, value, target) {
      const dirPath = options.dirPath(root);
      const changes: ArtifactChange[] = [];
      for (const [name, rawEntry] of Object.entries(value)) {
        const { content, prompt, ...rest } = rawEntry as Record<string, any>;
        const nativeAttributes = options.fieldRenames
          ? renameKeys(rest, options.fieldRenames, 'toNative')
          : rest;
        const body = String(content ?? prompt ?? '').trim();
        const rendered = renderFrontmatterFile(nativeAttributes, body);
        const change = buildFullOwnershipTextChange(target, root, path.join(dirPath, `${name}.md`), rendered);
        if (change) changes.push(change);
      }
      return changes;
    },
  };
}

export type SupportFileBundle = Record<string, string | { content: string; encoding: 'utf8' | 'base64' }>;

function bufferForSupportFile(file: string | { content: string; encoding: 'utf8' | 'base64' }): Buffer {
  return typeof file === 'string' ? Buffer.from(file, 'utf8') : Buffer.from(file.content, file.encoding);
}

/**
 * One directory per item, containing a main frontmatter file plus optional
 * attachment bundles, e.g. Claude Code's `skills/<name>/SKILL.md` with
 * `references/`/`scripts/`/`assets/`.
 */
export function directoryPerItem(options: {
  dirPath: (root: string) => string;
  mainFileName: string;
  bundleKeys?: string[];
}): CapabilityMapping<Record<string, any>> {
  const bundleKeys = options.bundleKeys ?? [];
  return {
    read(root) {
      const dirPath = options.dirPath(root);
      const result: Record<string, any> = {};
      for (const entry of sortedDirEntries(dirPath)) {
        if (!entry.isDirectory()) continue;
        const mainFilePath = path.join(dirPath, entry.name, options.mainFileName);
        if (!fs.existsSync(mainFilePath)) continue;
        const { content, attributes } = parseFrontmatterFile(mainFilePath);
        result[entry.name] = { ...attributes, content, prompt: content };
      }
      return Object.keys(result).length > 0 ? result : undefined;
    },
    write(root, value, target) {
      const dirPath = options.dirPath(root);
      const changes: ArtifactChange[] = [];
      for (const [name, rawEntry] of Object.entries(value)) {
        const itemDir = path.join(dirPath, name);
        const { content, prompt, ...rest } = rawEntry as Record<string, any>;
        const bundles: Record<string, SupportFileBundle | undefined> = {};
        for (const bundleKey of bundleKeys) {
          bundles[bundleKey] = rest[bundleKey];
          delete rest[bundleKey];
        }
        const body = String(content ?? prompt ?? '').trim();
        const rendered = renderFrontmatterFile(rest, body);
        const change = buildFullOwnershipTextChange(
          target,
          root,
          path.join(itemDir, options.mainFileName),
          rendered,
        );
        if (change) changes.push(change);
        for (const [bundleKey, files] of Object.entries(bundles)) {
          const bundleDir = path.join(itemDir, bundleKey);
          for (const [relativePath, file] of Object.entries(files ?? {})) {
            const safePath = resolveSupportFilePath(bundleDir, relativePath);
            const bundleChange = buildFullOwnershipBinaryChange(
              target,
              root,
              safePath,
              bufferForSupportFile(file),
            );
            if (bundleChange) changes.push(bundleChange);
          }
        }
      }
      return changes;
    },
  };
}

/**
 * A single file whose content Jue owns via the `AI-JUE:START/END` managed
 * block, e.g. Claude Code's root `CLAUDE.md` (`context.global`).
 */
export function managedMarkdownFile(options: {
  filePath: (root: string) => string;
}): CapabilityMapping<string> {
  return {
    read(root) {
      const filePath = options.filePath(root);
      if (!fs.existsSync(filePath)) return undefined;
      return fs.readFileSync(filePath, 'utf8');
    },
    write(root, value, target) {
      const filePath = options.filePath(root);
      const change = buildManagedMarkdownArtifactChange(target, root, filePath, value);
      return change ? [change] : [];
    },
  };
}

/**
 * A JSON file Jue owns only a `key` within (or the whole file, when `key`
 * is omitted), deep-merged so unrelated keys survive, e.g. Claude Code's
 * `settings.json`/`hooks.json` `hooks` key or `.mcp.json`'s `mcpServers`.
 * `toCanonical`/`toNative` convert between the native JSON shape and the
 * Canonical value — this is where an Adapter's target-specific shape
 * knowledge lives, not in the generic engine.
 */
export function mergedJsonFile<T>(options: {
  filePath: (root: string) => string;
  key?: string;
  toCanonical?: (native: any) => T | undefined;
  toNative?: (canonical: T) => any;
}): CapabilityMapping<T> {
  return {
    read(root) {
      const filePath = options.filePath(root);
      if (!fs.existsSync(filePath)) return undefined;
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const native = options.key ? parsed[options.key] : parsed;
      if (native === undefined) return undefined;
      return options.toCanonical ? options.toCanonical(native) : (native as T);
    },
    write(root, value, target) {
      const filePath = options.filePath(root);
      const native = options.toNative ? options.toNative(value) : value;
      if (native === undefined) return [];
      const content = options.key ? { [options.key]: native } : native;
      const change = buildMergedJsonArtifactChange(target, root, filePath, content);
      return change ? [change] : [];
    },
  };
}
