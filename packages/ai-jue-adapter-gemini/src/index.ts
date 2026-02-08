import path from 'path';
import { generateMarkdownFile, generateJsonFile, deepMerge } from 'ai-jue-core';

export async function generate(config: any, outputDir: string): Promise<void> {
  // Generate GEMINI.md
  const prompt = config.prompts?.gemini || config.prompts?.agents;
  if (prompt && prompt.content) { // Changed from prompt.prompt
    const mdFilePath = path.join(outputDir, 'GEMINI.md');
    generateMarkdownFile(mdFilePath, prompt.content);
  }

  // Generate .gemini/settings.json
  const geminiConfig = config.tools?.gemini || {};
  
  // Inject MCP configuration if present
  if (config.mcp && config.mcp.servers) {
    if (!geminiConfig.mcpServers) {
        geminiConfig.mcpServers = {};
    }
    // Merge global MCP servers into gemini config
    geminiConfig.mcpServers = deepMerge(geminiConfig.mcpServers, config.mcp.servers);
  }

  // Inject Custom Commands
  if (config.commands) {
    if (!geminiConfig.customCommands) geminiConfig.customCommands = {};
    for (const [key, value] of Object.entries(config.commands)) {
        geminiConfig.customCommands[key] = (value as any).prompt;
    }
  }

  // Inject Hooks
  if (config.hooks) {
    if (!geminiConfig.hooks) geminiConfig.hooks = {};
    for (const [key, value] of Object.entries(config.hooks)) {
        geminiConfig.hooks[key] = (value as any).script || value;
    }
  }

  if (Object.keys(geminiConfig).length > 0) {
    const jsonFilePath = path.join(outputDir, '.gemini', 'settings.json');
    generateJsonFile(jsonFilePath, geminiConfig);
  }
}
