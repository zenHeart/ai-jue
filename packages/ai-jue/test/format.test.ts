import { describe, it, expect, vi, beforeEach } from "vitest";
import { handler as formatHandler } from "../src/commands/format";
import fs from "fs";
import * as glob from "glob";

const { spinnerMock, loggerMock } = vi.hoisted(() => ({
  spinnerMock: {
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  },
  loggerMock: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("fs");
vi.mock("glob", () => ({
  sync: vi.fn(() => []),
}));
vi.mock("../src/logger", () => ({
  logger: loggerMock,
}));
vi.mock("../src/i18n", () => ({
  t: (key: string, options?: any) => {
    let result = key;
    if (options) {
      result += ":" + Object.entries(options).map(([k, v]) => `${k}=${v}`).join(",");
    }
    return result;
  },
  initI18n: vi.fn(),
}));
vi.mock("ora", () => ({
  default: vi.fn(() => spinnerMock),
}));

describe("format command", () => {
  const MOCK_CWD = "/tmp/test-project";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(process, "cwd").mockReturnValue(MOCK_CWD);
    process.exitCode = undefined;
    (fs.readFileSync as any).mockReturnValue("");
    (fs.existsSync as any).mockReturnValue(false);
    (glob.sync as any).mockReturnValue([]);
    spinnerMock.start.mockReturnThis();
    spinnerMock.succeed.mockReturnThis();
    spinnerMock.warn.mockReturnThis();
    spinnerMock.fail.mockReturnThis();
  });

  it("should detect and report no configurations", async () => {
    await formatHandler({} as any);

    expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining("commands.format.scanning"));
    expect(spinnerMock.warn).toHaveBeenCalledWith(expect.stringContaining("commands.format.no_configs"));
  });

  it("should detect Cursor configurations and generate a plan", async () => {
    (fs.existsSync as any).mockImplementation((p: string) => {
      if (p.includes(".cursor/hooks.json")) return true;
      return false;
    });

    await formatHandler({} as any);

    expect(spinnerMock.succeed).toHaveBeenCalledWith(
      expect.stringContaining("commands.format.detected_count")
    );
    expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining("HOOKS:"));
  });

  it("should execute migration when --write is specified", async () => {
    (fs.existsSync as any).mockImplementation((p: string) => {
      // Source exists, target does not
      if (p.includes(".cursor/hooks.json")) return true;
      return false;
    });
    (fs.readFileSync as any).mockReturnValue('{"hooks": []}');

    await formatHandler({ write: true } as any);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining(".ai/hooks.json"),
      expect.any(String),
      "utf8"
    );
  });

  it("should handle conflicts without --force", async () => {
    (fs.existsSync as any).mockImplementation((p: string) => {
      if (p.includes(".cursor/hooks.json")) return true;
      if (p.includes(".ai/hooks.json")) return true;
      return false;
    });
    (fs.readFileSync as any).mockImplementation((p: string) => {
      if (p.includes(".cursor/hooks.json")) return "source";
      if (p.includes(".ai/hooks.json")) return "target";
      return "";
    });

    await formatHandler({ write: true } as any);

    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it("should handle conflicts with --force", async () => {
    (fs.existsSync as any).mockImplementation((p: string) => {
      if (p.includes(".cursor/hooks.json")) return true;
      if (p.includes(".ai/hooks.json")) return true;
      return false;
    });
    (fs.readFileSync as any).mockImplementation((p: string) => {
      if (p.includes(".cursor/hooks.json")) return "source";
      if (p.includes(".ai/hooks.json")) return "target";
      return "";
    });

    await formatHandler({ write: true, force: true } as any);

    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it("should detect Trae configurations", async () => {
    (fs.existsSync as any).mockImplementation((p: string) => {
      if (p.includes(".trae/config.json")) return true;
      return false;
    });

    await formatHandler({} as any);

    expect(spinnerMock.succeed).toHaveBeenCalledWith(expect.stringContaining("names=trae"));
    expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining(".ai/tools/trae/settings.json"));
  });

  it("should detect OpenCode configurations", async () => {
    (fs.existsSync as any).mockImplementation((p: string) => {
      if (p.includes(".opencode/config.json")) return true;
      return false;
    });

    await formatHandler({} as any);

    expect(spinnerMock.succeed).toHaveBeenCalledWith(expect.stringContaining("names=opencode"));
    expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining(".ai/tools/opencode/settings.json"));
  });
});
