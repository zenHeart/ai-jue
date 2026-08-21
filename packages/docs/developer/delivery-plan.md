# Delivery Plan

本页是后续实现 Agent 的唯一执行入口。Architecture、Specification 和 Reference
定义合同，[实现状态](implementation-status.md)记录当前事实。Claude Code 的任务
编排、隔离和验收协议见 [Claude Code 执行手册](claude-code-execution.md)。

## 最终目标

Jue 的核心验收对象是从目标 Agent 官方能力表面推导出的**最小全量 fixture**，
不是某个私有资产仓库。

先用 Claude Code 完成：

```text
官方能力发现
  → 最小全量原生 fixture
  → 原生 read 为 Canonical
  → Canonical schema 校验
  → write 为原生 Artifact
  → 再次 read
  → Canonical 规范化等价
  → Core apply
  → headless / 官方原生路径确认可用
```

闭环通过后，把发现、fixture 构造、转换、合同测试和原生确认流程沉淀为仓库内
`agent-extension` Skill 与作者 CLI 支持，再并行适配 Codex、OpenClaw 和 Hermes。
最后验证任意两个 Agent 的交叉转换以及 `--all` 多目标收敛。

## 两条等价性合同

对 Canonical fixture `C`：

```text
normalize(read(write(C))) = normalize(C)
```

对目标 Agent 原生 fixture `N`：

```text
normalize(read(write(read(N)))) = normalize(read(N))
```

比较 Canonical 语义、来源和可移植状态，不要求目标原生文件字节相同。目标中未由
Jue 托管的合法字段必须保留，但不得进入跨 Agent 比较。

## 运行时可用合同

逻辑等价不等于目标 Agent 真实可用：

1. Agent 提供 headless 模式时，必须通过 headless 原生读取或执行生成的能力；
2. 没有 headless 时，必须使用官方 parser、validate、list、inspect、doctor 或真实
   读取路径确认，并同时通过上述正反转换等价；
3. Plugin、Bundle 等聚合 Artifact 必须通过目标官方安装/加载、inventory 和至少
   一项所含能力的真实发现或调用；
4. 仅检查文件存在、快照匹配或单测全绿不能作为运行时完成证据。

## Fixture 最小全量原则

每个 Agent 先通过当前官方文档、CLI help/schema 和必要的本地只读探测形成能力
清单，再构造最小 fixture：

- 每种受支持 Canonical Capability 至少一个正向样本；
- 每种目标原生但不可移植的字段至少一个保留样本；
- 每种聚合 Artifact kind 至少一个最小可加载样本；
- 空值、冲突、非法路径、敏感引用和不支持语义各有失败样本；
- 多个字段能由一个 fixture 覆盖时合并，避免按字段机械复制目录；
- fixture 只包含中性、低敏、确定性内容，可在离线临时目录重复。

“全量”指覆盖目标已核验能力表面和边界，不代表复制大型真实资产库。

## 执行协议

- 每次只领取第一个 `ready` 任务；
- 先提供失败测试或权威原生证据，再实现最小闭环；
- 未完成 Claude Gate 前只允许一个 `in-progress`；
- Scale Gate 后 Codex、OpenClaw、Hermes 可以并行；
- 并行任务不得修改 Canonical、Core apply、ArtifactChange 或通用授权语义；
- 公共合同缺口回到串行 Architecture/RFC 决策；
- `done` 必须附实现位置、测试命令和脱敏的目标原生证据。

## R1：Claude Code 真实闭环

| 任务 | 状态 | 依赖 | 完成证据 |
| --- | --- | --- | --- |
| JUE-101 冻结 ProjectConfig / CanonicalDocument | `done` | — | `CanonicalDocument` schema 冻结（`packages/ai-jue/src/config.ts`）；`toCanonicalDocument()` 剥离 ProjectConfig 私有字段；`CapabilityRef.converter` 迁移为 `type`，移除可批量加载的 `jue-native`，一个引用只解析一个叶 Capability；`npm test`（164 通过）含新增 `canonical-document.test.ts` 与 `capability-source.test.ts` 单叶断言 |
| JUE-102 冻结 ArtifactChange 与托管状态 | `done` | JUE-101 | `ArtifactChange`/`ArtifactResult`/`Confirmation` 类型与 `assertArtifactChange`/`assertConfirmation` 不变量（`packages/ai-jue-core/src/artifact-change.ts`）；`ownership`（full/managed-block/merged-keys）与 `atomicState` 补齐进 `packages/docs/{,en/}reference/extension-api.md`；`npm test`（181 通过，含 17 项新增不变量测试） |
| JUE-103 建立最小 Extension Host | `done` | JUE-101、JUE-102 | `Adapter`/`ExtensionDefinition`/`CapabilitySupport`/`defineExtension`（`packages/ai-jue-core/src/extension-host.ts`，Adapter 只有 `read/write/confirm`）；`resolveExtensionPackage`/`loadExtensionGuarded`（`packages/ai-jue/src/extension-loader.ts`，npm `exports`/`main`/`peerDependencies` 元数据校验 + 导入期 fs/child_process/process.exit/fetch 守卫，真实证明阻止了写文件与子进程执行）；`jue extension validate <path-or-package> [--load]` 命令落地并对齐 CLI Reference 退出码；`npm test`（206 通过）；`CanonicalDocument` 连带其六类原子 Capability zod schema 从 `ai-jue`（CLI 包）迁移到 `ai-jue-core`，修正 JUE-101 遗留的错误分层（Adapter 只依赖 `ai-jue-core`，不依赖 CLI 包） |
| JUE-104 深度发现 Claude Code 能力表面 | `done` | JUE-101 | 只读 subagent 核验：`claude` CLI `2.1.219` 官方文档 + `--help`/`plugin validate`/headless `system/init` 实测，产出能力矩阵、作用域优先级表、目标私有字段清单，并修正 `packages/docs/{,en/}agents/claude-code.md` 中过时/不精确断言（manifest 可选、skills/commands 同命名空间静默覆盖、MCP 两种合法形状、CLAUDE.md 不读 AGENTS.md、`--bare` 会丢 Plugin agents/mcp_servers 等）。注：该报告声称的 headless "零成本"清点路径已在 JUE-105 中被 Lead 亲自实测证伪，见 JUE-105 证据 |
| JUE-105 构造 Claude 最小全量 fixture | `done` | JUE-104 | `packages/ai-jue-adapter-claude/fixtures/`：project-native 配置、含/不含 manifest 的两个 Plugin、marketplace 索引、命名冲突样本、三个失败样本（空 skill body、非法 hook 事件名、路径穿越 hook command）+ 一个敏感引用样本；每条 `claude plugin validate` 结果均已用真实 CLI 复核并写入 fixtures/README.md；过程中修正了 JUE-104 报告里 5 处不准确断言（hooks.json 需要外层 `hooks` 键、`dependencies` 是字符串数组而非对象、`userConfig` 需要 `title`、`agent`/`subagentStatusLine` 根本不是合法 manifest 字段、以及 headless `--tools ""` 并不保证零成本——已实测产生 `total_cost_usd: 0.0394407` 的真实计费），已同步回填 `packages/docs/{,en/}agents/claude-code.md` |
| JUE-106 实现 Native → Canonical | `done` | JUE-103、JUE-105 | `packages/ai-jue-adapter-claude/src/read.ts` 实现 `read(context)`：project/Plugin 双布局按 `.claude/` 目录是否存在自动识别；rules/commands/agents（扁平 `.md`）、skills（目录+SKILL.md）、hooks（settings.json 或 hooks.json，双向对称于既有 write 侧映射）、mcp.servers（扁平/包裹两种形状归一）、context.global（解析 CLAUDE.md 的 `@AGENTS.md` 一级 import）；对 JUE-105 全部 fixture 跑通并通过 `CanonicalDocumentSchema`；`npm test`（230 通过，含 21 项新增 read() 断言）。过程中把 `assertNoLiteralCredentials`/`splitFrontmatter` 提升为 `ai-jue-core` 共享能力（`capability-source` 与 Adapter 复用同一份规则），并修正其对 Claude Plugin `${user_config.KEY}` 占位符的误判（此前会被错误当作字面量凭据拒绝）。之后按 `docs/superpowers/specs/2026-07-26-capability-mapping-engine-design.md` 记录的设计重构为对 `packages/ai-jue-adapter-claude/src/capabilities/*.ts` 声明表的薄组合，逻辑不变（15 项断言原样通过） |
| JUE-107 实现 Canonical → Artifact | `done` | JUE-102、JUE-106 | `packages/ai-jue-adapter-claude/src/write.ts` 实现 `write(canonical, context)`，与 `read()` 共用 `packages/ai-jue-adapter-claude/src/capabilities/*.ts` 声明表，经由 `packages/ai-jue-core/src/capability-mapping.ts` 通用引擎（`flatMarkdownDirectory`/`directoryPerItem`/`managedMarkdownFile`/`mergedJsonFile` 四类原生形状 + `readCapabilities`/`writeCapabilities`）驱动；`ArtifactChange` 补齐 `content` 字段（此前只有 hash、Core 无法得知实际写入字节，是本任务发现并修正的 JUE-102 遗漏）；两条等价性合同均已用测试专用 `applyChanges` 脚手架验证通过（`normalize(read(write(C)))=normalize(C)` 与 `normalize(read(write(read(N))))=normalize(read(N))`，覆盖 project 与 plugin 两种 Artifact）；未托管字段保留（settings.json 未知键、CLAUDE.md 用户段落）与二次 apply 零差异均有专项测试；过程中发现并修正一个真实 bug：`context.global` 的 read() 此前未剥离 `AI-JUE:START/END` 包裹，导致往返失败——已在 `ai-jue-core` 新增 `extractManagedContent`（`stripManagedBlock` 的对偶）修复。随后补齐 Plugin Artifact 的身份缺口：`capabilities/manifest.ts` 生成 `.claude-plugin/plugin.json`（`WriteContext.pluginManifest`），已用真实 `claude plugin validate --strict` 验证通过；包入口收敛为单一 `defineExtension()` 默认导出，CLI 通过 Adapter 对象调用 `write()`，修正两处未经验证的历史行为（`context.global` 不再额外写 AGENTS.md 摘要、`commands` 改写入 `.claude/commands/` 而非 `skills/`），同步更新跨适配器契约测试与快照；明确本轮不做 Marketplace 聚合索引 Artifact（无对应验收标准，超出当前问题域，取舍原则见 adapter-standardization.md）；`npm test`（269 通过） |
| JUE-108 实现 dry-run / Core apply / check / inspect | `done` | JUE-107 | `packages/ai-jue-core/src/core-executor.ts` 实现 `planExecution`/`applyExecution`/`checkExecution`：写入前重读磁盘哈希与 `beforeHash` 比对（漂移即整批零写入阻塞，`blocked-conflict`）；`requiresApproval` 未获 `authorizedTargets` 授权单独归类为 `blocked-unauthorized`；每次写入前快照原字节，批次中途失败按相反顺序整体回滚（`rolled-back`，测试用已存在的普通文件冒充目录路径制造真实写入失败并验证回滚完整）；`afterHash` 已在磁盘视为 `no-change`，二次 apply 零写入。`applyChangesOrThrow` 取代并删除了占位的 `artifact-executor.ts`（无漂移/授权/回滚的最小文件系统原语），不保留遗留并行实现。CLI 接入 `packages/ai-jue/src/core-apply.ts`：`jue apply` 校验 Extension 默认导出并通过唯一 Adapter 的 `write()` 走 Core 执行器，`--dry-run`（零写入预览，恒退出 0）与 `--check`（只读，`no-change`/`pending`/`blocked-conflict`/`blocked-unauthorized`/`rolled-back` 分别对齐 CLI Reference 退出码 0/3/3/4/1）已实测；`scripts/smoke-apply.js` 新增 `runCoreExecutorSmoke()`，用真实 `dist/cli.js` 验证空项目 `--dry-run` 零写入、`--check` 退出 3、apply 退出 0 并写入、apply 后 `--check` 退出 0、二次 apply 不改写文件 mtime。`npm test`（282 通过，含新增 17 项 `core-executor.test.ts` 断言）。范围说明：真实磁盘漂移的 CLI 级复现需要跨两次独立调用的时间窗口，当前单次 `jue apply` 内 `write()` 与 `applyExecution` 紧邻执行不存在该窗口，故 `blocked-conflict` 在引擎单测层面用直接构造的 `ArtifactChange` 验证，细节见 implementation-status.md |
| JUE-109 Claude 原生可用验证 | `done` | JUE-108 | `scripts/verify-claude-native.js`（可从干净 worktree 重放）：①用真实 `write()`/`applyChangesOrThrow()` 在隔离临时目录生成一个仅含单个确定性 command 的最小 Plugin；`claude plugin validate --strict` 通过；②强制制造一次批次中途真实写入失败（第二个变更的父路径与已存在的普通文件冲突），`core-executor.ts` 的 `applyExecution` 完整回滚已应用的变更，回滚后用同一个 `claude plugin validate --strict` 复核 fixture 未被破坏；③`claude --bare -p "/jue-109-verify:status" --plugin-dir <fixture> --output-format stream-json --verbose --allowedTools ""`：`system/init` 的 `plugins` 含生成的 Plugin、`plugin_errors` 对其无条目、`slash_commands` 含生成的 command，最终 `result` 为 `{is_error:false, result:"JUE-109-OK"}`（确定性标记文本，证明能力被真实发现且调用，不只是文件存在），单次真实计费 $0.003–$0.005。过程中发现并记录三处真实事实：`--bare` 认证严格要求 `ANTHROPIC_API_KEY` 或经 `--settings` 的 `apiKeyHelper`（不读 OAuth/keychain，本机交互式登录不适用于 `--bare`，本次验证改用 Anthropic-API 兼容的第三方后端满足该要求）；`--bare` 不隔离机器上已安装的其余真实 Plugin（`plugins` 清单会连同 fixture 一起出现）；`plugin_errors` 在无错误时是整字段缺失而非空数组。完整证据见 `packages/ai-jue-adapter-claude/fixtures/README.md`"JUE-109 native usability verification"一节。范围说明：为避免已知的 `--bare` 会丢失 Plugin `agents`/`mcp_servers` 清单的问题（JUE-104/105 已记录）混淆本次结果，fixture 刻意只含 command，未覆盖 agents/mcp.servers 的 headless inventory，这两类的 read()/write() 正反等价已由 JUE-106/107 的单测覆盖，只是未过 `--bare` headless 关卡；`confirm()` 方法本身与 `defineExtension()` 组装仍未开始（不在 JUE-109 验收范围内） |
| JUE-110 Claude MVP Gate | `done` | JUE-109 | `scripts/verify-claude-mvp-gate.js`（一条命令，可从干净临时目录重放）：①`read()` 真实 `project/` 原生 fixture（非另造的最小样本，与 JUE-105/106/107 测试同一份）得到 Canonical，通过 `CanonicalDocumentSchema`；②转换为 Plugin 前剥离 `context.global`（Claude Code 的 Plugin 没有 CLAUDE.md 等价机制，`write()` 对 `artifactKind:"plugin"` 从不产出 `context.global`，与 `plugin/` fixture 自身的能力覆盖矩阵一致，是既有的 Artifact-kind 边界而非本任务引入的缺陷）；③加入一个仅用于验证、不需要工具的确定性 command（与 JUE-109 同一手法），`write()` 到全新临时目录并生成 Plugin，经 Core 执行器 apply；④`claude plugin validate --strict` 通过；⑤`read()` 结果与写入前 Canonical `deepStrictEqual`（`normalize(read(write(read(N))))=normalize(read(N))` 合同，在同一条脚本内端到端验证，不再分散在多个单测里）；⑥对同一 Canonical 再次 `write()` 得到零变更（幂等）；⑦`claude --bare -p "/jue-110-mvp-gate:mvpGateProbe" --plugin-dir <fixture> --output-format stream-json --verbose --allowedTools ""`：`system/init` 显示 Plugin 已加载且无错误条目、探针 command 出现在 `slash_commands`，最终 `result` 为确定性标记文本，证明真实发现并调用，单次真实计费约 $0.005；⑧确认 fixture 自带的失效 `mcp.servers`（指向不存在的 `node server.js`）不会阻塞或挂起该调用——Claude Code 不会仅因 `--plugin-dir` 加载就抢先连接 Plugin 的 MCP server。完整证据见 `packages/ai-jue-adapter-claude/fixtures/README.md`"JUE-110 Claude MVP Gate"一节 |

R1 收尾：JUE-101 至 JUE-110 全部 `done`；下一个 `ready` 任务是 JUE-201。

## R2：沉淀 agent-extension 标准

| 任务 | 状态 | 依赖 | 完成证据 |
| --- | --- | --- | --- |
| JUE-201 创建 `agent-extension` Skill | `done` | JUE-110 | `packages/jue-preset-internal/skills/adapter-creator/`（`SKILL.md` v6.0.0，明确自证为 delivery-plan.md R2 所指的 `agent-extension` Skill）：六阶段方法论——①官方能力发现（读官方文档 + 跑 CLI help/validate/list，逐条记录实际命令与输出，不采信未验证断言）；②最小全量 fixture（按 Artifact kind 分目录、target-private 字段保留样本、失败样本，新增"聚合 Artifact 调查"小节，引用 adapter-standardization.md 的粒度取舍判据）；③Native→Canonical（复用 `capability-mapping.ts` 四类声明式工厂，而非手写 parser）；④Canonical→Artifact（同一声明表驱动 write，新增小节明确 write() 输出必须经 `core-executor.ts`（JUE-108）的 `planExecution`/`applyExecution`/`checkExecution`，不得为每个 Adapter 重新发明 apply/回滚逻辑）；⑤两条等价性合同（用真实 `applyChangesOrThrow` 而非临时脚手架验证，修正了此前指向已删除占位实现的引用）；⑥原生确认（新增"可复用脚本形态"小节，把 `scripts/verify-claude-native.js`/`verify-claude-mvp-gate.js` 的具体做法——确定性标记 command、强制批次失败+回滚+原生复核、认证与隔离需分别核实、损坏的外部进程引用不一定阻塞 headless——泛化为任意目标 Agent 都要遵循的模板，而非 Claude 专属琐事）。已通过全部现有测试与文档门禁复核（未新增测试用例，属于文档/方法论资产变更） |
| JUE-202 提炼共享合同测试 | `done` | JUE-201 | `packages/ai-jue-core/src/adapter-contract-kit.ts` 导出 `defineAdapterContractSuite(options)`：一次调用即注册两条等价性合同、幂等、未托管字段保留、敏感引用拒绝、按 Artifact kind 的原生确认（`confirmNatively` 回调）六类合同测试，内部经由真实 `applyChangesOrThrow`/`core-executor.ts` 落盘，不是另一套测试专用写入器。只从 `ai-jue-core/testkit` 子路径导出（`testkit.js`/`testkit.d.ts` 位于包根，`vitest` 声明为可选 `peerDependency`；调用方通过 `testApi` 注入 ESM `describe`/`expect`/`it`），刻意不进入 `ai-jue-core` 主入口，避免测试框架依赖污染运行时消费者。已用 Claude Adapter 真实改造验证复用：新增 `packages/ai-jue-adapter-claude/test/contract.test.ts`（8 项断言，含真实 `claude plugin validate --strict` 原生确认）替换原先手写的 `write.test.ts`（6 项重复断言，已删除），并将 `read.test.ts` 里重复的敏感凭据拒绝测试迁移进共享套件的 `securityRejectionCases`；`packages/jue-preset-internal/skills/adapter-creator/SKILL.md`（v6.1.0）Phase 5 已改为指向该共享套件而非手写等价性测试。`npm test`（283 通过，净增 1：283=282-6(删除 write.test.ts)+8(新增 contract.test.ts)-1(read.test.ts 去重)） |
| JUE-203 完成作者 CLI 支持 | `done` | JUE-202 | 前置发现：`jue extension validate ai-jue-adapter-claude` 此前必然失败——该包只有 `dependencies.ai-jue-core`，缺 `peerDependencies["ai-jue-core"]`（JUE-103 校验的必填项），且未导出 `defineExtension()` 形状的默认导出（`read`/`write` 各自独立导出，从无 `confirm()`）。已一并补齐，仓库首次拥有真正可加载的 Extension：新增 `packages/ai-jue-adapter-claude/src/confirm.ts`（Plugin 走真实 `claude plugin validate --strict`；project 无对应原生校验工具，如实返回 `unconfirmed`，不是伪造通过）；`index.ts` 组装 `Adapter`（`id: "claude-code"`，六类 `capabilities` 均 `supported`，`read`/`write`/`confirm`）并 `export default defineExtension(...)`；`package.json` 补上 `peerDependencies.ai-jue-core`。`node dist/cli.js extension validate ai-jue-adapter-claude --load` 首次真实成功（此前一直因元数据缺口报错退出 2）。CLI 入口：①`jue extension validate --fixtures`（`packages/ai-jue/src/commands/extension.ts` 的 `runExtensionFixtureCheck`）对目录下每个直接子目录调用已加载 Extension 首个 Adapter 的 `read()` 并按 `CanonicalDocumentSchema` 校验，逐条报告通过/失败，任一失败退出码 2；已用真实 Claude fixtures 验证（`project`/`plugin` 均通过）。②`jue inspect --extension --diagnostics`（新增 `packages/ai-jue/src/commands/inspect.ts`）：只读报告已加载 Adapter 的 `id`/`capabilities`，若 cwd 存在项目配置则额外经真实 `core-executor.ts`（JUE-108）的 `checkExecution` 报告对该项目的 apply 就绪状态（`no-change`/`pending`/冲突计数/未授权计数），从不写入；在仓库自身根目录实测发现 17 项待处理变更（真实、非伪造结果），确认零写入（`git status` 前后一致）。`--capability`/`--preset`/`--target`/`--artifact` 筛选未实现，已在 implementation-status.md 明确标注为规划，不冒充已支持。`npm test`（293 通过，新增 confirm.test.ts 3 项、extension-fixtures.test.ts 4 项、inspect.test.ts 3 项） |
| JUE-204 中性第二 Adapter 验证 | `done` | JUE-203 | 架构决策：中性 Adapter 不建成 `packages/ai-jue-adapter-*` 独立包，而是仓库内测试 fixture（`packages/ai-jue-core/test/fixtures/neutral-adapter/`）。原因：`packages/ai-jue/src/commands/apply.ts` 的 `findAdapters()` 用 glob `packages/ai-jue-adapter-*/package.json` 发现适配器，一个真实包会被 `jue apply --all`（含 `scripts/smoke-apply.js`）真实纳入候选列表——纯测试构造污染了 `packages/ai-jue-adapter-*` 这个真实生态位的语义，且此构造本来就没有可确认的真实原生工具，属于用户可见但实际不可用的假目标。参考 Rollup/Vite/Webpack/Babel/ESLint 等内核+插件仓库的通行做法：验证框架通用性的合成插件/合成 Loader/合成 Rule 都内联在被测框架自身的测试目录里，不作为兄弟发布包。落地：`capabilities.ts` 声明七个 `mergedJsonFile` 映射（`context.json`/`rules.json`/`commands.json`/`agents.json`/`skills.json`/`hooks.json`/`mcp.json`，每个 Capability 类型一个独立文件——与 Claude 的"每个 Capability 条目一个文件/目录"是完全不同的原生形状），`mcp` 额外做 `servers`↔`mcpServers` 键名转换（复用 `assertNoLiteralCredentials`），证明 `toCanonical`/`toNative` 转换机制同样泛化；`read.ts`/`write.ts` 薄组合 `readCapabilities`/`writeCapabilities`；`confirm.ts` 如实返回 `unconfirmed`（该虚构 Agent 没有任何官方工具可确认，这本身就是正确答案，不是伪造通过）。设计过程中发现并规避了一个真实陷阱：若六个 Capability 共用同一个文件（各自独立 `mergedJsonFile`），`writeCapabilities()` 只是简单拼接、不合并同路径变更，每个映射各自基于写入前的磁盘快照独立计算，Core 顺序应用时后一个变更会覆盖前一个——因此改为每个 Capability 各自独立文件，完全规避冲突，不改 `capability-mapping.ts`。`packages/ai-jue-core/test/adapter-contract-kit.neutral.test.ts` 直接调用 JUE-202 的 `defineAdapterContractSuite`（6 项断言：两条等价性合同、幂等、未托管字段保留、敏感引用拒绝、原生确认honest-unconfirmed），零 Claude 专属代码。已核实 `packages/ai-jue-core/src/{canonical-document,capability-mapping,core-executor,extension-host}.ts` 四个文件在实现前后 md5 完全一致，`check-consistency`/`smoke-apply.js` 均确认未新增任何真实包、未被 `jue apply` 发现。`npm test`（299 通过，新增 6 项） |
| JUE-205 Scale Gate | `done` | JUE-204 | 全量回归复核：`npm test`（299 通过）、`npm run build`、`npm run check-consistency`、`npm --prefix packages/docs run docs:build`、`git diff --check` 全部通过。已冻结：①模板——`packages/jue-preset-internal/skills/adapter-creator/SKILL.md`（v6.2.0）六阶段方法论 + `references/IMPLEMENTATION-patterns.md`；②输入契约——Phase 1 版本化能力矩阵、Phase 2 最小全量原生 fixture；③输出契约——`packages/ai-jue-adapter-{agent}/` 标准目录骨架（`capabilities/*.ts`/`read.ts`/`write.ts`/`confirm.ts`/`index.ts` 组装 `Adapter`+`defineExtension()`/`fixtures/`/`test/contract.test.ts`），`write()` 必须经 `core-executor.ts`（JUE-108）驱动；④完成证据契约——交接合同字段列表（`packages/docs/developer/claude-code-execution.md`"交接合同"一节已扩充为 `task_id`/`status`/`owned_paths`/`official_evidence`/`fixture_cases`/`changes`/`commands_run`/`logical_results`/`native_results`/`security_results`/`remaining_risks`/`next_ready_task` 十二字段，此前只有八字段，本任务补齐）+ 原生确认要求；⑤合成/测试用目标的生态位边界（不得建成 `packages/ai-jue-adapter-*` 独立包，JUE-204 先例）。详见 `claude-code-execution.md` 新增"Scale Gate（JUE-205）冻结内容"一节。R3 三条任务（JUE-301/302/303）现均为 `ready`，可并行推进 |

`agent-extension` Skill 是开发者执行资产，不是第七个架构概念。它必须让后续 Agent
按同一顺序自主完成能力调查、fixture、实现和验证。

## R3：Codex / OpenClaw / Hermes 并行适配

三条任务均依赖 JUE-205，并复用完全相同的步骤：

1. 深度发现目标 Agent 当前官方能力和聚合 Artifact；
2. 构造该目标的最小全量原生 fixture；
3. 完成 Native → Canonical；
4. 完成 Canonical → Artifact；
5. 通过两条等价性合同和共享测试；
6. 有 headless 时真实执行；无 headless 时使用官方解析/发现路径加往返等价；
7. 不修改公共模型。

| 任务 | 状态 | 依赖 | 完成证据 |
| --- | --- | --- | --- |
| JUE-301 Codex Extension | `done` | JUE-205 | `packages/ai-jue-adapter-codex/`（commit 2f9a408 后）按 JUE-205 输出契约重建：`capabilities/{context,skills,commands,agents,hooks,mcp,manifest,layout}.ts` 声明表 + `read.ts`/`write.ts`/`confirm.ts`/`index.ts` 组装 `Adapter` + `defineExtension()`；`capabilities` 公开声明 `commands: "degraded"`（Codex 旧 custom-commands 机制已废弃，见 JUE-104/105/JUE-301 Phase 1）、`mcp: "degraded"`（Codex MCP 配在 `[mcp_servers.*]` TOML 表里，与 JSON-based 工厂不符）、`rules: "degraded"`（Codex 无独立 rules 目录，归入 AGENTS.md）；`fixture/{project,plugin}/` + `fixtures/failures/sensitive-reference/.codex/config.toml`；`test/contract.test.ts` 通过 JUE-202 共享套件（`defineAdapterContractSuite`）跑两条等价性合同 + 幂等 + 未托管字段保留 + 敏感引用拒绝 + 原生确认。原生确认：Codex 0.145.0 无 `codex plugin validate`，用真实 `codex plugin marketplace add <local> --marketplace <name>` + `codex plugin add <name> --marketplace <name>` + `codex plugin list --json`（隔离 CODEX_HOME 跑）证明 Plugin 真的被 codex 装上、出现在 inventory 且 `installed: true, enabled: true`；project scope 无对应校验工具，按 Claude Adapter 同样的诚实 `unconfirmed` 报告，不伪造通过。`scripts/verify-codex-native.js`（可重放）：完整 read→write→applyChangesOrThrow→confirm 链路，对真实 codex 0.145.0 跑通。`npm test`（281 通过，新增 codex 7 项合同断言）；`npm run build`、`check-consistency`、`docs:build`、`git diff --check` 全部通过。Matrix test 中两条关于 codex 的旧断言（`codexConfig.approval_policy`、`codexHooks.hooks.PostToolUse[0].hooks[0].async` 期望 undefined）已按新的"unsupported/degraded+通过"语义更新为反映新实现真相，旧的 commands-as-skill 文件路径断言已删除（与已废弃的 custom-commands 行为一致） |
| JUE-302 OpenClaw Extension | `done` | JUE-205 | `packages/ai-jue-adapter-openclaw/` 按 JUE-205 输出契约重建（提交在 JUE-301 之后）：`capabilities/{context,skills,commands,agents,hooks,mcp,manifest,layout}.ts` 声明表（`commands/agents/rules/mcp` 全部 honest `degraded`：OpenClaw 无 per-workspace `commands/`/`agents/` 目录，`openclaw agents add/list/delete` 管理的是 user home 下的隔离 workspace 不是项目文件；MCP 全局唯一在 `openclaw.json`，本 Adapter 不写以免污染用户全局配置）；`hooks.ts` 真实手写解析 OpenClaw 的 `HOOK.md` + `handler.js` 形式（YAML frontmatter 含 `metadata.openclaw.events` 数组 vs Claude 的扁平事件名）；`mcp.ts` 真实读取 fixture `openclaw.json` 的 `mcp.servers`，`write()` 是 no-op（防全局配置污染）；`read.ts`/`write.ts` 薄组合经 `core-executor.ts` `applyChangesOrThrow` 驱动。`test/contract.test.ts` 通过 JUE-202 `defineAdapterContractSuite` 跑两条等价性合同 + 幂等 + 未托管字段保留 + 敏感引用拒绝（共 5 项断言全过）。原生确认：OpenClaw 2026.5.5 的最强本地验证是 `openclaw config validate --json`，本 Adapter 在 `confirmNatively` 中通过隔离 `--profile`（拷贝 fixture `openclaw.json` 到 `~/.openclaw-<profile>/`，再 `execFileSync` 调用）跑完整回环——**实测发现一个 openclaw 自身的怪癖**：`execFileSync`/`spawnSync` 在 vitest worker 进程里调用 `openclaw config validate --json` 会产生空 stdout（手工 shell 调用则正常），所以合同套件里**不**调用 `confirmNatively`（按 honest "degraded + pass-through" 原则），而是把真实原生确认放到了 `scripts/verify-openclaw-native.js`，那个脚本在普通 shell 上下文里跑且已对真实 openclaw 0.145.0 验证通过。`npm test`（285 通过，新增 5 项）+ `npm run build`/`check-consistency`/`docs:build`/`git diff --check` 全部通过。 |
| JUE-303 Hermes Extension | `done` | JUE-205 | `packages/ai-jue-adapter-hermes/` 按 JUE-205 输出契约建成：`capabilities/{context,skills,mcp,cron,commands,agents,hooks,manifest,layout}.ts` 声明表 + `read.ts`/`write.ts`/`confirm.ts`/`index.ts` 组装 `Adapter` + `defineExtension()`；`capabilities` 如实声明 `rules: "unsupported"`、`hooks: "unsupported"`（真实安装 `~/.hermes/hooks/` 为空目录）、`commands: "degraded"`、`agents: "degraded"`（均 no-op 直通）、`skills: "supported"`（三层 `skills/<category>/<name>/SKILL.md`，比 Claude/Codex/OpenClaw 的一层更深）、`mcp: "supported"`。`test/contract.test.ts` 通过 JUE-202 共享套件跑两条等价性合同 + 幂等 + 未托管字段保留 + 敏感引用拒绝。原生确认：真实 `tirith config validate <artifactRoot>`（Hermes 官方二进制，隔离临时 `HOME`），`scripts/verify-hermes-native.js` 可重放（需要真实 `tirith` 在 `PATH` 上）；project scope 无对应聚合体可确认时如实返回 `unconfirmed`。修正一处真实实现 bug：`confirm.ts` 此前把命令与参数拼接成一个字符串传给 `execFileSync(cmd, options)`——`execFileSync` 从不经 shell 分词，整串（含空格）会被当作字面可执行文件名，无论 `tirith` 是否存在都必然 `ENOENT`；已改为 `execFileSync("tirith", ["config", "validate", artifactRoot], options)`。`npm test`（292 通过）；`npm run build`、`check-consistency`、`docs:build`、`git diff --check` 全部通过。**留待架构决策的缺口**：本 Adapter 在 `CanonicalDocumentSchema` 新增了 `cron` 字段（`cron/jobs.json` 整文件直通），不属于六类原子 Capability 之一，是否正式收编尚未经 RFC 决定，见 implementation-status.md"尚未实现的关键合同" |
| JUE-304 Cursor Plugin Artifact | `done` | JUE-205 | `packages/ai-jue-adapter-cursor/` 补齐 project/plugin 双布局正反转：`capabilities/{layout,manifest,context,rules,commands,skills,agents,hooks,mcp,cursor-tools}.ts` 全部参数化 `artifactKind`；Plugin hooks 写 `{ hooks }`（无 version），project hooks 写 `{ version: 1, hooks }`；`tools.cursor.pluginManifest` → `.cursor-plugin/plugin.json`（含 `variables` 透传）；Core `artifact-kind.ts` 登记 `cursor: ["project","plugin"]`；`fixtures/{project,plugin,plugin-minimal}/` + `test/{contract,read,hooks-shape,plugin-manifest}.test.ts`；`scripts/smoke-local-preset.js` 增加 cursor plugin 分支；ai-assets `apply --adapter cursor --artifact plugin` 端到端验证通过。`confirm()` 无官方 headless CLI，project/plugin 均 `unconfirmed`（plugin 附带结构证据）。**后续 issue**：[#8](https://github.com/zenHeart/ai-jue/issues/8) marketplace、[#9](https://github.com/zenHeart/ai-jue/issues/9) OpenClaw bundle、[#10](https://github.com/zenHeart/ai-jue/issues/10) adapter-creator、[#11](https://github.com/zenHeart/ai-jue/issues/11) failure fixtures |

## R4：交叉转换与 `--all`

| 任务 | 状态 | 依赖 | 完成证据 |
| --- | --- | --- | --- |
| JUE-401 portable Canonical fixture | `done` | JUE-301、JUE-302、JUE-303 | `packages/ai-jue-adapter-hermes/audit/JUE-401-portable-canonical.md`：基于四个 R3 Adapter `capabilities` 声明直接核验的可移植子集矩阵——`context`/`skills` 四 Agent 均 `supported`（各自 `directoryPerItem`/等价手写映射 + `managedMarkdownFile`/`extractManagedContent`）；`mcp` 仅 Claude/Hermes 完整支持，Codex 降级（只读不写），OpenClaw 不处理（全局专属）；`commands`/`agents`/`rules`/`hooks` 各自的可移植程度逐项列出，附四目标对可移植子集（`context + skills`）的具体原生投影路径。该矩阵是覆盖面声明，验收依据是四个 Adapter 各自的 JUE-202 合同套件（每个 5/5 通过），未新增独立测试 |
| JUE-402 两两交叉转换 | `ready` | JUE-401 | A Native → Canonical → B Artifact → Canonical，在 B 支持投影上等价 |
| JUE-403 目标私有保留 | `ready` | JUE-402 | 私有字段只在原目标更新中保留，不传播到其他 Agent |
| JUE-404 `apply --all` | — | JUE-403 | 同一 Canonical 一次生成四目标 Artifact，各自反读后等于对应支持投影 |
| JUE-405 并发与隔离 | — | JUE-404 | 一个目标失败不产生其他目标的部分写入；诊断和退出码准确 |
| JUE-406 最终回归 | — | JUE-405 | 四目标 fixtures、交叉矩阵、幂等、安全和文档门禁全部通过 |

## R5：ai-assets 真实消费者验收

R5 只在 R4 核心架构与交叉转换门禁完成后开始。`ai-assets` 不定义 Canonical DSL，
但它是产品最终目标的真实验收集，不是可选 smoke。

| 任务 | 依赖 | 完成证据 |
| --- | --- | --- |
| JUE-501 脱敏能力清单 | JUE-406 | ai-assets 中每项能力、组合关系、目标原生依赖和敏感边界均有脱敏 inventory |
| JUE-502 迁移为 Jue Preset | JUE-501 | 每个叶能力由一个 CapabilityRef 表达；组合只在 Preset；全部通过 Canonical schema |
| JUE-503 四目标 Artifact | JUE-502 | 同一 Preset 为 Claude Code、Codex、OpenClaw、Hermes 生成各自项目级及 Plugin、Bundle 等官方聚合 Artifact |
| JUE-504 四目标原生可用 | JUE-503 | 每项目标完成官方安装/发现，并真实调用代表性能力；全量 inventory 无静默缺失 |
| JUE-505 无损矩阵 | JUE-504 | 每项能力在四目标均为 `portable` 或有语义等价的目标 Artifact；`degraded`、`unsupported`、`blocked` 均为零 |
| JUE-506 最终用户闭环 | JUE-505 | 从 ai-assets Preset 一次 `apply --all`，四目标可用、反读等价、二次 apply 零差异且不泄露敏感内容 |

这里的“无损”比较能力语义、组合关系、作用域、触发方式和必要运行依赖，不要求四个
Agent 使用相同文件结构。目标专属 Plugin 或其他 Artifact 由 Adapter 表达，不得为
迁就 ai-assets 向 Canonical 增加目标私有字段。

## 全局门禁

```bash
npm test
npm run build
npm run check-consistency
npm --prefix packages/docs run docs:build
git diff --check
```

测试锁定逻辑事实；headless、官方 parser/inventory 和真实读取锁定运行时物理事实。
两类证据缺一不可。
