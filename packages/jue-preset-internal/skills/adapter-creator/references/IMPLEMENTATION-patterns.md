# Adapter Implementation Patterns

Implementation reference for ai-jue adapter developers.

## Basic Adapter Structure

```typescript
import { generateMarkdownFile, generateJsonFile, deepMerge } from 'ai-jue-core';
import * as fs from 'fs';
import * as path from 'path';

export async function generate(config: any, outputDir: string): Promise<void> {
  // Main adapter implementation
}
```

## Common Implementation Patterns

### Pattern 1: Native File Reference (Recommended)

For tools that support native `AGENTS.md` consumption:

```typescript
// AGENTS.md handling - reference instead of copy
if (config.context?.global) {
  // Tool reads AGENTS.md directly from project root
  // No file generation needed, just ensure reference in generated config
}
```

Examples: Cursor (native), Claude (via `@AGENTS.md` reference)

### Pattern 2: Markdown Block Management

For tools that need content injection with managed blocks:

```typescript
import { generateMarkdownFile } from 'ai-jue-core';

// Generate {TOOL}.md with managed block
await generateMarkdownFile(
  path.join(outputDir, '{TOOL}.md'),
  `<!-- AI-JUE:START -->\n${content}\n<!-- AI-JUE:END -->`,
  { marker: 'AI-JUE' }
);
```

Examples: Claude (CLAUDE.md), Gemini (GEMINI.md), Copilot (copilot-instructions.md)

### Pattern 3: Structured Config Generation

For tools using JSON/YAML configuration:

```typescript
import { generateJsonFile, deepMerge } from 'ai-jue-core';

const config = {
  // Native tool config structure
  rules: transformRules(aiJueConfig.rules),
  commands: transformCommands(aiJueConfig.commands),
};

await generateJsonFile(
  path.join(outputDir, '.{tool}', 'settings.json'),
  config
);
```

Examples: Cursor (mcp.json, hooks.json), Gemini (settings.json)

### Pattern 4: Multi-file Output with Directory Structure

For tools that need hierarchical file organization:

```typescript
// Commands with nested paths
type CommandConfig = {
  description?: string;
  prompt: string;
};

function writeCommandFile(
  outputDir: string,
  commandName: string,
  command: CommandConfig
): void {
  // Parse nested command names: "git:commit" -> ["git", "commit"]
  const segments = commandName
    .split(/[:/\\]+/)
    .map(s => s.trim())
    .filter(Boolean);
  
  const filePath = path.join(
    outputDir,
    '.{tool}',
    'commands',
    ...segments.slice(0, -1),
    `${segments[segments.length - 1]}.{ext}`
  );
  
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, serializeCommand(command), 'utf8');
}
```

Examples: Gemini (commands/**/*.toml)

### Pattern 5: Rules with Frontmatter

For tools supporting rules with metadata:

```typescript
type Rule = {
  description?: string;
  globs?: string[];
  alwaysApply?: boolean;
  content: string;
};

function transformRuleToMdc(rule: Rule): string {
  const frontmatter = [
    '---',
    rule.description && `description: ${rule.description}`,
    rule.globs?.length && `globs: ${JSON.stringify(rule.globs)}`,
    rule.alwaysApply && `alwaysApply: true`,
    '---',
  ].filter(Boolean).join('\n');
  
  return `${frontmatter}\n\n${rule.content}`;
}
```

Examples: Cursor (.cursor/rules/*.mdc)

### Pattern 6: Capability Degradation (Explicit)

When a tool doesn't support a capability, degrade explicitly:

```typescript
// HOOKS degradation example
if (config.hooks) {
  // Tool doesn't support hooks natively
  // Option 1: Write to documentation
  degradedCapabilities.push({
    capability: 'hooks',
    reason: '{Tool} does not support lifecycle hooks',
    workaround: 'Use external CI/CD or git hooks manually'
  });
  
  // Option 2: Throw warning
  console.warn('[ai-jue-adapter-{tool}] Hooks are not supported by {Tool}. '
    + 'Please configure manually via {alternative method}.');
}
```

## Testing Patterns

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { generate } from '../src/index';

describe('ai-jue-adapter-{tool}', () => {
  const TEST_DIR = path.join(__dirname, 'test-output');
  
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });
  
  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });
  
  it('should generate {tool} config with basic capabilities', async () => {
    const config = {
      rules: { /* ... */ },
      commands: { /* ... */ },
    };
    
    await generate(config, TEST_DIR);
    
    // Assertions
    expect(fs.existsSync(path.join(TEST_DIR, '.{tool}', 'settings.json'))).toBe(true);
  });
});
```

### Contract Test (Cross-Adapter)

Ensure your adapter follows the same contract as others:

```typescript
// Verify all adapters produce consistent output structure
it('should support all 8 capabilities', async () => {
  const config = createFullCapabilityConfig();
  await generate(config, TEST_DIR);
  
  // Assert expected files exist
  // Assert expected content structure
});
```

## Best Practices

### 1. Minimal Knowledge Principle

- Use target tool's native configuration files
- Don't introduce ai-jue-specific concepts in output
- Follow target tool's conventions and naming

### 2. No Silent Failures

```typescript
// Bad - silently ignore
if (capability.supported) { /* handle */ }

// Good - explicit handling
if (!capability.supported) {
  throw new Error(`Capability ${capability.name} not supported by {Tool}`);
  // OR
  console.warn(`Warning: ${capability.name} degraded to documentation`);
}
```

### 3. Backward Compatibility

```typescript
// Preserve existing user configuration
await generateJsonFile(
  filePath,
  newConfig,
  { mergeStrategy: 'deep' } // Deep merge with existing
);
```

### 4. File Organization

```
ai-jue-adapter-{tool}/
├── src/
│   └── index.ts          # Main generate() function
├── test/
│   └── index.test.ts     # Unit tests
├── README.md             # User documentation (Chinese)
├── README.en.md          # User documentation (English)
├── package.json
└── tsconfig.json
```

## Common Pitfalls

1. **Don't copy AGENTS.md content** - Reference it instead
2. **Don't assume all capabilities are supported** - Check and degrade explicitly
3. **Don't use internal ai-jue field names in output** - Map to native names
4. **Don't forget i18n** - Support language configuration
5. **Don't skip tests** - Include unit tests and contract tests
