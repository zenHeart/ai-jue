# RFC-0004：项目层 cross-tool symlink 模式的可移植发现合同

| 状态 | 决策 |
| --- | --- |
| `Proposed` | 待评审。本文档与 [GitHub issue](https://github.com/zenHeart/ai-jue/issues) 同步维护。 |

## 背景

2026-08-29 在 `sites-epub` 仓库调试一个 Claude 发现不到 `site2epub` skill 的问题时，定位到根因：

仓库内 `.claude/skills/site2epub` 与 `.cursor/skills/site2epub` 在 git 里是 mode `120000` 的符号链接（指向 `.agents/skills/site2epub`），但 Git for Windows 默认 `core.symlinks=false`，checkout 时把它们实体化成 30 字节的普通文件（内容是链接目标路径）。Claude Code 在 `.claude/skills/<name>/SKILL.md` 找目录里的 SKILL.md，看到的是一个文件，于是 skill 整个不加载。

把这件事向上推一层，问题暴露为**三层抽象上的同一类失败模式**：

| 层 | 谁在用 | 现在如何处理 | bug 是否暴露 |
|---|---|---|---|
| Git 对象层 | mode 120000 的 blob | `core.symlinks=true` 才实体化为真 symlink；默认 `false` checkout 成 30 字节文件 | ✅ |
| 项目层（in-repo cross-tool discovery） | `.claude/skills/<name>` / `.cursor/skills/<name>` / `.codex/skills/<name>` 同时指向一份 `.agents/skills/<name>` | 完全交给 git；没有任何工具替项目维护者把这件事物化 | ✅ |
| 用户层（机器级） | `workflow/config/bootstrap/apply-assets.zsh` 把 canonical 投影到 `~/.agents`、`~/.claude`、`~/.kimi-code`、`~/.openclaw`、`~/.hermes`、`~/.grok`、`~/.gemini` 等 runtime root | 显式 `cp -R` 物化（`install_skill_tree` 第 286–299 行）；有 `broken_projection_count` 与 `backup_broken_links` 兜底 | ❌ |

也就是说：**用户层有完整护栏（`apply-assets.zsh` 第 237–249 行的 `backup_broken_links`、第 283–285 行注释明说「A valid symlink can have identical bytes but still be rejected as an escaped projection, so canonical skill entries are always materialized as real directories」），项目层完全裸奔。** 这条经验只活在用户层脚本里，从未回流到 ai-jue 的项目层诊断。

ai-jue 代码里我搜过三处显式提到 symlink：

- `packages/ai-jue-core/src/core-executor.ts:75` —— **安全**：路径通过 symlink 逃出授权根时拒绝。「symlink 是威胁」视角。
- `packages/ai-jue-core/src/capability-mapping.ts` 的 `directoryPerItem` + Claude adapter 的 `write` —— **物化**：写盘走 `buildFullOwnershipTextChange` / `buildFullOwnershipBinaryChange`，从不创建 symlink。「symlink 不属于 ai-jue 的产物」视角。
- `packages/ai-jue/src/commands/format.ts:199` —— **判等**：「Check if it's the same file (symlink or identical content)」。读路径侧知道 symlink 存在。

三处都把 symlink 当输入风险或读路径上的中性存在处理，**没有把它当项目层的发现合同**。`jue inspect --extension <pkg> --diagnostics` 是 ai-jue 唯一相关的诊断通道，但目前不覆盖「项目层 cross-tool link 模式」。

## 目标 / 非目标

### 目标

1. 让 ai-jue 在项目层能识别「cross-tool symlink 发现模式」，并在 `core.symlinks=false` 的 Windows checkout 下诊断其破损（30 字节文件 / 目标不存在 / 跨设备 symlink）。
2. 把 `apply-assets.zsh` 已有的「物化优于 symlink」经验沉淀进 ai-jue 的官方合同，让项目维护者第一次写 `.claude/skills/<name>` 时就有明确建议。
3. 不破坏 ai-jue 现有的物化（materialize）语义：写路径仍然只产真实文件/目录，不产出 symlink。

### 非目标

- 不改变 `directoryPerItem` 与 `core-executor.ts` 的写路径语义。
- 不接管 `apply-assets.zsh` 的用户层投影职责（避免与 workflow 的「双源真相」打架）。
- 不在 ai-jue 内部创建 symlink；物化是唯一允许的产物形态。
- 不强制要求所有项目立刻消除项目层 symlink；只要求他们能立刻知道这件事有问题。

## 候选方案

### 方案 A：在 `jue inspect --diagnostics` 新增 `linkPattern` 检查（推荐先做）

新增模块 `packages/ai-jue-core/src/diagnostics/link-pattern.ts`：

- 扫描项目根下 `.claude/skills/*`、`.cursor/skills/*`、`.codex/skills/*`、`.agents/skills/*`。
- 对每一项 `fs.lstatSync(p)`：
  - `isSymbolicLink()` 为 true 且 `fs.existsSync(fs.readlinkSync(p))` 为 false → **error**：`broken-symlink:<path>`，建议重新 `jue apply` 或运行项目层 bootstrap。
  - 是普通文件但内容是裸相对路径（30 字节、纯文本、形如 `../../.agents/skills/...`）→ **error**：`symlink-checkout-degraded:<path>`，建议 `git config core.symlinks true && git checkout -- <path>`，或改用 `jue apply`。
  - 是 symlink 且目标在项目内相对路径下（`../../.agents/skills/<name>` 这类）→ **warn**：`cross-tool-symlink:<path>`，提示「此模式不跨 Windows+Git 默认配置可移植；建议改用 `jue apply` 物化或仓库内复制 + 子树同步」。
  - 是 symlink 且目标是绝对路径 / `~` / `..` 之外 → **error**：`cross-repo-symlink:<path>`，提示「目标在项目外，跨机器/跨设备同步会断」。
- 通过 `jue inspect --extension <pkg> --diagnostics` 暴露（与现有通道对齐，不新增 CLI）。

落在 `ai-jue-core` 而不是 `ai-jue`，理由：`directoryPerItem` 与核心引擎都不直接接触项目层 cross-tool symlink；新模块只读不写、纯诊断、不污染写路径语义。

### 方案 B：把经验写进 ai-jue 文档合同（必做，与 A 配对）

修改两个文档：

- `packages/docs/developer/documentation-contract.md`：新增「跨 client root 发现」章节，明确三档推荐：
  1. **首选**：`jue apply` 让 ai-jue 物化（已经设计好的职责）。
  2. **次选**：仓库内复制两份（`.claude/skills/<name>/` 与 `.agents/skills/<name>/`），git 子树或 subtree merge 同步。AI 资产的元 preset 就是这种形态（`packages/<x>/` 与 `packages/<y>/`）。
  3. **末选**：in-repo symlink —— 必须配套项目层 bootstrap 脚本（`scripts/ensure-skill-links.sh` 等），跑 `git config core.symlinks true && git checkout -- .claude/skills/...`。

- `packages/docs/guide/creating-a-preset.md`：在「推荐目录结构」一节末尾追加一段同样的三档推荐。

理由：「知道」和「被强制记住」是两回事，必须机器 + 人双保险。

### 方案 C（更激进，暂缓）：提供 `jue materialize-cross-links [--check|--apply]` 子命令

把 `apply-assets.zsh` 第 237–249 行的 `backup_broken_links` 语义提到 ai-jue 内部。

**暂缓理由**：这条会与 `apply-assets.zsh` 的现有 `backup_broken_links` 形成双源真相。要么明确 ai-jue 是事实源、改 `apply-assets.zsh` 去调它；要么保留脚本、ai-jue 只做项目层。两种都要重新走 RFC-0001 / RFC-0003 的合同边界讨论，性价比不如先把 A 落稳，看社区反馈再决定。

## 决策

**先 A + B 同步落，C 留作未来 RFC。**

## 详细合同

### A：诊断模块

```
packages/ai-jue-core/src/diagnostics/
├── index.ts                # 统一导出
└── link-pattern.ts         # 新增

# 触发方式（保持现有 CLI 形状）：
npx jue inspect --extension link-pattern --diagnostics
```

返回结构（与现有 `DiagnosticsReport` 对齐）：

```ts
type LinkPatternFinding =
  | { severity: 'error'; code: 'broken-symlink'; path: string; target: string }
  | { severity: 'error'; code: 'symlink-checkout-degraded'; path: string; expectedTarget: string }
  | { severity: 'warn';  code: 'cross-tool-symlink'; path: string; target: string }
  | { severity: 'error'; code: 'cross-repo-symlink'; path: string; target: string };
```

每个 finding 必带：

- `remediation`：建议命令或文档链接；
- `evidence`：`fs.lstatSync` / `fs.readlinkSync` / `fs.readFileSync(path, { encoding: 'utf8' })` 原文（限制 200 字符，避免泄漏）。

### B：文档合同

按 `developer/documentation-contract.md` 现有章节结构插入；`creating-a-preset.md` 在「推荐目录结构」末尾追加。三档推荐必须：

- 用「首选 / 次选 / 末选」字眼；
- 给出每档的最小可行示例（5 行以内的代码或路径）；
- 在末选里点名 Windows + `core.symlinks=false` 风险。

## 安全

- 诊断模块是只读，不写任何路径。`fs.lstatSync` / `readlinkSync` 在跨平台均安全，不会跟随 symlink 去访问目标以外的东西。
- `evidence` 字段限长 200 字符，避免泄漏路径之外的内容（如 skill 内部文本）。
- 不创建 / 删除 / 修改 symlink 或目录；不调 `git`；不触碰 `apply-assets.zsh` 已有逻辑。

## 兼容 / 迁移

- 对已有项目：第一次跑 `jue inspect --diagnostics` 可能一次性产出多条 `cross-tool-symlink` warn。这是预期行为，不是 regression。
- 对 `apply-assets.zsh`：脚本第 237–249 行的 `backup_broken_links` 与第 331–338 行的 `broken_projection_count` 行为不变。本 RFC 不接管用户层职责。
- 对 ai-jue `directoryPerItem`：写路径语义零变化，零迁移成本。

## 验收标准

1. `packages/ai-jue-core` 新增测试：在临时目录里制造 4 类场景（broken / degraded / cross-tool / cross-repo symlink），断言诊断模块的 finding 数量、severity、code、path 全部正确。
2. `packages/ai-jue` 新增 e2e：`npx jue inspect --extension link-pattern --diagnostics` 在 fixture repo 上输出可机读 JSON；CI 比对 fixture。
3. 文档合同：`documentation-contract.md` 与 `creating-a-preset.md` 的新增章节被至少一个真实 preset（`jue-preset-base` 或 `jue-preset-internal`）的 README 反向引用，作为「按合同落地」的证据。
4. 在 `sites-epub` 仓库实跑一次（RFC 提交者本地），把修复前的 30 字节文件、修复后的真 symlink 各跑一次 `jue inspect --extension link-pattern --diagnostics`，确认：
   - 修复前：至少 2 个 `symlink-checkout-degraded` error。
   - 修复后：至少 2 个 `cross-tool-symlink` warn，0 个 error。
5. `git status` 干净、`npm run build` 通过、`npm test` 通过、`npm run release-gate:v1.1` 通过。

## 未决问题

1. C 是否要提、什么时候提，等 A + B 落地后看社区反馈。
2. A 是否需要在 CI 上 hard-fail（error 级 finding 阻断 PR）还是 soft-fail（warn 级）。倾向 soft-fail，避免一刀切逼现有 preset 改结构。
3. `evidence` 字段要不要进一步加 hash，避免同一类 finding 在不同机器上字符串不同导致 fixture 不稳。

## 复现证据（来自 sites-epub）

修复前：

```text
$ ls -la C:/Users/cheng/code/github/sites-epub/.claude/skills
drwxr-xr-x  .
-rw-r--r--  30  site2epub    # 内容：../../.agents/skills/site2epub
```

修复命令：

```bash
cd <repo>
git config --local core.symlinks true
rm .claude/skills/site2epub .cursor/skills/site2epub
git checkout -- .claude/skills/site2epub .cursor/skills/site2epub
```

修复后：

```text
$ ls -la C:/Users/cheng/code/github/sites-epub/.claude/skills
drwxr-xr-x  .
lrwxrwxrwx  30  site2epub -> ../../.agents/skills/site2epub/
```

随附本地诊断输出（修复后，预期）：

```text
[warn] cross-tool-symlink: .claude/skills/site2epub -> ../../.agents/skills/site2epub
[warn] cross-tool-symlink: .cursor/skills/site2epub -> ../../.agents/skills/site2epub
```

如果 A 已经落地，这两条应该是 warn 而非 silent；如果还没落地，Claude / Cursor 完全不知道 skill 存在。

## 参考

- ai-jue 现有 RFC：`0001-minimal-conversion-model.md`、`0002-plugin-artifact-apply.md`、`0003-apply-scope-target-root.md`
- `apply-assets.zsh` 的成熟经验：`workflow/config/bootstrap/apply-assets.zsh` 第 237–338 行（`backup_broken_links` / `broken_projection_count` / `install_skill_tree`）
- ai-jue 现有诊断入口：`packages/ai-jue/src/commands/inspect.ts` 第 45 行注释
- Git for Windows 行为：默认 `core.symlinks=false`，mode 120000 checkout 成 30 字节文件

## 同步

本文档正文与 GitHub issue 同源维护；任一处更新须同步另一处。
