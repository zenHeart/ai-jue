import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

function readRepoFile(...segments: string[]): string {
  return fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

describe("documentation contract", () => {
  it("keeps the canonical capability set synchronized in docs", () => {
    const canonicalModel = readRepoFile(
      "packages",
      "docs",
      "specs",
      "canonical-model.md",
    );
    const architectureGuide = readRepoFile(
      "packages",
      "docs",
      "guide",
      "architecture.md",
    );
    const adapterGuide = readRepoFile(
      "packages",
      "docs",
      "guide",
      "adapter-standardization.md",
    );

    const capabilities = [
      "context.global",
      "rules",
      "commands",
      "skills",
      "agents",
      "hooks",
      "mcp.servers",
      "tools.<tool>",
    ];

    for (const capability of capabilities) {
      expect(canonicalModel).toContain(capability);
    }

    expect(architectureGuide).toContain("统一能力模型（唯一）");
    expect(architectureGuide).toContain("hooks");
    expect(architectureGuide).toContain("mcp");
    expect(adapterGuide).toContain("## 6. Claude / Cursor 转换约束");
  });

  it("documents current Claude and Cursor output surfaces", () => {
    const readmeZh = readRepoFile("README.md");
    const readmeEn = readRepoFile("README.en.md");
    const adapterGuide = readRepoFile(
      "packages",
      "docs",
      "guide",
      "adapter-standardization.md",
    );

    const requiredSnippets = [
      "CLAUDE.md / .claude/*",
      "AGENTS.md / .cursor/*",
      ".claude/rules/*.md",
      ".claude/skills/*/SKILL.md",
      ".claude/agents/*.md",
      ".claude/settings.json",
      ".cursor/rules/*.mdc",
      ".cursor/commands/*.md",
      ".cursor/skills/*/SKILL.md",
      ".cursor/hooks.json",
      ".cursor/agents/*.md",
      ".cursor/mcp.json",
    ];

    for (const snippet of requiredSnippets) {
      expect(`${readmeZh}\n${readmeEn}\n${adapterGuide}`).toContain(snippet);
    }
  });
});
