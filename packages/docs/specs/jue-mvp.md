# Jue MVP：AI 能力标准与 Agent 适配

> 状态：Accepted for MVP implementation
> 更新日期：2026-07-23

## 1. 产品定义

Jue 不是一个“生成 AI 工具配置文件”的单点工具。Jue 是位于能力资产与
具体 Agent 之间的标准化层：

```text
能力来源（Preset / .ai / config）
              ↓
      Jue Canonical Model
              ↓
         Agent Adapter
              ↓
Claude Code / Codex / OpenClaw / Hermes / 后续 Agent
```

Jue 对用户暴露且仅暴露三层概念（`Capability → Preset → Adapter`）：

1. **Capability（能力）**：可被 Agent 使用的最小资产，例如 skill、agent、
   command、rule、hook 或 MCP server。
2. **Preset（能力集）**：一组可版本化、可组合、可分发的 Capability。目标
   Agent 可能把它呈现为插件、扩展或原生配置，但这不改变 Preset 的上层语义。
3. **Adapter（适配器）**：一个目标 Agent 的完整集成，同时封装 Capability
   适配与 Artifact 生成，并显式报告不支持或降级。

CLI、网站和编辑器扩展都是这套模型的入口或界面，不是 Jue 的产品定义本身。

## 2. MVP 边界

MVP 必须跑通一条真实、可重复验证的闭环：

1. 本地 Preset 包以标准 Preset 身份提供真实能力。
2. Jue 无损加载 Preset 中的嵌套 skill 资源。
3. Jue 把 Preset、项目 `.ai/` 和 `ai.config.js` 收敛为同一 canonical model。
4. Claude Code Reference Extension（参考实现扩展：首个 Adapter 集成）能从
   同一能力集生成原生产物，并由 headless Claude Code 的真实读取或执行路径
   确认。
5. 同一输入通过 `apply --dry-run`、`apply`、`apply --check` 和二次 `apply`
   零差异。
6. Claude 闭环沉淀出可复用的 Extension 骨架与合同测试；其他 Agent 只有在该
   Scale Gate（扩展门禁：Claude 闭环验证稳定）通过后才并行迁移。

## 3. Canonical Capability Set

MVP 的 Canonical 文档固定为：

- `context.global`
- `skills`
- `agents`
- `commands`
- `rules`
- `hooks`
- `mcp.servers`

其中 `skills` / `agents` / `commands` / `rules` / `hooks` / `mcp.servers`
六类是原子 Capability。`context.global` 是不可独立寻址的文档级上下文，不是
原子 Capability，但参与 provenance、合并、转换和往返验证。`tools.<tool>` 是
Canonical 之外的目标配置；工具私有能力只有在至少两个 Agent 中具有稳定、相近
语义后，才可以提议提升为新的原子 Capability。

第三方来源的 Capability 内容（GitHub / npm / URL / 本地）如何被 Preset
引用并转换进 canonical model，见
[external Capability reference 规格](capability-source.md)——它定义的是引用协议，不改变
上面这个 Capability 集合本身。

## 4. Preset 目录契约

Preset 是普通、可发布的目录或 npm 包：

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

`mcp.json` 使用 canonical `{"servers": {...}}` 结构；它与
`ai.config.js` 的 `mcp` 字段同构。

Skill 的 `references/`、`scripts/`、`assets/` 下的所有嵌套文件必须保留
相对路径。Jue 不得因为目录深度而静默丢失能力资源。其他能力类型只有形成
至少两个 Agent 的稳定资源契约后，才扩展附件模型。

Preset 可以有文档、评测集或源材料等额外内容；公共目录契约进入 canonical
model，`tools/<tool>` 作为当前目标配置独立传入 Adapter。实例部署配置、私有
本地设置和凭据不得作为通用 Preset 分发。

## 5. Adapter 契约

Adapter：

- 只以 normalize 后的 Canonical DSL 作为公共语义事实源；
- 通过 Adapter 转换实现目标 DSL 与 Canonical 的正反转换；
- 通过 Artifact 生成物化配置、Plugin、Bundle 或其他目标产物；
- 在 Artifact 计划中描述需授权的安装、启用、更新和重载；
- 对不支持、降级和仅原生保留的能力显式报告，不静默忽略；
- 通过 round-trip、幂等和目标原生验证合同验收。

目标 Agent 使用“插件”“扩展”“skill”或其他名称时，Adapter 可按其原生术语
输出；Jue 内部仍统一称为 Preset 和 Capability。

## 6. Preset 仓库边界

Preset 仓库是 Preset 包的源码与版本化能力集。npm 负责安装和版本管理，Adapter
负责 Agent 输出。

包含：

- 通用 `AGENTS.md`；
- 可迁移的 skills、agents、commands、rules；
- 与能力一起使用的嵌套 references、scripts、assets。

不进入 Preset：

- `deployments/` 下的实例运维状态；
- 本地 Agent 设置；
- 凭据、个人信息或公司内部事实；
- 只用于资产治理、但不会被 Agent 运行时消费的资料。

## 7. MVP 验收证据

| 要求 | 权威证据 |
| --- | --- |
| 协议一致 | schema、normalize、loader、文档的 contract test |
| 嵌套资源无损 | 加载与 adapter 输出深层相对路径测试 |
| 本地 Preset 可消费 | 从用户提供的本地路径打包安装并生成两类 Agent 产物的 smoke test |
| 不泄露实例配置 | package/preset 清单和敏感信息校验 |
| 首个真实闭环 | 隔离项目中的 headless Claude Code 原生读取或执行证据 |
| 可扩展性 | 第二个中性 Adapter 不修改 Core 或 Canonical 即通过同一合同测试 |
| 旧能力不回归 | 全量单元测试、monorepo build、consistency check |

## 8. MVP 之后

以下能力只有在 Claude Code Reference Extension MVP 闭环稳定后再进入下一迭代：

- Codex、OpenClaw、Hermes 的并行 Extension 迁移；
- Preset registry 与远程发现；
- 自动同步服务；
- 可视化能力市场；
- 双向无损 round-trip 的更多工具覆盖。
