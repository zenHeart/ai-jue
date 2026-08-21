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

## 7. Testing contract

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
