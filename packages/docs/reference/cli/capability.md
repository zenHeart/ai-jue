# Capability 作者命令

`jue capability` 命名空间只保留会改变外部引用 lock 的作者操作：

```bash
jue capability update [<id>]
```

命令解析 `file:`、精确 `npm:` 或固定 `github:` 引用并原子更新
`ai-jue.lock`。省略 ID 时更新全部引用；更新失败时退出码为 1。
更新引用不得隐式执行 `apply`。
