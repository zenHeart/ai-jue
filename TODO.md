# 当前执行计划

> 更新时间：2026-02-13
> 核心目标：完成适配器对齐优化，并为后续核心能力扩展做准备。

## P0: 修复 Gemini 适配器技能生成 (高优)

- [x] **G1: 实现 `ai-jue-adapter-gemini` 的技能生成逻辑**
  - [x] **G1.1 遍历 `config.skills`**: 迭代 `ai-jue` 配置中定义的所有技能。
  - [x] **G1.2 为每个技能创建目录**: 在 `outputDir/.gemini/skills/{skill_name}/` 下为每个技能创建子目录。
  - [x] **G1.3 生成 `SKILL.md`**: 在技能目录中，创建 `SKILL.md` 文件。
    - [x] 确保将 `ai-jue` 技能的 `content` 写入 `SKILL.md`。
    - [x] 如果 `ai-jue` 技能有 `name`, `description`, `compatibility`, `metadata` 等元数据，确保这些信息以 Gemini CLI 期望的 Markdown Frontmatter 格式包含在 `SKILL.md` 中。
- [x] **G2: 验证 Gemini 技能生成**
  - [x] **G2.1 单元测试**: 编写或修改 `ai-jue-adapter-gemini` 的单元测试，以覆盖技能生成逻辑。
  - [x] **G2.2 集成测试**: 运行 `npm test -- packages/ai-jue/test/adapter-matrix.test.ts` 以验证跨适配器契约。
  - [x] **G2.3 端到端验证**: 运行 `npm run smoke-apply` 进行端到端验证。

## P1: 适配器对齐与优化 (P0完成后启动)

> **说明**: 此任务旨在通过我们刚刚完成的 `adapter-creator` 的“优化模式”来对齐所有现有适配器，确保它们的设计、实现和文档质量达到最新标准。

- [ ] **E1: 对齐 `ai-jue-adapter-cursor`**
  - [ ] **Phase 1 (Research)**: 重新调研 Cursor 最新能力，更新能力矩阵。
  - [ ] **Phase 2 (Design)**: 根据调研结果刷新 `README.md` 与 `README.en.md`。
  - [ ] **Phase 3 (Implement)**: 重构 `src/index.ts` 代码以对齐最新设计。
  - [ ] **Phase 4 (Verify)**: 确保所有单元测试、契约测试和 Smoke Test 通过。

- [ ] **E2: 对齐 `ai-jue-adapter-claude`**
  - [ ] **Phase 1 (Research)**: 重新调研 Claude 最新能力，更新能力矩阵。
  - [ ] **Phase 2 (Design)**: 根据调研结果刷新 `README.md` 与 `README.en.md`。
  - [ ] **Phase 3 (Implement)**: 重构 `src/index.ts` 代码以对齐最新设计。
  - [ ] **Phase 4 (Verify)**: 确保所有单元测试、契约测试和 Smoke Test 通过。

- [ ] **E3: 对齐 `ai-jue-adapter-gemini`**
  - [ ] **Phase 1 (Research)**: 重新调研 Gemini 最新能力，更新能力矩阵。
  - [ ] **Phase 2 (Design)**: 根据调研结果刷新 `README.md` 与 `README.en.md`。
  - [ ] **Phase 3 (Implement)**: 重构 `src/index.ts` 代码以对齐最新设计。
  - [ ] **Phase 4 (Verify)**: 确保所有单元测试、契约测试和 Smoke Test 通过。

- [ ] **E4: 对齐 `ai-jue-adapter-copilot`**
  - [ ] **Phase 1 (Research)**: 重新调研 Copilot 最新能力，更新能力矩阵。
  - [ ] **Phase 2 (Design)**: 根据调研结果刷新 `README.md` 与 `README.en.md`。
  - [ ] **Phase 3 (Implement)**: 重构 `src/index.ts` 代码以对齐最新设计。
  - [ ] **Phase 4 (Verify)**: 确保所有单元测试、契约测试和 Smoke Test 通过。

## P2: 核心能力扩展 (P1完成后启动)

- [ ] **C1 新增 `jue format`（多工具配置规整到 `.ai`）**
  - [ ] **设计**: 输出命令设计：`jue format` 默认探测 `.cursor/.gemini/.claude` 等痕迹并生成迁移计划（dry-run）。
  - [ ] **设计**: 提供执行模式：`--write` 将可收敛内容写入 `.ai`（`AGENTS.md`、`commands/`、`rules/`、`tools/<tool>/`）。
  - [ ] **设计**: 明确冲突策略：来源优先级、重复去重、不可安全转换项标记为“需人工确认”。
  - [ ] **原则**: 保持最小认知负担：不新增概念，仍以 `.ai` 目录和 YAML frontmatter 协议为核心。
  - [ ] **文档**: 先完成使用文档与设计文档，明确迁移路径、边界、风险、回滚方式。
  - [ ] **实现**: 最后实现并补测试，fixture 覆盖 Cursor/Gemini/Claude 现存配置导入场景。

## 实施策略与门禁（执行前必须满足）

- [x] **以终为始**：先完成用户侧使用文档与设计文档（README/docs）补充与修正。
- [x] **评审门禁**：文档先给你确认，通过后才进入代码实施阶段。
- [x] **架构优先**：先设计后编码；复杂变更先输出设计方案。
- [x] **代码规约**：严格遵循 Clean Code + SOLID + KISS + DRY + YAGNI。
- [x] **错误处理**：覆盖异常路径与边界保护，避免静默失败。
- [x] **向后兼容**：默认兼容；若有破坏性变更，必须显式标注并给迁移说明。
- [x] **小步快跑**：每次改动保持最小、可独立验证、可回滚。

---

## 已完成任务 (P0)

- [x] **P0: `adapter-creator` 技能升级 (统一创建与优化工作流)**
  > 分支：`feat/preset-internal-unify-workflow`
  > 目标：将 Skill 升级，使其能够智能区分“创建”和“优化”两种模式，并对两种场景应用相同的最佳实践。

  - [x] **D1: 指令精确性与工具调用增强 (基础)**
    - [x] D1.1 (Research): 明确要求使用 `web_search`。
    - [x] D1.2 (Design): 明确要求使用 `read_file` 和 `write_file`。
    - [x] D1.3 (Implement): 明确要求使用 `write_file` 创建完整文件结构。
    - [x] D1.4 (Verify): 明确要求使用 `run_shell_command` 执行测试。

  - [x] **D2: 自我修正与错误处理循环 (基础)**
    - [x] 设计“测试-失败-分析-修复”的自我修正循环。
    - [x] 为每个人机检查点 (Gate) 增加回退路径。

  - [x] **D3: 产物与元数据自动化 (基础)**
    - [x] 自动将新包添加到 `pnpm-workspace.yaml`。
    - [x] 确保 `package.json` 的 `files` 数组包含所有必要文件。

  - [x] **D4: 最终验证与文档对齐 (基础)**
    - [x] 完成基础改造后的回归测试。
    - [x] 确保 `README.md` 与最新工作流一致。

  - [x] **D5: 新增“优化现有适配器”模式**
    - [x] **D5.1 设计**:
      - [x] 设计模式决策逻辑：当技能被调用时，通过 `list_directory` 检查目标适配器路径 (`packages/ai-jue-adapter-{tool}`) 是否存在，以判断进入“创建模式”还是“优化模式”。
    - [x] **D5.2 修改 Skill**:
      - [x] **创建模式**: 沿用现有流程。
      - [x] **优化模式**: 修改 `Phase 1-3` 的行为：
        - [x] Phase 1 (Research): 除了Web搜索，还需 `read_file` 读取现有的 `README.md` 和 `src/index.ts`，进行差异分析。
        - [x] Phase 2 (Design): 不是从模板创建，而是读取现有 `README.md` 并提出修改建议。
        - [x] Phase 3 (Implement): 不是从零创建，而是读取现有 `src/index.ts` 并应用重构。
      - [x] 确保两种模式共享 `Phase 4 (Verify)` 和三个人机检查点 (Gates)。
    - [x] **D5.3 文档更新**: 在 `jue-preset-internal/README.md` 中补充说明如何使用技能来优化现有适配器。
    - [x] **D5.4 验证**: 增加集成测试，覆盖“优化模式”的完整端到端流程。