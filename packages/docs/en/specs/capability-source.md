# Specification: Capability Source

> Status: Implemented
> Owner workspace: **ai-jue** (this repository)
> Consumer: any Preset repository (declares references only; does not implement resolution)
> Updated: 2026-07-25

## 0. Terminology

Jue exposes exactly three concepts to users:
`Capability → Preset → Adapter` (see
[jue-mvp.md §1](jue-mvp.md)). This vocabulary aligns with MCP's own
`capabilities` protocol instead of inventing another term.

**Capability Source** is not a fourth peer concept. It is the reference protocol
described by `ai.capabilities`, through which a Preset declares that Capability
content comes from an external third-party source. After resolution and
conversion, the result is still a Capability—one of `skills` / `agents` /
`commands` / `rules` / `hooks` / `mcp.servers`—and no new asset type is created:

- **Capability**: one of the fixed six atomic capabilities in the Canonical
  Model, exactly as defined in
  [canonical-model.md](canonical-model.md).
- **Capability Source**: the external Capability content-reference protocol
  expressed by `ai.capabilities`, and the subject of this specification.
- **Preset**: the only composition and distribution unit; see §1.1.

## 1. Why this specification exists

Today's Agent Skill and MCP ecosystems do **not support nested composition**.
Jue's differentiation is not “inventing another skill format,” but:

> **Presets compose recursively and can directly reference third-party
> Capability content from GitHub, URL, local, or npm sources, converting it into
> the Canonical Model.**

This specification defines only the input-side capability that the **ai-jue
engine must provide**. Capability authoring and scenario Preset decomposition
belong to each Preset repository.

`ai.capabilities` is not a separate new top-level concept in `ai.config.js`. It
is a sibling of `ai.presets` in **any Preset manifest**. A Preset is already an
npm package whose manifest is naturally `package.json` → `ai`, where
`ai.presets` is already used. The project-root `ai.config.js` is effectively the
outermost Preset manifest (`cosmiconfig` already includes `package.json` in its
`searchPlaces`). The same `ai.capabilities` schema therefore serves both
locations; end users and Preset authors do not need separate fields.

### 1.1 Preset is the only composition/distribution unit; Capability references are leaves

The final capability set of a manifest—either a Preset's `package.json` or the
project-root `ai.config.js`—comes from three **independent** inputs, merged in
the order defined by §5:

1. assets in its own directory (`loadAssetsFromDir`, existing);
2. recursively expanded nested Presets (`ai.presets`, existing: dependencies
   first, self overrides, cycle detection);
3. individually expanded Capability references (`ai.capabilities`, introduced
   here).

The third input is a **leaf and is not recursive**. Content resolved from one
`CapabilityRef` is converted or loaded once. Its own `ai.presets` or
`ai.capabilities` declarations are never expanded—even if
`converter: jue-native` fetches a complete Jue directory. That converter runs
only `loadAssetsFromDir` for the directory's own assets, never
`loadPresetRecursive`. Nesting always belongs to `ai.presets`;
`ai.capabilities` does not reimplement it.

There is no independent Plugin/Capability package layer. Exactly two
composition mechanisms exist: Preset nesting and Capability references. There
is no third mechanism.

### 1.2 Capability references are an escape hatch, not a required mechanism

Anything `ai.capabilities` can do could, in principle, be achieved by manually
converting third-party content into a Jue-compatible Preset and referencing it
through existing `ai.presets`. That path already works without new code.
`ai.capabilities` exists solely to avoid the manual wrapper: users should not
need a dedicated `jue-preset-*` shell merely to reference one skill from a
third-party repository or one npm MCP package.

It improves convenience rather than expressive power. This is why it must
remain a non-nesting leaf. Allowing it to nest would overlap with
`ai.presets` and violate the boundary of exactly two composition mechanisms.

This rule also prevents future designs from splitting every skill into an
independent npm package, which would make governance costs unmanageable.
Capability Source does not introduce a third composition form.

## 2. Boundary

| Owner | Does | Does not |
|---|---|---|
| **ai-jue** | Resolves sources, converts them, merges into Canonical, manages locks/cache, distributes through Adapters | Own business Capability content or perform asset governance |
| **Preset repository** | Maintains first-party Capabilities, authors scenario Presets, declares third-party references | Implement resolver, converter, or lock logic |

Alignment with the existing three layers:

```text
Capability Source  →  Converter  →  Canonical Capability  →  Adapter
       ↑ new input side              (existing)             (existing output side)
```

**Explicit non-goals for this phase:**

- special resolution for scoped npm Presets (not core);
- Preset Registry or remote marketplace;
- automatically executing downloaded skill `scripts/`;
- performing input conversion inside Adapter packages.

## 3. Code locations (extend existing packages only)

```text
packages/docs/specs/capability-source.md      # this protocol
packages/ai-jue-core/src/capability-source.*  # Source / CapabilityRef types and validation
packages/ai-jue/src/capability-source/
  resolve.ts                                  # github | url | file | npm → local cache path
  load.ts                                     # load + converter + merge into MergedConfig
  converters/
    agent-skill.ts                            # Agent Skills directory → skills[name]
    mcp.ts                                    # MCP package / mcp.json fragment → mcp.servers
packages/ai-jue/src/preset.ts                 # load and merge ai.capabilities
packages/ai-jue/src/resolver.ts               # include capability source layer in final merge, if needed
```

Do **not** create an `ai-jue-adapter-input-*` package; input conversion is not an
Adapter. Do **not** place this logic in `jue-preset-*` or a specific Preset
repository.

## 4. Minimal user surface (MVP)

Preset manifests and `ai.config.js` add `ai.capabilities` beside existing
`ai.presets`, in the same `ai` namespace.

The primary use is not third-party referencing. It is sharing one local
Capability between multiple scenario Presets in the same repository without
physical duplication. The body is maintained once under
`capabilities/skills/<name>`, and each scenario Preset deduplicates it through
a `file:` reference:

```json
{
  "ai": {
    "presets": [],
    "capabilities": {
      "shared-review": {
        "source": "file:../../capabilities/skills/shared-review",
        "converter": "agent-skill"
      }
    }
  }
}
```

Third-party GitHub and npm references extend the same mechanism. Only the
`source` protocol changes:

```json
{
  "ai": {
    "presets": ["base"],
    "capabilities": {
      "doc-coauthoring": {
        "source": "github:example/skills",
        "ref": "v1.2.3",
        "path": "skills/example-skill",
        "converter": "agent-skill"
      },
      "filesystem": {
        "source": "npm:@example/mcp-server@1.2.3",
        "converter": "mcp",
        "config": { "args": ["${WORKSPACE_ROOT}"] }
      }
    }
  }
}
```

A `skill`, `agent`, or `command` should normally live directly in the one
Preset that owns it. That zero-configuration path is already supported by
`loadAssetsFromDir`; it does not need `ai.capabilities`. Use this field only
when the same Capability is shared by **two or more** Presets or comes from a
third party. MCP is the exception: an MCP server is usually cross-scenario
infrastructure and naturally fits an independent declaration rather than one
business-scenario Preset.

### 4.1 Source forms required by MVP

| Source | Example | Priority |
|---|---|---|
| `file:` | `file:./vendor/skills/foo` | P0 |
| `github:` | `github:owner/repo` + `ref` + `path` | P0 |
| `npm:` | `npm:pkg@version` (MCP or package containing `SKILL.md`) | P0 |
| `url:` | `https://.../archive` or one file | P1 (reserved; can follow later) |

### 4.2 Converters (MVP)

| Converter | Input | Canonical output key |
|---|---|---|
| `agent-skill` | Directory containing `SKILL.md`, optionally references/scripts/assets | `skills.<name>` |
| `mcp` | npm MCP package or `{ servers: {...} }` fragment | `mcp.servers.<name>` |
| `jue-native` | Capability directory already following Jue conventions | Corresponding section |

An unrecognized format must **fail with an error**, never skip silently.

`jue-native` calls only `loadAssetsFromDir` for the directory's own assets. It
does **not** call `loadPresetRecursive` and therefore never expands
`ai.presets` or `ai.capabilities` found in that directory. This follows §1.1:
a Capability reference is a leaf and does not reimplement nesting. If
third-party content itself needs nested Presets, authors should convert it into
a real `ai.presets` reference instead of expecting `jue-native` to expand it.

## 5. Loading order (extension of existing behavior)

Preserve current recursive Preset semantics and add Capability Source
resolution after or alongside the current directory assets:

1. recursively load `ai.presets` (existing: dependencies first, self overrides,
   cycle detection);
2. resolve and load the current Preset's `ai.capabilities`;
3. run `loadAssetsFromDir(presetPath)` (existing);
4. merge project `.ai/` → root `AGENTS.md` → `extends` → inline config
   (existing);
5. resolve the project-root `ai.config.js` (or `package.json` → `ai`)
   `ai.capabilities` through the same resolver/converter used by step 2. The
   project root is simply the outermost Preset manifest.

For duplicate Capability names, a later layer overrides an earlier layer,
matching existing deep-merge behavior.

## 6. Lock and cache (fixed decisions, not implementation-time choices)

- **Cache**: use the global content-addressed cache
  `~/.cache/ai-jue/<source-type>/<sha256(source+ref+path)>`. Do not offer a
  project `.jue/cache/` alternative. This avoids duplicate downloads when
  projects share third-party Capability content and matches npm's global cache
  model.
- **Lock file**: use JSON file `ai-jue.lock` at project root beside
  `ai.config.js`. Record only `sourceType`, `contentHash`, `locatorHash`, and
  `converter`; do not copy raw URLs, npm specs, private paths, or credentials.
  The local Preset manifest remains the sole source of truth for raw
  references. The name matches the `ai-jue` CLI package and avoids collision
  with another tool's generic `jue.lock`.

  The lock is a **write-only audit artifact**. Normal resolution (`jue apply`
  and Preset loading) never reads it to determine behavior. Only
  `jue capability update` reads it back after writing to report which
  references were actually updated. If no `ai.capabilities` were resolved,
  remove an existing `ai-jue.lock` so stale state cannot be mistaken for a
  recent update.
- **Duplicate Capability conflicts**: do **not** implement npm-style semver
  range solving. `ai.capabilities` references content, not an executable
  dependency tree. Later references override earlier ones according to Preset
  recursion order, matching existing Capability deep merge. State this reason
  explicitly to prevent accidental version-solver complexity.
- **Floating references**: when `github:` omits `ref`, normal `jue apply` warns
  and continues; `jue apply --frozen` fails for CI. `npm:` must include an exact
  version; omission is a validation error, not a warning.
- **Update command**: `jue capability update [name]` re-resolves sources and
  rewrites `ai-jue.lock`; no argument updates all references. `jue apply` does
  not force a network refresh: cached `github:`/`npm:` content under
  `~/.cache/ai-jue/...` is reused without a request. Network access occurs only
  on a cache miss or forced refresh. Extract into a sibling temporary directory
  and atomically rename it into the cache so interruption by Ctrl-C, CI timeout,
  or OOM cannot leave a partial extraction that later runs trust as valid.

## 7. Security (mandatory)

- Downloading is not execution: a successful resolve never runs `scripts/`.
- MCP surfaces command, environment-variable **names**, and network intent; it
  never writes plaintext secrets.
- URL sources should require integrity; GitHub sources should pin a commit/tag.
- A Converter performs format conversion without network side effects.

## 8. Acceptance criteria for implementers

1. Cross-link this specification with `creating-a-preset.md` and
   `architecture.md`.
2. A local third-party Agent Skill directory referenced through `file:` and
   `agent-skill` enters `skills.*`, preserving relative paths under
   `references/`.
3. `github:` + `path` can fetch a Skill subdirectory and write the lock.
4. An `npm:` MCP package enters `mcp.servers`; Adapter output still follows the
   existing MCP path.
5. When Preset A has `ai.presets: [B]` and both A and B declare capabilities,
   merge and override semantics are testable.
6. Cyclic Presets and unknown converters still fail.
7. Existing `smoke:preset-local`, base, and internal smoke tests do **not**
   regress.
8. `ai-jue.lock` follows the fixed name/path in §6; `jue apply --frozen` fails
   for floating `github:` without `ref`; `npm:` without an exact version fails
   validation rather than warning.

## 9. Non-goals (owned by the Preset workspace)

- splitting business-scenario content for a private composite Preset;
- discovery, redaction, rubric, or human promotion of Capability content;
- instance operations under `deployments/`.

A Preset repository only needs to declare `ai.capabilities` according to this
specification; it must not copy third-party bodies.

## 10. Suggested implementation slices (for another workspace)

| Slice | Content | Estimate |
|---|---|---|
| S0 | Review and accept this specification + core types | Small |
| S1 | `file:` + `agent-skill` converter + unit tests, including two Presets sharing one local Capability without physical copies | Medium |
| S2 | `github:` resolution + minimal lock/cache | Medium |
| S3 | `npm:` + `mcp` converter | Medium |
| S4 | Integrate into `preset.ts` loading chain + docs + smoke | Medium |

Priority: **S0 → S1 → S4 (complete local flow first) → S2 → S3**.
