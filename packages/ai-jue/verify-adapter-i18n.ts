import path from "path";
import fs from "fs";
import { generate as generateClaude } from "../ai-jue-adapter-claude/src/index";
import { generate as generateCursor } from "../ai-jue-adapter-cursor/src/index";

const OUTPUT_DIR_ZH = path.join(__dirname, "test-output", "zh");
const OUTPUT_DIR_EN = path.join(__dirname, "test-output", "en");

const MOCK_CONFIG = {
  language: "zh",
  context: {
    global: "Global Context Content",
  },
  prompts: {
    claude: { content: "Claude Specific Content" },
  },
  skills: {
    "test-skill": {
      description: "Test Description",
      content: "Test Skill Content",
    },
  },
  commands: {
    "test-cmd": {
      description: "Test Command",
      prompt: "Test Command Prompt",
    },
  },
  hooks: {
    "pre-commit": "echo test",
  },
};

async function testAdapterI18n() {
  console.log("Starting Adapter I18N Verification...");

  // Setup Directories
  if (fs.existsSync(OUTPUT_DIR_ZH))
    fs.rmSync(OUTPUT_DIR_ZH, { recursive: true });
  if (fs.existsSync(OUTPUT_DIR_EN))
    fs.rmSync(OUTPUT_DIR_EN, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR_ZH, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR_EN, { recursive: true });

  // 1. Test Chinese Output
  console.log("Testing Chinese Output...");
  await generateClaude({ ...MOCK_CONFIG, language: "zh" }, OUTPUT_DIR_ZH);
  await generateCursor({ ...MOCK_CONFIG, language: "zh" }, OUTPUT_DIR_ZH);

  verifyFileContent(path.join(OUTPUT_DIR_ZH, "CLAUDE.md"), [
    "上下文与规则",
    "技能指令 (Skills)",
    "自定义指令",
    "工作流钩子",
  ]);
  verifyFileContent(path.join(OUTPUT_DIR_ZH, ".cursor/rules/agents.mdc"), [
    "Global Context Content",
  ]);

  // 2. Test English Output
  console.log("Testing English Output...");
  await generateClaude({ ...MOCK_CONFIG, language: "en" }, OUTPUT_DIR_EN);
  await generateCursor({ ...MOCK_CONFIG, language: "en" }, OUTPUT_DIR_EN);

  verifyFileContent(path.join(OUTPUT_DIR_EN, "CLAUDE.md"), [
    "Context & Rules",
    "Slash Commands (Skills)",
    "Custom Commands",
    "Workflow Hooks",
  ]);
  verifyFileContent(path.join(OUTPUT_DIR_EN, ".cursor/rules/agents.mdc"), [
    "Global Context Content",
  ]);

  console.log("✅ All Adapter I18N verifications passed!");
}

function verifyFileContent(filePath: string, expectedStrings: string[]) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf-8");
  for (const str of expectedStrings) {
    if (!content.includes(str)) {
      throw new Error(`Expected string "${str}" not found in ${filePath}`);
    }
  }
  console.log(`  ✓ Verified ${path.basename(filePath)}`);
}

testAdapterI18n().catch((err) => {
  console.error("❌ Verification Failed:", err);
  process.exit(1);
});
