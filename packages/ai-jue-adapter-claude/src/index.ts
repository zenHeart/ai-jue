import path from "path";
import { generateMarkdownFile, generateJsonFile } from "ai-jue-core";

const LOCALES: Record<string, any> = {
  zh: {
    contextTitle: "上下文与规则",
    skillsTitle: "技能指令 (Skills)",
    commandsTitle: "自定义指令",
    hooksTitle: "工作流钩子",
    skillDescDefault: "执行技能",
    commandDescDefault: "执行指令",
    hookPrefix: "请确保在继续之前执行",
  },
  en: {
    contextTitle: "Context & Rules",
    skillsTitle: "Slash Commands (Skills)",
    commandsTitle: "Custom Commands",
    hooksTitle: "Workflow Hooks",
    skillDescDefault: "Execute skill",
    commandDescDefault: "Execute command",
    hookPrefix: "Please ensure to run",
  },
};

export async function generate(config: any, outputDir: string): Promise<void> {
  const lang =
    config.language === "zh" || config.language === "zh-CN" ? "zh" : "en";
  const t = LOCALES[lang];

  let content = "";
  const globalContext = config.context?.global;

  // 1. Inject AGENTS.md content first (Global Context)
  if (globalContext) {
    content += `# ${t.contextTitle}\n\n${globalContext}\n\n`;
  }

  // 2. Add specific Claude prompt
  if (config.prompts?.claude?.content) {
    content += `\n${config.prompts.claude.content}\n\n`;
  }

  // 2.1 Degrade canonical rules into CLAUDE.md when no dedicated rules directory is emitted
  if (config.rules && typeof config.rules === "object") {
    const rulesTitle = lang === "zh" ? "规则 (Rules)" : "Rules";
    content += `## ${rulesTitle}\n\n`;
    for (const [key, value] of Object.entries(config.rules)) {
      const rule = value as any;
      const ruleContent = typeof rule === "string" ? rule : rule.content || "";
      if (!String(ruleContent).trim()) continue;
      content += `### ${key}\n${String(ruleContent).trim()}\n\n`;
    }
  }

  // 3. Convert Skills to Slash Commands
  if (config.skills) {
    content += `## ${t.skillsTitle}\n\n`;
    for (const [key, value] of Object.entries(config.skills)) {
      const skill = value as any;
      // Claude Code format: /command - description
      content += `/skill-${key}: ${skill.description || t.skillDescDefault}\n`;
      content += `  Prompt: ${skill.content || skill.prompt || ""}\n\n`;
    }
  }

  // 4. Convert Commands to Slash Commands
  if (config.commands) {
    content += `## ${t.commandsTitle}\n\n`;
    for (const [key, value] of Object.entries(config.commands)) {
      const cmd = value as any;
      content += `/${key}: ${cmd.description || t.commandDescDefault}\n`;
      content += `  Prompt: ${cmd.prompt}\n\n`;
    }
  }

  // 5. Hooks Documentation
  if (config.hooks) {
    content += `## ${t.hooksTitle}\n\n`;
    for (const [key, value] of Object.entries(config.hooks)) {
      const hookValue = value as any;
      const script =
        typeof hookValue === "string" ? hookValue : hookValue.script;
      content += `- **${key}**: ${t.hookPrefix} \`${script}\`.\n`;
    }
  }

  // 6. Agents Documentation
  if (config.agents) {
    const agentsTitle = lang === "zh" ? "代理 (Agents)" : "Agents";
    content += `## ${agentsTitle}\n\n`;
    for (const [key, value] of Object.entries(config.agents)) {
      const agent = value as any;
      content += `### ${key}\n${agent.prompt || ""}\n\n`;
      const agentSkillRefs = Array.isArray(agent.skills) ? agent.skills : [];
      if (agentSkillRefs.length > 0 && config.skills) {
        for (const skillKey of agentSkillRefs) {
          const skill = config.skills[skillKey];
          if (skill) {
            content += `- **${skillKey}**: ${skill.description || ""}\n`;
          }
        }
        content += "\n";
      }
    }
  }

  if (content.trim()) {
    const filePath = path.join(outputDir, "CLAUDE.md");
    generateMarkdownFile(filePath, content);
  }

  // 2. Generate .mcp.json (Claude Code Project Scope)
  if (config.mcp && config.mcp.servers) {
    const mcpConfig = {
      mcpServers: config.mcp.servers,
    };
    generateJsonFile(path.join(outputDir, ".mcp.json"), mcpConfig);
  }

  // 7. tools.claude passthrough -> .claude/settings.json
  if (config.tools?.claude && typeof config.tools.claude === "object") {
    generateJsonFile(
      path.join(outputDir, ".claude", "settings.json"),
      config.tools.claude,
    );
  }
}
