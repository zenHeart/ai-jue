# ai-jue-adapter-gemini

<div align="center">

**Gemini CLI 适配器：生成 Gemini 原生配置**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-gemini.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-gemini)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的适配器模块。

</div>

---

## 功能描述

该适配器将 `ai-jue` 配置转换为 Gemini CLI 格式，支持：

- **系统设置**：生成 `.gemini/settings.json`（`tools.gemini`、hooks/agents/mcp 合并注入）。
- **自定义命令**：将 `commands/*` 转换为 `.gemini/commands/**/*.toml`（Gemini CLI 原生命令格式）。
  - `prompt.md` 的 YAML 元数据 `description` 映射到 TOML `description`
  - `prompt.md` 正文映射到 TOML `prompt`
- **系统提示词**：生成 `GEMINI.md`（通过 `@AGENTS.md` 引用全局上下文，并叠加 `prompts.gemini`）。
- **规则降级**：`rules` 显式降级写入 `GEMINI.md`，避免静默丢失。

## 安装

```bash
npm install ai-jue-adapter-gemini
```

## 文档

关于具体的框架使用，请参考主项目 [ai-jue](https://github.com/zenHeart/ai-jue) 文档。

## License

[MIT](LICENSE)
