# Configuration Normalization (format)

The `jue format` command is used to unify scattered AI tool configurations in your project (such as `.cursor/`, `.gemini/`, `.claude/`, `.github/copilot-instructions.md`, `.trae/`, `.opencode/`, etc.) into a centralized `.ai/` directory.

This is the first step towards "Configuration Self-Cycle": transforming tool-specific configuration assets into universal assets under the `ai-jue` architecture, making them easy to package into presets or share across different tools.

## Use Cases

- **Onboarding Existing Projects**: When you have a project already using Cursor or Claude instructions and want to introduce `ai-jue` for standardized management.
- **Cross-Tool Migration**: Moving Cursor Rules to Gemini or Claude.
- **Asset Accumulation**: Collecting prompts in the project into the `.ai/` directory, ready to be packaged and published as a team preset.

## Basic Usage

By default, `format` runs in **dry-run** mode, scanning and displaying a migration plan without modifying any files:

```bash
npx jue format
```

### Executing Migration

Use the `--write` flag to execute the actual migration:

```bash
npx jue format --write
```

### Forcing Overwrite

If a file already exists at the target location with different content, `jue format` will report a conflict and skip it. Use `--force` to overwrite:

```bash
npx jue format --write --force
```

## Migration Mapping Rules

| Original Path | Target Path (`.ai/`) | Type |
| :--- | :--- | :--- |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` | `AGENTS.md` | Global Instructions |
| `.cursor/rules/*.mdc` | `rules/*.md` | Rule Library |
| `.cursor/commands/*.md`, `.gemini/commands/*.toml` | `commands/*/prompt.md` | Slash Commands |
| `.cursor/skills/*/SKILL.md`, `.gemini/skills/*/SKILL.md` | `skills/*/SKILL.md` | Skills/Plugins |
| `.cursor/agents/*.md`, `.claude/agents/*.md` | `agents/*.md` | Agent Configs |
| `.cursor/hooks.json`, `.opencode/plugin/*.ts` | `hooks/` | Hooks/Interceptors |
| `.cursor/mcp.json`, `.trae/config.json` | `tools/{tool}/settings.json` | Tool Configs |

## Next Steps

After completing the migration, it is recommended to:

1. **Review Files**: Check if the files in the `.ai/` directory meet your expectations.
2. **Link Configuration**: Ensure that your `ai.config.js` includes the local `.ai` directory.
3. **Redistribute**: Run `npx jue apply --all`. `ai-jue` will regenerate (or update) the corresponding configuration files for all detected tools based on the latest assets in `.ai/`.
