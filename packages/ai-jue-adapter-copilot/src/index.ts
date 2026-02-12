import path from 'path';
import fs from 'fs';
import { generateMarkdownFile } from 'ai-jue-core';

export async function generate(config: any, outputDir: string): Promise<void> {
  let instructionsContent = '';
  const globalContext = config.context?.global;

  // 1. Inject AGENTS.md content first (Global Context)
  if (globalContext) {
      instructionsContent += `# Core Instructions (AGENTS)\n\n${globalContext}\n\n`;
  }

  // 2. Add Prompts
  if (config.prompts) {
      for (const [key, value] of Object.entries(config.prompts)) {
          if (key === 'agents') continue;
          const content = (value as any).content || value;
          instructionsContent += `## ${key}\n\n${content}\n\n`;
      }
  }

  // 3. Add Skills
  if (config.skills) {
      instructionsContent += `## Available Skills\n\n`;
      for (const [key, value] of Object.entries(config.skills)) {
           const skill = value as any;
           instructionsContent += `### ${key}\n${skill.content || skill.prompt || ''}\n\n`;
      }
  }

  // 4. Add Commands
  if (config.commands) {
    instructionsContent += `## Commands\n\nYou should recognize the following commands when triggered by natural language:\n\n`;
    for (const [key, value] of Object.entries(config.commands)) {
        const cmd = value as any;
        instructionsContent += `### ${key}\n**Description:** ${cmd.description}\n**Prompt:** ${cmd.prompt}\n\n`;
    }
  }

  // 5. Add Hooks Note (Degradation)
  if (config.hooks) {
      instructionsContent += `## Workflow Note\n\nThis project defines the following workflow hooks. Please remind the user to run them when appropriate:\n\n`;
      for (const [key, value] of Object.entries(config.hooks)) {
          const hookValue = value as any;
          const script = typeof hookValue === 'string' ? hookValue : hookValue.script;
          instructionsContent += `- **${key}**: \`${script}\`\n`;
      }
  }

  if (instructionsContent.trim()) {
      generateMarkdownFile(path.join(outputDir, '.github', 'copilot-instructions.md'), instructionsContent);
  }
}
