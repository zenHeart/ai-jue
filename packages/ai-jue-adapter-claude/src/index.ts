import path from "path";
import fs from "fs";
import * as yaml from "js-yaml";
import { generateMarkdownFile, generateJsonFile, deepMerge } from "ai-jue-core";

/**
 * Claude Code Adapter (Native Implementation)
 * Maps ai-jue capabilities to .claude/ directory, CLAUDE.md, and .mcp.json
 */

export async function generate(config: any, outputDir: string): Promise<void> {
  const claudeDir = path.join(outputDir, ".claude");

  // Helper for clean YAML dump (prevents >- for simple strings)
  const safeDump = (obj: any) => yaml.dump(obj, { lineWidth: -1, noRefs: true }).trim();

  // 1. Handle Global Context (AGENTS.md)
  const globalContext = config.context?.global?.trim();
  if (globalContext) {
    generateMarkdownFile(path.join(outputDir, "AGENTS.md"), `${globalContext}\n`);
  }

  // 2. Handle System Prompt (CLAUDE.md)
  let mainPrompt = "";
  if (globalContext) {
    mainPrompt += "@AGENTS.md\n\n";
  }
  if (config.prompts?.claude?.content) {
    mainPrompt += `${config.prompts.claude.content}\n`;
  }
  if (mainPrompt.trim()) {
    generateMarkdownFile(path.join(outputDir, "CLAUDE.md"), mainPrompt);
  }

  // 3. Handle Modular Rules (Native)
  if (config.rules && Object.keys(config.rules).length > 0) {
    let hasValidRules = false;
    for (const [ruleName, rule] of Object.entries(config.rules)) {
      const r = rule as any;
      const content = typeof r === "string" ? r : r.content || "";
      if (!content.trim()) continue;

      if (!hasValidRules) {
        if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });
        const rulesDir = path.join(claudeDir, "rules");
        if (!fs.existsSync(rulesDir)) fs.mkdirSync(rulesDir, { recursive: true });
        hasValidRules = true;
      }

      const frontmatter: any = { id: ruleName };
      if (r.description) frontmatter.description = r.description;
      if (r.globs) frontmatter.paths = r.globs;
      
      const fileContent = `---\n${safeDump(frontmatter)}\n---\n\n${content}`;
      fs.writeFileSync(path.join(claudeDir, "rules", `${ruleName}.md`), fileContent, "utf8");
    }
  }

  // 4. Handle Agent Skills (Native) - Reusable complex capabilities
  if (config.skills && Object.keys(config.skills).length > 0) {
    let hasValidSkills = false;
    for (const [skillName, skill] of Object.entries(config.skills)) {
      const s = skill as any;
      if (!s.description || !s.content) continue;

      if (!hasValidSkills) {
        if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });
        const skillsDir = path.join(claudeDir, "skills");
        if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir, { recursive: true });
        hasValidSkills = true;
      }

      const skillPath = path.join(claudeDir, "skills", skillName);
      if (!fs.existsSync(skillPath)) fs.mkdirSync(skillPath, { recursive: true });

      const frontmatter: any = {
        name: s.name || skillName,
        description: s.description,
      };
      if (s.metadata) frontmatter.metadata = s.metadata;
      if (s["allowed-tools"]) frontmatter["allowed-tools"] = s["allowed-tools"];

      const fileContent = `---\n${safeDump(frontmatter)}\n---\n\n${s.content || ""}`;
      fs.writeFileSync(path.join(skillPath, "SKILL.md"), fileContent, "utf8");

      const writeSubdir = (dirName: string, files?: Record<string, string>) => {
        if (!files) return;
        const subPath = path.join(skillPath, dirName);
        if (!fs.existsSync(subPath)) fs.mkdirSync(subPath, { recursive: true });
        for (const [filename, content] of Object.entries(files)) {
          fs.writeFileSync(path.join(subPath, filename), content, "utf8");
        }
      };
      writeSubdir("references", s.references);
      writeSubdir("scripts", s.scripts);
      writeSubdir("assets", s.assets);
    }
  }

  // 5. Handle Commands (Custom Slash Commands) - Clean prompt mappings
  if (config.commands && Object.keys(config.commands).length > 0) {
    let hasValidCommands = false;
    for (const [cmdName, cmd] of Object.entries(config.commands)) {
      const c = cmd as any;
      if (!c.prompt) continue;

      if (!hasValidCommands) {
        if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });
        const commandsDir = path.join(claudeDir, "commands");
        if (!fs.existsSync(commandsDir)) fs.mkdirSync(commandsDir, { recursive: true });
        hasValidCommands = true;
      }

      const frontmatter = {
        name: cmdName,
        description: c.description || `Command: ${cmdName}`,
      };
      const fileContent = `---\n${safeDump(frontmatter)}\n---\n\n${c.prompt || ""}`;
      // In Claude Code, custom commands can be defined as .md files in the commands directory
      fs.writeFileSync(path.join(claudeDir, "commands", `${cmdName}.md`), fileContent, "utf8");
    }
  }

  // 6. Handle MCP Servers (Native .mcp.json)
  if (config.mcp?.servers && Object.keys(config.mcp.servers).length > 0) {
    const mcpConfig = {
      mcpServers: config.mcp.servers,
    };
    generateJsonFile(path.join(outputDir, ".mcp.json"), mcpConfig);
  }

  // 7. Handle Settings & Hooks (.claude/settings.json)
  let settings = config.tools?.claude || {};
  if (config.hooks && Object.keys(config.hooks).length > 0) {
    settings.hooks = deepMerge(settings.hooks || {}, config.hooks);
  }

  if (Object.keys(settings).length > 0) {
    if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });
    generateJsonFile(path.join(claudeDir, "settings.json"), settings);
  }
}
