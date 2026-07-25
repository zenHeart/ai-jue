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
Claude / Cursor / Gemini / Copilot / future Agents
```

Jue exposes exactly three concepts to users
(`Capability → Preset → Adapter`):

1. **Capability**: the smallest asset an Agent can use, such as a skill, agent,
   command, rule, hook, or MCP server.
2. **Preset**: a versionable, composable, and distributable collection of
   Capabilities. A target Agent may present it as a plugin, extension, or native
   configuration, but that does not change the Preset's higher-level semantics.
3. **Adapter**: converts Jue's shared capability model into the target Agent's
   native format and explicitly reports unsupported or degraded capabilities.

The CLI, website, and editor extensions are entry points or interfaces to this
model; they do not define Jue as a product.

## 2. MVP boundary

The MVP must complete one real and repeatably verifiable loop:

1. A local Preset package provides real capabilities as a standard Preset.
2. Jue loads nested skill resources from the Preset without loss.
3. Jue converges the Preset, project `.ai/`, and `ai.config.js` into one
   Canonical Model.
4. At least the Claude and Cursor Adapters generate their native outputs from
   the same capability set.
5. The website explains the model, presents the support matrix, and provides an
   executable onboarding path.
6. `jue.zenheart.site` points to a production-built and verified website.

## 3. Canonical Capability set

The shared MVP capability set is fixed to:

- `context.global`
- `skills`
- `agents`
- `commands`
- `rules`
- `hooks`
- `mcp.servers`
- `tools.<tool>`

The six types `skills` / `agents` / `commands` / `rules` / `hooks` /
`mcp.servers` are atomic Capabilities. `context.global` and `tools.<tool>` are
**not** atomic Capabilities: `context.global` is layered-append global context,
and `tools.<tool>` is an escape hatch. A tool-private capability may be proposed
for promotion into the Canonical Model only after it has stable, similar
semantics in at least two Agents.

For how a Preset references third-party Capability content from GitHub, npm,
URL, or local sources and converts it into the Canonical Model, see the
[Capability Source specification](capability-source.md). It adds a reference
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
content; only the directory contract above enters the Canonical Model. Instance
deployment configuration, private local settings, and credentials must not be
distributed as a general-purpose Preset.

## 5. Adapter contract

An Adapter:

- consumes only the normalized Canonical Model;
- does not invent new input fields;
- preserves semantics supported natively by the target Agent;
- explicitly degrades or reports unsupported capabilities instead of silently
  ignoring them;
- is verified by the same capability contract tests.

When a target Agent uses terms such as plugin, extension, or skill, the Adapter
may use that native vocabulary in its output. Internally, Jue still consistently
uses Preset and Capability.

## 6. Preset repository boundary

A Preset repository is the source and versioned capability set for Preset
packages. It does not implement a second installer, Adapter, registry, or sync
engine.

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
| Local Preset consumption | Smoke test that packages a user-provided local path and generates outputs for two Agents |
| No instance configuration leakage | Package/Preset manifests and sensitive-information checks |
| Deliverable website | Production build, deployment status, and HTTPS access to `jue.zenheart.site` |
| No regression of existing capabilities | Full unit tests, monorepo build, and consistency check |

## 8. After the MVP

The following capabilities enter a later iteration only after the MVP loop is
stable:

- new Agent Adapters;
- Preset registry and remote discovery;
- automatic synchronization services;
- a visual capability marketplace;
- broader tool coverage for lossless bidirectional round trips.
