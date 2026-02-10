# ai-jue-adapter-claude

<div align="center">

**Claude Code 适配器：生成 CLAUDE.md 上下文与技能**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-claude.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-claude)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的适配器模块。

</div>

---

## 功能描述

该适配器将 `ai-jue` 配置转换为 `CLAUDE.md` 格式，支持：

- **项目上下文 (Context)**：自动将 Prompts 映射为上下文区块。
- **技能 (Skills)**：将技能转换为工具兼容的描述。
- **斜杠命令 (Commands)**：将 `commands` 字段转换为 `CLAUDE.md` 中的指令。

## 安装

```bash
npm install ai-jue-adapter-claude
```

## 文档

关于具体的框架使用，请参考主项目 [ai-jue](https://github.com/zenHeart/ai-jue) 文档。

## License

[MIT](LICENSE)
