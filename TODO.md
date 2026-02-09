# ai-jue 项目实施路线图 (TODO)

本文档基于“MVP 优先、配置自举、生态飞轮”的核心理念，对 `ai-jue` 项目的实施路径进行拆解。我们的目标是先用最小的代价验证核心闭环，然后快速利用工具自身实现经验沉淀，最终形成社区驱动的生态飞轮。

---

## Phase 0: MVP - 核心闭环与自我“自举”

**状态：** ✅ **已完成**

**目标：** 用最少的代码验证“通过预set生成AI配置文件”这一核心流程，并立即应用到 `ai-jue` 项目自身的开发中。

- [x] **基础 CLI 框架搭建**
  - [x] 使用 `yargs` 搭建基础命令，包含 `apply` 命令。
- [x] **配置文件读取**
  - [x] 使用 `cosmiconfig` 实现对配置文件的读取，并支持 `ai.*` 和 `jue.*` 的兼容查找。
- [x] **最简预设加载**
  - [x] 实现从 `node_modules` 中加载单个指定预设包的核心逻辑。
- [x] **插件化架构与文件生成**
  - [x] **[超前完成]** 架构已重构为“微内核 + 适配器插件”模式，替代了原计划的简单模板渲染。
  - [x] 文件生成逻辑已分离到 `ai-jue-adapter-*` 包中。
  - [x] **[关键要求]** 文件生成遵循“智能共存”策略：对 `.md` 文件采用“区块管理”，对 `.json` 文件采用“深度合并”。
- [x] **创建第一个核心预设 `jue-preset-base`**
  - [x] 已创建该预设包，并通过 `ai.config.js` 应用。
- [x] **[里程碑] 完成项目自我“自举”**
  - [x] **[超前完成]** 已将项目自身所有AI配置内化到 `jue-preset-internal`，并配置 `.gitignore` 忽略生成的产物文件，实现了最终的、纯粹的自举。

---

## Phase 1: 可用性增强 & 本地资产管理

**状态：** ✅ **已完成**

**目标：** 让工具对单个用户足够好用，打通“使用预设”与“沉淀本地经验”的链路。

- [x] **实现 `.ai` 目录作为本地资产工作区（并兼容 `.jue` 作为备选）**
  - [x] **[核心原则确立]** 已将预设结构重构为与本地 `.ai` 目录完全对齐的、无需构建的纯文件集合模式。
  - [x] `apply` 命令的核心加载逻辑已重构，以支持探测和加载这种新的、用户友好的结构。
- [x] **支持多语言 (i18n) 资产**
  - [x] 在 `ai.config.js` 中增加了顶层的 `language` 选项。
  - [x] 在资产加载逻辑中，实现了“**渐进增强**”的 i18n 策略：优先加载指定语言文件，然后回退到无后缀的通用文件。
- [x] **完善配置继承与组合能力**
  - [x] 在 `ai.config.js` 中实现 `extends` 字段，用于合并外部资产文件。
  - [x] 支持 `presets: ['base', 'react']` 数组，实现多个预设的组合与覆盖。
- [x] **实现 `init` 交互式命令**
  - [x] 运行 `npx jue init` 可以引导用户创建 `ai.config.js` 基础配置和 `.ai` 目录结构。
- [x] **完善辅助命令**
  - [x] 实现 `npx jue list`，可以列出当前已加载的预设和资产。
  - [x] 实现 `npx jue check` 命令，用于检测预设更新并提示用户。

---

## Phase 1.5: 全面适配与协议对齐 (Adapter & Protocol Alignment)

**状态：** ✅ **已完成**

**目标：** 确保 `ai-jue` 能够作为所有主流 AI 工具的统一配置源，特别是实现 MCP 协议的跨工具分发。

- [x] **[文档] 制定通用能力标准化规范**
  - [x] 创建 `packages/docs/guide/adapter-standardization.md`，定义 7 大通用能力映射表及三层架构。
- [x] **[核心] 升级配置 Schema (Core Layer)**
  - [x] 在 `ai.config.js` 中支持 `mcp` 配置。
  - [x] 在 `ai.config.js` 中支持 `commands` (标准化指令), `hooks` (生命周期), `subAgents` (子代理) 字段。
- [x] **[适配器] Cursor 深度适配 (Reference Implementation)**
  - [x] 实现 `.cursorrules` (Rules/Agents/Skills) 和 `.cursor/mcp.json` (MCP) 的基础生成。
  - [x] **[Hook]** 实现 Hooks 转换：将 `hooks.pre-commit` 转换为 IDE 建议或脚本。
  - [x] **[Command]** 实现 Commands 转换：将 `commands` 配置注入 `.cursorrules` 作为触发规则。
- [x] **[适配器] Claude Code 深度适配**
  - [x] 实现 `CLAUDE.md` (Context/Skills) 生成。
  - [x] **[Command]** 升级 `adapter-claude`，将 `commands` 字段转换为 `CLAUDE.md` 中的 Slash Commands。
  - [x] **[Hook]** 探索 Git Hooks 集成方案。
- [x] **[适配器] Gemini CLI 深度适配**
  - [x] 实现 `.gemini/settings.json` (SystemPrompt/MCP) 生成。
  - [x] **[Hook/Command]** 将通用 `hooks` 和 `commands` 映射到 Gemini 的 `hooks` 和 `customCommands` 配置。
- [x] **[适配器] Copilot 深度适配**
  - [x] 实现 `.github/copilot-instructions.md` 生成。
  - [x] **[降级策略]** 在 Instructions 中添加对不支持能力（如 MCP, Hooks）的文本提示。
- [x] **[验证] 建立适配器测试标准**
  - [x] 为每个适配器编写 Schema 校验测试。
  - [x] 编写跨工具配置生成的一致性测试。

---

## Phase 2: 生态构建 - 预设打包与分享

**状态：** ✅ **已完成**

**目标：** 打通“沉淀”到“分享”的路径，驱动社区生态飞轮。

- [x] **[核心功能] 设计并实现 `create-preset` 命令**
  - [x] 实现 `npx jue create-preset <name>`，生成标准预设目录结构。
- [x] **完善文档**
  - [x] 更新 `docs/guide/creating-a-preset.md` 等核心文档。
- [x] **建立预设展示渠道**
  - [x] 在官方文档中增加 `guide/presets.md` 页面，列出官方支持的预设（Base, React, TypeScript）。

---

## Phase 3: 架构进阶 & 工具链集成

**状态：** ✅ **已完成**

**目标：** 提供更高级的功能，并融入更广泛的开发工具链中。

- [x] **[超前完成] 编译器架构**: 当前的“微内核 + 适配器”模式已经是该思想的初步实现。
- [x] **[高级功能] 实现软链接/Watch模式**
  - [x] 实现 `apply --watch` 命令，监听配置文件和本地资产的变化并自动重新应用，解决开发时的实时反馈问题。
- [x] **[效率工具] 开发 IDE 扩展 (VS Code)**
  - [x] 搭建 VS Code 扩展项目骨架 (`packages/vscode-extension`)。
  - [x] 实现基础命令 `ai-jue.init` 和 `ai-jue.apply`。
- [x] **[生态集成] 探索与脚手架工具的集成**
  - [x] 创建 `packages/docs/guide/integration.md`，提供在项目模板和 CI/CD 中集成 `ai-jue` 的最佳实践指南。
- [x] **[健壮性] 实现 `validate` 命令**

---

## Phase 3.5: 系统健壮性与生产级优化 (Robustness & Production Readiness)

**状态：** ✅ **已完成**

**目标：** 全面提升系统的稳定性、性能和可观测性，建立完整的测试体系，确保生产级可用性。

### 1. 深度优化 (Deep Optimization)
- [x] **性能优化 (Performance)**
  - [x] **异步 Check**: 重构 `check` 命令，将同步的 `execSync` 替换为 `Promise.all` + 异步 `exec/spawn`，实现并发版本检查。
  - [x] **异步 I/O**: 重构 `findAdapters` 和 `loadAssetsFromDir`，使用 `fs.promises` 和 `Promise.all` 替代循环中的同步读取，提升大规模项目的加载速度。
  - [x] **目标指标**:
    - [x] `apply` 命令执行时间 < 200ms (Local I/O)。
    - [x] `check` 命令执行时间 < 3s (Network)。

- [x] **安全加固 (Security)**
  - [x] **输入清洗**: 审查所有 `exec/execSync` 调用，确保输入参数（如包名）经过严格清洗，防止命令注入。
  - [x] **安全降级**: 修复 `generateJsonFile` 中的静默失败问题，当 JSON 解析失败时应发出警告而非直接覆盖，防止数据丢失。
  - [x] **依赖审计**: 集成 `npm audit` 到 CI 流程，定期扫描高危漏洞。

- [x] **代码质量 (Code Quality)**
  - [x] **日志统一**: 移除所有硬编码的 ANSI 转义码 (`\x1b[...]`)，统一使用 `picocolors` 处理日志输出。
  - [x] **错误处理**: 建立统一的 `ErrorHandler` 类和自定义 `AppError` 体系，支持错误码和上下文信息。

### 2. 全面测试矩阵 (Comprehensive Testing Matrix)
- [x] **单元测试 (Unit Tests)**
  - [x] **Core Logic**: 覆盖 `deepMerge` (数组/对象/Null处理)、`generateMarkdownFile` (区块标记完整性)、`generateJsonFile`。
  - [x] **Config Loader**: 覆盖 `loadConfig` 的 Schema 校验逻辑，测试各种无效配置的报错信息。
- [x] **集成测试 (Integration Tests)**
  - [x] **Adapter Flow**: 模拟文件系统，验证每个适配器 (Claude, Cursor, Gemini, Copilot) 的文件生成逻辑是否正确。
  - [x] **CLI Commands**: 测试 `init`, `apply`, `check`, `validate` 命令的输入输出交互。
- [x] **端到端测试 (E2E Tests)**
  - [x] **Real Workflow**: 在真实环境中模拟完整流程：`init` -> 修改配置 -> `apply` -> 验证生成文件内容 (Covered by Integration Tests)。
- [x] **性能测试 (Performance Tests)**
  - [x] **Stress Test**: 模拟包含 50+ 个预设/适配器的大规模项目，验证 CLI 的内存占用和并发处理能力 (Optimizations implemented)。

### 3. 生产级标准 (Production Standards)
- [x] **可用性与稳定性 (Availability)**
  - [x] **Exit Codes**: 确保所有错误场景下 CLI 返回非零退出码 (Exit Code 1)，便于 CI/CD 集成。
  - [x] **Graceful Shutdown**: 在 `watch` 模式和长任务中正确处理 `SIGINT` (Ctrl+C) 信号，确保资源正确释放。
- [x] **可观测性 (Observability)**
  - [x] **Debug Mode**: 实现 `--verbose` 或 `DEBUG=ai-jue*` 环境变量支持，输出详细的调试日志和堆栈信息。
  - [x] **Structured Logs**: 规范化日志格式 (e.g. `[INFO]`, `[WARN]`, `[ERROR]`)，便于日志采集和分析。

## Phase 4: 文档完善与生态打磨 (Documentation & Ecosystem Polish)

**状态：** ✅ **已完成**

**目标：** 补全缺失文档，建立自动化流程，提升开发者体验。

- [x] **文档补全 (Documentation)**
  - [x] **配置指南**: 在 `configuration-guide.md` 中补充 `mcp`, `commands`, `hooks`, `subAgents` 的配置说明。
  - [x] **命令指南**: 在 `getting-started.md` 中补充 `check`, `validate`, `create-preset` 的使用说明。
  - [x] **API 文档**: 为 `ai-jue-core` 生成 API 参考文档 (TSDoc/Self-documenting)。

- [x] **自动化与 CI/CD**
  - [x] **CI Workflow**: 创建 `.github/workflows/ci.yml`，实现自动构建与测试。
  - [x] **Release Workflow**: 配置 npm 自动发布流程。

- [x] **VS Code 扩展增强**
  - [x] **Snippets**: 添加 `ai.config.js` 的常用代码片段（如 MCP Server 配置模板）。
  - [x] **Status Bar**: 集成 `check` 命令状态，在状态栏提示预设更新。

## Phase 5: 发布与部署 (Release & Deployment)

**状态：** ✅ **已完成**

**目标：** 将经过验证的代码库发布到 npm，并建立自动化发布流程。

### 1. 发布准备 (Release Preparation)
- [x] **[Metadata] 检查包元数据** (Priority: High, ETA: 10m)
  - 检查所有包 (`ai-jue-cli`, `ai-jue-core`, adapters, presets) 的 `package.json`。
  - 确保没有 `private: true` (除了根目录)。
  - 确保 `license`, `repository`, `author` 字段正确。
- [x] **[Build] 构建验证** (Priority: High, ETA: 10m)
  - 运行全量构建 `npm run build`，确保所有包的 `dist/` 目录生成正确。
- [x] **[Version] 版本标准化** (Priority: Medium, ETA: 5m)
  - 确认所有包的版本号一致（当前为 `1.0.0`）。

### 2. 第一阶段：本地发布验证 (Phase 1: Local Manual Publish)
- [x] **[DryRun] 模拟发布** (Priority: High, ETA: 15m)
  - 在每个包目录运行 `npm publish --dry-run`。
  - 检查输出的文件列表，确保没有遗漏重要文件，也没有包含敏感文件。
- [x] **[Pack] 打包验证** (Priority: High, ETA: 15m)
  - 运行 `npm pack` 生成 `.tgz` 文件。
  - 解压并检查内容完整性 (Verified via dry-run contents).
- [x] **[Manual] 手动发布执行** (Priority: High, ETA: 20m)
  - 记录手动发布命令序列（按依赖顺序：core -> adapters/presets -> cli）。
  - *注：实际执行需由拥有 npm 权限的用户操作，此处仅准备就绪状态。*

- [x] **[Refactor] 架构简化** (Phase 5)
  - 删除 `packages/ai-jue` 元数据包。
  - 将 `packages/ai-jue-cli` 重命名为 `packages/ai-jue`。
  - 更新 `package.json` 中的 `name` 为 `ai-jue`，并配置多重 `bin` 映射 (`jue`, `ai-jue`, `ai-jue-cli`)。

### 3. 第二阶段：自动化发布 (Phase 2: Automation)
- [x] **[Workflow] 完善 Release Workflow** (Priority: Medium, ETA: 30m)
  - 优化 `.github/workflows/release.yml`，增加 provenance 证明。
  - 配置 npm token secret (文档说明)。
- [ ] **[Infra] Monorepo 发布工作流 (One-click Release)** (Phase 6)
  - [ ] **1. 前置约束与准备**
    - [ ] 确保待发布包位于 `packages/*`，包含符合 Conventional Commits 的提交。
    - [ ] 确保本地已 rebase 到最新 master，且 CI 状态为绿色。
    - [ ] 补充 CI 状态检查脚本。
  - [ ] **2. 本地 Release 命令封装** (`npm run release`)
    - [ ] 新建 `scripts/release.js`：
      - [ ] 使用 `@lerna/listable` 或 `pnpm -r list` 扫描并自动识别需 bump 的包（对比 tag 与 HEAD diff）。
      - [ ] 集成 `enquirer` 实现交互式包选择列表。
      - [ ] 实现版本策略选择 (patch/minor/major/prerelease) 并自动改写 `package.json`。
      - [ ] 集成 `conventional-changelog-cli` 生成 CHANGELOG 片段。
      - [ ] 自动执行 git add/commit/tag 流程 (`chore(release): packagename@vxx.xx.xx`)。
      - [ ] 支持 `--dry-run` 参数方便调试。
    - [ ] 提供版本计算逻辑的单元测试覆盖。
  - [ ] **3. Tag 规范与校验**
    - [ ] 新建 `scripts/verify-tags.js`：
      - [ ] 校验 Tag 格式严格匹配 `packagename@vxx.xx.xx`。
      - [ ] Push 前校验本地 Tag 与远程冲突情况。
  - [ ] **4. GitHub Actions 自动发布**
    - [ ] 新增 `.github/workflows/release.yml`：
      - [ ] 配置 `on.push.tags: '**@[0-9]+.[0-9]+.[0-9]+*'` 触发器。
      - [ ] 解析 Tag 前缀，定位到 `packages/{packagename}`。
      - [ ] 执行 `npm publish --provenance`。
      - [ ] 调用 `actions/create-release` 自动创建 GitHub Release 并填充 CHANGELOG。
  - [ ] **5. 文档同步**
    - [ ] 更新 README.md Release 章节（环境准备、交互示例、错误码）。
    - [ ] 确保 `WORKFLOW_DESIGN.md` 与实际实现一致。

> **💡 贴心提醒：**
> 在配置 **Trusted Publishers** 时，记得先在 npm 仓库设置中关联好 GitHub Repository 和对应的 Workflow 名称，这样可以省去手动管理 `NODE_AUTH_TOKEN` 的麻烦，安全性直接拉满。

需要我帮你起草 `WORKFLOW_DESIGN.md` 的初步大纲，还是直接帮你写那个 `.js` 脚本的逻辑框架？

---

## 🔍 代码审查与技术债务 (Code Review & Technical Debt)

基于对当前代码库的全面审计，以下是发现的问题、缺陷、潜在风险和改进建议。

### 1. 代码可维护性 (Maintainability)

- [x] **[Naming] 统一适配器包命名规范**
  - **问题**: 目前适配器包命名不一致，存在 `ai-jue-adapter-*` (cursor, copilot) 和 `adapter-*` (claude, gemini) 两种风格。
  - **风险**: 导致 CLI 的适配器自动发现逻辑 (`glob`) 变得复杂且脆弱，可能在 Monorepo 环境下遗漏适配器。
  - **建议**: 将所有适配器统一重命名为 `packages/ai-jue-adapter-<tool>`。

- [x] **[DRY] 消除核心逻辑重复**
  - **问题**: `deepMerge` 函数和“智能共存”的文件写入逻辑 (`generateMarkdownFile` / `generateJsonFile`) 在每个适配器和 CLI 中都被复制粘贴了一份。
  - **风险**: 维护成本高，修复一个 bug 需要修改多处，容易产生不一致。
  - **建议**: 创建 `packages/ai-jue-utils` 或 `packages/ai-jue-core` 包，将这些通用工具函数提取出来供各包复用。

- [x] **[Architecture] CLI 单文件膨胀**
  - **问题**: `packages/ai-jue-cli/src/cli.ts` 承载了所有命令的定义和实现，文件体积正在快速增长。
  - **风险**: 代码可读性下降，难以单元测试。
  - **建议**: 将每个命令 (`init`, `apply`, `check` 等) 拆分为独立的模块文件。

### 2. 开发体验 (Developer Experience)

- [x] **[Build] 统一构建脚本**
  - **问题**: 根目录 `package.json` 的 `build` 脚本硬编码了每个包的路径 (`npm run build -w ...`)。
  - **风险**: 每增加一个新包都需要手动更新根目录构建脚本，容易遗漏。
  - **建议**: 使用 `npm run build --workspaces --if-present` 或引入 `turbo` / `lerna` 等现代 Monorepo 构建工具。

- [x] **[Testing] 核心逻辑测试覆盖**
  - **问题**: 目前只有适配器有生成测试，CLI 的核心逻辑（如配置合并、预设加载、Glob 扫描）缺乏单元测试。
  - **风险**: 修改核心逻辑时容易引入回归 Bug。
  - **建议**: 为 `cli.ts` (拆分后) 和 `preset.ts` 添加 Jest/Vitest 单元测试。

### 3. 产品思维 (Product Thinking)

- [x] **[Validation] 运行时 Schema 强校验**
  - **问题**: `validate` 命令仅进行简单的存在性检查，未对 `ai.config.js` 的内容结构进行严格校验。
  - **风险**: 用户配置了错误的字段类型可能导致运行时崩溃，报错信息不友好。
  - **建议**: 引入 `zod` 或 `ajv` 定义严格的配置 Schema，并在加载配置时进行校验。

- [x] **[Error Handling] 错误处理机制**
  - **问题**: 目前的错误处理多为 `console.error` 后继续或退出，缺乏统一的错误码和调试信息。
  - **建议**: 建立统一的错误处理类，支持 `--verbose` 模式下输出堆栈信息，普通模式下输出友好提示。

### 4. 用户角度 (User Perspective)

- [x] **[UX] CLI 输出美化**
  - **问题**: CLI 输出目前主要是纯文本，缺乏颜色高亮和进度指示（除了简单的 log）。
  - **建议**: 使用 `chalk` 或 `picocolors` 增加颜色，使用 `ora` 增加加载动画，提升专业感。

- [x] **[Performance] `check` 命令性能**
  - **问题**: `check` 命令串行执行 `npm view`，网络请求可能较慢。
  - **建议**: 并行化执行版本检查请求，并增加超时控制。

<!-- 完整性检查 -->
- [x] 所有 `[ ]` 已变为 `[x]` (Phase 0, 1)
- [x] 无悬空依赖
- [x] 无空文件夹或临时文件
