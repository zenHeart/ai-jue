import { MergedConfig } from './config';
import { loadPreset, loadAssetsFromDir } from './preset';
import { deepMerge } from 'ai-jue-core';
import path from 'path';
import fs from 'fs';
import { normalizeConfig } from './normalize';

function mergeConfigWithLayeredContext(
  base: MergedConfig,
  incoming: MergedConfig,
): MergedConfig {
    const baseContext = typeof base?.context?.global === 'string' ? base.context.global.trim() : '';
    const incomingContext =
      typeof incoming?.context?.global === 'string' ? incoming.context.global.trim() : '';
    const merged = deepMerge(base, incoming);
    const layeredContext = [baseContext, incomingContext].filter(Boolean).join('\n\n');

    if (layeredContext) {
      merged.context = merged.context || {};
      merged.context.global = layeredContext;
    }

    return merged;
}

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
