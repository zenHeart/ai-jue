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
Claude / Cursor / Gemini / Copilot / 后续 Agent
```

Jue 对用户稳定暴露三类概念：

1. **Capability（能力）**：可被 Agent 使用的最小资产，例如 skill、agent、
   command、rule、hook 或 MCP server。
2. **Preset（能力集）**：一组可版本化、可组合、可分发的 Capability。目标
   Agent 可能把它呈现为插件、扩展或原生配置，但这不改变 Preset 的上层语义。
3. **Adapter（适配器）**：只负责把 Jue 的统一能力模型转换为目标 Agent 的
   原生格式，并显式报告不支持或降级的能力。

CLI、网站和编辑器扩展都是这套模型的入口或界面，不是 Jue 的产品定义本身。

## 2. MVP 边界

MVP 必须跑通一条真实、可重复验证的闭环：

1. `jue-preset-ai-assets` 以 Preset 身份提供真实能力。
2. Jue 无损加载 Preset 中的嵌套 skill 资源。
3. Jue 把 Preset、项目 `.ai/` 和 `ai.config.js` 收敛为同一 canonical model。
4. 至少 Claude 与 Cursor 两个 adapter 能从同一能力集生成各自的原生产物。
5. 官网能解释模型、展示支持矩阵，并提供可执行的入门路径。
6. `jue.zenheart.site` 指向经过生产构建和验证的官网。

## 3. Canonical Capability Set

MVP 的通用能力集合固定为：

- `context.global`
- `skills`
- `agents`
- `commands`
- `rules`
- `hooks`
- `mcp.servers`
- `tools.<tool>`

`tools.<tool>` 是逃生舱，不是新的通用能力分类。工具私有能力只有在至少两个
Agent 中具有稳定、相近语义后，才可以提议提升到 canonical model。

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
`ai.config.js` 的 `mcp` 字段同构，不引入第二套 MCP 表达。

Skill 的 `references/`、`scripts/`、`assets/` 下的所有嵌套文件必须保留
相对路径。Jue 不得因为目录深度而静默丢失能力资源。其他能力类型只有形成
至少两个 Agent 的稳定资源契约后，才扩展附件模型。

Preset 可以有文档、评测集或源材料等额外内容；只有上述目录契约进入
canonical model。实例部署配置、私有本地设置和凭据不得作为通用 Preset 分发。

## 5. Adapter 契约

Adapter：

- 只消费 normalize 后的 canonical model；
- 不自行发明新的输入字段；
- 保留目标 Agent 原生支持的语义；
- 对不支持的能力显式降级或报告，不静默忽略；
- 通过同一套 capability contract tests 验证。

目标 Agent 使用“插件”“扩展”“skill”或其他名称时，Adapter 可按其原生术语
输出；Jue 内部仍统一称为 Preset 和 Capability。

## 6. ai-assets 边界

`ai-assets` 是 `jue-preset-ai-assets` 的源码与版本化能力集，不再承担第二套
安装器、adapter、registry 或同步引擎。

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
| ai-assets 可消费 | 从真实仓库路径加载并生成两类 Agent 产物的 smoke test |
| 不泄露实例配置 | package/preset 清单和敏感信息校验 |
| 官网可交付 | production build、部署状态、`jue.zenheart.site` HTTPS 访问 |
| 旧能力不回归 | 全量单元测试、monorepo build、consistency check |

## 8. MVP 之后

以下能力只有在 MVP 闭环稳定后再进入下一迭代：

- 新的 Agent adapter；
- Preset registry 与远程发现；
- 自动同步服务；
- 可视化能力市场；
- 双向无损 round-trip 的更多工具覆盖。
