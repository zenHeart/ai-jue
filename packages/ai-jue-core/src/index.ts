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

const AI_JUE_START_TAG = '<!-- AI-JUE:START -->';
const AI_JUE_END_TAG = '<!-- AI-JUE:END -->';
const ESCAPED_START = AI_JUE_START_TAG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ESCAPED_END = AI_JUE_END_TAG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MANAGED_BLOCK_RE = new RegExp(`${ESCAPED_START}[\\s\\S]*?${ESCAPED_END}\\n?`, 'g');
const ORPHAN_TAG_RE = new RegExp(`^\\s*(?:${ESCAPED_START}|${ESCAPED_END})\\s*$`, 'gm');

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
 * Generates a Markdown file with "Smart Coexistence" strategy.
 */
export function generateMarkdownFile(filePath: string, content: string) {
    const cleanContent = stripManagedBlock(content);

    const managedContent = `${AI_JUE_START_TAG}\n${cleanContent}\n${AI_JUE_END_TAG}`;

    let finalContent = managedContent;

    if (fs.existsSync(filePath)) {
        const existingContent = fs.readFileSync(filePath, 'utf8');
        const userContent = stripManagedBlock(existingContent);
        finalContent = userContent ? `${userContent}\n\n${managedContent}` : managedContent;

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
 * Generates a JSON file with "Deep Merge" strategy.
 */
export function generateJsonFile(filePath: string, content: any) {
    let finalContent = content;

    if (fs.existsSync(filePath)) {
        try {
            const existingRaw = fs.readFileSync(filePath, 'utf8');
            const existingContent = JSON.parse(existingRaw);
            finalContent = deepMerge(existingContent, content);
            
            if (existingRaw.trim() === JSON.stringify(finalContent, null, 2).trim()) {
                return;
            }
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

export function ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

export function writeTextFile(filePath: string, content: string) {
    ensureDir(path.dirname(filePath));
    if (fs.existsSync(filePath)) {
        const existingContent = fs.readFileSync(filePath, 'utf8');
        if (existingContent === content) {
            return;
        }
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

export type SupportFile =
    | string
    | {
        content: string;
        encoding: 'utf8' | 'base64';
    };

export type CapabilityConverter = 'agent-skill' | 'mcp' | 'jue-native';

export type CapabilitySource =
    | `file:${string}`
    | `npm:${string}`
    | `github:${string}`;

export interface CapabilityRef {
    source: CapabilitySource;
    converter: CapabilityConverter;
    ref?: string;
    path?: string;
    config?: Record<string, unknown>;
    status?: string;
}

const CAPABILITY_CONVERTERS = new Set<CapabilityConverter>([
    'agent-skill',
    'mcp',
    'jue-native',
]);

/**
 * Validates the public Capability Source contract without coupling core to a
 * resolver implementation. Resolution remains an input concern owned by the
 * CLI package.
 */
export function assertCapabilityRef(name: string, value: unknown): asserts value is CapabilityRef {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) {
        throw new Error(`Capability name must be a safe single path segment: ${name}`);
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`Capability "${name}" must be an object`);
    }
    const ref = value as Record<string, unknown>;
    if (
        typeof ref.source !== 'string' ||
        !/^(?:file|npm|github):[^/].*/.test(ref.source)
    ) {
        throw new Error(`Capability "${name}" has an invalid source`);
    }
    if (
        typeof ref.converter !== 'string' ||
        !CAPABILITY_CONVERTERS.has(ref.converter as CapabilityConverter)
    ) {
        throw new Error(`Capability "${name}" has an unknown converter`);
    }
    if (ref.status !== undefined) {
        throw new Error(
            `Capability "${name}" is not loadable while status is present: ${String(ref.status)}`,
        );
    }
    if (ref.ref !== undefined && typeof ref.ref !== 'string') {
        throw new Error(`Capability "${name}" ref must be a string`);
    }
    if (ref.path !== undefined && typeof ref.path !== 'string') {
        throw new Error(`Capability "${name}" path must be a string`);
    }
    if (
        ref.config !== undefined &&
        (!ref.config || typeof ref.config !== 'object' || Array.isArray(ref.config))
    ) {
        throw new Error(`Capability "${name}" config must be an object`);
    }
}

function resolveSupportFilePath(baseDir: string, relativePath: string): string {
    const resolvedBase = path.resolve(baseDir);
    const resolvedFile = path.resolve(resolvedBase, relativePath);
    if (
        resolvedFile === resolvedBase ||
        !resolvedFile.startsWith(`${resolvedBase}${path.sep}`)
    ) {
        throw new Error(`Support file path must stay inside its asset directory: ${relativePath}`);
    }
    return resolvedFile;
}

/**
 * Writes text or binary files attached to a capability while preserving nested
 * relative paths. The explicit base64 form keeps the canonical model JSON-safe.
 */
export function writeSupportFiles(baseDir: string, files?: Record<string, SupportFile>) {
    if (!files) return;
    ensureDir(baseDir);
    for (const [relativePath, file] of Object.entries(files)) {
        const filePath = resolveSupportFilePath(baseDir, relativePath);
        if (typeof file === 'string') {
            writeTextFile(filePath, file);
            continue;
        }

        if (!file || (file.encoding !== 'utf8' && file.encoding !== 'base64')) {
            throw new Error(`Unsupported support file encoding: ${relativePath}`);
        }

        ensureDir(path.dirname(filePath));
        const content = Buffer.from(file.content, file.encoding);
        if (fs.existsSync(filePath) && fs.readFileSync(filePath).equals(content)) {
            continue;
        }
        fs.writeFileSync(filePath, content);
    }
}

export function getAssetText(
    asset: any,
    preferredFields: string[] = ['content', 'prompt'],
): string {
    if (typeof asset === 'string') {
        return asset;
    }

    if (!asset || typeof asset !== 'object') {
        return '';
    }

    for (const field of preferredFields) {
        if (typeof asset[field] === 'string') {
            return asset[field];
        }
    }

    return '';
}

export function getRecordEntries<T = any>(value: Record<string, T> | null | undefined): Array<[string, T]> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return [];
    }
    return Object.entries(value);
}

export function renderMarkdownWithFrontmatter(frontmatter: string, body: string): string {
    return `---\n${frontmatter.trim()}\n---\n\n${String(body).trim()}`;
}

export function renderBulletSection(title: string, intro: string, items: string[]): string {
    if (items.length === 0) return '';

    const lines = [`## ${title}`, ''];
    if (intro) {
        lines.push(intro, '');
    }
    lines.push(
        ...items.map((item) => {
            const trimmed = item.trim();
            return trimmed.startsWith('- ') ? trimmed : `- ${trimmed}`;
        }),
        '',
    );
    return `${lines.join('\n')}\n`;
}
