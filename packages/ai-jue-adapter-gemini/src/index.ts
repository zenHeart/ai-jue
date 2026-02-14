import path from "path";
import fs from "fs";
import * as yaml from "js-yaml";
import { generateMarkdownFile, generateJsonFile, deepMerge } from "ai-jue-core";

function toTomlBasicString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function toTomlMultilineString(value: string): string {
  return value.replace(/"""/g, '\\"\\"\\"');
}

function toCommandSegments(name: string): string[] {
  return name
    .split(/[:/\\]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "-"));
}

function writeGeminiCommandFile(
  outputDir: string,
  commandName: string,
  command: { prompt?: string; description?: string },
): void {
  if (typeof command.prompt !== "string" || !command.prompt.trim()) return;

  const segments = toCommandSegments(commandName);
  if (segments.length === 0) return;

  const filePath = path.join(
    outputDir,
    ".gemini",
    "commands",
    ...segments.slice(0, -1),
    `${segments[segments.length - 1]}.toml`,
  );
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const lines: string[] = [];
  if (typeof command.description === "string" && command.description.trim()) {
    lines.push(`description = "${toTomlBasicString(command.description.trim())}"`);
  }
  lines.push("prompt = \"\"\"");
  lines.push(toTomlMultilineString(command.prompt.trim()));
  lines.push("\"\"\"");
  lines.push("");

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

// Updated function to write Gemini skill files as SKILL.md with YAML frontmatter
function writeGeminiSkillFile(
  outputDir: string,
  skillName: string,
  skill: { 
    name: string; 
    description: string; 
    content: string; 
    metadata?: Record<string, any>; 
    references?: Record<string, string>;
    scripts?: Record<string, string>;
    assets?: Record<string, string>;
    [key: string]: any 
  },
): void {
  if (!skill.name || !skill.description) return;

  const segments = toCommandSegments(skillName);
  if (segments.length === 0) return;

  const skillDir = path.join(outputDir, ".gemini", "skills", segments[0]);
  fs.mkdirSync(skillDir, { recursive: true });

  // Generate SKILL.md with YAML frontmatter
  const frontmatter: any = {
    name: skill.name,
    description: skill.description,
  };
  
  if (skill.license) frontmatter.license = skill.license;
  if (skill.compatibility) frontmatter.compatibility = skill.compatibility;
  if (skill["allowed-tools"]) frontmatter["allowed-tools"] = skill["allowed-tools"];
  if (skill["auto-apply"] !== undefined) frontmatter["auto-apply"] = skill["auto-apply"];
  if (skill.metadata) frontmatter.metadata = skill.metadata;

  const yamlFrontmatter = yaml.dump(frontmatter);
  const skillMdContent = `---\n${yamlFrontmatter}---\n\n${skill.content}`;
  
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillMdContent, "utf8");

  // Write subdirectories
  const writeSubdir = (name: string, files?: Record<string, string>) => {
    if (!files) return;
    const subdirPath = path.join(skillDir, name);
    fs.mkdirSync(subdirPath, { recursive: true });
    for (const [filename, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(subdirPath, filename), content, "utf8");
    }
  };

  writeSubdir("references", skill.references);
  writeSubdir("scripts", skill.scripts);
  writeSubdir("assets", skill.assets);
}


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

  // Inject Custom Commands as Gemini TOML files: .gemini/commands/**/*.toml
  if (config.commands && typeof config.commands === "object") {
    for (const [key, value] of Object.entries(config.commands)) {
      const cmd = value as any;
      writeGeminiCommandFile(outputDir, key, {
        description: typeof cmd?.description === "string" ? cmd.description : undefined,
        prompt: typeof cmd?.prompt === "string" ? cmd.prompt : undefined,
      });
    }
  }

  // Inject Skills
  if (config.skills && typeof config.skills === "object") {
    for (const [key, value] of Object.entries(config.skills)) {
      const skill = value as any;
      writeGeminiSkillFile(outputDir, key, skill);
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
