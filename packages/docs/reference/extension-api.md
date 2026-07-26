# Extension API Reference

Extension 的默认导出使用 `defineExtension()` 返回 Adapter：

```ts
export default defineExtension({
  adapters: [openclawAdapter]
});
```

入口模块在导入阶段不得读写文件、联网、执行进程或修改全局状态。npm
`peerDependencies` 声明兼容的 Jue 版本，`exports` 声明入口；Jue 不增加包字段。

## `defineExtension`

```ts
interface ExtensionDefinition {
  adapters: Adapter[];
}

declare function defineExtension(
  definition: ExtensionDefinition
): ExtensionDefinition;
```

Extension 自身的名称、版本、入口和兼容版本直接取 npm `package.json`，不重复。
`adapter.id` 在进程内必须唯一；冲突直接失败。

## `Adapter`

```ts
interface Adapter {
  id: string;
  capabilities: CapabilitySupport;

  read(context: ReadContext): Promise<CanonicalDocument>;
  write(
    canonical: CanonicalDocument,
    context: WriteContext
  ): Promise<ArtifactChange[]>;
  confirm(
    results: ArtifactResult[],
    context: ConfirmContext
  ): Promise<Confirmation>;
}
```

| 成员 | 约束 |
| --- | --- |
| `capabilities` | 明确支持、降级和不支持的 Canonical Capability |
| `read` | 只读；Agent 原生配置转换为 Canonical DSL |
| `write` | 只读；根据 Canonical DSL 和现状返回精确 Artifact 差异 |
| `confirm` | 通过目标 Agent 的解析器、CLI 或真实读取路径确认结果 |

Core 校验并执行经过批准的 `ArtifactChange`。Extension 不获得通用写文件、安装、
联网或启动进程的执行回调；需要副作用的 Artifact 必须通过 Core 支持的 kind 和
授权策略表达。

`write` 必须保留同一目标中未由 Jue 管理的合法字段。`read(write(Canonical))` 对
声明支持的语义必须往返一致。跨 Agent 时不得携带目标私有字段。

## `ArtifactChange`

```ts
interface ArtifactChange {
  target: string;
  kind: "create" | "update" | "delete";
  ownership: "full" | "managed-block" | "merged-keys";
  scope: "project" | "local" | "user";
  path: string;
  beforeHash: string | null;
  afterHash: string | null;
  content?: string | { content: string; encoding: "utf8" | "base64" };
  risk: "low" | "medium" | "high";
  requiresApproval: boolean;
  atomicState: "planned" | "applied" | "rolled-back" | "failed";
}
```

`ownership` 记录 Adapter 对该路径拥有多少控制权：`full` 表示 Jue 拥有整个文件
（可安全整体覆盖）；`managed-block` 表示只拥有 `AI-JUE:START/END` 之间的区块，
文件其余部分是用户内容；`merged-keys` 表示只通过深合并拥有 JSON 文档中的特定
键。`atomicState` 记录 Core 执行该项变更时所处的生命周期阶段；一批
`ArtifactChange` 要么全部到达 `applied`，要么在任意一项失败时整体回退到
`rolled-back`，不产生部分写入。`kind` 为 `create` 时 `beforeHash` 必须为
`null`；为 `delete` 时 `afterHash` 必须为 `null`；为 `update` 时两者都必须存在。
`content` 是 Core 实际写入的字节：`kind` 为 `create`/`update` 时必须存在且其
哈希必须等于 `afterHash`；为 `delete` 时必须省略。`path` 必须是安全的项目
相对路径。

## 结果和错误

```ts
interface ArtifactResult {
  change: ArtifactChange;
  applied: boolean;
}

interface Confirmation {
  target: string;
  status: "confirmed" | "unconfirmed" | "failed";
  evidence?: string;
}
```

`Confirmation` 必须区分 `confirmed`、`unconfirmed` 和 `failed`；缺少确认方式
不得返回 `confirmed`，`status` 为 `confirmed` 时必须附带脱敏的 `evidence`。

Extension 抛出的错误必须包含稳定 `code`、阶段、Adapter ID、可执行
`remediation` 和脱敏 details。禁止吞错或只写日志。
