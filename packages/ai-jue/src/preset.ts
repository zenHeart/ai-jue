import path from 'path';
import fs from 'fs';
import { MergedConfig } from './config';

type FrontmatterResult = {
  content: string;
  attributes: Record<string, any>;
};

async function readJsonIfExists(filePath: string): Promise<any> {
  if (!fs.existsSync(filePath)) return {};
  const content = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

function parseYamlScalar(value: string): any {
  const raw = value.trim();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  return raw;
}

function parseSimpleYamlFrontmatter(yamlText: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = yamlText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf(':');
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!key) continue;

    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayBody = value.slice(1, -1).trim();
      result[key] = arrayBody
        ? arrayBody.split(',').map((item) => parseYamlScalar(item))
        : [];
      continue;
    }

    result[key] = parseYamlScalar(value);
  }

  return result;
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
    attributes: parseSimpleYamlFrontmatter(yamlText),
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
    const fallback = path.join(baseDir, fileName);
    if (fs.existsSync(fallback)) return fallback;
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
        const metadata = await readJsonIfExists(path.join(assetDir, 'META.json'));
        config[section][assetName] = { ...metadata, ...parsed.attributes, content: parsed.content };
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
        const meta = await readJsonIfExists(path.join(commandDir, 'index.json'));
        const promptPath = findLocalizedFile(commandDir, ['prompt.md'], userLanguage);
        if (!promptPath) return;

        const rawPrompt = await fs.promises.readFile(promptPath, 'utf8');
        const parsed = parseMarkdownWithFrontmatter(rawPrompt);
        commands[commandName] = {
          ...meta,
          ...parsed.attributes,
          prompt: parsed.content,
          content: parsed.content,
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
  } else {
    // Transitional support: allow prompts/AGENTS.md to serve as global context.
    const promptsDir = path.join(dirPath, 'prompts');
    if (fs.existsSync(promptsDir)) {
      const promptAgents = findLocalizedFile(promptsDir, ['AGENTS.md'], userLanguage);
      if (promptAgents) {
        config.context.global = await fs.promises.readFile(promptAgents, 'utf8');
      }
    }
  }

  await Promise.all([
    loadNamedAssetDir(config, path.join(dirPath, 'rules'), 'rules', ['prompt.md', 'AGENTS.md'], userLanguage),
    loadNamedAssetDir(config, path.join(dirPath, 'skills'), 'skills', ['prompt.md', 'AGENTS.md'], userLanguage),
    loadAgents(config, path.join(dirPath, 'agents'), userLanguage),
    loadCommands(config, path.join(dirPath, 'commands'), userLanguage),
    loadHooks(config, path.join(dirPath, 'hooks'), userLanguage),
    loadToolConfigs(config, path.join(dirPath, 'tools')),
  ]);

  // Transitional support for legacy prompt buckets (tool-specific prompts).
  await loadNamedAssetDir(
    config,
    path.join(dirPath, 'prompts'),
    'prompts',
    ['prompt.md', 'AGENTS.md'],
    userLanguage,
  );

  return config;
}

export async function loadPreset(presetName: string, userLanguage?: string): Promise<MergedConfig> {
  if (!presetName) return {};
  const packageName = `jue-preset-${presetName}`;

  try {
    const presetPath = path.dirname(require.resolve(`${packageName}/package.json`));
    return await loadAssetsFromDir(presetPath, userLanguage);
  } catch (error: any) {
    console.error(`Error loading preset "${presetName}":`, error.message);
    return {};
  }
}
