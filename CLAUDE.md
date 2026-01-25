<!-- AI-JUE:START -->
<!-- 警告：以下内容由 ai-jue 自动生成，手动修改将在下次运行时被覆盖。 -->
<!-- 要修改这部分内容，请更新你的 ai.config.js 或相关预设。 -->

Project-specific prompt for Claude: This is an override from ai.config.js.
<!-- AI-JUE:END -->

# CLAUDE.md

此文件为 Claude Code 在此仓库中工作时提供指导，包含项目的核心理念、长期战略和开发约定。

---

## 项目核心理念与长期战略 (Core Philosophy & Long-term Strategy)

`ai-jue` 的表面定位是一个“AI工具的配置管理器”，但其深层战略远不止于此。所有开发工作都应围绕其核心的“自举”和“飞轮”模型，并服务于以下长期愿景。

### 核心理念：从工具到生态
项目不仅是一个有用的工具，更是一个旨在构建繁荣、健康的AI能力共享生态的平台。其成功依赖于“使用->沉淀->分享->壮大”的飞轮效应。

### 四大长期战略挑战与方向

在开发过程中，我们必须持续思考并解决以下四个战略层面的问题，以确保项目的长期生命力和竞争力。

#### 1. 生态系统与治理 (Ecosystem & Governance)
**挑战：** 如何在一个开放的生态中，帮助用户发现高质量的预设，并建立信任？
**方向：**
- **质量策展：** 建立预设的“官方认证”或“社区精选”机制，以及可量化的质量评分体系。
- **命名与维护：** 推广 `@scope` 命名空间，并设计预设的“废弃”与“社区领养”流程。

#### 2. 开发者工作流的无缝集成 (Seamless Workflow Integration)
**挑战：** 如何让AI的配置过程“消失”在日常开发中，成为无感的自动化基础设施？
**方向：**
- **热重载体验：** 通过 `apply --watch` 模式，实现修改配置后自动同步，无需手动执行命令。
- **源映射与调试 (Source Maps for Prompts):** 探索在生成文件中注入来源注释，并配合IDE插件实现来源追溯，将AI配置调试从“黑盒”变为“白盒”。

#### 3. 跨工具抽象的挑战 (The Challenge of Cross-Tool Abstraction)
**挑战：** 当不同AI工具的能力出现巨大分化时，如何维持“一次配置，多处使用”的承诺？
**方向：**
- **编译器架构：** 将 `ai-jue` 的核心定位为一个“编译器”，它能将一种“抽象AI能力描述”编译到多种不同的目标格式（`CLAUDE.md`, `.gemini/settings.json`等）。“插件”的真正角色是提供新的“编译器后端”。
- **逃生通道 (Escape Hatch):** 允许在配置中为特定工具提供“直通”的原始配置，绕过抽象层以使用其独有高级功能。

#### 4. 配置语言的表达力 (Expressiveness of Configuration)
**挑战：** 当用户需求超越简单的“组合”时，如何提供更强大的配置能力？
**方向：**
- **高级操作符：** 未来可探索支持对继承自预设的资产进行精细化操作，例如“禁用”(`false`)或“修改/补丁”(`patching`)。

---

## 项目概览

`ai-jue` 是一个旨在解决 AI 工具配置碎片化和开发经验无法有效复用问题的命令行工具。它的核心价值在于将 AI 工具的配置过程标准化，就像 `ESLint` 为代码质量所做的那样。

该工具帮助开发者解决两大痛点：
1.  **统一管理**：避免手动维护分散在不同工具下的配置文件（如 `.gemini`, `.cursor`, `.claude`）。
2.  **经验沉淀**：提供一种机制，将高价值的 AI 开发能力（如 `skill`, `command` 配置）沉淀为可复用的**预设 (Preset)**，实现跨项目、跨团队的知识共享。

其核心思想是复用前端开发者熟悉的“预设”生态概念，从而极大地降低学习成本。

## 构建和运行

这是一个基于 Node.js 的命令行工具。主要通过 `npx` 使用。

### 主要命令：

*   **`npx jue init`**：交互式初始化项目的 AI 工具配置。
*   **`npx jue apply`**：应用 `ai.config.js` 中的配置，为目标 AI 工具生成实际的配置文件。
*   **`npx jue check`**：检查预设是否有更新。
*   **`npx jue create-preset`**：从本地 `.ai` 目录一键打包新预设。

## 开发约定 (Development Conventions)

*   **语言 (Language):** 所有新代码都必须使用 **TypeScript** 编写。所有文档、注释和日志输出必须使用中文。
*   **核心架构：插件化的 Monorepo (Core Architecture: Plugin-based Monorepo):**
    *   项目采用 Monorepo 结构，通过 `npm workspaces` 进行管理。
    *   **`ai-jue-cli`**: 核心包，作为“微内核”。其职责仅限于：
        1.  读取并合并配置。
        2.  加载预设（Presets）。
        3.  发现并调用所有已安装的适配器（Adapters）。
        它**不包含**任何针对特定工具的文件生成逻辑。
    *   **`jue-preset-*`**: 预设包。用于封装可复用的“能力资产”（prompts, skills 等）。命名必须以 `jue-preset-` 开头。
    *   **`ai-jue-adapter-*`**: 适配器包（插件）。负责将最终配置“编译”为特定工具的配置文件。命名必须以 `ai-jue-adapter-` 开头。
*   **适配器 API 契约 (Adapter API Contract):**
    *   每个适配器包的入口文件必须导出一个名为 `generate` 的异步函数。
    *   函数签名: `async function generate(config: MergedConfig, outputDir: string): Promise<void>`
    *   `generate` 函数负责从 `config` 对象中提取自己关心的部分，并生成相应的文件到 `outputDir` 中。
*   **配置文件 (Configuration):** 根目录的 `ai.config.js` 依然是用户与 `ai-jue` 交互的唯一入口点。
*   **版本控制 (Version Control):** 整个 Monorepo 仓库应被完整地纳入版本控制。

## 技术栈与开发哲学 (Technical Stack & Development Philosophy)

*   **核心语言 (Core Language):** **TypeScript**。利用其强类型系统提高代码质量和可维护性。
*   **Monorepo 管理 (Monorepo Management):** **npm Workspaces**。
*   **命令行工具 (CLI Framework):** Yargs。
*   **编码风格 (Coding Style):**
    *   **函数式编程范式:** 鼓励使用纯函数、不可变数据和函数组合。
*   **设计原则 (Design Principles):**
    *   **Unix 哲学:** 每个包（CLI, Adapter, Preset）都应该“各司其职、小而精巧”。
    *   **KISS 原则 (Keep It Simple, Stupid):** 在满足架构要求的前提下，保持实现上的简洁。
    *   **约定优于配置 (Convention over Configuration):** 通过明确的包命名（`ai-jue-adapter-*`）和 API 契约来简化插件的发现和使用。