# Capability 作者命令

普通查询使用 `jue inspect --capability <id>`。命名空间只保留会改变外部引用 lock
的作者操作：

```bash
jue capability update [<id>] [--dry-run]
```

命令重新解析 `file:`、精确 `npm:` 或固定 `github:` 引用并原子更新
`ai-jue.lock`。省略 ID 时更新全部引用。

`--dry-run` 只显示版本、内容 hash 和 lock 差异；`--frozen` 禁止更新；
`--offline` 只允许可信缓存命中。更新引用不得隐式执行 `apply`。
