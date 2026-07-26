# Jue MVP: AI Capability Standard and Agent Adaptation

> Status: Accepted for MVP implementation
> Updated: 2026-07-23

## 1. Product definition

Jue is not a single-purpose tool that merely generates AI tool configuration.
It is the standardization layer between capability assets and concrete Agents:

```text
Capability sources (Preset / .ai / config)
                    ↓
            Jue Canonical Model
                    ↓
               Agent Adapter
                    ↓
Claude Code / Codex / OpenClaw / Hermes / future Agents
```

Jue exposes exactly three concepts to users
(`Capability → Preset → Adapter`):

1. **Capability**: the smallest asset an Agent can use, such as a skill, agent,
   command, rule, hook, or MCP server.
2. **Preset**: a versionable, composable, and distributable collection of
   Capabilities. A target Agent may present it as a plugin, extension, or native
   configuration, but that does not change the Preset's higher-level semantics.
3. **Adapter**: the complete integration for one target Agent, encapsulating
   Adapter conversion and Artifact generation.

The CLI, website, and editor extensions are entry points or interfaces to this
model; they do not define Jue as a product.

## 2. MVP boundary

The MVP must complete one real and repeatably verifiable loop:

1. A local Preset package provides real capabilities as a standard Preset.
2. Jue loads nested skill resources from the Preset without loss.
3. Jue converges the Preset, project `.ai/`, and `ai.config.js` into one
   Canonical Model.
4. The Claude Code Reference Extension generates native output and headless
   Claude Code confirms it through a real read or execution path.
5. The same input passes dry-run, Core apply, confirm, check, and a zero-diff
   second apply.
6. The Claude loop produces a reusable Extension skeleton and contract tests;
   other Agents migrate in parallel only after that Scale Gate passes.

## 3. Canonical Capability set

The MVP Canonical document is fixed to:

- `context.global`
- `skills`
- `agents`
- `commands`
- `rules`
- `hooks`
- `mcp.servers`

The six types `skills` / `agents` / `commands` / `rules` / `hooks` /
`mcp.servers` are atomic Capabilities. `context.global` is non-addressable
document-level context rather than an atomic Capability, but participates in
provenance, merge, conversion, and round-trip validation. `tools.<tool>` is
target configuration outside the Canonical DSL. A tool-private capability may
be proposed for promotion only after it has stable, similar semantics in at
least two Agents.

For how a Preset references third-party Capability content from GitHub, npm,
URL, or local sources and converts it into the Canonical Model, see the
[external Capability reference specification](capability-source.md). It adds a reference
protocol without changing the Capability set above.

## 4. Preset directory contract

A Preset is an ordinary, publishable directory or npm package:

```text
AGENTS.md
skills/<name>/SKILL.md
agents/<name>/prompt.md
commands/<name>/prompt.md
rules/<name>/prompt.md
hooks/<name>/index.json
mcp.json
tools/<tool>/config.json
package.json
```

`mcp.json` uses the Canonical `{"servers": {...}}` shape. It is isomorphic to
the `mcp` field in `ai.config.js` and does not introduce a second MCP
representation.

All nested files under a Skill's `references/`, `scripts/`, and `assets/` must
preserve their relative paths. Jue must not silently lose capability resources
because of directory depth. Attachment models for other capability types are
extended only after at least two Agents establish a stable resource contract.

A Preset may include documentation, evaluation sets, source material, and other
content. Public directory content enters the Canonical Model, while
`tools/<tool>` is passed separately as current-target configuration. Instance
deployment configuration, private local settings, and credentials must not be
distributed as a general-purpose Preset.

## 5. Adapter contract

An Adapter:

- uses the normalized Canonical DSL as the public semantic source;
- converts target DSL bidirectionally through Adapter conversion;
- materializes configuration, Plugin, Bundle, or other outputs through
  Artifact generation;
- describes approved install, enable, update, and reload behavior in Artifact plans;
- reports unsupported, degraded, and native-only behavior explicitly;
- passes round-trip, idempotency, and target-native verification contracts.

When a target Agent uses terms such as plugin, extension, or skill, the Adapter
may use that native vocabulary in its output. Internally, Jue still consistently
uses Preset and Capability.

## 6. Preset repository boundary

A Preset repository is the source and versioned Capability set for Preset
packages. npm handles installation and versions; Adapters handle Agent output.

Included:

- shared `AGENTS.md`;
- portable skills, agents, commands, and rules;
- nested references, scripts, and assets used with capabilities.

Excluded from a Preset:

- instance operations state under `deployments/`;
- local Agent settings;
- credentials, personal information, or internal company facts;
- material used only for asset governance and not consumed by an Agent runtime.

## 7. MVP acceptance evidence

| Requirement | Authoritative evidence |
| --- | --- |
| Protocol consistency | Contract tests for schema, normalization, loader, and documentation |
| Lossless nested resources | Tests for deep relative paths in loading and Adapter output |
| Local Preset consumption | Smoke test that packages a user-provided local path and drives the Claude loop |
| No instance configuration leakage | Package/Preset manifests and sensitive-information checks |
| First real loop | Headless Claude Code native read or execution evidence in an isolated project |
| Scalability | A neutral second Adapter passes the same contracts without Core or Canonical changes |
| No regression of existing capabilities | Full unit tests, monorepo build, and consistency check |

## 8. After the MVP

The following capabilities enter a later iteration only after the Claude Code
Reference Extension MVP is stable:

- parallel Codex, OpenClaw, and Hermes Extension migration;
- Preset registry and remote discovery;
- automatic synchronization services;
- a visual capability marketplace;
- broader tool coverage for lossless bidirectional round trips.
