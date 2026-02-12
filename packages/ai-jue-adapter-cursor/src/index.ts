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
  const lang =
    config.language === "zh" || config.language === "zh-CN" ? "zh" : "en";
  const t = LOCALES[lang];

  // 1. Generate Cursor Project Rules (.cursor/rules/*.mdc)
  let cursorRulesContent = "";

  // Inject AGENTS.md content first (Global Context)
  if (config.prompts?.agents?.content) {
    cursorRulesContent += `# ${t.agentsTitle}\n\n${config.prompts.agents.content}\n\n`;
  }

  // Add Prompts
  if (config.prompts) {
    for (const [key, value] of Object.entries(config.prompts)) {
      if (key === "agents") continue;
      const content = (value as any).content || value;
      cursorRulesContent += `## ${t.promptTitle}: ${key}\n\n${content}\n\n`;
    }
  }

  // Add Skills as natural language descriptions
  if (config.skills) {
    cursorRulesContent += `## ${t.skillsTitle}\n\n${t.skillsDesc}\n\n`;
    for (const [key, value] of Object.entries(config.skills)) {
      const skill = value as any;
      cursorRulesContent += `### ${key}\n${skill.content || skill.prompt || ""}\n\n`;
    }
  }

  // Add Commands as trigger rules
  if (config.commands) {
    cursorRulesContent += `## ${t.commandsTitle}\n\n${t.commandsDesc}\n\n`;
    for (const [key, value] of Object.entries(config.commands)) {
      const cmd = value as any;
      const triggers = cmd.triggers ? cmd.triggers.join(", ") : `/${key}`;
      cursorRulesContent += `### ${key}\n**${t.triggersLabel}** ${triggers}\n\n**${t.actionLabel}** ${cmd.prompt}\n\n`;
    }
  }

  // Add Hooks suggestions
  if (config.hooks) {
    cursorRulesContent += `## ${t.hooksTitle}\n\n${t.hooksDesc}\n\n`;
    for (const [key, value] of Object.entries(config.hooks)) {
      const hookValue = value as any;
      const script =
        typeof hookValue === "string" ? hookValue : hookValue.script;
      if (key === "pre-commit") {
        cursorRulesContent += `- **Pre-commit**: ${t.preCommitPrefix} \`${script}\`\n`;
      } else {
        cursorRulesContent += `- **${key}**: \`${script}\`\n`;
      }
    }
  }

  if (cursorRulesContent.trim()) {
    const mdcContent = `---
description: ai-jue generated project rules
alwaysApply: true
---

${cursorRulesContent}`;
    generateMarkdownFile(
      path.join(outputDir, ".cursor", "rules", "ai-jue.mdc"),
      mdcContent,
    );
  }

  // 2. Generate .cursor/mcp.json
  if (config.mcp && config.mcp.servers) {
    const mcpConfig = {
      mcpServers: config.mcp.servers,
    };
    generateJsonFile(path.join(outputDir, ".cursor", "mcp.json"), mcpConfig);
  }

  // 3. Generate .cursor/rules for custom agents
  if (config.agents) {
    const rulesDir = path.join(outputDir, ".cursor", "rules");
    for (const [key, value] of Object.entries(config.agents)) {
      const agent = value as any;
      let agentContent = "";

      // Agent Prompt
      if (agent.prompt || agent.content) {
        agentContent += `# ${key}\n\n${agent.prompt || agent.content}\n\n`;
      }

      // Agent Skills
      if (Array.isArray(agent.skills) && config.skills) {
        agentContent += `## ${t.skillsTitle}\n\n`;
        for (const skillKey of agent.skills) {
          const skill = config.skills[skillKey];
          if (skill) {
            agentContent += `### ${skillKey}\n${skill.content || skill.prompt || ""}\n\n`;
          }
        }
      }

      if (agentContent.trim()) {
        const agentRule = `---
description: ${agent.description || `${key} agent rules`}
alwaysApply: false
---

${agentContent}`;
        generateMarkdownFile(path.join(rulesDir, `${key}.mdc`), agentRule);
      }
    }
  }
}
