# ai-jue-adapter-copilot

<div align="center">

**GitHub Copilot 适配器：生成 .github/copilot-instructions.md**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-copilot.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-copilot)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的适配器模块。

</div>

---

## 功能描述

该适配器将 `ai-jue` 配置转换为 GitHub Copilot 格式，支持：

- **自定义指令**：生成 `.github/copilot-instructions.md`。
- **平滑降级 (Downgrade)**：将 `rules/mcp/agents` 等能力显式降级为文本指令，避免静默忽略。
- **工具配置**：`tools.copilot` -> `.github/copilot-settings.json`。

## 安装

```bash
npm install ai-jue-adapter-copilot
```

## 文档

关于具体的框架使用，请参考主项目 [ai-jue](https://github.com/zenHeart/ai-jue) 文档。

## License

[MIT](LICENSE)
