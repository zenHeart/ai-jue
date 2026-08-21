# Capability-Mapping Engine + Domain-Decomposed Claude Adapter

> Status: Implemented.
> Scope: internal refactor of the Claude Code Adapter's Native ⇄ Canonical
> code (JUE-106/JUE-107), plus a reusable engine other Adapters (Codex,
> OpenClaw, Hermes — R3) can build on without re-deriving the same shapes.
> The runtime boundary is the Extension default export and Adapter methods.

## 1. Problem

`packages/ai-jue-adapter-claude/src/read.ts` (196 lines) and `write.ts` (319
lines) each hand-implement four native shapes that repeat across multiple
Canonical Capability types:

| Shape | Used by | Read | Write |
| --- | --- | --- | --- |
| Flat markdown directory (one `<name>.md` per item, frontmatter + body) | `rules`, `commands`, `agents` | parse frontmatter per file | render frontmatter per file |
| Directory-per-item (subdir with a main file + optional bundle files) | `skills` | parse `SKILL.md` + bundle | render `SKILL.md` + bundle |
| Managed-block single file (`AI-JUE:START/END` coexistence) | `context.global` → `CLAUDE.md` | read whole file, resolve `@import` | `computeManagedMarkdown` |
| Merged-keys JSON file (deep-merge, preserve unrelated keys) | `hooks` → `settings.json`/`hooks.json`, `mcp.servers` → `.mcp.json` | parse JSON, extract key | `computeMergedJson` |

Each shape's read and write functions are hand-maintained inverses of each
other (e.g. `toCanonicalHooks`/`toNativeHooks` in the current `write.ts`).
Nothing enforces that they stay inverses beyond test coverage and developer
discipline. Every future Agent Adapter (R3) would re-derive these same four
shapes from scratch, duplicating both the mechanics and the risk of drift.

The prior monolithic `index.ts` is the cautionary example of what happens when
this isn't factored: one large function handling every Capability type inline.

## 2. Decision (confirmed with user)

1. **Shared abstraction level**: a declarative mapping table + a generic
   read/write engine. Each Capability is declared once as a small
   `CapabilityMapping` value (a shape factory call, e.g.
   `flatMarkdownDirectory({ dirPath, fieldRenames })`); a generic engine
   iterates the table to produce a `CanonicalDocument` (read) or
   `ArtifactChange[]` (write). This makes read/write structurally
   inverse-by-construction instead of inverse-by-convention. Rejected
   alternatives: keeping read/write fully hand-written with only pure
   helpers shared (doesn't remove the drift risk); a textual/config-file DSL
   (adds a parser and a new "language" for no real gain over typed factory
   functions, and risks reading as an unreviewed 7th architecture concept).
2. **Location**: directly inside `ai-jue-core` (no new package). `ai-jue-core`
   is already the shared runtime dependency of every Adapter; the mapping
   engine is small enough (four factories + two generic functions) that a
   separate package would be overhead without a clear boundary win.

Both are internal implementation tooling for building Adapters — they do not
appear in Architecture/Specification as new public nouns, per AGENTS.md §6.3
("Adapter 是 Extension 内部...实现细节不进入公共术语表").

## 3. Design

### 3.1 `ai-jue-core/src/capability-mapping.ts` (new)

```ts
export interface CapabilityMapping<T = unknown> {
  read(root: string): T | undefined;
  write(root: string, value: T, target: string): ArtifactChange[];
}

export function readCapabilities(
  mappings: Record<string, CapabilityMapping>,
  root: string,
): Record<string, unknown>;

export function writeCapabilities(
  mappings: Record<string, CapabilityMapping>,
  canonical: Record<string, unknown>,
  root: string,
  target: string,
): ArtifactChange[];

export function flatMarkdownDirectory(options: {
  dirPath: (root: string) => string;
  fieldRenames?: Record<string, string>; // e.g. { globs: 'paths' }, applied read: native->canonical, write: canonical->native (inverse)
}): CapabilityMapping<Record<string, any>>;

export function directoryPerItem(options: {
  dirPath: (root: string) => string;
  mainFileName: string; // e.g. "SKILL.md"
  bundleKeys?: string[]; // e.g. ["references", "scripts", "assets"]
}): CapabilityMapping<Record<string, any>>;

export function managedMarkdownFile(options: {
  filePath: (root: string) => string;
}): CapabilityMapping<string>;

export function mergedJsonFile<T>(options: {
  filePath: (root: string) => string;
  key?: string; // e.g. "hooks" or "mcpServers"; omit to use the whole file
  toCanonical?: (native: any) => T;
  toNative?: (canonical: T) => any;
}): CapabilityMapping<T>;
```

Each factory is built on the existing pure primitives
(`computeManagedMarkdown`, `computeMergedJson`, `hashArtifactContent`,
`splitFrontmatter`) already in `ai-jue-core` — this is a composition layer
over them, not a reimplementation. `fieldRenames` is applied symmetrically
(read renames native→canonical key names; write renames back), which is
exactly what today's hand-written `paths`↔`globs` mapping does for rules,
generalized to any capability.

Idempotency (no-op when nothing changed) and hash computation happen once,
inside the engine, instead of being re-implemented in every
`build*Change` helper as today.

**Self-review note on `directoryPerItem` + skill bundle files:** bundle files
(`references`/`scripts`/`assets`) aren't part of any *other* mapping's shape,
so `directoryPerItem` owns that sub-case directly rather than factoring it
out further — avoids one extra layer of indirection for a shape used exactly
once.

### 3.2 `ai-jue-adapter-claude/src/capabilities/` (new directory)

One small file per Capability, each exporting one `CapabilityMapping`
instance (or, for `context`, a small hand-written pair — see below):

- `rules.ts` — `flatMarkdownDirectory` with `{ globs: 'paths' }` rename
- `commands.ts` — `flatMarkdownDirectory`
- `agents.ts` — `flatMarkdownDirectory`
- `skills.ts` — `directoryPerItem`
- `hooks.ts` — `mergedJsonFile` with Claude-specific `toCanonical`/`toNative`
  (the hook-shape conversion that is genuinely Claude-specific business
  logic, not generic mechanics)
- `mcp.ts` — `mergedJsonFile` with `toNative` doing the `project`-scope
  filter (documented limitation: `user`/`local` scope carried over verbatim,
  same carve-out as today)
- `layout.ts` — `isProjectLayout(root)` + `componentRoot(root, artifactKind)`,
  shared by `read.ts`/`write.ts`

**`context.ts` stays hand-written, not routed through the generic engine.**
It's the one shape with no sibling (nothing else does "resolve `@import`
syntax then treat as a managed block"), so forcing it through
`CapabilityMapping` would add a generic-interface wrapper around
one-off logic for no reuse benefit (YAGNI). It still reuses
`computeManagedMarkdown` directly, same as the mapping factories do
internally.

### 3.3 `read.ts` / `write.ts` become thin compositions

```ts
// read.ts (illustrative, ~35 lines total)
const mappings = { rules, commands, agents, skills, hooks, mcp }; // from capabilities/*
export async function read(context: ReadContext): Promise<CanonicalDocument> {
  const root = context.artifactRoot;
  const global = isProjectLayout(root) ? readContext(root) : undefined;
  return toCanonicalDocument({
    context: global !== undefined ? { global } : undefined,
    ...readCapabilities(mappings, root),
  });
}
```

`write.ts` mirrors this with `writeCapabilities(mappings, canonical, root,
'claude-code')` plus the one `context` special case.

### 3.4 Runtime boundary

`jue apply` loads the Extension default export and invokes the Adapter's
`write()` method. Core validates and executes the resulting `ArtifactChange[]`;
package-level generation functions are not part of the runtime contract.

## 4. Testing / migration plan

- Move `read.test.ts`/`write.test.ts` assertions over unchanged (same
  fixtures under `packages/ai-jue-adapter-claude/fixtures/`, same expected
  `CanonicalDocument`/`ArtifactChange[]` values) — this is a pure refactor,
  not a behavior change, so no existing assertion should need to change.
- Add new unit tests in `ai-jue-core` for the four factories directly
  (`flatMarkdownDirectory`, `directoryPerItem`, `managedMarkdownFile`,
  `mergedJsonFile`), independent of Claude Code specifics.
- Full gate rerun after the refactor: `npm test`, `npm run build`,
  `npm run check-consistency`, `npm --prefix packages/docs run docs:build`,
  `git diff --check`.

## 5. Reusable-asset writeback (jue-preset-internal)

- Rewrite `packages/jue-preset-internal/skills/adapter-creator/SKILL.md`
  (currently describes the pre-R1 `generate()`-only workflow with no mention
  of Canonical/read/write/confirm/fixtures) to describe the methodology this
  session actually executed for Claude Code: official capability discovery →
  neutral fixture construction → `read()` via capability-mapping table →
  `write()` via the same table → two equivalence contracts → native
  validation (`claude plugin validate`, headless `system/init`). Use Claude
  Code as the worked example throughout.
- Add one new rule under `packages/jue-preset-internal/rules/` (sibling to
  the existing `documentation-concept-budget` and
  `concise-functional-typescript` rules): prefer a shared capability-mapping
  factory over hand-rolled parse/serialize logic when a Capability's native
  shape matches an existing factory; only write bespoke logic for a shape
  with no sibling.
- Add a short "recommended pattern" note to
  `packages/docs/architecture/adapter-standardization.md` pointing at
  `capability-mapping.ts`, framed as optional guidance for Adapter authors,
  not a new architecture concept — and update the JUE-106/JUE-107 evidence
  file-path citations in `delivery-plan.md`/`implementation-status.md` (both
  locales) to the new `capabilities/` locations.

## 6. Self-review

- Placeholders: none left — every section has concrete file paths and
  function signatures, no "TBD".
- Internal consistency: the factory signatures in §3.1 match the actual
  primitives already in `ai-jue-core` today (`computeManagedMarkdown`,
  `computeMergedJson`, `hashArtifactContent`, `splitFrontmatter`); no new
  primitive is invented that doesn't already exist or isn't explicitly
  introduced here.
- Scope: bounded to the Claude Code Adapter's Native⇄Canonical code, the shared
  engine, and the Adapter method boundary consumed by `jue apply` (§3.4).
- Ambiguity: the two points that had genuine forks (abstraction level,
  package location) were resolved with the user before writing this spec;
  the two smaller judgment calls (`context.ts` staying hand-written,
  `capability-mapping.ts` staying one file until it earns a split) are
  flagged inline as my recommendation, easy to override.
