import path from "path";
import fs from "fs";
import { generate as generateClaude } from "../ai-jue-adapter-claude/src/index";
import { generate as generateCursor } from "../ai-jue-adapter-cursor/src/index";
import { generate as generateGemini } from "../ai-jue-adapter-gemini/src/index";

async function verifySubAgents() {
  const outputDir = path.join(__dirname, "test-output-subagents");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const config = {
    language: "en",
    skills: {
      "unit-testing": {
        description: "Write unit tests for the current code.",
        prompt: "Focus on boundary conditions and edge cases.",
      },
    },
    subAgents: {
      "test-expert": {
        prompt: "You are a specialized agent for writing unit tests.",
        skills: ["unit-testing"],
      },
    },
  };

  console.log("Generating for Claude...");
  await generateClaude(config, outputDir);
  const claudeContent = fs.readFileSync(
    path.join(outputDir, "CLAUDE.md"),
    "utf8",
  );
  if (
    claudeContent.includes("Sub-Agents") &&
    claudeContent.includes("test-expert")
  ) {
    console.log("✅ Claude: Sub-Agents section found in CLAUDE.md");
  } else {
    console.error("❌ Claude: Sub-Agents section missing or incorrect");
  }

  console.log("Generating for Cursor...");
  await generateCursor(config, outputDir);
  const cursorRulePath = path.join(
    outputDir,
    ".cursor",
    "rules",
    "test-expert.md",
  );
  if (fs.existsSync(cursorRulePath)) {
    const ruleContent = fs.readFileSync(cursorRulePath, "utf8");
    if (
      ruleContent.includes("test-expert") &&
      ruleContent.includes("unit-testing")
    ) {
      console.log("✅ Cursor: Individual rule file generated for test-expert");
    } else {
      console.error("❌ Cursor: Rule file content incorrect");
    }
  } else {
    console.error("❌ Cursor: Rule file missing");
  }

  console.log("Generating for Gemini...");
  await generateGemini(config, outputDir);
  const geminiSettingsPath = path.join(outputDir, ".gemini", "settings.json");
  if (fs.existsSync(geminiSettingsPath)) {
    const settings = JSON.parse(fs.readFileSync(geminiSettingsPath, "utf8"));
    if (settings.subAgents && settings.subAgents["test-expert"]) {
      console.log("✅ Gemini: subAgents found in settings.json");
    } else {
      console.error("❌ Gemini: subAgents missing from settings.json");
    }
  } else {
    console.error("❌ Gemini: settings.json missing");
  }

  console.log("Clearing test output...");
  // fs.rmSync(outputDir, { recursive: true, force: true });
}

verifySubAgents().catch((err) => {
  console.error(err);
  process.exit(1);
});
