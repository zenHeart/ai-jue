import path from 'path';
import fs from 'fs';
// Assuming MergedConfig is defined in './config'
import { MergedConfig } from './config';

function findContentFile(assetPath: string, patterns: string[], userLanguage?: string): string | null { // Added userLanguage here
  // 1. Exact language match (if userLanguage is set)
  if (userLanguage) {
    for (const pattern of patterns) {
      const base = path.parse(pattern).name;
      const ext = path.parse(pattern).ext;
      const langFile = path.join(assetPath, `${base}.${userLanguage}${ext}`);
      if (fs.existsSync(langFile)) return langFile;
    }
  }

  // 2. Fallback to generic, non-language-suffixed match
  for (const pattern of patterns) {
    const genericFile = path.join(assetPath, pattern);
    if (fs.existsSync(genericFile)) return genericFile;
  }
  
  return null;
}

function loadAssetsFromDir(dirPath: string, userLanguage?: string): MergedConfig {
  const config: MergedConfig = {};

  const contentAssetTypes: { [key: string]: string[] } = {
    prompts: ['AGENTS.md', 'prompt.md'],
    skills: ['AGENTS.md', 'prompt.md'],
    commands: ['command.js', 'command.ts'],
    'sub-agents': ['AGENTS.md', 'prompt.md'],
    mcp: ['index.js', 'index.ts'], // assuming mcp assets have an index file
  };

  // Load content-based asset types (prompts, skills, commands, sub-agents, mcp)
  for (const assetType in contentAssetTypes) {
    const currentAssetDir = path.join(dirPath, assetType);
    if (fs.existsSync(currentAssetDir)) {
      config[assetType] = {};
      const assetFolders = fs.readdirSync(currentAssetDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const folderName of assetFolders) {
        const assetPath = path.join(currentAssetDir, folderName);
        const contentFilePath = findContentFile(assetPath, contentAssetTypes[assetType], userLanguage);
        
        if (contentFilePath) {
          const fileContent = fs.readFileSync(contentFilePath, 'utf8');
          let metadata = {};
          const metaPath = path.join(assetPath, 'META.json');
          if (fs.existsSync(metaPath)) {
            metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          }
          config[assetType][folderName] = { ...metadata, content: fileContent };
        }
      }
    }
  }

  // Handle top-level AGENTS.md
  const topLevelAgentsFile = findContentFile(dirPath, ['AGENTS.md'], userLanguage);
  if (topLevelAgentsFile) {
    if (!config.prompts) config.prompts = {};
    config.prompts['agents'] = { content: fs.readFileSync(topLevelAgentsFile, 'utf8') };
  }

  // --- NEW: Handle Tools separately ---
  const toolsDir = path.join(dirPath, 'tools');
  if (fs.existsSync(toolsDir)) {
    config.tools = {};
    const toolFolders = fs.readdirSync(toolsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const folderName of toolFolders) {
      const toolPath = path.join(toolsDir, folderName);
      const configJsonPath = path.join(toolPath, 'config.json'); // Expecting config.json directly

      if (fs.existsSync(configJsonPath)) {
        config.tools[folderName] = JSON.parse(fs.readFileSync(configJsonPath, 'utf8'));
      }
    }
  }
  // --- END NEW ---

  return config;
}

export async function loadPreset(presetName: string, userLanguage?: string): Promise<MergedConfig> {
  if (!presetName) return {};
  const packageName = `jue-preset-${presetName}`;

  try {
    const presetPath = path.dirname(require.resolve(`${packageName}/package.json`));
    return loadAssetsFromDir(presetPath, userLanguage);
  } catch (error: any) {
    console.error(`Error loading preset "${presetName}":`, error.message);
    return {};
  }
}
