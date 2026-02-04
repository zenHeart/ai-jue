import path from 'path';
import fs from 'fs';
import { MergedConfig } from './config';

function findContentFile(assetPath: string, patterns: string[], userLanguage?: string): string | null {
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

  const assetTypes: { [key: string]: string[] } = {
    prompts: ['AGENTS.md', 'prompt.md'],
    skills: ['AGENTS.md', 'prompt.md'],
    commands: ['command.js', 'command.ts'],
    'sub-agents': ['AGENTS.md', 'prompt.md'],
    tools: ['config.json'], // Added tools definition
    mcp: ['*.js', '*.ts'],
  };
  
  for (const assetType in assetTypes) {
    const assetDir = path.join(dirPath, assetType);
    if (fs.existsSync(assetDir)) {
      config[assetType] = {};
      const assetFolders = fs.readdirSync(assetDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const folderName of assetFolders) {
        const assetPath = path.join(assetDir, folderName);
        const contentFilePath = findContentFile(assetPath, assetTypes[assetType], userLanguage);
        
        if (contentFilePath) {
          const fileContent = fs.readFileSync(contentFilePath, 'utf8');
          let metadata = {};
          const metaPath = path.join(assetPath, 'META.json');
          if (fs.existsSync(metaPath)) {
            metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          }

          // Handle JSON files for 'tools' differently
          if (assetType === 'tools' && path.extname(contentFilePath) === '.json') {
            config[assetType][folderName] = JSON.parse(fileContent);
          } else {
            config[assetType][folderName] = { ...metadata, content: fileContent };
          }
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
