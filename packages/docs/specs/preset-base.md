# jue-preset-base 规范

> 状态：Draft
> 版本：1.2.0

## 1. 定位

`jue-preset-base` 是默认通用工程 Preset，以最少稳定 command 解决高频 Agent
编码任务，不包含仓库私有治理。

## 2. Canonical 结构

```text
packages/jue-preset-base/
├── AGENTS.md
├── AGENTS.en.md
├── commands/<command-id>/prompt.md
├── commands/<command-id>/prompt.en.md
└── package.json
```

Command 元数据写入 prompt frontmatter，不使用第二份 index manifest。

## 3. 核心能力

### 3.1 全局元规则

`AGENTS.md` 规定意图澄清、架构优先、完整验证和可审查交付。

### 3.2 用户 Command 集合

| Command | 结果 |
| --- | --- |
| `impl` | 澄清、设计、实现、验证 |
| `fix` | 复现、根因、修复、回归 |
| `review` | 功能与非功能评审 |
| `refactor` | 保持行为的重构 |
| `explain` | 解释架构、数据流和约束 |
| `test` | 边界与失败路径测试 |
| `doc` | 面向用户的低负担文档 |

存储 ID 就是 Canonical command ID，不维护 `jue:impl` 等第二套别名。

### 3.3 扩展 Command

`optimize` 和 `security` 可以作为普通 command 分发，但不改变 Canonical 类型。

### 3.4 Commit 建议

Commit type 只是 command 输出建议，不是 Capability 或执行副作用。是否提交始终由
用户决定。

## 4. 双语一致性

`AGENTS.md`/`AGENTS.en.md` 和 prompt 语言变体必须语义等价；语言不能改变行为、
权限或验收标准。

## 5. 质量目标

“Review 零修改”是方向，不是保证。文档和输出不得把它描述为已达成事实。
