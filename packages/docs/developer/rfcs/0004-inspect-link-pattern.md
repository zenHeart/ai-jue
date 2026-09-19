# RFC-0004：项目层 cross-tool 链接模式的 inspect 合同

> 状态：Implemented
> 关联：[Issue #33](https://github.com/zenHeart/ai-jue/issues/33)

## 背景

同一 Skill 有时以仓库内符号链接同时出现在多个 Agent 项目根下，例如
`.claude/skills/<name>` 指向 `.agents/skills/<name>`。Git for Windows 默认
`core.symlinks=false`，checkout 会把 mode `120000` 变成内容为目标路径的普通
文件。Agent 在目录里找 `SKILL.md`，于是整项不加载。

apply 已经把 Artifact 写成真实文件和目录。inspect 需要能识别这种项目层链接
模式，并在破损或不可移植时给出只读 finding。

## 目标

1. 扫描项目根下已知 Skill 目录的直接子项，报告破损、降级、仓库内和仓库外链接。
2. 把跨 client root 发现写成首选 / 次选 / 末选合同。
3. 保持 apply 写路径只产出真实文件和目录。

## 非目标

- 新 CLI 命令，或把 `link-pattern` 当成 `--extension` 包名。
- 改变 `directoryPerItem` 或执行器的写语义。
- 在 ai-jue 内创建、修复或删除符号链接。
- 接管用户主目录上的多层 runtime 投影。

## 候选方案

1. **`jue inspect --diagnostics` 增加项目层扫描**（采用）：复用已有诊断通道。
2. 把 `link-pattern` 伪装成 Extension id：占用 `--extension` 语义。
3. 新增 materialize 命令：扩张稳定 CLI，另开 RFC。

## 决策

采用方案 1。`jue inspect --diagnostics` 在没有 `--extension` 时扫描当前项目；
与 `--extension` 同时给出时，先打印链接 finding，再打印 Extension 诊断。
finding 不改变退出码。

## 详细合同

扫描根（项目相对，仅直接子项）：

- `.claude/skills`
- `.cursor/skills`
- `.codex/skills`
- `.agents/skills`

| code | severity | 条件 |
| --- | --- | --- |
| `broken-symlink` | error | 符号链接，目标在项目内但不存在 |
| `symlink-checkout-degraded` | error | 普通文件，内容是单行路径文本 |
| `cross-tool-symlink` | warn | 符号链接，目标在项目内且存在 |
| `cross-repo-symlink` | error | 符号链接，目标在项目外、`~` 或绝对路径逃出项目 |

每条 finding 含 `path`（项目相对 POSIX）、`remediation`、不超过 200 字符的
`evidence`。仓库外目标在 `target` / `expectedTarget` / `evidence` 中记为
`<outside-project>`。

## 安全

模块只读：`lstat` / `readlink` / 限长读文件。不跟随链接去扫描目标树。不调用
git，不写磁盘。

## 兼容 / 迁移

已有项目第一次运行可能看到多条 `cross-tool-symlink` warn。apply、dry-run 与
check 行为不变。

## 验收标准

- Core 测试覆盖四类 finding 的 code、severity、相对 path。
- inspect 在 `--diagnostics` 且无 `--extension` 时返回同一组 finding。
- Guide 与 documentation-contract 写出首选 / 次选 / 末选；`jue-preset-base`
  README 反向引用该合同。
- 文档导航与 docs-contract 登记本 RFC。

## 未决问题

方案 C（独立 materialize 命令）等社区反馈后再开 RFC。
