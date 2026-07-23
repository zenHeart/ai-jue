import path from "path";
import {
  generateMarkdownFile,
  generateJsonFile,
  getAssetText,
  getRecordEntries,
  writeSupportFiles,
} from "ai-jue-core";

const LOCALES: Record<string, any> = {
  zh: {
    agentsTitle: "全局上下文与智能体 (Global Context & Agents)",
    promptTitle: "提示词 (Prompt)",
    skillsTitle: "技能 (Skills)",
    skillsDesc: "你可以使用以下技能：",
    commandsTitle: "指令 (Commands)",
    commandsDesc: "当用户使用特定触发词时，请遵循这些规则：",
    triggersLabel: "触发词:",
    actionLabel: "执行动作:",
    hooksTitle: "工作流钩子 (Workflow Hooks)",
    hooksDesc: "请遵循以下工作流规则：",
    preCommitPrefix: "提交代码前，请确保运行：",
  },
  en: {
    agentsTitle: "Global Context & Agents",
    promptTitle: "Prompt",
    skillsTitle: "Skills",
    skillsDesc: "You have access to the following skills:",
    commandsTitle: "Commands",
    commandsDesc: "Follow these rules when the user uses specific triggers:",
    triggersLabel: "Triggers:",
    actionLabel: "Action:",
    hooksTitle: "Workflow Hooks",
    hooksDesc: "Please follow these workflow rules:",
    preCommitPrefix: "Before committing changes, please ensure you run:",
  },
};

/**
 * Generate Cursor ignore files (.cursorignore, .cursorindexingignore)
 * Uses .gitignore syntax
 */
function generateIgnoreFiles(
  cursorConfig: any,
  outputDir: string,
): void {
  if (!cursorConfig || typeof cursorConfig !== "object") return;

  // Generate .cursorignore - blocks AI access
  if (Array.isArray(cursorConfig.ignore) && cursorConfig.ignore.length > 0) {
    const content = cursorConfig.ignore.join("\n") + "\n";
    generateMarkdownFile(path.join(outputDir, ".cursorignore"), content);
  }

  // Generate .cursorindexingignore - excludes from indexing only
  if (Array.isArray(cursorConfig.indexingIgnore) && cursorConfig.indexingIgnore.length > 0) {
    const content = cursorConfig.indexingIgnore.join("\n") + "\n";
    generateMarkdownFile(path.join(outputDir, ".cursorindexingignore"), content);
  }
}

/**
 * Generate Cursor rules (.cursor/rules/*.mdc)
 * Supports description, globs, alwaysApply frontmatter fields
 */
function generateRules(
  rules: Record<string, any>,
  outputDir: string,
): void {
  if (!rules || typeof rules !== "object") return;

  for (const [ruleName, value] of getRecordEntries(rules)) {
    const rule = value as any;
    const content = getAssetText(rule, ["content", "prompt"]);
    if (!content || !String(content).trim()) continue;

    const description =
      typeof rule.description === "string" && rule.description.trim()
        ? rule.description.trim()
        : `ai-jue generated rule: ${ruleName}`;
    const alwaysApply =
      typeof rule.alwaysApply === "boolean" ? rule.alwaysApply : true;
    const globs = Array.isArray(rule.globs) ? rule.globs : undefined;

    const frontmatter = [
      "---",
      `description: ${description}`,
      `alwaysApply: ${alwaysApply}`,
      ...(globs && globs.length > 0 ? [`globs: [${globs.map((g: string) => `"${g}"`).join(", ")}]`] : []),
      "---",
      "",
    ].join("\n");

    generateMarkdownFile(
      path.join(outputDir, ".cursor", "rules", `${ruleName}.mdc`),
      `${frontmatter}${String(content).trim()}\n`,
    );
  }
}

/**
 * Generate Cursor custom commands (.cursor/commands/*.md)
 */
function generateCommands(
  commands: Record<string, any>,
  outputDir: string,
  lang: string,
): void {
  if (!commands || typeof commands !== "object") return;

  const t = LOCALES[lang];

  for (const [name, value] of getRecordEntries(commands)) {
    const cmd = value as any;
    if (!cmd?.prompt) continue;

    const triggers = Array.isArray(cmd.triggers) && cmd.triggers.length > 0
      ? cmd.triggers.join(", ")
      : `/${name}`;

    const body = [
      `# /${name}`,
      "",
      cmd.description ? String(cmd.description) : "",
      "",
      `## ${t.actionLabel}`,
      "",
      String(cmd.prompt),
      "",
      `## ${t.triggersLabel}`,
      "",
      triggers,
      "",
    ].join("\n");

    generateMarkdownFile(path.join(outputDir, ".cursor", "commands", `${name}.md`), body);
  }
}

/**
 * Generate Cursor skills (.cursor/skills/<name>/SKILL.md)
 */
function generateSkills(
  skills: Record<string, any>,
  outputDir: string,
  lang: string,
): void {
  if (!skills || typeof skills !== "object") return;

  const t = LOCALES[lang];

  for (const [name, value] of getRecordEntries(skills)) {
    const skill = value as any;
    const skillBody = [
      `# ${name}`,
      "",
      skill.description ? String(skill.description) : t.skillsDesc,
      "",
      String(skill.content || skill.prompt || ""),
      "",
    ].join("\n");

    const skillDir = path.join(outputDir, ".cursor", "skills", name);
    generateMarkdownFile(path.join(skillDir, "SKILL.md"), skillBody);
    writeSupportFiles(path.join(skillDir, "references"), skill.references);
    writeSupportFiles(path.join(skillDir, "scripts"), skill.scripts);
    writeSupportFiles(path.join(skillDir, "assets"), skill.assets);
  }
}

/**
 * Generate Cursor hooks (.cursor/hooks.json)
 * Supports all event types: sessionStart, preToolUse, postTool, etc.
 */
function generateHooks(
  hooks: Record<string, any>,
  outputDir: string,
): void {
  if (!hooks || typeof hooks !== "object") return;

  const hooksConfig: Record<string, any> = {};

  for (const [key, value] of getRecordEntries(hooks)) {
    const hookValue = value as any;

    // Support both simple string format and complex object format
    if (typeof hookValue === "string") {
      hooksConfig[key] = hookValue.trim();
    } else if (hookValue && typeof hookValue === "object") {
      // Complex format with matcher, script, async, timeout
      const script = String(hookValue.script || "").trim();
      if (!script) continue;

      hooksConfig[key] = {
        script,
        ...(hookValue.matcher ? { matcher: hookValue.matcher } : {}),
        ...(hookValue.async !== undefined ? { async: hookValue.async } : {}),
        ...(hookValue.timeout ? { timeout: hookValue.timeout } : {}),
      };
    }
  }

  if (Object.keys(hooksConfig).length > 0) {
    generateJsonFile(path.join(outputDir, ".cursor", "hooks.json"), hooksConfig);
  }
}

/**
 * Generate Cursor agents (.cursor/agents/*.md)
 */
function generateAgents(
  agents: Record<string, any>,
  outputDir: string,
): void {
  if (!agents || typeof agents !== "object") return;

  for (const [name, value] of getRecordEntries(agents)) {
    const agent = value as any;
    const skillRefs = Array.isArray(agent.skills) ? agent.skills : [];

    const agentDoc = [
      `# ${name}`,
      "",
      agent.description ? String(agent.description) : "",
      "",
      String(agent.prompt || ""),
      "",
      skillRefs.length > 0 ? "## Skills" : "",
      skillRefs.length > 0 ? skillRefs.map((s: string) => `- ${s}`).join("\n") : "",
      "",
    ].join("\n");

    generateMarkdownFile(path.join(outputDir, ".cursor", "agents", `${name}.md`), agentDoc);
  }
}

/**
 * Generate MCP configuration (.cursor/mcp.json)
 * Supports: command, args, env, disabled, autoApprove
 */
function generateMcpConfig(
  mcp: { servers?: Record<string, any> },
  outputDir: string,
): void {
  if (!mcp?.servers || typeof mcp.servers !== "object") return;

  const mcpConfig: Record<string, any> = { mcpServers: {} };

  for (const [name, server] of getRecordEntries(mcp.servers)) {
    if (!server || typeof server !== "object") continue;

    const serverConfig: Record<string, any> = {};

    // Required fields
    if (server.command) serverConfig.command = server.command;
    if (Array.isArray(server.args)) serverConfig.args = server.args;

    // Optional fields
    if (server.env && typeof server.env === "object") {
      serverConfig.env = server.env;
    }
    if (typeof server.disabled === "boolean") {
      serverConfig.disabled = server.disabled;
    }
    if (Array.isArray(server.autoApprove)) {
      serverConfig.autoApprove = server.autoApprove;
    }

    // Only add if has required command field
    if (serverConfig.command) {
      mcpConfig.mcpServers[name] = serverConfig;
    }
  }

  if (Object.keys(mcpConfig.mcpServers).length > 0) {
    generateJsonFile(path.join(outputDir, ".cursor", "mcp.json"), mcpConfig);
  }
}

/**
 * Main entry point for Cursor adapter
 * Converts ai-jue config to Cursor native format
 */
export async function generate(config: any, outputDir: string): Promise<void> {
  const lang = config.language === "zh" || config.language === "zh-CN" ? "zh" : "en";

  // 1. AGENTS context -> root AGENTS.md (Cursor native entry)
  const globalContext = config.context?.global;
  if (typeof globalContext === "string" && globalContext.trim()) {
    generateMarkdownFile(
      path.join(outputDir, "AGENTS.md"),
      `${globalContext.trim()}\n`,
    );
  }

  // Get cursor-specific config from tools.cursor
  const cursorConfig = config.tools?.cursor;

  // 2. Generate ignore files (.cursorignore, .cursorindexingignore)
  generateIgnoreFiles(cursorConfig, outputDir);

  // 3. Generate rules (.cursor/rules/*.mdc)
  if (config.rules) {
    generateRules(config.rules, outputDir);
  }

  // 4. Generate commands (.cursor/commands/*.md)
  if (config.commands) {
    generateCommands(config.commands, outputDir, lang);
  }

  // 5. Generate skills (.cursor/skills/<name>/SKILL.md)
  if (config.skills) {
    generateSkills(config.skills, outputDir, lang);
  }

  // 6. Generate hooks (.cursor/hooks.json)
  if (config.hooks) {
    generateHooks(config.hooks, outputDir);
  }

  // 7. Generate agents (.cursor/agents/*.md)
  if (config.agents) {
    generateAgents(config.agents, outputDir);
  }

  // 8. Generate MCP config (.cursor/mcp.json)
  if (config.mcp) {
    generateMcpConfig(config.mcp, outputDir);
  }

  // 9. tools.cursor passthrough -> .cursor/settings.json
  // Exclude ignore/indexingIgnore as they're handled separately
  if (cursorConfig && typeof cursorConfig === "object") {
    const settingsConfig = { ...cursorConfig };
    delete settingsConfig.ignore;
    delete settingsConfig.indexingIgnore;

    if (Object.keys(settingsConfig).length > 0) {
      generateJsonFile(path.join(outputDir, ".cursor", "settings.json"), settingsConfig);
    }
  }
}
