# Specification: Shared Capability Structure

> Status: Draft
> Version: 1.0.0

## 1. Goal

This document defines the single shared internal structure used between:

- user config (`ai.config.js`, presets, `.ai/`)
- core resolution (`load -> merge -> validate -> normalize`)
- adapters (`Claude`, `Cursor`, `Gemini`, `Copilot`)

Adapters must consume the normalized shared structure instead of guessing private input shapes.

Note:

- This spec describes the target shared internal structure.
- When current implementation still differs, the implementation should be treated as the factual source, and the gap should be tracked explicitly rather than hidden.

## 2. Supported Capability Set

The supported top-level capabilities are:

- `context.global`
- `rules`
- `commands`
- `skills`
- `agents`
- `hooks`
- `mcp.servers`
- `tools.<tool>`

No additional top-level capability categories are allowed.

## 3. Canonical Shapes

### 3.1 Global Context

```ts
context?: {
  global?: string
}
```

`context.global` is text content merged by layered append semantics.

### 3.2 Rules

```ts
rules?: Record<string, {
  content?: string
  prompt?: string
  description?: string
  globs?: string | string[]
  alwaysApply?: boolean
}>
```

Normalization rule:

- `prompt` may be accepted as input compatibility.
- normalized adapters should consume `content` as the standard rule body.

### 3.3 Commands

```ts
commands?: Record<string, {
  prompt?: string
  content?: string
  description?: string
  triggers?: string[]
  disableModelInvocation?: boolean
  userInvocable?: boolean
}>
```

Target normalization rule:

- `content -> prompt` compatibility is preserved.
- normalization mirrors `content` and `prompt`.
- commands without a non-empty executable body fail canonical validation.

### 3.4 Skills

```ts
skills?: Record<string, {
  name?: string
  prompt?: string
  content?: string
  description?: string
  allowedTools?: string[]
  "allowed-tools"?: string[]
  disableModelInvocation?: boolean
  userInvocable?: boolean
  references?: Record<string, string>
  scripts?: Record<string, string>
  assets?: Record<string, string>
}>
```

Normalization rule:

- `prompt` and `content` are mirrored so adapters can consume either one without silent drops.

### 3.5 Agents

```ts
agents?: Record<string, {
  name?: string
  prompt?: string
  content?: string
  description?: string
  skills?: string[]
}>
```

Normalization rule:

- `prompt` and `content` are mirrored.

### 3.6 Hooks

```ts
hooks?: Record<string,
  string |
  {
    script: string
    matcher?: string
    tools?: string[]
    type?: string
    async?: boolean
    timeout?: number
  } |
  Array<{
    script: string
    matcher?: string
    tools?: string[]
    type?: string
    async?: boolean
    timeout?: number
  }>
>
```

Target normalization rule:

- structured hook objects must be preserved.
- adapters may degrade unsupported hook metadata, but core must not flatten them prematurely.
- arrays mean multiple canonical hook definitions for the same event.
- tool-native hook arrays are not canonical input and belong under `tools.<tool>`.

### 3.7 MCP

```ts
mcp?: {
  servers?: Record<string, {
    command: string
    args?: string[]
    env?: Record<string, string>
    disabled?: boolean
    autoApprove?: string[]
    scope?: "local" | "project" | "user"
  }>
}
```

## 4. Merge Rules

### 4.1 Structured Capabilities

`rules / commands / skills / agents / hooks / mcp / tools` use deep object merge.

Later layers override earlier layers for the same key.

### 4.2 Preset and `.ai` Directory Mapping

- root `AGENTS.md` -> `context.global`
- `rules/<name>/prompt.md` -> `rules.<name>`
- `commands/<name>/prompt.md` -> `commands.<name>`
- `skills/<name>/SKILL.md` -> `skills.<name>`
- `agents/<name>/prompt.md` -> `agents.<name>`
- `hooks/<name>/index.json` -> `hooks.<name>`
- root `mcp.json` -> `mcp`
- `tools/<tool>/config.json` -> `tools.<tool>`

The root `mcp.json` shape is identical to the canonical `mcp` object:
`{"servers": {...}}`.

### 4.3 Global Context

`context.global` is merged by append order:

1. nested preset dependency chain
2. current preset
3. `.ai/AGENTS.md`
4. root `AGENTS.md`
5. `ai.config.js context.global`

This is additive, not replace semantics.

## 5. Adapter Mapping Boundary

### 5.1 Claude

- `context.global` -> root `AGENTS.md` + `CLAUDE.md` with `@AGENTS.md`
- `rules` -> `.claude/rules/*.md`
- `commands` -> `.claude/skills/*/SKILL.md`
- `skills` -> `.claude/skills/*/SKILL.md`
- `agents` -> `.claude/agents/*.md`
- `hooks` -> `.claude/settings.json`
- `mcp.servers` -> `.mcp.json` (project scope) and note/degradation for user/local scope

### 5.2 Cursor

- `context.global` -> root `AGENTS.md`
- `rules` -> `.cursor/rules/*.mdc`
- `commands` -> `.cursor/commands/*.md`
- `skills` -> `.cursor/skills/*/SKILL.md`
- `agents` -> `.cursor/agents/*.md`
- `hooks` -> `.cursor/hooks.json`
- `mcp.servers` -> `.cursor/mcp.json`

## 6. Validation Policy

- invalid shared structure should fail in core validation
- adapters must not silently invent unsupported top-level capabilities
- unsupported target-tool features must be degraded explicitly, not ignored silently

Current implementation gaps to close:

- `prompts` still lack a single normalized `content/prompt` contract across all adapters
- `prompts` remain a backward-compatibility input and are not a new canonical capability
