/**
 * Tool configuration detection patterns
 * Maps tool directories/files to their respective adapters
 */
export const TOOL_PATTERNS: Record<string, { adapter: string; files: string[] }> = {
  cursor: {
    adapter: "ai-jue-adapter-cursor",
    files: [
      ".cursor/rules/*.mdc",
      ".cursor/commands/*.md",
      ".cursor/skills/*/SKILL.md",
      ".cursor/hooks.json",
      ".cursor/mcp.json",
      ".cursor/agents/*.md",
      ".cursor/settings.json",
      "AGENTS.md",
    ],
  },
  gemini: {
    adapter: "ai-jue-adapter-gemini",
    files: [
      ".gemini/settings.json",
      ".gemini/commands/**/*.toml",
      ".gemini/skills/*/SKILL.md",
      "GEMINI.md",
      "AGENTS.md",
    ],
  },
  claude: {
    adapter: "ai-jue-adapter-claude",
    files: [
      ".claude/rules/*.md",
      ".claude/skills/*/SKILL.md",
      ".claude/commands/*.md",
      ".claude/agents/*.md",
      ".claude/settings.json",
      "CLAUDE.md",
      ".mcp.json",
      "AGENTS.md",
    ],
  },
  copilot: {
    adapter: "ai-jue-adapter-copilot",
    files: [
      ".github/copilot-instructions.md",
      ".github/copilot-settings.json",
      ".github/instructions/*.instructions.md",
      ".github/prompts/*.prompt.md",
    ],
  },
  trae: {
    adapter: "ai-jue-adapter-claude",
    files: [
      ".trae/rules/*.md",
      ".trae/skills/*/SKILL.md",
      ".trae/config.json",
      ".trae/agents/*.md",
    ],
  },
  opencode: {
    adapter: "ai-jue-adapter-claude",
    files: [".opencode/config.json", ".opencode/plugin/*.ts"],
  },
};
