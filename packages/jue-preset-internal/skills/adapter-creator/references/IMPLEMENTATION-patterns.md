# Adapter Implementation Patterns

Concrete code patterns for the capability-mapping engine described in
`SKILL.md` Phases 3–4. Worked example:
`packages/ai-jue-adapter-claude/src/capabilities/`.

## 1. Package layout

```text
packages/ai-jue-adapter-{agent}/src/
  capabilities/
    layout.ts       # native "layout" detection (e.g. project vs. Plugin), if the agent has more than one
    context.ts       # any one-off shape with no sibling capability (only if genuinely needed)
    rules.ts          # one small file per Canonical Capability
    commands.ts
    agents.ts
    skills.ts
    hooks.ts           # agent-specific shape knowledge lives here, not in the engine
    mcp.ts
  read.ts               # thin composition: build the mapping table, call readCapabilities()
  write.ts               # thin composition: build the same table, call writeCapabilities()
```

`read.ts`/`write.ts` should stay small (Claude's are ~30–50 lines each).
If either grows past that, the shape-specific logic almost certainly
belongs in a `capabilities/*.ts` file instead.

## 2. Declaring a flat-markdown-directory Capability

For a Capability where the agent stores one `<name>.md` file per item
(frontmatter + body) — e.g. rules, commands, agents:

```typescript
// capabilities/rules.ts
import path from "path";
import { flatMarkdownDirectory } from "ai-jue-core";
import type { CapabilityMapping } from "ai-jue-core";

export function rules(): CapabilityMapping<Record<string, any>> {
  return flatMarkdownDirectory({
    dirPath: (root) => path.join(root, ".{agent}/rules"),
    // Canonical field name -> native frontmatter key, applied both ways.
    fieldRenames: { globs: "paths" },
  });
}
```

## 3. Declaring a directory-per-item Capability (with attachments)

For skills-style Capabilities: one directory per item, a main file, plus
optional attachment bundles.

```typescript
// capabilities/skills.ts
import path from "path";
import { directoryPerItem } from "ai-jue-core";

export function skills() {
  return directoryPerItem({
    dirPath: (root) => path.join(root, ".{agent}/skills"),
    mainFileName: "SKILL.md",
    bundleKeys: ["references", "scripts", "assets"],
  });
}
```

## 4. Declaring a merged-JSON Capability with agent-specific shape

For a Capability whose native representation needs translation (not just a
field rename) — e.g. hooks, MCP servers — inject the translation as
`toCanonical`/`toNative` callbacks. The generic engine never learns
agent-specific shapes; it only owns the file-merge mechanics.

```typescript
// capabilities/hooks.ts
import path from "path";
import { mergedJsonFile } from "ai-jue-core";

function toCanonicalHooks(native: NativeHookShape): CanonicalHookShape { /* ... */ }
function toNativeHooks(canonical: CanonicalHookShape): NativeHookShape { /* ... */ }

export function hooks() {
  return mergedJsonFile({
    filePath: (root) => path.join(root, ".{agent}/settings.json"),
    key: "hooks",
    toCanonical: toCanonicalHooks,
    toNative: toNativeHooks,
  });
}
```

## 5. Composing `read()`/`write()`

```typescript
// read.ts
import { readCapabilities, toCanonicalDocument } from "ai-jue-core";
import { rules } from "./capabilities/rules";
import { hooks } from "./capabilities/hooks";
// ...

export async function read({ artifactRoot }: ReadContext) {
  const canonical = readCapabilities({ rules: rules(), hooks: hooks() /* ... */ }, artifactRoot);
  return toCanonicalDocument(canonical);
}
```

```typescript
// write.ts
import { writeCapabilities } from "ai-jue-core";
import { rules } from "./capabilities/rules";
import { hooks } from "./capabilities/hooks";
// ...

export async function write(canonical: CanonicalDocument, { artifactRoot }: WriteContext) {
  return writeCapabilities({ rules: rules(), hooks: hooks() /* ... */ }, canonical, artifactRoot, "{agent}");
}
```

## 6. A one-off shape with no sibling: hand-write it

Not every Capability fits a shared factory. Claude Code's `context.global`
resolves an `@import` syntax unique to its memory system — nothing else in
the adapter shares that shape, so it stays a small hand-written
`CapabilityMapping`, reusing `managedMarkdownFile`'s `write` directly rather
than duplicating the managed-block logic:

```typescript
// capabilities/context.ts
import { managedMarkdownFile } from "ai-jue-core";

export function context() {
  const managed = managedMarkdownFile({ filePath: (root) => path.join(root, "CLAUDE.md") });
  return {
    read(root: string) { /* custom @import resolution, then extractManagedContent */ },
    write: managed.write, // reuse the generic engine unchanged
  };
}
```

Force a shape through the generic engine only when a sibling Capability
already uses the same shape — otherwise the wrapper adds ceremony without
reuse (YAGNI).

## 7. Dual layout (Cursor)

Cursor has two native Artifact kinds. Detect the kind from the Artifact
root, then parameterize every mapping — do not copy `read.ts`/`write.ts`.

Worked implementation: `packages/ai-jue-adapter-cursor/src/capabilities/`.
Contract fixtures: `packages/ai-jue-adapter-cursor/fixtures/`
(`project/`, `plugin/`, `plugin-minimal/`). Agent profile:
`packages/docs/agents/cursor.md`.

1. **Detect kind before assuming `.cursor/`.**
   `detectArtifactKind` in `layout.ts` checks
   `.cursor-plugin/plugin.json` first, then `.cursor/`. A root with
   neither marker is not a managed Cursor layout.

2. **One component root per kind.**
   `componentRoot(root, "project")` is `<root>/.cursor`.
   `componentRoot(root, "plugin")` is `<root>` itself (rules, skills,
   commands, agents, hooks live at the plugin root).

3. **Parameterize capabilities.**
   `skills(artifactKind)`, `hooks(artifactKind)`, and siblings take the
   detected kind so `dirPath` / `filePath` stay one declaration.

4. **Hooks have two native envelopes.**
   Project writes `{ version: 1, hooks }`. Plugin writes `{ hooks }`.
   Event names stay in the Cursor mapping; do not invent a second hook
   Capability.

5. **Context and Cursor-only tools are project-only.**
   `context.ts` manages root `AGENTS.md`. Plugin apply does not emit
   `context.global`. `tools.cursor` stays Adapter-private.

6. **Manifest is Plugin identity, not a Canonical Capability.**
   `manifest.ts` writes `.cursor-plugin/plugin.json` from
   `tools.cursor.pluginManifest` and `variables`. Team marketplace index
   generation is a separate Artifact decision.

7. **Confirm is structural only.**
   There is no official headless Cursor validate CLI. `confirm()` reports
   `unconfirmed` with structural evidence. Do not treat a second apply
   or a parseable `plugin.json` as native confirmation.

```typescript
// capabilities/layout.ts — detect, then select the component root
export function detectArtifactKind(root: string): "project" | "plugin" | undefined {
  if (existsSync(join(root, ".cursor-plugin", "plugin.json"))) return "plugin";
  if (existsSync(join(root, ".cursor"))) return "project";
  return undefined;
}

export function componentRoot(root: string, artifactKind: "project" | "plugin"): string {
  return artifactKind === "project" ? join(root, ".cursor") : root;
}
```

## 8. Testing contract

- Unit test each `capabilities/*.ts` mapping directly (read/write/round-trip)
  independent of the fixtures, the way
  `packages/ai-jue-core/src/capability-mapping.test.ts` tests the four
  factories themselves.
- Test `read()`/`write()` against every fixture from Phase 2, not just a
  happy-path sample.
- Register the Phase 5 contracts with `defineAdapterContractSuite` from
  `ai-jue-core/testkit`; pass `testApi: { describe, expect, it }` imported by
  the test from `vitest`. The shared suite uses `applyChangesOrThrow`, the real
  Core executor's throw-on-failure convenience. See
  `packages/ai-jue-adapter-claude/test/contract.test.ts`.
- Test unmanaged-field preservation (an existing file's unrelated keys or
  prose survive a write) and idempotency (identical input on a second
  `write()` call produces `[]`).
- Register at least one `securityRejectionCases` fixture that rejects a
  literal MCP env value via `assertNoLiteralCredentials`. Add Adapter-specific
  failure samples (path-escaping hook commands fail; unknown hook events
  pass through and are documented). Cursor samples:
  `packages/ai-jue-adapter-cursor/fixtures/failures/`.
