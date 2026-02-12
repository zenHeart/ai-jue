import fs from 'fs';
import path from 'path';

/**
 * Deep merges two objects.
 * (Recursive implementation)
 */
export function deepMerge(target: any, source: any) {
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

/**
 * Generates a Markdown file with "Smart Coexistence" strategy.
 */
export function generateMarkdownFile(filePath: string, content: string) {
    const startTag = '<!-- AI-JUE:START -->';
    const endTag = '<!-- AI-JUE:END -->';
    const managedContent = `${startTag}\n${content}\n${endTag}`;

    let finalContent = managedContent;

    if (fs.existsSync(filePath)) {
        const existingContent = fs.readFileSync(filePath, 'utf8');
        const escapedStart = startTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedEnd = endTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const managedBlockPattern = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}\\n?`, 'g');
        const userContent = existingContent.replace(managedBlockPattern, '').trim();
        finalContent = userContent ? `${userContent}\n\n${managedContent}` : managedContent;
    } else {
        // Create directory if not exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    fs.writeFileSync(filePath, finalContent);
    // console.log(`Generated ${filePath}`);
}

/**
 * Generates a JSON file with "Deep Merge" strategy.
 */
export function generateJsonFile(filePath: string, content: any) {
    let finalContent = content;

    if (fs.existsSync(filePath)) {
        try {
            const existingContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            finalContent = deepMerge(existingContent, content);
        } catch (e) {
            console.warn(`[ai-jue-core] Warning: Failed to parse existing JSON file ${filePath}. Overwriting with new content.`);
        }
    } else {
        // Create directory if not exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(finalContent, null, 2));
    // console.log(`Generated ${filePath}`);
}
