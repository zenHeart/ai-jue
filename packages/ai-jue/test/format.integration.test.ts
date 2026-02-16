import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { handler as formatHandler } from "../src/commands/format";
import { initI18n } from "../src/i18n";

describe("format command integration", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-jue-format-test-"));
    vi.spyOn(process, "cwd").mockReturnValue(testDir);
    await initI18n("en");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should migrate Cursor and Gemini configs to .ai directory", async () => {
    // 1. Setup fixtures
    const cursorDir = path.join(testDir, ".cursor");
    fs.mkdirSync(cursorDir);
    fs.writeFileSync(path.join(cursorDir, "hooks.json"), '{"hooks": []}');
    
    const geminiDir = path.join(testDir, ".gemini");
    fs.mkdirSync(geminiDir);
    const geminiCmdDir = path.join(geminiDir, "commands");
    fs.mkdirSync(geminiCmdDir);
    fs.writeFileSync(path.join(geminiCmdDir, "test.toml"), 'prompt = "test"');

    fs.writeFileSync(path.join(testDir, "AGENTS.md"), "# Global Agents");

    // 2. Run format with --write
    await formatHandler({ write: true } as any);

    // 3. Verify results
    expect(fs.existsSync(path.join(testDir, ".ai", "AGENTS.md"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, ".ai", "hooks.json"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, ".ai", "commands", "test", "prompt.md"))).toBe(true);

    const migratedAgents = fs.readFileSync(path.join(testDir, ".ai", "AGENTS.md"), "utf8");
    expect(migratedAgents).toContain("Migrated from AGENTS.md");
    expect(migratedAgents).toContain("# Global Agents");
  });

  it("should handle Trae and OpenCode configs", async () => {
    // 1. Setup fixtures
    const traeDir = path.join(testDir, ".trae");
    fs.mkdirSync(traeDir);
    fs.writeFileSync(path.join(traeDir, "config.json"), '{"mcp": []}');

    const opencodeDir = path.join(testDir, ".opencode");
    fs.mkdirSync(opencodeDir);
    fs.writeFileSync(path.join(opencodeDir, "config.json"), '{"key": "val"}');
    const pluginDir = path.join(opencodeDir, "plugin");
    fs.mkdirSync(pluginDir);
    fs.writeFileSync(path.join(pluginDir, "my-hook.ts"), "export {}");

    // 2. Run format with --write
    await formatHandler({ write: true } as any);

    // 3. Verify results
    expect(fs.existsSync(path.join(testDir, ".ai", "tools", "trae", "settings.json"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, ".ai", "tools", "opencode", "settings.json"))).toBe(true);
    expect(fs.existsSync(path.join(testDir, ".ai", "hooks", "my-hook.ts"))).toBe(true);
  });
});
