# 创建预设 (Preset)

`ai-jue` 的核心是其可复用的预设生态。一个预设是一个独立的 npm 包，它封装了一系列可复用的“能力资产”。

## 快速创建

使用 `create-preset` 命令快速生成预设模板：

```bash
npx jue create-preset myteam
```

这将创建一个名为 `jue-preset-myteam` 的目录，包含标准的预设结构。

## 目录结构

现代的 `ai-jue` 预设是**无需构建 (Build-Free)** 的纯文件集合。CLI 会直接扫描包内的文件结构。

```
jue-preset-myteam/
├── package.json
├── README.md
├── prompts/                    # 存放 Prompt
│   └── code-style/             # Prompt 名称 (文件夹名)
│       ├── prompt.md           # 通用内容
│       ├── prompt.zh-CN.md     # 中文内容 (可选)
│       └── META.json           # 元数据 (可选)
└── skills/                     # 存放 Skill
    └── component-gen/          # Skill 名称 (文件夹名)
        ├── prompt.md
        └── META.json
```

### 结构解释

1.  **能力即目录**
    在 `prompts` 或 `skills` 目录下，每个具体的能力都必须是一个**独立目录**。目录名即为能力的 ID。

2.  **`META.json` (可选)**
    在能力目录中，可以使用 `META.json` 定义元数据：
    ```json
    {
      "description": "Generates a React component",
      "parameters": [...]
    }
    ```

3.  **多语言内容**
    支持 `prompt.md` (默认), `prompt.zh-CN.md` 等命名方式。

## 发布

准备好后，直接发布到 npm：

```bash
npm publish
```

无需编译 TypeScript，也无需 `index.ts` 导出文件。
