import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import {
  assertCapabilityRef,
  CapabilityRef,
} from 'ai-jue-core';
import { MergedConfig } from '../config';
import { mergeConfigWithLayeredContext } from '../merge';
import { loadAssetsFromDir, loadSkillFromDir } from '../preset';

export interface CapabilityLockEntry {
  converter: CapabilityRef['converter'];
  contentHash: string;
  locatorHash: string;
  sourceType: 'file' | 'npm' | 'github';
}

export interface CapabilitySourceOptions {
  cacheDir?: string;
  fetch?: typeof fetch;
  frozen?: boolean;
  mirrorDir?: string;
  /** `true` forces every Capability to bypass the cache; a name set scopes the bypass to those Capabilities only. */
  forceRefresh?: boolean | ReadonlySet<string>;
}

export interface LoadedCapabilities {
  config: MergedConfig;
  lock: { version: 1; capabilities: Record<string, CapabilityLockEntry> };
}

const SAFE_ARCHIVE_ENTRY = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$)).+$/;

function sha256(value: string | Buffer): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sourceType(source: string): CapabilityLockEntry['sourceType'] {
  return source.slice(0, source.indexOf(':')) as CapabilityLockEntry['sourceType'];
}

export function capabilityCacheDestination(
  ref: Pick<CapabilityRef, 'source' | 'ref' | 'path'>,
  cacheRoot: string,
): string {
  return path.join(
    cacheRoot,
    sourceType(ref.source),
    sha256(`${ref.source}\0${ref.ref || ''}\0${ref.path || ''}`),
  );
}

function extractedRoot(destination: string): string {
  const entries = fs
    .readdirSync(destination, { withFileTypes: true })
    .filter((entry) => entry.name !== 'source.tgz');
  return entries.length === 1 && entries[0].isDirectory()
    ? path.join(destination, entries[0].name)
    : destination;
}

function isPopulated(destination: string): boolean {
  return fs.existsSync(destination) && fs.readdirSync(destination).length > 0;
}

function safeChild(baseDir: string, relativePath: string): string {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, relativePath);
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) {
    throw new Error(`Capability path must stay inside its source: ${relativePath}`);
  }
  return target;
}

function runTar(args: string[], cwd?: string): string {
  const result = spawnSync('tar', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    throw new Error(`Unable to read Capability archive: ${result.stderr.trim()}`);
  }
  return result.stdout;
}

function extractArchive(archivePath: string, destination: string): string {
  const entries = runTar(['-tzf', archivePath])
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (entries.length === 0 || entries.some((entry) => !SAFE_ARCHIVE_ENTRY.test(entry))) {
    throw new Error('Capability archive contains an invalid or unsafe path');
  }
  const verboseEntries = runTar(['-tvzf', archivePath]).split('\n').filter(Boolean);
  if (verboseEntries.some((entry) => /^[lh]/.test(entry))) {
    throw new Error('Capability archive must not contain symbolic or hard links');
  }
  // Extract into a sibling temp directory and only rename it into place once
  // extraction fully succeeds. If the process dies mid-extraction (Ctrl-C, CI
  // timeout, OOM), `destination` itself is never created/touched, so a later
  // run's cache-hit check correctly treats it as missing instead of silently
  // trusting a truncated result forever.
  const tmpDestination = `${destination}.tmp-${process.pid}-${Date.now()}`;
  fs.mkdirSync(tmpDestination, { recursive: true });
  try {
    runTar(['-xzf', archivePath, '-C', tmpDestination]);
  } catch (error) {
    fs.rmSync(tmpDestination, { recursive: true, force: true });
    throw error;
  }
  fs.rmSync(destination, { recursive: true, force: true });
  fs.renameSync(tmpDestination, destination);
  return extractedRoot(destination);
}

function hashDirectory(rootDir: string): string {
  const hash = crypto.createHash('sha256');
  const visit = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const absolute = path.join(dir, entry.name);
      const relative = path.relative(rootDir, absolute).split(path.sep).join('/');
      hash.update(entry.isDirectory() ? `d:${relative}\0` : `f:${relative}\0`);
      if (entry.isDirectory()) visit(absolute);
      if (entry.isFile()) hash.update(fs.readFileSync(absolute));
    }
  };
  visit(rootDir);
  return hash.digest('hex');
}

function assertNoLiteralCredentials(value: unknown, location: string): void {
  const serialized = JSON.stringify(value);
  if (
    /:\/\/[^/@\s"]+:[^/@\s"]+@/.test(serialized) ||
    /[?&](?:access_?token|api_?key|auth|password|secret)=/i.test(serialized)
  ) {
    throw new Error(`${location} contains a literal credential`);
  }
  const record =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const env =
    record.env && typeof record.env === 'object' && !Array.isArray(record.env)
      ? (record.env as Record<string, unknown>)
      : {};
  for (const [name, envValue] of Object.entries(env)) {
    if (
      typeof envValue !== 'string' ||
      !/^\$\{[A-Z_][A-Z0-9_]*\}$/.test(envValue)
    ) {
      throw new Error(
        `${location} env ${name} must reference a runtime environment variable`,
      );
    }
  }
}

function resolveFile(ref: CapabilityRef, baseDir: string): string {
  const locator = ref.source.slice('file:'.length);
  if (!locator) throw new Error('file: Capability source must include a path');
  const resolved = path.resolve(baseDir, locator);
  if (!fs.existsSync(resolved)) {
    throw new Error('file: Capability source does not exist');
  }
  return resolved;
}

function resolveLocalNpmArchive(
  ref: CapabilityRef,
  baseDir: string,
  cacheDir: string,
): string | null {
  const locator = ref.source.slice('npm:'.length);
  if (!locator.startsWith('file:')) return null;
  const archivePath = path.resolve(baseDir, locator.slice('file:'.length));
  if (!fs.existsSync(archivePath) || !archivePath.endsWith('.tgz')) {
    throw new Error('Local npm Capability source must reference an existing .tgz file');
  }
  return extractArchive(archivePath, cacheDir);
}

function assertExactNpmSpecifier(specifier: string): void {
  const match = specifier.match(/^(?:@[^/]+\/[^@]+|[^@/]+)@([^@]+)$/);
  if (!match || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(match[1])) {
    throw new Error('npm: Capability source must include an exact version');
  }
}

function resolveNpm(
  ref: CapabilityRef,
  baseDir: string,
  cacheDir: string,
  options: CapabilitySourceOptions,
): string {
  const local = resolveLocalNpmArchive(ref, baseDir, cacheDir);
  if (local) return local;

  const specifier = ref.source.slice('npm:'.length);
  assertExactNpmSpecifier(specifier);
  if (!options.forceRefresh && isPopulated(cacheDir)) {
    return extractedRoot(cacheDir);
  }
  const packDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-jue-npm-pack-'));
  try {
    const result = spawnSync(
      'npm',
      ['pack', specifier, '--ignore-scripts', '--json', '--pack-destination', packDir],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    if (result.status !== 0) {
      throw new Error(`Unable to pack npm Capability: ${result.stderr.trim()}`);
    }
    const output = JSON.parse(result.stdout);
    const filename = output?.[0]?.filename;
    if (typeof filename !== 'string') {
      throw new Error('npm pack did not return an archive filename');
    }
    return extractArchive(path.join(packDir, filename), cacheDir);
  } finally {
    fs.rmSync(packDir, { recursive: true, force: true });
  }
}

async function resolveGithub(
  name: string,
  ref: CapabilityRef,
  cacheDir: string,
  options: CapabilitySourceOptions,
): Promise<string> {
  const repository = ref.source.slice('github:'.length);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error('github: Capability source must use owner/repository');
  }
  if (!ref.ref) {
    if (options.frozen) {
      throw new Error('Frozen resolution requires github: Capability sources to declare ref');
    }
    console.warn(
      '[WARN] A github: Capability has no pinned ref; resolving against the '
      + 'floating default branch. Pin a ref or run `jue apply --frozen` in CI.',
    );
  }
  const unpackedDir = path.join(cacheDir, 'unpacked');
  if (!options.forceRefresh && isPopulated(unpackedDir)) {
    return extractedRoot(unpackedDir);
  }
  const revision = ref.ref || 'HEAD';
  const fetchImpl = options.fetch || globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('github: Capability resolution requires a fetch implementation');
  }
  const response = await fetchImpl(
    `https://codeload.github.com/${repository}/tar.gz/${encodeURIComponent(revision)}`,
    { method: 'GET', redirect: 'error' },
  );
  if (!response.ok) {
    throw new Error(`Unable to fetch github: Capability archive (${response.status})`);
  }
  const archive = Buffer.from(await response.arrayBuffer());
  const archivePath = path.join(cacheDir, 'source.tgz');
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(archivePath, archive);
  return extractArchive(archivePath, path.join(cacheDir, 'unpacked'));
}

async function resolveSource(
  name: string,
  ref: CapabilityRef,
  baseDir: string,
  options: CapabilitySourceOptions,
): Promise<string> {
  const cacheRoot =
    options.cacheDir || path.join(os.homedir(), '.cache', 'ai-jue');
  const destination = capabilityCacheDestination(ref, cacheRoot);
  const mirrorDir = options.mirrorDir || process.env.AI_JUE_SOURCE_MIRROR_DIR;
  const mirrorArchive = mirrorDir
    ? path.join(mirrorDir, `${path.basename(destination)}.tgz`)
    : '';

  let root: string;
  if (mirrorArchive && fs.existsSync(mirrorArchive)) {
    root = extractArchive(mirrorArchive, destination);
  } else if (ref.source.startsWith('file:')) {
    root = resolveFile(ref, baseDir);
  } else if (ref.source.startsWith('npm:')) {
    root = resolveNpm(ref, baseDir, destination, options);
  } else {
    root = await resolveGithub(name, ref, destination, options);
  }
  const selected = ref.path ? safeChild(root, ref.path) : root;
  if (!fs.existsSync(selected)) {
    throw new Error('Capability source path does not exist');
  }
  return selected;
}

async function convertCapability(
  name: string,
  ref: CapabilityRef,
  sourceDir: string,
  userLanguage?: string,
): Promise<MergedConfig> {
  if (ref.converter === 'jue-native') {
    return loadAssetsFromDir(sourceDir, userLanguage);
  }
  if (ref.converter === 'agent-skill') {
    return loadSkillFromDir(name, sourceDir, userLanguage);
  }

  const manifestPath = fs.existsSync(path.join(sourceDir, 'mcp.json'))
    ? path.join(sourceDir, 'mcp.json')
    : path.join(sourceDir, 'package.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`mcp Capability "${name}" is missing mcp.json or package.json`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const declared =
    manifest.servers || manifest.mcp?.servers || manifest.ai?.mcp?.servers;
  const server =
    declared?.[name] ||
    (manifest.bin
      ? {
          command: 'npx',
          args: ['-y', manifest.name],
          ...(ref.config || {}),
        }
      : null);
  if (!server || typeof server.command !== 'string') {
    throw new Error(`mcp Capability "${name}" has no valid server declaration`);
  }
  assertNoLiteralCredentials(server, `mcp Capability "${name}"`);
  return { mcp: { servers: { [name]: server } } };
}

export async function loadCapabilityRefs(
  refs: unknown,
  baseDir: string,
  userLanguage?: string,
  options: CapabilitySourceOptions = {},
): Promise<LoadedCapabilities> {
  if (refs === undefined) {
    return { config: {}, lock: { version: 1, capabilities: {} } };
  }
  if (!refs || typeof refs !== 'object' || Array.isArray(refs)) {
    throw new Error('ai.capabilities must be an object');
  }

  let config: MergedConfig = {};
  const capabilities: Record<string, CapabilityLockEntry> = {};
  for (const name of Object.keys(refs as Record<string, unknown>).sort()) {
    const value = (refs as Record<string, unknown>)[name];
    assertCapabilityRef(name, value);
    const forceRefresh =
      options.forceRefresh instanceof Set
        ? options.forceRefresh.has(name)
        : Boolean(options.forceRefresh);
    const resolved = await resolveSource(name, value, baseDir, { ...options, forceRefresh });
    const converted = await convertCapability(name, value, resolved, userLanguage);
    config = mergeConfigWithLayeredContext(config, converted);
    capabilities[name] = {
      converter: value.converter,
      contentHash: hashDirectory(resolved),
      locatorHash: sha256(`${value.source}\0${value.ref || ''}\0${value.path || ''}`),
      sourceType: sourceType(value.source),
    };
  }
  return { config, lock: { version: 1, capabilities } };
}

export function mergeCapabilityLocks(
  ...locks: Array<LoadedCapabilities['lock']>
): LoadedCapabilities['lock'] {
  return {
    version: 1,
    capabilities: Object.assign({}, ...locks.map((lock) => lock.capabilities)),
  };
}
