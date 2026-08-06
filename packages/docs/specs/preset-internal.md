# jue-preset-internal 规范

> 状态：Draft
> 版本：1.0.0

## 1. 定位与边界

`jue-preset-internal` 只服务 ai-jue 仓库治理、自举、发布纪律和架构约束。
通用工程能力必须回到 `jue-preset-base`。

## 2. 最小目录

```text
jue-preset-internal/
├── AGENTS.md
├── commands/   # 按需
├── rules/      # 按需
├── skills/     # 按需
├── hooks/      # 按需
└── tools/      # 目标私有逃生舱
```

Command 元数据写入 `commands/*/prompt.md` frontmatter。

## 3. 自举 Runbook

1. 根 `ai.config.js` 配置 `presets: ["internal"]`。
2. 执行 `npx jue apply --all`。
3. 检查生成文件和第二次执行零 diff。
4. 不把生成文件称为唯一事实源；Preset 与 Canonical 输入才是事实源。

最低证据是全局上下文可加载、至少一类结构化能力可生成、干净 checkout 可重复。

## 4. 演进策略

- internal 保持仓库专用且最小。
- 每项新增规则说明治理价值。
- internal 直接采用公共 Architecture/Specification 语义。
