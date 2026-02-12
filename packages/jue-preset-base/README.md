# jue-preset-base

<div align="center">

**面向用户核心场景的通用工程预设（Agentic SDLC 最小闭环）**

[![NPM version](https://img.shields.io/npm/v/jue-preset-base.svg?style=flat)](https://www.npmjs.com/package/jue-preset-base)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

</div>

---

## 1. 预设定位

`jue-preset-base` 不是“大而全 Prompt 集合”，而是一个**用户场景优先**的基础预设：

- 目标：先解决最常见、最痛的开发协作问题
- 范围：意图识别、新项目启动、已有项目开发/重构
- 原则：先形成最小闭环，再持续迭代扩展

一句话定义：
**让用户在最小输入下，稳定获得“可审查、可验证、可交付”的 AI 产出。**

---

## 2. 设计目标（以终为始）

### 终态目标

- 用户提出需求后，AI 先完成意图澄清，再进入实现
- 产出不只代码，还包含验证与说明，降低返工
- 人类 Review 聚焦业务判断，而不是基础质量修复

### 非目标（本阶段刻意不做）

- 不做复杂企业治理流程编排
- 不做工具私有高级特性的全覆盖
- 不做超大而全命令体系

---

## 3. 核心用户场景

### 场景 A：用户意图识别（需求进入）

痛点：
- 需求描述模糊，AI 直接编码导致返工

base 提供：
- 全局元规则要求“先确认意图，再实施”
- 输出需包含边界、约束、假设

成功标准：
- 关键需求歧义在编码前被识别并确认

### 场景 B：启动新项目（冷启动）

痛点：
- 项目初期缺统一规则，产出风格不一致

base 提供：
- `AGENTS.md` 注入全局工程约束
- 一组通用命令覆盖从解释到审查的基础流程

成功标准：
- 新项目在首日即可形成统一协作约束与操作路径

### 场景 C：已有项目开发与重构（主战场）

痛点：
- 变更质量不稳定，测试/文档常漏，Review 成本高

base 提供：
- 7 个核心命令：`jue:impl`、`jue:fix`、`jue:rev`、`jue:ref`、`jue:exp`、`jue:test`、`jue:doc`
- 明确“实现 + 验证 + 审查”闭环

成功标准：
- 常见需求可通过标准流程稳定落地，Review 反复轮次下降

---

## 4. 功能设计（最小能力集）

### 4.1 全局元规则

- 入口文件：`AGENTS.md` / `AGENTS.en.md`
- 作用：定义 Agentic SDLC 的基础行为约束
- 核心要求：
  - 先确认意图
  - 架构优先于盲写
  - 变更必须可验证、可审查

### 4.2 命令能力（7 个核心命令）

| 命令 | 核心痛点 | 输出要求 |
| --- | --- | --- |
| `jue:impl` | 需求模糊直接开写导致返工 | 先意图确认与设计，再实施与验证 |
| `jue:fix` | Bug 修复治标不治本、回归风险高 | 明确复现与根因，修复后回归验证 |
| `jue:rev` | 审查只看功能，不看非功能质量 | 同时覆盖正确性/可维护性/性能/安全 |
| `jue:ref` | 重构引入行为变化、改动不可控 | 保持功能幂等与行为不变，小步可回滚 |
| `jue:exp` | 新人上手慢、设计意图难传递 | 讲清架构意图、数据流和关键约束 |
| `jue:test` | 测试薄弱、边界 case 漏检 | 基于改动生成高价值测试与边界用例 |
| `jue:doc` | 文档按实现写，不按用户思维写 | 面向用户任务流组织，降低认知负荷 |

> 说明：若目标工具不支持 slash command，可用自然语言触发同等意图。

### 4.3 命令设计依据（高频 agentic 工作流）

本命令集聚焦高频任务，而非追求覆盖全部能力。依据官方资料中的常见工作流：

- 代码理解/上手：理解新代码库与执行链路
- 功能实现与缺陷修复：实现功能、修复 bug
- 重构与质量改进：在行为不变前提下重构
- 测试与文档：补齐测试覆盖、更新文档
- 审查闭环：通过 PR/Review 反馈持续修正

对应资料见“参考依据”。

### 4.4 用户命令接口与当前资产映射

为降低用户认知负担，用户侧统一使用 `jue:*` 命名；实现层可保留渐进迁移：

| 用户命令接口 | 当前资产目录（实现层） |
| --- | --- |
| `jue:exp` | `commands/explain` |
| `jue:ref` | `commands/refactor` |
| `jue:test` | `commands/test` |
| `jue:doc` | `commands/doc` |
| `jue:rev` | `commands/review` |
| `jue:impl` | `commands/impl` |
| `jue:fix` | `commands/fix` |

### 4.5 资产协议

- 命令目录：`commands/*/{prompt.md,prompt.en.md}`（通过 YAML frontmatter 定义 `description`、`triggers` 等元数据）
- 双语要求：中文与英文语义对齐

### 4.6 Conventional Commits 对齐（提交建议层）

为对齐 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)，在不增加用户认知负担前提下：

- 用户接口保持不变：`jue:impl`、`jue:fix`、`jue:rev`、`jue:ref`、`jue:exp`、`jue:test`、`jue:doc`
- 命令输出增加“建议提交头”映射：
  - `jue:impl -> feat`
  - `jue:fix -> fix`
  - `jue:ref -> refactor`
  - `jue:test -> test`
  - `jue:doc -> docs`
  - `jue:rev -> chore`（仅在有代码改动时）
  - `jue:exp -> docs`（仅在产出文档改动时）
- 建议格式：
  - `<type>(<scope>): <description>`
  - 破坏性变更使用 `!` 或 `BREAKING CHANGE:` footer

---

## 5. 使用方式

### 快速接入

```bash
npm i -D ai-jue jue-preset-base
```

```js
// ai.config.js
module.exports = {
  presets: ['base']
}
```

```bash
npx jue apply
```

### 推荐叠加

- 在 base 之上叠加技术栈预设（如 react/typescript）
- 在项目本地 `.ai/` 追加团队规则与命令

---

## 6. 验收标准（用于持续迭代）

- 命令集合完整且可被加载（7 个核心命令）
- AGENTS 与命令双语资产结构一致
- 在至少一条真实开发流程中可形成“意图 -> 实施 -> 验证 -> 审查”闭环

## 7. 参考依据

- [Anthropic Claude Code - Common workflows](https://docs.anthropic.com/en/docs/claude-code/common-workflows)
- [Anthropic Claude Code - Slash commands](https://docs.anthropic.com/en/docs/claude-code/slash-commands)
- [Cursor Docs - Commands](https://docs.cursor.com/en/agent/chat/commands)
- [Cursor Docs - Rules](https://docs.cursor.com/en/context)
- [GitHub Changelog - Copilot coding agent GA](https://github.blog/changelog/2025-09-25-copilot-coding-agent-is-now-generally-available/)
- [GitHub Docs - Copilot coding agent](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent)
- [OpenAI Codex - Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md/)

---

## License

[MIT](LICENSE)
