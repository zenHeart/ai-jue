import { cosmiconfig } from 'cosmiconfig';

export interface MergedConfig {
  preset?: string;
  language?: string; // Add language property
  [key: string]: any;
}

const explorer = cosmiconfig('ai', {
  searchPlaces: [
    'ai.config.js',
    'ai.config.json',
    '.airc.js',
    '.airc.json',
    'jue.config.js',
    'jue.config.json',
    '.juerc.js',
    '.juerc.json',
    'package.json'
  ],
});

export async function loadConfig(): Promise<MergedConfig> {
  try {
    const result = await explorer.search();
    if (result && result.config) {
      if (typeof result.config === 'function') {
        const config = result.config();
        if (config instanceof Promise) {
          return await config;
        }
        return config;
      }
      return result.config;
    }
    return {};
  } catch (error) {
    console.error('Error loading configuration:', error);
    return {};
  }
}