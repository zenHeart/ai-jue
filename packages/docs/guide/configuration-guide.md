# `ai.config.js` 配置指南

`ai.config.js` 是 `ai-jue` 的统一入口配置。核心目标是：用户用最少概念完成配置，系统自动完成目录发现、资产挂载和适配转换。

## 1. 最小可运行配置

```js
export default {
  presets: ['base']
}
```

```bash
npx jue apply
```

这表示：
- 只声明“我要用哪个预设”
- 不需要先写复杂对象配置
- 系统会自动发现并挂载默认目录资产

## 2. 规范字段（唯一）

```js
export default {
  presets: ['base'],
  language: 'zh-CN',

  commands: {
    review: {
      description: '代码审查',
      prompt: '请按正确性/性能/安全性审查当前改动',
      triggers: ['/review']
    }
  },

  hooks: {
    'pre-commit': 'npm run lint'
  },

  agents: {
    reviewer: {
      description: '专注审查',
      prompt: '你是严格的代码审查代理',
      tools: ['git', 'test']
    }
  },

  mcp: {
    servers: {
      filesystem: {
        command: 'npx',
        args: ['@modelcontextprotocol/server-filesystem', '.']
      }
    }
  },

  tools: {
    gemini: {
      temperature: 0.2
    }
  }
}
```

## 3. 配置逻辑与目录结构的关系

### 3.1 默认挂载逻辑（降低认知负担）

运行 `jue apply` 时，系统会按顺序自动处理：

1. 读取 `preset/presets` 指向的预设资产
2. 自动扫描本地 `.ai/`
3. 合并 `extends` 显式引用文件
4. 最后叠加 `ai.config.js` 里的对象配置

结论：
- **不强依赖对象配置**，目录资产可直接生效
- 对象配置主要用于“精确覆盖”或“运行参数”

### 3.2 目录到能力的映射

```text
.ai/
├── AGENTS.md      -> 全局上下文
├── rules/         -> 规则
├── commands/      -> 命令
├── skills/        -> 技能
├── agents/        -> 代理
├── hooks/         -> 钩子
└── tools/         -> 工具私有配置
```

### 3.3 何时用目录，何时用对象

- 优先目录：沉淀可复用、可版本化资产
- 需要覆盖时用对象：如 `tools.gemini`、`mcp.servers`
- 需要临时外链时用 `extends`

## 4. 字段说明

- `preset` / `presets`：选择预设（同时存在时 `presets` 优先）
- `extends`：显式加载外部资产并合并
- `language`：多语言加载偏好（语言优先，默认回退）
- `commands`：命令定义
- `hooks`：钩子定义
- `agents`：代理定义
- `mcp`：MCP 服务定义
- `tools`：工具私有配置透传

## 5. 非规范输入策略

- 检测到非规范能力字段时直接失败
- 返回可执行修复建议
- 不在适配器层处理非规范概念

## 6. 设计约束

- 最小知识原则：只暴露主流工具常见概念
- 规范唯一：禁止双轨语义
- 适配器职责单一：只做格式转换，不做概念修补
