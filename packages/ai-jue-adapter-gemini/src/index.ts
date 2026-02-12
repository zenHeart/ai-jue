import path from "path";
import { generateMarkdownFile, generateJsonFile, deepMerge } from "ai-jue-core";

export async function generate(config: any, outputDir: string): Promise<void> {
  const promptEntries = config.prompts ? Object.values(config.prompts) : [];
  const firstPrompt = promptEntries.length > 0 ? (promptEntries[0] as any) : null;
  const globalContext =
    typeof config.context?.global === "string" ? config.context.global.trim() : "";
  if (globalContext) {
    generateMarkdownFile(path.join(outputDir, "AGENTS.md"), `${globalContext}\n`);
  }
  // Generate GEMINI.md from prompt/context and degraded rules
  const prompt = config.prompts?.gemini || firstPrompt;
  const sections: string[] = [];
  if (globalContext) {
    sections.push("@AGENTS.md");
  }
  if (prompt?.content) {
    sections.push(String(prompt.content).trim());
  }

  if (config.rules && typeof config.rules === "object") {
    const rulesLines: string[] = ["## Rules (Degraded)"];
    for (const [key, value] of Object.entries(config.rules)) {
      const rule = value as any;
      const body = typeof rule === "string" ? rule : rule.content || "";
      if (!String(body).trim()) continue;
      rulesLines.push(`### ${key}`);
      rulesLines.push(String(body).trim());
    }
    if (rulesLines.length > 1) {
      sections.push(rulesLines.join("\n\n"));
    }
  }

  if (sections.length > 0) {
    const mdFilePath = path.join(outputDir, "GEMINI.md");
    generateMarkdownFile(mdFilePath, sections.join("\n\n"));
  }

  // Generate .gemini/settings.json
  const geminiConfig = config.tools?.gemini || {};

  // Inject MCP configuration if present
  if (config.mcp && config.mcp.servers) {
    if (!geminiConfig.mcpServers) {
      geminiConfig.mcpServers = {};
    }
    // Merge global MCP servers into gemini config
    geminiConfig.mcpServers = deepMerge(
      geminiConfig.mcpServers,
      config.mcp.servers,
    );
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

  // Inject Agents
  if (config.agents) {
    if (!geminiConfig.agents) geminiConfig.agents = {};
    for (const [key, value] of Object.entries(config.agents)) {
      const agent = value as any;
      geminiConfig.agents[key] = {
        prompt: agent.prompt,
        skills: Array.isArray(agent.skills) ? agent.skills : undefined,
      };
    }
  }

  const jsonFilePath = path.join(outputDir, ".gemini", "settings.json");
  generateJsonFile(jsonFilePath, geminiConfig);
}
