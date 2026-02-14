# Adapter Implementation Patterns

Use these patterns to implement standard adapter functionality. Copy and adapt the snippets below.

## 1. Standard Adapter Entry Point

Every adapter must export a `generate` function.

```typescript
import { generateMarkdownFile, generateJsonFile, deepMerge } from 'ai-jue-core';
import * as fs from 'fs';
import * as path from 'path';

export async function generate(config: any, outputDir: string): Promise<void> {
  // 1. Process Global Context (AGENTS.md)
  await handleContext(config, outputDir);

  // 2. Process Configuration & Prompts
  await handleConfiguration(config, outputDir);

  // 3. Process Rules
  await handleRules(config, outputDir);

  // 4. Process Skills (Standard Agent Skills)
  await handleSkills(config, outputDir);

  // 5. Process Commands
  await handleCommands(config, outputDir);

  // 6. Process MCP, Hooks, Agents (if supported)
  await handleToolSpecifics(config, outputDir);
}
```

## 2. Handling AGENTS.md (Context)

**Pattern A: Native Reference (Preferred)**
Use this when the tool can refer to a file in the project root.

```typescript
async function handleContext(config: any, outputDir: string) {
  const globalContext = config.context?.global?.trim();
  if (globalContext) {
    // Generate the physical AGENTS.md file
    await generateMarkdownFile(path.join(outputDir, 'AGENTS.md'), `${globalContext}\n`);
  }
}
```

**Pattern B: Content Injection**
Use this when the tool requires context inside a specific prompt file.

```typescript
// In handleConfiguration or similar
const sections = [];
if (config.context?.global) {
  sections.push(`<!-- Context from AGENTS.md -->\n${config.context.global}`);
}
// ... add other sections
```

## 3. Handling Rules

**Pattern A: Degradation to Markdown (Common)**
Most tools don't support granular file-glob rules natively. Degrade them into the system prompt.

```typescript
async function handleRules(config: any, outputDir: string) {
  if (!config.rules) return;

  const rulesContent = Object.entries(config.rules)
    .map(([name, rule]: [string, any]) => {
      const content = typeof rule === 'string' ? rule : rule.content;
      return `### Rule: ${name}\n${content}`;
    })
    .join('\n\n');

  if (rulesContent) {
    // Append to system prompt file (e.g., GEMINI.md or CLAUDE.md)
    // Implementation depends on how you construct that file
  }
}
```

**Pattern B: Native Rule Files (e.g., Cursor)**

```typescript
// See ai-jue-adapter-cursor for implementation of .cursor/rules/*.mdc generation
```

## 4. Handling Skills (Standard Agent Skills)

**Pattern: Directory-based Generation (Standard)**
This is the standard implementation for tools supporting Agent Skills.

```typescript
import * as yaml from 'js-yaml'; // Ensure js-yaml is installed

async function handleSkills(config: any, outputDir: string) {
  if (!config.skills) return;

  for (const [skillName, skill] of Object.entries(config.skills)) {
    const skillDir = path.join(outputDir, '.{tool}/skills', skillName);
    fs.mkdirSync(skillDir, { recursive: true });

    // 1. Generate SKILL.md with Frontmatter
    const frontmatter = {
      name: skill.name || skillName,
      description: skill.description,
      metadata: skill.metadata,
      // ... map other fields
    };
    const content = `---\n${yaml.dump(frontmatter)}---\n\n${skill.content}`;
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);

    // 2. Copy Assets (references, scripts, etc.)
    // Assuming 'skill' object contains populated 'references', 'scripts' maps
    // See ai-jue-adapter-gemini for full asset copying logic
  }
}
```

## 5. Handling Commands

**Pattern: Structured Command Files**

```typescript
async function handleCommands(config: any, outputDir: string) {
  if (!config.commands) return;

  for (const [cmdName, cmd] of Object.entries(config.commands)) {
    // Flatten "git:commit" -> "git-commit" or nested folders depending on tool
    // Generate tool-specific format (JSON/TOML)
  }
}
```

## 6. Testing Contract

Ensure your `test/index.test.ts` verifies all 8 capabilities.

```typescript
it('should generate AGENTS.md for context', async () => { /* ... */ });
it('should degrade rules correctly', async () => { /* ... */ });
it('should generate skills with proper structure', async () => { /* ... */ });
// ... etc
```
