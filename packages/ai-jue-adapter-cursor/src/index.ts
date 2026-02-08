import path from 'path';
import fs from 'fs';
import { generateMarkdownFile, generateJsonFile } from 'ai-jue-core';

export async function generate(config: any, outputDir: string): Promise<void> {
  // 1. Generate .cursorrules
  let cursorRulesContent = '';
  
  // Inject AGENTS.md content first (Global Context)
  if (config.prompts?.agents?.content) {
      cursorRulesContent += `# Global Context & Agents\n\n${config.prompts.agents.content}\n\n`;
  }

  // Add Prompts
  if (config.prompts) {
      for (const [key, value] of Object.entries(config.prompts)) {
          if (key === 'agents') continue;
          const content = (value as any).content || value;
          cursorRulesContent += `## Prompt: ${key}\n\n${content}\n\n`;
      }
  }

  // Add Skills as natural language descriptions
  if (config.skills) {
      cursorRulesContent += `## Skills\n\nYou have access to the following skills:\n\n`;
      for (const [key, value] of Object.entries(config.skills)) {
           const skill = value as any;
           cursorRulesContent += `### ${key}\n${skill.content || skill.prompt || ''}\n\n`;
      }
  }

  // Add Commands as trigger rules
  if (config.commands) {
    cursorRulesContent += `## Commands\n\nFollow these rules when the user uses specific triggers:\n\n`;
    for (const [key, value] of Object.entries(config.commands)) {
        const cmd = value as any;
        const triggers = cmd.triggers ? cmd.triggers.join(', ') : `/${key}`;
        cursorRulesContent += `### ${key}\n**Triggers:** ${triggers}\n\n**Action:** ${cmd.prompt}\n\n`;
    }
  }

  // Add Hooks suggestions
  if (config.hooks) {
      cursorRulesContent += `## Workflow Hooks\n\nPlease follow these workflow rules:\n\n`;
      for (const [key, value] of Object.entries(config.hooks)) {
          const hookValue = value as any;
          const script = typeof hookValue === 'string' ? hookValue : hookValue.script;
          if (key === 'pre-commit') {
              cursorRulesContent += `- **Pre-commit**: Before committing changes, please ensure you run: \`${script}\`\n`;
          } else {
              cursorRulesContent += `- **${key}**: \`${script}\`\n`;
          }
      }
  }

  if (cursorRulesContent.trim()) {
      generateMarkdownFile(path.join(outputDir, '.cursorrules'), cursorRulesContent);
  }

  // 2. Generate .cursor/mcp.json
  if (config.mcp && config.mcp.servers) {
      const mcpConfig = {
          mcpServers: config.mcp.servers
      };
      generateJsonFile(path.join(outputDir, '.cursor', 'mcp.json'), mcpConfig);
  }
}