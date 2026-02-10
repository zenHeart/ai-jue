# Adapter Capability Standardization & Cross-Tool Compatibility Scheme

To address the deficiencies of `ai-jue` adapters in capability transformation, this specification establishes a set of capability mapping and transformation standards across tools (Cursor, Claude Code, Gemini CLI, Copilot) based on Cursor as a benchmark.

## 1. Capability Mapping Matrix

We define 7 core common capabilities and clarify the implementation mechanisms for each tool.

| Capability (AI-Jue) | Description | Cursor | Claude Code | Gemini CLI | GitHub Copilot |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Rules** | Core Guidelines | `.cursorrules` (System Prompt) | `CLAUDE.md` (Context) | `.gemini/settings.json` (systemPrompt) | `.github/copilot-instructions.md` |
| **Commands** | Slash Commands (/) | Natural Language Trigger ("When I say...") | `CLAUDE.md` (/slash commands) | `.gemini/settings.json` (customCommands) | Natural Language Trigger ("Run command...") |
| **Skills** | Specific Task Capabilities | `.cursorrules` (Capability Description) | `CLAUDE.md` (Prompt with Trigger) | `.gemini/settings.json` (tools/prompts) | `.github/copilot-instructions.md` (Skill Description) |
| **Hooks** | Lifecycle Hooks | `features.hooks` (Settings) / Script Integration | Git Hooks Integration / `lib/hooks` (Conceptual) | `.gemini/settings.json` (hooks: pre/post) | VS Code Tasks / IDE Events |
| **Sub-agents** | Domain Experts | Agent Mode (Switch Model/Prompt) | Multi-session / Explicit Context Switch | `.gemini/settings.json` (subAgents) | No native support (Simulated via @workspace) |
| **MCP** | Model Context Protocol | `.cursor/mcp.json` | `claude_desktop_config.json` | `.gemini/settings.json` (mcpServers) | No native support (Requires bridge) |
| **AGENTS.md** | Global Role Definition | Injected into top of `.cursorrules` | Injected into top of `CLAUDE.md` | Injected into System Prompt | Injected into top of Instructions |

## 2. Three-Layer Adapter Architecture

### 2.1 Core Layer: Standardized Configuration Schema

Define a standardized Schema in `ai.config.js` as the single source of truth.

```typescript
interface AiJueConfig {
  // ...existing config
  
  // 1. Command System
  commands: {
    [commandName: string]: {
      description: string;
      prompt: string;
      triggers: string[]; // Trigger words, e.g., ["/fix", "repair"]
    }
  };

  // 2. Lifecycle Hooks
  hooks: {
    "pre-commit": string | { script: string; tools: string[] }; // Execute before commit
    "post-apply": string; // Execute after ai-jue apply
  };

  // 3. Sub-Agents
  subAgents: {
    [agentName: string]: {
      description: string;
      prompt: string;
      tools?: string[]; // Tools/MCP available to this agent
    }
  };
  
  // 4. MCP (Already defined)
  mcp: McpConfig;
}
```

### 2.2 Transformation Layer: Configuration Generation Logic

Each adapter is responsible for transforming core configurations into the target tool's format.

* **Cursor Adapter**:
  * `commands` -> Converted and appended to `.cursorrules`: "If the user types '/fix', you must execute..."
  * `hooks` -> Generate `.cursor/settings.json` (if supported) or prompt user to configure IDE triggers.
  * `mcp` -> Generate `.cursor/mcp.json`.

* **Claude Adapter**:
  * `commands` -> Converted and appended to `CLAUDE.md`: `/fix - Fix code issues`.
  * `hooks` -> Generate `.githooks/pre-commit` script calling `claude` CLI (if available).

* **Gemini Adapter**:
  * `commands` -> Mapped to `customCommands` field.
  * `hooks` -> Mapped to `hooks` field.

### 2.3 Compatibility Layer: Fallback Strategy

When a target tool does not support a capability, use a fallback strategy:

* **MCP Fallback**: For tools that don't support MCP (like Copilot), add a hint in the generated Instructions: "This project uses MCP tool [ToolName], please use a terminal that supports MCP to run relevant commands."
* **Hooks Fallback**: If the tool doesn't support Hooks, generate a generic Shell script (like `scripts/pre-commit.sh`) and prompt the user to manually configure Git Hooks.

## 3. Implementation Example: Hooks Capability Transformation (Pre-commit)

Assuming `ai.config.js` configuration:

```javascript
hooks: {
  "pre-commit": "npm run lint"
}
```

* **Claude Code**:
  * Generate `.git/hooks/pre-commit` file (requires user permission), containing `npm run lint` invocation which blocks commit on failure, and optionally attempts to call Claude Code for auto-fix (if CLI supports it).
  * Or generate a documentation hint: "Recommended to run `claude code --print 'Check this code'` in pre-commit".

* **Gemini CLI**:
  * Add to `.gemini/settings.json`:

        ```json
        "hooks": {
          "pre-commit": "npm run lint"
        }
        ```

* **Copilot**:
  * Generate `.vscode/tasks.json`, defining a "Pre-commit Check" task, advising user to run it manually.

## 4. Validation Criteria

1. **Schema Validation**: All generated configuration files (JSON/YAML) must pass their corresponding JSON Schema validation.
2. **Functional Consistency**: `commands` must be recognizable in all supported tools (via `/command` or natural language trigger).
3. **Non-Destructive Update**: When running `apply` again, user's manual modifications outside the `<!-- AI-JUE:START -->` block must be preserved.
