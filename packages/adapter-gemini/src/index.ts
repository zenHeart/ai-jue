import path from 'path';
import fs from 'fs';

// NOTE: This is duplicated logic. In a future step, this should be
// extracted into a shared `ai-jue-utils` package.

const AI_JUE_START_MARKER = '<!-- AI-JUE:START -->';
const AI_JUE_END_MARKER = '<!-- AI-JUE:END -->';
const AI_JUE_WARNING = '<!-- 警告：以下内容由 ai-jue 自动生成，手动修改将在下次运行时被覆盖。 -->\n<!-- 要修改这部分内容，请更新你的 ai.config.js 或相关预设。 -->\n';

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

function generateMarkdownFile(filePath: string, newContent: string) {
  const parentDir = path.dirname(filePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  let existingContent = '';
  if (fs.existsSync(filePath)) {
    existingContent = fs.readFileSync(filePath, 'utf8');
  }

  const startIndex = existingContent.indexOf(AI_JUE_START_MARKER);
  const endIndex = existingContent.indexOf(AI_JUE_END_MARKER);

  let outputContent;

  if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    const before = existingContent.substring(0, startIndex + AI_JUE_START_MARKER.length);
    const after = existingContent.substring(endIndex);
    outputContent = `${before}\n${AI_JUE_WARNING}\n${newContent}\n${after}`;
  } else {
    outputContent = `${AI_JUE_START_MARKER}\n${AI_JUE_WARNING}\n${newContent}\n${AI_JUE_END_MARKER}\n\n${existingContent}`;
  }

  fs.writeFileSync(filePath, outputContent, 'utf8');
  console.log(`[adapter-gemini] Generated/Updated Markdown file: ${filePath}`);
}

function generateJsonFile(filePath: string, newConfig: any) {
  const parentDir = path.dirname(filePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  let existingConfig = {};
  if (fs.existsSync(filePath)) {
    try {
      existingConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.warn(`[adapter-gemini] Warning: Existing JSON file ${filePath} is invalid. Overwriting.`);
      existingConfig = {};
    }
  }

  const mergedConfig = deepMerge(existingConfig, newConfig);

  fs.writeFileSync(filePath, JSON.stringify(mergedConfig, null, 2), 'utf8');
  console.log(`[adapter-gemini] Generated/Updated JSON file: ${filePath}`);
}

export async function generate(config: any, outputDir: string): Promise<void> {
  // Generate GEMINI.md
  if (config.prompts && config.prompts.gemini) {
    const mdFilePath = path.join(outputDir, 'GEMINI.md');
    generateMarkdownFile(mdFilePath, config.prompts.gemini);
  }

  // Generate .gemini/settings.json
  if (config.tools && config.tools.gemini) {
    const jsonFilePath = path.join(outputDir, '.gemini', 'settings.json');
    generateJsonFile(jsonFilePath, config.tools.gemini);
  }
}
