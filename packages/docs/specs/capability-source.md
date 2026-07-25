# Specification: Capability Source

> Status: Implemented
> Owner workspace: **ai-jue**（本仓库）
> Consumer: any Preset repository（只声明引用，不实现解析）
> Updated: 2026-07-25

## 0. 术语说明

Jue 对用户暴露的概念只有三层：`Capability → Preset → Adapter`（见
[jue-mvp.md §1](jue-mvp.md)，与 MCP 自身的 `capabilities` 协议用词一致，
不另造新词）。

**Capability Source** 不是第四个平级概念，而是 `ai.capabilities` 字段描述
的"Preset 声明某个 Capability 内容来自外部第三方源"的引用协议。解析、
转换后的产物就是 Capability 本身（`skills` / `agents` / `commands` /
`rules` / `hooks` / `mcp.servers` 六类之一），不产生新的资产类型：

- **Capability**：Canonical 内的原子能力，六类固定集合，与
  [canonical-model.md](canonical-model.md) 完全一致。
- **Capability Source**：`ai.capabilities` 字段描述的"外部 Capability
  内容引用协议"，本规格的主题。
- **Preset**：唯一的组合/分发单元，见 §1.1。

## 1. 为什么要有这份规格

当前 Agent Skill / MCP 生态本身**不支持嵌套组合**。  
Jue 的差异化不在“再发明一种 skill 格式”，而在：

> **Preset 可以递归组合，并直接引用第三方 Capability 内容（GitHub / URL / 本地 / npm），经转换进入 Canonical Model。**

本规格只定义 **ai-jue 引擎必须补齐的输入侧能力**。  
内容沉淀、场景 Preset 拆分由各 Preset 仓库负责。

`ai.capabilities` 不是 `ai.config.js` 顶层的独立新概念，而是**任何"Preset 清单"里 `ai.presets` 的兄弟字段**：Preset 本身就是 npm 包，清单天然是 `package.json` → `ai`（现有 `ai.presets` 已在用这个位置）；项目根 `ai.config.js` 本质是"最外层的 Preset 清单"（`cosmiconfig` 的 `searchPlaces` 本就包含 `package.json`），所以同一套 `ai.capabilities` schema 对两处都成立，不需要为端用户和 Preset 作者分别设计字段。

### 1.1 Preset 是唯一的组合/分发单元，Capability 引用是叶子节点

一个清单（Preset 自身的 `package.json` 或项目根 `ai.config.js`）最终的能力集，来自三路**互相独立**的输入，合并顺序见 §5：

1. 自身目录资产（`loadAssetsFromDir`，已有）
2. 递归展开的嵌套 Preset（`ai.presets`，已有：依赖优先、自身覆盖、循环检测）
3. 逐条展开的 Capability 引用（`ai.capabilities`，本规格新增）

第 3 路是**叶子节点，不递归**：一条 `CapabilityRef` 解析出的内容只做一次转换/装载，
不会再对它内部是否含有 `ai.presets`/`ai.capabilities` 做二次展开——哪怕
`converter: jue-native` 拉到的是一份完整的 Jue 目录，也只对它跑 `loadAssetsFromDir`
（读它自己的资产），**不**对它跑 `loadPresetRecursive`（不展开它自己的嵌套声明）。
"嵌套"这件事永远只由 `ai.presets` 负责，`ai.capabilities` 不重新实现一遍。

不存在独立的 Plugin/Capability 包层；组合机制**仅有且只有两种**：Preset 嵌套 + Capability 引用，
不存在第三种。

### 1.2 Capability 引用本质是逃生舱，不是必需机制

`ai.capabilities` 能做到的事，原则上**都可以**靠"把第三方内容手工改造成符合 Jue 目录约定的
Preset，再用已有的 `ai.presets` 引用"达成——这条路径今天就完全可用，零新代码。`ai.capabilities`
存在的唯一理由是**省去这次手工改造**：不用为了引用第三方仓库里的一个 skill，或者
npm 上的一个 MCP 包，而专门包一层 `jue-preset-*` 壳。它是"更方便"，不是"能力上必须"——这也是
为什么它必须保持叶子节点、不支持嵌套：一旦允许嵌套，它就会和 `ai.presets` 产生重叠语义，
违反"只有两种组合机制"的边界。

这条声明用于防止后续把每个 skill 拆成独立 npm 包（会导致治理成本失控），
不因引入 Capability Source 而新增第三种组合形态。

## 2. 边界

| 负责方 | 做什么 | 不做什么 |
|--------|--------|----------|
| **ai-jue** | Source 解析、转换、合并进 Canonical、锁与缓存、Adapter 分发 | 不拥有业务 Capability 正文、不做资产治理 |
| **Preset 仓库** | 维护自研 Capability、按场景写 Preset、声明第三方引用 | 不实现 resolver / converter / lock |

与现有三层对齐：

```text
Capability Source  →  Converter  →  Canonical Capability  →  Adapter
       ↑新增输入侧              （已有）              （已有输出侧）
```

**明确不做（本期）：**

- scoped npm Preset 特殊解析（非核心）
- Preset Registry / 远程市场
- 自动执行下载下来的 skill `scripts/`
- 在 adapter 包里做输入转换

## 3. 代码落点（只扩现有包）

```text
packages/docs/specs/capability-source.md   # 本文件（协议）
packages/ai-jue-core/src/capability-source.* # Source / CapabilityRef 类型与校验
packages/ai-jue/src/capability-source/
  resolve.ts                                # github | url | file | npm → 本地缓存路径
  load.ts                                   # 读入 + 调 converter + 并入 MergedConfig
  converters/
    agent-skill.ts                          # Agent Skills 目录 → skills[name]
    mcp.ts                                  # MCP package / mcp.json 片段 → mcp.servers
packages/ai-jue/src/preset.ts               # 加载 ai.capabilities 后 merge（扩展现有）
packages/ai-jue/src/resolver.ts             # 最终合并顺序中纳入 capability source 层（如需）
```

**不要新建** `ai-jue-adapter-input-*` 包；输入转换不是 Adapter。  
**不要**把逻辑放进 `jue-preset-*` 或特定 Preset 仓库。

## 4. 最小用户面（MVP）

Preset / `ai.config.js` 增加 `ai.capabilities`（与现有 `ai.presets` 同级、同放在 `ai` 命名空间下）。

**首要用途不是第三方引用，而是同仓多个场景 Preset 共用一份本地 Capability 而不物理复制**——正文只在
`capabilities/skills/<name>` 维护一份，各场景 Preset 用 `file:` 引用去重：

```json
{
  "ai": {
    "presets": [],
    "capabilities": {
      "shared-review": {
        "source": "file:../../capabilities/skills/shared-review",
        "converter": "agent-skill"
      }
    }
  }
}
```

第三方引用（GitHub / npm）是同一机制的扩展，形态相同，只是 `source` 协议不同：

```json
{
  "ai": {
    "presets": ["base"],
    "capabilities": {
      "doc-coauthoring": {
        "source": "github:example/skills",
        "ref": "v1.2.3",
        "path": "skills/example-skill",
        "converter": "agent-skill"
      },
      "filesystem": {
        "source": "npm:@example/mcp-server@1.2.3",
        "converter": "mcp",
        "config": { "args": ["${WORKSPACE_ROOT}"] }
      }
    }
  }
}
```

`skill` / `agent` / `command` 默认应**直接放在其唯一所属 Preset 自己的目录里**（零配置，`loadAssetsFromDir`
已支持），不需要经过 `ai.capabilities`；只有同一份 Capability 被 **2 个以上** Preset 共用，或内容来自
第三方，才需要这个字段。`mcp` 例外：MCP server 通常是跨场景基础设施，天然适合独立声明，不依附于任何单一
业务场景 Preset。

### 4.1 Source 形态（MVP 必支持）

| Source | 示例 | 优先级 |
|--------|------|--------|
| `file:` | `file:./vendor/skills/foo` | P0 |
| `github:` | `github:owner/repo` + `ref` + `path` | P0 |
| `npm:` | `npm:pkg@version`（MCP 或带 SKILL.md 的包） | P0 |
| `url:` | `https://.../archive` 或单文件 | P1（可后置，但协议预留） |

### 4.2 Converter（MVP）

| converter | 输入 | 输出 canonical 键 |
|-----------|------|-------------------|
| `agent-skill` | 含 `SKILL.md` 的目录（可带 references/scripts/assets） | `skills.<name>` |
| `mcp` | npm MCP 包或 `{ servers: {...} }` 片段 | `mcp.servers.<name>` |
| `jue-native` | 已是 Jue 目录约定的 capability 目录 | 对应 section |

未识别格式：**失败并报错**，不静默跳过。

`jue-native` 只调用 `loadAssetsFromDir` 读取该目录**自身**的资产，**不**调用 `loadPresetRecursive`——
即不展开该目录里可能存在的 `ai.presets`/`ai.capabilities`（见 §1.1，Capability 引用是叶子节点，
不重新实现嵌套）。若第三方内容本身还依赖嵌套 Preset，应引导作者把它改造为真正的 `ai.presets`
引用，而不是指望 `jue-native` 转换器帮它展开。

## 5. 加载顺序（扩展现有）

保持现有 Preset 递归语义，在「自身目录资产」之后或并列增加 capability source 解析：

1. 递归 `ai.presets`（已有：依赖优先、自身覆盖、循环检测）
2. 解析并加载当前 Preset 的 `ai.capabilities`
3. `loadAssetsFromDir(presetPath)`（已有）
4. 项目 `.ai/` → root `AGENTS.md` → `extends` → inline config（已有）
5. 项目根 `ai.config.js`（或其 `package.json` → `ai`）自身的 `ai.capabilities`——与步骤 2 走同一套
   resolve/converter 实现（`resolver.ts` 复用 `preset.ts` 暴露的函数），项目根只是"最外层的 Preset 清单"

同名 Capability：**后层覆盖前层**（与现有 deep merge 一致）。

## 6. Lock / Cache（确定决策，不留给实现阶段二选一）

- **缓存**：固定为全局内容寻址缓存 `~/.cache/ai-jue/<source-type>/<sha256(source+ref+path)>`，
  不提供项目级 `.jue/cache/` 备选。理由：多项目复用同一第三方 Capability 内容时
  避免重复下载，行为对齐 npm 全局包缓存。
- **锁文件**：固定文件名 `ai-jue.lock`，JSON 格式，放在项目根目录（与
  `ai.config.js` 同级）。记录 `source`（原始引用，含 URL / npm spec）/
  可选 `ref`（commit SHA 或 tag）/ 可选 `path` / `contentHash` / `locatorHash` /
  `converter`。理由：与 CLI 发行包名 `ai-jue` 一致，避免与
  其他工具的通用 `jue.lock` 命名冲突。lock 是解析结果的**只写审计产物**：
  正常解析链路（`jue apply` / preset 加载）从不读取它来决定行为，只有
  `jue capability update` 会在写入后读回它来汇报"这次实际更新了哪些引用"。
  没有任何 `ai.capabilities` 被解析时，会删除已存在的 `ai-jue.lock`，
  避免陈旧文件被误读为"刚刚更新过"。
- **同名 Capability 冲突**：**不做 npm 式 semver range 求解**。`ai.capabilities`
  引用的是内容，不是可执行依赖树；采用与现有 Capability 深合并一致的
  "后引用覆盖前引用"规则，按 Preset 递归顺序确定覆盖顺序。这条决策需要显式
  写明原因，防止实现阶段误引入复杂的版本求解逻辑。
- **浮动引用策略**：`github:` 缺省 `ref` 时，`jue apply` 默认警告并继续；新增
  `jue apply --frozen`（用于 CI）在此情况下直接失败。`npm:` 必须带精确版本号，
  缺失时**校验失败**（不是警告）。
- **更新命令**：`jue capability update [name]` 重新解析来源并重写 `ai-jue.lock`；
  不带参数时更新全部引用。`jue apply` 默认不强制联网重新解析：`github:`/`npm:`
  命中本地内容寻址缓存（`~/.cache/ai-jue/...`）时直接复用，不发请求；缓存缺失或
  `jue capability update` 强制刷新时才真正联网。解压到缓存目录前先落到同级临时
  目录再原子 rename 到位，避免进程被中断（Ctrl-C / CI 超时 / OOM）导致的半成品
  解压被后续运行当作有效缓存永久信任。

## 7. 安全（不可省）

- 下载 ≠ 执行：`scripts/` 不因 resolve 成功而自动跑
- MCP 展示 command、env **名**、网络意图；不写明文密钥
- URL 来源建议强制 integrity；GitHub 建议钉 commit/tag
- Converter 只做格式转换，不做网络副作用

## 8. 验收标准（给实现方）

1. 文档：本规格 + `creating-a-preset.md` / `architecture.md` 交叉链接
2. `file:` 本地第三方 Agent Skill 目录可经 `agent-skill` 进入 `skills.*`，且 `references/` 相对路径保留（复用现有 skill bundle 逻辑）
3. `github:` + `path` 可拉取子目录 Skill，并写入 lock
4. `npm:` MCP 包可进入 `mcp.servers`，Adapter 输出仍走现有 MCP 路径
5. Preset A `ai.presets: [B]` 且 B/A 各自声明 capabilities 时，合并与覆盖语义可测
6. 循环 Preset 仍失败；未知 converter 失败
7. 现有 `smoke:preset-local` / base / internal smoke **不回退**
8. `ai-jue.lock` 按 §6 固定文件名/路径生成；`jue apply --frozen` 在浮动 `github:` 引用缺 `ref` 时失败；`npm:` 缺精确版本时校验失败（非警告）

## 9. 非目标（交给 Preset workspace）

- 拆分某个私有组合 Preset 的业务场景内容
- Capability 正文的发现、脱敏、rubric、人工晋级
- `deployments/` 实例运维

Preset 仓库只需约定：Preset 的 `ai.capabilities` 按本规格书写；不复制第三方正文。

## 10. 建议实现切片（给另一个 workspace）

| 切片 | 内容 | 预估 |
|------|------|------|
| S0 | 本规格审阅确认 + core 类型 | 小 |
| S1 | `file:` + `agent-skill` converter + 单测（含"同仓 2 个 Preset 引用同一本地能力、不产生物理复制"用例） | 中 |
| S2 | `github:` resolve + lock/cache 最小实现 | 中 |
| S3 | `npm:` + `mcp` converter | 中 |
| S4 | 接入 `preset.ts` 加载链 + 文档 + smoke | 中 |

优先顺序：**S0 → S1 → S4（先打通本地）→ S2 → S3**。
