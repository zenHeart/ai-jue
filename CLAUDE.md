# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 语言规则

**所有文档和输出必须使用中文**。在与用户交流、编写注释、文档或任何文本内容时，始终使用中文。

## 项目定位

**ai-jue 是 AI 工具链的标准化配置工具**

类比前端标准工具：
- `eslint` + `eslint-config-airbnb` → 代码质量标准化
- `prettier` + `prettier-config-standard` → 代码格式标准化
- **`ai-jue` + `jue-preset-react`** → **AI 工具配置标准化**

## 核心理念

### 降低认知负荷

**不引入新概念，复用前端开发者熟悉的模式：**

| 前端工具 | ai-jue 对应 | 说明 |
|---------|-----------|------|
| `eslint-config-airbnb` | `jue-preset-react` | 预设配置包 |
| `eslint-plugin-react` | `jue-plugin-react` | 插件包 |
| `.eslintrc.js` | `jue.config.js` | 配置文件 |
| `npx eslint --init` | `npx jue init` | 初始化命令 |

### 简化概念体系

原方案概念较多（模块、画像、物料等），现简化为：

1. **预设 (Presets)** - 核心概念，类似 `eslint-config-*`
   - 开箱即用的配置组合
   - 可继承和扩展
   - 命名：`jue-preset-*`

2. **插件 (Plugins)** - 能力提供者，类似 `eslint-plugin-*`
   - 提供具体能力实现
   - 命名：`jue-plugin-*`

3. **配置 (Config)** - 项目配置文件，类似 `.eslintrc`
   - 支持多种格式
   - 支持继承和覆盖

### 统一的能力抽象

**所有 AI 相关能力统一抽象为"能力"，无需区分：**

- Prompts/Instructions
- Skills
- Commands
- MCP Servers
- Sub-agents

这些都是"能力"，通过预设组合使用，降低用户理解成本。

## 解决的问题

1. **配置重复**
   - 每个项目手动创建 CLAUDE.md、.cursorrules
   - 解决：`npx jue init` 一键生成

2. **标准不统一**
   - 团队成员各自维护配置
   - 解决：共享预设包（`@company/jue-preset-internal`）

3. **跨工具配置**
   - 每个 AI 工具单独配置
   - 解决：一次配置，自动生成所有工具配置文件

## 使用方式

### 基础用法（类似 ESLint）

```bash
# 1. 安装
npm install -D ai-jue jue-preset-react

# 2. 初始化
npx jue init

# 3. 应用配置
npx jue apply
```

### 配置文件

```javascript
// jue.config.js
export default {
  preset: 'react',  // 使用预设
  tools: ['claude', 'cursor']  // 目标工具
}
```

或在 package.json 中：

```json
{
  "jue": {
    "preset": "react",
    "tools": ["claude", "cursor"]
  }
}
```

## 架构设计

### 简化的架构

```
ai-jue (CLI 工具)
├── 核心功能
│   ├── 配置读取和合并
│   ├── 预设加载
│   ├── 模板渲染
│   └── 文件生成
├── 命令
│   ├── init    - 初始化
│   ├── apply   - 应用配置
│   ├── list    - 列出资源
│   └── validate - 验证配置
└── 预设生态
    ├── jue-preset-base
    ├── jue-preset-react
    └── jue-preset-vue
```

### 工作流程

```
npx jue apply
  ↓
读取配置 (jue.config.js)
  ↓
加载预设 (jue-preset-react)
  ↓
组装能力内容
  ↓
渲染工具模板
  ↓
生成配置文件 (CLAUDE.md, .cursorrules 等)
```

## 开发指导

### 预设开发

预设是核心概念，开发时：

```javascript
// jue-preset-react/index.js
export default {
  name: 'react',

  // 继承基础预设
  extends: ['base'],

  // 包含的内容
  prompts: ['./prompts/react-best-practices.md'],
  skills: ['./skills/react-refactor.md'],

  // MCP 配置（如需要）
  mcp: {
    servers: {
      'react-inspector': {
        command: 'npx',
        args: ['@jue/mcp-react-inspector']
      }
    }
  }
}
```

### 目录结构

```
jue-preset-react/
├── package.json          # 包含 "jue-preset" keyword
├── index.js              # 预设定义
├── prompts/              # Prompts/Instructions
│   └── react-best-practices.md
└── skills/               # Skills/Commands
    └── react-refactor.md
```

### 命名规范

- 预设包：`jue-preset-*` 或 `@scope/jue-preset-*`
- 插件包：`jue-plugin-*` 或 `@scope/jue-plugin-*`
- 配置包（别名）：`jue-config-*`（指向预设）

## 技术选型建议

```javascript
{
  "CLI": "commander.js",
  "配置管理": "cosmiconfig",  // 支持多种配置格式
  "模板引擎": "handlebars",
  "包管理": "npm/pnpm",
  "配置格式": [
    "jue.config.js",
    "package.json",
    ".juerc"
  ]
}
```

## MVP 优先级

### Phase 1: 核心功能（最小可用）

```
✓ CLI 基础框架
✓ init 命令（交互式初始化）
✓ apply 命令（生成配置文件）
✓ 预设系统（加载和合并）
✓ 模板渲染（CLAUDE.md, .cursorrules）
✓ jue-preset-base（基础预设）
```

### Phase 2: 生态完善

```
✓ jue-preset-react
✓ jue-preset-vue
✓ list 命令
✓ validate 命令
✓ 配置继承和覆盖
```

### Phase 3: 工具集成

```
✓ 与 create-* 工具集成
✓ IDE 扩展
✓ CI/CD 支持
```

## 与其他工具的关系

**互补关系，不是替代：**

- Claude Code/Cursor/Copilot - AI 工具本身
  - ai-jue 为它们生成配置文件

- MCP Servers - 提供能力
  - ai-jue 管理和组合这些能力

- Custom Skills - 具体技能
  - ai-jue 标准化分发这些技能

## 开发注意事项

1. **保持简单**
   - 不过度设计
   - 复用前端开发者熟悉的概念
   - 文档使用前端工具类比

2. **渐进式采用**
   - 零配置可用（`npx jue init`）
   - 支持自定义扩展
   - 不强制特定结构

3. **开放生态**
   - 鼓励社区贡献预设
   - 支持私有预设包
   - 保持向后兼容

4. **最佳实践**
   - 配置文件纳入版本控制
   - 团队共享预设包
   - 定期更新预设获取最新实践
