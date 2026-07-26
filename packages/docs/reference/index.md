# Reference 总览

Reference 是字段、命令和接口的事实源。按使用者渐进披露：

| 读者 | 先读 | 需要时再读 |
| --- | --- | --- |
| 普通用户 | [CLI](cli/)、[项目配置](project-config.md) | [术语表](glossary.md) |
| Preset 作者 | [Preset npm 包](preset-manifest.md) | CLI 作者命令 |
| Extension 作者 | [Extension API](extension-api.md) | [Adapter 标准](../architecture/adapter-standardization.md) |

## 完整用户面

| 任务 | 命令 | 输出 |
| --- | --- | --- |
| 初始化 | `jue init` | 项目配置 |
| 预览 | `jue apply --dry-run` | Artifact 差异 |
| 应用并确认 | `jue apply` | 目标 Artifact 与确认结果 |
| CI 检查 | `jue apply --check` | 配置、漂移和确认诊断 |
| 解释与排障 | `jue inspect` | Preset、Capability、Adapter、Artifact |

Preset 和 Extension 通过 npm 安装、升级与发布。当前实现差距见
[Developer 实现状态](../developer/implementation-status.md)。
