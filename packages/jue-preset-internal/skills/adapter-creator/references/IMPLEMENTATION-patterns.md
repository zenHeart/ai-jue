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

export async function read({ projectRoot }: ReadContext) {
  const canonical = readCapabilities({ rules: rules(), hooks: hooks() /* ... */ }, projectRoot);
  return toCanonicalDocument(canonical);
}
```

```typescript
// write.ts
import { writeCapabilities } from "ai-jue-core";
import { rules } from "./capabilities/rules";
import { hooks } from "./capabilities/hooks";
// ...

export async function write(canonical: CanonicalDocument, { projectRoot }: WriteContext) {
  return writeCapabilities({ rules: rules(), hooks: hooks() /* ... */ }, canonical, projectRoot, "{agent}");
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
- Test the two equivalence contracts from Phase 5 with
  `applyChangesOrThrow` (the real Core executor's throw-on-failure
  convenience, `packages/ai-jue-core/src/core-executor.ts`) — see
  `packages/ai-jue-adapter-claude/test/write.test.ts`.
- Test unmanaged-field preservation (an existing file's unrelated keys or
  prose survive a write) and idempotency (identical input on a second
  `write()` call produces `[]`).

## 8. Cursor dual layout

Cursor is the worked example for one Adapter that emits two native Artifact
kinds: a project tree and an installable Plugin. Detection, mapping, target-
private fields, fixtures, and confirmation all use the same resolved
`CursorArtifactKind`. One Adapter and one Canonical DSL serve both kinds.

### 8.1 Detect the Artifact before composing mappings

Keep native markers and path selection in
[`packages/ai-jue-adapter-cursor/src/capabilities/layout.ts`](../../../../ai-jue-adapter-cursor/src/capabilities/layout.ts).
The Plugin manifest is the stronger marker, so it wins when both markers are
present:

```typescript
if (fs.existsSync(path.join(root, ".cursor-plugin", "plugin.json"))) {
  return "plugin";
}
if (isProjectLayout(root)) return "project";
return undefined;
```

Both [`read.ts`](../../../../ai-jue-adapter-cursor/src/read.ts) and
[`write.ts`](../../../../ai-jue-adapter-cursor/src/write.ts) resolve one kind,
then pass it into the same mapping table:

```typescript
const mappings = {
  rules: rules(artifactKind),
  commands: commands(artifactKind),
  skills: skills(artifactKind),
  agents: agents(artifactKind),
  hooks: hooks(artifactKind),
  mcp: mcp(artifactKind),
};
```

### 8.2 Parameterize paths and native shapes

`componentRoot(root, artifactKind)` owns the shared `.cursor/` versus root
choice. Capability modules own only their native path or shape:

| Responsibility | Project Artifact | Plugin Artifact | Implementation |
| --- | --- | --- | --- |
| Rules, commands, skills, agents | `.cursor/<capability>/` | `<capability>/` | [`packages/ai-jue-adapter-cursor/src/capabilities/skills.ts`](../../../../ai-jue-adapter-cursor/src/capabilities/skills.ts) and sibling mappings |
| Hooks | `.cursor/hooks.json` with `{ version: 1, hooks }` | `hooks/hooks.json` with `{ hooks }` | [`packages/ai-jue-adapter-cursor/src/capabilities/hooks.ts`](../../../../ai-jue-adapter-cursor/src/capabilities/hooks.ts) |
| MCP | `.cursor/mcp.json` | `mcp.json` | [`packages/ai-jue-adapter-cursor/src/capabilities/mcp.ts`](../../../../ai-jue-adapter-cursor/src/capabilities/mcp.ts) |
| Global context | root `AGENTS.md` | — | [`packages/ai-jue-adapter-cursor/src/capabilities/context.ts`](../../../../ai-jue-adapter-cursor/src/capabilities/context.ts) |
| `tools.cursor` project settings | `.cursorignore`, `.cursorindexingignore`, `.cursor/settings.json` | — | [`packages/ai-jue-adapter-cursor/src/capabilities/cursor-tools.ts`](../../../../ai-jue-adapter-cursor/src/capabilities/cursor-tools.ts) |
| Plugin identity | — | `.cursor-plugin/plugin.json` | [`packages/ai-jue-adapter-cursor/src/capabilities/manifest.ts`](../../../../ai-jue-adapter-cursor/src/capabilities/manifest.ts) |

The hooks mapping chooses the native wrapper at serialization time:

```typescript
return artifactKind === "project" ? { version: 1, hooks } : { hooks };
```

Branch project-only data in
[`packages/ai-jue-adapter-cursor/src/write.ts`](../../../../ai-jue-adapter-cursor/src/write.ts)
after the shared mappings are composed. The project branch maps
`context.global` and project settings; the Plugin branch maps root capability
components and its manifest. An explicit warning surfaces incompatible
project-only input.

For Plugin output, Core resolves `tools.cursor.pluginManifest` into
`WriteContext.pluginManifest`. The manifest writer preserves its `variables`
schema as target-private data. The resolver
contract lives in
[`packages/ai-jue/src/artifact-kind.ts`](../../../../ai-jue/src/artifact-kind.ts),
and the emitted shape lives in
[`packages/ai-jue-adapter-cursor/src/capabilities/manifest.ts`](../../../../ai-jue-adapter-cursor/src/capabilities/manifest.ts).

### 8.3 Fixtures, contracts, and confirmation

Use all three shipped fixture roots documented in
[`packages/ai-jue-adapter-cursor/fixtures/README.md`](../../../../ai-jue-adapter-cursor/fixtures/README.md):

- `project/` covers the project tree;
- `plugin/` covers every Plugin component plus `variables`;
- `plugin-minimal/` proves a manifest plus one Skill is sufficient input.

Register each layout in the shared equivalence suite at
[`packages/ai-jue-adapter-cursor/test/contract.test.ts`](../../../../ai-jue-adapter-cursor/test/contract.test.ts).
Keep native-shape assertions focused in
[`packages/ai-jue-adapter-cursor/test/hooks-shape.test.ts`](../../../../ai-jue-adapter-cursor/test/hooks-shape.test.ts)
and
[`packages/ai-jue-adapter-cursor/test/plugin-manifest.test.ts`](../../../../ai-jue-adapter-cursor/test/plugin-manifest.test.ts).

Cursor confirmation uses structural evidence. Its
[`packages/ai-jue-adapter-cursor/src/confirm.ts`](../../../../ai-jue-adapter-cursor/src/confirm.ts)
collects structural evidence and returns `status: "unconfirmed"`; that status
remains distinct from native confirmation.
