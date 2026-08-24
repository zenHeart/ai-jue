import fs from "fs";
import path from "path";
import * as yaml from "js-yaml";
import { hashArtifactContent, resolveSupportFilePath, splitFrontmatter } from "ai-jue-core";
import type { ArtifactChange, CapabilityMapping } from "ai-jue-core";

const SAFE_SEGMENT = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const MAIN_FILE = "SKILL.md";
/** Skill-relative support files stay beside SKILL.md so portable Presets keep their complete contract. */
const BUNDLE_KEYS = ["references", "scripts", "assets"] as const;

function assertSafeSegment(kind: string, value: string): void {
  if (!SAFE_SEGMENT.test(value)) {
    throw new Error(`Hermes skill ${kind} must be a safe single path segment: ${value}`);
  }
}

function relativePortablePath(root: string, absolutePath: string): string {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function parseFrontmatterFile(filePath: string): { content: string; attributes: Record<string, any> } {
  const raw = fs.readFileSync(filePath, "utf8");
  const { frontmatterText, body } = splitFrontmatter(raw);
  const attributes = frontmatterText ? ((yaml.load(frontmatterText) as Record<string, any>) ?? {}) : {};
  return { content: body.trim(), attributes };
}

function renderFrontmatterFile(attributes: Record<string, any>, body: string): string {
  if (Object.keys(attributes).length === 0) return body;
  const frontmatterText = yaml.dump(attributes, { lineWidth: -1, noRefs: true }).trim();
  return `---\n${frontmatterText}\n---\n\n${body.trim()}`;
}

function sortedDirEntries(dirPath: string): fs.Dirent[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
}

function buildTextChange(
  target: string,
  root: string,
  absolutePath: string,
  newContent: string,
): ArtifactChange | null {
  const exists = fs.existsSync(absolutePath);
  const existingContent = exists ? fs.readFileSync(absolutePath, "utf8") : undefined;
  if (existingContent === newContent) return null;
  return {
    target,
    kind: exists ? "update" : "create",
    ownership: "full",
    scope: "project",
    path: relativePortablePath(root, absolutePath),
    beforeHash: exists ? hashArtifactContent(existingContent as string) : null,
    afterHash: hashArtifactContent(newContent),
    content: newContent,
    risk: "low",
    requiresApproval: false,
    atomicState: "planned",
  };
}

/**
 * `skills/<category>/<name>/SKILL.md` (+ optional support directories), verified
 * against a live Hermes installation's `~/.hermes/skills/` tree — e.g.
 * `skills/software-development/plan/SKILL.md`,
 * `skills/software-development/hermes-windows-maintenance/references/*.md`.
 *
 * Hermes nests one category directory deeper than Claude Code's flat
 * `skills/<name>/SKILL.md`, which `ai-jue-core`'s shared `directoryPerItem`
 * factory does not support (single-level item directories only). Per
 * `adapter-creator/references/IMPLEMENTATION-patterns.md` #6, a shape that
 * doesn't fit a shared factory is hand-written rather than forcing the
 * abstraction or changing the shared engine. The Canonical skill key encodes
 * the category as `"<category>/<name>"` (a plain string key — Canonical's
 * `skills` field is `record(string, SkillSchema)`, no slash restriction) so
 * read/write stay exact inverses without any Canonical schema change.
 */
export function skills(): CapabilityMapping<Record<string, any>> {
  return {
    read(root) {
      const skillsDir = path.join(root, "skills");
      const result: Record<string, any> = {};
      for (const categoryEntry of sortedDirEntries(skillsDir)) {
        if (!categoryEntry.isDirectory() || categoryEntry.name.startsWith(".")) continue;
        const categoryDir = path.join(skillsDir, categoryEntry.name);
        for (const itemEntry of sortedDirEntries(categoryDir)) {
          if (!itemEntry.isDirectory()) continue;
          const itemDir = path.join(categoryDir, itemEntry.name);
          const mainFilePath = path.join(itemDir, MAIN_FILE);
          if (!fs.existsSync(mainFilePath)) continue;
          const { content, attributes } = parseFrontmatterFile(mainFilePath);
          const entry: Record<string, any> = { ...attributes, content, prompt: content };
          for (const bundleKey of BUNDLE_KEYS) {
            const bundleDir = path.join(itemDir, bundleKey);
            const files: Record<string, string> = {};
            for (const fileEntry of sortedDirEntries(bundleDir)) {
              if (!fileEntry.isFile()) continue;
              files[fileEntry.name] = fs.readFileSync(path.join(bundleDir, fileEntry.name), "utf8");
            }
            if (Object.keys(files).length > 0) entry[bundleKey] = files;
          }
          result[`${categoryEntry.name}/${itemEntry.name}`] = entry;
        }
      }
      return Object.keys(result).length > 0 ? result : undefined;
    },
    write(root, value, target) {
      const skillsDir = path.join(root, "skills");
      const changes: ArtifactChange[] = [];
      for (const [key, rawEntry] of Object.entries(value)) {
        const slash = key.indexOf("/");
        // Canonical's `skills` schema is `record(string, SkillSchema)` with no
        // format constraint on the key. A flat key (no `/`) is normal, portable
        // input coming from a shared Preset that other Adapters (Claude/Codex/
        // OpenClaw all use 1-level `skills/<name>/SKILL.md`) also consume —
        // throwing here would make any such Preset fail `jue apply --adapter
        // hermes` outright. Fall back to a default "general" category instead
        // of rejecting valid Canonical input; a properly-categorized
        // `"<category>/<name>"` key (Hermes's own native shape) still round-trips
        // exactly as before.
        const hasCategory = slash > 0 && slash < key.length - 1;
        const category = hasCategory ? key.slice(0, slash) : "general";
        const name = hasCategory ? key.slice(slash + 1) : key;
        assertSafeSegment("category", category);
        assertSafeSegment("name", name);
        const itemDir = path.join(skillsDir, category, name);

        const { content, prompt, ...rest } = rawEntry as Record<string, any>;
        const bundles: Record<string, Record<string, string> | undefined> = {};
        for (const bundleKey of BUNDLE_KEYS) {
          bundles[bundleKey] = rest[bundleKey];
          delete rest[bundleKey];
        }

        const body = String(content ?? prompt ?? "").trim();
        const rendered = renderFrontmatterFile(rest, body);
        const change = buildTextChange(target, root, path.join(itemDir, MAIN_FILE), rendered);
        if (change) changes.push(change);

        for (const [bundleKey, files] of Object.entries(bundles)) {
          for (const [fileName, fileContent] of Object.entries(files ?? {})) {
            // Reference files may be nested (e.g. "nested/guide.md", as
            // produced by Claude/Codex/OpenClaw-shaped Presets); reject
            // path traversal but otherwise allow subdirectories, matching
            // the shared `resolveSupportFilePath` used by the other
            // Adapters' `directoryPerItem` factory rather than the
            // single-segment restriction this file uses for skill
            // category/name.
            const bundleChange = buildTextChange(
              target,
              root,
              resolveSupportFilePath(path.join(itemDir, bundleKey), fileName),
              String(fileContent),
            );
            if (bundleChange) changes.push(bundleChange);
          }
        }
      }
      return changes;
    },
  };
}
