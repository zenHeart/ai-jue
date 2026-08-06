# 快速上手

## 1. 安装

在你的项目中安装 `ai-jue` 和需要的预设：

```bash
npm install -D ai-jue jue-preset-base
```

## 2. 初始化

在项目根目录运行初始化命令，引导创建配置文件：

```bash
npx jue init
```

交互式流程如下：

```text
Initializing ai-jue...
Create ai.config.js? (Y/n) Y
Enter preset name (default: base): base
Created ai.config.js
Create .ai directory structure? (Y/n) Y
Created .ai directory with AGENTS.md, rules/, commands/, skills/, agents/, hooks/, tools/ subdirectories.
```

## 3. 应用配置

运行 `apply` 命令，根据配置生成 AI 工具文件：

```bash
npx jue apply --all
```

`ai-jue` 会读取 `ai.config.js`、加载预设以及本地 `.ai` 目录中的资产；如果项目根目录存在 `AGENTS.md` 也会自动注入，并生成相应配置文件（如 `CLAUDE.md`, `.cursor/rules/*.mdc`, `.codex/config.toml` 等，Cursor 直接消费根目录 `AGENTS.md`）。

## 4. 常用命令

以下命令当前可用。

### CI 检查

目标命令为 Planned。它检查配置与 Artifact 漂移：

```bash
npx jue apply --all --check
```

### 实时监听 (Watch Mode)
在开发过程中实时监听配置变化并自动重新应用：
```bash
npx jue apply --all --watch
```

### 创建新预设

```bash
npx jue create-preset my-preset
```

作者命名空间 `jue preset create` 为 Planned，实现前不要在自动化中调用。完整状态见
[实现状态](../developer/implementation-status.md)，详细配置见
[配置指南](./configuration-guide.md)。
