# Glossary

Entries are ordered by conceptual dependency, not alphabetically: first the
three core concepts Jue exposes to users (Capability → Preset → Adapter),
then the internal structure that carries them (Canonical Model) and its two
non-atomic fields (`context.global`, `tools.<tool>`), and finally the
content-reference protocol and the reverse command (Capability Source,
`jue format`).

> Every public specification has a corresponding English document. See the
> [specification index](../specs/index.md) for the complete set.

## Capability {#capability}

A Capability is the smallest atomic asset an Agent can use, fixed to six types: `skills` / `agents` / `commands` / `rules` / `hooks` / `mcp.servers`.

This is the first of the three concepts Jue exposes to users (the other two are [Preset](#preset) and [Adapter](#adapter)). The word choice deliberately aligns with MCP's own `capabilities` / "Capability Negotiation" protocol vocabulary, and with Anthropic's Agent Skills docs ("extend Claude's capabilities") — it is not a term Jue invented. [`context.global`](#context-global) (global context) and [`tools.<tool>`](#tools-tool) (escape hatch) are **not** part of these six. A capability can only be proposed as a new, seventh atomic Capability once it has stable, similar semantics across at least two Agents.

- Authoritative source: [jue-mvp.md §1, §3](../specs/jue-mvp.md), [canonical-model.md §2.1](../specs/canonical-model.md)
- Related: [Preset](#preset), [Canonical Model](#canonical-model), [Capability Source](#capability-source), [context.global](#context-global), [tools.\<tool\>](#tools-tool)

## Preset {#preset}

A Preset is a versionable, composable, distributable collection of [Capability](#capability). It is Jue's **only** composition/distribution unit.

A target Agent may present it as a plugin, extension, or native configuration — that doesn't change Preset's semantics at Jue's level. There are exactly two composition mechanisms: **Preset nesting** (`package.json` → `ai.presets`, dependencies-first, self-overrides, cycle detection) and **Capability reference** (`ai.capabilities`, see [Capability Source](#capability-source)). There is no third, independent Plugin/Capability package layer — this restriction exists specifically to prevent splitting every skill into its own npm package, which would make governance costs spiral.

- Authoritative source: [jue-mvp.md §1, §4](../specs/jue-mvp.md) (Preset directory contract), [capability-source.md §1.1](../specs/capability-source.md) (sole composition unit declaration)
- Related: [Capability](#capability), [Capability Source](#capability-source), [Adapter](#adapter)

## Adapter {#adapter}

An Adapter is the boundary layer that converts the [Canonical Model](#canonical-model) into a target Agent's (Claude / Cursor / Gemini / Copilot) native format. It only performs format conversion and never invents new fields.

Adapters consume only the normalized canonical model, preserve the target Agent's native semantics, explicitly degrade or report unsupported capabilities instead of silently dropping them, and are verified by the same capability contract tests. When a target Agent uses its own vocabulary ("plugin", "extension", "skill", ...) to describe the output, the Adapter may output using that native term, but internally Jue always calls them Preset and Capability.

- Authoritative source: [jue-mvp.md §5](../specs/jue-mvp.md) (Adapter contract), [canonical-model.md §5](../specs/canonical-model.md) (Adapter Mapping Boundary)
- Related: [Canonical Model](#canonical-model), [Capability](#capability), [jue format](#jue-format)

## Canonical Model {#canonical-model}

The Canonical Model is Jue's **single** shared internal structure — the intermediate standard shape reached after `Preset` / `.ai/` / `ai.config.js` are merged, and before Adapters convert it.

Produced by four stages: `load → merge → validate → normalize`. It fixes six atomic [Capability](#capability) types (`skills` / `agents` / `commands` / `rules` / `hooks` / `mcp.servers`) plus two non-capability fields ([`context.global`](#context-global), [`tools.<tool>`](#tools-tool)). Adapters must consume this normalized structure rather than guessing private input shapes.

- Authoritative source: [canonical-model.md](../specs/canonical-model.md) (whole document, especially §2 Supported Capability Set, §4 Merge Rules)
- Related: [Capability](#capability), [context.global](#context-global), [tools.\<tool\>](#tools-tool), [Adapter](#adapter)

## context.global {#context-global}

`context.global` is layered-append global context text (mapped from root `AGENTS.md`). It is **not** an atomic [Capability](#capability).

Merge order (low to high): nested preset dependency chain → current preset → `.ai/AGENTS.md` → project root `AGENTS.md` → `ai.config.js`'s `context.global`. This is append semantics, not replace semantics — unlike the other six structured Capabilities, which use deep object merge with later values overriding earlier ones.

- Authoritative source: [canonical-model.md §3.1, §4.3](../specs/canonical-model.md), [jue-mvp.md §3](../specs/jue-mvp.md)
- Related: [Capability](#capability), [Canonical Model](#canonical-model)

## tools.\<tool\> {#tools-tool}

`tools.<tool>` is the escape hatch reserved for tool-native differences. It is not an atomic [Capability](#capability), nor a new general-purpose capability category.

When a capability is still a single-tool private feature, or hasn't yet reached stable semantics across at least two Agents, it should stay here rather than being promoted into the shared structure. The escape hatch doesn't exist to encourage bypassing the shared structure — it exists to leave room for extension beyond mainstream capabilities, while keeping tool-specific differences from polluting the mainstream usage path.

- Authoritative source: [canonical-model.md §2.2](../specs/canonical-model.md), [architecture.md](architecture.md) (escape-hatch principle; the Chinese version's §0.4/§0.6 have more detail than this English page)
- Related: [Capability](#capability), [Canonical Model](#canonical-model)

## Capability Source {#capability-source}

Capability Source is the reference protocol for "referencing a Capability" (the `ai.capabilities` field, which sits alongside `ai.presets` in the same `ai` namespace of a Preset manifest). It is **not** a fourth concept alongside [Capability](#capability) / [Preset](#preset) / [Adapter](#adapter). Its primary use is deduplicating a single local Capability shared by multiple Presets in the same repo (`file:`); third-party sources (`github:`/`npm:`) are an extension of the same mechanism, not its only purpose.

Once resolved and converted, the result lands back into one of the six Capability types — no new asset type is produced. MVP-supported source types are `file:` / `github:` / `npm:` (`url:` reserved), converted via a converter (`agent-skill` / `mcp` / `jue-native`) into a canonical key. [Preset](#preset) only has two composition mechanisms — Preset nesting and Capability reference — there is no third, independent Plugin/Capability package layer.

> Current status: **Implemented** for `file:`, mocked `github:`, and local
> tarball-backed `npm:` sources. `url:` remains reserved.

- Authoritative source: [capability-source.md](../specs/capability-source.md) (§0 terminology, §1.1 composition mechanisms, §4 minimal user surface, §6 lock/cache decisions)
- Related: [Capability](#capability), [Preset](#preset), [Canonical Model](#canonical-model)

## jue format {#jue-format}

`jue format` is the **reverse** command that converges existing tool-native configuration (`.cursor/`, `.claude/`, `.gemini/`, `.github/copilot-instructions.md`, etc.) back into `.ai/` at low cost — the other half of the bidirectional conversion protocol.

The forward path is `.ai/` / `ai.config.js` / preset → each tool's native output (done by [Adapter](#adapter)); the reverse path is `jue format`, converging existing configuration back into the shared asset. The architecture principle requires that `jue format`'s output directory/file shape match the Preset / `.ai/` directory protocol exactly — any mismatch is a **protocol defect**, not a "missing feature yet" (currently known gaps: `hooks`, `agents`, and `tools` target paths are not fully closed; see the Chinese `architecture.md` §0.3 addendum, which is ahead of this English page).

- Authoritative source: [architecture.md](architecture.md) (English guide; the newer §0.3 bidirectional-conversion constraint currently only exists in the Chinese version), [format.md](format.md) (command usage)
- Related: [Adapter](#adapter), [Preset](#preset), [Canonical Model](#canonical-model)
