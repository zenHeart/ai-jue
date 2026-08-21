import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { applyChangesOrThrow } from "ai-jue-core";
import { write } from "../src/write";

describe("cursor plugin manifest", () => {
  it("writes .cursor-plugin/plugin.json with variables passthrough", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-cursor-manifest-"));
    const changes = await write(
      { skills: { demo: { name: "demo", description: "Demo", prompt: "Demo body" } } },
      {
        scope: "project",
        artifactRoot: root,
        artifactKind: "plugin",
        pluginManifest: {
          name: "my-plugin",
          version: "1.0.0",
          description: "Test plugin",
          author: { name: "ai-jue" },
          variables: {
            type: "object",
            properties: { API_TOKEN: { type: "string", title: "Token" } },
            required: ["API_TOKEN"],
          },
        },
      },
    );
    applyChangesOrThrow(root, changes);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(root, ".cursor-plugin", "plugin.json"), "utf8"),
    );
    expect(manifest.name).toBe("my-plugin");
    expect(manifest.variables.properties.API_TOKEN).toBeDefined();
    expect(fs.existsSync(path.join(root, "skills", "demo", "SKILL.md"))).toBe(true);
  });
});
