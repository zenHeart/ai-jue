import fs from 'fs';
import path from 'path';
import {
  assertExtensionDefinition,
  type Adapter,
  type ExtensionDefinition,
} from 'ai-jue-core';

export interface ExtensionPackageIssue {
  code: 'missing-entry' | 'missing-peer-dependency';
  message: string;
}

export interface ResolvedExtensionPackage {
  packageJsonPath: string;
  entryPath: string;
  issues: ExtensionPackageIssue[];
}

function resolveEntryRelativePath(packageJson: Record<string, unknown>): string | undefined {
  const exportsField = packageJson.exports;
  if (typeof exportsField === 'string') return exportsField;
  if (exportsField && typeof exportsField === 'object' && !Array.isArray(exportsField)) {
    const dotExport = (exportsField as Record<string, unknown>)['.'];
    if (typeof dotExport === 'string') return dotExport;
    if (dotExport && typeof dotExport === 'object') {
      const conditional = dotExport as Record<string, unknown>;
      const candidate = conditional.require ?? conditional.default ?? conditional.import;
      if (typeof candidate === 'string') return candidate;
    }
  }
  return typeof packageJson.main === 'string' ? packageJson.main : undefined;
}

function findOwningPackageJson(entryPath: string): string {
  let current = path.dirname(entryPath);
  while (true) {
    const candidate = path.join(current, 'package.json');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(`Cannot find package.json owning Extension entry: ${entryPath}`);
    }
    current = parent;
  }
}

function resolveExtensionLocation(
  pathOrPackage: string,
  baseDir: string,
): { packageJsonPath: string; resolvedEntryPath?: string } {
  const localPath = path.resolve(baseDir, pathOrPackage);
  const localPackageJson = path.join(localPath, 'package.json');
  if (fs.existsSync(localPackageJson)) {
    return { packageJsonPath: localPackageJson };
  }

  // Resolve only the package's public entry. Package `exports` intentionally
  // may hide package.json, so metadata discovery must not require a private
  // `./package.json` subpath export.
  const resolvedEntryPath = require.resolve(pathOrPackage, { paths: [baseDir] });
  return {
    packageJsonPath: findOwningPackageJson(resolvedEntryPath),
    resolvedEntryPath,
  };
}

/**
 * Validates an Extension package's npm metadata without executing its entry:
 * `exports`/`main` must resolve to an existing file, and `peerDependencies`
 * must declare a compatible `ai-jue-core` range. This reuses npm's own
 * package.json fields (per the "no Jue-specific manifest" rule) instead of
 * inventing an Extension manifest.
 */
export function resolveExtensionPackage(
  pathOrPackage: string,
  baseDir: string = process.cwd(),
): ResolvedExtensionPackage {
  const { packageJsonPath, resolvedEntryPath } = resolveExtensionLocation(pathOrPackage, baseDir);
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const packageDir = path.dirname(packageJsonPath);
  const issues: ExtensionPackageIssue[] = [];

  const entryRelative = resolveEntryRelativePath(packageJson);
  let entryPath = resolvedEntryPath ?? '';
  if (!resolvedEntryPath && !entryRelative) {
    issues.push({ code: 'missing-entry', message: 'Extension package.json is missing `exports` or `main`' });
  } else if (!resolvedEntryPath && entryRelative) {
    entryPath = path.resolve(packageDir, entryRelative);
    if (!fs.existsSync(entryPath)) {
      issues.push({ code: 'missing-entry', message: `Resolved entry does not exist: ${entryPath}` });
    }
  }

  const peerVersion = packageJson.peerDependencies?.['ai-jue-core'];
  if (typeof peerVersion !== 'string' || !peerVersion.trim()) {
    issues.push({
      code: 'missing-peer-dependency',
      message: 'Extension package.json must declare peerDependencies["ai-jue-core"]',
    });
  }

  return { packageJsonPath, entryPath, issues };
}

function disallowedSideEffectMessage(api: string): string {
  return `Extension entry performed a disallowed side effect during import: ${api}`;
}

function guardMethod(target: Record<string, any> | undefined, method: string, restores: Array<() => void>): void {
  if (!target || typeof target[method] !== 'function') return;
  const original = target[method];
  target[method] = () => {
    throw new Error(disallowedSideEffectMessage(method));
  };
  restores.push(() => {
    target[method] = original;
  });
}

const FS_WRITE_METHODS = [
  'writeFile', 'writeFileSync', 'appendFile', 'appendFileSync',
  'unlink', 'unlinkSync', 'rm', 'rmSync', 'rmdir', 'rmdirSync',
  'mkdir', 'mkdirSync', 'rename', 'renameSync', 'chmod', 'chmodSync',
  'copyFile', 'copyFileSync',
];
const FS_PROMISES_WRITE_METHODS = [
  'writeFile', 'appendFile', 'unlink', 'rm', 'rmdir', 'mkdir', 'rename', 'chmod', 'copyFile',
];
const CHILD_PROCESS_METHODS = ['exec', 'execSync', 'execFile', 'execFileSync', 'spawn', 'spawnSync', 'fork'];

/**
 * Patches the process-global `fs`/`child_process`/`process.exit`/`fetch`
 * surfaces so a disallowed call during `fn()` throws instead of executing,
 * then restores every patch in `finally` regardless of outcome. This is
 * in-process guard-rail isolation — it blocks disallowed calls made through
 * the require chain, not CPU/memory exhaustion or a native addon bypassing
 * these modules entirely. A stronger OS/VM sandbox is tracked separately.
 */
function withImportGuards<T>(fn: () => T): T {
  const fsModule = require('fs') as typeof fs;
  const cp = require('child_process') as Record<string, any>;
  const restores: Array<() => void> = [];

  FS_WRITE_METHODS.forEach((method) => guardMethod(fsModule as any, method, restores));
  FS_PROMISES_WRITE_METHODS.forEach((method) => guardMethod(fsModule.promises as any, method, restores));
  CHILD_PROCESS_METHODS.forEach((method) => guardMethod(cp, method, restores));

  const originalExit = process.exit;
  process.exit = (() => {
    throw new Error(disallowedSideEffectMessage('process.exit'));
  }) as never;
  restores.push(() => {
    process.exit = originalExit;
  });

  const globalWithFetch = globalThis as { fetch?: typeof fetch };
  if (typeof globalWithFetch.fetch === 'function') {
    const originalFetch = globalWithFetch.fetch;
    globalWithFetch.fetch = (() => {
      throw new Error(disallowedSideEffectMessage('fetch'));
    }) as typeof fetch;
    restores.push(() => {
      globalWithFetch.fetch = originalFetch;
    });
  }

  try {
    return fn();
  } finally {
    restores.forEach((restore) => restore());
  }
}

/**
 * Loads an Extension entry's default export with import-time side effects
 * guarded, then validates it as an `ExtensionDefinition`. The require cache
 * entry is cleared before and after so repeated validation calls always
 * re-run the entry's top-level code.
 */
export function loadExtensionGuarded(entryPath: string): ExtensionDefinition {
  const resolvedPath = require.resolve(entryPath);
  delete require.cache[resolvedPath];
  let moduleExports: any;
  try {
    moduleExports = withImportGuards(() => require(resolvedPath));
  } finally {
    delete require.cache[resolvedPath];
  }
  const definition = moduleExports?.default;
  assertExtensionDefinition(definition);
  return definition;
}

/**
 * Loads the single Adapter represented by an `ai-jue-adapter-*` package.
 * Apply targets one Agent at a time, so a multi-Adapter package is ambiguous
 * until an explicit Extension-level selection contract exists.
 */
export function loadExtensionAdapterGuarded(entryPath: string): Adapter {
  const definition = loadExtensionGuarded(entryPath);
  if (definition.adapters.length !== 1) {
    throw new Error(
      `Apply requires an Extension entry with exactly one Adapter; received ${definition.adapters.length}`,
    );
  }
  return definition.adapters[0];
}
