# RFC-0005：directoryPerItem 孤儿条目删除

> 状态：Implemented
> 关联：[Issue #26](https://github.com/zenHeart/ai-jue/issues/26)、
> [Issue #35](https://github.com/zenHeart/ai-jue/issues/35)

## 背景

`directoryPerItem().write()` 只为当前 Canonical 条目生成 `create`/`update`。
源 Preset 重命名或删除 Skill/Agent 后，目标侧旧目录永久残留。`ArtifactChange`
已有 `delete`，执行器已有删除分支，但目录删除缺少 `recursive`，且 mapping
从不发出 delete。

## 目标

1. 当某 Capability 参与本次 write 时，删除 `read()` 仍识别、Canonical 已不存在的条目目录。
2. dry-run / check / apply 共用现有 `ArtifactChange` 管道。
3. 一次修在 Core，所有使用 `directoryPerItem` 的 Adapter 生效。

## 非目标

- 新 CLI 命令或 `--prune` flag。
- 全量 managed-file manifest（#26 宽方案）。
- 删除无主文件、`read()` 不识别的人手目录。
- 在 Canonical 完全省略该 Capability 键时推断删除。

## 候选方案

1. **Core `directoryPerItem` 孤儿 delete**（采用）：复用 `read()` 识别集。
2. 每目标 managed manifest：覆盖面更广，引入新持久状态，超出本刀。
3. 新用户命令：扩张 CLI，违反稳定命令面。

## 决策

采用方案 1。`writeCapabilities` 仅在 Canonical 含该键时调用 mapping，因此
省略整类 Capability 不会误删。

## 详细合同

- 孤儿 = `read()` 返回的名字 − 本次 `value` 的名字。
- 每个孤儿一条 `kind: "delete"`，`path` 为条目目录，`afterHash: null`。
- 执行器对 delete 使用 `fs.rmSync(path, { force: true, recursive: true })`。
- 无主文件的人手目录不进入 `read()`，因此不被删除。

## 安全

删除仅针对 `read()` 已识别的 Jue 形状。路径仍是根内相对路径。

## 兼容 / 迁移

再次 apply 时，已投影目标上的过期条目目录会被删除。`--dry-run` / `--check`
预先显示 `-` 行。

## 验收标准

- Core mapping 测试：重命名后旧目录进入 delete 并被 apply 移除。
- Core executor 测试：含嵌套文件的目录 delete 成功。
- 无主文件的人手目录存活。
- Claude/Codex 等现有合同测试保持绿色。

## 未决问题

无。
