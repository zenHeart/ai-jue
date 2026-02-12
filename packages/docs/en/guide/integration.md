# Integration with Scaffolding Tools

`ai-jue` is designed to be easily integrated into modern frontend development scaffolds and workflows. This document guides you on how to integrate `ai-jue` into your project templates or existing scaffolds.

## Scenario 1: Integrating in Project Templates

If you maintain an internal company project template (e.g., based on Vite or Next.js), you can pre-configure `ai-jue` in the template so that new projects created from it automatically have standardized AI configurations.

### Steps

1. **Install Dependencies**:
    Add `ai-jue` and required presets to the `package.json` of your template project:

    ```json
    {
      "devDependencies": {
        "ai-jue": "^1.0.0",
        "jue-preset-react": "^1.0.0"
      }
    }
    ```

2. **Add Configuration File**:
    Add `ai.config.js` to the template root directory:

    ```javascript
    module.exports = {
      preset: 'react',
      // Other company standard configurations...
    };
    ```

3. **Configure `postinstall` Script (Optional)**:
    To ensure AI configuration files are generated immediately after developers install dependencies, you can add a `postinstall` script to `package.json`:

    ```json
    {
      "scripts": {
        "postinstall": "npx jue apply --all"
      }
    }
    ```

    *Note: Use `postinstall` with caution as it may add unnecessary overhead in CI environments. It is recommended to check the `CI=true` environment variable.*

## Scenario 2: Using `npx` Initialization Script

If you don't maintain a full template but want to provide a one-line command to add AI capabilities to existing projects, you can write a simple initialization script or document.

### Example Script

```bash
#!/bin/bash
# setup-ai.sh

# 1. Install Dependencies
npm install -D ai-jue jue-preset-base

# 2. Initialize Configuration
npx jue init

# 3. Apply Configuration
npx jue apply --all

echo "AI environment configuration complete!"
```

Users just need to run:

```bash
curl -s https://your-company.com/setup-ai.sh | bash
```

## Scenario 3: CI/CD Integration

In some scenarios, you may want to ensure that the AI configuration file used in the CI environment is up-to-date (e.g., if you added generated configuration files to `.gitignore`).

### GitHub Actions Example

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
      
      # Explicitly generate AI configuration (if the build process depends on it)
      - run: npx jue apply --all
      
      - run: npm run build
```

## Best Practices

1. **Version Locking**: When integrating in templates, it is recommended to lock the versions of `ai-jue` and preset packages to ensure consistency across all new projects.
2. **Documentation**: Briefly explain the existence and purpose of AI configuration in the template's `README.md`.
3. **Environment Distinction**: If your preset includes tools for the development environment (such as local debugging helpers), ensure they do not leak into production builds (`ai-jue` by default only generates configuration files and does not affect runtime code, so it is usually safe).
