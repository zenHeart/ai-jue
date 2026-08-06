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
| [`jue apply`](workflow.md#jue-apply) | 计算差异、生成 Artifact | 写入变更 |
| [`jue inspect`](workflow.md#jue-inspect) | 解释 Preset、Capability、Adapter 和 Artifact | 无 |

`apply` 同时完成校验、比较和写入：

- 预览：`jue apply --dry-run`
- CI 检查：`jue apply --check`
- 深度诊断：`jue inspect --diagnostics`

## 作者命令

资源命令只面向创建 Preset 或 Extension 的作者，不进入普通用户核心工作流：

| 命令域 | 子命令 |
| --- | --- |
| [`jue capability`](capability.md) | `update` |
| [`jue preset`](preset.md) | 规划中：`create`、`validate`、`pack`（当前为 `create-preset`、`validate`、`format`） |
| [`jue extension`](extension.md) | `validate` |

资源查询使用 `jue list [presets|prompts|skills|all]`（列 Preset、提示词与技能
清单）和 `jue inspect --extension <id>`（Extension 诊断）。

## 全局选项

| 选项 | 含义 |
| --- | --- |
| `--lang`（alias `-l`） | 运行时语言覆盖（如 en、zh） |
| `--verbose`（alias `-v`） | 输出 Adapter 决策与详细日志 |

## 退出码

| 退出码 | 含义 |
| --- | --- |
| `0` | 成功，或 `--check` 确认无需变更 |
| `1` | 配置校验失败、内部错误，或 apply 回滚 |
| `2` | Artifact kind 或 scope 不受支持 |
| `3` | 存在漂移、所有权或写入冲突 |
| `4` | 所需动作未获授权 |

当前实现与目标合同的差距见
[实现状态](../../developer/implementation-status.md)；未实现的命令或选项必须标为
规划，不得以文档示例暗示已经可用。
