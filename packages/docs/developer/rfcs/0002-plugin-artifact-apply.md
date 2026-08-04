# RFC-0002：Plugin / Bundle Artifact 的 apply 合同

> 状态：Implementing  
> 关联：Epic [#5](https://github.com/zenHeart/ai-jue/issues/5)；[#2](https://github.com/zenHeart/ai-jue/issues/2)、[#3](https://github.com/zenHeart/ai-jue/issues/3)、[#6](https://github.com/zenHeart/ai-jue/issues/6)；R5  
> 消费者证据：私有 Preset 组合入口 `jue-preset-ai-assets`（ai-assets `presets/personal`）  
> 官方依据（2026-08 核验）：  
> - OpenClaw [Plugin bundles](https://docs.openclaw.ai/plugins/bundles) · [Plugins](https://docs.openclaw.ai/tools/plugin) · [Building plugins](https://docs.openclaw.ai/plugins/building-plugins)  
> - Hermes [Plugins](https://hermes-agent.nousresearch.com/docs/user-guide/features/plugins) · [Build a Hermes Plugin](https://hermes-agent.nousresearch.com/docs/guides/build-a-hermes-plugin)

## 背景

RFC-0001 已规定 Plugin、Bundle 与配置都是 **Artifact 形态**。Claude / Codex Adapter
的 `write()` 已支持 `artifactKind: "plugin"`，但 `jue apply` 把 kind 硬编码为
`"project"`（`packages/ai-jue/src/core-apply.ts`）。`targets.*.artifact` 仍是未接线
的目标合同。

JUE-302 曾结论「OpenClaw 没有 Plugin/Bundle」——那是对 **workspace 项目树** 的实测
（`AGENTS.md` / `skills/` / `hooks/`）。当前官方文档已明确第二表面：

| OpenClaw 表面 | 是什么 | 与 Jue 的关系 |
| --- | --- | --- |
| Workspace | 项目内 skills/hooks/AGENTS | 今日 Adapter 已实现 |
| **Compatible bundle** | 安装 Claude / Codex / Cursor 布局，映射为 OpenClaw 能力 | **应用 Claude/Codex 已有 plugin 产物，零新布局** |
| Native plugin | `openclaw.plugin.json` + 进程内 TS 运行时 | 超出 Canonical 能力包；**本 RFC 非目标** |

Hermes 的「plugin」是另一套产品语义：

| Hermes 表面 | 是什么 | 与 Jue 的关系 |
| --- | --- | --- |
| Workspace | `skills/<cat>/<name>/`、`config.yaml` mcp、`MEMORY.md` | 今日 Adapter 已实现；**能力包主路径** |
| General plugin | `plugin.yaml` + `__init__.py`（Python tools/hooks/commands） | 运行时扩展；**不是** Canonical skill 包的默认载体 |
| Plugin-bundled skills | 同上目录内 `skills/<name>/SKILL.md` + `ctx.register_skill` | 可选薄封装；需生成少量 Python |
| `~/.hermes/plugins` / `installs.json` | 安装注册表 | **不是**可分发 Artifact 本身 |

若不按官方表面选型，会误造「第四种 OpenClaw 目录」或「假 Hermes plugin.json」，成本高且无法 `plugins install` 验收。

## 目标

1. CLI / `targets` 可选 Artifact 形态（默认不变）。
2. 私有 / `npm pack` Preset 不经公网 publish 即可产出可安装产物。
3. **最小代价**：能复用 Claude/Codex plugin writer 的绝不重写；不为 OpenClaw 发明新目录树；不为 Hermes 生成完整 Python 工具插件（除非用户显式要 runtime 扩展）。
4. Smoke 可对所选形态做原生确认（或诚实 `unsupported`）。

## 非目标

- OpenClaw **native** plugin（`openclaw.plugin.json` + `definePluginEntry` / 进程内工具）。
- Hermes 完整 Python 工具 / platform / memory / model-provider 插件生成。
- Marketplace / ClawHub / pip 发布流水线。
- 修改 Canonical DSL；强制四端 `degraded` 清零；在 ai-assets 写 Adapter。

## 官方映射（决定实现形状）

### OpenClaw compatible bundle（已支持安装）

```bash
openclaw plugins install ./my-bundle
openclaw plugins list          # Format: bundle；Bundle format: claude|codex|cursor
openclaw plugins inspect <id>
```

检测标记（官方）：

| Bundle format | Marker | 今日 OpenClaw 映射（supported） |
| --- | --- | --- |
| Codex | `.codex-plugin/plugin.json` | skills；hooks（仅 `HOOK.md`+`handler.ts|js`）；MCP |
| Claude | `.claude-plugin/plugin.json` 或无 manifest 默认布局 | skills；`commands/`→当 skill 根；MCP；settings/LSP；**agents / hooks.json 仅 detect** |
| Cursor | `.cursor-plugin/plugin.json` | skills；commands→skills；其余多 detect-only |

安全边界：bundle **不**加载任意 in-process 模块；比 native plugin 更窄——这正适合
Jue 从 Canonical 导出的内容包。

### Hermes plugin（Python 优先）

```text
~/.hermes/plugins/<name>/
├── plugin.yaml
├── __init__.py          # register(ctx)
└── skills/<name>/SKILL.md   # 可选；ctx.register_skill
```

- 项目本地：`./.hermes/plugins/`（默认关，需 `HERMES_ENABLE_PROJECT_PLUGINS=true`）。
- 能力包（skills/agents/commands 文本）的**默认** Hermes 交付仍是 **workspace**，不是
  Python plugin。
- 若需「可 `hermes plugins install` 的 skill 包」，只做 **thin skill-plugin**（yaml +
  自动生成的 `register_skill` 循环 + flat `skills/`），不生成业务 tools。

## 候选方案

### A. 四端各自发明聚合目录

成本高；OpenClaw 官方已提供 Claude/Codex 入口，重复造轮子。**否决。**

### B. 仅 CLI 接线 Claude/Codex；OpenClaw/Hermes 永不做聚合

成本最低短期；但浪费 OpenClaw 已有 `plugins install` bundle 能力，R5 四端聚合不闭合。**作 Phase 0，不作终点。**

### C. 配置优先 + CLI 覆盖；OpenClaw 委托已有 plugin writer；Hermes 分层（推荐）

见决策。

## 决策（Proposed）

采用 **方案 C**，并冻结 kind 名与实现策略：

| Adapter | Kind | 实现策略（最小代价） |
| --- | --- | --- |
| `claude-code` | `project`, `plugin` | 已有 `write`/`confirm`；只接 CLI/config |
| `codex` | `project`, `plugin` | 同上 |
| `openclaw` | `workspace`, **`compatible-bundle`** | **不写新布局**。`compatible-bundle` = 调用 Claude 或 Codex 的 `write(..., { artifactKind: "plugin" })` 产出目录，再以 `openclaw plugins install` / `inspect` 确认 `Format: bundle` |
| `hermes` | `workspace`, **`skill-plugin`**（可选 Phase B） | 默认只保证 `workspace`。`skill-plugin` = 生成 `plugin.yaml` + 最小 `__init__.py`（仅 `register_skill`）+ flat `skills/<name>/`；agents/commands/hooks/mcp **不**塞进该 kind（mcp 仍走 workspace/`config.yaml`） |

### OpenClaw `compatible-bundle` 细节

1. **默认 bundle 基底：`claude`**（ai-assets 以 skills/commands 为主；Claude `commands/`→OpenClaw skill 根）。
2. 当 Canonical **含 hooks** 且需要 OpenClaw **可执行** hooks 时，改用 **`codex`** 基底（官方：仅 Codex 式 `HOOK.md`+handler 可执行；Claude `hooks/hooks.json` 为 detect-only）。
3. 选择来源：`tools.openclaw.bundleFormat: "claude" | "codex" | "auto"`（`auto` = 有 runnable hooks → codex，否则 claude）。
4. Adapter 代码路径：OpenClaw `write` 在 `compatible-bundle` 分支 **委托**  
   `ai-jue-adapter-claude` / `ai-jue-adapter-codex` 的 `write`（或抽共享 helper），禁止复制粘贴第二套目录逻辑。
5. Confirm：隔离目录上  
   `openclaw plugins install <dir>` → `openclaw plugins inspect <id>` 断言  
   `Format: bundle` 与 `Bundle format: claude|codex`。不把 native `openclaw.plugin.json` 当作成功标准。
6. Workspace 与 bundle **分离**：`workspace` 继续写 AGENTS/skills/hooks 到项目树；bundle 不替代 workspace，除非用户显式选 kind。

### Hermes `skill-plugin` 细节（Phase B，可后置）

1. 仅打包 `canonical.skills`；其余 Capability 保持 workspace / degraded 诚实声明。
2. 树：

```text
<output>/
├── plugin.yaml                 # name/version/description（来自 Preset 元数据）
├── __init__.py                 # 生成：遍历 skills/ 调用 ctx.register_skill
└── skills/<skill-name>/SKILL.md (+ references 等)
```

3. Confirm：`plugin.yaml`+`__init__.py` 结构校验；若本机有 `hermes`，可选  
   复制/install 到临时 `HERMES_HOME` 后 `hermes plugins list`。  
   **不得**把 `tirith config validate` 冒充 plugin 安装证明。
4. Phase A（可与 #2 并行关闭 #3 的 Hermes 部分）：`skill-plugin` 声明 `unsupported`，inspect 可见；文档指向 workspace 主路径。

### 选择解析（不变）

1. CLI `--artifact-kind` / `--artifact`  
2. 否则 `targets.<adapter>.artifact`  
3. 否则默认 `project` / `workspace`  

非法 / 未实现 kind：**写入前失败**，不得静默降级。

## 详细合同

### CLI / ProjectConfig

```bash
jue apply --adapter claude-code --artifact-kind plugin
jue apply --adapter openclaw --artifact-kind compatible-bundle
jue apply --adapter hermes --artifact-kind skill-plugin   # Phase B
jue apply --all
```

```js
export default {
  presets: ["ai-assets"],
  targets: {
    "claude-code": { artifact: "plugin" },
    codex: { artifact: "plugin" },
    openclaw: { artifact: "compatible-bundle" },
    hermes: { artifact: "workspace" } // 或 Phase B: "skill-plugin"
  },
  tools: {
    openclaw: { bundleFormat: "auto" } // "claude" | "codex" | "auto"
  }
};
```

Guide 中旧示例 `hermes: { artifact: "auto" }` 在 Hermes 仅有 `workspace`（+ 可选
`skill-plugin`）时：`auto` → 已托管 artifact，否则唯一默认 `workspace`。

### Core

`runCoreAdapter` 传入解析后的 kind；禁止硬编码 `"project"`。

### 能力诚实矩阵（bundle / skill-plugin）

| Canonical | Claude plugin | Codex plugin | OpenClaw via Claude bundle | OpenClaw via Codex bundle | Hermes skill-plugin |
| --- | --- | --- | --- | --- | --- |
| skills | 支持 | 支持 | 映射为 skills | 映射为 skills | `register_skill` |
| commands | 支持 | degraded | **当 skill 根** | degraded/不映射 | 不打包 |
| agents | 支持 | 支持(TOML) | **detect-only** | 视 Codex 映射 | 不打包 |
| hooks | hooks.json | HOOK.md+handler | detect-only | **可执行**（OpenClaw 布局） | 不打包（Hermes hooks 另面） |
| mcp | .mcp.json | .mcp.json | 合并到 embedded | 合并到 embedded | 不打包（用 workspace） |
| context.global | project 专用 | project 专用 | 通常不进 bundle | 通常不进 bundle | 不打包 |

导出前必须把上表中的 detect-only / 不打包项以 `degraded`/`unsupported` 或 apply
预检警告暴露，禁止静默丢弃而无提示。

## 安全

- Bundle / skill-plugin 不得含密钥与未脱敏 PII。
- OpenClaw bundle 保持官方窄信任边界（不加载任意 runtime 模块）——故 **禁止** 为
  图省事改写 native `openclaw.plugin.json` 去「塞」Canonical。
- Hermes `__init__.py` 仅允许生成固定的 `register_skill` 样板，不得嵌入用户
  Canonical 正文为可执行代码。
- 安装到 user 插件目录的 confirm 必须用隔离 `HOME` / profile，避免污染开发机。

## 兼容 / 迁移

- 无 flag / 无 targets：行为与今日一致（project/workspace）。
- 修正 `packages/docs/agents/openclaw.md`：区分 workspace vs compatible bundle vs
  native plugin；删除「OpenClaw 完全没有 Bundle」的过时断言（保留「无
  **Jue 自创** 聚合树、workspace 仍是项目主路径」）。
- `compatible-bundle` 字符串保留（Guide 已用）；语义冻结为「Claude/Codex 兼容包」，
  不是第三种目录方言。

## 验收标准

1. **#2**：Claude/Codex `jue apply --artifact-kind plugin` + 现有 native confirm。
2. **OpenClaw**：`compatible-bundle` 产物可被  
   `openclaw plugins install <dir>` 识别为 `Format: bundle`；  
   有 hooks 时 `bundleFormat=codex`（或 auto）且 hooks 可执行面符合官方表。
3. **Hermes Phase A**：`skill-plugin` 请求 → 清晰失败 / unsupported；workspace 仍绿。  
   **Phase B**：thin skill-plugin 结构 + 可选 `hermes plugins list` 证据。
4. `--all` + `targets` 分端生效；非法 kind 预检失败。
5. `smoke:preset-local --entry ai-assets` 支持 artifact 模式；离线 pack。
6. 二次 apply 幂等。

## 未决问题（收窄后）

1. OpenClaw confirm 是否必须真实 `plugins install`，还是结构检测 + 文档化 CLI 版本下限即可？（建议：有 CLI 则 install+inspect，无则结构断言 + skip 标记。）
2. Hermes Phase B 是否进入 R5 门禁，还是 R5 仅要求 workspace + 三端 plugin/bundle？
3. Cursor bundle 是否第三优先（本 RFC 默认不做；OpenClaw 支持但 Jue 无 Cursor plugin writer）。

## 实施切片

| 顺序 | Issue | 工作 | 代价 |
| --- | --- | --- | --- |
| 1 | #2 | CLI/Core/`targets` 接线 | 小 |
| 2 | #3（OpenClaw） | `compatible-bundle` 委托 Claude/Codex writer + confirm | **小**（无新布局） |
| 3 | #3（Hermes Phase A） | 诚实 unsupported + 文档 | 极小 |
| 4 | #3（Hermes Phase B，可选） | thin skill-plugin 生成器 | 中 |
| 5 | #6 | smoke 矩阵 | 小–中 |
| — | 明确不做 | OpenClaw native plugin、Hermes 业务 Python tools | 避免大代价 |

实现 Issue 必须链接本 RFC；Accepted 前不得把 Guide 示例标成已实现。
