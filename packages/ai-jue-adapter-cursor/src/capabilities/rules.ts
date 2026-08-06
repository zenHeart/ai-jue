import fs from "fs";
import path from "path";
import * as yaml from "js-yaml";
import type { ArtifactChange, CapabilityMapping } from "ai-jue-core";
import { hashArtifactContent, splitFrontmatter } from "ai-jue-core";
import { componentRoot, type CursorArtifactKind } from "./layout";

function parseMdc(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { frontmatterText, body } = splitFrontmatter(raw);
  const attributes = frontmatterText
    ? ((yaml.load(frontmatterText) as Record<string, unknown>) ?? {})
    : {};
  return { content: body.trim(), attributes };
}

function renderMdc(attributes: Record<string, unknown>, body: string): string {
  const frontmatterText = yaml.dump(attributes, { lineWidth: -1, noRefs: true }).trim();
  return `---\n${frontmatterText}\n---\n\n${body.trim()}\n`;
}

/** `<root>/rules/<name>.mdc` Cursor rules. */
export function rules(artifactKind: CursorArtifactKind): CapabilityMapping<Record<string, unknown>> {
  return {
    read(root) {
      const dirPath = path.join(componentRoot(root, artifactKind), "rules");
      if (!fs.existsSync(dirPath)) return undefined;
      const result: Record<string, unknown> = {};
      for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith(".mdc")) continue;
        const name = entry.name.slice(0, -4);
        const { content, attributes } = parseMdc(path.join(dirPath, entry.name));
        result[name] = { ...attributes, content, prompt: content };
      }
      return Object.keys(result).length > 0 ? result : undefined;
    },
    write(root, value, target): ArtifactChange[] {
      const dirPath = path.join(componentRoot(root, artifactKind), "rules");
      const changes: ArtifactChange[] = [];
      for (const [name, rawEntry] of Object.entries(value ?? {})) {
        const entry = rawEntry as Record<string, unknown>;
        const body = String(entry.content ?? entry.prompt ?? "").trim();
        // 与 read 对称:透传 canonical 中除正文外的全部 frontmatter 字段
        // (description/alwaysApply/globs 及未知字段如 paths),不丢弃。
        const attributes: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(entry)) {
          if (key === "content" || key === "prompt") continue;
          attributes[key] = value;
        }
        if (typeof attributes.description !== "string" || !attributes.description.trim()) {
          attributes.description = `ai-jue generated rule: ${name}`;
        }
        if (typeof attributes.alwaysApply !== "boolean") attributes.alwaysApply = true;
        const rendered = renderMdc(attributes, body);
        const filePath = path.join(dirPath, `${name}.mdc`);
        const exists = fs.existsSync(filePath);
        const existing = exists ? fs.readFileSync(filePath, "utf8") : undefined;
        if (existing === rendered) continue;
        changes.push({
          target,
          kind: exists ? "update" : "create",
          ownership: "full",
          scope: "project",
          path: path.relative(root, filePath).split(path.sep).join("/"),
          beforeHash: exists ? hashArtifactContent(existing!) : null,
          afterHash: hashArtifactContent(rendered),
          content: rendered,
          risk: "low",
          requiresApproval: false,
          atomicState: "planned",
        });
      }
      return changes;
    },
  };
}
