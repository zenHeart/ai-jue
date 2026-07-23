const fs = require('fs');
const os = require('os');
const path = require('path');

require('ts-node/register');

const { loadAssetsFromDir } = require('../packages/ai-jue/src/preset.ts');
const { normalizeConfig } = require('../packages/ai-jue/src/normalize.ts');
const { generate: generateClaude } = require('../packages/ai-jue-adapter-claude/src/index.ts');
const { generate: generateCursor } = require('../packages/ai-jue-adapter-cursor/src/index.ts');

function requireFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} is missing: ${filePath}`);
  }
}

async function main() {
  const presetDir = process.argv[2] && path.resolve(process.argv[2]);
  if (!presetDir) {
    throw new Error('Usage: npm run smoke:ai-assets -- /absolute/path/to/ai-assets');
  }

  requireFile(path.join(presetDir, 'package.json'), 'Preset package');
  requireFile(
    path.join(presetDir, 'skills', 'agent-os', 'references', 'protocol', 'roles', 'reviewer.md'),
    'Nested skill reference',
  );

  const config = normalizeConfig(await loadAssetsFromDir(presetDir, 'zh'));
  const counts = Object.fromEntries(
    ['skills', 'agents', 'commands'].map((name) => [
      name,
      Object.keys(config[name] || {}).length,
    ]),
  );
  if (counts.skills === 0 || counts.agents === 0 || counts.commands === 0) {
    throw new Error(`Preset did not load the required capability types: ${JSON.stringify(counts)}`);
  }

  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jue-ai-assets-smoke-'));
  try {
    await generateClaude(config, outputDir);
    await generateCursor(config, outputDir);

    const relativeReference = path.join(
      'skills',
      'agent-os',
      'references',
      'protocol',
      'roles',
      'reviewer.md',
    );
    const sourceReference = fs.readFileSync(path.join(presetDir, relativeReference));
    for (const agentDir of ['.claude', '.cursor']) {
      const generatedReference = fs.readFileSync(
        path.join(outputDir, agentDir, relativeReference),
      );
      if (!sourceReference.equals(generatedReference)) {
        throw new Error(`${agentDir} changed a nested capability resource`);
      }
    }

    requireFile(
      path.join(outputDir, '.claude', 'agents', 'senior-frontend-architect.md'),
      'Claude agent output',
    );
    requireFile(
      path.join(outputDir, '.cursor', 'agents', 'senior-frontend-architect.md'),
      'Cursor agent output',
    );

    console.log(
      `[OK] ai-assets -> canonical model -> Claude/Cursor (${counts.skills} skills, ${counts.agents} agents, ${counts.commands} commands)`,
    );
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`[ERROR] ${error.message}`);
  process.exitCode = 1;
});
