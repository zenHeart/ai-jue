# 实现状态

> 快照日期：2026-08-18。Architecture 与 Reference 是目标合同；本页是当前事实。
>
> 当前实现主线：R1（Claude）与 R2（Scale Gate）已完成；R3 并行迁移
> （Codex、OpenClaw、Hermes）与 R4 的 JUE-401 可移植子集矩阵均已完成，详见
> delivery-plan.md。RFC-0002：`jue apply --artifact` / `targets.*.artifact` 已接线；
> OpenClaw `compatible-bundle` 与 Hermes thin `skill-plugin` 已落地（见 Agent 画像）。
> RFC-0003：`jue apply --scope project|user` 与 `targets.*.scope` 已接线；Claude
> Code 支持 user，其他内置 Adapter 明确为 project-only。
> 下一步是 R4 剩余任务（JUE-402 两两交叉转换起）。

## CLI

| 理想命令 | 状态 | 当前事实 | 下一步 |
| --- | --- | --- | --- |
| `jue init` | 部分实现 | 已有交互初始化 | 对齐最小配置与非覆盖合同 |
| `jue apply` | 部分实现 | Core `--dry-run`/`--check`/apply 均按退出码表工作；project/user scope、逐 Adapter 根授权与批处理失败聚合已实现；Claude user 原生路径已实现，其他内置 Adapter project-only | 补齐 `jue inspect` 筛选 |
| `jue inspect` | 部分实现 | `--extension <path> --diagnostics` 已实现：只读报告已加载 Adapter 的 `id`/`capabilities`，若 cwd 有项目配置则额外报告真实 apply 就绪状态（JUE-203） | 实现 `--capability`/`--preset`/`--target`/`--artifact` 筛选 |
| `jue capability update` | 已实现 | 支持单项/全部来源更新 | 保持 lock 与安全合同 |
| `jue preset create/validate/pack` | 部分实现 | 历史命令分散 | 收敛到作者命名空间 |
| `jue extension validate` | 部分实现 | `--load` 校验并加载 Extension（JUE-103）；`--fixtures <dir>` 对每个子目录跑 `read()` + `CanonicalDocumentSchema` 校验（JUE-203）；Claude Adapter 现已导出真实 `confirm()` 并组装为 `defineExtension()`，是仓库首个可真实通过此校验的 Extension | 随 R3 各 Agent Extension 落地持续复用 |

现存 `format`、`validate`、`check`、`list`、`create-preset` 等命令是待收敛的历史
实现，不是目标架构。不得继续扩展其语义。

## Agent Adapter

| Adapter | project scope | user scope |
| --- | --- | --- |
| Claude Code | 已实现 | 已实现 |
| Codex / Cursor / OpenClaw / Hermes | 已实现 | 未声明，执行前失败 |

| Agent | 读取为 Canonical DSL | 写出 Artifact | 目标原生确认 |
| --- | --- | --- | --- |
| Claude Code | 已实现 | 已实现 | 已实现（`confirm()` 已导出并组装为 `defineExtension()`，JUE-203；Plugin 走真实 `claude plugin validate --strict`，project 无原生校验工具故如实返回 `unconfirmed`） |
| Codex | 已实现 | 已实现 | 已实现（`packages/ai-jue-adapter-codex/`，JUE-301）——能力声明如实标注三个"不支持"边界：`commands: "degraded"`（Codex 旧 custom-commands 机制已废弃，见 JUE-104/105/JUE-301 Phase 1）、`mcp: "degraded"`（plugin 形态写根级 `.mcp.json`；project 形态保持 TOML 降级，配在 `.codex/config.toml` 的 `[mcp_servers.*]` 表里）、`rules: "degraded"`（无独立 rules 目录，rules 归入 AGENTS.md 通过 `context` 映射实现）。原生确认：Codex 0.145.0 无 `codex plugin validate`。`confirm()` 对非 plugin 形态立即返回 `unconfirmed`；plugin 形态走真实 `codex plugin marketplace add <local>` + `codex plugin add <name> --marketplace <name>` + `codex plugin list --json`（隔离 CODEX_HOME），确认 Plugin 真被 codex 装上、出现在 inventory 且 `installed: true, enabled: true`，是 Codex 0.145.0 提供的最强原生确认路径。`scripts/verify-codex-native.js`（可重放）以 `artifactKind: "project"` 调用 `confirm()`，只验证了 read/write/confirm 函数在本机可加载运行、project 形态返回 `unconfirmed` 的代码路径，未调用真实 codex CLI |
| Cursor | 已实现 | 已实现 | 已实现（`packages/ai-jue-adapter-cursor/`）——project 与 Plugin 两种 Artifact；Skills/Subagents/Commands 保留 frontmatter；Project hooks 使用 `{ version: 1, hooks }`、Plugin hooks 使用 `{ hooks }`；MCP 命令型 server 自动补 `type: "stdio"`；`variables` 经 `tools.cursor.pluginManifest` 透传。`confirm()` 无官方 headless 校验，project/plugin 均返回 `unconfirmed`（plugin 附带结构证据） |
| OpenClaw | 已实现 | 已实现 | 已实现（`packages/ai-jue-adapter-openclaw/`，JUE-302）——`capabilities` 公开声明 `rules/commands/agents/mcp: "degraded"` 四个真实的"unsupported"边界（OpenClaw 无 per-workspace `commands/`/`agents/`/`rules/` 目录，`openclaw agents add/list/delete` 管理 user home 下的隔离 workspace；MCP 全局唯一在 `openclaw.json` 上），仅 `skills`/`hooks` 是 `supported`（`~/.openclaw/workspace-jue-probe/` 已实测确认的 `skills/<name>/SKILL.md` + `hooks/<name>/HOOK.md+handler.js` 形式）。原生确认走真实 `openclaw --profile jue-302-verify-<pid>-<ts> config validate --json`（隔离 `--profile` 防全局污染，实测通过），独立脚本 `scripts/verify-openclaw-native.js` 跑。**已发现并记录 openclaw 0.145.0 的一个怪癖**：`spawnSync`/`execFileSync` 在 vitest worker 里调 `openclaw config validate --json` 会产生空 stdout（手工 shell 调用正常），所以合同套件里**不**调用 `confirmNatively`（按 honest-degraded 原则），把真实原生确认放到了独立脚本里。`npm test`（285 通过，新增 5 项） |
| Hermes | 已实现 | 已实现 | 已实现（`packages/ai-jue-adapter-hermes/`，JUE-303）——`capabilities` 如实标注 `rules: "unsupported"`、`hooks: "unsupported"`（真实安装的 `~/.hermes/hooks/` 为空目录，证据不足）、`commands: "degraded"`、`agents: "degraded"`（均为 no-op 直通，`config.yaml` 同名块是全局运行时策略）、`skills: "supported"`、`mcp: "supported"`。原生确认：真实 `tirith config validate <projectRoot>`（`tirith` 二进制，隔离临时 `HOME`），`scripts/verify-hermes-native.js` 可重放，但需要真实 `tirith` 二进制在 `PATH` 上。修正三处真实实现 bug：①`confirm.ts` 此前把可执行文件名与参数拼成一个字符串传给 `execFileSync(cmd, options)`——`execFileSync` 从不调用 shell 分词，会把整个含空格的字符串当作字面可执行文件名，无论 `tirith` 是否存在都必然 `ENOENT`；已改为 `execFileSync("tirith", ["config", "validate", projectRoot], options)`。②`capabilities/skills.ts` 的 `write()` 此前对不含 `<category>/<name>` 斜杠的 Canonical skill key 直接抛错——但 Canonical 的 `skills` schema 就是无格式约束的 `record(string, SkillSchema)`，任何来自 Claude/Codex/OpenClaw 风格 Preset 的扁平 key（这三者的原生 skills 目录都是一层）都会让 `jue apply --adapter hermes` 直接崩溃；已改为无斜杠时回退到 `general` 分类而不是拒绝，真实 `ai-assets` 仓库（27 个 agent、9 个 skill）以此验证通过。③同一文件里 `references` 附件文件名此前要求单一安全路径段，遇到嵌套路径（如 `references/nested/guide.md`，Claude/Codex 的 `bundleKeys` 机制支持这种嵌套）会拒绝写入；已复用 `ai-jue-core` 已导出的 `resolveSupportFilePath`（与其余 Adapter 的 `directoryPerItem` 工厂同一份防路径穿越逻辑）允许安全的嵌套子目录。另有一个未决架构问题：Adapter 在 `CanonicalDocumentSchema` 上新增了 `cron` 字段（`cron/jobs.json` 整文件直通），不属于六类原子 Capability 中的任何一类，是否需要正式收编（第七类原子 Capability，或改走 `tools.hermes` target-private 字段）尚未经 RFC 决定，见下方"尚未实现的关键合同" |

“部分实现”只表示已有局部代码和测试，不表示该 Agent 已完整支持。逐项证据见
[Agent 支持画像](../agents/)。

## 已完成基础

- Canonical Capability 基础结构与规范化。
- Preset 递归组合和嵌套资源保留。
- 本地和部分远程 Capability 输入、lock 与更新。
- Claude Code/Codex 的部分正向文件生成。
- `CanonicalDocument` 类型/schema 冻结（`context` + 六类原子 Capability），
  `toCanonicalDocument()` 剥离 `presets`/`preset`/`extends`/`capabilities`/
  `tools`/`language` 等 ProjectConfig 私有字段，不进入 Canonical 输出
  （JUE-101，`packages/ai-jue/src/config.ts`）。
- `capabilities` 的 `CapabilityRef` 从历史 `converter`
  （`agent-skill`/`mcp`/`jue-native`）迁移为 `type`
  （`rule`/`command`/`skill`/`agent`/`hook`/`mcp`），移除了可批量加载整个目录
  的 `jue-native`；每个引用现在只解析一个叶 Capability
  （JUE-101，`packages/ai-jue/src/capability-source/index.ts`）。
- `ArtifactChange`/`ArtifactResult`/`Confirmation` 类型冻结，含
  `assertArtifactChange`/`assertConfirmation` 结构不变量：安全相对路径、
  hash 是否存在与 `kind` 一致、`confirmed` 必须带脱敏 `evidence`
  （JUE-102，`packages/ai-jue-core/src/artifact-change.ts`）。`ownership`
  （`full`/`managed-block`/`merged-keys`）与 `atomicState` 已写入
  `packages/docs/reference/extension-api.md`。
- `Adapter`/`ExtensionDefinition`/`CapabilitySupport`/`defineExtension` 冻结
  于 `packages/ai-jue-core/src/extension-host.ts`：Adapter 只暴露
  `read`/`write`/`confirm`，`capabilities` 对六类原子 Capability 逐项声明
  `supported`/`degraded`/`unsupported`（JUE-103）。
- `resolveExtensionPackage`/`loadExtensionGuarded`
  （`packages/ai-jue/src/extension-loader.ts`）实现"npm 信任与隔离加载"：
  只校验 npm `package.json` 的 `exports`/`main`/`peerDependencies["ai-jue-core"]`
  且不执行入口；`--load` 时在导入阶段监视并阻断 `fs` 写入方法、
  `child_process` 系列方法、`process.exit` 与 `fetch`，测试证明恶意入口试图
  写文件或起子进程时确实被阻止、且文件从未被创建（JUE-103）。
- `jue extension validate <path-or-package> [--load]`
  （`packages/ai-jue/src/commands/extension.ts`）已接入 CLI，退出码对齐
  `packages/docs/reference/cli/index.md`（元数据问题退出 `2`，`--load` 期间
  抛错退出 `1`），已用真实构建产物 `node dist/cli.js extension validate`
  验证。
- 修正 JUE-101 遗留的错误分层：`CanonicalDocument` 及其六类原子 Capability
  zod schema 从 CLI 包 `ai-jue` 迁移到 `ai-jue-core`
  （`packages/ai-jue-core/src/canonical-document.ts`），因为 Adapter 只依赖
  `ai-jue-core`，从不依赖 CLI 包。
- Claude Code 官方能力表面已核验并写入
  `packages/docs/{,en/}agents/claude-code.md`：能力矩阵、作用域优先级表、
  目标私有字段清单，均基于 `claude` CLI `2.1.219` 的 `--help`、
  `plugin validate`、headless `system/init` 实测与官方文档交叉验证
  （JUE-104）。headless 清点路径（`--plugin-dir` + `--output-format
  stream-json`，不可加 `--bare`）已确认可用，供 JUE-109/110 原生验证复用；
  但该路径**不保证零成本**（见下方 JUE-105 记录），JUE-109 使用前必须先确认
  prompt 结构上不会触发真实模型调用。
- Claude Code 最小全量 fixture 已构造并接入真实 CLI 验证
  （`packages/ai-jue-adapter-claude/fixtures/`，JUE-105）：project-native
  配置、含/不含 manifest 的两个 Plugin、marketplace 索引、命名冲突样本、
  三个失败样本（空 skill body、非法 hook 事件名、路径穿越的 hook
  command）与一个敏感引用样本；每条 `claude plugin validate` 结果均已用真实
  CLI 复核并写入 `fixtures/README.md`。构造过程中发现并修正了 JUE-104 报告
  的 5 处不准确断言：
  - `hooks.json` 需要外层 `"hooks"` 键包裹事件名（不是事件名直接在顶层）；
  - `plugin.json` 的 `dependencies` 是 `"<name>@<range>"` 字符串数组，不是
    对象；
  - `userConfig.<KEY>` 必须有 `title` 字段；
  - `agent`、`subagentStatusLine` 根本不是合法的 `plugin.json` 字段（
    `claude plugin validate` 报"unknown field"警告，Claude Code 在加载时
    忽略它们）；
  - headless `--tools ""` **不保证零成本**：同样的命令产生了真实计费
    `total_cost_usd: 0.0394407`，因为 prompt 若不需要工具，模型仍会正常生成
    回复。真正免费需要 prompt 结构上依赖一个已被禁用的工具。
  - 同时确认：manifest-optional 自动发现是 `--plugin-dir` **运行时**行为，
    `claude plugin validate` 这条校验路径反而要求必须存在 `plugin.json` 或
    `marketplace.json`，二者不可混为一谈。
- Claude Code Adapter 的 `read()`（Native → Canonical）已实现并对全部
  JUE-105 fixture 验证通过（JUE-106，
  `packages/ai-jue-adapter-claude/src/read.ts`）：project 与 Plugin 双布局
  按 `.claude/` 目录是否存在自动识别；rules（`paths` frontmatter 映射为
  `globs`）、commands、agents（扁平 `.md`）、skills（目录 + SKILL.md）、
  hooks（project 读 `settings.json`，Plugin 读 `hooks/hooks.json`，二者归一
  为同一 Canonical hook 形状）、mcp.servers（扁平与包裹两种原生形状归一）、
  context.global（解析 `CLAUDE.md` 的一级 `@AGENTS.md` import）。
  `packages/ai-jue-core/src/security.ts`（`assertNoLiteralCredentials`）与
  `packages/ai-jue-core/src/frontmatter.ts`（`splitFrontmatter`）已提升为
  共享能力，`capability-source` 与 Adapter 复用同一份规则。
- Claude Code Adapter 的 `write()`（Canonical → Artifact）已实现（JUE-107，
  `packages/ai-jue-adapter-claude/src/write.ts`），与 `read()` 共享
  `packages/ai-jue-adapter-claude/src/capabilities/*.ts` 声明表，经由
  `packages/ai-jue-core/src/capability-mapping.ts` 的通用引擎驱动：
  `flatMarkdownDirectory`/`directoryPerItem`/`managedMarkdownFile`/
  `mergedJsonFile` 四类原生形状 + `readCapabilities`/`writeCapabilities`
  组合器，使同一 Capability 的 read/write 由同一份声明构造，而非两份手写、
  仅靠约定保持互逆的实现。`ArtifactChange` 补上了 `content` 字段（此前只有
  hash，Core 无从得知实际写入字节，是本任务发现并修正的 JUE-102 遗漏）。
  两条等价性合同已用测试专用 `applyChanges` 脚手架验证：
  `normalize(read(write(C)))=normalize(C)` 与
  `normalize(read(write(read(N))))=normalize(read(N))`（覆盖 project 与
  Plugin 两种 Artifact），另有未托管字段保留与二次 apply 零差异专项测试。
  过程中发现并修正一个真实 bug：`context.global` 的 `read()` 此前未剥离
  `AI-JUE:START/END` 包裹，导致往返失败；已在 `ai-jue-core` 新增
  `extractManagedContent`（`stripManagedBlock` 的对偶）修复。
- `packages/ai-jue-core/src/index.ts` 与 `packages/ai-jue-adapter-claude`
  的 read/write 实现均按领域拆分为多个小文件（`capability-mapping.ts`、
  `merge-strategies.ts`、`capability-ref.ts`、`file-io.ts`、
  `markdown-rendering.ts`、`core-executor.ts`；
  `capabilities/{rules,commands,agents,skills,hooks,mcp,context,layout,
  manifest}.ts`），不再有承担多个能力职责的单一大文件；`ai-jue-core` 的测试
  也从 `src/*.test.ts` 迁移到独立的 `test/` 目录，与仓库其余包的约定一致
  （顺带修正了 `tsconfig.json` 遗漏排除新测试目录、导致测试文件被打进
  `dist/` 发布产物的问题）。设计记录见
  `docs/superpowers/specs/2026-07-26-capability-mapping-engine-design.md`。
- Claude Extension 包入口只导出 `defineExtension()` 默认值，测试通过其中的
  `Adapter.write()` 与 Core executor 物化 Artifact。以下映射行为均已验证并同步
  更新 `index.test.ts`、跨适配器的 `adapter-matrix.test.ts` 与
  `adapter-capability.snapshot.test.ts`：
  - `context.global` 不再额外写一份 `AGENTS.md` 数字摘要（"## Rule: x"）
    再用 `CLAUDE.md` 的 `@AGENTS.md` 引用它；直接写入 `CLAUDE.md`，因为
    Claude Code 从不自行读取 `AGENTS.md`（JUE-104 已验证）。跨适配器场景下
    `AGENTS.md` 仍然存在——由 Cursor 适配器写入，不再是 Claude 适配器的
    职责。
  - `commands` 不再重定向进 `.claude/skills/*/SKILL.md`（旧代码假设
    "commands 被合并进 skills"，未经验证）；改为写入
    `.claude/commands/*.md` 独立目录，与 JUE-105 对真实 CLI 的验证一致。
  - `alwaysApply`/`disable-model-invocation` 等此前硬编码的字段改名或默认值
    予以移除（均未在 JUE-104/105 中得到验证），rules/commands/skills/agents
    现在是对 Canonical 属性的通用透传，只保留唯一已验证的改名
    （`globs` → `paths`，仅用于 rules）。
  - 新增 `WriteContext.toolsConfig`（`tools.claude` 透传设置合并进
    `settings.json`）与 `WriteContext.pluginManifest`
    （`packages/ai-jue-adapter-claude/src/capabilities/manifest.ts`，生成
    `.claude-plugin/plugin.json`）。后者已用真实 `claude plugin validate
    --strict` 验证通过（`packages/ai-jue-adapter-claude/test/
    plugin-manifest.test.ts`），补上了此前 `artifactKind: 'plugin'` 只写
    六类能力、从不生成 manifest 因而无法通过 `claude plugin validate`（只能
    走 `--plugin-dir` 的 manifest-optional 运行时发现）的缺口——这是
    JUE-109/110 原生确认要求的必需项，不是可选增强。
  - **明确排除的范围**：Marketplace/聚合索引 Artifact（`marketplace.json`
    生成）本轮不实现；没有任何 JUE-101 至 JUE-110 的验收标准要求它，
    在没有对应 Gate 前实现属于超出当前问题域的投机性扩展，取舍原则见
    `packages/docs/architecture/adapter-standardization.md`"Artifact 粒度
    取舍"一节。
- Core 执行器（JUE-108，`packages/ai-jue-core/src/core-executor.ts`）已实现
  `planExecution`/`applyExecution`/`checkExecution`：
  - **漂移检测**：写入前重新读取磁盘真实哈希，与 `beforeHash` 比对；
    `create` 撞见已存在文件、`update`/`delete` 撞见缺失或已被改动的文件均判定
    为冲突，整批以零写入方式阻塞（`blocked-conflict`）。
  - **授权**：`requiresApproval` 为真且不在 `authorizedTargets` 内的变更单独
    归类为 `blocked-unauthorized`，同样零写入阻塞，不与冲突混淆。
  - **原子执行与回滚**：每次写入前先快照该文件当前字节（或"此前不存在"），
    批次中任意一步失败即按相反顺序恢复所有已完成的写入，返回
    `rolled-back`；测试用一个已存在的普通文件冒充目录路径制造真实写入失败，
    验证已应用的其他改动被完整还原（`core-executor.test.ts`，17 项断言）。
  - **幂等**：`afterHash` 已存在于磁盘的变更视为 `no-change`，二次 apply 零
    写入，`checkExecution` 与 `--check` 复用同一分类。
  - `applyChangesOrThrow` 是测试脚手架物化 `write()` 输出的便捷封装；取代了此前
    占位的 `artifact-executor.ts`（无漂移/授权/
    回滚的最小文件系统原语），按"不保留遗留资产"原则整体删除，不是新增
    并行实现。
  - CLI 接入（`packages/ai-jue/src/core-apply.ts`）：`jue apply` 校验 Extension
    默认导出并直接调用其中唯一 Adapter 的 `write()`，所有内置 Adapter 统一走
    Core 执行器，
    `--dry-run`（零写入预览，恒退出 `0`）与 `--check`（只读，`no-change`
    退出 `0`、`pending`/`blocked-conflict` 退出 `3`、
    `blocked-unauthorized` 退出 `4`、`rolled-back` 退出 `1`）已接入真实
    退出码。包顶层方法不参与 apply 运行时合同。
    `scripts/smoke-apply.js` 新增 `runCoreExecutorSmoke()`，用真实构建产物
    `dist/cli.js` 验证：空项目 `--dry-run` 零写入、`--check` 退出 `3`、
    apply 退出 `0` 并写入、apply 后 `--check` 退出 `0`、二次 apply 不改写
    文件 mtime（零差异）。**范围说明**：真实磁盘漂移阻塞
    `blocked-conflict` 已在 `core-executor.test.ts` 用直接构造的
    `ArtifactChange` 验证；单次 `jue apply` 调用内 `write()` 与
    `applyExecution` 紧邻执行、之间没有真实时间窗口，因此无法也不需要在
    CLI 级别重现外部并发修改触发漂移的场景。
  - `npm test`（282 通过，含新增 17 项 `core-executor.test.ts` 断言）。
- Claude 原生可用性验证（JUE-109，`scripts/verify-claude-native.js`，可从
  干净 worktree 重放）：用真实 `write()`/`applyChangesOrThrow()` 在隔离临时
  目录生成一个只含单个确定性 command 的最小 Plugin；`claude plugin validate
  --strict` 通过；强制制造一次批次中途真实写入失败（第二个变更的父路径与已
  存在的普通文件冲突），`core-executor.ts` 的 `applyExecution` 完整回滚，回滚
  后用同一个 `claude plugin validate --strict` 复核 fixture 未被破坏；
  `claude --bare -p "/jue-109-verify:status" --plugin-dir <fixture>
  --output-format stream-json --verbose --allowedTools ""` 的 `system/init`
  显示生成的 Plugin 出现在 `plugins`、`plugin_errors` 对其无条目、
  `slash_commands` 含生成的 command，最终 `result` 为
  `{is_error:false, result:"JUE-109-OK"}`（确定性标记文本，证明能力被真实
  发现且调用）；单次真实计费 $0.003–$0.005。发现三处真实事实：`--bare`
  认证严格要求 `ANTHROPIC_API_KEY` 或经 `--settings` 的 `apiKeyHelper`（不读
  OAuth/keychain，本机交互式登录不适用于 `--bare`，本次验证改用
  Anthropic-API 兼容的第三方后端满足该要求）；`--bare` 不隔离机器上已安装的
  其余真实 Plugin（`plugins` 清单会连同 fixture 一起出现）；`plugin_errors`
  在无错误时是整字段缺失而非空数组。完整证据见
  `packages/ai-jue-adapter-claude/fixtures/README.md`"JUE-109 native
  usability verification"一节。范围说明：fixture 刻意只含 command，未覆盖
  `agents`/`mcp.servers` 在 `--bare` headless 下的 inventory（已知 `--bare`
  会丢失二者，见 JUE-104/105 记录）——这两类的 read()/write() 正反等价已由
  JUE-106/107 的单测覆盖，只是未过这一关；`confirm()` 方法本身与
  `defineExtension()` 组装不在本任务验收范围内，仍未开始。
- Claude MVP Gate（JUE-110，`scripts/verify-claude-mvp-gate.js`，一条命令，
  可从干净临时目录重放）：用真实 `project/` 原生 fixture（与 JUE-105/106/
  107 测试同一份，非另造样本）串起完整 R1 链路——`read()` 得到 Canonical 并
  通过 `CanonicalDocumentSchema`；转换为 Plugin 前剥离 `context.global`
  （Claude Code 的 Plugin 没有 CLAUDE.md 等价机制，`write()` 对
  `artifactKind:"plugin"` 从不产出 `context.global`，与 `plugin/` fixture
  自身的能力覆盖矩阵一致，是既有的 Artifact-kind 边界而非本任务引入的
  缺陷）；加入一个仅用于验证的确定性 command 后写入全新临时目录并生成
  Plugin，经 Core 执行器 apply；`claude plugin validate --strict` 通过；
  `read()` 结果与写入前 Canonical `deepStrictEqual`（`normalize(read(write(
  read(N))))=normalize(read(N))` 合同，在同一条脚本内端到端验证）；对同一
  Canonical 再次 `write()` 得到零变更（幂等）；`claude --bare -p
  "/jue-110-mvp-gate:mvpGateProbe" --plugin-dir <fixture> --output-format
  stream-json --verbose --allowedTools ""` 的 `system/init` 显示 Plugin
  已加载且无错误条目、探针 command 出现在 `slash_commands`，最终 `result`
  为确定性标记文本，证明真实发现并调用，单次真实计费约 $0.005；并确认
  fixture 自带的失效 `mcp.servers`（指向不存在的 `node server.js`）不会
  阻塞或挂起该调用。完整证据见
  `packages/ai-jue-adapter-claude/fixtures/README.md`"JUE-110 Claude MVP
  Gate"一节。R1（JUE-101 至 JUE-110）全部 `done`；`delivery-plan.md` 中
  "JUE-110 未完成前不开始其他 Agent 实现"的限制已解除，下一个 `ready`
  任务是 JUE-201。
- `agent-extension` Skill（JUE-201，
  `packages/jue-preset-internal/skills/adapter-creator/`，`SKILL.md`
  v6.0.0）：既有的六阶段方法论现已显式自证为 delivery-plan.md R2 所指的
  `agent-extension` Skill，并补齐三处此前落后于 JUE-108/109/110 实际实现的
  内容——Phase 4 新增：Adapter 的 `write()` 输出必须经
  `core-executor.ts`（JUE-108）的 `planExecution`/`applyExecution`/
  `checkExecution` 驱动，不得每个 Adapter 各自实现 apply/回滚；Phase 5
  修正：等价性合同用真实 `applyChangesOrThrow` 验证，不再引用已删除的
  占位 `applyChanges` 脚手架；Phase 6 新增"可复用脚本形态"，把
  `scripts/verify-claude-native.js`/`verify-claude-mvp-gate.js` 的具体做法
  （确定性标记 command、强制批次失败并用原生工具复核回滚、认证与隔离是两个
  要分别核实的独立问题、外部进程引用损坏不一定阻塞 headless）泛化为任意
  目标 Agent 通用的模板。Phase 2 新增"聚合 Artifact 调查"，引用
  adapter-standardization.md 的粒度取舍判据。此变更是文档/方法论资产更新，
  未新增测试用例；`npm test`（282 通过，无回归）。
- 共享合同测试套件（JUE-202，`packages/ai-jue-core/src/
  adapter-contract-kit.ts`）：`defineAdapterContractSuite(options)` 一次调用
  即注册六类合同测试——两条等价性合同、幂等、未托管字段保留、敏感引用拒绝、
  按 Artifact kind 的原生确认（每个 fixture 可选的 `confirmNatively`
  回调）——内部经真实 `applyChangesOrThrow`/`core-executor.ts` 落盘，不是
  另一套测试专用写入器。只从 `ai-jue-core/testkit` 子路径导出（包根新增
  `testkit.js`/`testkit.d.ts`，`vitest` 声明为可选 `peerDependency`），刻意
  不进入 `ai-jue-core` 主入口 `index.ts`，避免测试框架依赖污染运行时消费者；
  `vitest.config.ts` 新增对应的 alias 条目使其在仓库内解析到源码而非
  `dist/`。已用 Claude Adapter 真实改造验证：新增
  `packages/ai-jue-adapter-claude/test/contract.test.ts`（8 项断言，含真实
  `claude plugin validate --strict` 原生确认）替换手写的 `write.test.ts`
  （6 项重复断言，已删除），并将 `read.test.ts` 中重复的敏感凭据拒绝测试
  迁移进共享套件的 `securityRejectionCases`（该测试从 `read.test.ts` 移除）；
  `adapter-creator/SKILL.md` 升至 v6.1.0，Phase 5 改为指向该共享套件。
  `npm test`（283 通过，净增 1：282 − 6（删除 write.test.ts）+ 8（新增
  contract.test.ts）− 1（read.test.ts 去重）= 283）。
- 作者 CLI 支持（JUE-203）：前置发现并修复了一个真实缺口——
  `jue extension validate ai-jue-adapter-claude` 此前必然失败，该包只有
  `dependencies.ai-jue-core`，缺 JUE-103 校验要求的
  `peerDependencies["ai-jue-core"]`，且从未导出 `defineExtension()` 形状的
  默认导出（只有独立 `read`/`write`，从无 `confirm()`）。已补齐：新增
  `packages/ai-jue-adapter-claude/src/confirm.ts`（Plugin 走真实
  `claude plugin validate --strict`；project 无对应原生校验工具，如实返回
  `unconfirmed`）；`index.ts` 组装 `Adapter`（六类 `capabilities` 均
  `supported`）并 `export default defineExtension(...)`；`package.json`
  补上 `peerDependencies.ai-jue-core`。`node dist/cli.js extension validate
  ai-jue-adapter-claude --load` 首次真实成功。在此基础上新增两个 CLI 入口：
  ①`jue extension validate <pkg> --fixtures <dir>`
  （`packages/ai-jue/src/commands/extension.ts` 的
  `runExtensionFixtureCheck`）对目录下每个直接子目录调用已加载 Extension
  首个 Adapter 的 `read()` 并按 `CanonicalDocumentSchema` 校验，逐条报告
  通过/失败，任一失败退出码 2；已用真实 Claude `project`/`plugin` fixture
  验证均通过。②`jue inspect --extension <pkg> --diagnostics`（新增
  `packages/ai-jue/src/commands/inspect.ts`）：只读报告已加载 Adapter 的
  `id`/`capabilities`，若 cwd 存在项目配置则额外经真实
  `core-executor.ts`（JUE-108）的 `checkExecution` 报告对该项目的 apply
  就绪状态，从不写入；在仓库自身根目录实测发现 17 项待处理变更（真实、非
  伪造结果），`git status` 确认零写入。`--capability`/`--preset`/
  `--target`/`--artifact` 筛选未实现，已在本文件的 CLI 表中标为规划。
  `npm test`（293 通过：新增 `confirm.test.ts` 3 项、
  `extension-fixtures.test.ts` 4 项、`inspect.test.ts` 3 项）。
- 中性第二 Adapter 验证（JUE-204）：中性 Adapter 建成仓库内测试 fixture
  `packages/ai-jue-core/test/fixtures/neutral-adapter/`，而非
  `packages/ai-jue-adapter-*` 独立包——`jue apply` 的 `findAdapters()` 用
  glob 发现适配器，独立包会被真实纳入 `apply --all`/`smoke-apply.js` 候选
  列表，一个没有真实原生工具、纯测试用途的构造进入该命名空间即是对公共
  语义的污染；这也是 Rollup/Vite/Webpack/Babel/ESLint 等内核+插件仓库验证
  框架通用性时的通行做法（合成插件内联在被测框架自身测试目录，不作为兄弟
  发布包）。原生形状：七个 `mergedJsonFile` 映射，每个 Capability 类型一个
  独立 JSON 文件（`context.json`/`rules.json`/`commands.json`/
  `agents.json`/`skills.json`/`hooks.json`/`mcp.json`），与 Claude 的
  "每条目一个文件/目录"形状完全不同；`mcp` 额外做 `servers`↔`mcpServers`
  键名转换（复用 `assertNoLiteralCredentials`），证明 `toCanonical`/
  `toNative` 转换机制同样泛化。`confirm()` 如实返回 `unconfirmed`（该虚构
  Agent 没有任何官方工具可确认）。设计中发现并规避一个真实陷阱：若六个
  Capability 共用同一文件、各自独立声明 `mergedJsonFile`，`writeCapabilities`
  只做简单拼接、不合并同路径变更，Core 顺序应用时后一个变更会覆盖前一个；
  改为每个 Capability 各自独立文件后完全规避，未改 `capability-mapping.ts`。
  `packages/ai-jue-core/test/adapter-contract-kit.neutral.test.ts` 直接调用
  JUE-202 的 `defineAdapterContractSuite`（6 项断言，零 Claude 专属代码）。
  已核实 `canonical-document.ts`/`capability-mapping.ts`/`core-executor.ts`/
  `extension-host.ts` 四个文件实现前后 md5 完全一致；`check-consistency`/
  `smoke-apply.js` 均确认未新增真实包、未被 `jue apply` 发现。`npm test`
  （299 通过，新增 6 项）。
- R2 Scale Gate（JUE-205）：全量回归复核（`npm test` 299 通过、
  `npm run build`、`npm run check-consistency`、
  `npm --prefix packages/docs run docs:build`、`git diff --check` 全部通过）。
  冻结模板（`adapter-creator/SKILL.md` v6.2.0）、输入契约（能力矩阵+最小全量
  fixture）、输出契约（`packages/ai-jue-adapter-{agent}/` 目录骨架，`write()`
  经 `core-executor.ts` 驱动）、完成证据契约（`claude-code-execution.md`
  "交接合同"从 8 字段扩充为 12 字段：新增 `status`/`changes`/
  `security_results`/`next_ready_task`）、以及合成测试目标不得建成独立包的
  生态位边界（JUE-204 先例）。详见 `claude-code-execution.md`"Scale
  Gate（JUE-205）冻结内容"一节。R3 三条任务（JUE-301/302/303）现已解除
  阻塞，均为 `ready`。
- R3 三个并行 Adapter（JUE-301 Codex、JUE-302 OpenClaw、JUE-303 Hermes）均已
  按 JUE-205 输出契约建成：各自的 `capabilities/*.ts` 声明表 +
  `read.ts`/`write.ts`/`confirm.ts`/`index.ts` 组装 `Adapter` +
  `defineExtension()`，`write()` 均经 `core-executor.ts` 驱动，因而
  `jue apply --adapter <codex|openclaw|hermes> --dry-run/--check` 现已可用
  （不再局限于 Claude）。三者原生确认路径各不相同：Codex 走真实
  `codex plugin marketplace add`+`plugin add`+`plugin list --json`；OpenClaw
  走真实 `openclaw --profile <isolated> config validate --json`（vitest
  worker 内调用有空 stdout 的经验性怪癖，故合同套件内不调用
  `confirmNatively`，原生确认改在独立脚本 `scripts/verify-openclaw-native.js`
  跑）；Hermes 走真实 `tirith config validate`（`scripts/verify-hermes-native.js`）。
  `npm test` 当前 292 通过。JUE-401（四 Adapter 可移植子集矩阵）也已完成，
  详见 delivery-plan.md R4 与 `packages/ai-jue-adapter-hermes/audit/
  JUE-401-portable-canonical.md`。
- 真实 ai-assets 仓库四 Agent 验收：`scripts/smoke-local-preset.js`（此前只跑
  Codex/Claude Code）扩展为同时对 OpenClaw/Hermes 跑 `apply` 并校验各自的
  必需原生输出；对内置 `local-preset-monorepo` fixture 与真实
  `~/code/github/ai-assets` 仓库（`presets/{mcp,meta,coding,content,
  agent-os,personal}` 六个 workspace 包，`personal` 组合其余五个，含 27 个
  agent、9 个 skill）均已用 `npm run smoke:preset-local` 实测通过，四个
  Adapter 全部零错误完成 apply，真实文件正确落盘（含 Hermes 分类回退与嵌套
  references）。过程中发现并修复两处与本仓库无关但阻塞该验收的环境/外部
  问题：仓库自身 `node_modules` 符号链接过期（仍指向已删除的
  `ai-jue-adapter-copilot`/`ai-jue-adapter-gemini`，缺失新增的
  `ai-jue-adapter-openclaw`/`ai-jue-adapter-hermes`），已 `npm install`
  重新同步；ai-assets 仓库 `presets/mcp/package.json` 的
  `ai.capabilities.filesystem` 仍用已废弃的 `converter` 字段名（JUE-101 已把
  该字段迁移为 `type`），在 ai-assets 侧改为 `"type": "mcp"` 后才能通过
  `CapabilityRefSchema` 校验。
- 修正一处真实的 Capability Source 缓存隔离 bug（`packages/ai-jue/src/
  capability-source/index.ts`）：`resolveSource` 的默认缓存根目录固定是
  `~/.cache/ai-jue`，缓存 key 只由 `sha256(source+ref+path)` 决定、与消费方
  项目无关；但 `AI_JUE_SOURCE_MIRROR_DIR`（供 `scripts/smoke-local-preset.js
  --offline-mirror` 等测试场景用合成 stub 内容替身真实抓取）此前没有对应的
  缓存根目录隔离开关，一次带 `--offline-mirror` 的测试运行会把虚构内容
  （如 `neutral-filesystem`）写进这个全局共享缓存，此后任何项目对完全相同
  `source`/`ref`/`path` 的真实解析都会静默复用这份虚构内容，而不是真正抓取
  ——本任务在对真实 ai-assets 仓库跑验收时曾被这个问题掩盖了 ai-assets 自身
  `presets/mcp/package.json` 里一个真实存在的错误（`npm:@modelcontextprotocol/
  server-filesystem@1.2.0` 从未发布过 `1.2.0` 版本，真实抓取会以 `ETARGET`
  失败，但被之前一次 `--offline-mirror` 测试运行污染的缓存条目掩盖成"成功"）。
  已新增 `AI_JUE_CACHE_DIR` 环境变量（与 `AI_JUE_SOURCE_MIRROR_DIR` 对称）
  覆盖缓存根目录，`smoke-local-preset.js` 在 `--offline-mirror true` 时一并
  设置到临时目录，不再触碰真实缓存；已清理本机被污染的 `~/.cache/ai-jue`
  并在 ai-assets 侧把版本改为真实存在的 `2026.7.10`，复核 `.mcp.json` 输出
  确认指向真实包名而非虚构 stub。新增回归测试
  `packages/ai-jue/test/capability-source.test.ts`"honors AI_JUE_CACHE_DIR
  when options.cacheDir is not supplied"（`npm test` 293 通过，净增 1）。
- 修正两处 `packages/ai-jue/src/commands/apply.ts` 里 OpenClaw/Hermes 短名解析
  的真实 bug：①`ADAPTER_ALIAS_MAP` 此前没有 `openclaw`/`hermes` 条目，
  `jue apply --adapter openclaw` 会把短名直接当 npm 包名去装——在全新项目里
  实测真的从公共 npm registry 装并加载了一个同名但完全无关的第三方包
  （`openclaw@2026.7.1-2`，一个消息网关工具），触发 ESM/CJS 冲突崩溃；已补
  齐别名映射。②`ADAPTER_INDICATORS` 给 Hermes 用的 footprint 探测文件最初
  选了裸 `config.yaml`——这个文件名在 Docusaurus、mkdocs、Ansible、
  Serverless 等大量无关工具里都很常见，会让 `jue apply`（未显式传
  `--adapter`）在毫不相关的项目里误判并静默触发
  `npm install -D ai-jue-adapter-hermes` 与一次错误的 apply；已改为
  `MEMORY.md`，与其余 Adapter 探测文件（如 `CLAUDE.md`）的特异性对齐。

## Cursor 后续工作

[JUE-304](delivery-plan.md) 已完成 Cursor project/plugin 正反转。下列 GitHub Issues 为**独立后续任务**——Agent 开工前必须阅读 issue 全文（含 Acceptance criteria 与 Implementation notes）：

| Issue | 任务 |
| --- | --- |
| [#8](https://github.com/zenHeart/ai-jue/issues/8) | `.cursor-plugin/marketplace.json` 生成 |
| [#9](https://github.com/zenHeart/ai-jue/issues/9) | OpenClaw compatible-bundle 第三基底：Cursor 布局 |
| [#10](https://github.com/zenHeart/ai-jue/issues/10) | adapter-creator 双布局文档 |
| [#11](https://github.com/zenHeart/ai-jue/issues/11) | failure fixtures + 安全合同 |

详见 [`agents/cursor.md` §5](../agents/cursor.md#5-后续工作github-issues)。

## 尚未实现的关键合同

- `resolveFinalConfig` 仍返回混合 ProjectConfig 字段的 `MergedConfig`，不是
  `CanonicalDocument`；`jue apply` 对 Core 执行器路径都在各自入口内单独调用
  `toCanonicalDocument(config)`，尚未让 `resolveFinalConfig` 本身统一产出
  `CanonicalDocument` 供全部 Adapter 共用。Claude/Codex/Cursor/OpenClaw/Hermes
  的默认 Extension 均提供 Adapter `write()` 并接入 Core 执行器（Cursor project + plugin，[JUE-304](delivery-plan.md)）。
- Hermes Adapter（[JUE-303](delivery-plan.md)）在 `CanonicalDocumentSchema` 上新增了一个 `cron`
  字段（`packages/ai-jue-core/src/canonical-document.ts`，`cron/jobs.json`
  整文件直通），不属于本文件其余各处反复强调"冻结"的六类原子 Capability
  （`rule`/`command`/`skill`/`agent`/`hook`/`mcp`）之一。这是先诚实暴露一个
  真实存在的 Hermes 原生表面，但尚未经过 RFC 决定其架构地位：应作为第七类
  原子 Capability 正式收编、还是改走 `tools.hermes` target-private 字段、
  还是维持现状，是一个需要显式决策而非默认接受的公共合同缺口。
- `jue apply` 已统一通过 `defineExtension()` 默认导出的 Adapter 对象调用
  `write()`；写入后的原生 `confirm()` 生命周期仍未接入 apply。
- `capabilities` 的 `integrity` 字段已可提供但未对远程来源强制校验。
- Preset、Extension、Adapter、Artifact 四个概念中，Extension/Adapter 已有
  `ExtensionDefinition`/`Adapter` 公开类型；Preset、Artifact 仍无独立公开
  类型。
- `loadExtensionGuarded` 的"隔离"是进程内 API 守卫（拦截并阻断经由
  require 链直接调用的 fs/子进程/网络/`process.exit`），不是 OS 或 VM 级别的
  沙箱：无法阻止原生插件绕过这些模块、无法限制 CPU/内存耗尽、也无法对同步
  死循环设置超时。真正的隔离边界（独立进程或 VM）仍是待办。
- 四个 Agent 的往返、幂等和未托管字段保留测试。
- Claude Code 能力发现中，Monitor、Theme、Channel、`bin/`、`userConfig` 的
  运行时行为，`claude plugin eval`，marketplace 私有/企业分发路径，以及
  managed/enterprise scope 仍未实测验证（本机无 managed settings、无法安装
  真实 Plugin 走完整交互会话）；JUE-105 的 fixture 已按此边界构造，`themes/`
  与 `workflows/` 样本仅作为文档来源的保留字段样本，未附带运行时验证。
- 后续原生确认（JUE-109）与其他 Agent 迁移必须使用
  `packages/ai-jue-adapter-claude/fixtures/README.md` 记录的经过实测的字段
  形状（`hooks.json` 外层 `hooks` 键、`dependencies` 数组形状、
  `userConfig.title` 必填等），不得复用 JUE-104 报告中未经复核的原始断言。
- Marketplace/聚合索引 Artifact（多 Plugin 打包发布）尚未实现，也不在当前
  Gate 范围内；只有 R5 ai-assets 真的需要把多个 Preset 作为一个可分发单元
  时才实现，取舍原则见 `packages/docs/architecture/adapter-standardization.md`。
