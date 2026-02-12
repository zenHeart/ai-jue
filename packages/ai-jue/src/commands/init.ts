import { Arguments, CommandBuilder } from "yargs";
import path from "path";
import fs from "fs";
import readline from "readline";
import { spawnSync } from "child_process";
import { logger } from "../logger";

import { t } from "../i18n";

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

export const command = "init";
export const describe = "";

export const builder: CommandBuilder = (yargs) => yargs;

type InitFlowOptions = {
  promptForAiDir?: boolean;
  ensurePresetInstalled?: boolean;
};

function resolvePresetPackageName(presetName: string): string {
  return presetName.startsWith("jue-preset-")
    ? presetName
    : `jue-preset-${presetName}`;
}

function isPresetInstalled(presetName: string): boolean {
  const pkgName = resolvePresetPackageName(presetName);
  try {
    require.resolve(`${pkgName}/package.json`, { paths: [process.cwd()] });
    return true;
  } catch {
    return false;
  }
}

function detectPackageManager(): "npm" | "pnpm" | "yarn" {
  if (fs.existsSync(path.join(process.cwd(), "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(process.cwd(), "yarn.lock"))) return "yarn";
  return "npm";
}

function installPresetPackage(presetName: string): boolean {
  const pkgName = resolvePresetPackageName(presetName);
  const pm = detectPackageManager();
  const argsByPm: Record<string, string[]> = {
    npm: ["install", "-D", pkgName],
    pnpm: ["add", "-D", pkgName],
    yarn: ["add", "-D", pkgName],
  };

  const args = argsByPm[pm];
  logger.info(
    t("commands.init.installing_preset", {
      packageName: pkgName,
      command: `${pm} ${args.join(" ")}`,
    }),
  );

  const result = spawnSync(pm, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
  return result.status === 0;
}

export async function runInitFlow(options: InitFlowOptions = {}): Promise<void> {
  const promptForAiDir = options.promptForAiDir ?? true;
  const ensurePresetInstalled = options.ensurePresetInstalled ?? true;

  logger.info(t("commands.init.running"));
  const configPath = path.join(process.cwd(), "ai.config.js");
  let selectedPreset = "base";

  let createConfig = true;
  if (fs.existsSync(configPath)) {
    logger.warn(t("commands.init.already_exists"));
    createConfig = false;
  } else {
    const answer = await askQuestion(t("commands.init.ask_create_config"));
    if (answer.toLowerCase() === "n") {
      createConfig = false;
    }
  }

  if (createConfig) {
    const preset = await askQuestion(t("commands.init.ask_preset"));
    selectedPreset = (preset || "base").trim();
    const content = `/** @type {import('ai-jue').Config} */
module.exports = {
  // Primary preset to use
  preset: '${selectedPreset}',

  // Language for generated artifacts (en, zh)
  language: 'en',

  // MCP Servers configuration (Distributed to Cursor, Claude Code, Gemini etc.)
  mcp: {
    servers: {
      // Example: SQLite MCP Server
      // "sqlite": {
      //   command: "npx",
      //   args: ["-y", "@modelcontextprotocol/server-sqlite", "--db", "path/to/db"]
      // }
    }
  },

  // Agents configuration
  agents: {
    // Example: Specialized Agent
    // "test-expert": {
      //   prompt: "You are a specialized agent for writing unit tests.",
      //   skills: ["unit-testing"]
    // }
  }
};\n`;
    fs.writeFileSync(configPath, content);
    logger.success(t("commands.init.created_config"));
  }

  if (ensurePresetInstalled) {
    if (!isPresetInstalled(selectedPreset)) {
      const answer = await askQuestion(
        t("commands.init.ask_install_preset", {
          packageName: resolvePresetPackageName(selectedPreset),
        }),
      );
      if (answer.trim().toLowerCase() !== "n") {
        const ok = installPresetPackage(selectedPreset);
        if (ok) {
          logger.success(
            t("commands.init.installed_preset", {
              packageName: resolvePresetPackageName(selectedPreset),
            }),
          );
        } else {
          logger.warn(
            t("commands.init.install_preset_failed", {
              packageName: resolvePresetPackageName(selectedPreset),
            }),
          );
        }
      } else {
        logger.warn(
          t("commands.init.skip_install_preset", {
            packageName: resolvePresetPackageName(selectedPreset),
          }),
        );
      }
    } else {
      logger.info(
        t("commands.init.preset_already_installed", {
          packageName: resolvePresetPackageName(selectedPreset),
        }),
      );
    }
  }

  if (promptForAiDir) {
    const aiDir = path.join(process.cwd(), ".ai");
    if (!fs.existsSync(aiDir)) {
      const answer = await askQuestion(t("commands.init.ask_create_dir"));
      if (answer.trim().toLowerCase() === "y") {
        fs.mkdirSync(aiDir);
        fs.writeFileSync(path.join(aiDir, "AGENTS.md"), "# Project AI context\n");
        fs.mkdirSync(path.join(aiDir, "rules"));
        fs.mkdirSync(path.join(aiDir, "commands"));
        fs.mkdirSync(path.join(aiDir, "skills"));
        fs.mkdirSync(path.join(aiDir, "agents"));
        fs.mkdirSync(path.join(aiDir, "hooks"));
        fs.mkdirSync(path.join(aiDir, "tools"));
        logger.success(t("commands.init.created_dir"));
      } else {
        logger.info(t("commands.init.skip_create_dir"));
      }
    } else {
      logger.info(t("commands.init.dir_exists"));
    }
  } else {
    logger.info(t("commands.init.skip_create_dir_auto"));
  }
}

export const handler = async (_argv: Arguments) => {
  await runInitFlow();
};
