# jue-preset-base

<div align="center">

**ai-jue 基础预设：通用最佳实践与工程标准**

[![NPM version](https://img.shields.io/npm/v/jue-preset-base.svg?style=flat)](https://www.npmjs.com/package/jue-preset-base)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的预设模块。

</div>

---

## 功能描述

该预设提供了一套基础的 AI 工程化标准，包括：

- **代码审查 (Code Review)**：代码质量与安全审查标准。
- **Git 规范**：常规提交 (Conventional Commits) 指引与分支命名规则。
- **错误处理**：通用的错误管理与异常处理模式。
- **项目结构**：文件系统组织与命名最佳实践。

## 安装

```bash
npm install jue-preset-base
```

## 使用

```javascript
// ai.config.js
export default {
  preset: 'base'
}
```

## License

[MIT](LICENSE)
