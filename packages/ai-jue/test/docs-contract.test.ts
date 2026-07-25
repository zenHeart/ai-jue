import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

function readRepoFile(...segments: string[]): string {
  return fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

describe("documentation contract", () => {
  it("keeps public specifications mapped one-to-one across locales", () => {
    const publicSpecs = [
      "jue-mvp.md",
      "canonical-model.md",
      "capability-source.md",
      "codex-claude-code-adapters.md",
    ];

    const sectionIds = (content: string): string[] =>
      content
        .split("\n")
        .map((line) => line.match(/^#{2,3}\s+(\d+(?:\.\d+)*)\.?\s/)?.[1])
        .filter((value): value is string => Boolean(value));

    for (const spec of publicSpecs) {
      const chinese = readRepoFile("packages", "docs", "specs", spec);
      const english = readRepoFile("packages", "docs", "en", "specs", spec);

      expect(chinese).toMatch(/[\u3400-\u9fff]/);
      expect(english).not.toMatch(/[\u3400-\u9fff]/);
      expect(chinese).not.toContain("尚未完成中文翻译");
      expect(english).not.toContain("Chinese-only");
      expect(sectionIds(chinese)).toEqual(sectionIds(english));
    }
  });

  it("keeps Markdown code fences renderable", () => {
    const docsRoot = path.join(process.cwd(), "packages", "docs");
    const markdownFiles: string[] = [];
    const collectMarkdown = (directory: string): void => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.name === "dist" && directory.endsWith(".vitepress")) continue;
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) collectMarkdown(target);
        else if (target.endsWith(".md")) markdownFiles.push(target);
      }
    };

    collectMarkdown(docsRoot);

    for (const file of markdownFiles) {
      const content = fs.readFileSync(file, "utf8");
      const fences = content
        .split("\n")
        .filter((line) => /^\s*```/.test(line));
      expect(content, file).not.toContain("\\`\\`\\`");
      expect(fences.length, file).toBe(2 * Math.floor(fences.length / 2));
    }
  });

  it("keeps the canonical capability set synchronized in docs", () => {
    const canonicalModel = readRepoFile(
      "packages",
      "docs",
      "en",
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
