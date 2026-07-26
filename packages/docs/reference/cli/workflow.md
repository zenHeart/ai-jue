# 核心工作流

## `jue init`

创建最小 `ai.config.js`：

```bash
jue init [--preset <ref>...] [--target <id>...] [--yes]
```

已有配置时不得静默覆盖。Preset 与 Extension 都由现有包管理器安装；`init` 可以
输出安装建议，但不重复实现包管理。

## `jue apply`

把 Canonical DSL 收敛为目标 Agent Artifact：

```bash
jue apply \
  [--from <canonical|agent>] \
  [--target <agent>...] \
  [--all] \
  [--artifact <kind>] \
  [--scope <project|user>] \
  [--dry-run | --check] \
  [--approve <action>...] \
  [--watch]
```

一次执行内部完成：读取与校验输入、转换为 Canonical DSL、计算 Artifact 差异、
展示风险、写入、再通过目标原生读取路径确认。任何阶段失败都不得报告成功。

| 模式 | 是否写入 | 用途 |
| --- | --- | --- |
| 默认 | 是 | 应用差异并确认 |
| `--dry-run` | 否 | 展示 Artifact 变化、降级和所需授权 |
| `--check` | 否 | CI 中检查配置、漂移和确认能力；任一不满足即非零退出 |

`--from <agent>` 用于导入或跨 Agent 迁移；所有转换仍经过 Canonical DSL。
`--all` 使用配置中的全部目标。涉及联网、安装依赖、启动进程或用户级写入时，
必须展示精确动作，并由 `--approve` 或交互确认授权。

`--watch` 只重复安全的项目级收敛，不得自动批准新的副作用。

## `jue inspect`

只读解释 Jue 解析到的事实：

```bash
jue inspect \
  [--capability <id>] \
  [--preset <id>] \
  [--extension <id>] \
  [--target <agent>] \
  [--artifact <kind>] \
  [--diagnostics]
```

无筛选条件时显示配置、Preset、Capability、目标 Adapter 和 Artifact 摘要。
`--diagnostics` 额外检查 Extension API 兼容性、npm 包解析、权限上限、目标运行
环境、所有权冲突和目标确认路径。该命令不得写配置、lock 或 Artifact。

## JSON 输出

`--json` 向 stdout 输出单一 envelope，日志写 stderr：

```json
{
  "schemaVersion": "1",
  "command": "apply",
  "mode": "dry-run",
  "status": "success",
  "data": {},
  "diagnostics": []
}
```

诊断必须有稳定 `code`、`severity`、`message` 和可执行 `remediation`，且不得包含
凭据或未脱敏用户信息。
