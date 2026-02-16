import { Arguments, CommandBuilder } from "yargs";
import path from "path";
import fs from "fs";
import pc from "picocolors";
import ora from "ora";
import { logger } from "../logger";
import { t } from "../i18n";
import { TOOL_PATTERNS } from "./format-rules";

export const command = "format";
export const describe = t("commands.format.describe", {
  defaultValue: "Migrate existing AI tool configs to .ai directory",
});

export const builder: CommandBuilder = (yargs) => {
  return yargs
    .option("write", {
      type: "boolean",
      description: t("commands.format.write_describe", {
        defaultValue: "Execute migration (default: dry-run)",
      }),
      default: false,
    })
    .option("force", {
      type: "boolean",
      description: t("commands.format.force_describe", {
        defaultValue: "Force overwrite existing files",
      }),
      default: false,
    });
};

/**
 * Represents a detected tool configuration
 */
interface DetectedTool {
  tool: string;
  adapter: string;
  files: string[];
}

/**
 * Represents a migration item to be processed
 */
interface MigrationItem {
  source: string;
  target: string;
  type: "agents" | "commands" | "rules" | "skills" | "hooks" | "mcp" | "config";
  status: "pending" | "conflict" | "needs_review" | "migrated";
  conflict?: {
    existingTarget: string;
    resolution: "skip" | "merge" | "overwrite" | "needs_review";
  };
}

/**
 * Migration plan containing all items to migrate
 */
interface MigrationPlan {
  detectedTools: DetectedTool[];
  items: MigrationItem[];
  summary: {
    total: number;
    conflicts: number;
    needsReview: number;
    safeToMigrate: number;
  };
}

/**
 * Detect existing tool configurations in the project
 * @param cwd - Current working directory
 * @returns Array of detected tools
 */
function detectToolConfigurations(cwd: string): DetectedTool[] {
  const detected: DetectedTool[] = [];

  for (const [tool, config] of Object.entries(TOOL_PATTERNS)) {
    const foundFiles: string[] = [];

    for (const pattern of config.files) {
      // Handle glob patterns
      if (pattern.includes("*")) {
        const glob = require("glob");
        const matches = glob.sync(pattern, { cwd, absolute: true });
        foundFiles.push(...matches);
      } else {
        // Handle exact file paths
        const fullPath = path.resolve(cwd, pattern);
        if (fs.existsSync(fullPath)) {
          foundFiles.push(fullPath);
        }
      }
    }

    if (foundFiles.length > 0) {
      detected.push({
        tool,
        adapter: config.adapter,
        files: foundFiles,
      });
    }
  }

  return detected;
}

/**
 * Parse a tool configuration file and extract migration items
 * @param filePath - Path to the configuration file
 * @param tool - Tool name (cursor, gemini, claude, copilot, trae, opencode)
 * @returns Array of migration items
 */
function parseToolConfig(filePath: string, tool: string): MigrationItem[] {
  const items: MigrationItem[] = [];
  const basename = path.basename(filePath);

  // Detect file type and create appropriate migration item
  if (
    basename === "AGENTS.md" ||
    basename === "CLAUDE.md" ||
    basename === "GEMINI.md" ||
    basename.includes("copilot-instructions")
  ) {
    items.push({
      source: filePath,
      target: ".ai/AGENTS.md",
      type: "agents",
      status: "pending",
    });
  } else if (
    basename.endsWith(".mdc") ||
    basename.includes("rules") ||
    (tool === "trae" && filePath.includes("/rules/"))
  ) {
    // Extract rule name from filename
    const ruleName = basename
      .replace(/\.mdc?$/, "")
      .replace(/\.instructions$/, "");
    items.push({
      source: filePath,
      target: `.ai/rules/${ruleName}.md`,
      type: "rules",
      status: "pending",
    });
  } else if (basename.includes("commands") || basename.endsWith(".toml")) {
    const cmdName = basename.replace(/\.toml$/, "").replace(/\.prompt$/, "");
    items.push({
      source: filePath,
      target: `.ai/commands/${cmdName}/prompt.md`,
      type: "commands",
      status: "pending",
    });
  } else if (basename.includes("SKILL")) {
    const skillName = path.basename(path.dirname(filePath));
    items.push({
      source: filePath,
      target: `.ai/skills/${skillName}/SKILL.md`,
      type: "skills",
      status: "pending",
    });
  } else if (
    basename.includes("agents") ||
    (tool === "trae" && filePath.includes("/agents/"))
  ) {
    const agentName = basename.replace(/\.md$/, "");
    items.push({
      source: filePath,
      target: `.ai/agents/${agentName}.md`,
      type: "agents",
      status: "pending",
    });
  } else if (basename === "hooks.json" || (tool === "opencode" && filePath.includes("/plugin/"))) {
    const hookName = tool === "opencode" ? basename.replace(/\.ts$/, "") : "hooks";
    items.push({
      source: filePath,
      target: tool === "opencode" ? `.ai/hooks/${hookName}.ts` : ".ai/hooks.json",
      type: "hooks",
      status: "pending",
    });
  } else if (
    basename === "mcp.json" ||
    basename.includes("copilot-settings") ||
    basename === "config.json"
  ) {
    items.push({
      source: filePath,
      target: `.ai/tools/${tool}/settings.json`,
      type: "config",
      status: "pending",
    });
  }

  return items;
}

/**
 * Check for conflicts with existing .ai directory files
 * @param items - Migration items to check
 * @returns Items with conflict status updated
 */
function detectConflicts(items: MigrationItem[]): MigrationItem[] {
  const cwd = process.cwd();
  return items.map((item) => {
    const targetPath = path.join(cwd, item.target);

    if (fs.existsSync(targetPath)) {
      // Check if it's the same file (symlink or identical content)
      const sourceContent = fs.readFileSync(item.source, "utf8");
      const targetContent = fs.readFileSync(targetPath, "utf8");

      if (sourceContent === targetContent) {
        return { ...item, status: "migrated" };
      }

      return {
        ...item,
        status: "conflict",
        conflict: {
          existingTarget: targetPath,
          resolution: "needs_review",
        },
      };
    }

    // Check for directory conflicts
    const targetDir = path.dirname(targetPath);
    if (fs.existsSync(targetDir)) {
      const stat = fs.statSync(targetDir);
      if (!stat.isDirectory()) {
        return {
          ...item,
          status: "needs_review",
          conflict: {
            existingTarget: targetDir,
            resolution: "needs_review",
          },
        };
      }
    }

    return item;
  });
}

/**
 * Generate a migration plan from detected tools
 * @param detectedTools - Array of detected tools
 * @returns Migration plan
 */
function generateMigrationPlan(detectedTools: DetectedTool[]): MigrationPlan {
  const items: MigrationItem[] = [];

  for (const tool of detectedTools) {
    for (const file of tool.files) {
      const fileItems = parseToolConfig(file, tool.tool);
      items.push(...fileItems);
    }
  }

  // Detect conflicts
  const itemsWithConflicts = detectConflicts(items);

  // Calculate summary
  const summary = {
    total: itemsWithConflicts.length,
    conflicts: itemsWithConflicts.filter((i) => i.status === "conflict").length,
    needsReview: itemsWithConflicts.filter((i) => i.status === "needs_review").length,
    safeToMigrate: itemsWithConflicts.filter((i) => i.status === "pending").length,
  };

  return {
    detectedTools,
    items: itemsWithConflicts,
    summary,
  };
}

/**
 * Print migration plan to console
 * @param plan - Migration plan to print
 */
function printMigrationPlan(plan: MigrationPlan): void {
  logger.info(pc.bold(pc.blue(t("commands.format.plan_header"))));

  // Print detected tools
  logger.info(pc.cyan(t("commands.format.detected_tools_header")));
  for (const tool of plan.detectedTools) {
    logger.info(`  ${pc.green("✓")} ${tool.tool} (${tool.files.length} files)`);
  }

  // Print summary
  logger.info(pc.cyan(t("commands.format.summary_header")));
  logger.info(t("commands.format.summary_total", { total: plan.summary.total }));
  logger.info(
    pc.green(t("commands.format.summary_safe", { count: plan.summary.safeToMigrate }))
  );
  if (plan.summary.conflicts > 0) {
    logger.info(
      pc.yellow(t("commands.format.summary_conflicts", { count: plan.summary.conflicts }))
    );
  }
  if (plan.summary.needsReview > 0) {
    logger.info(
      pc.red(t("commands.format.summary_review", { count: plan.summary.needsReview }))
    );
  }

  // Print detailed items
  logger.info(pc.cyan(t("commands.format.items_header")));

  const groupedByType = plan.items.reduce((acc, item) => {
    acc[item.type] = acc[item.type] || [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, MigrationItem[]>);

  for (const [type, items] of Object.entries(groupedByType)) {
    logger.info(pc.bold(`${type.toUpperCase()}:`));
    for (const item of items) {
      const statusIcon =
        item.status === "pending"
          ? pc.blue("○")
          : item.status === "conflict"
          ? pc.yellow("⚠")
          : item.status === "needs_review"
          ? pc.red("✖")
          : pc.green("✓");

      logger.info(`  ${statusIcon} ${path.basename(item.source)} → ${item.target}`);

      if (item.conflict) {
        logger.info(
          pc.dim(
            `     ${t("commands.format.conflict_label", {
              resolution: item.conflict.resolution,
            })}`
          )
        );
      }
    }
    logger.info("");
  }
}

/**
 * Execute migration plan
 * @param plan - Migration plan to execute
 * @param options - Migration options
 */
async function executeMigration(
  plan: MigrationPlan,
  options: { force: boolean }
): Promise<void> {
  const spinner = ora(t("commands.format.migrating")).start();
  const cwd = process.cwd();

  try {
    // Create .ai directory structure
    const aiDir = path.join(cwd, ".ai");
    if (!fs.existsSync(aiDir)) {
      fs.mkdirSync(aiDir, { recursive: true });
    }

    for (const item of plan.items) {
      // Skip already migrated
      if (item.status === "migrated") continue;

      // Skip conflicts unless force
      if (item.status === "conflict" && !options.force) {
        spinner.warn(t("commands.format.skipped_conflict", { source: item.source }));
        continue;
      }

      // Create target directory
      const targetPath = path.join(cwd, item.target);
      const targetDir = path.dirname(targetPath);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Read source and transform content if needed
      let content = fs.readFileSync(item.source, "utf8");

      // Add migration marker
      const migrationHeader = `<!-- Migrated from ${path.basename(
        item.source
      )} by jue format -->\n\n`;
      if (!content.includes("<!-- Migrated from")) {
        content = migrationHeader + content;
      }

      // Write to target
      fs.writeFileSync(targetPath, content, "utf8");
      spinner.succeed(
        t("commands.format.migrated_item", {
          source: path.basename(item.source),
          target: item.target,
        })
      );
    }

    spinner.succeed(pc.green(t("commands.format.migration_success")));
    logger.info(pc.cyan(t("commands.format.next_steps_header")));
    logger.info(t("commands.format.next_step_review"));
    logger.info(t("commands.format.next_step_config"));
    logger.info(t("commands.format.next_step_apply"));
  } catch (error: any) {
    spinner.fail(pc.red(t("commands.format.migration_failed", { message: error.message })));
    process.exitCode = 1;
  }
}

export const handler = async (argv: Arguments) => {
  const writeMode = Boolean((argv as Arguments<{ write?: boolean }>).write);
  const forceMode = Boolean((argv as Arguments<{ force?: boolean }>).force);

  logger.info(pc.bold(pc.blue(t("commands.format.scanning"))));

  // Detect tool configurations
  const spinner = ora(t("commands.format.detecting")).start();
  const detectedTools = detectToolConfigurations(process.cwd());

  if (detectedTools.length === 0) {
    spinner.warn(pc.yellow(t("commands.format.no_configs")));
    logger.info(pc.dim(t("commands.format.supported_tools")));
    return;
  }

  spinner.succeed(
    pc.green(
      t("commands.format.detected_count", {
        count: detectedTools.length,
        names: detectedTools.map((t) => t.tool).join(", "),
      })
    )
  );

  // Generate migration plan
  const plan = generateMigrationPlan(detectedTools);

  // Print plan
  printMigrationPlan(plan);

  // If dry-run, stop here
  if (!writeMode) {
    logger.info(pc.cyan(t("commands.format.dry_run_hint")));
    return;
  }

  // Check for conflicts
  if (plan.summary.conflicts > 0 && !forceMode) {
    logger.warn(
      pc.yellow(t("commands.format.conflict_warn", { count: plan.summary.conflicts }))
    );
    process.exitCode = 1;
    return;
  }

  // Execute migration
  await executeMigration(plan, { force: forceMode });
};
