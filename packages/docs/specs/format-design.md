# Design Doc: `jue format` Configuration Normalization

## 1. Motivation

Currently, AI tool configurations are scattered across various directories (`.cursor/`, `.gemini/`, `.claude/`, etc.). This makes it difficult to:
1. Maintain a single source of truth for prompts and rules.
2. Share assets between different AI tools.
3. Package project-specific assets into reusable presets.

`jue format` solves this by normalizing these tool-specific configurations into a canonical `.ai/` directory structure.

## 2. Migration Paths

The migration engine detects tool-specific patterns and maps them to `.ai/` subdirectories:

| Category | Source Examples | Target Path | Notes |
| :--- | :--- | :--- | :--- |
| **Agents** | `AGENTS.md`, `CLAUDE.md`, `.cursor/agents/*.md` | `.ai/AGENTS.md` or `.ai/agents/*.md` | Root files map to global `AGENTS.md` |
| **Rules** | `.cursor/rules/*.mdc`, `.trae/rules/*.md` | `.ai/rules/*.md` | Strips tool-specific extensions |
| **Commands** | `.cursor/commands/*.md`, `.gemini/commands/*.toml` | `.ai/commands/{name}/prompt.md` | Normalizes to `prompt.md` in a named folder |
| **Skills** | `.gemini/skills/*/SKILL.md` | `.ai/skills/*/SKILL.md` | Preserves folder structure |
| **Hooks** | `.cursor/hooks.json`, `.opencode/plugin/*.ts` | `.ai/hooks/` | Maps plugins to the hooks directory |
| **Config** | `.cursor/mcp.json`, `.trae/config.json` | `.ai/tools/{tool}/settings.json` | Tool-specific configuration preservation |

Canonical note:

- migration output should preserve the canonical capability model shape expected by core normalize/adapter mapping
- structured hook metadata should not be flattened during migration unless the source format already lost that structure

## 3. Conflict Strategy

When a file already exists in the `.ai/` directory:

1. **Content Check**: If the source content is identical to the target content, the item is marked as `migrated` and skipped silently.
2. **Standard Mode**: If content differs, `jue format` reports a `conflict` and skips the file. The user is notified to resolve it manually or use `--force`.
3. **Force Mode (`--force`)**: Overwrites the target file with the source content.
4. **Merge Strategy (Future)**: For structured files like `AGENTS.md`, we might implement smart merging (appending unique instructions) in future versions.

## 4. Risks & Mitigation

- **Data Loss**: `jue format` does NOT delete source files. It only copies/transforms them to `.ai/`.
- **Misconfiguration**: Users might end up with duplicate configurations if they don't update `ai.config.js` or run `jue apply`.
- **Mitigation**:
    - Default `dry-run` mode ensures users see what will happen.
    - Migration markers (`<!-- Migrated from ... -->`) are added to files to track origin.
    - Clear "Next Steps" instructions after migration.

## 5. Rollback

Since `jue format` only creates/updates files in `.ai/` and does not touch source files:
- To "rollback", simply delete the `.ai/` directory (or specific files within it).
- As long as the original `.cursor/`, `.gemini/`, etc. folders are intact, the tools will continue to work as before.
