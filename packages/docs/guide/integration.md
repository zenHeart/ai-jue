# 与脚手架工具集成 (Integration with Scaffolding Tools)

`ai-jue` 设计为可以轻松集成到现代前端开发的脚手架和工作流中。本文档将指导你如何将 `ai-jue` 集成到你的项目模板或现有脚手架中。

## 场景 1: 在项目模板中集成

如果你维护着一个公司内部的项目模板（例如基于 Vite 或 Next.js 的模板），你可以将 `ai-jue` 预先配置在模板中，这样通过模板创建的新项目将自动具备标准化的 AI 配置。

### 步骤

1.  **安装依赖**:
    在你的模板项目的 `package.json` 中添加 `ai-jue` 和所需的预设：

    ```json
    {
      "devDependencies": {
        "ai-jue": "^1.0.0",
        "jue-preset-react": "^1.0.0"
      }
    }
    ```

2.  **添加配置文件**:
    在模板根目录添加 `ai.config.js`：

    ```javascript
    module.exports = {
      preset: 'react',
      // 其他公司标准配置...
    };
    ```

3.  **配置 `postinstall` 脚本 (可选)**:
    为了确保开发者安装依赖后立即生成 AI 配置文件，你可以在 `package.json` 中添加 `postinstall` 脚本：

    ```json
    {
      "scripts": {
        "postinstall": "npx jue apply"
      }
    }
    ```

    *注意：使用 `postinstall` 需谨慎，因为它可能会在 CI 环境中增加不必要的开销。建议结合 `CI=true` 环境变量进行判断。*

## 场景 2: 使用 `npx` 初始化脚本

如果你没有维护完整的模板，而是希望提供一个单行命令来为现有项目添加 AI 能力，可以编写一个简单的初始化脚本或文档。

### 示例脚本

```bash
#!/bin/bash
# setup-ai.sh

# 1. 安装依赖
npm install -D ai-jue jue-preset-base

# 2. 初始化配置
npx jue init

# 3. 应用配置
npx jue apply

echo "AI 环境配置完成！"
```

用户只需运行：
```bash
curl -s https://your-company.com/setup-ai.sh | bash
```

## 场景 3: CI/CD 集成

在某些场景下，你可能希望确保 CI 环境中使用的 AI 配置文件是最新的（例如，如果你将生成的配置文件加入了 `.gitignore`）。

### GitHub Actions 示例

```yaml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      
      # 显式生成 AI 配置（如果构建过程依赖它）
      - run: npx jue apply
      
      - run: npm run build
```

## 最佳实践

1.  **版本锁定**: 在模板中集成时，建议锁定 `ai-jue` 和预设包的版本，以确保所有新项目的一致性。
2.  **提供文档**: 在模板的 `README.md` 中简要说明 AI 配置的存在及其用途。
3.  **区分环境**: 如果你的预设包含针对开发环境的工具（如本地调试 helper），请确保它们不会泄露到生产构建中（`ai-jue` 默认只生成配置文件，不影响运行时代码，通常是安全的）。
