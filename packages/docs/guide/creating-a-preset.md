# 创建预设 (Preset)

`ai-jue` 的核心是其可复用的预设生态。一个预设是一个独立的 npm 包，它封装了一系列可复用的“能力资产”，如 prompts 和 skills。

## 命名约定

预设包的名称必须以 `jue-preset-` 开头。例如：`jue-preset-base`, `jue-preset-react`。

## 目录结构

我们推荐采用“能力即目录”的结构来组织你的预设，这种结构清晰、可扩展，并且原生支持国际化。

```
/jue-preset-react/
├── src/
│   ├── skills/                     # 存放所有技能
│   │   ├── component-generator/    # “组件生成器”技能
│   │   │   ├── index.json          # 元数据：定义技能的名称、描述等
│   │   │   ├── prompt.en.md        # 核心内容：英文版本的提示
│   │   │   └── prompt.zh-CN.md     # 核心内容：中文版本的提示
│   │   └── ...
│   │
│   ├── prompts/                    # 存放特定的、非技能性的提示
│   │   └── ...
│   │
│   └── index.ts                    # 负责读取 assets 目录并导出配置
│
└── package.json
```

### 结构解释

1.  **能力即目录 (`skills/component-generator/`)**
    在 `src` 目录下，我们按“能力类型”创建子目录（如 `skills`）。每个具体的能力，如 `component-generator`，都是它所在分类下的一个**独立目录**。这个目录名是该能力的唯一 ID。

2.  **`index.json` - 能力的“身份证”**
    在每个能力目录中，都有一个 `index.json` 文件。它用来定义这个能力的**元数据**。
    ```json
    // skills/component-generator/index.json
    {
      "name": "React Component Generator",
      "description": "Generates a React component from a description.",
      "parameters": [
        { "name": "componentName", "type": "string", "required": true }
      ]
    }
    ```

3.  **多语言内容文件 (i18n)**
    预设中的内容文件（例如提示语、技能描述）支持多语言。你可以使用以下命名约定：
    *   `[文件名].md`：不带语言后缀的通用版本（例如 `prompt.md`）。
    *   `[文件名].<locale>.md`：带语言后缀的版本（例如 `prompt.en.md`, `prompt.zh-CN.md`）。
    `ai-jue-cli` 会根据用户在 `ai.config.js` 中配置的 `language` 字段，智能地选择最匹配的语言文件加载。如果用户没有指定语言，或者指定语言的文件不存在，CLI 会有一套**查找优先级和回退机制**来确保总是加载到最合适的可用内容。这种策略让预设作者可以灵活提供内容，而用户也能按需获取本地化体验。

### `index.ts` 的职责

预设包的入口文件（通常是 `src/index.ts`）负责动态读取 `src` 目录下的所有能力，并根据目录结构自动构建并导出一个结构化的配置对象。`ai-jue-cli` 在加载预设时，就能得到一个包含所有语言、所有能力的完整对象。
