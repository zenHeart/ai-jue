import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { applyChangesOrThrow, type CanonicalDocument } from "ai-jue-core";
import {
  readMarketplaceIndex,
  type CursorMarketplaceManifest,
} from "../src/capabilities/marketplace";
import { generate } from "../src";
import { read } from "../src/read";
import { write } from "../src/write";

const FIXTURE_ROOT = path.join(__dirname, "..", "fixtures", "marketplace");
const MARKETPLACE = JSON.parse(
  fs.readFileSync(path.join(FIXTURE_ROOT, ".cursor-plugin", "marketplace.json"), "utf8"),
) as CursorMarketplaceManifest;
const EMPTY_CANONICAL: CanonicalDocument = {};

function copyPluginRoots(root: string): void {
  fs.cpSync(path.join(FIXTURE_ROOT, "plugins"), path.join(root, "plugins"), {
    recursive: true,
  });
}

describe("cursor marketplace index", () => {
  const roots: string[] = [];

  function tempRoot(): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "jue-cursor-marketplace-"));
    roots.push(root);
    return root;
  }

  afterEach(() => {
    for (const root of roots.splice(0)) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("writes the official multi-plugin shape without leaking control fields into settings", async () => {
    const root = tempRoot();
    copyPluginRoots(root);

    await generate(
      {
        tools: {
          cursor: {
            marketplace: MARKETPLACE,
            pluginManifest: { name: "control-field-only" },
            temperature: 0.25,
          },
        },
      },
      root,
    );

    expect(readMarketplaceIndex(root)).toEqual(MARKETPLACE);
    const settings = JSON.parse(
      fs.readFileSync(path.join(root, ".cursor", "settings.json"), "utf8"),
    );
    expect(settings).toEqual({ temperature: 0.25 });
  });

  it("is idempotent after the marketplace index is applied", async () => {
    const root = tempRoot();
    copyPluginRoots(root);
    const context = {
      projectRoot: root,
      artifactKind: "project" as const,
      toolsConfig: { marketplace: MARKETPLACE },
    };
    const initialChanges = await write(EMPTY_CANONICAL, context);
    expect(initialChanges.map((change) => change.path)).toContain(
      ".cursor-plugin/marketplace.json",
    );
    applyChangesOrThrow(root, initialChanges);
    await expect(write(EMPTY_CANONICAL, context)).resolves.toEqual([]);
  });

  it("validates the index without merging child Plugin capabilities", async () => {
    expect(readMarketplaceIndex(FIXTURE_ROOT)).toEqual(MARKETPLACE);
    const canonical = await read({ projectRoot: FIXTURE_ROOT });
    expect(canonical.skills).toBeUndefined();
    expect(canonical.commands).toBeUndefined();
  });

  it.each([
    "../escape",
    "plugins/../plugins/demo-search",
    "/absolute/plugin",
    "C:\\absolute\\plugin",
    "C:drive-relative",
    "\\\\server\\share\\plugin",
    "nested\\plugin",
    "CON",
    "con.txt",
    "plugins/NUL",
    "plugins/trailing.",
    "plugins/trailing ",
    "plugins/bad<name",
    "plugins/bad>name",
    'plugins/bad"name',
    "plugins/bad|name",
    "plugins/bad?name",
    "plugins/bad*name",
  ])("rejects a non-portable source before returning changes", async (source) => {
    const root = tempRoot();
    copyPluginRoots(root);
    const unsafe = {
      ...MARKETPLACE,
      metadata: { ...MARKETPLACE.metadata, pluginRoot: undefined },
      plugins: [{ ...MARKETPLACE.plugins[0], source }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: unsafe },
      }),
    ).rejects.toThrow("portable relative path");
    expect(fs.existsSync(path.join(root, ".cursor-plugin", "marketplace.json"))).toBe(false);
  });

  it("rejects duplicate plugin names", async () => {
    const root = tempRoot();
    copyPluginRoots(root);
    const duplicate = {
      ...MARKETPLACE,
      plugins: [MARKETPLACE.plugins[0], { ...MARKETPLACE.plugins[0] }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: duplicate },
      }),
    ).rejects.toThrow("unique plugin names");
  });

  it("rejects more than the official 500-plugin maximum before source access", async () => {
    const root = tempRoot();
    const tooMany = {
      ...MARKETPLACE,
      metadata: undefined,
      plugins: Array.from({ length: 501 }, (_, index) => ({
        name: `plugin-${index}`,
        source: `plugin-${index}`,
      })),
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: tooMany },
      }),
    ).rejects.toThrow("at most 500 entries");
  });

  it.each([
    ["description", 1],
    ["version", 1],
    ["author", "invalid"],
    ["homepage", 1],
    ["repository", 1],
    ["license", 1],
    ["keywords", ["valid", 1]],
    ["logo", 1],
    ["category", 1],
    ["tags", "invalid"],
    ["skills", 1],
    ["rules", ["rules", 1]],
    ["agents", 1],
    ["commands", 1],
    ["hooks", []],
    ["mcpServers", []],
    ["variables", []],
  ])("rejects an invalid official plugin field type for %s", async (field, value) => {
    const root = tempRoot();
    copyPluginRoots(root);
    const invalid = {
      ...MARKETPLACE,
      plugins: [{ ...MARKETPLACE.plugins[0], [field]: value }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: invalid },
      }),
    ).rejects.toThrow(`plugin ${field}`);
  });

  it("rejects a non-portable metadata.pluginRoot", async () => {
    const root = tempRoot();
    const unsafe = {
      ...MARKETPLACE,
      metadata: { ...MARKETPLACE.metadata, pluginRoot: "../private-root" },
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: unsafe },
      }),
    ).rejects.toThrow("metadata.pluginRoot must be a portable relative path");
  });

  it.each([
    "../outside.svg",
    "/absolute.svg",
    "C:\\absolute.svg",
    "icons/bad?name.svg",
    "file:///outside.svg",
  ])("rejects a non-portable plugin logo path", async (logo) => {
    const root = tempRoot();
    copyPluginRoots(root);
    const invalid = {
      ...MARKETPLACE,
      plugins: [{ ...MARKETPLACE.plugins[0], logo }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: invalid },
      }),
    ).rejects.toThrow(/logo|portable relative path/);
  });

  it("accepts an HTTPS plugin logo URL", async () => {
    const root = tempRoot();
    copyPluginRoots(root);
    const valid = {
      ...MARKETPLACE,
      plugins: [{
        ...MARKETPLACE.plugins[0],
        logo: "https://example.invalid/assets/plugin.svg",
      }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: valid },
      }),
    ).resolves.not.toHaveLength(0);
  });

  it("rejects a semantic version with a leading-zero prerelease identifier", async () => {
    const root = tempRoot();
    copyPluginRoots(root);
    const invalid = {
      ...MARKETPLACE,
      plugins: [{ ...MARKETPLACE.plugins[0], version: "1.0.0-01" }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: invalid },
      }),
    ).rejects.toThrow("semantic version text");
  });

  it("rejects a literal credential in an inline MCP server env", async () => {
    const root = tempRoot();
    copyPluginRoots(root);
    const unsafe = {
      ...MARKETPLACE,
      plugins: [{
        ...MARKETPLACE.plugins[0],
        mcpServers: {
          demo: { command: "node", env: { API_TOKEN: "not-a-real-credential" } },
        },
      }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: unsafe },
      }),
    ).rejects.toThrow("contains a literal credential");
  });

  it("accepts a runtime placeholder in an inline MCP server env", async () => {
    const root = tempRoot();
    copyPluginRoots(root);
    const safe = {
      ...MARKETPLACE,
      plugins: [{
        ...MARKETPLACE.plugins[0],
        mcpServers: {
          demo: { command: "node", env: { API_TOKEN: "${API_TOKEN}" } },
        },
      }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: safe },
      }),
    ).resolves.not.toHaveLength(0);
  });

  it("rejects a literal authorization header in an inline MCP server", async () => {
    const root = tempRoot();
    copyPluginRoots(root);
    const unsafe = {
      ...MARKETPLACE,
      plugins: [{
        ...MARKETPLACE.plugins[0],
        mcpServers: {
          demo: {
            url: "https://example.invalid/service",
            headers: { Authorization: "Bearer not-a-real-credential" },
          },
        },
      }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: unsafe },
      }),
    ).rejects.toThrow("contains a literal credential");
  });

  it("accepts a placeholder authorization header in an inline MCP server", async () => {
    const root = tempRoot();
    copyPluginRoots(root);
    const safe = {
      ...MARKETPLACE,
      plugins: [{
        ...MARKETPLACE.plugins[0],
        mcpServers: {
          demo: {
            url: "https://example.invalid/service",
            headers: { Authorization: "Bearer ${API_TOKEN}" },
          },
        },
      }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: safe },
      }),
    ).resolves.not.toHaveLength(0);
  });

  it("rejects a literal default for a sensitive marketplace variable", async () => {
    const root = tempRoot();
    copyPluginRoots(root);
    const unsafe = {
      ...MARKETPLACE,
      plugins: [{
        ...MARKETPLACE.plugins[0],
        variables: {
          type: "object",
          properties: {
            API_TOKEN: { type: "string", default: "not-a-real-credential" },
          },
        },
      }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: unsafe },
      }),
    ).rejects.toThrow("contains a literal credential");
  });

  it.each([
    [["--api-key=not-a-real-credential"]],
    [["--token", "not-a-real-credential"]],
    [["-H", "Authorization: Bearer not-a-real-credential"]],
    [["-c", "API_TOKEN=not-a-real-credential node server.js"]],
  ])("rejects a literal credential in inline MCP arguments", async (args) => {
    const root = tempRoot();
    copyPluginRoots(root);
    const unsafe = {
      ...MARKETPLACE,
      plugins: [{
        ...MARKETPLACE.plugins[0],
        mcpServers: { demo: { command: "node", args } },
      }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: unsafe },
      }),
    ).rejects.toThrow("contains a literal credential");
  });

  it.each([
    [["--api-key=${API_KEY}"]],
    [["--token", "${API_TOKEN}"]],
    [["-H", "Authorization: Bearer ${API_TOKEN}"]],
    [["-c", "API_TOKEN=${API_TOKEN} node server.js"]],
  ])("accepts placeholder credentials in inline MCP arguments", async (args) => {
    const root = tempRoot();
    copyPluginRoots(root);
    const safe = {
      ...MARKETPLACE,
      plugins: [{
        ...MARKETPLACE.plugins[0],
        mcpServers: { demo: { command: "node", args } },
      }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: safe },
      }),
    ).resolves.not.toHaveLength(0);
  });

  it("validates the JSON snapshot emitted by an entry toJSON method", async () => {
    const root = tempRoot();
    copyPluginRoots(root);
    const entry = MARKETPLACE.plugins[0];
    const unsafe = {
      ...MARKETPLACE,
      plugins: [{
        ...entry,
        toJSON: () => ({ ...entry, source: "../outside" }),
      }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: unsafe },
      }),
    ).rejects.toThrow("portable relative path");
  });

  it("rejects a literal credential emitted by an entry toJSON method", async () => {
    const root = tempRoot();
    copyPluginRoots(root);
    const entry = MARKETPLACE.plugins[0];
    const unsafe = {
      ...MARKETPLACE,
      plugins: [{
        ...entry,
        toJSON: () => ({
          ...entry,
          mcpServers: {
            demo: { headers: { Authorization: "Bearer not-a-real-credential" } },
          },
        }),
      }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: unsafe },
      }),
    ).rejects.toThrow("contains a literal credential");
  });

  it("rejects a credential-bearing URL in nested marketplace data", async () => {
    const root = tempRoot();
    copyPluginRoots(root);
    const unsafe = {
      ...MARKETPLACE,
      plugins: [{
        ...MARKETPLACE.plugins[0],
        mcpServers: {
          demo: {
            url: "https://example.invalid/service?api_key=not-a-real-credential",
          },
        },
      }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: unsafe },
      }),
    ).rejects.toThrow("contains a literal credential");
  });

  it("rejects a missing local source with a redacted error", async () => {
    const root = tempRoot();
    const missing = {
      ...MARKETPLACE,
      plugins: [{ name: "private-name", source: "private-directory" }],
    };
    let message = "";
    try {
      await write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: missing },
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain("source directory");
    expect(message).not.toContain("private-name");
    expect(message).not.toContain("private-directory");
    expect(message).not.toContain(root);
  });

  it("rejects a child manifest whose name does not match its index entry", async () => {
    const root = tempRoot();
    copyPluginRoots(root);
    const manifestPath = path.join(
      root,
      "plugins",
      "demo-search",
      ".cursor-plugin",
      "plugin.json",
    );
    fs.writeFileSync(manifestPath, JSON.stringify({ name: "different-name" }));
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: MARKETPLACE },
      }),
    ).rejects.toThrow("manifest name must match");
  });

  it("rejects an invalid index during partial read without exposing its path", () => {
    const root = tempRoot();
    const markerDir = path.join(root, ".cursor-plugin");
    fs.mkdirSync(markerDir, { recursive: true });
    fs.writeFileSync(path.join(markerDir, "marketplace.json"), "{ invalid");
    let message = "";
    try {
      readMarketplaceIndex(root);
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toBe("Cursor marketplace manifest contains invalid JSON");
    expect(message).not.toContain(root);
  });

  it.skipIf(process.platform === "win32")("rejects a symlinked source directory", async () => {
    const root = tempRoot();
    const outside = tempRoot();
    fs.mkdirSync(path.join(outside, ".cursor-plugin"), { recursive: true });
    fs.writeFileSync(
      path.join(outside, ".cursor-plugin", "plugin.json"),
      JSON.stringify({ name: "demo-link" }),
    );
    fs.mkdirSync(path.join(root, "plugins"), { recursive: true });
    fs.symlinkSync(outside, path.join(root, "plugins", "demo-link"), "dir");
    const linked = {
      ...MARKETPLACE,
      plugins: [{ name: "demo-link", source: "demo-link" }],
    };
    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: linked },
      }),
    ).rejects.toThrow("regular directory");
  });

  it.skipIf(process.platform === "win32")("rejects a dangling marketplace marker without writing outside the root", async () => {
    const root = tempRoot();
    const outside = tempRoot();
    copyPluginRoots(root);
    const outsideMarker = path.join(outside, "missing-marker");
    fs.symlinkSync(outsideMarker, path.join(root, ".cursor-plugin"), "dir");

    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: MARKETPLACE },
      }),
    ).rejects.toThrow("marker must be a regular directory");
    expect(fs.existsSync(path.join(outsideMarker, "marketplace.json"))).toBe(false);
  });

  it.skipIf(process.platform === "win32")("rejects a dangling marketplace manifest without writing outside the root", async () => {
    const root = tempRoot();
    const outside = tempRoot();
    copyPluginRoots(root);
    fs.mkdirSync(path.join(root, ".cursor-plugin"));
    const outsideManifest = path.join(outside, "missing-marketplace.json");
    fs.symlinkSync(outsideManifest, path.join(root, ".cursor-plugin", "marketplace.json"));

    await expect(
      write(EMPTY_CANONICAL, {
        projectRoot: root,
        toolsConfig: { marketplace: MARKETPLACE },
      }),
    ).rejects.toThrow("manifest must be a regular file");
    expect(fs.existsSync(outsideManifest)).toBe(false);
  });

  it("keeps single-Plugin output unchanged when marketplace config is absent", async () => {
    const root = tempRoot();
    applyChangesOrThrow(
      root,
      await write(EMPTY_CANONICAL, {
        projectRoot: root,
        artifactKind: "plugin",
        pluginManifest: { name: "single-plugin", version: "0.1.0" },
      }),
    );
    expect(fs.existsSync(path.join(root, ".cursor-plugin", "plugin.json"))).toBe(true);
    expect(fs.existsSync(path.join(root, ".cursor-plugin", "marketplace.json"))).toBe(false);
  });
});
