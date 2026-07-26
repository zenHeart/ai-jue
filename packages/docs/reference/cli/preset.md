# Preset 作者命令

```bash
jue preset create <name> [--dir <path>] [--extends <preset>...]
jue preset validate <path-or-package>
jue preset pack <path> [--out <dir>]
```

| 子命令 | 行为 |
| --- | --- |
| `create` | 生成普通 npm 包和最小 Canonical 目录 |
| `validate` | 校验 `package.json#ai`、目录、引用、敏感信息和可打包性 |
| `pack` | 在不执行 package scripts 的前提下调用 npm pack 语义并输出内容 hash |

查询使用 `jue inspect --preset <ref>`。安装、升级、版本比较、发布和移除继续由
npm/pnpm/yarn 负责，Jue 不复制包管理器能力。详情见
[Preset npm 包约定](../preset-manifest.md)。
