import { MergedConfig } from './config';
import { loadPreset, loadAssetsFromDir } from './preset';
import { deepMerge } from 'ai-jue-core';
import path from 'path';
import fs from 'fs';
import { normalizeConfig } from './normalize';

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
         finalConfig = deepMerge(finalConfig, presetConfig);
      }
    }

    const localAiDir = path.join(process.cwd(), '.ai');

    if (fs.existsSync(localAiDir)) {
      const localAssets = await loadAssetsFromDir(localAiDir, userConfig.language);
      finalConfig = deepMerge(finalConfig, localAssets);
    }

    if (userConfig.extends) {
      const extendedAssets = await loadExtendedAssets(userConfig.extends, process.cwd());
      finalConfig = deepMerge(finalConfig, extendedAssets);
    }

    finalConfig = deepMerge(finalConfig, userConfig);
    return normalizeConfig(finalConfig);
}
