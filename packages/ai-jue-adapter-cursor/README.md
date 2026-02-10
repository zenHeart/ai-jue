# ai-jue-adapter-cursor

<div align="center">

**Cursor 适配器：生成 .cursor/rules 与 MCP 配置**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-cursor.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-cursor)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的适配器模块。

</div>

---

## 功能描述

该适配器将 `ai-jue` 配置转换为 Cursor 原生格式，支持：

- **项目规则 (Project Rules)**：从 Prompts 和 Skills 生成 `.cursor/rules/*.mdc` 文件。
- **MCP 服务**：将 `mcp` 配置映射到 `.cursor/mcp.json`。
- **指令注入**：将标准化 `commands` 注入规则描述，引导 AI 调用。

## 安装

```bash
npm install ai-jue-adapter-cursor
```

## 文档

关于具体的框架使用，请参考主项目 [ai-jue](https://github.com/zenHeart/ai-jue) 文档。

## License

[MIT](LICENSE)
