# ai-jue-adapter-{tool}

<div align="center">

**{Tool} 适配器：将 ai-jue 配置转换为 {Tool} 原生格式**

[![NPM version](https://img.shields.io/npm/v/ai-jue-adapter-{tool}.svg?style=flat)](https://www.npmjs.com/package/ai-jue-adapter-{tool})
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.en.md) | **简体中文**

属于 [ai-jue](https://github.com/zenHeart/ai-jue) Monorepo 的适配器模块。

</div>

---

## 功能概述

该适配器将 `ai-jue` 规范能力转换为 {Tool} 原生配置格式。

## 能力映射矩阵

| 优先级 | ai-jue 能力 | {Tool} 原生特性 | 支持状态 | 用户配置说明 | 实现策略 |
|:---|:---|:---|:---|:---|:---|
| ⭐⭐⭐⭐⭐ | **AGENTS.md** | {描述 Tool 的全局上下文机制} | {Native/Degraded/Unsupported} | {用户需要做什么} | {如何映射} |
| ⭐⭐⭐⭐⭐ | **Rules** | {描述 Tool 的规则机制} | {Native/Degraded/Unsupported} | {是否支持 globs/alwaysApply} | {如何映射} |
| ⭐⭐⭐ | **Commands** | {描述 Tool 的命令机制} | {Native/Degraded/Unsupported} | {如何使用} | {如何映射} |
| ⭐⭐⭐ | **Skills** | {描述 Tool 的技能机制} | {Native/Degraded/Unsupported} | {如何使用} | {如何映射} |
| ⭐⭐⭐ | **MCP** | {描述 Tool 的 MCP 支持} | {Native/Degraded/Unsupported} | {配置方式} | {如何映射} |
| ⭐⭐⭐ | **Hooks** | {描述 Tool 的钩子机制} | {Native/Degraded/Unsupported} | {如何使用} | {如何映射} |
| ⭐⭐ | **Agents** | {描述 Tool 的代理机制} | {Native/Degraded/Unsupported} | {如何使用} | {如何映射} |
| ⭐⭐ | **Configuration** | {描述 Tool 的全局配置} | {Native/Degraded/Unsupported} | {配置方式} | {如何映射} |

## 详细实现说明

### 1. AGENTS.md（全局上下文）

- **兼容性**：{Fully Compatible / Partial / Incompatible}
- **映射策略**：{具体如何注入全局上下文}
- **用户操作**：{用户需要做什么，如"在项目根目录放置 AGENTS.md"}
- **技术细节**：{实现层面的具体说明}

### 2. Rules（路径特定规则）

- **兼容性**：{Fully Compatible / Partial / Incompatible}
- **映射策略**：
  - `globs` → {Tool 的对应字段}
  - `alwaysApply` → {Tool 的对应字段}
  - `description` → {Tool 的对应字段}
- **文件输出**：{输出路径和格式，如 `.cursor/rules/*.mdc`}

### 3. Commands（自定义命令）

- **兼容性**：{Fully Compatible / Partial / Incompatible}
- **映射策略**：{具体如何转换}
- **使用方式**：{用户如何使用生成的命令}

### 4. Skills（可复用技能）

- **兼容性**：{Fully Compatible / Partial / Incompatible}
- **映射策略**：{具体如何转换}

### 5. MCP（外部工具集成）

- **兼容性**：{Fully Compatible / Partial / Incompatible}
- **配置格式**：{生成的配置格式}

### 6. Hooks（生命周期钩子）

- **兼容性**：{Fully Compatible / Partial / Incompatible}
- **支持的事件**：{支持哪些钩子类型}

### 7. Agents（子代理）

- **兼容性**：{Fully Compatible / Partial / Incompatible}
- **映射策略**：{具体如何转换}

### 8. Configuration（全局配置）

- **兼容性**：{Fully Compatible / Partial / Incompatible}
- **映射策略**：{具体如何转换}

## 限制与降级策略

### 关键限制

1. {列出 Tool 不支持的关键能力}
2. {列出已知的技术限制}

### 降级处理

| ai-jue 能力 | 降级方式 | 用户影响 |
|:---|:---|:---|
| {能力名} | {如何降级，如"写入说明文档"} | {用户需要如何适应} |

### 手动替代方案

对于不支持的能力，用户可手动：
1. {手动操作步骤 1}
2. {手动操作步骤 2}

## 安装

```bash
npm install ai-jue-adapter-{tool}
```

## 使用

在 `ai.config.js` 中配置：

```javascript
module.exports = {
  preset: 'base',
  adapters: ['{tool}']
};
```

然后运行：

```bash
npx jue apply --adapter {tool}
```

## 验证

运行适配器测试：

```bash
npm test -- packages/ai-jue-adapter-{tool}/test/index.test.ts
```

## 相关链接

- [ai-jue 主项目](https://github.com/zenHeart/ai-jue)
- [{Tool} 官方文档]({官方文档链接})

## License

[MIT](LICENSE)
