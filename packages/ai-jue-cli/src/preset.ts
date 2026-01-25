import { MergedConfig } from './config';

export async function loadPreset(presetName: string): Promise<MergedConfig> {
  if (!presetName) {
    return {};
  }

  const packageName = `jue-preset-${presetName}`;

  try {
    const presetPath = require.resolve(packageName);
    const presetModule = require(presetPath);

    if (typeof presetModule === 'function') {
      const config = presetModule();
      if (config instanceof Promise) {
        return await config;
      }
      return config;
    }
    return presetModule;
  } catch (error: any) {
    console.error(`Error loading preset "${presetName}":`, error.message);
    return {};
  }
}