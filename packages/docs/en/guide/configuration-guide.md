# `ai.config.js` Configuration Guide

`ai.config.js` is the core configuration file of the `ai-jue` project. It defines the project's AI capabilities, preset selection, and configurations for specific AI tools. This file must be located in the root directory of the project.

## Configuration Schema

Here is a complete `ai.config.js` JSON Schema definition, describing all available configuration items and their structure.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ai-jue Configuration",
  "description": "Schema for the ai-jue configuration file (ai.config.js)",
  "type": "object",
  "properties": {
    "preset": {
      "description": "Specifies the name of the preset package to use (e.g., 'base'). The CLI will resolve this to 'jue-preset-base'.",
      "type": "string"
    },
    "presets": {
      "description": "An array of preset names to be loaded and merged in order (e.g., ['base', 'react']). Supersedes 'preset' if both are present.",
      "type": "array",
      "items": { "type": "string" }
    },
    "extends": {
      "description": "Specifies paths to external asset files (prompts, skills, etc.) to be explicitly loaded and merged.",
      "type": "object",
      "additionalProperties": {
        "oneOf": [
          { "type": "string" },
          { "type": "array", "items": { "type": "string" } }
        ]
      }
    },
    "language": {
      "description": "The preferred language for loading assets from presets (e.g., 'zh-CN', 'en'). ai-jue CLI uses a progressive enhancement strategy for loading multi-language assets; see the 'Multi-language Asset Loading' section for details.",
      "type": "string"
    },
    "mcp": {
      "description": "Configuration for Model Context Protocol (MCP) servers.",
      "type": "object",
      "properties": {
        "servers": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "command": { "type": "string" },
              "args": { "type": "array", "items": { "type": "string" } },
              "env": { "type": "object", "additionalProperties": { "type": "string" } }
            },
            "required": ["command"]
          }
        }
      }
    },
    "commands": {
      "description": "Define custom slash commands that map to specific prompts.",
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "prompt": { "type": "string" },
          "triggers": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["prompt"]
      }
    },
    "hooks": {
      "description": "Define lifecycle hooks or automation scripts.",
      "type": "object",
      "additionalProperties": {
        "oneOf": [
            { "type": "string" },
            { 
                "type": "object",
                "properties": {
                    "script": { "type": "string" },
                    "tools": { "type": "array", "items": { "type": "string" } }
                }
            }
        ]
      }
    },
    "subAgents": {
      "description": "Define specialized sub-agents with specific tools and prompts.",
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "prompt": { "type": "string" },
          "tools": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["prompt"]
      }
    },
    "prompts": {
      "description": "Defines or overrides AI model prompts, keyed by tool or purpose.",
      "type": "object",
      "additionalProperties": {
        "type": "string"
      }
    },
    "skills": {
      "description": "Defines or overrides AI skills, keyed by skill name.",
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "description": {
            "type": "string",
            "description": "A brief description of what the skill does."
          },
          "prompt": {
            "type": "string",
            "description": "The core prompt or template for the skill."
          }
        },
        "required": ["description", "prompt"]
      }
    },
    "tools": {
      "description": "Tool-specific configurations, such as API parameters, model names, or safety settings.",
      "type": "object",
      "additionalProperties": {
        "type": "object"
      }
    },
    "options": {
      "description": "Runtime options for the ai-jue CLI itself.",
      "type": "object",
      "properties": {
        "verbose": {
          "description": "Enable verbose logging for debugging.",
          "type": "boolean",
          "default": false
        },
        "dryRun": {
          "description": "Run the apply command without making any file system changes.",
          "type": "boolean",
          "default": false
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": true
}
```

## Core Configuration Details

Here are the main configuration options available in `ai.config.js` and their functions:

#### 1. `preset` (string)

* **Function**: Specifies the name of the preset package to use for the project. `ai-jue` will look for a package named `jue-preset-<preset>` in `node_modules` and load it.
* **Examples**: `'base'`, `'react'`, `'nextjs'`
* **Behavior**: Presets provide basic prompts, skills, and other configurations. Other configuration items in `ai.config.js` can override or extend content from presets.

#### 2. `presets` (array of strings)

* **Function**: Specifies multiple preset packages to load and merge in order.
* **Example**: `['base', 'react', 'typescript']`
* **Behavior**: This is an enhanced version of the `preset` field, allowing the combination of multiple presets. The CLI caches presets in the order of the array, and subsequent presets override previous ones (if there are conflicts, but usually they merge). If both `preset` and `presets` are configured, `presets` takes precedence.

#### 3. `extends` (object)

* **Function**: Explicitly introduces external asset files (such as markdown files) into the configuration. This allows you to split large prompt or skill definitions into separate files for management.
* **Structure**: Keys are asset types (e.g., `prompts`, `skills`), and values are file paths or arrays of file paths.
* **Example**:

    ```javascript
    extends: {
      prompts: './prompts/custom-rules.md',
      skills: ['./skills/deploy.md', './skills/db-migrate.md']
    }
    ```

* **Behavior**: The CLI reads the content of the specified path and merges it into the final configuration.

#### 4. `prompts` (object)

* **Function**: Defines or overrides prompts for AI models. These prompts are typically used to guide AI behavior or provide context.
* **Structure**: The `prompts` object can contain the names of AI tools as keys, with their values being prompt strings.
* **Example**:

    ```javascript
    prompts: {
      claude: "This is a project-specific prompt for Claude, overriding any Claude prompts in the preset.",
      gemini: "Please act as Gemini AI, focusing on providing technical details and accurate solutions."
    }
    ```

* **Behavior**: `ai-jue` passes these prompts to the corresponding adapters, which are responsible for converting them into formats usable by AI tools (e.g., writing to `CLAUDE.md`).

#### 5. `skills` (object)

* **Function**: Defines or overrides AI skills. A skill usually represents a specific task that the AI can perform.
* **Structure**: The `skills` object can contain skill names as keys, with values being objects containing `description` and `prompt`.
* **Example**:

    ```javascript
    skills: {
      codeReview: {
        description: "Conduct a comprehensive code review, focusing on best practices and potential issues.",
        prompt: "Please carefully review the following code and point out any areas for improvement:"
      }
    }
    ```

* **Behavior**: These skill definitions are merged into the final configuration for use by adapters or other tools.

#### 6. `tools` (object)

* **Function**: Contains tool-specific configurations, such as API parameters, model names, safety settings, etc.
* **Structure**: The `tools` object uses AI tool names as keys, with values being the raw configuration objects accepted by those tools.
* **Example**:

    ```javascript
    tools: {
      gemini: {
        model: "gemini-pro",
        temperature: 0.7,
        safetySettings: {
          "harassment": "BLOCK_LOW_AND_ABOVE"
        }
      }
    }
    ```

* **Behavior**: Adapters read the `tools` configuration for their corresponding tools and apply it to the final generated files.

#### 7. `options` (object)

* **Function**: Contains runtime options for the `ai-jue` CLI itself.
* **Example**:

    ```javascript
    options: {
      verbose: true, // Enable verbose logging
      dryRun: false  // Enable dry run mode, only showing operations that would be performed
    }
    ```

* **Behavior**: These options affect the behavior of the `ai-jue` CLI, not the content of generated files.

#### 6. `language` (string)

* **Function**: Specifies the primary language currently used by the project for internationalization (i18n).
* **Example**: `'zh-CN'`, `'en'`
* **Behavior**: The `ai-jue` CLI uses a **progressive enhancement** strategy to load multi-language assets. It intelligently finds and loads multi-language files in presets or local assets based on this setting. For detailed loading priority rules, please refer to the [Multi-language Asset Loading](#multi-language-asset-loading) section.

#### 7. `mcp` (object)

* **Function**: Configures Model Context Protocol (MCP) servers. These servers can provide context to MCP-supported AI editors (like Cursor).
* **Structure**: Contains a `servers` object where keys are server names and values are configuration objects containing `command`, `args`, and `env`.
* **Example**:

    ```javascript
    mcp: {
      servers: {
        "sqlite": {
          command: "uvx",
          args: ["mcp-server-sqlite", "--db-path", "test.db"]
        }
      }
    }
    ```

#### 8. `commands` (object)

* **Function**: Defines custom Slash Commands, usually for quickly triggering specific Prompts.
* **Structure**: Keys are command names, values contain `prompt` (required), `description`, and `triggers`.
* **Example**:

    ```javascript
    commands: {
      "refactor": {
        description: "Refactor code",
        prompt: "Please refactor the selected code for better readability.",
        triggers: ["/ref"]
      }
    }
    ```

#### 9. `hooks` (object)

* **Function**: Defines lifecycle hooks or automation scripts.
* **Example**:

    ```javascript
    hooks: {
      "pre-commit": "npm test",
      "post-apply": {
         script: "echo 'Applied successfully!'",
         tools: ["terminal"]
      }
    }
    ```

#### 10. `subAgents` (object)

* **Function**: Defines specialized Sub-Agents with specific roles and toolsets.
* **Example**:

    ```javascript
    subAgents: {
      "sql-expert": {
        description: "Expert in SQL optimization",
        prompt: "You are a SQL expert...",
        tools: ["mcp-server-sqlite"]
      }
    }
    ```

## "Smart Coexistence": Non-Destructive Writing Strategy

A core design principle is that `ai-jue` should never destroy or overwrite the user's manual configuration under any circumstances. The `apply` command ensures this through two "Smart Coexistence" strategies:

### 1. Block Management (for text files like .md)

For `.md` files (like `CLAUDE.md`, `GEMINI.md`), `ai-jue` uses special comment markers to define the scope of content it manages:

```markdown
<!-- AI-JUE:START -->
<!-- Warning: This section is automatically generated by ai-jue... -->
This is content managed by ai-jue.
<!-- AI-JUE:END -->

You can freely add any content outside these markers, such as project-specific notes, personal reminders, etc. When running, `ai-jue` will only update the content between the `START` and `END` markers, and all content outside the markers will be **permanently preserved**.
```

### 2. Deep Merge (for .json files)

For `.json` files (like `.gemini/settings.json`), `ai-jue` performs a "Deep Merge" operation.

* **Updates Only**: It only updates or adds fields defined by presets or `ai.config.js`.
* **No Deletions**: Any other fields you manually added to the `.json` file will not be deleted or modified.

This mechanism allows you to confidently combine `ai-jue` managed configurations with your own personalized configurations in the same file.
