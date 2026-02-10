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
- **平滑降级 (Downgrade)**：将 Skills 和 Prompts 映射为纯文本指令。
- **功能引导**：针对 Copilot 尚未原生支持的能力（如 MCP），提供文本形式的操作指引。

## 安装

```bash
npm install ai-jue-adapter-copilot
```

## 文档

关于具体的框架使用，请参考主项目 [ai-jue](https://github.com/zenHeart/ai-jue) 文档。

## License

[MIT](LICENSE)
