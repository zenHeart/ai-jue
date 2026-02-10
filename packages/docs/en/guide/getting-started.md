# Getting Started

## 1. Installation

Install `ai-jue` and the required presets in your project:

```bash
npm install -D ai-jue jue-preset-base
```

## 2. Initialization

Run the initialization command in your project root to create the configuration file:

```bash
npx jue init
```

The interactive process looks like this:

```text
Initializing ai-jue...
Create ai.config.js? (Y/n) Y
Enter preset name (default: base): base
Created ai.config.js
Create .ai directory structure? (Y/n) Y
Created .ai directory with prompts/ and skills/ subdirectories.
```

## 3. Applying Configuration

Run the `apply` command to generate AI tool configuration files based on your settings:

```bash
npx jue apply
```

`ai-jue` will read `ai.config.js`, load presets, and assets from the local `.ai` directory, and generate corresponding configuration files (e.g., `CLAUDE.md`, `.cursor/cli.json`).

## 4. Common Commands

### Check for Updates

Check if installed presets have newer versions:

```bash
npx jue check
```

### Validate Configuration

Validate `ai.config.js` and referenced assets for correctness:

```bash
npx jue validate
```

### Watch Mode

Watch for configuration changes during development and automatically re-apply:

```bash
npx jue apply --watch
```

### Create New Preset

Quickly scaffold a new preset project structure:

```bash
npx jue create-preset my-preset
```

For more detailed configuration, please refer to the [Configuration Guide](./configuration-guide.md).
