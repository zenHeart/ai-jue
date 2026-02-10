# ai-jue-core

<div align="center">

**ai-jue 的心脏：微内核架构与核心逻辑实现**

[![NPM version](https://img.shields.io/npm/v/ai-jue-core.svg?style=flat)](https://www.npmjs.com/package/ai-jue-core)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的核心模块。

</div>

---

## 什么是 ai-jue-core?

`ai-jue-core` 是整个 `ai-jue` 框架的核心引擎。它负责以下关键逻辑：

- **配置加载 (Config Loading)**：解析并校验 `ai.config.js`。
- **预设管理 (Preset Management)**：加载并解析远程或本地预设。
- **资产编排 (Asset Orchestration)**：执行“智能共存”策略，合并 Prompts 和 Skills。
- **适配器集成 (Adapter Integration)**：为各工具适配器提供统一接口和调用流。

## 安装

```bash
npm install ai-jue-core
```

## 文档

关于具体的框架使用，请参考主项目 [ai-jue](https://github.com/zenHeart/ai-jue) 文档。

## License

[MIT](LICENSE)
