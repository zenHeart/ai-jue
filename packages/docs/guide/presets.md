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

## jue-preset-internal（仓库内预设）

**内部治理预设**，用于 `ai-jue` 仓库自身自举，不作为通用对外预设。

*   **能力边界**:
    *   `base` 负责通用工程能力
    *   `internal` 负责仓库治理与发布约束

## 组合使用

你可以通过 `ai.config.js` 中的 `presets` 数组来组合多个预设。

\`\`\`javascript
// ai.config.js
export default {
  presets: [
    'base'
  ]
}
\`\`\`

`ai-jue` 会按照数组顺序加载预设，后加载的配置会覆盖或合并前面的配置。
