import { MergedConfig } from './config';
import { loadPreset, loadAssetsFromDir } from './preset';
import path from 'path';
import fs from 'fs';
import { normalizeConfig } from './normalize';
import { mergeConfigWithLayeredContext } from './merge';

/**
 * Loads external asset files defined in the 'extends' property of ai.config.js.
 * 
 * @param extendsConfig - Map of categories to file paths
 * @param rootDir - Root directory for resolving relative paths
 * @returns A partial MergedConfig containing the loaded assets
 */
async function loadExtendedAssets(extendsConfig: { [key: string]: string | string[] }, rootDir: string): Promise<MergedConfig> {
    const config: MergedConfig = {};
    await Promise.all(Object.entries(extendsConfig).map(async ([key, value]) => {
      if (!config[key]) config[key] = {};
      
      const paths = Array.isArray(value) ? value : [value];
      await Promise.all(paths.map(async (p) => {
          const absPath = path.resolve(rootDir, p);
          if (fs.existsSync(absPath)) {
              const content = await fs.promises.readFile(absPath, 'utf8');
              const name = path.basename(absPath, path.extname(absPath));
              config[key][name] = { content };
          } else {
              console.warn(`Extended asset not found: ${absPath}`);
          }
      }));
    }));
    return config;
}

/**
 * Resolves the final configuration by aggregating all sources in the following priority:
 * 1. Base/Dependency Presets
 * 2. Current Preset
 * 3. Local .ai/ directory assets
 * 4. Project root AGENTS.md
 * 5. Extended assets (from 'extends' property)
 * 6. Explicit user configuration in ai.config.js
 * 
 * Finally, the configuration is normalized via normalizeConfig.
 * 
 * @param userConfig - The initial configuration loaded from ai.config.js
 * @returns The fully resolved and layered configuration
 */
export async function resolveFinalConfig(userConfig: MergedConfig): Promise<MergedConfig> {
    let finalConfig: MergedConfig = { };

    let presets: string[] = [];
    if (userConfig.presets && Array.isArray(userConfig.presets)) {
      presets = userConfig.presets;
    } else if (userConfig.preset) {
      presets = [userConfig.preset];
    }

    if (presets.length > 0) {
      for (const presetName of presets) {
         const presetConfig = await loadPreset(presetName, userConfig.language);
         finalConfig = mergeConfigWithLayeredContext(finalConfig, presetConfig);
      }
    }

    const localAiDir = path.join(process.cwd(), '.ai');
    const localJueDir = path.join(process.cwd(), '.jue');

    if (fs.existsSync(localAiDir)) {
      const localAssets = await loadAssetsFromDir(localAiDir, userConfig.language);
      finalConfig = mergeConfigWithLayeredContext(finalConfig, localAssets);
    } else if (fs.existsSync(localJueDir)) {
      const localAssets = await loadAssetsFromDir(localJueDir, userConfig.language);
      finalConfig = mergeConfigWithLayeredContext(finalConfig, localAssets);
    }
    
    // Explicitly load root AGENTS.md from process.cwd() - MOVED THIS BLOCK
    const rootAgentsFile = path.join(process.cwd(), 'AGENTS.md');
    if (fs.existsSync(rootAgentsFile)) {
        const rootAgentsContent = await fs.promises.readFile(rootAgentsFile, 'utf8');
        const rootConfig: MergedConfig = {
            context: {
                global: rootAgentsContent
            }
        };
        finalConfig = mergeConfigWithLayeredContext(finalConfig, rootConfig);
    }

    if (userConfig.extends) {
      const extendedAssets = await loadExtendedAssets(userConfig.extends, process.cwd());
      finalConfig = mergeConfigWithLayeredContext(finalConfig, extendedAssets);
    }

    finalConfig = mergeConfigWithLayeredContext(finalConfig, userConfig);
    return normalizeConfig(finalConfig);
}
