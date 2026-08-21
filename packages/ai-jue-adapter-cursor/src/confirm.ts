import fs from "fs";
import path from "path";
import type { ArtifactResult, Confirmation, ConfirmContext as CoreConfirmContext } from "ai-jue-core";
import { splitFrontmatter } from "ai-jue-core";

export interface ConfirmContext extends CoreConfirmContext {
  artifactKind?: "project" | "plugin";
}

const TARGET = "cursor";
const KEBAB_NAME = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;

function collectStructuralEvidence(root: string): string[] {
  const evidence: string[] = [];
  const manifestPath = path.join(root, ".cursor-plugin", "plugin.json");
  if (!fs.existsSync(manifestPath)) {
    return ["missing .cursor-plugin/plugin.json"];
  }

  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
  } catch {
    return ["invalid .cursor-plugin/plugin.json JSON"];
  }

  const name = typeof manifest.name === "string" ? manifest.name.trim() : "";
  if (!name) evidence.push("manifest.name missing");
  else if (!KEBAB_NAME.test(name)) evidence.push(`manifest.name not kebab-case: ${name}`);
  else evidence.push(`manifest.name=${name}`);

  if (manifest.variables !== undefined) evidence.push("manifest.variables present");

  const componentDirs = ["rules", "skills", "agents", "commands", "hooks"];
  let hasComponent = false;
  for (const dir of componentDirs) {
    const dirPath = path.join(root, dir);
    if (fs.existsSync(dirPath)) {
      hasComponent = true;
      evidence.push(`has ${dir}/`);
    }
  }
  if (fs.existsSync(path.join(root, "mcp.json"))) {
    hasComponent = true;
    evidence.push("has mcp.json");
  }
  if (!hasComponent) evidence.push("no component directories or mcp.json");

  const skillsDir = path.join(root, "skills");
  if (fs.existsSync(skillsDir)) {
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillPath = path.join(skillsDir, entry.name, "SKILL.md");
      if (!fs.existsSync(skillPath)) continue;
      const raw = fs.readFileSync(skillPath, "utf8");
      const { frontmatterText } = splitFrontmatter(raw);
      if (frontmatterText?.includes("name:") && frontmatterText.includes("description:")) {
        evidence.push(`skill ${entry.name} frontmatter ok`);
        break;
      }
    }
  }

  return evidence;
}

/** Cursor has no documented headless validator; plugin gets structural evidence only. */
export async function confirm(
  _results: ArtifactResult[],
  context: ConfirmContext,
): Promise<Confirmation> {
  if ((context.artifactKind ?? "project") === "plugin") {
    const evidence = collectStructuralEvidence(context.artifactRoot).join("; ");
    return { target: TARGET, status: "unconfirmed", evidence };
  }
  return { target: TARGET, status: "unconfirmed" };
}
