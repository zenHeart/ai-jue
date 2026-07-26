# 术语表

Jue 只定义以下六个稳定概念。其他名词应当是外部平台用语、配置字段、接口方法或
执行阶段，不应再形成一层用户心智模型。

## Capability {#capability}

Agent 可使用的通用能力抽象。当前类型为 `skills`、`agents`、`commands`、
`rules`、`hooks` 和 `mcp.servers`。Capability 描述“能做什么”，不描述目标文件
布局或安装方式。

## Preset {#preset}

可版本化、可组合、可分发的 Capability 集合。Preset 是逻辑复用单位，只包含
声明式数据，不执行代码，也不等同于目标 Agent 的 Plugin。

## Canonical DSL {#canonical-dsl}

Jue 用于正反转换的唯一中间层和语义事实源。所有输入先转换、合并为 Canonical
DSL，再由目标 Adapter 生成 Artifact；从 Agent 导入时执行相反方向。

Canonical DSL 同时定义规范与规范化数据表示；关系、来源和所有权都是 DSL 数据。

## Extension {#extension}

Jue 的统一可执行扩展机制。Extension 通过稳定 API 注册 Adapter。它与目标 Agent
所称的 Plugin 不同，也与只包含数据的 Preset 不同。

## Adapter {#adapter}

Extension 内针对一个 Agent 的完整转换单元。Adapter 负责 Agent 原生配置与
Canonical DSL 的双向转换，并生成、更新和确认 Artifact。

## Artifact {#artifact}

Adapter 为目标 Agent 生成或维护的原生产物，例如配置、目录、Plugin、Bundle 或
Archive。Artifact 是物理交付形态，Preset 是逻辑 Capability 集合。

Plugin 是某些 Agent 对一种 Artifact 的命名，可以承载 Capability、manifest、
运行时代码和安装要求。
