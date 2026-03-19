# 本地开发指南

本文面向 ai-jue 的贡献者与二次开发者，覆盖环境搭建、构建测试、本地调试与发布验证。

## 环境搭建

```bash
git clone https://github.com/zenHeart/ai-jue.git
cd ai-jue
npm install && npm dedupe
npm run build
```

项目采用 npm workspaces 管理多包，关键包如下：

| 包 | 路径 | 说明 |
|---|---|---|
| `ai-jue` | `packages/ai-jue` | CLI 主包（`jue` 命令） |
| `ai-jue-core` | `packages/ai-jue-core` | 核心工具库（deepMerge、generateMarkdownFile 等） |
| `ai-jue-adapter-*` | `packages/ai-jue-adapter-*` | 适配器（Claude / Cursor / Gemini / Copilot） |
| `jue-preset-base` | `packages/jue-preset-base` | 基础预设 |
| `jue-preset-internal` | `packages/jue-preset-internal` | 内部自举预设 |

## 构建

```bash
# 构建所有包（Turbo）
npm run build

# 构建单个包
npm run build -w ai-jue-core
npm run build -w ai-jue
```

> 修改 `ai-jue-core` 后需先构建 core，再构建依赖它的 `ai-jue` 和适配器包。

## 测试

```bash
# 运行全部测试
npm test

# 运行单个测试文件
npx vitest run packages/ai-jue/test/resolver-root-agents.test.ts

# watch 模式（修改代码自动重跑）
npx vitest --watch packages/ai-jue/test/resolver-root-agents.test.ts
```

测试分层约定：

- `*.test.ts` — 单元测试
- `*.integration.test.ts` — 集成测试（涉及真实 preset 加载）
- `*.snapshot.test.ts` — 快照测试（适配器能力矩阵）

## 在外部项目中本地调试

修改代码后，若需在真实项目（如 `agent-evaluation`）中验证效果，有两种方式。

### 方式 A：`npm link`（推荐日常开发）

```bash
# 1. 在 ai-jue 仓库中注册 link
cd /path/to/ai-jue
npm run build
npm link -w ai-jue-core
npm link -w ai-jue
npm link -w jue-preset-base

# 2. 在目标项目中使用 link 的包
cd /path/to/your-project
npm link ai-jue ai-jue-core jue-preset-base

# 3. 运行 jue apply 验证
npx jue apply --adapter cursor --adapter gemini --adapter claude
```

调试完成后解除 link：

```bash
cd /path/to/your-project
npm unlink ai-jue ai-jue-core jue-preset-base
npm install
```

### 方式 B：`npm pack`（验证发布前效果）

```bash
cd /path/to/ai-jue
npm run build
npm pack -w ai-jue-core
npm pack -w ai-jue
npm pack -w jue-preset-base

cd /path/to/your-project
npm install /path/to/ai-jue/ai-jue-core-*.tgz /path/to/ai-jue/ai-jue-*.tgz /path/to/ai-jue/jue-preset-base-*.tgz
```

### Node.js 断点调试

```bash
node --inspect-brk ./packages/ai-jue/dist/cli.js apply --all
```

在 Chrome (`chrome://inspect`) 或 VS Code 的 "Attach to Node Process" 中连接调试器，即可设置断点单步跟踪。

## 端到端验证

```bash
# smoke 测试：验证 base/internal 预设的 apply 端到端流程
npm run smoke-apply

# 包一致性检查
npm run check-consistency

# base 预设双语结构检查
npm run check-base-i18n

# 完整发布门禁
npm run release-gate:v1.1
```

## 代码风格

- TypeScript，CommonJS 输出
- 2 空格缩进，分号结尾
- 共享逻辑放 `ai-jue-core`，适配器依赖 core
- 命令元数据写在 `prompt.md` 的 YAML frontmatter 中
- 预设嵌套依赖声明在 `package.json` 的 `"ai": { "presets": [...] }` 字段

## 常见开发场景

### 修改 preset 资产

1. 编辑 `packages/jue-preset-base/` 或 `packages/jue-preset-internal/` 中的文件
2. 运行 `npm run smoke-apply` 验证
3. 运行 `npx vitest run packages/ai-jue/test/preset-*.integration.test.ts` 回归

### 新增适配器能力

1. 在目标适配器包中实现 `generate(config, outputDir)` 的变更
2. 运行 `npx vitest run packages/ai-jue/test/adapter-matrix.test.ts` 验证跨适配器一致性
3. 更新对应的 snapshot 测试

### 修改核心逻辑（resolver / merge / preset 加载）

1. 修改 `packages/ai-jue/src/` 或 `packages/ai-jue-core/src/`
2. 先构建 core：`npm run build -w ai-jue-core`
3. 再构建 CLI：`npm run build -w ai-jue`
4. 运行相关测试：`npx vitest run packages/ai-jue/test/`
5. 运行 `npm run smoke-apply` 端到端验证
