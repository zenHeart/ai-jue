# 文档事实源合同

## 优先级

| 优先级 | 文档 | 唯一职责 |
| --- | --- | --- |
| 1 | Accepted RFC | 记录已决取舍及原因 |
| 2 | Architecture | 定义六概念、边界和数据流 |
| 3 | Specification | 定义 Canonical DSL 的可测试语义 |
| 4 | Reference | 定义 CLI、配置和 API |
| 5 | Agent profile | 记录各 Agent 当前支持证据 |
| 6 | Developer | 记录差距、顺序和待办 |
| 7 | Guide/README | 提供用户任务路径 |

冲突时不得猜测；先修复高低层文档。Architecture、Specification、Reference 描述
理想合同，Agent profile 与 Developer 描述当前事实。

## 封闭概念集合

公共术语只允许：

| 概念 | 含义 |
| --- | --- |
| Capability | 通用能力 |
| Preset | Capability 集合 |
| Canonical DSL | 正反转换的唯一中间层 |
| Extension | 可执行扩展机制 |
| Adapter | Extension 内单个 Agent 的转换单元 |
| Artifact | 目标 Agent 原生产物 |

以下内容不得进入术语表：规范化数据结构的别名、目标私有字段容器、转换器种类、
产物驱动器、执行计划、生命周期、校验器、运行阶段。它们应写成 Canonical DSL
字段、Adapter 方法、Artifact 属性或普通行为描述。

## 生态复用

- npm `package.json` 是 Preset 与 Extension 的包事实源。
- npm `peerDependencies` 是 API 兼容版本事实源。
- Node.js `exports` 是入口事实源。
- Adapter inventory 只由 `defineExtension()` 返回，不在包元数据重复。
- Extension 默认导出是运行时合同事实源；Adapter 方法和能力元数据只存在于
  `defineExtension()` 返回值。
- Agent 已有 Plugin、Bundle、配置和发现协议作为 Artifact 适配，不重造同义格式。

## 变更门禁

### 变化放大门禁

新增公共能力值时，基线语义由 Core 在一个位置定义；只有选择支持该值的 Adapter
允许修改。若每个 Adapter 都必须同步添加相同声明，变更必须先重构为宿主缺省或
证明该声明确实因目标而异。CLI 只调用校验后的 Adapter 对象，不从包顶层导出重建
Extension 合同。

公共合同变更必须同步更新中英文 Architecture、Reference、Agent profile、
Developer 状态和契约测试。新增概念必须通过 RFC 证明六概念无法表达；未实现能力
统一使用 `> [!WARNING]` 标记并链接实现状态；可运行示例只能使用已实现能力。
实现完成后必须删除对应 Warning。

可导航页面还必须同步 `packages/docs/.vitepress/config.mts`（中英文侧栏/导航）
与 `packages/ai-jue/test/docs-contract.test.ts`；RFC 另需清单行与 RFCs 侧栏项。
仅新增 Markdown 会产生孤儿 URL。

稳定文档只描述当前合同。被否决或删除的方案只保留在 RFC 决策历史，不以否定句
回流到 README、Guide、Architecture、Specification、Reference 或 Agent profile。
如果删除一句话不影响读者完成操作、实现或验收，该句应删除。
