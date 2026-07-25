# 术语表 (Glossary)

排列顺序按认知依赖递进，而非字母序：先是 Jue 对用户暴露的三层核心概念
（Capability → Preset → Adapter），再是承载它们的内部结构（Canonical
Model）及其两个非原子字段（`context.global`、`tools.<tool>`），最后是
内容引用协议与逆向命令（Capability Source、`jue format`）。

## Capability {#capability}

Capability 是 Agent 可使用的最小原子资产，固定为六类：`skills` / `agents` / `commands` / `rules` / `hooks` / `mcp.servers`。

这是 Jue 对用户暴露的三层概念中的第一层（另两层是 [Preset](#preset)、[Adapter](#adapter)）。这个词的选择直接对齐 MCP 协议自身的 `capabilities` / "Capability Negotiation" 用词，以及 Anthropic Agent Skills 文档中"extend Claude's capabilities"的说法——不是 Jue 自造的新词。[`context.global`](#context-global)（全局上下文）和 [`tools.<tool>`](#tools-tool)（逃生舱）**不属于**这六类。只有当某个能力在至少两个 Agent 中具有稳定、相近语义后，才可以提议提升为新的第七类原子 Capability。

- 权威来源：[jue-mvp.md §1、§3](../specs/jue-mvp.md)、[canonical-model.md §2.1](../specs/canonical-model.md)
- 相关：[Preset](#preset)、[Canonical Model](#canonical-model)、[Capability Source](#capability-source)、[context.global](#context-global)、[tools.\<tool\>](#tools-tool)

## Preset {#preset}

Preset 是一组可版本化、可组合、可分发的 [Capability](#capability) 集合，是 Jue **唯一**的组合/分发单元。

目标 Agent 可能把它呈现为插件、扩展或原生配置，这不改变 Preset 的上层语义。组合机制仅有且只有两种：**Preset 嵌套**（`package.json` → `ai.presets`，依赖优先、自身覆盖、循环检测）与**Capability 引用**（`ai.capabilities`，见 [Capability Source](#capability-source)）。不存在第三种独立的 Plugin/Capability 包层——这条限制是为了防止把每个 skill 拆成独立 npm 包而导致治理成本失控。

- 权威来源：[jue-mvp.md §1、§4](../specs/jue-mvp.md)（Preset 目录契约）、[capability-source.md §1.1](../specs/capability-source.md)（唯一组合单元声明）
- 相关：[Capability](#capability)、[Capability Source](#capability-source)、[Adapter](#adapter)

## Adapter {#adapter}

Adapter 是把 [Canonical Model](#canonical-model) 转换为目标 Agent（Claude / Cursor / Gemini / Copilot）原生格式的边界层，只做格式转换，不发明新字段。

Adapter 只消费 normalize 后的 canonical model；保留目标 Agent 原生支持的语义；对不支持的能力显式降级或报告，不静默忽略；通过同一套 capability contract tests 验证。目标 Agent 用"插件""扩展""skill"等自己的术语描述产物时，Adapter 可以按其原生说法输出，但 Jue 内部始终统一称为 Preset 和 Capability。

- 权威来源：[jue-mvp.md §5](../specs/jue-mvp.md)（Adapter 契约）、[canonical-model.md §5](../specs/canonical-model.md)（Adapter Mapping Boundary）
- 相关：[Canonical Model](#canonical-model)、[Capability](#capability)、[jue format](#jue-format)

## Canonical Model {#canonical-model}

Canonical Model 是 Jue 内部**唯一**的统一结构，是 `Preset` / `.ai/` / `ai.config.js` 三个输入入口汇聚之后、Adapter 转换之前的中间标准形态。

由 `load → merge → validate → normalize` 四个阶段产出；固定包含 6 类原子 [Capability](#capability)（`skills` / `agents` / `commands` / `rules` / `hooks` / `mcp.servers`）加两个非 Capability 字段（[`context.global`](#context-global)、[`tools.<tool>`](#tools-tool)）。Adapter 必须消费 normalize 后的这套结构，不能各自猜测输入形状。

- 权威来源：[canonical-model.md](../specs/canonical-model.md)（全文，尤其 §2 Supported Capability Set、§4 Merge Rules）
- 相关：[Capability](#capability)、[context.global](#context-global)、[tools.\<tool\>](#tools-tool)、[Adapter](#adapter)

## context.global {#context-global}

`context.global` 是分层追加的全局上下文文本（对应根 `AGENTS.md`），**不是**原子 [Capability](#capability)。

合并顺序（低到高）：嵌套 preset 依赖链 → 当前 preset → `.ai/AGENTS.md` → 项目根 `AGENTS.md` → `ai.config.js` 的 `context.global`。这是"追加"语义，不是"覆盖替换"语义，与其余六类结构化 Capability（对象深合并、后者覆盖前者）不同。

- 权威来源：[canonical-model.md §3.1、§4.3](../specs/canonical-model.md)、[jue-mvp.md §3](../specs/jue-mvp.md)
- 相关：[Capability](#capability)、[Canonical Model](#canonical-model)

## tools.\<tool\> {#tools-tool}

`tools.<tool>` 是保留给工具原生差异的**逃生舱**，不是原子 [Capability](#capability)，也不是新的通用能力分类。

当某个能力还只是单工具私有特性、或尚未在至少两个 Agent 中形成稳定语义时，应优先留在这里而不是提升为统一结构。逃生舱的目的不是鼓励用户绕开统一结构，而是在主流能力之外保留扩展空间，同时不让工具差异反向污染主流使用路径。

- 权威来源：[canonical-model.md §2.2](../specs/canonical-model.md)、[architecture.md §0.4、§0.6](architecture.md)（逃生舱原则与能力下沉链路）
- 相关：[Capability](#capability)、[Canonical Model](#canonical-model)

## Capability Source {#capability-source}

Capability Source 是"引用某个 Capability"的**引用协议**（`ai.capabilities` 字段，与 `ai.presets` 同放
在 Preset 清单的 `ai` 命名空间下），**不是** [Capability](#capability) / [Preset](#preset) /
[Adapter](#adapter) 之外的第四个平级概念。首要用途是同仓多个 Preset 引用同一份本地 Capability 去重
（`file:`），第三方来源（`github:`/`npm:`）是同一机制的扩展，不是唯一用途。

解析、转换后的产物仍然进入 Capability 六类之一，不产生新的资产类型。MVP 支持的 source 类型为 `file:` / `github:` / `npm:`（`url:` 预留），通过 converter（`agent-skill` / `mcp` / `jue-native`）转换进 canonical 键。[Preset](#preset) 只有两种组合机制——Preset 嵌套与 Capability 引用——不存在第三种独立的 Plugin/Capability 包层。

> 当前状态：**Proposed for implementation**，尚未编码实现。

- 权威来源：[capability-source.md](../specs/capability-source.md)（§0 术语说明、§1.1 组合机制、§4 最小用户面、§6 Lock/Cache 决策）
- 相关：[Capability](#capability)、[Preset](#preset)、[Canonical Model](#canonical-model)

## jue format {#jue-format}

`jue format` 是把已有工具原生配置（`.cursor/` / `.claude/` / `.gemini/` / `.github/copilot-instructions.md` 等）低成本收敛回 `.ai/` 目录的**反向**命令，是双向转换协议的另一半。

正向路径是 `.ai/` / `ai.config.js` / preset → 各工具原生产物（由 [Adapter](#adapter) 完成）；反向路径就是 `jue format`，从存量配置收敛回统一资产。架构原则要求 `jue format` 的输出目录/文件形状必须与 Preset / `.ai/` 目录协议完全一致，任何不一致都是**协议缺陷**而不是"待补功能"（当前已知差距：`hooks`、`agents`、`tools` 目标路径尚未完全收口，见 architecture.md）。

- 权威来源：[architecture.md §0.3](architecture.md)（双向转换约束与已知差距）、[format.md](format.md)（命令用法）、[format-design.md](../specs/format-design.md)（设计动机）
- 相关：[Adapter](#adapter)、[Preset](#preset)、[Canonical Model](#canonical-model)
