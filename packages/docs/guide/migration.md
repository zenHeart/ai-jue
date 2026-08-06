# 跨 Agent 迁移

> [!WARNING]
> 本页定义目标合同；实现状态见
> [实现状态](../developer/implementation-status.md)。

Jue 将不同 Agent DSL 收敛为 Canonical，再生成目标 Agent 的原生产物。迁移过程
先预览、后写入。

## 1. 用户工作流

理想使用路径：

```bash
jue apply --adapter codex --dry-run
jue apply --adapter codex
jue apply --adapter codex --check
```

迁移复用 Jue 唯一的转换流水线，不引入独立命令域；各 Agent 支持状态见
[Agent 支持画像](../agents/)。

### 自动发现

未指定目标时，Jue 检查项目中的 manifest、配置目录和目标 CLI。检测结果
必须展示给用户；存在多个候选或不确定来源时只预览，不自动写入。

### 变化预览

预览至少包含：

- 检测到的来源和目标；
- 将读取与写入的路径；
- 采用的 Adapter、Capability 映射和 Artifact；
- 每项能力的 `portable` / `transformed` / `degraded` /
  `unsupported` / `blocked` 状态；
- 需要安装、启用、联网、重启或用户级写入的动作；
- 回滚和验证方式。

## 2. 三种迁移场景

### 2.1 Agent DSL → Canonical

```text
Agent 原生配置 → Adapter → Canonical DSL
```

适用于把已有 Claude Code、Codex、OpenClaw 或 Hermes 项目纳入 Jue 管理。
Canonical 资产进入 `.ai/` 或 Preset；目标私有内容由同一 Adapter 在原目标更新时
保留，不能被伪装成通用 Capability 或迁移到其他 Agent。

### 2.2 Canonical → Agent DSL

```text
Preset + project config → Canonical DSL → Adapter → Artifact
```

同一 Canonical DSL 可以输出多个目标。Artifact 可能是原生配置、Plugin、
Bundle 或 Extension；选择由目标 Adapter 与用户覆盖共同决定。

### 2.3 Agent A → Agent B

```text
Agent A DSL → Canonical → Agent B DSL
```

跨目标只迁移 Canonical 可移植子集。Agent A 的运行时代码、权限或专属配置不能
直接在 Agent B 执行，必须保留、降级或阻塞并报告。

## 3. Preset 与 Plugin

用户始终选择 Preset，而不是为每个目标维护一份 Plugin：

```text
review Preset
├── Claude Code Adapter → Claude Plugin
├── Codex Adapter       → Codex Plugin
├── OpenClaw Adapter    → compatible bundle / native plugin
└── Hermes Adapter      → Hermes skill/config/plugin
```

各 Agent 交付形态见 [Agent 支持画像](../agents/)。

## 4. 幂等和共存

- 第一次应用建立 Jue 托管边界。
- 后续应用只更新托管内容，保留合法的用户原生内容。
- 相同输入重复应用后不得产生 diff。
- 同名能力冲突在写入前失败或要求用户选择，不静默覆盖。
- 目标中未托管的字段只在原目标保留。

## 5. 完成标准

迁移只有在以下条件都成立时完成：

1. Canonical 校验通过；
2. 预览中的写入与实际结果一致；
3. 没有未解释的降级或丢失；
4. Artifact manifest/config 可由目标官方解析；
5. 目标 Agent 的原生 list、inspect、doctor 或真实读取路径确认能力可用；
6. 未泄露凭据、个人信息或目标用户级状态。
