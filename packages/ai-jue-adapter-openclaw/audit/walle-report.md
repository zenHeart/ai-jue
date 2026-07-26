# Walle JUE-302 audit report (2026-07-26)

# Source: Lark  chat history
# This is the verbatim Walle (Walle) bot response to the deep-audit prompt I sent.

[2026-07-26 21:45] app: 0/17 字段能在 JUE-302 实现里被验证 —— **包不存在**。但真实 OpenClaw 配置 17/17 schema 合法，数据量比假设大（agents 2 个 / mcp 5 个 server / plugins 8 声明 / skills 40 条 / channels 2 个）。

**(b) "漏字段"风险**

• `mcp` 真实是 5 个 server 不是空；若按"读不到→degraded"逻辑会误判。
• `plugins` 真实 8 个声明 3 个有 catalog（anthropic 7 模型 + minimax 9 模型 + openrouter 4 模型），完全跳过等于断模型链。
• `context` / `hooks` 在真实 schema 里**不是顶层字段**，canonical 期望与 schema 不一致，derive 才能用。
• 密钥真实存在 8+ 处；任何读取路径默认必须脱敏。

**(c) 原生命令实际跑通清单**
`openclaw config validate --json`（含真实+脱敏两版）✅ 退出码 0；`openclaw config file` ✅；版本/help ✅。
**未跑通**：`node dist/read.js` 和所有 JUE-302 capability 单元测试 —— **目标包不存在**。

**(d) 投产判断**
**❌ 不能投产**。根本原因不是"有 bug"，是"这个东西还没出生"。建议按 4 步路线图先建包再实现；直接 `subprocess` `openclaw config validate` 复用官方校验，避免重复造轮子。

报告全文落地：`D:\devuser\jue-302-real-audit\report.md`（13.7 KB，已三次扫密钥无残留）。原 `openclaw.json` 已 sha256 校验还原，未被修改。

[2026-07-26 21:45] app: | openclaw config validate --json（用脱敏后 openclaw.json） | 0   | 同上；脱敏不影响 schema                                      | ✅ 验证脱敏无损                                                   |
| openclaw config validate --json --file <path>       | 1   | --file 选项不存在                                         | CLI 不支持指定文件路径，需通过 swap 真实文件实现（已用 backup→swap→restore 流程完成） |
```
⚠️ 备份→swap→restore 流程有原子性风险（本次未失败但下次需用 try/finally；已用 try/finally 包住并 sha256 校验还原）。

**未跑通**（原因：JUE-302 包不存在）：

• `node packages/ai-jue-adapter-openclaw/dist/read.js` —— N/A
• 任何 JUE-302 capability 单元测试 —— N/A

───

D. 投产判断

结论：**❌ 不能投产**

理由（按重要性排序）

1. **适配器根本不存在。** 这不是"有 bug 待修"，是"还没有这个东西"。所有关于 capability 是否覆盖、是否 degraded 的判断**没有任何代码可对照**。
2. **用户原描述的内部结构（`capabilities/{context,skills,commands,agents,hooks,mcp}.ts`）与现存 monorepo 模式不一致。** 现存 `ai-jue-adapter-claude` 是单文件 `src/index.ts` + if 块依次处理 context/prompts/rules/skills/commands/hooks/mcp，没有按 capability 拆分文件。这意味着即使现在动手实现 JUE-302，**要么遵循假设的新模式（与现有 4 个 adapter 不一致，未来维护成本高），要么走现有模式（用户提问中的"capabilities 声明"语义不适用）**。
3. **canonical 假设与真实 schema 有结构差异。** 顶层没有 `context`，顶层没有 `hooks`（嵌在 agent 里）。若 JUE-302 按"canonical 必有这 5 字段"实现，要么 false-positive degraded，要么必须做字段 derive，增加复杂度。
4. **真实数据量比想象大。** 17 字段里 `agents` (3.5KB) / `mcp` (1.2KB) / `skills` (1.2KB) / `channels` (0.8KB) / `plugins` (0.4KB) 都是非平凡负载；`mcp.servers` 有 5 个 server，`plugins.entries` 8 个插件声明（3 个有 catalog），`skills.entries` 40 条。**JUE-302 需要覆盖的真实数据远大于假设的"5 字段占位"**。
5. **密钥路径真实存在。** `env.OPENROUTER_API_KEY`、`mcp.servers.{minimax,minimax-coding-plan}.env.MINIMAX_API_KEY`、`gateway.auth.token`、`commands.ownerDisplaySecret`、`channels.feishu.appSecret` 等都是真实凭证。**任何"读 mcp/env"代码路径若不主动脱敏，都会把密钥直接 dump 到下游**。本次审计做了两层 redaction 才扫干净 (`*.key|secret|token|password|auth|apiKey|api_key|api`)。
6. **OpenClaw 端配置校验已可独立使用。** `openclaw config validate --json` 是 OpenClaw 官方原生命令，**直接满足需求 #4 的"配置合法校验"**。JUE-302 想要做"另一套校验"反而价值不大。

建议下一步

如果你确实需要 ai-jue 这个 monorepo 适配 OpenClaw，我建议：

1. **先在 monorepo 里新增 `packages/ai-jue-adapter-openclaw/`**，复制 `ai-jue-adapter-claude` 的目录骨架作为模板（package.json + src/index.ts + test/index.test.ts），不要发明新的 `capabilities/*.ts` 模式。
2. **直接 `subprocess` 调用 `openclaw config validate --json` 拿到校验结果**，而不是自己实现 JSON schema 解析（避免重复造轮子且和官方语义脱节）。
3. **字段映射**：按 monorepo 里已有的 `config` 字段语义，把 17 顶层映射到 `.openclaw/` 目录结构：
  • `agents.list[].system` → `AGENTS.md`
  • `agents.list[].rules` → `.openclaw/rules/*.md`
  • `skills.entries` → `.openclaw/skills/*/SKILL.md`
  • `mcp.servers` → `.openclaw/mcp.json`
  • `plugins.entries` → `.openclaw/plugins/<name>.json`（catalog 拷贝）
  • `commands` → `.openclaw/commands.json`
  • `channels.{feishu,wecom}` → `.openclaw/channels.json`
  • `models` → 解析 `$include` 引用后写 `.openclaw/models.json5`
4. **脱敏是默认行为**：在 read.ts 里把所有 `*key*` / `*secret*` / `*token*` / `*password*` / `*auth*` 字段值替换成 `<REDACTED>` 再写产物。

───

附录：审计产物清单

```
D:\devuser\jue-302-real-audit\
├── openclaw.redacted.json          36 KB，脱敏版（10 个字段被替换为 <REDACTED>）
├── openclaw.real.bak.json          14 KB，原文件备份
├── validate-redacted.json          openclaw config validate --json 输出
├── validate-redacted.err           （空）
├── config-help.txt                 openclaw config --help 输出
├── validate-help.txt               openclaw config validate --help 输出
├── cfg-file.txt                    openclaw config file 输出
└── report.md                       本报告
```
**脱敏范围（10 处）**：

• `env.OPENROUTER_API_KEY`
• `commands.ownerDisplaySecret`
• `gateway.auth.token`
• `mcp.servers.minimax.env.MINIMAX_API_KEY`
• `mcp.servers.minimax-coding-plan.env.MINIMAX_API_KEY`
• `channels.feishu.appSecret`
• `channels.feishu.accounts.tars.appSecret`
• `channels.wecom.secret`
• （其余 2 处为深度嵌套的子项，已一并脱敏；详见 redaction v2 扫描日志）

**无 sk-*/长 hex/长 base64 残留**（已用正则 `sk-(or|cp|ant)-[A-Za-z0-9_-]{20,}` 和 `^[0-9a-f]{32,}$` 与 `^[A-Za-z0-9+/=]{24,}$` 三重扫描确认）。

───

🎯 (a)(b)(c)(d) 简要总结

**(a) 17 字段覆盖矩阵**

[2026-07-26 21:45] app: `plugins.entries` 实有 **8 个插件声明**，但只有 **3 个有 catalog 文件**：

```
| 插件                    | 在 entries | 有 catalog.json       | 模型数                                                         |
| --------------------- | --------- | -------------------- | ----------------------------------------------------------- |
| acpx                  | ✅         | ❌                    | 0                                                           |
| stepfun               | ✅         | ❌（且 validate 报"未安装"） | 0                                                           |
| anthropic             | ✅         | ✅                    | 7（claude-fable-5/haiku-4-5/opus-4-6/4-7/4-8/sonnet-4-6/...） |
| qwen                  | ✅         | ❌（validate 报"未安装"）   | 0                                                           |
| openrouter            | ✅         | ✅                    | 4                                                           |
| minimax               | ✅         | ✅（含 4 个 provider）    | 9                                                           |
| wecom-openclaw-plugin | ✅         | ❌                    | 0                                                           |
| openclaw-lark         | ✅         | ❌                    | 0                                                           |
```
若 JUE-302 完全不处理 plugins，那连**当前进程已装载的 anthropic + minimax + openrouter 三家模型**都拿不到，**业务链路直接断**。

B3. "context / agents / hooks / mcp / skills 字段至少存在且形状合理"

**核实**（基于真实配置 vs canonical 假设）：

```
| Canonical 字段 | 真实 openclaw.json 对应来源                            | 形状                                                  |
| ------------ | ------------------------------------------------ | --------------------------------------------------- |
| context      | 顶层不存在                                            | 应由 agents[].system 或某处派生；若 JUE-302 期望顶层 context，找不到 |
| agents       | ✅ agents.list[2] + agents.defaults               | 合理                                                  |
| hooks        | 顶层不存在！hooks 嵌在 agents[].hooks 与可能 commands.hooks | canonical 期望顶层 hooks 会找不到                           |
| mcp          | ✅ mcp.servers（对象 map，5 个 server）                 | 合理                                                  |
| skills       | ✅ skills.entries（对象 map，40 个 skill）              | 合理                                                  |
```
⚠️ `context` 与 `hooks` 的 canonical 期望**与真实 schema 不一致**。JUE-302 若按假设实现，要么读出 `undefined`，要么必须自行从嵌套对象里 derive。

───

C. 原生命令实际跑通清单

```
| 命令                                                  | 退出码 | 结果                                                   | 用途                                                         |
| --------------------------------------------------- | --- | ---------------------------------------------------- | ---------------------------------------------------------- |
| openclaw --version                                  | 0   | OpenClaw 2026.6.11 (e085fa1)                         | 版本确认                                                       |
| openclaw --help                                     | 0   | 显示顶层 usage                                           | -                                                          |
| openclaw config --help                              | 0   | 列出 7 个子命令 (file/get/patch/schema/set/unset/validate) | -                                                          |
| openclaw config validate --help                     | 0   | 列出 --json 选项                                         | -                                                          |
| openclaw config file                                | 0   | 输出 $OPENCLAW_HOME\.openclaw\openclaw.json            | 定位当前实例                                                     |
| openclaw config validate --json（用真实 openclaw.json）  | 0   | {"valid":true, "warnings":[stepfun 未安装, qwen 未安装]}   | ✅ schema 校验通过                                              |

[2026-07-26 21:45] app: | 6  | models   | object(1) | 44 B       | ❌            | ?                             | 仅一个 $include: ./openclaw.parts/models.json5 引用，真实模型定义在外部 json5 文件里；适配器若只读 17 顶层会漏掉全部模型清单                                                                                                     |
| 7  | agents   | object    | 3485 B（最大） | ❌            | ?                             | 含 defaults + list[2]（walle、tars），每个 agent 都有 model.primary/fallbacks/system/tools/hooks。真实 hooks 嵌套在 agent 上而非顶层，JUE-302 若只查顶层 hooks 会"找不到字段"                                                |
| 8  | tools    | object(2) | 878 B      | ❌            | ?                             | profile=coding，alsoAllow 是 35 项字符串数组                                                                                                                                                         |
| 9  | bindings | array(2)  | 139 B      | ❌            | ?                             | [{agentId:walle,match:""}, {agentId:tars,match:""}] —— 用于把消息路由到不同 agent                                                                                                                      |
| 10 | commands | object    | 214 B      | ❌            | ?                             | 含 native/nativeSkills auto 模式、text/bash/config/debug/restart 布尔开关、ownerDisplaySecret（64 hex，应当作 secret 处理）                                                                                   |
| 11 | session  | object(2) | 158 B      | ❌            | ?                             | dmScope=per-account-channel-peer；maintenance 含 mode=enforce / rotateBytes=10mb / pruneAfter=30d / maxEntries=500 / resetArchiveRetention=30d                                                 |
| 12 | gateway  | object(4) | 130 B      | ❌            | ?                             | port=18789 / mode=local / bind=loopback；auth.mode=token / auth.token=<REDACTED>（16-byte hex，是真实 token）                                                                                       |
| 13 | mcp      | object(1) | 1211 B     | ❌            | ⛔ 用户描述"标记 degraded"但包都不存在无法核对 | mcp.servers 实为对象 map，含 5 个真实 server：browser-use、zentao、minimax、minimax-coding-plan、gitlab。每个 server 含 command/args/env 三件套；其中 minimax 与 minimax-coding-plan 的 env.MINIMAX_API_KEY 是真实密钥（已脱敏） |
| 14 | plugins  | object(3) | 411 B      | ❌            | ❌ 完全未处理（用户原话）                 | allow 数组 9 项；entries 对象 map 含 8 个条目：acpx, stepfun, anthropic, qwen, openrouter, minimax, wecom-openclaw-plugin, openclaw-lark，每个带 enabled/source；bundledDiscovery=compat                     |
| 15 | messages | object(1) | 47 B       | ❌            | ?                             | 极小                                                                                                                                                                                           |
| 16 | skills   | object(1) | 1192 B     | ❌            | ?                             | skills.entries 是对象 map，真实条目 40 个（1password/apple-notes/blogwatcher/coding-agent/discord/mcporter/summarize/...），每条 1 个子字段（应为 enabled 布尔）                                                     |
| 17 | channels | object(2) | 767 B      | ❌            | ?                             | 仅 feishu + wecom 两个 channel；feishu 含 appSecret（已脱敏），feishu.accounts.tars.appSecret（机器人子账号密钥，已脱敏）；wecom.secret（已脱敏）                                                                           |
```
覆盖率汇总

• **JUE-302 是否实现 17 字段中任何一项**：**0/17**（无法验证，包不存在）
• **真实 OpenClaw 配置合法性**：**17/17 schema 校验通过**
• **真实数据非空字段**：`agents` (2 个 agent)、`bindings` (2 条路由)、`mcp.servers` (5 个 server)、`plugins.entries` (8 个插件)、`skills.entries` (40 个 skill)、`channels` (2 个 channel)

───

B. "漏字段"风险逐项分析

按用户原话三个声明分别评估：

B1. `mcp` 标记 degraded

**核实**：JUE-302 包不存在，无法核对任何内部标记。但**真实 `mcp.servers` 是 5 个**而非空：

• `browser-use` / `zentao` / `minimax` / `minimax-coding-plan` / `gitlab`

若 JUE-302 真按"读 mcp 顶层 → 没东西 → degraded"的逻辑实现，那它对真实环境的判断**完全错误**。这才是真风险。

B2. `plugins` 完全未处理

**核实**：用户原话"plugins 字段完全没有处理"。

[2026-07-26 21:45] app: 报告写完了，无密钥泄漏。最终汇总：

───

📋 JUE-302 Adapter 真实深审报告

**审计日期**：2026-07-26 21:36 GMT+8
**审计对象**：`packages/ai-jue-adapter-openclaw`（JUE-302 适配器）
**OpenClaw 实例**：`D:\devuser\.openclaw\` （OpenClaw 2026.6.11 / commit `e085fa1`）
**ai-jue monorepo**：`D:\devuser\code\github\ai-jue\`（main 分支，`9a6ddcb`）

───

TL;DR（先看结论）

```
| 维度                                                                 | 结论                                                                                 |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| ai-jue-adapter-openclaw 包是否存在？                                     | ❌ 不存在。 整个 monorepo 没有此包；git 历史、TODO.md、FINISH.md、.specstory、packages/_drafts 全无引用。 |
| capabilities/{context,skills,commands,agents,hooks,mcp}.ts 模式是否存在？ | ❌ 不存在。 现存 ai-jue-adapter-claude 只有单个 src/index.ts（446 行），无 capabilities 目录切分。      |
| dist/read.js 是否能跑？                                                 | ❌ N/A —— 没有 dist（更没有 src）。                                                         |
| 真实 OpenClaw 配置能否被原生命令校验？                                           | ✅ 通过。 openclaw config validate --json 退出码 0，仅 2 个 plugins 警告。                      |
| 能否投产使用？                                                            | ❌ 不能。 适配器本身缺失，连"测试适配器是否能正确读 OpenClaw 配置"都做不到。                                      |
```
**路径偏差说明**：原始请求里写的是 macOS 风格路径 `/tmp/jue-302-real-audit` 与 `/Users/zenheart/code/project/todo/ai-jue`。本机是 Windows，OpenClaw 装在 `D:\devuser\.openclaw\`，ai-jue monorepo 在 `D:\devuser\code\github\ai-jue\`。所有中间产物落地于 `D:\devuser\jue-302-real-audit\`。

───

A. 17 字段覆盖矩阵（基于真实 `openclaw.json`）

`openclaw.json`（14401 bytes）共 **17 个顶层字段**，全部在 OpenClaw 2026.6.11 schema 内。`openclaw config validate --json` 退出码 0 确认全部合法（仅 2 个 plugins 安装警告）。

```
| #  | 字段       | 类型        | 真实数据规模     | JUE-302 是否实现 | 标记 degraded?                  | 备注 / 漏字段风险                                                                                                                                                                                   |
| --- | -------- | --------- | ---------- | ------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | meta     | object(1) | 77 B       | ❌ 无法验证（包不存在） | ?                             | 纯元信息（version/lastTouched），低风险                                                                                                                                                                |
| 2  | env      | object(1) | 127 B      | ❌            | ?                             | 含 OPENROUTER_API_KEY（sk-or-v1-…）；JUE-302 若实现此能力必须执行脱敏，否则直接命中真实密钥                                                                                                                             |
| 3  | wizard   | object(4) | 116 B      | ❌            | ?                             | 含 lastRunAt/lastRunVersion/lastRunCommand/lastRunMode，都是审计元数据                                                                                                                                |
| 4  | logging  | object    | 137 B      | ❌            | ?                             | 日志配置，形态合理                                                                                                                                                                                    |
| 5  | acp      | object    | 152 B      | ❌            | ?                             | ACP 子配置                                                                                                                                                                                      |

