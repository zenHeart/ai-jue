import path from 'path';
import fs from 'fs';
import * as yaml from 'js-yaml'; // Import js-yaml
import { MergedConfig } from './config';
import { deepMerge } from 'ai-jue-core';

type FrontmatterResult = {
  content: string;
  attributes: Record<string, any>;
};

async function readJsonIfExists(filePath: string): Promise<any> {
  if (!fs.existsSync(filePath)) return {};
  const content = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

// Helper to load all files in a subdirectory as a key-value pair (filename -> content)
async function loadAssetSubdir(dirPath: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(dirPath)) return result;

  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const filePath = path.join(dirPath, entry.name);
        result[entry.name] = await fs.promises.readFile(filePath, 'utf8');
      }),
  );
  return result;
}

// Replaced parseSimpleYamlFrontmatter with a robust YAML parser using js-yaml
function parseYamlFrontmatter(yamlText: string): Record<string, any> {
  try {
    return (yaml.load(yamlText) as Record<string, any>) || {};
  } catch (error) {
    console.error('Error parsing YAML frontmatter:', error);
    return {};
  }
}

function parseMarkdownWithFrontmatter(raw: string): FrontmatterResult {
  if (!raw.startsWith('---\n')) {
    return { content: raw, attributes: {} };
  }

  const closingIndex = raw.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    return { content: raw, attributes: {} };
  }

  const yamlText = raw.slice(4, closingIndex);
  const content = raw.slice(closingIndex + 5);
  return {
    content,
    attributes: parseYamlFrontmatter(yamlText), // Use the new yaml parser
  };
}

function findLocalizedFile(baseDir: string, fileNames: string[], userLanguage?: string): string | null {
  if (userLanguage) {
    for (const fileName of fileNames) {
      const parsed = path.parse(fileName);
      const localized = path.join(baseDir, `${parsed.name}.${userLanguage}${parsed.ext}`);
      if (fs.existsSync(localized)) return localized;
    }
  }

  for (const fileName of fileNames) {
    const defaultFile = path.join(baseDir, fileName);
    if (fs.existsSync(defaultFile)) return defaultFile;
  }

  return null;
}

async function loadNamedAssetDir(
  config: MergedConfig,
  dirPath: string,
  section: string,
  preferredFiles: string[],
  userLanguage?: string,
): Promise<void> {
  if (!fs.existsSync(dirPath)) return;
  if (!config[section]) config[section] = {};

  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const assetName = entry.name;
        const assetDir = path.join(dirPath, assetName);
        const contentPath = findLocalizedFile(assetDir, preferredFiles, userLanguage);
        if (!contentPath) return;

        const rawContent = await fs.promises.readFile(contentPath, 'utf8');
        const parsed = parseMarkdownWithFrontmatter(rawContent);
        
        // Load subdirectories if they exist (common for Agent Skills)
        const [references, scripts, assets] = await Promise.all([
          loadAssetSubdir(path.join(assetDir, 'references')),
          loadAssetSubdir(path.join(assetDir, 'scripts')),
          loadAssetSubdir(path.join(assetDir, 'assets')),
        ]);

        config[section][assetName] = { 
          ...parsed.attributes, 
          content: parsed.content,
          references: Object.keys(references).length > 0 ? references : undefined,
          scripts: Object.keys(scripts).length > 0 ? scripts : undefined,
          assets: Object.keys(assets).length > 0 ? assets : undefined,
        };
      }),
  );
}

async function loadCommands(config: MergedConfig, dirPath: string, userLanguage?: string): Promise<void> {
  if (!fs.existsSync(dirPath)) return;
  const commands = (config.commands ??= {});

  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const commandName = entry.name;
        const commandDir = path.join(dirPath, commandName);
        const promptPath = findLocalizedFile(commandDir, ['prompt.md'], userLanguage);
        if (!promptPath) return;

        const rawPrompt = await fs.promises.readFile(promptPath, 'utf8');
        const parsed = parseMarkdownWithFrontmatter(rawPrompt);
        commands[commandName] = {
          ...parsed.attributes,
          prompt: parsed.content,
        };
      }),
  );
}

async function loadAgents(config: MergedConfig, dirPath: string, userLanguage?: string): Promise<void> {
  if (!fs.existsSync(dirPath)) return;
  const agents = (config.agents ??= {});

  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const agentName = entry.name;
        const agentDir = path.join(dirPath, agentName);
        const meta = await readJsonIfExists(path.join(agentDir, 'index.json'));
        const promptPath = findLocalizedFile(agentDir, ['prompt.md', 'AGENTS.md'], userLanguage);
        if (!promptPath) return;

        const rawPrompt = await fs.promises.readFile(promptPath, 'utf8');
        const parsed = parseMarkdownWithFrontmatter(rawPrompt);
        agents[agentName] = { ...meta, ...parsed.attributes, prompt: parsed.content, content: parsed.content };
      }),
  );
}

async function loadHooks(config: MergedConfig, dirPath: string, userLanguage?: string): Promise<void> {
  if (!fs.existsSync(dirPath)) return;
  const hooks = (config.hooks ??= {});

  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const hookName = entry.name;
        const hookDir = path.join(dirPath, hookName);
        const meta = await readJsonIfExists(path.join(hookDir, 'index.json'));
        const promptPath = findLocalizedFile(hookDir, ['prompt.md'], userLanguage);

        if (promptPath) {
          const script = (await fs.promises.readFile(promptPath, 'utf8')).trim();
          hooks[hookName] = script;
          return;
        }

        if (typeof meta.script === 'string' && meta.script.trim()) {
          hooks[hookName] = meta.script;
        }
      }),
  );
}

async function loadToolConfigs(config: MergedConfig, toolsDir: string): Promise<void> {
  if (!fs.existsSync(toolsDir)) return;
  const tools = (config.tools ??= {});

  const entries = await fs.promises.readdir(toolsDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const toolName = entry.name;
        const toolDir = path.join(toolsDir, toolName);
        const configPath = path.join(toolDir, 'config.json');
        if (!fs.existsSync(configPath)) return;
        tools[toolName] = await readJsonIfExists(configPath);
      }),
  );
}

export async function loadAssetsFromDir(dirPath: string, userLanguage?: string): Promise<MergedConfig> {
  const config: MergedConfig = {};

  if (!config.context) config.context = {};

  const topLevelAgentsFile = findLocalizedFile(dirPath, ['AGENTS.md'], userLanguage);
  if (topLevelAgentsFile) {
    config.context.global = await fs.promises.readFile(topLevelAgentsFile, 'utf8');
  }

  await Promise.all([
    loadNamedAssetDir(config, path.join(dirPath, 'rules'), 'rules', ['prompt.md', 'AGENTS.md'], userLanguage),
    loadNamedAssetDir(config, path.join(dirPath, 'skills'), 'skills', ['SKILL.md'], userLanguage),
    loadAgents(config, path.join(dirPath, 'agents'), userLanguage),
    loadCommands(config, path.join(dirPath, 'commands'), userLanguage),
    loadHooks(config, path.join(dirPath, 'hooks'), userLanguage),
    loadToolConfigs(config, path.join(dirPath, 'tools')),
  ]);

  return config;
}

export async function loadPreset(presetName: string, userLanguage?: string): Promise<MergedConfig> {
  if (!presetName) return {};
  return loadPresetRecursive(presetName, userLanguage, []);
}

function mergeConfigWithLayeredContext(
  base: MergedConfig,
  incoming: MergedConfig,
): MergedConfig {
  const baseContext = typeof base?.context?.global === 'string' ? base.context.global.trim() : '';
  const incomingContext = typeof incoming?.context?.global === 'string' ? incoming.context.global.trim() : '';
  const merged = deepMerge(base, incoming);
  const layeredContext = [baseContext, incomingContext].filter(Boolean).join('\n\n');

  if (layeredContext) {
    merged.context = merged.context || {};
    merged.context.global = layeredContext;
  }

  return merged;
}

function normalizePresetPackageName(presetName: string): string {
  if (presetName.startsWith('jue-preset-')) return presetName;
  return `jue-preset-${presetName}`;
}

function extractNestedPresets(packageJson: any): string[] {
  const candidate =
    packageJson?.ai?.presets ?? packageJson?.jue?.presets;
  if (!Array.isArray(candidate)) return [];
  return candidate
    .map((item: unknown) => String(item).trim())
    .filter(Boolean);
}

async function loadPresetRecursive(
  presetName: string,
  userLanguage: string | undefined,
  resolvingStack: string[],
): Promise<MergedConfig> {
  const packageName = normalizePresetPackageName(presetName);

  if (resolvingStack.includes(packageName)) {
    const cyclePath = [...resolvingStack, packageName].join(' -> ');
    console.error(`Preset dependency cycle detected: ${cyclePath}`);
    return {};
  }

  const nextStack = [...resolvingStack, packageName];

  try {
    const packageJsonPath = require.resolve(`${packageName}/package.json`);
    const presetPath = path.dirname(packageJsonPath);
    const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
    const nestedPresets = extractNestedPresets(packageJson);

    let mergedConfig: MergedConfig = {};

    for (const nestedPresetName of nestedPresets) {
      const nestedPresetConfig = await loadPresetRecursive(
        nestedPresetName,
        userLanguage,
        nextStack,
      );
      mergedConfig = mergeConfigWithLayeredContext(mergedConfig, nestedPresetConfig);
    }

    const selfConfig = await loadAssetsFromDir(presetPath, userLanguage);
    return mergeConfigWithLayeredContext(mergedConfig, selfConfig);
  } catch (error: any) {
    console.error(`Error loading preset "${presetName}":`, error.message);
    return {};
  }
}
