import { describe, expect, it } from "vitest";
import * as claude from "../../ai-jue-adapter-claude/src/index";
import * as codex from "../../ai-jue-adapter-codex/src/index";
import * as cursor from "../../ai-jue-adapter-cursor/src/index";
import * as hermes from "../../ai-jue-adapter-hermes/src/index";
import * as openclaw from "../../ai-jue-adapter-openclaw/src/index";

describe("built-in Extension entry contract", () => {
  it.each([
    ["claude", claude],
    ["codex", codex],
    ["cursor", cursor],
    ["hermes", hermes],
    ["openclaw", openclaw],
  ])("exposes only the Extension default export for %s", (_name, entry) => {
    expect(Object.keys(entry)).toEqual(["default"]);
  });
});
