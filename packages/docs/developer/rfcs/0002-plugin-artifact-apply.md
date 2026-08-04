# RFC-0002：Plugin / Bundle Artifact 的 apply 合同

> 状态：Proposed  
> 关联：Epic [#5](https://github.com/zenHeart/ai-jue/issues/5)；[#2](https://github.com/zenHeart/ai-jue/issues/2)、[#3](https://github.com/zenHeart/ai-jue/issues/3)、[#6](https://github.com/zenHeart/ai-jue/issues/6)；R5（ai-assets 最终消费者闭环）  
> 消费者证据：私有 Preset 组合入口 `jue-preset-ai-assets`（ai-assets `presets/personal`）

## 背景

RFC-0001 已规定 Plugin、Bundle 与配置都是 **Artifact 形态**，由 Adapter 输出。  
Claude Code / Codex Adapter 的 `write()` 已支持 `artifactKind: "plugin"`（含原生
`confirm`），但 `jue apply` 的 Core 路径把 `artifactKind` 硬编码为 `"project"`
（`packages/ai-jue/src/core-apply.ts`）。文档中的
`targets.<adapter>.artifact`（如 `"plugin"` / `"compatible-bundle"` / `"auto"`）
仍是目标合同，尚未接线。

结果：私有最终 Preset（如 ai-assets 的 `presets: ['ai-assets']`）今天只能稳定落到
**project / workspace 配置**，无法用同一入口为四端生成可安装的 Plugin / Bundle。

OpenClaw / Hermes Adapter 目前仅声明 workspace Artifact（OpenClaw 明确 no-op
Plugin/Bundle），需要单独定义「聚合分发」形态，不能假装已有 Claude 式 plugin。

## 目标

1. 用户可通过 CLI 和/或 `ai.config.js#targets` 选择 Artifact 形态，至少覆盖：
   - Claude Code：`project` | `plugin`
   - Codex：`project` | `plugin`
   - OpenClaw：`workspace` | `compatible-bundle`（名称以本 RFC 决策为准）
   - Hermes：`workspace` | 经原生核验后的聚合形态（见候选方案）
2. 私有 / 本地 pack 的 Preset（不经公网 publish）可走完整 apply 路径。
3. `smoke:preset-local --entry ai-assets`（或等价）能对所选 Artifact 做存在性与
   原生确认断言，而不只断言 project 文件。

## 非目标

- Marketplace / 多 Plugin 聚合发布包（显式后置）。
- 修改 Canonical DSL 或新增第七个公共概念。
- 强制四端 `degraded`/`unsupported` 立刻清零（R5 门禁另轨；本 RFC 只要求形态可选且诚实声明）。
- 在 ai-assets 仓实现 Adapter 兼容层。

## 候选方案

### A. 仅 CLI：`--artifact-kind <kind>`

- 优点：改动面小，立刻打通 Claude/Codex 已有 `write(plugin)`。
- 缺点：与已文档化的 `targets.*.artifact` 双轨；`--all` 多目标时无法分端选择。

### B. 仅配置：`targets.<adapter>.artifact`

- 优点：与 Reference / Guide 一致；多目标可分端。
- 缺点：一次性交互调试不如 CLI 直接。

### C. 配置优先 + CLI 覆盖（推荐）

解析顺序：

1. CLI `--artifact-kind` / `--artifact`（若提供）覆盖当前 adapter；
2. 否则 `targets.<adapter>.artifact`；
3. 否则 `"auto"` / Adapter 默认（今日默认等价 `project`/`workspace`）。

`--all` 时每个 adapter 独立解析；某端声明不支持的 kind 必须 **写入前失败** 并列出该
Adapter 已声明的 kind，不得静默降级为 project。

## 决策（Proposed）

采用 **方案 C**。

| Adapter | 稳定 kind 名 | 含义 |
| --- | --- | --- |
| `claude-code` | `project`, `plugin` | `plugin` → `.claude-plugin/plugin.json` + 组件根在产物根 |
| `codex` | `project`, `plugin` | `plugin` → `.codex-plugin/plugin.json` + marketplace 可确认路径 |
| `openclaw` | `workspace`, `compatible-bundle` | `compatible-bundle` = 可分发的目录包，语义在 Adapter 合同中写清；**不得**虚构官方不存在的 Plugin API |
| `hermes` | `workspace`, `plugin`（若原生核验成立）或 `compatible-bundle` | 必须以真实 Hermes/tirith 表面为准；`~/.hermes/plugins` 注册表 ≠ 可分发 Artifact |

公共合同只增加「如何选择已有 Artifact 形态」，不新增概念。kind 字符串必须出现在
该 Adapter 的能力/布局声明中，供 `jue inspect` 列出。

## 详细合同

### CLI

```bash
jue apply --adapter claude-code --artifact-kind plugin
jue apply --adapter openclaw --artifact-kind compatible-bundle
jue apply --all   # 每端读 targets 或默认
```

- 别名：允许 `--artifact` 作为 `--artifact-kind` 的短选项（二选一文档化即可）。
- 非法 kind：exit code 与现有校验失败一致（不得部分写入）。

### ProjectConfig

沿用已有字段：

```js
export default {
  presets: ["ai-assets"],
  targets: {
    "claude-code": { artifact: "plugin" },
    codex: { artifact: "plugin" },
    openclaw: { artifact: "compatible-bundle" },
    hermes: { artifact: "auto" }
  }
};
```

`auto` 规则保持 Guide：已托管 Artifact → Adapter 唯一默认 → 否则失败列候选。

### Core

`runCoreAdapter` 必须把解析后的 kind 传入 `write(canonical, { artifactKind, ... })`
与后续 `confirm` context，禁止字面量 `"project"`。

### Adapter

- Claude/Codex：复用现有 `write`/`confirm`；补 CLI/配置接线与集成测试即可。
- OpenClaw/Hermes：先冻结「聚合目录最小树 + 诚实 capabilities + native confirm 或
  明确 unsupported」，再实现 `write`。若某端短期无法提供可安装聚合形态，Adapter
  必须 `unsupported`，不得在文档声称 plugin 已通。

### 私有 Preset

继续以 npm 本地路径 / `npm pack` + `smoke:preset-local` 为准；验收不得依赖
registry publish。

## 安全

- Plugin 产物不得写入密钥、token、未脱敏 PII。
- `confirm` 证据保持现有 redaction 合同。
- user-scope / 全局目录写入仍需授权门禁；本 RFC 默认 project/产物目录。

## 兼容 / 迁移

- 默认行为保持今日：`project` / `workspace`（无配置、无 CLI 时零行为变化）。
- 文档中已写的 `targets.*.artifact` 从「目标合同」转为「已接线合同」后，更新
  implementation-status 与 configuration-guide 的 WARNING。

## 验收标准

1. Claude Code：`jue apply --adapter claude-code --artifact-kind plugin` 生成可通过
   `claude plugin validate`（或现有 confirm）的产物。
2. Codex：同等路径生成可通过现有 marketplace add/list confirm 的产物。
3. OpenClaw / Hermes：选定 kind 的最小可验证产物 + 合同测试；或明确
   `unsupported` 并在 inspect 可见。
4. `targets` 分端选择在 `--all` 下生效；非法 kind 预检失败。
5. `npm run smoke:preset-local -- --packages-dir <ai-assets/presets> --entry ai-assets`
   可对 plugin/bundle 模式断言（或通过 flag 选择 artifact），且全程离线/本地 pack。
6. 二次 apply 对同一 plugin 产物保持幂等（零差异或仅允许合同内托管块更新）。

## 未决问题

1. OpenClaw `compatible-bundle` 的官方对齐名与安装入口最终以哪版 CLI 为准？
2. Hermes 聚合形态用 `plugin` 还是 `compatible-bundle`？
3. smoke 脚本是扩展现有 `smoke-local-preset.js` 还是新增 `--artifact-kind` 矩阵？
4. Cursor 等仍仅 `generate()` 的 Adapter 是否在本 RFC 范围外保持默认 project？

## 实施切片（建议 Issue）

1. CLI + Core 接线（打通 Claude/Codex 已有 plugin）— #2  
2. OpenClaw / Hermes 聚合 Artifact — #3（可拆两端）  
3. ai-assets 私有最终 Preset 的 plugin/bundle 狗粮 — #6  
4. 总跟踪 — Epic #5  

实现细节 Issue 必须链接本 RFC；Accepted 前不得把文档示例写成「已实现」。
