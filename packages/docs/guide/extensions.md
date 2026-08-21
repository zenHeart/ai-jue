# 扩展 Jue

只有新增 Agent 支持时才需要编写 Extension。普通用户安装 npm 包并在配置中引用：

```bash
npm install -D ai-jue-adapter-openclaw
```

```js
export default {
  extensions: ["ai-jue-adapter-openclaw"],
  targets: { openclaw: { enabled: true } }
};
```

## 实现一个 Adapter

1. 建立普通 npm 包，使用 `exports` 指向入口。
2. 用相同的有界版本在 `peerDependencies` 声明消费者兼容性，并在
   `devDependencies` 建立本地构建依赖；`ai-jue-core` 不进入运行时
   `dependencies`。
3. 实现一个 Adapter 的 `read`、`write`、`confirm`。
4. 默认导出 `defineExtension({ adapters: [...] })`。
5. 添加 Capability 映射、往返、幂等、字段保留、权限和确认测试。
6. 更新该 Agent 的支持画像。

```ts
export default defineExtension({
  adapters: [{
    id: "openclaw",
    capabilities: openclawCapabilities,
    read,
    write,
    confirm
  }]
});
```

目标 Agent 的 Plugin/Bundle 由 `write` 返回为 Artifact 差异。
Artifact 差异由 Core 统一授权和执行，Extension 不复制写入、事务或权限逻辑。

完整合同见 [Adapter 标准](../architecture/adapter-standardization.md)、
[Extension API](../reference/extension-api.md)。
