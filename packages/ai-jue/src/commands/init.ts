import { Arguments, CommandBuilder } from "yargs";
import path from "path";
import fs from "fs";
import readline from "readline";
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

export async function runInitFlow(): Promise<void> {
  logger.info(t("commands.init.running"));
  const configPath = path.join(process.cwd(), "ai.config.js");

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
    const content = `/** @type {import('ai-jue').Config} */
module.exports = {
  // Primary preset to use
  preset: '${preset || "base"}',

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

  const aiDir = path.join(process.cwd(), ".ai");
  if (!fs.existsSync(aiDir)) {
    const answer = await askQuestion(t("commands.init.ask_create_dir"));
    if (answer.toLowerCase() !== "n") {
      fs.mkdirSync(aiDir);
      fs.writeFileSync(path.join(aiDir, "AGENTS.md"), "# Project AI context\n");
      fs.mkdirSync(path.join(aiDir, "rules"));
      fs.mkdirSync(path.join(aiDir, "commands"));
      fs.mkdirSync(path.join(aiDir, "skills"));
      fs.mkdirSync(path.join(aiDir, "agents"));
      fs.mkdirSync(path.join(aiDir, "hooks"));
      fs.mkdirSync(path.join(aiDir, "tools"));
      logger.success(t("commands.init.created_dir"));
    }
  } else {
    logger.info(t("commands.init.dir_exists"));
  }
}

export const handler = async (_argv: Arguments) => {
  await runInitFlow();
};
