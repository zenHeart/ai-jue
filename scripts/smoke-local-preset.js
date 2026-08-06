const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

require('ts-node/register');

const { loadPreset } = require('../packages/ai-jue/src/preset.ts');
const { normalizeConfig } = require('../packages/ai-jue/src/normalize.ts');

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    if (!key.startsWith('--') || argv[index + 1] === undefined) {
      throw new Error(
      'Arguments must use --packages-dir, --entry and optional --cleanup / --artifact',
      );
    }
    args[key.slice(2)] = argv[index + 1];
  }
  if (!args['packages-dir'] || !args.entry) {
    throw new Error(
      'Usage: smoke-local-preset --packages-dir <dir> --entry <preset> [--cleanup delete|trash] [--artifact project|plugin|compatible-bundle|skill-plugin]',
    );
  }
  return args;
}

function run(command, args, cwd) {
  const spawnOptions = {
    cwd,
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  };
  let result = spawnSync(command, args, spawnOptions);
  // On Windows, PowerShell can resolve an App Paths/npm shim that Node's
  // spawnSync cannot find through PATH. Use the npm CLI bundled beside the
  // current Node binary as a deterministic fallback for this offline smoke.
  if (result.error && command === 'npm' && process.platform === 'win32') {
    const bundledNpm = path.join(
      path.dirname(process.execPath),
      'node_modules',
      'npm',
      'bin',
      'npm-cli.js',
    );
    if (fs.existsSync(bundledNpm)) {
      result = spawnSync(process.execPath, [bundledNpm, ...args], spawnOptions);
    }
  }
  if (result.status !== 0) {
    const rawError = String(result.stderr || result.stdout || '');
    let structuredSummary = '';
    const jsonStart = rawError.indexOf(': [');
    if (jsonStart >= 0) {
      try {
        const issues = JSON.parse(rawError.slice(jsonStart + 2));
        structuredSummary = issues
          .map((issue) => {
            const issuePath = Array.isArray(issue.path) ? issue.path : [];
            const safePath = issuePath.length > 1
              ? [issuePath[0], '<asset>', issuePath.at(-1)].join('.')
              : issuePath.join('.');
            return `${safePath}: ${String(issue.message).replace(/"[^"]+"/g, '"<redacted>"')}`;
          })
          .join('; ');
      } catch {
        structuredSummary = '';
      }
    }
    const sanitizedLines = rawError
      .split('\n')
      .map((line) =>
        line
          .replace(/"[^"]+"/g, '"<redacted>"')
          .replace(/(?:\/[^/\s:]+){2,}/g, '<path>'),
      );
    const firstError = sanitizedLines.findIndex((line) =>
      /error|failed|invalid|missing/i.test(line),
    );
    const summary = structuredSummary || (firstError >= 0
      ? sanitizedLines.slice(firstError, firstError + 12).join(' ').trim()
      : '');
    const spawnError = result.error ? `: ${result.error.message}` : '';
    throw new Error(
      `${path.basename(command)} failed with exit code ${result.status ?? 'unavailable'}`
      + (summary ? `: ${summary.trim()}` : spawnError),
    );
  }
  return result.stdout;
}

function packPresetDirectories(packagesDir, packDir) {
  const archives = [];
  for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const packageDir = path.join(packagesDir, entry.name);
    if (!fs.existsSync(path.join(packageDir, 'package.json'))) continue;
    const output = JSON.parse(
      run(
        'npm',
        ['pack', packageDir, '--ignore-scripts', '--json', '--pack-destination', packDir],
        packagesDir,
      ),
    );
    const filename = output?.[0]?.filename;
    if (typeof filename !== 'string') {
      throw new Error('npm pack did not return an archive filename');
    }
    archives.push(path.join(packDir, filename));
  }
  if (archives.length === 0) throw new Error('No Preset packages were found');
  return archives;
}

function createOfflineMirror(packagesDir, mirrorDir) {
  fs.mkdirSync(mirrorDir);
  for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(packagesDir, entry.name, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const [name, ref] of Object.entries(manifest.ai?.capabilities || {})) {
      const locator = `${ref.source}\0${ref.ref || ''}\0${ref.path || ''}`;
      const key = crypto.createHash('sha256').update(locator).digest('hex');
      const stage = fs.mkdtempSync(path.join(path.dirname(mirrorDir), 'mirror-stage-'));
      try {
        if (String(ref.source).startsWith('npm:')) {
          const packageDir = path.join(stage, 'package');
          fs.mkdirSync(packageDir);
          fs.writeFileSync(
            path.join(packageDir, 'package.json'),
            JSON.stringify({
              name: `neutral-${name}`,
              version: '1.0.0',
              bin: { [name]: 'server.js' },
            }),
          );
          fs.writeFileSync(path.join(packageDir, 'server.js'), '');
          const output = JSON.parse(
            run(
              'npm',
              ['pack', packageDir, '--ignore-scripts', '--json', '--pack-destination', stage],
              stage,
            ),
          );
          fs.renameSync(
            path.join(stage, output[0].filename),
            path.join(mirrorDir, `${key}.tgz`),
          );
          continue;
        }
        if (String(ref.source).startsWith('github:')) {
          const archiveRoot = path.join(stage, 'neutral-repository');
          const capabilityDir = path.join(archiveRoot, ref.path || '.');
          fs.mkdirSync(capabilityDir, { recursive: true });
          fs.writeFileSync(
            path.join(capabilityDir, 'SKILL.md'),
            `---\nname: ${name}\ndescription: Neutral offline source fixture\n---\nOffline fixture.`,
          );
          run(
            'tar',
            ['-czf', path.join(mirrorDir, `${key}.tgz`), '-C', stage, 'neutral-repository'],
            stage,
          );
        }
      } finally {
        fs.rmSync(stage, { recursive: true, force: true });
      }
    }
  }
}

function firstEntry(record) {
  return Object.entries(record || {}).sort(([a], [b]) => a.localeCompare(b))[0];
}

function verifySupportFiles(skillName, skill, consumerDir) {
  for (const [section, files] of [
    ['references', skill.references],
    ['scripts', skill.scripts],
    ['assets', skill.assets],
  ]) {
    for (const [relativePath, expected] of Object.entries(files || {})) {
      for (const runtimeDir of ['.agents', '.claude']) {
        const generated = fs.readFileSync(
          path.join(consumerDir, runtimeDir, 'skills', skillName, section, relativePath),
        );
        const expectedBytes =
          typeof expected === 'string'
            ? Buffer.from(expected)
            : Buffer.from(expected.content, expected.encoding);
        if (!generated.equals(expectedBytes)) {
          throw new Error('A generated support file differs from its resolved Capability');
        }
      }
    }
  }
}

function cleanup(tempRoot, mode) {
  if (mode !== 'trash') {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    return;
  }
  const trashDir = path.join(os.homedir(), '.Trash');
  fs.mkdirSync(trashDir, { recursive: true });
  fs.renameSync(
    tempRoot,
    path.join(trashDir, `jue-local-smoke-${Date.now()}-${path.basename(tempRoot)}`),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const packagesDir = path.resolve(args['packages-dir']);
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jue-local-preset-'));
  const packDir = path.join(tempRoot, 'packs');
  const consumerDir = path.join(tempRoot, 'consumer');
  fs.mkdirSync(packDir);
  fs.mkdirSync(consumerDir);

  const originalCwd = process.cwd();
  try {
    if (args['offline-mirror'] === 'true') {
      const mirrorDir = path.join(tempRoot, 'mirror');
      createOfflineMirror(packagesDir, mirrorDir);
      process.env.AI_JUE_SOURCE_MIRROR_DIR = mirrorDir;
      // The offline mirror serves synthetic stub archives keyed by the same
      // sha256(source+ref+path) locator hash a real capability ref would
      // use. Without redirecting the cache root too, those stubs would
      // extract into the real, globally-shared `~/.cache/ai-jue` and
      // permanently shadow the real content for every future real
      // resolution of that same locator on this machine.
      process.env.AI_JUE_CACHE_DIR = path.join(tempRoot, 'capability-cache');
    }
    const archives = packPresetDirectories(packagesDir, packDir);
    fs.writeFileSync(
      path.join(consumerDir, 'package.json'),
      JSON.stringify({ name: 'jue-local-consumer', private: true }),
    );
    run(
      'npm',
      ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...archives],
      consumerDir,
    );
    fs.writeFileSync(
      path.join(consumerDir, 'ai.config.json'),
      JSON.stringify({ presets: [args.entry] }),
    );

    process.chdir(consumerDir);
    const config = normalizeConfig(await loadPreset(args.entry, 'en'));
    const skillEntry = firstEntry(config.skills);
    const agentEntry = firstEntry(config.agents);
    if (!skillEntry || !agentEntry || !config.context?.global) {
      throw new Error('The installed Preset did not resolve required Capability types');
    }

    const cli = path.resolve(__dirname, '../packages/ai-jue/dist/cli.js');
    const artifact = typeof args.artifact === 'string' ? args.artifact.trim().toLowerCase() : '';
    const pluginMode = artifact === 'plugin' || artifact === 'compatible-bundle' || artifact === 'skill-plugin';
    const artifactArgs = pluginMode ? ['--artifact', 'plugin'] : [];
    const skillNames = Object.keys(config.skills || {}).sort();
    const mcpServerNames = Object.keys(config.mcp?.servers || {}).sort();
    const [skillName, skill] = skillEntry;
    const [agentName] = agentEntry;

    function assertExists(root, relative, label) {
      if (!fs.existsSync(path.join(root, relative))) {
        throw new Error(`${label}: missing ${relative}`);
      }
    }

    function assertSkillTree(root, label, { nestedGeneral = false } = {}) {
      for (const name of skillNames) {
        const flat = name.includes('/') ? name.split('/').pop() : name;
        const skillPath = nestedGeneral
          ? path.join('skills', 'general', flat, 'SKILL.md')
          : path.join('skills', flat, 'SKILL.md');
        // Project Hermes uses category fallback; also accept encoded category keys.
        const alt = name.includes('/')
          ? path.join('skills', ...name.split('/'), 'SKILL.md')
          : null;
        if (
          !fs.existsSync(path.join(root, skillPath))
          && !(alt && fs.existsSync(path.join(root, alt)))
        ) {
          throw new Error(`${label}: missing skill ${name} (tried ${skillPath})`);
        }
      }
    }

    function assertMcpJson(root, label) {
      if (mcpServerNames.length === 0) return;
      assertExists(root, '.mcp.json', label);
      const parsed = JSON.parse(fs.readFileSync(path.join(root, '.mcp.json'), 'utf8'));
      const servers = parsed.mcpServers || {};
      for (const name of mcpServerNames) {
        if (!servers[name]) {
          throw new Error(`${label}: .mcp.json missing server ${name}`);
        }
      }
    }

    function assertCursorSkillTree(root, label) {
      for (const name of skillNames) {
        const flat = name.includes('/') ? name.split('/').pop() : name;
        const skillPath = path.join('.cursor', 'skills', flat, 'SKILL.md');
        assertExists(root, skillPath, label);
        const content = fs.readFileSync(path.join(root, skillPath), 'utf8');
        if (!content.startsWith('---\n')) {
          throw new Error(`${label}: skill ${name} missing YAML frontmatter`);
        }
        if (!content.includes('name:')) {
          throw new Error(`${label}: skill ${name} missing name frontmatter`);
        }
      }
    }

    function assertCursorMcpJson(root, label) {
      if (mcpServerNames.length === 0) return;
      assertExists(root, path.join('.cursor', 'mcp.json'), label);
      const parsed = JSON.parse(
        fs.readFileSync(path.join(root, '.cursor', 'mcp.json'), 'utf8'),
      );
      const servers = parsed.mcpServers || {};
      for (const name of mcpServerNames) {
        if (!servers[name]) {
          throw new Error(`${label}: .cursor/mcp.json missing server ${name}`);
        }
        if (servers[name].command && servers[name].type !== 'stdio') {
          throw new Error(`${label}: MCP server ${name} missing type: stdio`);
        }
      }
    }

    function assertCursorPluginTree(root, label) {
      assertExists(root, path.join('.cursor-plugin', 'plugin.json'), label);
      for (const name of skillNames) {
        const flat = name.includes('/') ? name.split('/').pop() : name;
        assertExists(root, path.join('skills', flat, 'SKILL.md'), label);
        const content = fs.readFileSync(path.join(root, 'skills', flat, 'SKILL.md'), 'utf8');
        if (!content.startsWith('---\n')) {
          throw new Error(`${label}: plugin skill ${name} missing YAML frontmatter`);
        }
      }
      if (mcpServerNames.length > 0) {
        assertExists(root, 'mcp.json', label);
      }
    }

    function expectedOpenClawBundleMarker() {
      const configured = config.tools?.openclaw?.bundleFormat;
      const configuredFormat = typeof configured === 'string'
        ? configured.trim().toLowerCase()
        : 'auto';
      const format = configuredFormat === 'claude' || configuredFormat === 'codex'
        ? configuredFormat
        : Object.keys(config.hooks || {}).length > 0 ? 'codex' : 'claude';
      return format === 'codex'
        ? path.join('.codex-plugin', 'plugin.json')
        : path.join('.claude-plugin', 'plugin.json');
    }

    if (pluginMode) {
      // Separate output dirs — plugin roots collide if written into one tree.
      const outs = {};
      for (const name of ['codex', 'claude', 'cursor', 'openclaw', 'hermes']) {
        const dir = path.join(consumerDir, `out-${name}`);
        fs.mkdirSync(dir);
        fs.writeFileSync(
          path.join(dir, 'ai.config.json'),
          JSON.stringify({ presets: [args.entry] }),
        );
        fs.writeFileSync(
          path.join(dir, 'package.json'),
          fs.readFileSync(path.join(consumerDir, 'package.json')),
        );
        fs.symlinkSync(
          path.join(consumerDir, 'node_modules'),
          path.join(dir, 'node_modules'),
          'junction',
        );
        outs[name] = dir;
      }

      run(process.execPath, [cli, 'apply', '--adapter', 'codex', ...artifactArgs], outs.codex);
      run(process.execPath, [cli, 'apply', '--adapter', 'claude-code', ...artifactArgs], outs.claude);
      run(process.execPath, [cli, 'apply', '--adapter', 'openclaw', ...artifactArgs], outs.openclaw);
      run(process.execPath, [cli, 'apply', '--adapter', 'hermes', ...artifactArgs], outs.hermes);

      run(process.execPath, [cli, 'apply', '--adapter', 'cursor', ...artifactArgs], outs.cursor);

      assertExists(outs.codex, path.join('.codex-plugin', 'plugin.json'), 'codex plugin');
      assertSkillTree(outs.codex, 'codex plugin');
      assertMcpJson(outs.codex, 'codex plugin');

      assertExists(outs.claude, path.join('.claude-plugin', 'plugin.json'), 'claude plugin');
      assertSkillTree(outs.claude, 'claude plugin');
      assertMcpJson(outs.claude, 'claude plugin');

      assertCursorPluginTree(outs.cursor, 'cursor plugin');

      // OpenClaw compatible-bundle follows the configured/auto-selected base.
      assertExists(outs.openclaw, expectedOpenClawBundleMarker(), 'openclaw bundle');
      assertSkillTree(outs.openclaw, 'openclaw bundle');
      assertMcpJson(outs.openclaw, 'openclaw bundle');

      // Hermes thin skill-plugin (skills only; mcp stays on workspace).
      assertExists(outs.hermes, 'plugin.yaml', 'hermes skill-plugin');
      assertExists(outs.hermes, '__init__.py', 'hermes skill-plugin');
      assertSkillTree(outs.hermes, 'hermes skill-plugin');
    } else {
      run(process.execPath, [cli, 'apply', '--adapter', 'codex'], consumerDir);
      run(process.execPath, [cli, 'apply', '--adapter', 'claude-code'], consumerDir);
      run(process.execPath, [cli, 'apply', '--adapter', 'openclaw'], consumerDir);
      run(process.execPath, [cli, 'apply', '--adapter', 'hermes'], consumerDir);

      run(process.execPath, [cli, 'apply', '--adapter', 'cursor'], consumerDir);
      run(process.execPath, [cli, 'apply', '--adapter', 'cursor', '--dry-run'], consumerDir);
      run(process.execPath, [cli, 'apply', '--adapter', 'cursor', '--check'], consumerDir);

      for (const relative of [
        'AGENTS.md',
        'CLAUDE.md',
        'MEMORY.md',
        path.join('.agents', 'skills', skillName, 'SKILL.md'),
        path.join('.codex', 'agents', `${agentName}.toml`),
        path.join('.claude', 'skills', skillName, 'SKILL.md'),
        path.join('.claude', 'agents', `${agentName}.md`),
        path.join('.cursor', 'agents', `${agentName}.md`),
        path.join('skills', skillName, 'SKILL.md'),
        path.join('skills', 'general', skillName, 'SKILL.md'),
      ]) {
        assertExists(consumerDir, relative, 'workspace apply');
      }
      assertCursorSkillTree(consumerDir, 'cursor apply');
      assertCursorMcpJson(consumerDir, 'cursor apply');
      verifySupportFiles(skillName, skill, consumerDir);
    }
    console.log(
      `[OK] isolated local Preset install -> Codex/Claude Code/Cursor/OpenClaw/Hermes`
      + (pluginMode ? ` artifact=plugin skills=${skillNames.length} mcp=${mcpServerNames.length}` : '')
      + ` (${archives.length} packages)`,
    );
  } finally {
    process.chdir(originalCwd);
    cleanup(tempRoot, args.cleanup || 'delete');
  }
}

main().catch((error) => {
  console.error(`[ERROR] ${error.message}`);
  process.exitCode = 1;
});
