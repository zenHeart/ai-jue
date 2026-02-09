# Trusted Publishing 配置与验证报告

## 1. 概述
本报告记录了为 `ai-jue` Monorepo 项目配置 npm Trusted Publishing 的全过程。该机制利用 OpenID Connect (OIDC) 实现 GitHub Actions 与 npm 的无密钥安全认证。

## 2. 项目结构分析 (Monorepo)
- **仓库类型**: Monorepo (npm workspaces / turbo)
- **包结构**: `packages/*` (e.g., `ai-jue`, `ai-jue-core`, `jue-preset-react`)
- **发布策略**: 批量发布 (Batch Release)，基于批量 Tag 触发。

### 官方文档分析结论
1.  **Monorepo 支持**: 支持，但**必须为每个子包单独配置**。
    - npm 目前不支持在 Scope 或 Root 级别统一配置 Trust 关系。
    - 每个 `package.json` 中的 `name` 对应的 npm package 页面都需要单独添加 Trusted Publisher。
2.  **工作流复用**: 所有包共用同一个 GitHub Actions Workflow 文件 (`.github/workflows/release.yml`) 完成批量发布。
3.  **首次发布限制**: 如果是全新的包（从未在 npm 发布过），无法配置 Trusted Publisher。必须先手动发布 `v0.0.1` 或 `v1.0.0`，产生 package 页面后，才能在 Settings 中添加配置。

## 3. 配置实施详情

### 3.1 GitHub Actions Workflow
已创建/更新 `.github/workflows/release.yml`：
- **触发器**: `on.push.tags: ['release-batch@v*']` (批量发布入口)
- **权限**: 
  ```yaml
  permissions:
    id-token: write  # 关键：申请 OIDC Token
    contents: write  # 用于创建 GitHub Release
  ```
- **发布命令**: 解析 `release-note.md` 后批量发布（幂等检测 + 发布 tarball）。

### 3.2 批量发布脚本
批量发布在 CI 内拆分为两部分：
1.  解析 `release-note.md`，得到待发布包清单与版本（并验证与 `package.json` 一致）。
2.  在构建完成后为每个包打包 tarball，并在发布阶段执行：
    - `npm view <pkg>@<version>` 幂等检测：已存在则跳过
    - `npm publish <tarball> --access public` 发布到 npm registry

## 4. 验证与测试流程 (验证报告)

### 4.1 代码级验证 (Local Simulation)
- [x] **Tag 解析逻辑**: 测试脚本能正确解析 `ai-jue@v1.0.1` 为 `name: ai-jue`, `version: 1.0.1`。
- [x] **路径查找**: 确认脚本能通过 `packages/*/package.json` 找到正确目录。
- [x] **版本校验**: 模拟版本不匹配场景，脚本应抛出错误。

### 4.2 npm 网站配置指南 (需手动执行)
**请务必对每个包执行以下步骤：**

1.  登录 [npmjs.com](https://www.npmjs.com/)。
2.  进入包设置页 (e.g., `https://www.npmjs.com/package/ai-jue/settings`)。
3.  找到 **Publishing Access** 区域。
4.  点击 **Connect to GitHub**。
5.  配置如下：
    - **Repository**: `zenHeart/ai-jue` (您的 GitHub 仓库)
    - **Workflow filename**: `release.yml` (注意：只填文件名，不要路径)
    - **Environment**: (留空)
6.  重复上述步骤，为 `ai-jue-core`, `jue-preset-react` 等所有子包配置。

### 4.3 最终发布验证 (End-to-End)
1.  本地运行发布脚本生成版本变更、`release-note.md`、包 Tag 与批量 Tag：
    ```bash
    npm run release
    ```
2.  观察 GitHub Actions `Release` 工作流：
    - 预期：`prepare` -> `publish(matrix)` -> `github_release` 全部成功。
3.  检查 npm 页面：对应包版本已发布且与 `release-note.md` 一致。

## 5. 最佳实践建议
1.  **权限最小化**: Workflow 仅申请必要的 `id-token: write` 权限。
2.  **版本一致性**: 严格遵守 `release-note.md` 与 `package.json` 版本一致，利用脚本进行自动化校验。
4.  **新包处理**: 对于 Monorepo 中新增的包，先手动发布第一版，再配置 Trust，最后合入 Master。
