# ai-jue-adapter-claude

<div align="center">

**Claude Code 适配器：生成 CLAUDE.md、MCP 与 Claude 配置**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-claude.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-claude)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的适配器模块。

</div>

---

## 功能描述

该适配器将 `ai-jue` 能力映射为 Claude 可消费产物，支持：

- **上下文/规则/命令/技能/钩子/代理**：统一写入 `CLAUDE.md`（通过 `@AGENTS.md` 引用全局上下文；`rules` 为显式降级映射）。
- **MCP**：`mcp.servers` -> `.mcp.json`。
- **工具配置**：`tools.claude` -> `.claude/settings.json`。

## 安装

```bash
npm install ai-jue-adapter-claude
```

## 文档

关于具体的框架使用，请参考主项目 [ai-jue](https://github.com/zenHeart/ai-jue) 文档。

## License

[MIT](LICENSE)
