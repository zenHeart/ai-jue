#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { loadConfig, MergedConfig } from './config';
import { loadPreset } from './preset';
import * as glob from 'glob';
import path from 'path';
import fs from 'fs';

// Basic deep merge function - for now, keep it simple
function deepMerge(target: any, source: any) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key]) &&
          typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
        target[key] = deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

async function findAdapters(): Promise<string[]> {
  const rootDir = process.cwd();
  const options = { cwd: rootDir, realpath: true as const };

  const [monorepoAdapters, installedAdapters] = await Promise.all([
    glob.glob('packages/ai-jue-adapter-*/package.json', options),
    glob.glob('**/node_modules/ai-jue-adapter-*/package.json', options)
  ]);
  
  const allAdapterPackageJsons = [...monorepoAdapters, ...installedAdapters];
  const uniqueAdapterPackageJsons = [...new Set(allAdapterPackageJsons)];

  const packageNames: string[] = [];
  for (const pkgJsonPath of uniqueAdapterPackageJsons) {
    try {
      const pkgJsonContent = fs.readFileSync(pkgJsonPath, 'utf8');
      const pkgJson = JSON.parse(pkgJsonContent);
      if (pkgJson.name) {
        packageNames.push(pkgJson.name);
      }
    } catch (e) {
      console.error(`Could not read or parse ${pkgJsonPath}`, e);
    }
  }
  return packageNames;
}


async function runAdapters(config: MergedConfig, outputDir: string) {
  const adapterNames = await findAdapters();
  if (adapterNames.length === 0) {
    console.warn('No adapters found. No files will be generated.');
    return;
  }

  console.log(`Found ${adapterNames.length} adapter(s):`, adapterNames);

  for (const adapterName of adapterNames) {
    try {
      const adapter = require(adapterName);
      if (adapter.generate && typeof adapter.generate === 'function') {
        await adapter.generate(config, outputDir);
      } else {
        console.warn(`Adapter ${adapterName} does not export a 'generate' function.`);
      }
    } catch (error: any) {
      console.error(`Error running adapter ${adapterName}:`, error.message);
    }
  }
}

yargs(hideBin(process.argv))
  .command(
    'apply',
    'Apply AI configurations based on ai.config.js',
    (yargs) => {},
    async (argv) => {
      console.log('Running apply command...');
      const config = await loadConfig();
      console.log('Loaded user config:', config);

      let finalConfig: MergedConfig = { ...config };

      const presetName = config.preset;
      if (presetName) {
        // Pass the language from the config to the preset loader
        const presetConfig = await loadPreset(presetName, config.language);
        console.log(`Loaded preset "${presetName}" with language "${config.language || 'default'}":`, presetConfig);
        finalConfig = deepMerge(presetConfig, finalConfig);
      } else {
        console.log('No preset specified in config.');
      }

      console.log('Final merged config:', finalConfig);

      // Run all discovered adapters
      await runAdapters(finalConfig, process.cwd());

      console.log('Apply command finished.');
    }
  )
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .argv;