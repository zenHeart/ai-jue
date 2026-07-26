import fs from 'fs';
import path from 'path';

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

/**
 * Resolves `relativePath` under `baseDir`, rejecting any path (e.g. via
 * `../` traversal) that would escape it. Shared by anything that writes a
 * caller-supplied relative path into a fixed directory — support file
 * bundles here, and skill/agent attachment bundles in
 * `capability-mapping.ts`.
 */
export function resolveSupportFilePath(baseDir: string, relativePath: string): string {
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
