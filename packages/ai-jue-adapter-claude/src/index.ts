import path from 'path';
import fs from 'fs';
import { generateMarkdownFile } from 'ai-jue-core';

export async function generate(config: any, outputDir: string): Promise<void> {
  let content = '';

  // 1. Inject AGENTS.md content first (Global Context)
  if (config.prompts?.agents?.content) {
      content += `# Context & Rules\n\n${config.prompts.agents.content}\n\n`;
  }

  // 2. Add specific Claude prompt
  if (config.prompts?.claude?.content) {
    content += `\n${config.prompts.claude.content}\n\n`;
  }

  // 3. Convert Skills to Slash Commands
  if (config.skills) {
      content += `## Slash Commands (Skills)\n\n`;
      for (const [key, value] of Object.entries(config.skills)) {
           const skill = value as any;
           // Claude Code format: /command - description
           content += `/skill-${key}: ${skill.description || 'Execute skill'}\n`;
           content += `  Prompt: ${skill.content || skill.prompt || ''}\n\n`;
      }
  }

  // 4. Convert Commands to Slash Commands
  if (config.commands) {
    content += `## Custom Commands\n\n`;
    for (const [key, value] of Object.entries(config.commands)) {
        const cmd = value as any;
        content += `/${key}: ${cmd.description || 'Execute command'}\n`;
        content += `  Prompt: ${cmd.prompt}\n\n`;
    }
  }

  // 5. Hooks Documentation
  if (config.hooks) {
      content += `## Workflow Hooks\n\n`;
      for (const [key, value] of Object.entries(config.hooks)) {
        const hookValue = value as any;
        const script = typeof hookValue === 'string' ? hookValue : hookValue.script;
        content += `- **${key}**: Please ensure \`${script}\` is passed before proceeding.\n`;
      }
  }

  if (content.trim()) {
    const filePath = path.join(outputDir, 'CLAUDE.md');
    generateMarkdownFile(filePath, content);
  }
}
