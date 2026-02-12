import path from "path";
import { generateMarkdownFile, generateJsonFile } from "ai-jue-core";

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

export async function generate(config: any, outputDir: string): Promise<void> {
  const lang = config.language === "zh" || config.language === "zh-CN" ? "zh" : "en";
  const t = LOCALES[lang];

  // 1. AGENTS context -> root AGENTS.md (Cursor native entry)
  const globalContext = config.context?.global;
  if (typeof globalContext === "string" && globalContext.trim()) {
    generateMarkdownFile(
      path.join(outputDir, "AGENTS.md"),
      `${globalContext.trim()}\n`,
    );
  }

  // 2. Canonical rules -> .cursor/rules/*.mdc
  if (config.rules && typeof config.rules === "object") {
    for (const [ruleName, value] of Object.entries(config.rules)) {
      const rule = value as any;
      const content = typeof rule === "string" ? rule : (rule.content || "");
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

  // 3. Commands -> .cursor/commands/*.md
  if (config.commands && typeof config.commands === "object") {
    for (const [name, value] of Object.entries(config.commands)) {
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

  // 4. Skills -> .cursor/skills/<name>/SKILL.md
  if (config.skills && typeof config.skills === "object") {
    for (const [name, value] of Object.entries(config.skills)) {
      const skill = value as any;
      const skillBody = [
        `# ${name}`,
        "",
        skill.description ? String(skill.description) : t.skillsDesc,
        "",
        String(skill.content || skill.prompt || ""),
        "",
      ].join("\n");
      generateMarkdownFile(path.join(outputDir, ".cursor", "skills", name, "SKILL.md"), skillBody);
    }
  }

  // 5. Hooks -> .cursor/hooks.json
  if (config.hooks && typeof config.hooks === "object") {
    const hooksConfig: Record<string, any> = {};
    for (const [key, value] of Object.entries(config.hooks)) {
      const hookValue = value as any;
      hooksConfig[key] = typeof hookValue === "string" ? hookValue : hookValue?.script;
    }
    generateJsonFile(path.join(outputDir, ".cursor", "hooks.json"), hooksConfig);
  }

  // 6. Agents -> .cursor/agents/*.md
  if (config.agents && typeof config.agents === "object") {
    for (const [name, value] of Object.entries(config.agents)) {
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

  // 7. Generate .cursor/mcp.json
  if (config.mcp && config.mcp.servers) {
    const mcpConfig = {
      mcpServers: config.mcp.servers,
    };
    generateJsonFile(path.join(outputDir, ".cursor", "mcp.json"), mcpConfig);
  }

  // 8. tools.cursor passthrough -> .cursor/settings.json
  if (config.tools?.cursor && typeof config.tools.cursor === "object") {
    generateJsonFile(path.join(outputDir, ".cursor", "settings.json"), config.tools.cursor);
  }
}
