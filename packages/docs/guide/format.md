# 配置规整 (format)

`jue format` 命令用于将项目中分散的各种 AI 工具配置（如 `.cursor/`, `.gemini/`, `.claude/`, `.github/copilot-instructions.md`, `.trae/`, `.opencode/` 等）统一规整到 `.ai/` 目录中。

这是实现“配置自循环”的第一步：将特定工具的配置资产转化为 `ai-jue` 架构下的通用资产，以便后续可以轻松打包为预设（Preset）或在不同工具间共享。

这不是附属功能，而是架构中的核心一环：

- 它降低已有项目接入 `ai-jue` 的迁移成本
- 它让用户不需要手工把多种工具配置重写成 `.ai/`
- 它让“反向收敛 -> 正向分发”形成完整闭环

## 使用场景

- **存量项目接入**：当你已有一个使用 Cursor 或 Claude 指令的项目，想引入 `ai-jue` 进行规范化管理时。
- **跨工具迁移**：想将 Cursor 的 Rules 迁移给 Gemini 或 Claude 使用。
- **资产沉淀**：将项目中的 Prompt 沉淀到 `.ai/` 目录，准备打包发布为团队预设。

## 基本用法

默认情况下，`format` 以 **dry-run** 模式运行，仅扫描并展示迁移计划，不会修改任何文件：

```bash
npx jue format
```

### 执行迁移

使用 `--write` 参数执行实际的迁移操作：

```bash
npx jue format --write
```

### 强制覆盖

如果目标位置已存在同名文件且内容不同，`jue format` 会提示冲突并跳过。使用 `--force` 可以强制覆盖：

```bash
npx jue format --write --force
```

## 迁移映射规则

| 原始路径 | 目标路径 (`.ai/`) | 类型 |
| :--- | :--- | :--- |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` | `AGENTS.md` | 全局指令 |
| `.cursor/rules/*.mdc` | `rules/*.md` | 规则库 |
| `.cursor/commands/*.md`, `.gemini/commands/*.toml` | `commands/*/prompt.md` | 快捷命令 |
| `.cursor/skills/*/SKILL.md`, `.gemini/skills/*/SKILL.md` | `skills/*/SKILL.md` | 技能插件 |
| `.cursor/agents/*.md`, `.claude/agents/*.md` | `agents/*.md` | 代理配置 |
| `.cursor/hooks.json`, `.opencode/plugin/*.ts` | `hooks/` | 钩子拦截 |
| `.cursor/mcp.json`, `.trae/config.json` | `tools/{tool}/settings.json` | 工具配置 |

## 后续步骤

完成迁移后，建议执行以下操作：

1. **核对文件**：检查 `.ai/` 目录下的文件是否符合预期。
2. **配置关联**：在 `ai.config.js` 中确保已包含本地 `.ai` 目录。
3. **重新分发**：运行 `npx jue apply --all`，`ai-jue` 将根据 `.ai/` 中的最新资产，为所有检测到的工具重新生成（或更新）对应的配置文件。

这个流程对应的是：

1. 先把分散配置低成本收回来
2. 再用统一资产管理能力
3. 最后再分发到各工具

这也是 `ai-jue` 降低用户心智成本的关键路径之一
