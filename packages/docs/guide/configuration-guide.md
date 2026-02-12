# `ai.config.js` 配置指南

`ai.config.js` 是 `ai-jue` 的统一入口配置。目标是让你继续使用熟悉的 AI 工具概念，而不是学习一套新 DSL。

## 1. 最小可运行配置

```js
export default {
  presets: ['base']
}
```

执行：

```bash
npx jue apply
```

## 2. 推荐能力字段（规范）

```js
export default {
  presets: ['base'],
  language: 'zh-CN',

  commands: {
    review: {
      description: '代码审查',
      prompt: '请按正确性/性能/安全性审查当前改动',
      triggers: ['/review']
    }
  },

  hooks: {
    'pre-commit': 'npm run lint'
  },

  agents: {
    reviewer: {
      description: '专注审查',
      prompt: '你是严格的代码审查代理',
      tools: ['git', 'test']
    }
  },

  mcp: {
    servers: {
      filesystem: {
        command: 'npx',
        args: ['@modelcontextprotocol/server-filesystem', '.']
      }
    }
  },

  tools: {
    gemini: {
      temperature: 0.2
    }
  }
}
```

## 3. 字段说明

- `preset` / `presets`
  - 选择一个或多个预设。
  - 若同时存在，优先使用 `presets`。
- `extends`
  - 显式加载外部资产文件并合并。
- `language`
  - 多语言资产加载偏好，采用“优先语言文件，回退默认文件”策略。
- `commands`
  - 自定义命令集合。
- `hooks`
  - 生命周期钩子集合。
- `agents`
  - 自定义代理集合（规范名称）。
- `mcp`
  - MCP Server 统一配置。
- `tools`
  - 工具私有配置透传。

## 4. 兼容说明（迁移期）

- 规范字段为 `agents`。
- 历史字段 `subAgents` 处于兼容期，建议新配置不再使用。
- 在兼容期内，文档统一写 `agents`，实现层负责兼容映射。

## 5. `.ai` 与 preset 的同构关系

推荐把可复用资产放在 `.ai/`：

```text
.ai/
├── AGENTS.md
├── skills/
├── commands/
├── rules/
├── agents/
├── hooks/
└── tools/
```

这套结构可直接迁移为 `jue-preset-*` 包结构，减少二次整理成本。

## 6. 设计约束（文档口径）

- 最小知识原则：优先沿用主流工具已有概念。
- 向后兼容：新增能力默认不破坏已有配置。
- 降级可解释：目标工具不支持时必须输出降级提示，而不是静默丢失。
