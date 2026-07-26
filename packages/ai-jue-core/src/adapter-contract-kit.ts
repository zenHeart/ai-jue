import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { applyChangesOrThrow } from './core-executor';
import type { CanonicalDocument } from './canonical-document';
import type { ArtifactChange } from './artifact-change';

export interface AdapterReadContext {
  projectRoot: string;
  [key: string]: unknown;
}

export interface AdapterWriteContext {
  projectRoot: string;
  [key: string]: unknown;
}

export interface AdapterUnderTest {
  /** Short label used in test names, e.g. "claude-code". */
  target: string;
  read(context: AdapterReadContext): Promise<CanonicalDocument>;
  write(canonical: CanonicalDocument, context: AdapterWriteContext): Promise<ArtifactChange[]>;
}

export interface NativeFixtureCase {
  /** Test-name label, e.g. "project" or "plugin". */
  name: string;
  /** Path to a read-only native fixture directory. */
  root: string;
  readContext?: Record<string, unknown>;
  writeContext?: Record<string, unknown>;
  /** Runs before write() targets the fresh temp root, e.g. to pre-create a layout marker directory. */
  setupTempRoot?: (tempRoot: string) => void;
  /** Optional real native confirmation for this Artifact kind, e.g. `execFileSync('claude', ['plugin', 'validate', root, '--strict'])`. Throws on failure. */
  confirmNatively?: (root: string) => void | Promise<void>;
}

export interface UnmanagedFieldCase {
  /** Test-name label. */
  name: string;
  relativePath: string;
  seedContent: string | Buffer;
  assertPreserved: (finalContent: string) => void;
}

export interface SecurityRejectionCase {
  /** Test-name label. */
  name: string;
  root: string;
  readContext?: Record<string, unknown>;
  /** Substring expected in read()'s rejection message. */
  expectedErrorSubstring: string;
}

export interface AdapterContractSuiteOptions {
  adapter: AdapterUnderTest;
  /** A pre-normalized synthetic Canonical fixture (mirrored content/prompt, explicit hook `type`, etc. — the shape read() always produces). */
  syntheticCanonical: CanonicalDocument;
  nativeFixtures: NativeFixtureCase[];
  unmanagedFieldCases?: UnmanagedFieldCase[];
  securityRejectionCases?: SecurityRejectionCase[];
}

function freshTempDir(target: string, suffix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `jue-contract-${target}-${suffix}-`));
}

/**
 * Registers the six categories of Adapter contract test the Delivery Plan
 * requires of every target Agent (JUE-202): the two equivalence contracts,
 * idempotency, unmanaged-field preservation, sensitive-reference rejection,
 * and per-Artifact-kind native confirmation. An Adapter's own test suite
 * calls this with its `read`/`write` and fixtures instead of re-deriving the
 * same round-trip assertions by hand.
 */
export function defineAdapterContractSuite(options: AdapterContractSuiteOptions): void {
  const {
    adapter,
    syntheticCanonical,
    nativeFixtures,
    unmanagedFieldCases = [],
    securityRejectionCases = [],
  } = options;

  describe(`${adapter.target} adapter contract`, () => {
    it('normalize(read(write(C))) = normalize(C) for a synthetic Canonical fixture', async () => {
      const root = freshTempDir(adapter.target, 'synthetic');
      const changes = await adapter.write(syntheticCanonical, { projectRoot: root });
      applyChangesOrThrow(root, changes);
      const roundTripped = await adapter.read({ projectRoot: root });
      expect(roundTripped).toEqual(syntheticCanonical);
    });

    it('a second write() with the same synthetic Canonical produces zero changes (idempotent)', async () => {
      const root = freshTempDir(adapter.target, 'idempotent');
      applyChangesOrThrow(root, await adapter.write(syntheticCanonical, { projectRoot: root }));
      const second = await adapter.write(syntheticCanonical, { projectRoot: root });
      expect(second).toEqual([]);
    });

    for (const uc of unmanagedFieldCases) {
      it(`preserves unmanaged content in an existing "${uc.relativePath}" (${uc.name})`, async () => {
        const root = freshTempDir(adapter.target, `unmanaged-${uc.name}`);
        const absolute = path.join(root, uc.relativePath);
        fs.mkdirSync(path.dirname(absolute), { recursive: true });
        fs.writeFileSync(absolute, uc.seedContent);
        applyChangesOrThrow(root, await adapter.write(syntheticCanonical, { projectRoot: root }));
        uc.assertPreserved(fs.readFileSync(absolute, 'utf8'));
      });
    }

    for (const sc of securityRejectionCases) {
      it(`rejects a literal-looking credential ("${sc.name}")`, async () => {
        await expect(adapter.read({ projectRoot: sc.root, ...sc.readContext })).rejects.toThrow(
          sc.expectedErrorSubstring,
        );
      });
    }

    for (const fixture of nativeFixtures) {
      it(`normalize(read(write(read(N)))) = normalize(read(N)) for the "${fixture.name}" native fixture`, async () => {
        const nativeCanonical = await adapter.read({ projectRoot: fixture.root, ...fixture.readContext });
        const freshRoot = freshTempDir(adapter.target, fixture.name);
        fixture.setupTempRoot?.(freshRoot);
        applyChangesOrThrow(
          freshRoot,
          await adapter.write(nativeCanonical, { projectRoot: freshRoot, ...fixture.writeContext }),
        );
        const roundTripped = await adapter.read({ projectRoot: freshRoot, ...fixture.readContext });
        expect(roundTripped).toEqual(nativeCanonical);
      });

      if (fixture.confirmNatively) {
        it(`passes native confirmation for the "${fixture.name}" Artifact kind`, async () => {
          const nativeCanonical = await adapter.read({ projectRoot: fixture.root, ...fixture.readContext });
          const freshRoot = freshTempDir(adapter.target, `confirm-${fixture.name}`);
          fixture.setupTempRoot?.(freshRoot);
          applyChangesOrThrow(
            freshRoot,
            await adapter.write(nativeCanonical, { projectRoot: freshRoot, ...fixture.writeContext }),
          );
          await fixture.confirmNatively!(freshRoot);
        });
      }
    }
  });
}
