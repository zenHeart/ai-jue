# 适配器通用能力标准化与跨工具适配方案

为了解决 `ai-jue` 适配器在通用能力转换上的不足，本规范以 Cursor 为基准，建立一套跨工具（Cursor, Claude Code, Gemini CLI, Copilot）的通用能力映射与转换标准。

## 1. 通用能力映射表 (Capability Mapping Matrix)

我们定义了 7 大核心通用能力，并明确了各工具的对应实现机制。

| 通用能力 (AI-Jue) | 描述 | Cursor | Claude Code | Gemini CLI | GitHub Copilot |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Rules** | 核心行为准则 | `.cursorrules` (System Prompt) | `CLAUDE.md` (Context) | `.gemini/settings.json` (systemPrompt) | `.github/copilot-instructions.md` |
| **Commands** | 快捷指令 (/) | 自然语言触发 ("When I say...") | `CLAUDE.md` (/slash commands) | `.gemini/settings.json` (customCommands) | 自然语言触发 ("Run command...") |
| **Skills** | 特定任务能力 | `.cursorrules` (Capability Description) | `CLAUDE.md` (Prompt with Trigger) | `.gemini/settings.json` (tools/prompts) | `.github/copilot-instructions.md` (Skill Description) |
| **Hooks** | 生命周期钩子 | `features.hooks` (Settings) / 脚本集成 | Git Hooks集成 / `lib/hooks` (概念) | `.gemini/settings.json` (hooks: pre/post) | VS Code Tasks / IDE Events |
| **Sub-agents** | 垂直领域专家 | Agent Mode (切换模型/Prompt) | 多会话 / 显式 Context 切换 | `.gemini/settings.json` (subAgents) | 无原生支持 (通过 @workspace 模拟) |
| **MCP** | 多组件协议 | `.cursor/mcp.json` | `claude_desktop_config.json` | `.gemini/settings.json` (mcpServers) | 暂无原生支持 (需桥接) |
| **AGENTS.md** | 全局角色设定 | 注入 `.cursorrules` 顶部 | 注入 `CLAUDE.md` 顶部 | 注入 System Prompt | 注入 Instructions 顶部 |

## 2. 三层适配架构方案 (Three-Layer Adapter Architecture)

### 2.1 核心层 (Core Layer): 标准化配置 Schema

在 `ai.config.js` 中定义标准化的 Schema，作为单一事实来源。

```typescript
interface AiJueConfig {
  // ...现有配置
  
  // 1. 命令系统
  commands: {
    [commandName: string]: {
      description: string;
      prompt: string;
      triggers: string[]; // 触发词，如 ["/fix", "修复"]
    }
  };

  // 2. 生命周期钩子
  hooks: {
    "pre-commit": string | { script: string; tools: string[] }; // 在 commit 前执行
    "post-apply": string; // ai-jue apply 后执行
  };

  // 3. 子代理
  subAgents: {
    [agentName: string]: {
      description: string;
      prompt: string;
      tools?: string[]; // 该代理可用的工具/MCP
    }
  };
  
  // 4. MCP (已定义)
  mcp: McpConfig;
}
```

### 2.2 转换层 (Transformation Layer): 配置生成逻辑

各适配器负责将核心配置转换为目标工具的格式。

*   **Cursor Adapter**:
    *   `commands` -> 转换追加到 `.cursorrules`: "If the user types '/fix', you must execute..."
    *   `hooks` -> 生成 `.cursor/settings.json` (若支持) 或提示用户配置 IDE 触发器。
    *   `mcp` -> 生成 `.cursor/mcp.json`。

*   **Claude Adapter**:
    *   `commands` -> 转换追加到 `CLAUDE.md`: `/fix - 修复代码问题`。
    *   `hooks` -> 生成 `.githooks/pre-commit` 脚本，调用 `claude` CLI（如果可用）。

*   **Gemini Adapter**:
    *   `commands` -> 映射到 `customCommands` 字段。
    *   `hooks` -> 映射到 `hooks` 字段。

### 2.3 兼容层 (Compatibility Layer): 降级策略

当目标工具不支持某项能力时，采用降级方案：

*   **MCP 降级**: 对于不支持 MCP 的工具（如 Copilot），在生成的 Instructions 中添加提示："此项目配置了 MCP 工具 [ToolName]，请使用支持 MCP 的终端运行相关命令。"
*   **Hooks 降级**: 如果工具不支持 Hooks，生成通用的 Shell 脚本（如 `scripts/pre-commit.sh`），并提示用户手动配置 Git Hooks。

## 3. 实现案例：Hooks 能力转换 (Pre-commit)

假设 `ai.config.js` 配置：
```javascript
hooks: {
  "pre-commit": "npm run lint"
}
```

*   **Claude Code**:
    *   生成 `.git/hooks/pre-commit` 文件（需用户权限），内容为调用 `npm run lint` 并在失败时阻止提交，同时尝试调用 Claude Code 进行自动修复（如果 CLI 支持）。
    *   或者生成文档提示用户："建议在 pre-commit 中运行 `claude code --print 'Check this code'`"。

*   **Gemini CLI**:
    *   在 `.gemini/settings.json` 中添加：
        ```json
        "hooks": {
          "pre-commit": "npm run lint"
        }
        ```

*   **Copilot**:
    *   生成 `.vscode/tasks.json`，定义一个 "Pre-commit Check" 任务，建议用户手动运行。

## 4. 验证标准

1.  **Schema 校验**: 所有生成的配置文件（JSON/YAML）必须通过对应的 JSON Schema 校验。
2.  **功能一致性**: `commands` 在所有支持的工具中必须能被识别（通过 `/command` 或自然语言触发）。
3.  **无损更新**: 再次运行 `apply` 时，必须保留用户在 `<!-- AI-JUE:START -->` 区块外的手动修改。
