# ai-jue-adapter-gemini

<div align="center">

**Gemini CLI 适配器：生成 .gemini/settings.json**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-gemini.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-gemini)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的适配器模块。

</div>

---

## 功能描述

该适配器将 `ai-jue` 配置转换为 Gemini CLI 格式，支持：

- **系统设置**：生成 `.gemini/settings.json`。
- **系统提示词 (System Prompt)**：将 Prompts 和 Skills 合并入全局系统提示。
- **MCP 服务**：将 `mcp` 服务映射为 Gemini 兼容的工具配置。

## 安装

```bash
npm install ai-jue-adapter-gemini
```

## 文档

关于具体的框架使用，请参考主项目 [ai-jue](https://github.com/zenHeart/ai-jue) 文档。

## License

[MIT](LICENSE)
