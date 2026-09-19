import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { read } from "../src/read";
import { write } from "../src/write";

const FIXTURES_ROOT = path.join(__dirname, "..", "fixtures", "failures");
const fixture = (name: string) => path.join(FIXTURES_ROOT, name);

describe("Cursor adapter failure fixtures", () => {
  it("rejects a synthetic literal MCP environment value during write", async () => {
    const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jue-cursor-literal-env-"));
    await expect(
      write(
        {
          mcp: {
            servers: {
              neutral: {
                command: "node",
                env: {
                  API_TOKEN: "literal-example-not-a-real-secret-do-not-use-real-values-here",
                },
              },
            },
          },
        },
        { projectRoot: outputRoot },
      ),
    ).rejects.toThrow("must reference a runtime environment variable");
  });

  it("rejects a structurally invalid MCP command during read", async () => {
    await expect(read({ projectRoot: fixture("invalid-mcp-command") })).rejects.toThrow(
      /expected string/i,
    );
  });

  it("rejects a skill support-file path that escapes its asset directory during write", async () => {
    const canonical = await read({ projectRoot: fixture("path-escape-skill-reference") });
    const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jue-cursor-path-escape-"));

    await expect(
      write(canonical, { projectRoot: outputRoot, artifactKind: "plugin" }),
    ).rejects.toThrow("Support file path must stay inside its asset directory");
  });

  it("keeps hook commands opaque when their shell text contains parent-directory segments", async () => {
    const canonical = await read({ projectRoot: fixture("path-escape-hook") });
    expect(canonical.hooks?.PostToolUse).toEqual({
      type: "command",
      script: "sh ../../outside-plugin-boundary/neutral-hook.sh",
    });
  });
});
