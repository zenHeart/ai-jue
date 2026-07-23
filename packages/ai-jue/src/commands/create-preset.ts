import { Arguments, CommandBuilder } from "yargs";
import path from "path";
import fs from "fs";
import { logger } from "../logger";
import { t } from "../i18n";

export const command = "create-preset <name>";
export const describe = "";

export const builder: CommandBuilder = (yargs) => {
  return yargs.positional("name", {
    describe: t("commands.create-preset.ask_name"),
    type: "string",
    demandOption: true,
  });
};

export const handler = async (argv: Arguments) => {
  const name = argv.name as string;
  const packageName = `jue-preset-${name}`;
  const targetDir = path.join(process.cwd(), packageName);

  if (fs.existsSync(targetDir)) {
    logger.error(t("commands.init.already_exists")); // Reusing for directory exists
    process.exitCode = 1;
    return;
  }

  logger.info(t("commands.create-preset.running", { name: packageName }));
  fs.mkdirSync(targetDir);
  fs.writeFileSync(
    path.join(targetDir, "AGENTS.md"),
    "# Project AI context\n\nDefine global context and constraints here.\n",
  );
  fs.mkdirSync(path.join(targetDir, "commands"));
  fs.mkdirSync(path.join(targetDir, "rules"));
  fs.mkdirSync(path.join(targetDir, "skills"));
  fs.mkdirSync(path.join(targetDir, "agents"));
  fs.mkdirSync(path.join(targetDir, "hooks"));
  fs.mkdirSync(path.join(targetDir, "tools"));

  const sampleCommandDir = path.join(targetDir, "commands", "example");
  fs.mkdirSync(sampleCommandDir);
  fs.writeFileSync(
    path.join(sampleCommandDir, "prompt.md"),
    `---
description: Example command
---
Run the example command workflow.`,
  );

  const packageJson = {
    name: packageName,
    version: "1.0.0",
    description: `AI-Jue preset for ${name}`,
    files: [
      "AGENTS.md",
      "commands",
      "rules",
      "skills",
      "agents",
      "hooks",
      "mcp.json",
      "tools",
      "README.md",
    ],
    ai: {
      presets: [],
    },
    keywords: ["jue-preset"],
    license: "MIT",
  };

  fs.writeFileSync(
    path.join(targetDir, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );
  fs.writeFileSync(
    path.join(targetDir, "README.md"),
    `# ${packageName}\n\nAI-Jue preset for ${name}.`,
  );

  logger.success(
    t("commands.create-preset.success", { name: packageName, path: targetDir }),
  );
  // Next steps text remains same for now as it contains code commands
  logger.info(
    `\nNext steps:\n  cd ${packageName}\n  # Add capabilities in AGENTS.md, commands/, rules/, skills/, agents/, hooks/, mcp.json, tools/`,
  );
};
