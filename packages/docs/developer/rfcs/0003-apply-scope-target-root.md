# RFC-0003：apply 作用域与目标根

> 状态：Implemented
> 关联：[Issue #14](https://github.com/zenHeart/ai-jue/issues/14)
> 官方依据（2026-08-18 核验）：Claude Code
> [Settings](https://code.claude.com/docs/en/settings)、
> [Memory](https://code.claude.com/docs/en/memory)、
> [Skills](https://code.claude.com/docs/en/skills)、
> [MCP](https://code.claude.com/docs/en/mcp)

## 背景

`jue apply` 当前把 `process.cwd()` 同时用作配置发现、Adapter 发现和 Artifact
写入根。用户只有在家目录执行命令，才能偶然得到 `~/.claude`、`~/.codex`
一类跨项目文件；`targets.*.scope = "user"` 虽能通过配置 schema，却会在写入前
被拒绝。

主流工具把来源与安装位置分开：Git 通过显式 scope 选择仓库或用户配置，npm
通过 local/global 模式选择安装前缀，Claude Code 则为用户与项目能力定义不同
路径。Jue 采用同一心智模型：配置仍从真实项目解析，`apply` 作用域显式选择
Artifact 的安装边界。

## 目标

1. `jue apply` 支持 `project` 与 `user` 两个显式作用域，默认保持 `project`。
2. Core 解析并授权写入根，Adapter 只生成根内的目标原生相对路径。
3. `--dry-run`、`--check`、apply、回滚和确认共享同一目标上下文。
4. Claude Code 首先完整支持用户作用域；其他 Adapter 显式声明支持范围。
5. 旧 Extension 在未声明能力时保持 project-only，不能因升级获得家目录写权限。

## 非目标

- `local`、system、enterprise、managed 或组织级 apply 作用域。
- 任意绝对输出目录参数。
- 将 Plugin、Bundle 或 skill-plugin 安装到用户配置。
- 定义覆盖目标 Agent 原生规则的 Jue 优先级。
- 根据目录相似性推断某个 Adapter 支持用户作用域。

## 候选方案

### A. 继续用 `cd ~` 表示全局

实现成本最低，但配置根、项目身份与输出根仍然耦合，dry-run 无法从真实配置项目
预览用户变更，且权限意图不可审计。

### B. 增加任意 `--output-dir`

路径灵活，但把目标 Agent 布局和绝对路径授权交给用户或第三方 Extension，扩大
误写与目录逃逸风险，也没有表达 project/user 的产品语义。

### C. 显式作用域 + Core 授权根 + Adapter 原生布局

CLI/config 只选择 `project | user`；Core 将其解析为受控根；Adapter 根据作用域
生成目标原生相对路径。该方案复用 Artifact、Adapter 和现有执行器，不增加第七个
稳定概念。

## 决策

采用方案 C。apply 作用域是 Artifact 的转换与执行上下文，不进入 Canonical DSL。

### 选择优先级

每个已选择 Adapter 独立解析：

1. CLI `--scope`
2. `targets.<adapter>.scope`
3. 默认 `project`

```bash
jue apply --adapter claude --scope project
jue apply --adapter claude --scope user
jue apply --all --scope user --dry-run
```

```js
export default {
  presets: ["ai-assets"],
  targets: {
    claude: { scope: "user" },
    codex: { scope: "project" }
  }
};
```

### 根与路径

| 值 | 职责 |
| --- | --- |
| 配置根 | 发现项目配置、包、lock 和项目 footprint |
| apply 作用域 | `project` 或 `user` |
| Artifact 根 | Core 授权的项目根或 `os.homedir()` |
| Artifact 路径 | Adapter 生成的根内安全相对路径 |

Core 不向 Extension 提供任意绝对目标。测试通过依赖注入或隔离环境替换用户家目录。
目标产品环境变量若要把配置根定向到家目录之外，需要独立 RFC。

### Extension 合同

```ts
type ApplyScope = "project" | "user";

interface ArtifactTargetContext {
  scope: ApplyScope;
  artifactRoot: string;
  projectRoot: string; // 兼容窗口：恒等于 artifactRoot
}

interface Adapter {
  supportedScopes?: readonly ApplyScope[]; // 缺省为 ["project"]
}
```

`artifactRoot` 是新代码使用的准确名称。兼容窗口内 Core 同时传入
`projectRoot === artifactRoot`；旧 Adapter 缺少 `supportedScopes` 时只能用于
project。每个 `ArtifactChange` 必须声明本次选择的 scope，Core 在执行前验证
scope 一致性、相对路径和解析后的根包含关系，不替 Adapter 静默改写 scope。

### Artifact kind 组合

作用域决定原生配置安装边界；Artifact kind 决定产物形态。当前 `project` 与
`workspace` kind 名保留以兼容已有配置，其 native 形态可由支持该作用域的
Adapter 映射到用户根。

| Artifact family | project scope | user scope |
| --- | --- | --- |
| native `project` / `workspace` | 支持 | Adapter 显式声明后支持 |
| Plugin / compatible-bundle / skill-plugin | 支持现有导出路径 | 预检失败 |

Plugin 的安装和启用属于目标原生生命周期，不由 `scope=user` 推断。

### Claude Code 映射

| Capability | project | user |
| --- | --- | --- |
| skills | `.claude/skills/` | `~/.claude/skills/` |
| agents | `.claude/agents/` | `~/.claude/agents/` |
| commands | `.claude/commands/` | `~/.claude/commands/` |
| rules | `.claude/rules/` | `~/.claude/rules/` |
| context | `CLAUDE.md` | `~/.claude/CLAUDE.md` |
| settings/hooks | `.claude/settings.json` | `~/.claude/settings.json` |
| MCP | `.mcp.json` | `~/.claude.json` |

上述路径来自 2026-08-18 核验的 Claude Code 官方文档。Windows 中 `~` 解析为
`%USERPROFILE%`。Jue 不定义 project/user 的合并优先级；Claude Code 的原生
加载顺序保持权威。

### MCP 内层 scope

一次 Adapter apply 只允许一个 Artifact 根：

- 省略 `mcp.servers.<name>.scope` 时继承本次 apply scope；
- 显式 `project` 或 `user` 必须与本次 apply scope 一致；
- 不一致或 `local` 在写入前失败，并报告 server 名与两个 scope；
- Adapter 不得静默跳过不匹配的 server。

### Adapter 选择与批处理

显式 `--adapter` 与 `--all` 不变。配置中的 target 可作为明确选择；project 模式
可继续使用项目 footprint 自动发现。user 模式没有明确选择时，只检查 Adapter
声明的用户 footprint；非交互环境无法得到明确目标时失败并给出指引。

`--all` 保持每个 Adapter 内原子，而不是跨 Adapter 事务：一个 Adapter 失败后
继续报告后续 Adapter，最终返回聚合非零状态。

## 安全

1. Core 在调用 Adapter 前解析 scope 与 Artifact 根。
2. 每个 change 在 plan、check、apply 前执行结构与 scope 校验。
3. 绝对路径、`..`、符号链接逃逸和解析后位于根外的路径全部阻塞。
4. managed-block 与 merged-keys 的所有权语义在用户文件中保持不变。
5. plan 与 execution 使用同一根；中途失败按 Adapter 批次回滚。
6. dry-run/check 对目标文件零写入。
7. user scope 是明确的根授权，高风险 change 仍经过现有逐项授权门禁。

## 兼容与迁移

- 无 flag、无 target scope 的现有命令保持 project 行为。
- `targets.*.scope` 的公开值收敛为 `project | user`；MCP 自身的 `local` 语义不变。
- 旧 Adapter 不声明 `supportedScopes` 时继续 project-only。
- `projectRoot` 在一个兼容窗口保留；内置 Adapter 与文档改用 `artifactRoot`。
- 从家目录执行且未指定 scope 的命令仍按 project 解释；推荐工作流改为在配置项目
  执行 `--scope user`。

## 验收标准

1. CLI、target config 与默认值按冻结优先级解析，非法 scope 在写入前失败。
2. project 输出与当前路径和字节保持兼容。
3. Claude user dry-run 从项目配置预览用户路径，真实 apply 可被无关项目的新会话发现。
4. user context、settings/hooks 与 MCP 使用官方路径，不依赖 `cwd = home`。
5. scope mismatch、绝对路径、目录穿越和符号链接逃逸均有失败测试。
6. 每个内置 Adapter 声明 project-only 或 project+user；`--all` 聚合失败但继续执行。
7. macOS/Linux 临时 home 与授权 Windows 主机的 `%USERPROFILE%` 路径均验证。
8. 中英文 Reference、Guide、Agent profile、实现状态与本 RFC 同步。

## 未决问题

- Codex、Cursor、OpenClaw 与 Hermes 的用户原生映射分别需要官方证据和独立验收；
  在此之前保持 project-only。
- 家目录之外的 target-native 配置根只在独立授权模型获批后进入合同。
