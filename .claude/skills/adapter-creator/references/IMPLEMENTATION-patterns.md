# Adapter Implementation Patterns

Use these patterns to implement standard adapter functionality. Copy and adapt the snippets below.

## 1. Standard Adapter Entry Point (Lazy Creation)

Every adapter must export a `generate` function. **Rule**: Do not create directories or empty files unless there is actual content to write.

```typescript
import { generateMarkdownFile, generateJsonFile, deepMerge } from 'ai-jue-core';
import * as fs from 'fs';
import * as path from 'path';

export async function generate(config: any, outputDir: string): Promise<void> {
  // 1. Process Global Context (AGENTS.md)
  // Logic: only generate if config.context.global is non-empty
  await handleContext(config, outputDir);

  // 2. Process Configuration & Prompts
  // Logic: only generate if prompts or meaningful settings exist
  await handleConfiguration(config, outputDir);

  // 3. Process Rules
  // Logic: only create directory if valid rules with content exist
  await handleRules(config, outputDir);

  // ... handle other capabilities following the 'Lazy Creation' rule
}
```

## 2. Handling AGENTS.md (Context)

```typescript
async function handleContext(config: any, outputDir: string) {
  const globalContext = config.context?.global?.trim();
  if (globalContext) {
    await generateMarkdownFile(path.join(outputDir, 'AGENTS.md'), `${globalContext}\n`);
  }
}
```

## 3. Handling Rules (Lazy Pattern)

```typescript
async function handleRules(config: any, outputDir: string) {
  if (!config.rules || Object.keys(config.rules).length === 0) return;

  let rulesDirCreated = false;
  
  for (const [name, rule] of Object.entries(config.rules)) {
    const content = typeof rule === 'string' ? rule : rule.content;
    if (!content?.trim()) continue;

    if (!rulesDirCreated) {
      const rulesDir = path.join(outputDir, '.{tool}/rules');
      fs.mkdirSync(rulesDir, { recursive: true });
      rulesDirCreated = true;
    }
    
    // Write rule file...
  }
}
```

## 4. Handling Settings (Clean Pattern)

```typescript
async function handleSettings(config: any, outputDir: string) {
  const settings = config.tools?.{tool} || {};
  // ... merge hooks, mcp, etc.
  
  if (Object.keys(settings).length > 0) {
    const settingsPath = path.join(outputDir, '.{tool}/settings.json');
    generateJsonFile(settingsPath, settings);
  }
}
```

## 5. Testing Contract

Ensure your `test/index.test.ts` verifies that **no empty files or directories** are created when config is empty.

```typescript
it('should NOT generate .claude directory if no rules or settings exist', async () => {
  await generate({}, TEST_DIR);
  expect(fs.existsSync(path.join(TEST_DIR, '.claude'))).toBe(false);
});
```
