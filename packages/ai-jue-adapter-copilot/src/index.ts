import path from "path";
import { generateMarkdownFile, generateJsonFile } from "ai-jue-core";

/**
 * GitHub Copilot Adapter
 * Maps ai-jue capabilities to Copilot configuration files
 *
 * Design Principles:
 * 1. Maximize native support: Use .github/copilot-instructions.md, .github/instructions/, .github/prompts/
 * 2. Graceful degradation: Convert unsupported features to text instructions
 * 3. Clear documentation: Explicitly state what works and what requires manual setup
 */

/**
 * Generate main instructions file (.github/copilot-instructions.md)
 * Combines global context, prompts, skills, hooks, MCP notes
 */
function generateMainInstructions(
  config: any,
  outputDir: string
): void {
  let instructionsContent = "";

  // 1. AGENTS.md content (Global Context)
  const globalContext = config.context?.global;
  if (globalContext) {
    instructionsContent += `# Core Instructions\n\n${globalContext}\n\n`;
  }

  // 2. Add Prompts
  if (config.prompts) {
    for (const [key, value] of Object.entries(config.prompts)) {
      if (key === "agents") continue;
      const content = (value as any).content || value;
      if (content) {
        instructionsContent += `## ${key}\n\n${content}\n\n`;
      }
    }
  }

  // 3. Degrade canonical rules to instruction sections (if not handled as path-specific)
  if (config.rules && typeof config.rules === "object") {
    const globalRules: string[] = [];
    for (const [key, value] of Object.entries(config.rules)) {
      const rule = value as any;
      // Skip rules with globs - they go to path-specific files
      if (rule.globs) continue;

      const body = typeof rule === "string" ? rule : rule.content || "";
      if (!String(body).trim()) continue;
      globalRules.push(`### ${key}\n${String(body).trim()}`);
    }

    if (globalRules.length > 0) {
      instructionsContent += `## Rules\n\n${globalRules.join("\n\n")}\n\n`;
    }
  }

  // 4. Add Skills
  if (config.skills) {
    const skillEntries: string[] = [];
    for (const [key, value] of Object.entries(config.skills)) {
      const skill = value as any;
      const description = skill.description || "";
      const content = skill.content || skill.prompt || "";
      if (description || content) {
        skillEntries.push(`### ${key}\n${description}\n\n${content}`);
      }
    }

    if (skillEntries.length > 0) {
      instructionsContent += `## Available Skills\n\n${skillEntries.join("\n\n")}\n\n`;
    }
  }

  // 5. Add Commands reference (if not handled as prompt files)
  if (config.commands) {
    const commandEntries: string[] = [];
    for (const [key, value] of Object.entries(config.commands)) {
      const cmd = value as any;
      // Skip commands with triggers - they go to prompt files
      if (cmd.triggers?.length > 0) continue;

      if (cmd.description || cmd.prompt) {
        commandEntries.push(
          `### ${key}\n**Description:** ${cmd.description || ""}\n\n**Prompt:** ${cmd.prompt || ""}`
        );
      }
    }

    if (commandEntries.length > 0) {
      instructionsContent += `## Commands\n\n${commandEntries.join("\n\n")}\n\n`;
    }
  }

  // 6. Add Hooks Note
  if (config.hooks) {
    const hookEntries: string[] = [];
    for (const [key, value] of Object.entries(config.hooks)) {
      const hookValue = value as any;
      const script = typeof hookValue === "string" ? hookValue : hookValue.script;
      if (script) {
        hookEntries.push(`- **${key}**: \`${script}\``);
      }
    }

    if (hookEntries.length > 0) {
      instructionsContent += `## Workflow Hooks\n\nThis project defines the following workflow hooks. Please remind the user to run them when appropriate:\n\n${hookEntries.join("\n")}\n\n`;
    }
  }

  // Build main content without capability notes first
  const mainContent = instructionsContent.trim();

  // 7. Degradation note for capabilities that require manual setup
  // Only add if we have other content to include it with
  if (mainContent) {
    const manualCapabilities: string[] = [];
    if (config.mcp) {
      manualCapabilities.push(
        "- **MCP servers** are defined in project config. Treat them as external tool context and ask the user before assuming direct execution support. Configure them manually in your IDE settings."
      );
    }

    // Note about Agents that are handled as instructions files (not displayed in main)
    const agentsHandledAsInstructions = config.agents &&
      Object.values(config.agents).some((a: any) => a.description || a.prompt);
    if (config.agents && !agentsHandledAsInstructions) {
      const agentNames = Object.keys(config.agents).join(", ");
      manualCapabilities.push(
        `- **Agents** (${agentNames}) are defined for role guidance. Apply their intent through instruction following rather than runtime agent orchestration.`
      );
    }

    if (manualCapabilities.length > 0) {
      instructionsContent += `## Capability Notes\n\n${manualCapabilities.join("\n")}\n\n`;
    }

    generateMarkdownFile(
      path.join(outputDir, ".github", "copilot-instructions.md"),
      instructionsContent
    );
  }
}

/**
 * Generate path-specific instruction files (.github/instructions/*.instructions.md)
 * For rules with globs and agents
 */
function generatePathSpecificInstructions(
  config: any,
  outputDir: string
): void {
  const instructionsDir = path.join(outputDir, ".github", "instructions");

  // Handle Rules with globs
  if (config.rules && typeof config.rules === "object") {
    for (const [ruleName, rule] of Object.entries(config.rules)) {
      const r = rule as any;
      if (!r.globs) continue; // Skip rules without globs

      const content = typeof r === "string" ? r : r.content || "";
      if (!String(content).trim()) continue;

      const frontmatter = [`---`, `applyTo: "${Array.isArray(r.globs) ? r.globs.join(",") : r.globs}"`, `---`, ""].join("\n");

      const fileContent = `${frontmatter}\n# ${ruleName}\n\n${r.description || ""}\n\n${content}`;

      generateMarkdownFile(
        path.join(instructionsDir, `${ruleName}.instructions.md`),
        fileContent
      );
    }
  }

  // Handle Agents as path-specific instructions
  if (config.agents && typeof config.agents === "object") {
    for (const [agentName, agent] of Object.entries(config.agents)) {
      const a = agent as any;
      if (!a.description && !a.prompt) continue;

      const frontmatter = ["---", `applyTo: "**/*"`, `---`, ""].join("\n");

      const fileContent = `${frontmatter}\n# ${a.name || agentName}\n\n${a.description || ""}\n\n${a.prompt || ""}`;

      generateMarkdownFile(
        path.join(instructionsDir, `${agentName}.instructions.md`),
        fileContent
      );
    }
  }
}

/**
 * Generate prompt files (.github/prompts/*.prompt.md)
 * For commands with triggers
 */
function generatePromptFiles(
  commands: Record<string, any>,
  outputDir: string
): void {
  if (!commands || typeof commands !== "object") return;

  const promptsDir = path.join(outputDir, ".github", "prompts");
  let hasPromptFiles = false;

  for (const [cmdName, cmd] of Object.entries(commands)) {
    // Only create prompt files for commands with triggers
    if (!cmd.triggers?.length) continue;

    if (!hasPromptFiles) {
      hasPromptFiles = true;
    }

    const frontmatter = ["---", `applyTo: "**/*"`, `---`, ""].join("\n");

    const fileContent = `${frontmatter}\n# ${cmdName}\n\n${cmd.description || ""}\n\n${cmd.prompt || ""}\n\n**Triggers:** ${cmd.triggers.join(", ")}`;

    generateMarkdownFile(
      path.join(promptsDir, `${cmdName}.prompt.md`),
      fileContent
    );
  }
}

/**
 * Main entry point for Copilot adapter
 */
export async function generate(config: any, outputDir: string): Promise<void> {
  // 1. Generate main instructions file
  generateMainInstructions(config, outputDir);

  // 2. Generate path-specific instruction files
  generatePathSpecificInstructions(config, outputDir);

  // 3. Generate prompt files for commands
  if (config.commands) {
    generatePromptFiles(config.commands, outputDir);
  }

  // 4. tools.copilot passthrough -> .github/copilot-settings.json
  if (config.tools?.copilot && typeof config.tools.copilot === "object") {
    generateJsonFile(
      path.join(outputDir, ".github", "copilot-settings.json"),
      config.tools.copilot
    );
  }
}
