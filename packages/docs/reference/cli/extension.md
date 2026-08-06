# Extension 作者命令

普通查询和诊断使用 `jue inspect --extension <id> --diagnostics`。作者命名空间只
保留发布前校验：

```bash
jue extension validate <path-or-package> [--load] [--fixtures <dir>]
```

默认只校验 npm `package.json`、`exports` 和 `peerDependencies`，不执行入口。
`--load` 在隔离上下文加载默认导出，校验 Adapter ID、接口和
导入阶段零副作用。`--fixtures <dir>` 对目录下每个直接子目录运行
`adapter.read()` 并校验 `CanonicalDocumentSchema`；任一夹具失败时退出码为 2。

安装、升级和移除继续由 npm/pnpm/yarn 负责。详情见
[Extension API](../extension-api.md)。
