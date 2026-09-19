# RFC-0006：同一运行时的 Skill 碰撞规划

> 状态：Proposed
> 关联：[Issue #31](https://github.com/zenHeart/ai-jue/issues/31)、
> [Issue #30](https://github.com/zenHeart/ai-jue/issues/30)、
> [RFC-0005](0005-directory-per-item-prune.md)

## 背景

同一 Skill 名字可以合法地出现在不同 Agent 的原生目录里。问题只发生在**一个
运行时**扫描多个已填充根、并且这些根里有同一规范化名字时。Codex 文档写明
CWD 祖先链与 `$HOME/.agents/skills` 都扫描，同名条目可以同时出现。Claude
Code 有项目 / 个人 / Plugin 命名空间与官方优先级。Antigravity 的同名规则
尚未被当前桌面版核验，实现门禁见 #30。

apply 今天按 Adapter 独立规划，Core 看不到“同一运行时将发现哪些 Skill”。

## 目标

1. 由 Adapter 提供已核验的发现根与优先级证据。
2. 由 Core 在写入前规划同一运行时的碰撞：相同内容收敛到一处，不同内容失败。
3. 复用现有 Capability、Adapter、ArtifactChange、dry-run / check。

## 非目标

- 第七个公共概念。
- 强迫所有 Agent 共用一个物理目录。
- 把不同运行时的副本当成重复。
- 仅因同名删除用户或第三方 Skill。
- 在 #30 落地前发明 Antigravity 优先级。

## 候选方案

1. **Adapter 发现证据 + Core 规划**（采用）：发现根与优先级留在 Adapter
   方法；Core 比较身份、授权、哈希并生成 ArtifactChange。
2. 新增“Discovery Root”公共概念：六概念已能表达，无需第七个。
3. 只在各 Adapter 内各自去重：同一运行时跨根规则会分叉。

## 决策

采用方案 1。公开 Extension API 若需新增发现根字段，必须先把本 RFC 推到
Accepted。当前状态是 Proposed，不得当已接受合同实现。

核验过的事实（2026-08-27）：

- Codex 扫描 CWD 至仓库祖先的 `.agents/skills` 与用户 `.agents/skills`。
- Claude Code 保留官方项目 / 个人 / Plugin 命名空间优先级。
- Antigravity 工作区与用户根的同名规则未核验，实现跟随 #30。

## 详细合同

Skill 身份 = 规范化 frontmatter `name` + 完整 bundle 哈希；目录名不足够。

对一个运行时可见的每个规范化名字：

1. 一个受管候选：按现有 apply 规划。
2. 多个字节相同的受管候选：按 Adapter 已核验优先级选一处，其余不再写入。
3. 受管候选与内容相同的未受管候选：保留未受管副本，报告选中/忽略的路径归属。
4. 同名但内容或 frontmatter 不同：写入前失败，只输出脱敏路径与来源。
5. 先前受管的多余条目只通过 RFC-0005 的可恢复 delete 退役。

`--dry-run` 与 `--check` 使用同一规划，零写入。不支持或未核验的运行时对原生
选择器报告 `unconfirmed`。

## 安全

诊断只含脱敏路径、规范化名字与计数。Skill 正文、凭据形态值和本机绝对用户
路径不进入 finding、fixture 或 issue。

## 兼容 / 迁移

现有单根 apply 保持原样。只有同一运行时扫到多个根时才会出现新的规划结果。
Extension API 若增加发现根声明，属于 Accepted 之后的兼容说明。

## 验收标准

- 中性 fixture：同一 Skill 对同一运行时从两个根可见。
- 相同受管重复只规划一处；内容冲突在执行 ArtifactChange 前失败。
- 未受管、目标自有、内置和命名空间 Plugin Skill 不被删除或静默覆盖。
- Codex 覆盖 CWD、仓库祖先和用户 `.agents/skills`。
- Claude 覆盖已文档化的优先级与 Plugin 命名空间。
- Antigravity 覆盖在 #30 落地之后补测。
- 中英文 Architecture、Extension API、Adapter 矩阵与实现状态记录核验日期。

## 未决问题

1. 发现根是 Adapter 方法返回值，还是 `defineExtension()` 上的只读元数据。
2. Antigravity 同名规则以 #30 的原生证据为准。
