# RFC-0001：最小转换模型

> 状态：Accepted

## 背景

早期文档为规范化数据、目标私有字段、转换函数、产物写入和运行操作分别命名，
导致实现者容易建立多条管线，用户也必须理解与任务无关的内部结构。

## 决策

Jue 的稳定概念封闭为：

```text
Capability / Preset ↔ Canonical DSL ↔ Adapter ↔ Artifact
                         ↑
                     Extension 注册 Adapter
```

- Canonical DSL 同时是规范和规范化数据，不再增加第二个中间表示。
- Adapter 是一个 Agent 的完整正反转换单元；内部拆分不进入架构术语。
- Extension 是唯一可执行扩展机制。
- Plugin、Bundle 和配置都是 Artifact 形态。
- npm 管理 Extension 的包、版本、依赖、入口、发布和安装；Jue 只定义默认导出的
  Extension API。
- 用户核心命令只有 `init`、`apply`、`inspect`。预览、CI 和诊断使用选项表达。

## 结果

新增 Agent 只实现一个 Adapter；新增 Artifact 只扩展该 Adapter 的输出。新增
第七个公共概念必须另提 RFC，并证明不能作为现有概念的字段、方法或普通行为。

实现必须通过往返、幂等、未托管字段保留、权限和目标原生确认测试。
