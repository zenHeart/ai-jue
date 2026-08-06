# Preset 作者命令

当前 CLI 面向 Preset 作者的命令是 `create-preset`、`validate` 与 `format`
（历史分散形态，见[实现状态](../../developer/implementation-status.md)）：

```bash
jue create-preset <name>
jue validate
jue format
```

| 命令 | 行为 |
| --- | --- |
| `create-preset <name>` | 生成普通 npm 包（`jue-preset-<name>`）和最小 Canonical 目录 |
| `validate` | 校验当前项目配置：`presets` 数组、预设安装与 `extends` 路径 |
| `format` | 迁移 AI 工具配置到 `.ai` 目录 |

Preset 清单查询使用 `jue list presets`。安装、升级、版本比较、发布和移除继续由
npm/pnpm/yarn 负责，Jue 不复制包管理器能力。详情见
[Preset npm 包约定](../preset-manifest.md)。

## 规划中的作者命名空间

上述命令的目标形态是 `jue preset` 作者命名空间（规划中，尚未实现，不得视为
已可用）：

```bash
jue preset create <name> [--dir <path>] [--extends <preset>...]
jue preset validate <path-or-package>
jue preset pack <path> [--out <dir>]
```

- `create`：生成普通 npm 包和最小 Canonical 目录。
- `validate`：校验 `package.json#ai`、目录、引用、敏感信息和可打包性。
- `pack`：在不执行 package scripts 的前提下调用 npm pack 语义并输出内容 hash。
