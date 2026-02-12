# jue-preset-base

<div align="center">

**ai-jue 核心预设：Agentic SDLC 元规则体系**

> "以元规则 (Meta-Rules) 驱动 AI，让软件工程最佳实践成为 AI 的本能。"

[![NPM version](https://img.shields.io/npm/v/jue-preset-base.svg?style=flat)](https://www.npmjs.com/package/jue-preset-base)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

</div>

---

## 📖 核心理念：Agentic SDLC

在传统开发中，AI 往往只是一个“代码片段生成器”。而在 **Agentic SDLC (Agentic Software Development Life Cycle)** 中，我们将 AI 视为完整的合作伙伴，通过 **元规则 (Meta-Rules)** 约束其在软件开发全生命周期中的行为。

本预设不仅仅是一堆 Prompt，它是一套**强约束协议**，确保 AI 在以下 5 个阶段中不仅仅是“做对”，更是“做到位”：

1. **Phase 1-2: 意图理解 (Intent)**
    - AI 必须在写代码前确认你的需求。
    - 消灭模糊猜测，强制多问一句。
2. **Phase 3: 实现质量 (Implementation)**
    - 架构优先于代码，思考优先于行动。
    - 默认遵循 SOLID、DRY、KISS 原则。
3. **Phase 4: 自验证 (Verification)**
    - 绝不裸奔：代码、测试、文档必须同步交付。
    - 自动执行自检清单。
4. **Phase 5: 可审查性 (Reviewability)**
    - 每一个变更都要有理由 (Reasoning)。
    - 输出结构化，便于人类 Review。
5. **Feedback Loop**:
    - 错误是学习的机会，AI 需具备自我修正能力。

## 🚀 快速开始

无需繁琐配置，只需一行命令，即可将 Agentic SDLC 注入你的项目：

```bash
# 在项目根目录运行
npx ai-jue init

# 选择 "base" 预设
# ai-jue 会自动识别你的编辑器 (Cursor, VSCode+Copilot, Claude, etc.)
# 并生成对应的配置文件 (如 AGENTS.md, .github/copilot-instructions.md)
```

或者手动配置 `ai.config.js`:

```javascript
export default {
  presets: ['base'], // 加载基础元规则
  // ...其他配置
}
```

## 🛠️ 能力矩阵 (Capabilities)

该预设基于 `ai-jue` 的 **Prompt Layer Protocol**，将能力映射到具体工具：

| 能力组件 | 对应 SDLC 阶段 | 功能描述 | 触发方式 |
| :--- | :--- | :--- | :--- |
| **Meta-Rules** | All | 全局行为约束，植入 System Prompt | 自动加载 |
| **Command: /explain** | Phase 2 | 业务优先的代码解释与可视化 | `/explain` |
| **Command: /plan** | Phase 3 | 架构设计与实现计划 | `/plan` |
| **Command: /refactor** | Phase 3 | 保证行为不变的重构建议 | `/refactor` |
| **Command: /optimize** | Phase 3 | 三层模型性能优化分析 | `/optimize` |
| **Command: /test** | Phase 4 | 测试金字塔策略生成 | `/test` |
| **Command: /doc** | Phase 4 | 场景驱动的文档生成 | `/doc` |
| **Command: /review** | Phase 5 | 模拟 Principal Engineer 的代码审查 | `/review` |
| **Command: /security** | Phase 5 | OWASP Top 10 安全审计 | `/security` |

> **注意**: 具体支持的命令取决于你的 AI 工具（Cursor, Copilot, Claude 等）对 Slash Command 的支持程度。如果不支持，可以通过自然语言触发（如“请帮我 review 这段代码”）。

## 💡 最佳实践

- **Review 零修改**: 我们的目标是让 AI 产出的代码无需人类修改即可通过 Review。如果 AI 犯错，请不要直接帮它改，而是指出违反了哪条元规则，让它自己修正。
- **混合使用**: 推荐在本预设基础上，叠加技术栈预设 (如 `jue-preset-react`, `jue-preset-typescript`) 以获得更细粒度的最佳实践。

## License

[MIT](LICENSE)
