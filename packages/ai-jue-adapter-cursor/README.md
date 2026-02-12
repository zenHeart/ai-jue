# ai-jue-adapter-cursor

<div align="center">

**Cursor 适配器：按 Cursor 机制生成规则、命令、技能与配置**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-cursor.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-cursor)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的适配器模块。

</div>

---

## 功能描述

该适配器将 `ai-jue` 规范能力转换为 Cursor 原生输出，支持：

- **全局上下文**：Cursor 原生消费项目根目录 `AGENTS.md`
- **项目规则**：`rules/*` -> `.cursor/rules/*.mdc`
- **命令**：`commands/*` -> `.cursor/commands/*.md`
- **技能**：`skills/*` -> `.cursor/skills/*/SKILL.md`
- **钩子**：`hooks/*` -> `.cursor/hooks.json`
- **MCP 服务**：`mcp.servers` -> `.cursor/mcp.json`

## 安装

```bash
npm install ai-jue-adapter-cursor
```

## 文档

关于具体的框架使用，请参考主项目 [ai-jue](https://github.com/zenHeart/ai-jue) 文档。

## License

[MIT](LICENSE)
