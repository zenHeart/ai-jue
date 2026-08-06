# 核心工作流

## `jue init`

`jue init` 不带任何选项，交互式创建最小 `ai.config.js`（ESM 项目为 `ai.config.cjs`）。它依次询问：是否创建配置文件、使用哪个 preset（默认 `base`）、是否通过 npm/pnpm/yarn 安装该 preset 包、是否创建 `.ai/` 目录结构。

已有配置时跳过创建，只输出警告，不会静默覆盖。

```bash
jue init
```

## `jue apply`

把 Canonical DSL 收敛为目标 Agent Artifact：

```bash
jue apply [--watch] [--adapter <name>...] [--all] [--frozen] \
          [--dry-run | --check] [--artifact <kind> | --artifact-kind <kind>]
```

| 选项 | 说明 |
| --- | --- |
| `--watch`, `-w` | 监听配置与 `.ai/` 变更，变更后重新执行 apply |
| `--adapter <name>...` | 指定目标 adapter，可多次传入；接受 `codex`、`claude`、`claude-code`、`cursor`、`openclaw`、`hermes` 等别名 |
| `--all`, `-a` | 应用配置中的全部可用目标 |
| `--frozen` | 要求 Capability Source 引用不可变 |
| `--dry-run` | 预览变更，不写入，恒退出 0 |
| `--check` | 检查配置、漂移与确认能力，不写入 |
| `--artifact <kind>`, `--artifact-kind <kind>` | 指定 Artifact kind：`project`、`workspace`、`plugin`、`compatible-bundle`、`skill-plugin`，依 adapter 支持范围而定 |

一次执行内部完成：读取并校验配置，转换为 Canonical DSL，解析 plugin manifest，由 adapter 的 `write()` 计算变更，再按模式处理。任何阶段失败都不得报告成功。

| 模式 | 是否写入 | 用途 |
| --- | --- | --- |
| 默认 | 是 | 原子应用变更 |
| `--dry-run` | 否 | 预览 Artifact 变化，恒退出 0 |
| `--check` | 否 | CI 中检查配置、漂移与确认能力，任一不满足即非零退出 |

apply 不要求交互授权确认，预览与 CI 校验使用 `--dry-run` 与 `--check`。未检测到配置时 apply 会询问是否先运行 init，无法自动识别目标时会交互选择。拼写错误的 `--adpater` 仍被接受并显示警告。

退出码：无变更或已应用 0，待定或漂移冲突 3，未授权 4，回滚 1。目标 scope 非 project 或请求了 adapter 不支持的 Artifact kind 时退出码 2。

## `jue inspect`

只读解释 Jue 解析到的事实：

```bash
jue inspect [--extension <id>] [--diagnostics]
```

`--extension <id>` 指定要检查的 Extension 包，`--diagnostics` 追加诊断。不指定 `--extension` 时只输出一条警告并结束，不输出任何摘要。

`--diagnostics` 报告 Extension 的 npm 解析问题、其声明 adapter 的能力支持级别，以及当前项目 apply 的就绪状态（待定变更、漂移冲突、未授权变更计数）。该命令不写配置、lock 或 Artifact。

## JSON 输出

没有统一的 `--json` 选项。唯一带 `--json` 的是 `jue check`（检查预设安装版本），输出预设清单 JSON 到 stdout：

```json
{
  "presets": [
    {
      "preset": "base",
      "packageName": "jue-preset-base",
      "installedVersion": "1.0.0",
      "latestVersion": "1.1.0",
      "hasUpdate": true
    }
  ]
}
```

每个条目包含 `preset`、`packageName`、`installedVersion`（无法解析时为 `"unknown"`）、`latestVersion`、`hasUpdate`。npm 查询失败的条目不含版本字段，只含 `preset`、`packageName` 和 `error`。
