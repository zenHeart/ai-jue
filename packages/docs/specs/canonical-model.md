# 规范：共享能力结构

> 状态：Accepted
> 版本：1.0.0

## 1. 目标

本文档定义以下环节共同使用的唯一内部结构：

- 用户配置（`ai.config.js`、Preset、`.ai/`）
- 核心解析（`load -> merge -> validate -> normalize`）
- Adapter（优先为 `claude-code`、`codex`、`openclaw`、`hermes`）

Adapter 必须消费规范化后的共享结构，不得猜测私有输入形状。

注意：

- 本规范描述目标共享内部结构。
- 当前实现仍有差异时，本规范保持目标合同，差异记录到
  [实现状态](../developer/implementation-status.md)，不得用实现反向改写语义。

## 2. 支持的 Capability 集合

### 2.1 原子 Capability（6 类）

- `rules`
- `commands`
- `skills`
- `agents`
- `hooks`
- `mcp.servers`

以上六类是仅有的原子 Capability 类型。新增原子能力类别必须经过
[架构](../architecture/)定义的晋升规则。

### 2.2 文档级上下文

- `context.global`——采用分层追加方式合并的全局上下文，不是原子
  Capability（见 §4.3）。
`CanonicalDocument` 由文档级 `context` 和六类原子 Capability 组成。
`context.global` 不可独立寻址，但必须参与 provenance、合并、转换和往返验证。

`tools.<target>` 属于项目或 Preset 的目标配置，不属于 Canonical DSL。Core 在
normalize 前将它从 Canonical 输入中分离，并只传给当前目标 Adapter。

## 3. Canonical 结构

### 3.1 全局上下文

```ts
context?: {
  global?: string
}
```

`context.global` 是按分层追加语义合并的文本内容。

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

规范化规则：

- 可以接受 `prompt` 作为兼容输入。
- 规范化后的 Adapter 应消费 `content` 作为标准规则正文。

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

目标规范化规则：

- 保留 `content -> prompt` 兼容性。
- 规范化过程镜像 `content` 与 `prompt`。
- 没有非空可执行正文的 command 必须通过 Canonical 校验失败。

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

规范化规则：

- 镜像 `prompt` 与 `content`，使 Adapter 可以消费任一字段且不会静默丢失。

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

规范化规则：

- 镜像 `prompt` 与 `content`。

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

目标规范化规则：

- 必须保留结构化 hook 对象。
- Adapter 可以降级不受支持的 hook 元数据，但 core 不得过早将其扁平化。
- 数组表示同一事件存在多个 Canonical hook 定义。
- 工具原生 hook 数组不是 Canonical 输入，应放在 `tools.<tool>` 下。

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

## 4. 合并规则

### 4.1 结构化 Capability

`rules / commands / skills / agents / hooks / mcp` 使用深度对象合并。

同一键的后置层覆盖前置层。

### 4.2 Preset 与 `.ai` 目录映射

- 根目录 `AGENTS.md` -> `context.global`
- `rules/<name>/prompt.md` -> `rules.<name>`
- `commands/<name>/prompt.md` -> `commands.<name>`
- `skills/<name>/SKILL.md` -> `skills.<name>`
- `agents/<name>/prompt.md` -> `agents.<name>`
- `hooks/<name>/index.json` -> `hooks.<name>`
- 根目录 `mcp.json` -> `mcp`
- `tools/<tool>/config.json` -> 当前目标的非 Canonical 配置

根目录 `mcp.json` 的结构与 Canonical `mcp` 对象一致：
`{"servers": {...}}`。

### 4.3 全局上下文

`context.global` 按以下顺序追加合并：

1. 嵌套 Preset 依赖链
2. 当前 Preset
3. `.ai/AGENTS.md`
4. 根目录 `AGENTS.md`
5. `ai.config.js context.global`

这是追加语义，而不是替换语义。

## 5. Adapter 映射边界

### 5.1 Claude

- `context.global` -> 根目录 `AGENTS.md` + 通过 `@AGENTS.md` 引用它的 `CLAUDE.md`
- `rules` -> `.claude/rules/*.md`
- `commands` -> `.claude/skills/*/SKILL.md`
- `skills` -> `.claude/skills/*/SKILL.md`
- `agents` -> `.claude/agents/*.md`
- `hooks` -> `.claude/settings.json`
- `mcp.servers` -> `.mcp.json`（project scope）；user/local scope 需明确说明或降级

### 5.2 Cursor

- `context.global` -> 根目录 `AGENTS.md`
- `rules` -> `.cursor/rules/*.mdc`
- `commands` -> `.cursor/commands/*.md`
- `skills` -> `.cursor/skills/*/SKILL.md`
- `agents` -> `.cursor/agents/*.md`
- `hooks` -> `.cursor/hooks.json`
- `mcp.servers` -> `.cursor/mcp.json`

## 6. 校验策略

- 无效的共享结构必须在 core 校验中失败。
- Adapter 不得静默发明不受支持的顶层 Capability。
- 目标工具不支持的能力必须明确降级，不得静默忽略。
