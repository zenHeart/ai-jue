import path from "path";
import * as yaml from "js-yaml";
import {
  ensureDir,
  generateMarkdownFile,
  generateJsonFile,
  getAssetText,
  renderMarkdownWithFrontmatter,
  writeSupportFiles,
  writeTextFile,
  deepMerge,
} from "ai-jue-core";

/**
 * Claude Code Adapter (Native Implementation)
 * Maps ai-jue capabilities to .claude/ directory, CLAUDE.md, and .mcp.json
 *
 * Design Principles:
 * 1. YAML Frontmatter First: Tool-specific configs go into markdown frontmatter
 * 2. Adapter Responsibility: Structure conversion happens at adapter layer
 * 3. Escape Hatch: tools/claude/ directory for complex configs that can't be expressed in frontmatter
 */

/**
 * Extracts Claude-specific configuration from frontmatter.
 * Supports both legacy flat format and new `claude:` namespace format.
 */
function extractClaudeConfig(frontmatter: any): {
  claudeSpecific: Record<string, any>;
  commonFields: Record<string, any>;
} {
  const claudeNamespace = frontmatter?.claude || {};

  // Common fields that map directly to Claude frontmatter
  const commonFieldNames = [
    "description",
    "name",
    "argument-hint",
    "disable-model-invocation",
    "user-invocable",
    "allowed-tools",
    "model",
    "context",
    "agent",
    "hooks",
    "tools",
    "disallowedTools",
    "permissionMode",
    "maxTurns",
    "mcpServers",
    "memory",
  ];

  // Extract common fields from both top-level and claude: namespace
  const commonFields: Record<string, any> = {};
  for (const field of commonFieldNames) {
    if (claudeNamespace[field] !== undefined) {
      commonFields[field] = claudeNamespace[field];
    } else if (frontmatter?.[field] !== undefined) {
      // Backward compatibility: also check top-level
      commonFields[field] = frontmatter[field];
    }
  }

  return {
    claudeSpecific: claudeNamespace,
    commonFields,
  };
}

/**
 * Builds frontmatter object for Claude output files
 */
function buildClaudeFrontmatter(
  baseFields: Record<string, any>,
  claudeConfig: Record<string, any>
): Record<string, any> {
  // Merge with claude: namespace fields taking precedence
  const merged = { ...baseFields, ...claudeConfig };

  // Remove undefined values and internal fields
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && !key.startsWith("_")) {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Helper for clean YAML dump (prevents >- for simple strings)
 */
function safeDump(obj: any): string {
  return yaml.dump(obj, { lineWidth: -1, noRefs: true }).trim();
}

export async function generate(config: any, outputDir: string): Promise<void> {
  const claudeDir = path.join(outputDir, ".claude");

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
      const content = getAssetText(r, ["content", "prompt"]);
      if (!content.trim()) continue;

      if (!hasValidRules) {
        ensureDir(path.join(claudeDir, "rules"));
        hasValidRules = true;
      }

      // Extract Claude-specific config from frontmatter (supports claude: namespace)
      const { commonFields } = extractClaudeConfig(r);

      // Build frontmatter with proper field mapping
      const frontmatter: any = {
        id: ruleName,
        ...commonFields, // Include extracted common fields
      };

      if (r.description) frontmatter.description = r.description;

      // Handle globs -> paths mapping (support string or array)
      if (r.globs) {
        frontmatter.paths = Array.isArray(r.globs) ? r.globs : [r.globs];
      }

      // Handle alwaysApply -> auto-apply mapping (ai-jue convention to Claude native)
      if (r.alwaysApply === true) {
        frontmatter["auto-apply"] = true;
      }

      // Handle claude-specific paths override if provided in claude: namespace
      if (commonFields.paths) {
        frontmatter.paths = commonFields.paths;
      }

      // Handle claude-specific auto-apply override
      if (commonFields["auto-apply"] !== undefined) {
        frontmatter["auto-apply"] = commonFields["auto-apply"];
      }

      const fileContent = renderMarkdownWithFrontmatter(safeDump(frontmatter), content);
      writeTextFile(path.join(claudeDir, "rules", `${ruleName}.md`), fileContent);
    }
  }

  // 4. Handle Agent Skills (Native) - Reusable complex capabilities
  if (config.skills && Object.keys(config.skills).length > 0) {
    let hasValidSkills = false;
    for (const [skillName, skill] of Object.entries(config.skills)) {
      const s = skill as any;
      const skillContent = getAssetText(s, ["content", "prompt"]);
      if (!s.description && !skillContent.trim()) continue;

      if (!hasValidSkills) {
        ensureDir(path.join(claudeDir, "skills"));
        hasValidSkills = true;
      }

      const skillPath = path.join(claudeDir, "skills", skillName);
      ensureDir(skillPath);

      // Extract Claude-specific config from frontmatter (supports claude: namespace)
      const { commonFields } = extractClaudeConfig(s);

      // Build frontmatter with proper defaults for skills
      // Skills are auto-invoked by default (unlike commands)
      const frontmatter = buildClaudeFrontmatter(
        {
          name: s.name || skillName,
          description: s.description || `Skill: ${skillName}`,
          "disable-model-invocation": s.disableModelInvocation ?? false,
          "user-invocable": s.userInvocable ?? true,
        },
        commonFields
      );

      // Handle legacy metadata field
      if (s.metadata) {
        Object.assign(frontmatter, s.metadata);
      }

      // Handle legacy allowed-tools field
      if (s["allowed-tools"] || s.allowedTools) {
        frontmatter["allowed-tools"] = s["allowed-tools"] || s.allowedTools;
      }

      const fileContent = renderMarkdownWithFrontmatter(safeDump(frontmatter), skillContent);
      writeTextFile(path.join(skillPath, "SKILL.md"), fileContent);
      writeSupportFiles(path.join(skillPath, "references"), s.references);
      writeSupportFiles(path.join(skillPath, "scripts"), s.scripts);
      writeSupportFiles(path.join(skillPath, "assets"), s.assets);
    }
  }

  // 5. Handle Commands (Custom Slash Commands)
  // Commands are mapped to .claude/skills/*/SKILL.md as Claude Code merges commands into skills
  // This provides better compatibility and follows Claude Code's recommended structure
  if (config.commands && Object.keys(config.commands).length > 0) {
    let hasValidCommands = false;
    for (const [cmdName, cmd] of Object.entries(config.commands)) {
      const c = cmd as any;
      if (!c.prompt) continue;

      if (!hasValidCommands) {
        ensureDir(path.join(claudeDir, "skills"));
        hasValidCommands = true;
      }

      // Extract Claude-specific config from frontmatter (supports claude: namespace)
      const { commonFields } = extractClaudeConfig(c);

      // Build frontmatter with proper defaults for commands
      const frontmatter = buildClaudeFrontmatter(
        {
          name: c.name || cmdName,
          description: c.description || `Command: ${cmdName}`,
          // Commands are user-invoked by default, not auto-invoked by model
          "disable-model-invocation": c.disableModelInvocation ?? true,
          "user-invocable": c.userInvocable ?? true,
        },
        commonFields
      );

      // Handle triggers if provided
      if (c.triggers && Array.isArray(c.triggers) && c.triggers.length > 0) {
        // triggers are stored in metadata for reference, actual invocation is via /command-name
        frontmatter["ai-jue-triggers"] = c.triggers;
      }

      const skillPath = path.join(claudeDir, "skills", cmdName);
      ensureDir(skillPath);

      const fileContent = renderMarkdownWithFrontmatter(safeDump(frontmatter), c.prompt || "");
      writeTextFile(path.join(skillPath, "SKILL.md"), fileContent);
      writeSupportFiles(path.join(skillPath, "references"), c.references);
      writeSupportFiles(path.join(skillPath, "scripts"), c.scripts);
      writeSupportFiles(path.join(skillPath, "assets"), c.assets);
    }
  }

  // 6. Handle Agents (Sub-agents)
  // Claude Code supports custom sub-agents in .claude/agents/*.md
  if (config.agents && Object.keys(config.agents).length > 0) {
    let hasValidAgents = false;
    for (const [agentName, agent] of Object.entries(config.agents)) {
      const a = agent as any;
      const prompt = a.prompt || a.content || "";
      if (!a.description && !prompt.trim()) continue;

      if (!hasValidAgents) {
        ensureDir(path.join(claudeDir, "agents"));
        hasValidAgents = true;
      }

      // Extract Claude-specific config from frontmatter (supports claude: namespace)
      const { commonFields } = extractClaudeConfig(a);

      // Build frontmatter for agent
      const frontmatter = buildClaudeFrontmatter(
        {
          name: a.name || agentName,
          description: a.description || `Agent: ${agentName}`,
        },
        commonFields
      );

      // Handle skills array (preload skills into agent)
      if (a.skills && Array.isArray(a.skills)) {
        frontmatter.skills = a.skills;
      }

      const fileContent = renderMarkdownWithFrontmatter(safeDump(frontmatter), prompt);
      writeTextFile(path.join(claudeDir, "agents", `${agentName}.md`), fileContent);
    }
  }

  // 7. Handle MCP Servers (Native .mcp.json)
  // Supports scope: 'local' | 'project' | 'user'
  if (config.mcp?.servers && Object.keys(config.mcp.servers).length > 0) {
    const mcpConfig: any = {
      mcpServers: {},
    };

    // Separate servers by scope
    const projectServers: Record<string, any> = {};
    const userServers: Record<string, any> = {};
    const localServers: Record<string, any> = {};

    for (const [serverName, server] of Object.entries(config.mcp.servers)) {
      const s = server as any;
      const scope = s.scope || "project"; // Default to project scope

      // Remove scope from output config (Claude doesn't use it)
      const serverConfig = { ...s };
      delete serverConfig.scope;

      switch (scope) {
        case "project":
          projectServers[serverName] = serverConfig;
          break;
        case "user":
          userServers[serverName] = serverConfig;
          break;
        case "local":
          localServers[serverName] = serverConfig;
          break;
        default:
          projectServers[serverName] = serverConfig;
      }
    }

    // Output project-scoped servers to .mcp.json
    if (Object.keys(projectServers).length > 0) {
      generateJsonFile(path.join(outputDir, ".mcp.json"), { mcpServers: projectServers });
    }

    // Note: user/local scope servers would need to be handled differently
    // They could be written to ~/.claude.json or tools/claude/settings.json
    // For now, we include them in settings.json merge if tools.claude exists
    if (Object.keys(userServers).length > 0 || Object.keys(localServers).length > 0) {
      // Store for potential use in settings.json
      (config as any)._userMcpServers = userServers;
      (config as any)._localMcpServers = localServers;
    }
  }

  // 8. Handle Settings & Hooks (.claude/settings.json)
  let settings = config.tools?.claude || {};

  // Process hooks with enhanced structure support
  if (config.hooks && Object.keys(config.hooks).length > 0) {
    const processedHooks: Record<string, any> = {};

    for (const [eventName, hookDef] of Object.entries(config.hooks)) {
      const h = hookDef as any;

      if (typeof h === "string") {
        // Simple string script - convert to Claude's command hook format
        processedHooks[eventName] = [
          {
            hooks: [
              {
                type: "command",
                command: h,
              },
            ],
          },
        ];
      } else if (Array.isArray(h)) {
        processedHooks[eventName] = h.map((hook) => ({
          matcher: hook.matcher || (hook.tools ? hook.tools.join("|") : undefined),
          hooks: [
            {
              type: hook.type || "command",
              command: hook.script,
              async: hook.async,
              timeout: hook.timeout,
            },
          ],
        }));
      } else if (typeof h === "object" && h !== null) {
        // Object format with matcher, type, command, etc.
        if (h.script) {
          // ai-jue convention: { script: string, tools?: string[] }
          processedHooks[eventName] = [
            {
              matcher: h.matcher || (h.tools ? h.tools.join("|") : undefined),
              hooks: [
                {
                  type: h.type || "command",
                  command: h.script,
                  async: h.async,
                  timeout: h.timeout,
                },
              ],
            },
          ];
        } else {
          // Assume it's already in Claude's format or needs wrapping
          processedHooks[eventName] = h.matcher
            ? [h]
            : [
                {
                  hooks: [h],
                },
              ];
        }
      }
    }

    settings.hooks = deepMerge(settings.hooks || {}, processedHooks);
  }

  // Handle MCP servers with user/local scope (from step 7)
  const userMcpServers = (config as any)._userMcpServers;
  const localMcpServers = (config as any)._localMcpServers;

  if (
    (userMcpServers && Object.keys(userMcpServers).length > 0) ||
    (localMcpServers && Object.keys(localMcpServers).length > 0)
  ) {
    // These would typically go in ~/.claude.json, but we can include them
    // in settings.json for documentation purposes or future use
    settings["_mcpServersNote"] =
      "User/Local scope MCP servers should be configured via 'claude mcp add --scope user/local'";
  }

  if (Object.keys(settings).length > 0) {
    ensureDir(claudeDir);
    generateJsonFile(path.join(claudeDir, "settings.json"), settings);
  }
}
