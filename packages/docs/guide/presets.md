# 官方预设 (Official Presets)

`ai-jue` 提供了一系列官方维护的预设，旨在为不同的技术栈和开发场景提供开箱即用的最佳实践。

## jue-preset-base

**基础预设**，适用于所有类型的项目。它包含了通用的软件工程最佳实践。

*   **包含内容**:
    *   代码审查 (Code Review) 指南
    *   Git 提交规范
    *   通用错误处理建议
    *   性能优化提示
    *   安全审计基础
    *   文档编写指南

**安装**:
```bash
npm install -D jue-preset-base
```

## jue-preset-react

**React 专用预设**。它继承自 `jue-preset-base`，并添加了针对 React 生态系统的特定规则和建议。

*   **包含内容**:
    *   React Hooks 最佳实践 (useEffect, useMemo, useCallback)
    *   组件结构与设计模式
    *   状态管理建议
    *   常见 React 陷阱规避
    *   JSX/TSX 编写规范

**安装**:
```bash
npm install -D jue-preset-react
```

## jue-preset-typescript

**TypeScript 专用预设**。它继承自 `jue-preset-base`，专注于 TypeScript 的类型安全和高级特性。

*   **包含内容**:
    *   严格类型 (Strict Typing) 指南
    *   接口 (Interface) vs 类型别名 (Type) 的使用建议
    *   泛型 (Generics) 的最佳实践
    *   工具类型 (Utility Types) 的使用
    *   异步编程 (Async/Await) 的类型处理

**安装**:
```bash
npm install -D jue-preset-typescript
```

## 组合使用

你可以通过 `ai.config.js` 中的 `presets` 数组来组合多个预设。例如，在一个 React + TypeScript 项目中：

```javascript
// ai.config.js
export default {
  presets: [
    'base',       // 基础能力 (可选，react/typescript 通常会自动包含)
    'react',      // React 能力
    'typescript'  // TypeScript 能力
  ]
}
```

`ai-jue` 会按照数组顺序加载预设，后加载的配置会覆盖或合并前面的配置。
