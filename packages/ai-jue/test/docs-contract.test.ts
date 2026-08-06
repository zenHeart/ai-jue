import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

function readRepoFile(...segments: string[]): string {
  return fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

function expectLocalePair(directory: string, file: string): void {
  const chinese = readRepoFile("packages", "docs", directory, file);
  const english = readRepoFile("packages", "docs", "en", directory, file);
  expect(chinese).toMatch(/[\u3400-\u9fff]/);
  expect(english).not.toMatch(/[\u3400-\u9fff]/);
}

describe("documentation contract", () => {
  it("keeps public specifications and references paired across locales", () => {
    for (const file of [
      "jue-mvp.md",
      "canonical-model.md",
      "capability-source.md",
      "codex-claude-code-adapters.md",
    ]) {
      expectLocalePair("specs", file);
    }

    for (const file of [
      "index.md",
      "project-config.md",
      "preset-manifest.md",
      "extension-api.md",
      "glossary.md",
    ]) {
      expectLocalePair("reference", file);
    }

    for (const file of [
      "index.md",
      "workflow.md",
      "capability.md",
      "preset.md",
      "extension.md",
    ]) {
      expectLocalePair(path.join("reference", "cli"), file);
    }
  });

  it("keeps Agent support profiles paired and uses one maturity model", () => {
    for (const file of [
      "index.md",
      "claude-code.md",
      "codex.md",
      "cursor.md",
      "openclaw.md",
      "hermes.md",
    ]) {
      expectLocalePair("agents", file);
      const content = readRepoFile("packages", "docs", "agents", file);
      for (const level of ["Read", "Write", "Artifact", "Confirm"]) {
        expect(content).toContain(level);
      }
    }
  });

  it("freezes the closed six-concept architecture", () => {
    const architecture = readRepoFile(
      "packages",
      "docs",
      "architecture",
      "index.md",
    );
    const glossary = readRepoFile(
      "packages",
      "docs",
      "reference",
      "glossary.md",
    );
    const combined = `${architecture}\n${glossary}`;

    for (const concept of [
      "Capability",
      "Preset",
      "Canonical DSL",
      "Extension",
      "Adapter",
      "Artifact",
    ]) {
      expect(combined).toContain(concept);
    }

    for (const forbidden of [
      "Canonical Capability Graph",
      "Native Remainder",
      "Adapter Contract",
      "Transformation Plan",
      "Artifact Driver",
      "Capability Converter",
    ]) {
      expect(combined).not.toContain(forbidden);
    }
  });

  it("keeps the core CLI to init, apply, and inspect", () => {
    const cli = readRepoFile(
      "packages",
      "docs",
      "reference",
      "cli",
      "index.md",
    );
    const workflow = readRepoFile(
      "packages",
      "docs",
      "reference",
      "cli",
      "workflow.md",
    );
    const status = readRepoFile(
      "packages",
      "docs",
      "developer",
      "implementation-status.md",
    );

    for (const command of ["jue init", "jue apply", "jue inspect"]) {
      expect(cli).toContain(command);
      expect(status).toContain(command);
    }
    for (const option of ["--dry-run", "--check", "--diagnostics"]) {
      expect(`${cli}\n${workflow}`).toContain(option);
    }
    for (const command of ["jue plan", "jue verify", "jue doctor"]) {
      expect(`${cli}\n${workflow}`).not.toContain(command);
    }
  });

  it("reuses npm for Extensions without a Jue package manifest", () => {
    const api = readRepoFile(
      "packages",
      "docs",
      "reference",
      "extension-api.md",
    );
    const sidebar = readRepoFile(
      "packages",
      "docs",
      ".vitepress",
      "config.mts",
    );

    expect(api).toContain("peerDependencies");
    expect(api).toContain("exports");
    expect(api).toContain("defineExtension");
    expect(api).not.toContain("package.json#jue");
    expect(sidebar).not.toContain("extension-manifest");
  });

  it("keeps Developer pages paired across locales", () => {
    for (const file of [
      "index.md",
      "documentation-contract.md",
      "implementation-status.md",
      "roadmap.md",
      "delivery-plan.md",
      path.join("rfcs", "index.md"),
      path.join("rfcs", "0001-minimal-conversion-model.md"),
      path.join("rfcs", "0002-plugin-artifact-apply.md"),
    ]) {
      expectLocalePair("developer", file);
    }
  });

  it("registers RFC pages in both VitePress sidebars", () => {
    const sidebar = readRepoFile(
      "packages",
      "docs",
      ".vitepress",
      "config.mts",
    );
    for (const link of [
      "/developer/rfcs/0001-minimal-conversion-model",
      "/developer/rfcs/0002-plugin-artifact-apply",
      "/en/developer/rfcs/0001-minimal-conversion-model",
      "/en/developer/rfcs/0002-plugin-artifact-apply",
    ]) {
      expect(sidebar).toContain(link);
    }
  });

  it("keeps Markdown code fences renderable", () => {
    const docsRoot = path.join(process.cwd(), "packages", "docs");
    const markdownFiles: string[] = [];
    const collect = (directory: string): void => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.name === "dist" && directory.endsWith(".vitepress")) continue;
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) collect(target);
        else if (target.endsWith(".md")) markdownFiles.push(target);
      }
    };
    collect(docsRoot);

    for (const file of markdownFiles) {
      const content = fs.readFileSync(file, "utf8");
      const fences = content.split("\n").filter((line) => /^\s*```/.test(line));
      expect(fences.length, file).toBe(2 * Math.floor(fences.length / 2));
    }
  });
});
