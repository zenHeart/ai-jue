# Codex / Claude Code Adapter 目标规范

> 状态：**Partial**（既有正向生成路径已验证；完整 Adapter 合同未完成）
>
> 优先级：**P0——优先完成 Codex 与 Claude Code**
>
> 范围所有者：`ai-jue`
>
> 更新日期：2026-07-25
>
> [!WARNING]
> 本页定义目标合同。执行顺序固定：先完成 headless Claude Code Reference
> Extension 与 Scale Gate，再并行迁移 Codex；不得同时设计两套流程。

## 1. 目标

`ai-jue` 必须将一份解析完成的 Canonical 配置转换为 **Codex** 和
**Claude Code** 的项目级原生产物。

本规范覆盖以下两个 Target，但实现顺序固定：

1. Claude Code 作为首个 Reference Extension；
2. Codex 在 Scale Gate 后复用同一骨架与合同测试。

Cursor、Gemini、Copilot 和未来运行时保持兼容，但扩展或重设计它们不在本规范
范围内。

用户模型保持不变：

```text
Capability -> Preset -> Adapter
```

Codex 与 Claude Code 是 Adapter 输出，不引入新的资产层或运行时专用源格式。

## 1.1 私有仓库边界

私有 Preset 仓库通过**仅限本地的消费流程**验证，不进行公开分发。

- 禁止将私有 Preset 正文发布、推送、上传或复制到公共 registry、公共仓库、
  外部 fixture 服务或其他远程系统。
- 公共 npm 可用性和远程 GitHub 访问不得成为验收前提。
- 私有 Preset 验证必须通过 npm workspace、`file:` 依赖或本地 `npm pack`
  生成的 tarball 消费本地仓库。
- 本地 tarball 只能写入临时目录，验证后删除或移入废纸篓。
- `npm:` external Capability reference 测试必须使用本地 tarball 或中性本地 fixture。
- `github:` external Capability reference 测试必须使用本地 mock/fixture；禁止 clone、
  fetch 或暴露真实私有仓库。
- 测试和日志不得无必要复制私有资产正文；优先断言路径、数量、校验和与生成结果。
- 发布、release 和远程私有仓库验证属于后续独立阶段，必须获得明确授权。

要求的本地流程：

```text
本地私有 Preset workspace
  -> 本地临时 npm pack/file 依赖
  -> 隔离的本地消费项目
  -> 本地 ai-jue Canonical 解析
  -> Codex / Claude Code 项目产物
```

## 2. 事实来源

两个 Adapter 消费同一组解析后的 Canonical 字段：

- `context.global`
- `rules`
- `skills`
- `commands`
- `agents`
- `mcp.servers`
- `hooks`
- `tools.codex` / `tools.claude`

运行时原生文件是生成产物。作者不得维护第二份 Codex 专用或 Claude 专用的
Capability 正文。

## 3. Codex 输出契约

包：

```text
packages/ai-jue-adapter-codex/
```

要求的项目产物：

```text
AGENTS.md
.agents/
└── skills/
    └── <skill-or-command>/
        ├── SKILL.md
        ├── references/
        ├── scripts/
        └── assets/
.codex/
├── agents/
│   └── <agent>.toml
└── config.toml
```

### 3.1 映射

| Canonical 输入 | Codex 输出 | 要求 |
|---|---|---|
| `context.global` | 根目录 `AGENTS.md` | 通过 AI-JUE 托管块（`<!-- AI-JUE:START/END -->` 标记内的生成区域）写入，并保留用户编写的正文 |
| `rules` | 根目录 `AGENTS.md` | 将非空规则追加为命名清晰的章节；由于 Codex 没有等价的按 glob 规则文件，应以文本保留声明的 path/glob 范围 |
| `skills` | `.agents/skills/<name>/SKILL.md` | 保留 prompt/content、description 与嵌套支持文件 |
| `commands` | `.agents/skills/<name>/SKILL.md` | Command 转为可显式调用的 Skill；保留 description、prompt 与 trigger 提示 |
| `agents` | `.codex/agents/<name>.toml` | 输出必需的 `name`、`description`、`developer_instructions`；仅映射受支持的 Codex override |
| `mcp.servers` | `.codex/config.toml` | 输出项目级 `[mcp_servers.<name>]` 表，不复制密钥值 |
| `hooks` | `.codex/hooks.json` 或 `.codex/config.toml` | 只能选择并记录一种项目级表示，禁止同时输出两种 |
| `tools.codex` | `.codex/config.toml` | 仅合并 Codex 支持的项目级设置 |

### 3.2 Codex 安全与兼容性

- 重新生成后必须保留 `AGENTS.md` 中非托管正文。
- 嵌套 Skill 文件必须保留相对路径和二进制内容。
- 资产名称和支持文件路径必须位于各自生成目录内。
- 不受支持的 Canonical 字段必须明确忽略或报告；禁止静默转换成虚构的 Codex 键。
- 项目配置不得输出凭据值、认证状态、provider override 或其他仅限用户全局的设置。
- TOML 输出必须可解析且确定。
- 输入不变时重复生成必须幂等。

## 4. Claude Code 输出契约

现有包：

```text
packages/ai-jue-adapter-claude/
```

包名是 `ai-jue-adapter-claude`；CLI 别名必须同时支持 `claude` 和
`claude-code`。

要求的输出保持为：

```text
AGENTS.md
CLAUDE.md
.claude/
├── rules/
├── skills/
├── agents/
└── settings.json
.mcp.json
```

- `context.global` -> 托管 `AGENTS.md`；`CLAUDE.md` 引用它。
- Rules、skills、commands、agents、hooks 和 MCP 保持既有原生映射。
- 保留嵌套支持文件和二进制资产。
- 两个 CLI 别名选择同一个包。
- 重新生成必须保留用户编写的正文。
- 既有行为保持向后兼容。

## 5. CLI 与发现

目标 CLI 必须识别：

```bash
jue apply --adapter codex
jue apply --adapter claude-code
jue apply --adapter codex --adapter claude-code
```

要求：

- 在别名映射中增加 `codex -> ai-jue-adapter-codex`。
- Target ID 只使用 `claude-code`；`claude` 仅作为带迁移诊断的兼容输入。
- 在已知 Adapter 发现中增加 Codex。
- Codex 项目特征包括 `AGENTS.md`、`.agents/skills` 和 `.codex`。
- `--all` 必须包含 Codex，且不得移除现有 Adapter。

## 6. 测试与验收

仅当以下所有证据通过时，才算实现完成。

### 6.1 Adapter 测试

- Codex 单元测试覆盖 §3.1 的每项映射。
- Claude Code 测试覆盖两个 CLI 别名和 §4 契约。
- 测试覆盖空值/缺失的可选集合。
- 测试覆盖嵌套 UTF-8 与 base64 支持文件。
- 测试覆盖无效的支持文件路径穿越。
- 测试证明生成结果确定且幂等。
- 测试必须解析生成的 TOML，而非只检查字符串。

### 6.2 共享矩阵

扩展共享 Adapter 矩阵以包含 Codex，并证明同一个 Canonical fixture 生成：

- 托管 `AGENTS.md`
- Codex Skill 与由 Command 转换的 Skill
- Codex 自定义 Agent TOML
- Codex MCP/config 输出
- Claude Code Skill、Agent、Rule、Hook 与 MCP 输出

现有 Cursor/Gemini/Copilot 断言必须继续通过。

### 6.3 本地 Preset smoke

`scripts/smoke-local-preset.js` 将用户提供的本地 Preset workspace 打包到隔离
消费项目，并验证：

- 生成的 Codex Skill
- 未改变的嵌套 Skill reference
- 生成的 Codex 自定义 Agent
- 根目录 `AGENTS.md`
- 现有 Claude Code 输出

smoke 成功信息必须明确包含 Codex 与 Claude Code。

### 6.4 必需命令

```bash
npx vitest run packages/ai-jue-adapter-codex/test packages/ai-jue-adapter-claude/test packages/ai-jue/test/adapter-matrix.test.ts
npm test
npm run build
npm run check-consistency
npm run smoke:preset-local -- --packages-dir <local-presets-dir> --entry <preset>
git diff --check
```

所有命令必须通过。必须报告并分类 warning；不得仅为得到绿色结果而削弱测试。

## 7. 非目标

- OpenClaw、Hermes、Pi Agent 或任何其他新 Adapter
- 重命名 Canonical 概念
- 重设计现有 Cursor/Gemini/Copilot 输出
- 发布包、上传私有资产、提交、推送或 release
- 通过远程 GitHub URL 访问真实私有 Preset 仓库
- 写入密钥或用户全局 Codex/Claude 配置

## 8. 完成定义

- [ ] 完整 Adapter 合同与实现一致。
- [ ] Codex 与 Claude Code 可通过 `--adapter` CLI 独立选择。
- [x] 本地打包的 Preset 可为两者生成可用的项目原生产物。
- [x] 现有 Adapter 和测试不回退。
- [x] 未增加不受支持的运行时。
- [x] 人工评审仍是最终批准门禁。

2026-07-25 历史实现证据（只证明 Write/project Artifact，不证明读取、安装
动作或原生/运行时确认）：

- Codex / Claude Code / matrix 定向测试：22 项通过
- 真实 CLI：`--adapter codex` 与 `--adapter claude-code` 分别通过
- 全仓测试：23 个文件、144 项测试通过
- 构建：8 项任务通过
- 包一致性：全部包通过
- 隔离的本地打包安装 smoke：Codex 与 Claude Code 通过
- 生成运行时：Codex、Claude Code、Cursor、Gemini、Copilot
- 生产依赖审计：0 个漏洞
- `git diff --check`：通过
