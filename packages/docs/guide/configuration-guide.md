# `ai.config.js` 配置文件详解

`ai.config.js` 是 `ai-jue` 项目的核心配置文件，它定义了项目的 AI 能力、预设选择以及针对特定 AI 工具的配置。该文件必须位于项目的根目录。

## 配置 Schema

这是一个完整的 `ai.config.js` JSON Schema 定义，它描述了所有可用的配置项及其结构。

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ai-jue Configuration",
  "description": "Schema for the ai-jue configuration file (ai.config.js)",
  "type": "object",
  "properties": {
    "preset": {
      "description": "Specifies the name of the preset package to use (e.g., 'base'). The CLI will resolve this to 'jue-preset-base'.",
      "type": "string"
    },
    "language": {
      "description": "The preferred language for loading assets from presets (e.g., 'zh-CN', 'en'). ai-jue CLI uses a progressive enhancement strategy for loading multi-language assets; see the 'Multi-language Asset Loading' section for details.",
      "type": "string"
    },
    "prompts": {
      "description": "Defines or overrides AI model prompts, keyed by tool or purpose.",
      "type": "object",
      "additionalProperties": {
        "type": "string"
      }
    },
    "skills": {
      "description": "Defines or overrides AI skills, keyed by skill name.",
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "description": {
            "type": "string",
            "description": "A brief description of what the skill does."
          },
          "prompt": {
            "type": "string",
            "description": "The core prompt or template for the skill."
          }
        },
        "required": ["description", "prompt"]
      }
    },
    "tools": {
      "description": "Tool-specific configurations, such as API parameters, model names, or safety settings.",
      "type": "object",
      "additionalProperties": {
        "type": "object"
      }
    },
    "options": {
      "description": "Runtime options for the ai-jue CLI itself.",
      "type": "object",
      "properties": {
        "verbose": {
          "description": "Enable verbose logging for debugging.",
          "type": "boolean",
          "default": false
        },
        "dryRun": {
          "description": "Run the apply command without making any file system changes.",
          "type": "boolean",
          "default": false
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": true
}
```

## 核心配置项详解

以下是 `ai.config.js` 中可用的主要配置项及其功能说明：

#### 1. `preset` (string)

*   **功能**: 指定项目使用的预设包的名称。`ai-jue` 会在 `node_modules` 中查找名为 `jue-preset-<preset>` 的包并加载它。
*   **示例**: `'base'`, `'react'`, `'nextjs'`
*   **行为**: 预设提供了基础的 prompts、skills 和其他配置。`ai.config.js` 中的其他配置项可以覆盖或扩展来自预设的内容。

#### 2. `prompts` (object)

*   **功能**: 定义或覆盖 AI 模型的提示语（Prompts）。这些提示语通常用于指导 AI 的行为或提供上下文。
*   **结构**: `prompts` 对象可以包含 AI 工具的名称作为键，其值可以是提示语字符串。
*   **示例**:
    ```javascript
    prompts: {
      claude: "这是一个针对 Claude 的项目特定提示，它会覆盖预设中的任何 Claude 提示。",
      gemini: "请作为 Gemini AI，专注于提供技术细节和准确的解决方案。"
    }
    ```
*   **行为**: `ai-jue` 会将这些提示传递给相应的适配器，适配器负责将其转化为 AI 工具可用的格式（例如，写入 `CLAUDE.md`）。

#### 3. `skills` (object)

*   **功能**: 定义或覆盖 AI 的技能（Skills）。一个技能通常代表 AI 可以执行的某个具体任务。
*   **结构**: `skills` 对象可以包含技能的名称作为键，其值是一个包含 `description` 和 `prompt` 的对象。
*   **示例**:
    ```javascript
    skills: {
      codeReview: {
        description: "对代码进行全面的审查，侧重于最佳实践和潜在问题。",
        prompt: "请仔细审查以下代码，并指出任何需要改进的地方："
      }
    }
    ```
*   **行为**: 这些技能的定义会被合并到最终配置中，供适配器或其他工具使用。

#### 4. `tools` (object)

*   **功能**: 包含针对特定 AI 工具的配置，如 API 参数、模型名称、安全设置等。
*   **结构**: `tools` 对象以 AI 工具的名称作为键，其值是该工具接受的原始配置对象。
*   **示例**:
    ```javascript
    tools: {
      gemini: {
        model: "gemini-pro",
        temperature: 0.7,
        safetySettings: {
          "harassment": "BLOCK_LOW_AND_ABOVE"
        }
      }
    }
    ```
*   **行为**: 适配器会读取其对应工具的 `tools` 配置，并将其应用到最终生成的文件中。

#### 5. `options` (object)

*   **功能**: 包含 `ai-jue` CLI 本身的运行时选项。
*   **示例**:
    ```javascript
    options: {
      verbose: true, // 启用详细日志输出
      dryRun: false  // 启用空运行模式，只显示将要执行的操作
    }
    ```
*   **行为**: 这些选项影响 `ai-jue` CLI 的行为，而不是生成的文件内容。

#### 6. `language` (string)

*   **功能**: 指定项目当前使用的主要语言，用于国际化（i18n）。
*   **示例**: `'zh-CN'`, `'en'`
*   **行为**: `ai-jue` CLI 采用**渐进增强**的策略加载多语言资产。它会根据此设置，智能地查找并加载预设或本地资产中的多语言文件。详细的加载优先级规则，请参阅 [多语言资产加载](#多语言资产加载) 部分。
## “智能共存”：非破坏性写入策略

一个核心的设计原则是，`ai-jue` 在任何情况下都不应破坏或覆盖用户的手动配置。`apply` 命令通过以下两种“智能共存”策略来保证这一点：

### 1. 区块管理 (适用于 .md 等文本文件)

对于 `.md` 文件（如 `CLAUDE.md`, `GEMINI.md`），`ai-jue` 使用特殊的注释标记来界定它所管理的内容范围：

```markdown
<!-- AI-JUE:START -->
<!-- 警告：此部分由 ai-jue 自动生成... -->
这是由 ai-jue 管理的内容。
<!-- AI-JUE:END -->

您可以在这些标记之外自由添加任何内容，例如项目特定的笔记、个人提醒等。`ai-jue` 在运行时，只会更新 `START` 和 `END` 标记之间的内容，而标记之外的所有内容都将**永远被保留**。

### 2. 深度合并 (适用于 .json 文件)

对于 `.json` 文件（如 `.gemini/settings.json`），`ai-jue` 会执行“深度合并 (Deep Merge)”操作。

*   **只会更新**：它仅更新或添加由预设或 `ai.config.js` 定义的字段。
*   **不会删除**：您手动添加到 `.json` 文件中的任何其他字段，都不会被删除或修改。

这个机制让您可以放心地将 `ai-jue` 管理的配置与您自己的个性化配置结合在同一个文件中。
