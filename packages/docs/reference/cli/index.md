# CLI Reference

CLI 只暴露用户任务，不暴露内部转换阶段。普通用户只需要：

```bash
jue init
jue apply --all
```

## 核心命令

| 命令 | 用途 | 默认副作用 |
| --- | --- | --- |
| [`jue init`](workflow.md#jue-init) | 创建最小项目配置 | 写项目配置 |
| [`jue apply`](workflow.md#jue-apply) | 计算差异、生成 Artifact 并确认结果 | 按确认后的差异写入 |
| [`jue inspect`](workflow.md#jue-inspect) | 解释 Preset、Capability、Adapter 和 Artifact | 无 |

`apply` 同时完成校验、比较、写入和确认：

- 预览：`jue apply --dry-run`
- CI 检查：`jue apply --check`
- 深度诊断：`jue inspect --diagnostics`

## 作者命令

资源命令只面向创建 Preset 或 Extension 的作者，不进入普通用户核心工作流：

| 命令域 | 子命令 |
| --- | --- |
| [`jue capability`](capability.md) | `update` |
| [`jue preset`](preset.md) | `create`、`validate`、`pack` |
| [`jue extension`](extension.md) | `validate` |

资源的查询统一使用 `jue inspect --capability|--preset|--extension|--target`，不在每个
命名空间重复 `list`、`inspect` 和 `doctor`。

## 全局选项

| 选项 | 含义 |
| --- | --- |
| `--cwd <path>` | 项目根目录，默认当前目录 |
| `--config <path>` | 指定项目配置，默认自动发现 |
| `--json` | 输出稳定 JSON |
| `--quiet` | 只输出错误 |
| `--verbose` | 输出 Adapter 决策与诊断 |
| `--frozen` | 拒绝浮动依赖、隐式更新和过期 lock |
| `--offline` | 禁止网络解析和网络动作 |

## 退出码

| 退出码 | 含义 |
| --- | --- |
| `0` | 成功，或 `--check` 确认无需变更 |
| `1` | Jue 或 Extension 内部错误 |
| `2` | 参数、配置或 Canonical DSL 无效 |
| `3` | 存在漂移、所有权或写入冲突 |
| `4` | 所需动作未获授权 |
| `5` | Artifact 写入后无法通过目标原生路径确认 |
| `6` | `--frozen` 或 `--offline` 无法满足 |

当前实现与目标合同的差距见
[实现状态](../../developer/implementation-status.md)；未实现的命令或选项必须标为
规划，不得以文档示例暗示已经可用。
