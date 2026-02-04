import path from 'path';
import fs from 'fs';

const AI_JUE_START_MARKER = '<!-- AI-JUE:START -->';
const AI_JUE_END_MARKER = '<!-- AI-JUE:END -->';
const AI_JUE_WARNING = '<!-- 警告：以下内容由 ai-jue 自动生成，手动修改将在下次运行时被覆盖。 -->\n<!-- 要修改这部分内容，请更新你的 ai.config.js 或相关预设。 -->\n';

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
  console.log(`[adapter-claude] Generated/Updated Markdown file: ${filePath}`);
}

export async function generate(config: any, outputDir: string): Promise<void> {
  const prompt = config.prompts?.claude || config.prompts?.agents;
  if (prompt && prompt.content) { // Changed from prompt.prompt
    const filePath = path.join(outputDir, 'CLAUDE.md');
    generateMarkdownFile(filePath, prompt.content);
  }
}
