---
description: Enforce repository-level governance checks before implementation.
triggers: [/repo-governance]
---
# Repo Governance

在进入实现前，先完成以下治理检查：

1. 对齐 `TODO.md` 当前优先级，确认本次改动属于当前阶段目标。
2. 对齐用户文档与设计文档（README/docs/spec），确认语义与实现目标一致。
3. 明确验证路径（测试/脚本/smoke），确保改动可独立验证与回滚。

输出要求：
- 先给出范围与风险评估，再进入修改。
- 完成后给出验证结果与残余风险。
