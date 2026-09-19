import fs from 'fs';
import path from 'path';

const UNSAFE_MERGE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertNoUnsafeMergeKeys(value: unknown): void {
  if (typeof value !== 'object' || value === null) return;
  for (const key of Object.keys(value)) {
    if (UNSAFE_MERGE_KEYS.has(key)) {
      throw new Error('Unsafe JSON merge key');
    }
    assertNoUnsafeMergeKeys((value as Record<string, unknown>)[key]);
  }
}

/** Deep merges `source` into `target` (recursive, mutates and returns `target`). */
export function deepMerge(target: any, source: any): any {
  if (!isJsonObject(target) || !isJsonObject(source)) {
    throw new Error('JSON merge inputs must be objects');
  }
  assertNoUnsafeMergeKeys(target);
  assertNoUnsafeMergeKeys(source);
  for (const key of Object.keys(source)) {
    if (isJsonObject(source[key]) && isJsonObject(target[key])) {
      target[key] = deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const AI_JUE_START_TAG = '<!-- AI-JUE:START -->';
const AI_JUE_END_TAG = '<!-- AI-JUE:END -->';
const ESCAPED_START = AI_JUE_START_TAG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ESCAPED_END = AI_JUE_END_TAG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MANAGED_BLOCK_RE = new RegExp(`${ESCAPED_START}[\\s\\S]*?${ESCAPED_END}\\n?`, 'g');
const ORPHAN_TAG_RE = new RegExp(`^\\s*(?:${ESCAPED_START}|${ESCAPED_END})\\s*$`, 'gm');
const MANAGED_BLOCK_CONTENT_RE = new RegExp(`${ESCAPED_START}\\n([\\s\\S]*?)\\n${ESCAPED_END}`);

/**
 * Strips `<!-- AI-JUE:START -->...<!-- AI-JUE:END -->` managed blocks
 * (and any orphan tags) from the given markdown content.
 */
export function stripManagedBlock(content: string): string {
    return content
        .replace(MANAGED_BLOCK_RE, '')
        .replace(ORPHAN_TAG_RE, '')
        .trim();
}

/**
 * The complement of `stripManagedBlock`: returns only what Jue owns — the
 * content between `AI-JUE:START/END` when a managed block exists, or the
 * whole trimmed content when it doesn't yet (a native file Jue has never
 * written to, so the whole thing is fair game to read as Jue-managed).
 */
export function extractManagedContent(content: string): string {
    const match = content.match(MANAGED_BLOCK_CONTENT_RE);
    return match ? match[1].trim() : content.trim();
}

/**
 * Pure "Smart Coexistence" computation: merges new managed content into an
 * existing file's content (or produces a fresh managed block when there is
 * no existing content), without touching the filesystem. `generateMarkdownFile`
 * and any Adapter `write()` that needs the identical merge semantics both
 * call this, so the two never drift apart.
 */
export function computeManagedMarkdown(existingContent: string | undefined, content: string): string {
    const cleanContent = stripManagedBlock(content);
    const managedContent = `${AI_JUE_START_TAG}\n${cleanContent}\n${AI_JUE_END_TAG}`;

    if (existingContent === undefined) {
        return managedContent;
    }
    const userContent = stripManagedBlock(existingContent);
    return userContent ? `${userContent}\n\n${managedContent}` : managedContent;
}

/**
 * Generates a Markdown file with "Smart Coexistence" strategy.
 */
export function generateMarkdownFile(filePath: string, content: string) {
    const existingContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : undefined;
    const finalContent = computeManagedMarkdown(existingContent, content);

    if (existingContent !== undefined) {
        if (existingContent.trim() === finalContent.trim()) {
            return;
        }
    } else {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    fs.writeFileSync(filePath, finalContent);
}

/**
 * Pure "Deep Merge" computation: merges `content` into a parsed
 * `existingContent` (or returns `content` unchanged when there is none),
 * without touching the filesystem. Shared by `generateJsonFile` and any
 * Adapter `write()` that needs identical merge semantics.
 */
export function computeMergedJson(existingContent: any | undefined, content: any): any {
    if (!isJsonObject(content)) {
      throw new Error('JSON content must be an object');
    }
    assertNoUnsafeMergeKeys(content);
    if (existingContent === undefined) return content;
    if (!isJsonObject(existingContent)) {
      throw new Error('Existing JSON content must be an object');
    }
    assertNoUnsafeMergeKeys(existingContent);
    return deepMerge(JSON.parse(JSON.stringify(existingContent)), content);
}

/**
 * Generates a JSON file with "Deep Merge" strategy.
 */
export function generateJsonFile(filePath: string, content: any) {
    let finalContent = content;

    if (fs.existsSync(filePath)) {
        const existingRaw = fs.readFileSync(filePath, 'utf8');
        let existingContent: unknown;
        try {
            existingContent = JSON.parse(existingRaw);
        } catch {
            throw new Error('Existing JSON file is invalid and cannot be merged');
        }
        finalContent = computeMergedJson(existingContent, content);

        if (existingRaw.trim() === JSON.stringify(finalContent, null, 2).trim()) {
            return;
        }
    } else {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(finalContent, null, 2));
}
