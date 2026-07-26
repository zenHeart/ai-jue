# Adapter 标准

Adapter 是 Extension 内针对一个 Agent 的完整转换单元。该标准只细化 Adapter 的
行为，不引入新的架构概念。

## 输入与输出

```text
Agent 原生配置 ←→ Adapter ←→ Canonical DSL
                       ↓
                    Artifact
```

Adapter 必须声明：

- 唯一 `id`；
- 支持、降级和不支持的 Capability；
- 可读取的 Agent 原生位置；
- 会生成的 Artifact kind、scope 和所有权边界；
- 写入所需的权限；
- 用于确认结果的目标原生路径。

## 三个必要行为

| 方法 | 作用 | 是否允许副作用 |
| --- | --- | --- |
| `read` | Agent 原生配置 → Canonical DSL | 否 |
| `write` | Canonical DSL → Artifact 差异 | 否 |
| `confirm` | 通过目标原生路径确认结果 | 只读 |

方法名是 Extension API，不是额外的用户概念或 CLI 命令。
Artifact 差异由 Core 统一执行。第三方 Adapter 不获得绕过批准范围自行写入、
联网、安装或启动进程的接口。

## 转换保证

对声明支持的语义：

```text
normalize(read(write(Canonical))) = normalize(Canonical)
```

对目标原生 fixture：

```text
normalize(read(write(read(Native)))) = normalize(read(Native))
```

- 同一输入必须产生稳定排序和稳定内容。
- 第二次应用不得产生变化。
- 同一目标中未托管的合法字段必须保留。
- 目标私有字段不得迁移到另一 Agent。
- 降级和不支持必须在写入前可见，不能静默丢弃。

## Artifact 写入

每项差异包含精确路径、操作、前后 hash、风险和授权。Core 只能修改该 Artifact
所有权记录允许的区域；遇到用户修改或其他 Adapter 所有权时默认阻塞。删除、
联网、安装依赖、执行进程和用户级写入必须单独展示并授权。

## 确认

优先使用目标官方解析器或 CLI，其次使用目标真实读取路径。仅检查文件存在不能
证明 Agent 已识别 Artifact。无法确认时返回 `unconfirmed`，不得报告成功。

## 最低测试

每个 Adapter 先从当前官方文档、CLI/schema 与只读探测形成能力清单，再构造中性、
离线、确定性的最小全量 fixture。最低测试包含：

1. 每类已核验 Capability 和聚合 Artifact kind 的映射 fixture；
2. 原生配置 → Canonical DSL 的读取测试；
3. Canonical DSL → Artifact 的快照或结构测试；
4. 支持语义的往返测试；
5. 二次应用零差异测试；
6. 未托管字段保留与所有权冲突测试；
7. 目标原生确认的成功、失败和不可用测试；
8. 凭据和个人信息不进入日志、Canonical DSL 或 fixture 的测试。

Agent 提供 headless 模式时必须增加真实读取或执行验证；没有 headless 时，使用
官方 parser、validate、list、inspect、doctor 或真实发现路径，并结合原生 fixture
往返等价。文件存在或快照通过不等于目标可用。

## 推荐实现模式（开发资产，非架构概念）

多个 Agent 的 Capability 原生形态经常落入几类可复用形状：按名称平铺的
Markdown 文件、每项一个目录（主文件 + 附件）、单文件 managed-block 共存、
按键深合并的 JSON 文件。`packages/ai-jue-core/src/capability-mapping.ts`
提供这四类形状的声明式工厂与通用 `read`/`write` 组合函数，供 Adapter 实现
按 Capability 声明而非逐个手写解析/序列化逻辑复用；同一 Capability 的
读写从同一份声明派生，天然互逆，而不是靠约定维持一致。这是 Adapter 内部的
实现工具，不是第七个架构概念。用法与判断"何时该手写、何时用工厂"的准则见
`packages/jue-preset-internal/skills/adapter-creator/`。

## Artifact 粒度取舍

一个 Adapter 可以为同一 Agent 产生多种 Artifact kind（例如 Claude Code 的
project-native 配置与 Plugin）；`artifactKind` 这类选择器是 Adapter 内部
参数，不进入 Canonical，也不提升为公共概念。是否新增一种 Artifact kind，
只由下游 Gate 的验收标准决定，不是"这个 Agent 生态里存在什么就都做"：

- Plugin 是 JUE-109/110 明确要求的原生验证对象（`claude plugin validate`
  必须通过），因此 Plugin manifest 生成属于当前问题域，必须实现。
- Marketplace／聚合索引这类"更粗粒度的 Artifact 之上再打包"的形态，只有当
  某个 Gate 明确要求（例如 R5 ai-assets 需要把多个 Preset 作为一个可分发
  单元发布）时才实现；在没有对应验收标准前实现它是投机性扩展，即使目标
  Agent 官方支持该概念。
- 组合关系已经封闭在 Preset（Capability 组合）与 Artifact（同一 Preset 的
  不同产物形态）两层；"多个 Artifact 再组合成一个更大的 Artifact"仍然是
  Artifact 层的表达（用现有概念可以描述），不需要新增概念，但需要新增实现
  只在有真实验收标准时才做。
- 判断标准：新增的 Artifact kind 或字段，能不能直接对应到 Delivery Plan
  某个任务的完成证据？不能，就先不做。
